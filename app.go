package main

import (
	"context"
	"errors"
	"fmt"
	"sqlite-browser/db"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/runtime"
	_ "modernc.org/sqlite"
)

type App struct {
	ctx       context.Context
	DB        *db.DB
	RecentDBs []db.RecentDB
}

func NewApp() *App {
	recents, _ := db.GetRecent()
	return &App{
		DB:        &db.DB{},
		RecentDBs: recents,
	}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) shutdown(ctx context.Context) {
	_ = ctx
	if a.dbConnected() {
		_ = a.DB.Close()
	}
}

func (a *App) dbConnected() bool {
	return a.DB != nil && a.DB.Conn != nil
}

func (a *App) OpenDB(path string) error {
	return a.DB.OpenDB(path)
}

func (a *App) Close() error {
	if !a.dbConnected() {
		return errors.New("no database opened")
	}

	return a.DB.Close()
}

func (a *App) GetTables() []string {
	if !a.dbConnected() {
		return []string{}
	}

	if a.DB.Tables != nil {
		return a.DB.Tables
	}

	tables, err := a.DB.GetTables()
	if err != nil {
		return []string{}
	}

	a.DB.Tables = tables
	return tables
}

func (a *App) GetTableInfo(tableName string) (*db.TableInfo, error) {
	if !a.dbConnected() {
		return nil, fmt.Errorf("no database opened")
	}
	return a.DB.GetTableInfo(tableName)
}

func (a *App) GetTableRows(tableName string, cursor db.Cursor, limit int) (*db.TableRows, error) {
	if !a.dbConnected() {
		return nil, fmt.Errorf("no database opened")
	}
	return a.DB.GetTableRows(tableName, cursor, limit)
}

func (a *App) ExecuteQuery(query string) (*db.QueryResult, error) {
	if !a.dbConnected() {
		return nil, fmt.Errorf("no database opened")
	}

	result, err := a.DB.ExecQuery(query)
	if err != nil {
		return nil, err
	}

	upper := strings.ToUpper(strings.TrimSpace(query))

	if strings.HasPrefix(upper, "CREATE TABLE") ||
		strings.HasPrefix(upper, "DROP TABLE") ||
		strings.HasPrefix(upper, "ALTER TABLE") {

		tbls, _ := a.DB.GetTables()
		a.DB.Tables = tbls
	}

	return result, nil
}

func (a *App) SelectDbFile() (string, error) {
	selection, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select SQLite Database",
		Filters: []runtime.FileFilter{
			{
				DisplayName: "SQLite Databases (*.db;*.sqlite;*.sqlite3;*.db3)",
				Pattern:     "*.db;*.sqlite;*.sqlite3;*.db3",
			},
			{
				DisplayName: "All Files (*.*)",
				Pattern:     "*.*",
			},
		},
	})
	if err != nil {
		return "", err
	}
	// cancelled -> empty string, no error
	return selection, nil
}

func (a *App) GetRecentDBs() []db.RecentDB {
	if a.RecentDBs == nil {
		return []db.RecentDB{}
	}
	return a.RecentDBs
}

func (a *App) AddToRecent(name, path string) error {
	if err := db.AddToRecent(name, path); err != nil {
		return err
	}
	recents, err := db.GetRecent()
	if err == nil {
		a.RecentDBs = recents
	}
	return nil
}
