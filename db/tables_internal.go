package db

import (
	"database/sql"
	"fmt"
	"strings"

	"github.com/voidclancy/sqlancy/utils"
)

type Cursor map[string]any

type TableInfo struct {
	Name         string       `json:"name"`
	Columns      []ColumnInfo `json:"columns"`
	PrimaryKey   []string     `json:"primaryKey"`
	WithoutRowID bool         `json:"withoutRowID"`
}

type TableRows struct {
	Columns    []ColumnInfo `json:"columns"`
	Rows       [][]any      `json:"rows"`
	NextCursor Cursor       `json:"nextCursor"`
	HasMore    bool         `json:"hasMore"`
}

type Filter struct {
	Column   string `json:"column"`
	Operator string `json:"operator"`
	Value    any    `json:"value"`
}

type SortBy struct {
	Column string `json:"column"`
	Order  string `json:"order"` // "ASC" | "DESC"
}

func (db *DB) GetTableInfo(tableName string) (*TableInfo, error) {
	table := &TableInfo{
		Name: tableName,
	}

	query := fmt.Sprintf(
		`PRAGMA table_info(%s)`,
		quoteIdent(tableName),
	)

	rows, err := db.Conn.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	type primaryKeyColumn struct {
		name string
		pos  int
	}

	var primaryKeys []primaryKeyColumn

	for rows.Next() {
		var (
			cid      int
			name     string
			dataType string
			notNull  int
			defaultV any
			pk       int
		)

		if err := rows.Scan(
			&cid,
			&name,
			&dataType,
			&notNull,
			&defaultV,
			&pk,
		); err != nil {
			return nil, err
		}

		table.Columns = append(table.Columns, ColumnInfo{
			Name: name,
			Type: dataType,
		})

		if pk > 0 {
			primaryKeys = append(primaryKeys, primaryKeyColumn{
				name: name,
				pos:  pk,
			})
		}
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	for i := 1; i <= len(primaryKeys); i++ {
		for _, pk := range primaryKeys {
			if pk.pos == i {
				table.PrimaryKey = append(table.PrimaryKey, pk.name)
				break
			}
		}
	}

	withoutRowID, err := db.isWithoutRowID(tableName)
	if err != nil {
		return nil, err
	}

	table.WithoutRowID = withoutRowID

	return table, nil
}

func (db *DB) isWithoutRowID(tableName string) (bool, error) {

	rows, err := db.Conn.Query(fmt.Sprintf(`PRAGMA table_list(%s)`, quoteIdent(tableName)))
	if err == nil {
		defer rows.Close()
		colNames, colErr := rows.Columns()
		if colErr == nil {
			wrIdx := -1
			for i, name := range colNames {
				if strings.ToLower(name) == "wr" {
					wrIdx = i
					break
				}
			}
			if wrIdx != -1 && rows.Next() {
				vals := make([]any, len(colNames))
				scanArgs := make([]any, len(colNames))
				for i := range vals {
					scanArgs[i] = &vals[i]
				}
				if scanErr := rows.Scan(scanArgs...); scanErr == nil {
					if wrVal, ok := vals[wrIdx].(int64); ok {
						return wrVal == 1, nil
					}
				}
			}
		}
	}

	var definition sql.NullString
	err = db.Conn.QueryRow(`
		SELECT sql
		FROM sqlite_master
		WHERE type = 'table'
		  AND name = ?
	`, tableName).Scan(&definition)

	if err != nil {
		return false, err
	}

	if !definition.Valid {
		return false, nil
	}

	return strings.Contains(
		strings.ToUpper(definition.String),
		"WITHOUT ROWID",
	), nil
}

type tableRowsQuery struct {
	selectCols []string
	orderCols  []string
	where      string
	args       []any
}

func (db *DB) GetTableRows(tableName string, cursor Cursor, limit int, filter *Filter, sort *SortBy) (*TableRows, error) {
	if limit <= 0 {
		limit = 100
	}

	info, err := db.GetTableInfo(tableName)
	if err != nil {
		return nil, err
	}

	query, args, err := buildTableRowsQuery(info, tableName, cursor, limit, filter, sort)
	if err != nil {
		return nil, err
	}

	rows, err := db.Conn.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return scanTableRows(rows, info, limit, sort)
}

func resolveSort(info *TableInfo, sort *SortBy) (string, string, error) {
	if sort == nil || strings.TrimSpace(sort.Column) == "" {
		return "", "ASC", nil
	}

	for _, col := range info.Columns {
		if strings.EqualFold(col.Name, sort.Column) {
			dir := "ASC"
			if strings.EqualFold(sort.Order, "DESC") {
				dir = "DESC"
			}
			return col.Name, dir, nil
		}
	}

	return "", "", fmt.Errorf(
		"sort column %q does not exist in table %q",
		sort.Column,
		info.Name,
	)
}

func buildTableRowsQuery(
	info *TableInfo,
	tableName string,
	cursor Cursor,
	limit int,
	filter *Filter,
	sort *SortBy,
) (string, []any, error) {
	q := tableRowsQuery{}

	sortColumn, sortDir, err := resolveSort(info, sort)
	if err != nil {
		return "", nil, err
	}
	hasSort := sortColumn != ""

	if info.WithoutRowID && len(info.PrimaryKey) == 0 {
		return "", nil, fmt.Errorf(
			"table %q is WITHOUT ROWID but has no primary key",
			tableName,
		)
	}

	useRowID := len(info.PrimaryKey) == 0

	if useRowID {
		buildRowIDQuery(&q, info, cursor, hasSort, sortColumn, sortDir)
	} else {
		buildPrimaryKeyQuery(&q, info, cursor, hasSort, sortColumn, sortDir)
	}

	filterClause, filterArgs, err := buildFilterClause(filter)
	if err != nil {
		return "", nil, err
	}

	q.where = appendWhere(q.where, filterClause)
	q.args = append(q.args, filterArgs...)

	query := fmt.Sprintf(`
		SELECT %s
		FROM %s
		%s
		ORDER BY %s
		LIMIT ?
	`,
		strings.Join(q.selectCols, ", "),
		quoteIdent(tableName),
		q.where,
		strings.Join(q.orderCols, ", "),
	)

	q.args = append(q.args, limit+1)

	return query, q.args, nil
}

func appendWhere(existing string, clause string) string {
	if clause == "" {
		return existing
	}
	if existing == "" {
		return "WHERE " + clause
	}
	return existing + " AND " + clause
}

func buildRowIDQuery(
	q *tableRowsQuery,
	info *TableInfo,
	cursor Cursor,
	hasSort bool,
	sortColumn string,
	sortDir string,
) {
	q.selectCols = append(q.selectCols, "_rowid_ AS __sqlite_rowid__")

	for _, col := range info.Columns {
		q.selectCols = append(q.selectCols, quoteIdent(col.Name))
	}

	if hasSort && !strings.EqualFold(sortColumn, "_rowid_") {
		q.orderCols = append(
			q.orderCols,
			fmt.Sprintf("%s %s", quoteIdent(sortColumn), sortDir),
		)
	}

	q.orderCols = append(q.orderCols, "_rowid_ ASC")

	q.where, q.args = buildRowIDCursor(
		cursor,
		hasSort,
		sortColumn,
		sortDir,
	)
}

func buildRowIDCursor(
	cursor Cursor,
	hasSort bool,
	sortColumn string,
	sortDir string,
) (string, []any) {
	if cursor == nil {
		return "", nil
	}

	rowID, hasRowID := cursor["_rowid_"]
	if !hasRowID || rowID == nil {
		return "", nil
	}

	if !hasSort || strings.EqualFold(sortColumn, "_rowid_") {
		return "WHERE _rowid_ > ?", []any{rowID}
	}

	sortValue, hasSortValue := cursor[sortColumn]
	if !hasSortValue || sortValue == nil {
		return "WHERE _rowid_ > ?", []any{rowID}
	}

	op := ">"
	if sortDir == "DESC" {
		op = "<"
	}

	return fmt.Sprintf(
		"WHERE (%s, _rowid_) %s (?, ?)",
		quoteIdent(sortColumn),
		op,
	), []any{sortValue, rowID}
}

func buildPrimaryKeyQuery(
	q *tableRowsQuery,
	info *TableInfo,
	cursor Cursor,
	hasSort bool,
	sortColumn string,
	sortDir string,
) {
	for _, col := range info.Columns {
		q.selectCols = append(q.selectCols, quoteIdent(col.Name))
	}

	if hasSort {
		q.orderCols = append(
			q.orderCols,
			fmt.Sprintf("%s %s", quoteIdent(sortColumn), sortDir),
		)
	}

	for _, pk := range info.PrimaryKey {
		if !hasSort || !strings.EqualFold(pk, sortColumn) {
			q.orderCols = append(
				q.orderCols,
				quoteIdent(pk)+" ASC",
			)
		}
	}

	q.where, q.args = buildPrimaryKeyCursor(
		info.PrimaryKey,
		cursor,
		hasSort,
		sortColumn,
		sortDir,
	)
}

func buildPrimaryKeyCursor(
	primaryKeys []string,
	cursor Cursor,
	hasSort bool,
	sortColumn string,
	sortDir string,
) (string, []any) {
	if cursor == nil {
		return "", nil
	}

	pkValues, ok := getCursorValues(cursor, primaryKeys)
	if !ok {
		return "", nil
	}

	if !hasSort {
		return buildTupleComparison(quoteIdents(primaryKeys), ">", pkValues)
	}

	sortValue, ok := cursor[sortColumn]
	if !ok || sortValue == nil {
		return "", nil
	}

	op := ">"
	if sortDir == "DESC" {
		op = "<"
	}

	columns := append([]string{quoteIdent(sortColumn)}, quoteIdents(primaryKeys)...)
	values := append([]any{sortValue}, pkValues...)

	return buildTupleComparison(columns, op, values)
}

func getCursorValues(cursor Cursor, columns []string) ([]any, bool) {
	values := make([]any, 0, len(columns))

	for _, column := range columns {
		value, ok := cursor[column]
		if !ok || value == nil {
			return nil, false
		}

		values = append(values, value)
	}

	return values, true
}

func quoteIdents(columns []string) []string {
	result := make([]string, len(columns))

	for i, column := range columns {
		result[i] = quoteIdent(column)
	}

	return result
}

func buildTupleComparison(
	columns []string,
	operator string,
	values []any,
) (string, []any) {
	if len(columns) == 1 {
		return fmt.Sprintf("WHERE %s %s ?", columns[0], operator), values
	}

	placeholders := make([]string, len(values))
	for i := range placeholders {
		placeholders[i] = "?"
	}

	return fmt.Sprintf(
		"WHERE (%s) %s (%s)",
		strings.Join(columns, ", "),
		operator,
		strings.Join(placeholders, ", "),
	), values
}

func scanTableRows(
	rows *sql.Rows,
	info *TableInfo,
	limit int,
	sort *SortBy,
) (*TableRows, error) {
	colNames, err := rows.Columns()
	if err != nil {
		return nil, err
	}

	useRowID := len(info.PrimaryKey) == 0

	userColNames := colNames
	if useRowID {
		userColNames = colNames[1:]
	}

	result := &TableRows{
		Columns: info.Columns,
		Rows:    make([][]any, 0, limit),
	}

	scanDest := make([]any, len(colNames))
	scanValues := make([]any, len(colNames))

	for i := range scanValues {
		scanDest[i] = &scanValues[i]
	}

	var fetchedRows [][]any
	var fetchedCursors []Cursor

	for rows.Next() {
		if err := rows.Scan(scanDest...); err != nil {
			return nil, err
		}

		values := normalizeRow(scanValues, len(userColNames), useRowID)
		cursor := buildRowCursor(
			info,
			userColNames,
			scanValues,
			values,
			useRowID,
			sort,
		)

		fetchedRows = append(fetchedRows, values)
		fetchedCursors = append(fetchedCursors, cursor)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	if len(fetchedRows) > limit {
		result.Rows = fetchedRows[:limit]
		result.NextCursor = fetchedCursors[limit-1]
		result.HasMore = true
	} else {
		result.Rows = fetchedRows
		result.HasMore = false
		result.NextCursor = nil
	}

	return result, nil
}

func normalizeRow(
	scanValues []any,
	columnCount int,
	useRowID bool,
) []any {
	offset := 0
	if useRowID {
		offset = 1
	}

	values := make([]any, columnCount)

	for i := range values {
		values[i] = utils.NormalizeValue(scanValues[i+offset])
	}

	return values
}

func buildRowCursor(
	info *TableInfo,
	columnNames []string,
	scanValues []any,
	rowValues []any,
	useRowID bool,
	sort *SortBy,
) Cursor {
	cursor := make(Cursor)

	if useRowID {
		cursor["_rowid_"] = scanValues[0]
	} else {
		for i, column := range columnNames {
			for _, pk := range info.PrimaryKey {
				if column == pk {
					cursor[pk] = rowValues[i]
				}
			}
		}
	}

	if sort != nil && strings.TrimSpace(sort.Column) != "" {
		for i, column := range columnNames {
			if strings.EqualFold(column, sort.Column) {
				cursor[column] = rowValues[i]
				break
			}
		}
	}

	return cursor
}
func buildFilterClause(f *Filter) (string, []any, error) {
	if f == nil {
		return "", nil, nil
	}
	if f.Column == "" {
		return "", nil, fmt.Errorf("filter column must not be empty")
	}

	col := quoteIdent(f.Column)
	op := strings.ToUpper(f.Operator)

	switch op {
	case "=", "!=", "<>", ">", ">=", "<", "<=":
		return fmt.Sprintf("%s %s ?", col, op), []any{f.Value}, nil

	case "LIKE", "NOT LIKE":
		valStr := fmt.Sprintf("%v", f.Value)
		if !strings.Contains(valStr, "%") {
			valStr = "%" + valStr + "%"
		}
		return fmt.Sprintf("%s %s ?", col, op), []any{valStr}, nil

	case "IS NULL":
		return fmt.Sprintf("%s IS NULL", col), nil, nil

	case "IS NOT NULL":
		return fmt.Sprintf("%s IS NOT NULL", col), nil, nil

	case "IN", "NOT IN":
		var vals []any
		switch v := f.Value.(type) {
		case []any:
			vals = v
		case []string:
			for _, item := range v {
				vals = append(vals, item)
			}
		case string:
			parts := strings.Split(v, ",")
			for _, p := range parts {
				trimmed := strings.TrimSpace(p)
				if trimmed != "" {
					vals = append(vals, trimmed)
				}
			}
		}

		if len(vals) == 0 {
			return "", nil, fmt.Errorf("filter operator %q requires a non-empty list of values", f.Operator)
		}
		placeholders := strings.Repeat("?,", len(vals))
		placeholders = placeholders[:len(placeholders)-1] // trim trailing comma
		return fmt.Sprintf("%s %s (%s)", col, op, placeholders), vals, nil

	default:
		return "", nil, fmt.Errorf("unsupported filter operator %q", f.Operator)
	}
}
