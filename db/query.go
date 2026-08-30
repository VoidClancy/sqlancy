package db

import (
	"database/sql"
	"fmt"
	"sqlite-browser/utils"
	"strings"
	"time"
)

type QueryResult struct {
	Columns       []ColumnInfo `json:"columns"`
	Rows          [][]any      `json:"rows"`
	RowsAffected  int64        `json:"rowsAffected"`
	LastInsertID  int64        `json:"lastInsertId"`
	ExecutionTime float64      `json:"executionTime"`
	IsSelect      bool         `json:"isSelect"`
	Message       string       `json:"message"`
}

func (db *DB) ExecQuery(query string, args ...any) (*QueryResult, error) {
	startTime := time.Now()
	if isRowProducer(query) {
		return db.execSelect(query, args, startTime)
	}
	return db.execMutation(query, args, startTime)
}

func isRowProducer(query string) bool {
	upper := strings.ToUpper(strings.TrimSpace(query))
	return strings.HasPrefix(upper, "SELECT") ||
		strings.HasPrefix(upper, "PRAGMA") ||
		strings.HasPrefix(upper, "EXPLAIN") ||
		strings.HasPrefix(upper, "WITH") ||
		strings.Contains(upper, "RETURNING")
}

func (db *DB) execSelect(query string, args []any, startTime time.Time) (*QueryResult, error) {
	rows, err := db.Conn.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	columns, err := scanColumns(rows)
	if err != nil {
		return nil, err
	}

	rowData, err := scanRows(rows, len(columns))
	if err != nil {
		return nil, err
	}

	elapsed := elapsedMs(startTime)
	return &QueryResult{
		Columns:       columns,
		Rows:          rowData,
		ExecutionTime: elapsed,
		IsSelect:      true,
		Message:       fmt.Sprintf("Returned %d rows in %.2f ms", len(rowData), elapsed),
	}, nil
}

func (db *DB) execMutation(query string, args []any, startTime time.Time) (*QueryResult, error) {
	res, err := db.Conn.Exec(query, args...)
	if err != nil {
		return nil, err
	}

	rowsAffected, _ := res.RowsAffected()
	lastInsertID, _ := res.LastInsertId()
	elapsed := elapsedMs(startTime)

	return &QueryResult{
		RowsAffected:  rowsAffected,
		LastInsertID:  lastInsertID,
		ExecutionTime: elapsed,
		IsSelect:      false,
		Message:       fmt.Sprintf("Query executed successfully in %.2f ms. %d rows affected.", elapsed, rowsAffected),
	}, nil
}

func scanColumns(rows *sql.Rows) ([]ColumnInfo, error) {
	colNames, err := rows.Columns()
	if err != nil {
		return nil, err
	}

	columnTypes, err := rows.ColumnTypes()
	if err != nil {
		return nil, err
	}

	columns := make([]ColumnInfo, len(colNames))
	for i, name := range colNames {
		typeName := ""
		if i < len(columnTypes) {
			typeName = columnTypes[i].DatabaseTypeName()
		}
		columns[i] = ColumnInfo{Name: name, Type: typeName}
	}
	return columns, nil
}

func scanRows(rows *sql.Rows, colCount int) ([][]any, error) {
	scanDest := make([]any, colCount)
	scanValues := make([]any, colCount)
	for i := range scanValues {
		scanDest[i] = &scanValues[i]
	}

	var rowData [][]any
	for rows.Next() {
		if err := rows.Scan(scanDest...); err != nil {
			return nil, err
		}
		row := make([]any, colCount)
		for i := range colCount {
			row[i] = utils.NormalizeValue(scanValues[i])
		}
		rowData = append(rowData, row)
	}

	return rowData, rows.Err()
}

func elapsedMs(start time.Time) float64 {
	return time.Since(start).Seconds() * 1000.0
}
