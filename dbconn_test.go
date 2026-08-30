package main

import (
	"database/sql"
	"path/filepath"
	"sqlite-browser/db"
	"testing"

	_ "modernc.org/sqlite"
)

func createTestDB(t *testing.T) *db.DB {
	dir := t.TempDir()
	dbPath := filepath.Join(dir, "test.db")

	conn, err := sql.Open("sqlite", dbPath)
	if err != nil {
		t.Fatalf("failed to open test db: %v", err)
	}

	db := &db.DB{
		Conn: conn,
	}

	// 1. Table with NO PK (standard ROWID table)
	_, err = db.Conn.Exec(`
		CREATE TABLE logs (
			level TEXT,
			message TEXT
		);

		INSERT INTO logs (level, message) VALUES
			('info', 'msg 1'),
			('warn', 'msg 2'),
			('error', 'msg 3'),
			('info', 'msg 4'),
			('debug', 'msg 5');
	`)
	if err != nil {
		t.Fatalf("failed to setup logs table: %v", err)
	}

	// 2. Table with Single Primary Key
	_, err = db.Conn.Exec(`
		CREATE TABLE users (
			id INTEGER PRIMARY KEY,
			name TEXT
		);

		INSERT INTO users (id, name) VALUES
			(1, 'Alice'),
			(2, 'Bob'),
			(3, 'Charlie'),
			(4, 'David');
	`)
	if err != nil {
		t.Fatalf("failed to setup users table: %v", err)
	}

	// 3. Table with Composite Primary Key
	_, err = db.Conn.Exec(`
		CREATE TABLE order_items (
			order_id INT,
			item_id INT,
			quantity INT,
			PRIMARY KEY (order_id, item_id)
		);

		INSERT INTO order_items (order_id, item_id, quantity) VALUES
			(1, 100, 2),
			(1, 101, 1),
			(2, 100, 5),
			(2, 102, 3),
			(3, 101, 4);
	`)
	if err != nil {
		t.Fatalf("failed to setup order_items table: %v", err)
	}

	// 4. WITHOUT ROWID Table with Composite Primary Key
	_, err = db.Conn.Exec(`
		CREATE TABLE inventory (
			sku TEXT,
			location TEXT,
			stock INT,
			PRIMARY KEY (sku, location)
		) WITHOUT ROWID;

		INSERT INTO inventory (sku, location, stock) VALUES
			('SKU-A', 'LOC-1', 10),
			('SKU-A', 'LOC-2', 20),
			('SKU-B', 'LOC-1', 15);
	`)
	if err != nil {
		t.Fatalf("failed to setup inventory table: %v", err)
	}

	t.Cleanup(func() {
		db.Conn.Close()
	})

	return db
}
func TestTableInfo(t *testing.T) {
	db := createTestDB(t)
	defer db.Close()

	// Logs (No PK)
	info, err := db.GetTableInfo("logs")
	if err != nil {
		t.Fatalf("getTableInfo(logs) failed: %v", err)
	}
	if len(info.PrimaryKey) != 0 {
		t.Errorf("expected logs to have 0 PKs, got %v", info.PrimaryKey)
	}
	if info.WithoutRowID {
		t.Errorf("expected logs to not be WITHOUT ROWID")
	}

	// Order items (Composite PK)
	info, err = db.GetTableInfo("order_items")
	if err != nil {
		t.Fatalf("getTableInfo(order_items) failed: %v", err)
	}
	if len(info.PrimaryKey) != 2 || info.PrimaryKey[0] != "order_id" || info.PrimaryKey[1] != "item_id" {
		t.Errorf("expected order_items PK [order_id item_id], got %v", info.PrimaryKey)
	}

	// Inventory (WITHOUT ROWID)
	info, err = db.GetTableInfo("inventory")
	if err != nil {
		t.Fatalf("getTableInfo(inventory) failed: %v", err)
	}
	if !info.WithoutRowID {
		t.Errorf("expected inventory to be WITHOUT ROWID")
	}
}

func TestNoPKPagination(t *testing.T) {
	db := createTestDB(t)
	defer db.Close()

	// Page 1 (limit 2)
	p1, err := db.GetTableRows("logs", nil, 2)
	if err != nil {
		t.Fatalf("p1 failed: %v", err)
	}
	if len(p1.Rows) != 2 {
		t.Fatalf("expected 2 rows in p1, got %d", len(p1.Rows))
	}
	if !p1.HasMore {
		t.Errorf("expected p1 HasMore true")
	}
	if p1.NextCursor == nil || p1.NextCursor["_rowid_"] == nil {
		t.Fatalf("expected NextCursor with _rowid_ in p1, got %v", p1.NextCursor)
	}

	// Page 2 (limit 2)
	p2, err := db.GetTableRows("logs", p1.NextCursor, 2)
	if err != nil {
		t.Fatalf("p2 failed: %v", err)
	}
	if len(p2.Rows) != 2 {
		t.Fatalf("expected 2 rows in p2, got %d", len(p2.Rows))
	}
	if !p2.HasMore {
		t.Errorf("expected p2 HasMore true")
	}

	// Page 3 (limit 2)
	p3, err := db.GetTableRows("logs", p2.NextCursor, 2)
	if err != nil {
		t.Fatalf("p3 failed: %v", err)
	}
	if len(p3.Rows) != 1 {
		t.Fatalf("expected 1 row in p3, got %d", len(p3.Rows))
	}
	if p3.HasMore {
		t.Errorf("expected p3 HasMore false")
	}
	if p3.NextCursor != nil {
		t.Errorf("expected p3 NextCursor to be nil on last page")
	}
}

func TestCompositePKPagination(t *testing.T) {
	db := createTestDB(t)
	defer db.Close()

	// Page 1 (limit 2) -> (1, 100), (1, 101)
	p1, err := db.GetTableRows("order_items", nil, 2)
	if err != nil {
		t.Fatalf("p1 failed: %v", err)
	}
	if len(p1.Rows) != 2 {
		t.Fatalf("expected 2 rows in p1, got %d", len(p1.Rows))
	}
	if !p1.HasMore {
		t.Errorf("expected p1 HasMore true")
	}
	if p1.NextCursor == nil || p1.NextCursor["order_id"] == nil || p1.NextCursor["item_id"] == nil {
		t.Fatalf("expected NextCursor with order_id & item_id, got %v", p1.NextCursor)
	}

	// Page 2 (limit 2) -> (2, 100), (2, 102)
	p2, err := db.GetTableRows("order_items", p1.NextCursor, 2)
	if err != nil {
		t.Fatalf("p2 failed: %v", err)
	}
	if len(p2.Rows) != 2 {
		t.Fatalf("expected 2 rows in p2, got %d", len(p2.Rows))
	}
	if !p2.HasMore {
		t.Errorf("expected p2 HasMore true")
	}

	// Page 3 (limit 2) -> (3, 101)
	p3, err := db.GetTableRows("order_items", p2.NextCursor, 2)
	if err != nil {
		t.Fatalf("p3 failed: %v", err)
	}
	if len(p3.Rows) != 1 {
		t.Fatalf("expected 1 row in p3, got %d", len(p3.Rows))
	}
	if p3.HasMore {
		t.Errorf("expected p3 HasMore false")
	}
}

func TestWithoutRowIDPagination(t *testing.T) {
	db := createTestDB(t)
	defer db.Close()

	p1, err := db.GetTableRows("inventory", nil, 2)
	if err != nil {
		t.Fatalf("p1 failed: %v", err)
	}
	if len(p1.Rows) != 2 {
		t.Fatalf("expected 2 rows in p1, got %d", len(p1.Rows))
	}
	if !p1.HasMore {
		t.Errorf("expected p1 HasMore true")
	}
	if p1.NextCursor == nil || p1.NextCursor["sku"] == nil || p1.NextCursor["location"] == nil {
		t.Fatalf("expected NextCursor with sku & location, got %v", p1.NextCursor)
	}

	p2, err := db.GetTableRows("inventory", p1.NextCursor, 2)
	if err != nil {
		t.Fatalf("p2 failed: %v", err)
	}
	if len(p2.Rows) != 1 {
		t.Fatalf("expected 1 row in p2, got %d", len(p2.Rows))
	}
	if p2.HasMore {
		t.Errorf("expected p2 HasMore false")
	}
}

func TestExecuteArbitraryQuery(t *testing.T) {
	db := createTestDB(t)
	defer db.Close()

	// 1. SELECT query
	res1, err := db.ExecQuery("SELECT id, name FROM users WHERE id <= 2 ORDER BY id")
	if err != nil {
		t.Fatalf("SELECT failed: %v", err)
	}
	if !res1.IsSelect {
		t.Errorf("expected IsSelect true")
	}
	if len(res1.Columns) != 2 {
		t.Errorf("expected 2 columns, got %d", len(res1.Columns))
	}
	if len(res1.Rows) != 2 {
		t.Errorf("expected 2 rows, got %d", len(res1.Rows))
	}

	// 2. INSERT WITH RETURNING
	res2, err := db.ExecQuery("INSERT INTO users (name) VALUES ('Eve') RETURNING id, name")
	if err != nil {
		t.Fatalf("INSERT RETURNING failed: %v", err)
	}
	if !res2.IsSelect {
		t.Errorf("expected IsSelect true for RETURNING query")
	}
	if len(res2.Rows) != 1 {
		t.Fatalf("expected 1 row returned from RETURNING query, got %d", len(res2.Rows))
	}
	if res2.Rows[0][1] != "Eve" {
		t.Errorf("expected returned name Eve, got %v", res2.Rows[0][1])
	}

	// 3. UPDATE query (Non-Select)
	res3, err := db.ExecQuery("UPDATE users SET name = 'Bobby' WHERE id = 2")
	if err != nil {
		t.Fatalf("UPDATE failed: %v", err)
	}
	if res3.IsSelect {
		t.Errorf("expected IsSelect false for UPDATE query")
	}
	if res3.RowsAffected != 1 {
		t.Errorf("expected 1 row affected, got %d", res3.RowsAffected)
	}
}
