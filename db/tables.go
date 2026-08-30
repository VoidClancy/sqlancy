package db

import (
	"database/sql"
	"fmt"
	"sqlite-browser/utils"
	"strings"
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

func (db *DB) GetTableRows(tableName string, cursor Cursor, limit int) (*TableRows, error) {
	if limit <= 0 {
		limit = 100
	}

	info, err := db.GetTableInfo(tableName)
	if err != nil {
		return nil, err
	}

	if info.WithoutRowID && len(info.PrimaryKey) == 0 {
		return nil, fmt.Errorf("table %q is WITHOUT ROWID but has no primary key", tableName)
	}

	useRowID := len(info.PrimaryKey) == 0

	var (
		selectCols  []string
		orderCols   []string
		whereClause string
		args        []any
	)

	if useRowID {
		selectCols = append(selectCols, "_rowid_ AS __sqlite_rowid__")
		for _, col := range info.Columns {
			selectCols = append(selectCols, quoteIdent(col.Name))
		}
		orderCols = append(orderCols, "_rowid_ ASC")

		if cursor != nil {
			if rowIDVal, ok := cursor["_rowid_"]; ok && rowIDVal != nil {
				whereClause = "WHERE _rowid_ > ?"
				args = append(args, rowIDVal)
			}
		}
	} else {
		for _, col := range info.Columns {
			selectCols = append(selectCols, quoteIdent(col.Name))
		}
		for _, pk := range info.PrimaryKey {
			orderCols = append(orderCols, quoteIdent(pk)+" ASC")
		}

		if cursor != nil {
			var pkIdents []string
			var pkPlaceholders []string
			var pkValues []any
			hasAllPKs := true

			for _, pk := range info.PrimaryKey {
				val, ok := cursor[pk]
				if !ok || val == nil {
					hasAllPKs = false
					break
				}
				pkIdents = append(pkIdents, quoteIdent(pk))
				pkPlaceholders = append(pkPlaceholders, "?")
				pkValues = append(pkValues, val)
			}

			if hasAllPKs && len(pkValues) > 0 {
				if len(pkIdents) == 1 {
					whereClause = fmt.Sprintf("WHERE %s > ?", pkIdents[0])
					args = append(args, pkValues[0])
				} else {
					whereClause = fmt.Sprintf("WHERE (%s) > (%s)",
						strings.Join(pkIdents, ", "),
						strings.Join(pkPlaceholders, ", "))
					args = append(args, pkValues...)
				}
			}
		}
	}

	query := fmt.Sprintf(`
		SELECT %s
		FROM %s
		%s
		ORDER BY %s
		LIMIT ?
	`, strings.Join(selectCols, ", "), quoteIdent(tableName), whereClause, strings.Join(orderCols, ", "))

	args = append(args, limit+1)

	rows, err := db.Conn.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	colNames, err := rows.Columns()
	if err != nil {
		return nil, err
	}

	var userColNames []string
	if useRowID {
		userColNames = colNames[1:]
	} else {
		userColNames = colNames
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

		rowValues := make([]any, len(userColNames))
		rowCursor := make(Cursor)

		if useRowID {
			rowCursor["_rowid_"] = scanValues[0]
			for i := 0; i < len(userColNames); i++ {
				rowValues[i] = utils.NormalizeValue(scanValues[i+1])
			}
		} else {
			for i, colName := range userColNames {
				rowValues[i] = utils.NormalizeValue(scanValues[i])
				for _, pk := range info.PrimaryKey {
					if colName == pk {
						rowCursor[pk] = rowValues[i]
					}
				}
			}
		}

		fetchedRows = append(fetchedRows, rowValues)
		fetchedCursors = append(fetchedCursors, rowCursor)
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
