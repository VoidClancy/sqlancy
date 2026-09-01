package db

import (
	"database/sql"
	"fmt"
	"os"
	"strings"

	_ "modernc.org/sqlite"
)

type DB struct {
	Conn   *sql.DB
	Tables []string
}

type ColumnInfo struct {
	Name string `json:"name"`
	Type string `json:"type"`
}

func NewTestDB() *DB {
	dbConn, err := sql.Open("sqlite", "file::memory:?cache=shared")
	if err != nil {
		panic(err)
	}
	return &DB{
		Conn: dbConn,
	}
}

func (d *DB) OpenDB(path string) error {
	if path != ":memory:" && !strings.HasPrefix(path, "file::memory:") {
		info, err := os.Stat(path)
		if err != nil {
			if os.IsNotExist(err) {
				return fmt.Errorf("database file does not exist at path: %s", path)
			}
			return fmt.Errorf("cannot access database file: %w", err)
		}
		if info.IsDir() {
			return fmt.Errorf("path is a directory, not a database file: %s", path)
		}
	}

	if d.Conn != nil {
		_ = d.Conn.Close()
	}
	conn, err := sql.Open("sqlite", path)
	if err != nil {
		return err
	}
	if err := conn.Ping(); err != nil {
		conn.Close()
		return err
	}
	d.Conn = conn
	tables, err := d.GetTables()
	if err != nil {
		d.Conn.Close()
		d.Conn = nil
		return err
	}
	d.Tables = tables
	return nil
}

func (d *DB) GetTables() ([]string, error) {
	if d == nil || d.Conn == nil {
		return []string{}, nil
	}

	rows, err := d.Conn.Query(`
		SELECT name
		FROM sqlite_master
		WHERE type = 'table'
		  AND name NOT LIKE 'sqlite_%'
		ORDER BY name
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	tables := make([]string, 0)

	for rows.Next() {
		var name string

		if err := rows.Scan(&name); err != nil {
			return nil, err
		}

		tables = append(tables, name)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}
	return tables, nil
}

func (db *DB) Close() error {
	if db == nil || db.Conn == nil {
		return nil
	}
	return db.Conn.Close()
}

func quoteIdent(identifier string) string {
	return `"` + strings.ReplaceAll(identifier, `"`, `""`) + `"`
}
