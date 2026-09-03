package db

import (
	"testing"
)

func testDB(t *testing.T) *DB {
	t.Helper()
	d := NewTestDB()
	t.Cleanup(func() { d.Close() })

	mustExec(t, d,
		// no PK → rowid fallback
		`CREATE TABLE logs (level TEXT, message TEXT)`,
		`INSERT INTO logs VALUES ('info','a'), ('warn','b'), ('error','c'), ('info','d'), ('debug','e')`,

		// single INTEGER PRIMARY KEY
		`CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT)`,
		`INSERT INTO users VALUES (1,'Alice','a@x.com'), (2,'Bob',NULL), (3,'Charlie','c@x.com'), (4,'David','d@x.com')`,

		// composite PK
		`CREATE TABLE order_items (order_id INT, item_id INT, qty INT, PRIMARY KEY (order_id, item_id))`,
		`INSERT INTO order_items VALUES (1,100,2),(1,101,1),(2,100,5),(2,102,3),(3,101,4)`,

		// WITHOUT ROWID + composite PK
		`CREATE TABLE inventory (sku TEXT, loc TEXT, stock INT, PRIMARY KEY (sku, loc)) WITHOUT ROWID`,
		`INSERT INTO inventory VALUES ('A','L1',10),('A','L2',20),('B','L1',15)`,

		// empty table
		`CREATE TABLE empty_tbl (id INTEGER PRIMARY KEY, val TEXT)`,

		// single-row table (boundary)
		`CREATE TABLE solo (id INTEGER PRIMARY KEY, data TEXT)`,
		`INSERT INTO solo VALUES (1, 'only')`,

		// table with special column names
		`CREATE TABLE "weird cols" ("select" TEXT, "from" TEXT, "order" INT)`,
		`INSERT INTO "weird cols" VALUES ('x','y',1),('a','b',2)`,

		// table with NULLs and mixed types
		`CREATE TABLE mixed (id INTEGER PRIMARY KEY, int_col INT, real_col REAL, text_col TEXT, blob_col BLOB)`,
		`INSERT INTO mixed VALUES (1, 42, 3.14, 'hello', X'DEADBEEF')`,
		`INSERT INTO mixed VALUES (2, NULL, NULL, NULL, NULL)`,
		`INSERT INTO mixed VALUES (3, 0, 0.0, '', X'')`,
	)
	return d
}

func mustExec(t *testing.T, d *DB, stmts ...string) {
	t.Helper()
	for _, s := range stmts {
		if _, err := d.Conn.Exec(s); err != nil {
			t.Fatalf("exec %q: %v", s[:min(len(s), 60)], err)
		}
	}
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// --- GetTables ---

func TestGetTables(t *testing.T) {
	d := testDB(t)

	tables, err := d.GetTables()
	if err != nil {
		t.Fatal(err)
	}
	if len(tables) == 0 {
		t.Fatal("expected tables, got none")
	}

	want := map[string]bool{
		"logs": true, "users": true, "order_items": true,
		"inventory": true, "empty_tbl": true, "solo": true,
		"weird cols": true, "mixed": true,
	}
	for _, name := range tables {
		delete(want, name)
	}
	if len(want) > 0 {
		t.Errorf("missing tables: %v", want)
	}
}

func TestGetTablesNilDB(t *testing.T) {
	var d *DB
	tables, err := d.GetTables()
	if err != nil {
		t.Fatal(err)
	}
	if len(tables) != 0 {
		t.Errorf("expected empty, got %v", tables)
	}
}

// --- GetTableInfo ---

func TestTableInfoNoPK(t *testing.T) {
	d := testDB(t)

	info, err := d.GetTableInfo("logs")
	if err != nil {
		t.Fatal(err)
	}
	if len(info.PrimaryKey) != 0 {
		t.Errorf("expected 0 PKs, got %v", info.PrimaryKey)
	}
	if info.WithoutRowID {
		t.Error("logs should not be WITHOUT ROWID")
	}
	if len(info.Columns) != 2 {
		t.Errorf("expected 2 columns, got %d", len(info.Columns))
	}
}

func TestTableInfoSinglePK(t *testing.T) {
	d := testDB(t)

	info, err := d.GetTableInfo("users")
	if err != nil {
		t.Fatal(err)
	}
	if len(info.PrimaryKey) != 1 || info.PrimaryKey[0] != "id" {
		t.Errorf("expected PK [id], got %v", info.PrimaryKey)
	}
}

func TestTableInfoCompositePK(t *testing.T) {
	d := testDB(t)

	info, err := d.GetTableInfo("order_items")
	if err != nil {
		t.Fatal(err)
	}
	if len(info.PrimaryKey) != 2 || info.PrimaryKey[0] != "order_id" || info.PrimaryKey[1] != "item_id" {
		t.Errorf("expected PK [order_id, item_id], got %v", info.PrimaryKey)
	}
}

func TestTableInfoWithoutRowID(t *testing.T) {
	d := testDB(t)

	info, err := d.GetTableInfo("inventory")
	if err != nil {
		t.Fatal(err)
	}
	if !info.WithoutRowID {
		t.Error("inventory should be WITHOUT ROWID")
	}
	if len(info.PrimaryKey) != 2 {
		t.Errorf("expected 2 PKs, got %v", info.PrimaryKey)
	}
}

func TestTableInfoColumnTypes(t *testing.T) {
	d := testDB(t)

	info, err := d.GetTableInfo("mixed")
	if err != nil {
		t.Fatal(err)
	}
	wantTypes := map[string]string{
		"id": "INTEGER", "int_col": "INT", "real_col": "REAL",
		"text_col": "TEXT", "blob_col": "BLOB",
	}
	for _, col := range info.Columns {
		if wantTypes[col.Name] != col.Type {
			t.Errorf("column %q: want type %q, got %q", col.Name, wantTypes[col.Name], col.Type)
		}
	}
}

func TestTableInfoNonexistentTable(t *testing.T) {
	d := testDB(t)

	_, err := d.GetTableInfo("no_such_table")
	if err == nil {
		t.Error("expected error for nonexistent table")
	}
}

func TestTableInfoSpecialColumnNames(t *testing.T) {
	d := testDB(t)

	info, err := d.GetTableInfo("weird cols")
	if err != nil {
		t.Fatal(err)
	}
	names := make([]string, len(info.Columns))
	for i, c := range info.Columns {
		names[i] = c.Name
	}
	if len(names) != 3 || names[0] != "select" || names[1] != "from" || names[2] != "order" {
		t.Errorf("expected [select from order], got %v", names)
	}
}

// --- Pagination: No PK (rowid) ---

func TestPaginationNoPK(t *testing.T) {
	d := testDB(t)

	var total int
	var cursor Cursor

	for page := 0; ; page++ {
		res, err := d.GetTableRows("logs", cursor, 2, nil, nil)
		if err != nil {
			t.Fatalf("page %d: %v", page, err)
		}
		total += len(res.Rows)

		// _rowid_ column must NOT leak into user-visible columns
		for _, col := range res.Columns {
			if col.Name == "__sqlite_rowid__" || col.Name == "_rowid_" {
				t.Errorf("internal rowid column %q leaked to output", col.Name)
			}
		}

		if !res.HasMore {
			if res.NextCursor != nil {
				t.Error("NextCursor should be nil on last page")
			}
			break
		}
		if res.NextCursor == nil || res.NextCursor["_rowid_"] == nil {
			t.Fatalf("page %d: missing _rowid_ in cursor", page)
		}
		cursor = res.NextCursor
		if page > 10 {
			t.Fatal("pagination loop exceeded safety limit")
		}
	}

	if total != 5 {
		t.Errorf("expected 5 total rows, got %d", total)
	}
}

// --- Pagination: Single PK ---

func TestPaginationSinglePK(t *testing.T) {
	d := testDB(t)

	var all [][]any
	var cursor Cursor

	for page := 0; ; page++ {
		res, err := d.GetTableRows("users", cursor, 2, nil, nil)
		if err != nil {
			t.Fatalf("page %d: %v", page, err)
		}
		all = append(all, res.Rows...)
		if !res.HasMore {
			break
		}
		cursor = res.NextCursor
		if page > 10 {
			t.Fatal("infinite loop")
		}
	}

	if len(all) != 4 {
		t.Errorf("expected 4 users, got %d", len(all))
	}
}

// --- Pagination: Composite PK ---

func TestPaginationCompositePK(t *testing.T) {
	d := testDB(t)

	var total int
	var cursor Cursor

	for page := 0; ; page++ {
		res, err := d.GetTableRows("order_items", cursor, 2, nil, nil)
		if err != nil {
			t.Fatalf("page %d: %v", page, err)
		}
		total += len(res.Rows)

		if res.HasMore {
			if res.NextCursor["order_id"] == nil || res.NextCursor["item_id"] == nil {
				t.Fatalf("page %d: composite cursor missing keys: %v", page, res.NextCursor)
			}
		}
		if !res.HasMore {
			break
		}
		cursor = res.NextCursor
		if page > 10 {
			t.Fatal("infinite loop")
		}
	}

	if total != 5 {
		t.Errorf("expected 5 order_items, got %d", total)
	}
}

// --- Pagination: WITHOUT ROWID ---

func TestPaginationWithoutRowID(t *testing.T) {
	d := testDB(t)

	p1, err := d.GetTableRows("inventory", nil, 2, nil, nil)
	if err != nil {
		t.Fatal(err)
	}
	if len(p1.Rows) != 2 || !p1.HasMore {
		t.Fatalf("p1: got %d rows, hasMore=%v", len(p1.Rows), p1.HasMore)
	}

	p2, err := d.GetTableRows("inventory", p1.NextCursor, 2, nil, nil)
	if err != nil {
		t.Fatal(err)
	}
	if len(p2.Rows) != 1 || p2.HasMore {
		t.Fatalf("p2: got %d rows, hasMore=%v", len(p2.Rows), p2.HasMore)
	}
}

// --- Pagination: Edge cases ---

func TestPaginationEmptyTable(t *testing.T) {
	d := testDB(t)

	res, err := d.GetTableRows("empty_tbl", nil, 50, nil, nil)
	if err != nil {
		t.Fatal(err)
	}
	if len(res.Rows) != 0 {
		t.Errorf("expected 0 rows, got %d", len(res.Rows))
	}
	if res.HasMore {
		t.Error("empty table should have HasMore=false")
	}
	if res.NextCursor != nil {
		t.Error("empty table should have nil cursor")
	}
}

func TestPaginationSingleRow(t *testing.T) {
	d := testDB(t)

	res, err := d.GetTableRows("solo", nil, 10, nil, nil)
	if err != nil {
		t.Fatal(err)
	}
	if len(res.Rows) != 1 {
		t.Errorf("expected 1 row, got %d", len(res.Rows))
	}
	if res.HasMore {
		t.Error("single row should not have more")
	}
}

func TestPaginationLimitExactMatch(t *testing.T) {
	d := testDB(t)

	// 5 rows with limit=5 → no HasMore
	res, err := d.GetTableRows("logs", nil, 5, nil, nil)
	if err != nil {
		t.Fatal(err)
	}
	if len(res.Rows) != 5 {
		t.Errorf("expected 5, got %d", len(res.Rows))
	}
	if res.HasMore {
		t.Error("exact match should not signal more")
	}
}

func TestPaginationDefaultLimit(t *testing.T) {
	d := testDB(t)

	// limit <= 0 should default to 100
	res, err := d.GetTableRows("logs", nil, 0, nil, nil)
	if err != nil {
		t.Fatal(err)
	}
	if len(res.Rows) != 5 {
		t.Errorf("expected all 5 rows with default limit, got %d", len(res.Rows))
	}
}

func TestPaginationNilCursorIgnored(t *testing.T) {
	d := testDB(t)

	// nil cursor and cursor with nil value should both start from beginning
	r1, err := d.GetTableRows("users", nil, 10, nil, nil)
	if err != nil {
		t.Fatal(err)
	}
	r2, err := d.GetTableRows("users", Cursor{"id": nil}, 10, nil, nil)
	if err != nil {
		t.Fatal(err)
	}
	if len(r1.Rows) != len(r2.Rows) {
		t.Errorf("nil cursor vs nil-value cursor produced different row counts: %d vs %d", len(r1.Rows), len(r2.Rows))
	}
}

func TestPaginationSpecialColumnNames(t *testing.T) {
	d := testDB(t)

	// table with reserved-word columns still paginates with rowid fallback
	res, err := d.GetTableRows("weird cols", nil, 10, nil, nil)
	if err != nil {
		t.Fatal(err)
	}
	if len(res.Rows) != 2 {
		t.Errorf("expected 2 rows, got %d", len(res.Rows))
	}
}

// --- NULLs and mixed types ---

func TestPaginationNullValues(t *testing.T) {
	d := testDB(t)

	res, err := d.GetTableRows("mixed", nil, 10, nil, nil)
	if err != nil {
		t.Fatal(err)
	}
	if len(res.Rows) != 3 {
		t.Fatalf("expected 3 rows, got %d", len(res.Rows))
	}

	// row 2 (id=2) should have NULLs for int_col, real_col, text_col, blob_col
	row2 := res.Rows[1]
	for i := 1; i < len(row2); i++ {
		if row2[i] != nil {
			t.Errorf("row2 col %d: expected nil, got %v (%T)", i, row2[i], row2[i])
		}
	}

	// row 1 (id=1) blob_col should be normalized (not raw []byte)
	row1 := res.Rows[0]
	blobVal := row1[4]
	if _, ok := blobVal.([]byte); ok {
		t.Error("blob should have been normalized, still raw []byte")
	}
}

// --- ExecQuery: SELECT ---

func TestExecQuerySelect(t *testing.T) {
	d := testDB(t)

	res, err := d.ExecQuery("SELECT id, name FROM users WHERE id <= 2 ORDER BY id")
	if err != nil {
		t.Fatal(err)
	}
	if !res.IsSelect {
		t.Error("expected IsSelect=true")
	}
	if len(res.Columns) != 2 {
		t.Errorf("expected 2 columns, got %d", len(res.Columns))
	}
	if len(res.Rows) != 2 {
		t.Errorf("expected 2 rows, got %d", len(res.Rows))
	}
	if res.ExecutionTime <= 0 {
		t.Error("execution time should be positive")
	}
}

func TestExecQuerySelectEmpty(t *testing.T) {
	d := testDB(t)

	res, err := d.ExecQuery("SELECT * FROM users WHERE 1=0")
	if err != nil {
		t.Fatal(err)
	}
	if !res.IsSelect {
		t.Error("expected IsSelect=true even with 0 rows")
	}
	if len(res.Rows) != 0 {
		t.Errorf("expected 0 rows, got %d", len(res.Rows))
	}
	if len(res.Columns) == 0 {
		t.Error("columns should still be present even with 0 rows")
	}
}

// --- ExecQuery: INSERT / UPDATE / DELETE ---

func TestExecQueryInsert(t *testing.T) {
	d := testDB(t)

	res, err := d.ExecQuery("INSERT INTO users (name, email) VALUES ('Eve', 'e@x.com')")
	if err != nil {
		t.Fatal(err)
	}
	if res.IsSelect {
		t.Error("INSERT should not be IsSelect")
	}
	if res.RowsAffected != 1 {
		t.Errorf("expected 1 row affected, got %d", res.RowsAffected)
	}
	if res.LastInsertID <= 0 {
		t.Errorf("expected positive LastInsertID, got %d", res.LastInsertID)
	}
}

func TestExecQueryUpdate(t *testing.T) {
	d := testDB(t)

	res, err := d.ExecQuery("UPDATE users SET name = 'Bobby' WHERE id = 2")
	if err != nil {
		t.Fatal(err)
	}
	if res.IsSelect {
		t.Error("UPDATE should not be IsSelect")
	}
	if res.RowsAffected != 1 {
		t.Errorf("expected 1 row affected, got %d", res.RowsAffected)
	}
}

func TestExecQueryDelete(t *testing.T) {
	d := testDB(t)

	res, err := d.ExecQuery("DELETE FROM users WHERE id = 4")
	if err != nil {
		t.Fatal(err)
	}
	if res.RowsAffected != 1 {
		t.Errorf("expected 1 row affected, got %d", res.RowsAffected)
	}
}

func TestExecQueryDeleteNothing(t *testing.T) {
	d := testDB(t)

	res, err := d.ExecQuery("DELETE FROM users WHERE id = 9999")
	if err != nil {
		t.Fatal(err)
	}
	if res.RowsAffected != 0 {
		t.Errorf("expected 0 rows affected, got %d", res.RowsAffected)
	}
}

// --- ExecQuery: RETURNING ---

func TestExecQueryInsertReturning(t *testing.T) {
	d := testDB(t)

	res, err := d.ExecQuery("INSERT INTO users (name) VALUES ('Zara') RETURNING id, name")
	if err != nil {
		t.Fatal(err)
	}
	if !res.IsSelect {
		t.Error("RETURNING should be treated as row-producing")
	}
	if len(res.Rows) != 1 {
		t.Fatalf("expected 1 returned row, got %d", len(res.Rows))
	}
	if res.Rows[0][1] != "Zara" {
		t.Errorf("expected name Zara, got %v", res.Rows[0][1])
	}
}

func TestExecQueryUpdateReturning(t *testing.T) {
	d := testDB(t)

	res, err := d.ExecQuery("UPDATE users SET email = 'new@x.com' WHERE id = 1 RETURNING id, email")
	if err != nil {
		t.Fatal(err)
	}
	if !res.IsSelect {
		t.Error("RETURNING should be row-producing")
	}
	if len(res.Rows) != 1 {
		t.Fatalf("expected 1 row, got %d", len(res.Rows))
	}
}

func TestExecQueryDeleteReturning(t *testing.T) {
	d := testDB(t)

	res, err := d.ExecQuery("DELETE FROM users WHERE id = 3 RETURNING id, name")
	if err != nil {
		t.Fatal(err)
	}
	if !res.IsSelect {
		t.Error("RETURNING should be row-producing")
	}
	if len(res.Rows) != 1 {
		t.Fatalf("expected 1 row, got %d", len(res.Rows))
	}
	if res.Rows[0][1] != "Charlie" {
		t.Errorf("expected deleted name Charlie, got %v", res.Rows[0][1])
	}
}

// --- ExecQuery: PRAGMA / EXPLAIN / WITH ---

func TestExecQueryPragma(t *testing.T) {
	d := testDB(t)

	res, err := d.ExecQuery("PRAGMA table_info('users')")
	if err != nil {
		t.Fatal(err)
	}
	if !res.IsSelect {
		t.Error("PRAGMA should be treated as row-producing")
	}
	if len(res.Rows) == 0 {
		t.Error("PRAGMA table_info should return rows")
	}
}

func TestExecQueryExplain(t *testing.T) {
	d := testDB(t)

	res, err := d.ExecQuery("EXPLAIN QUERY PLAN SELECT * FROM users")
	if err != nil {
		t.Fatal(err)
	}
	if !res.IsSelect {
		t.Error("EXPLAIN should be row-producing")
	}
}

func TestExecQueryWithCTE(t *testing.T) {
	d := testDB(t)

	res, err := d.ExecQuery("WITH cte AS (SELECT id, name FROM users) SELECT * FROM cte WHERE id = 1")
	if err != nil {
		t.Fatal(err)
	}
	if !res.IsSelect {
		t.Error("WITH/CTE should be row-producing")
	}
	if len(res.Rows) != 1 {
		t.Errorf("expected 1 row, got %d", len(res.Rows))
	}
}

// --- ExecQuery: DDL ---

func TestExecQueryCreateAndDrop(t *testing.T) {
	d := testDB(t)

	res, err := d.ExecQuery("CREATE TABLE tmp_test (id INT)")
	if err != nil {
		t.Fatal(err)
	}
	if res.IsSelect {
		t.Error("CREATE TABLE should not be IsSelect")
	}

	tables, _ := d.GetTables()
	found := false
	for _, tbl := range tables {
		if tbl == "tmp_test" {
			found = true
		}
	}
	if !found {
		t.Error("tmp_test should exist after CREATE")
	}

	_, err = d.ExecQuery("DROP TABLE tmp_test")
	if err != nil {
		t.Fatal(err)
	}

	tables, _ = d.GetTables()
	for _, tbl := range tables {
		if tbl == "tmp_test" {
			t.Error("tmp_test should not exist after DROP")
		}
	}
}

// --- ExecQuery: Error cases ---

func TestExecQuerySyntaxError(t *testing.T) {
	d := testDB(t)

	_, err := d.ExecQuery("SELECTT * FROMM users")
	if err == nil {
		t.Error("expected error for invalid SQL")
	}
}

func TestExecQueryNonexistentTable(t *testing.T) {
	d := testDB(t)

	_, err := d.ExecQuery("SELECT * FROM ghost_table")
	if err == nil {
		t.Error("expected error for nonexistent table")
	}
}

func TestExecQueryConstraintViolation(t *testing.T) {
	d := testDB(t)

	_, err := d.ExecQuery("INSERT INTO users (id, name) VALUES (1, 'Duplicate')")
	if err == nil {
		t.Error("expected error for PK constraint violation")
	}
}

// --- ExecQuery: Whitespace and case insensitivity ---

func TestExecQueryLeadingWhitespace(t *testing.T) {
	d := testDB(t)

	res, err := d.ExecQuery("   \n\t  SELECT id FROM users LIMIT 1")
	if err != nil {
		t.Fatal(err)
	}
	if !res.IsSelect {
		t.Error("should detect SELECT despite leading whitespace")
	}
}

func TestExecQueryLowercase(t *testing.T) {
	d := testDB(t)

	res, err := d.ExecQuery("select id from users limit 1")
	if err != nil {
		t.Fatal(err)
	}
	if !res.IsSelect {
		t.Error("should detect lowercase select")
	}
}

// --- OpenDB ---

func TestOpenDBInvalidPath(t *testing.T) {
	d := &DB{}
	err := d.OpenDB("/nonexistent/path/to/db.sqlite")
	if err == nil {
		t.Error("expected error for invalid path")
	}
}

// --- Sorting Tests ---

func TestGetSortedTableRowsASC(t *testing.T) {
	d := testDB(t)

	res, err := d.GetSortedTableRows("users", nil, 10, SortBy{Column: "name", Order: "ASC"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(res.Rows) != 4 {
		t.Fatalf("expected 4 rows, got %d", len(res.Rows))
	}

	// Names should be: Alice, Bob, Charlie, David
	firstRowName := res.Rows[0][1]
	if firstRowName != "Alice" {
		t.Errorf("expected first row name 'Alice', got %v", firstRowName)
	}

	lastRowName := res.Rows[3][1]
	if lastRowName != "David" {
		t.Errorf("expected last row name 'David', got %v", lastRowName)
	}
}

func TestGetSortedTableRowsDESC(t *testing.T) {
	d := testDB(t)

	res, err := d.GetSortedTableRows("users", nil, 10, SortBy{Column: "name", Order: "DESC"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if len(res.Rows) != 4 {
		t.Fatalf("expected 4 rows, got %d", len(res.Rows))
	}

	// Names should be: David, Charlie, Bob, Alice
	firstRowName := res.Rows[0][1]
	if firstRowName != "David" {
		t.Errorf("expected first row name 'David', got %v", firstRowName)
	}
}

func TestGetSortedTableRowsInvalidColumn(t *testing.T) {
	d := testDB(t)

	_, err := d.GetSortedTableRows("users", nil, 10, SortBy{Column: "nonexistent_col", Order: "ASC"})
	if err == nil {
		t.Error("expected error for invalid sort column")
	}
}

func TestGetFilteredAndSortedTableRows(t *testing.T) {
	d := testDB(t)

	filter := Filter{Column: "level", Operator: "=", Value: "info"}
	sort := SortBy{Column: "message", Order: "DESC"}

	res, err := d.GetFilteredAndSortedTableRows("logs", nil, 10, filter, sort)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// logs with level='info' are message='a' and message='d'
	if len(res.Rows) != 2 {
		t.Fatalf("expected 2 info logs, got %d", len(res.Rows))
	}

	// Descending message order: 'd' first, 'a' second
	// Columns returned to user: col 0 is level, col 1 is message
	firstMsg := res.Rows[0][1]
	if firstMsg != "d" {
		t.Errorf("expected first filtered log message 'd', got %v", firstMsg)
	}
}
