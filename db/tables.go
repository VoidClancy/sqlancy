package db

func (db *DB) GetFilteredTableRows(
	tableName string,
	cursor Cursor,
	limit int,
	filter Filter,
) (*TableRows, error) {
	return db.GetTableRows(tableName, cursor, limit, &filter, nil)
}

func (db *DB) GetSortedTableRows(
	tableName string,
	cursor Cursor,
	limit int,
	sort SortBy,
) (*TableRows, error) {
	return db.GetTableRows(tableName, cursor, limit, nil, &sort)
}

func (db *DB) GetFilteredAndSortedTableRows(
	tableName string,
	cursor Cursor,
	limit int,
	filter Filter,
	sort SortBy,
) (*TableRows, error) {
	return db.GetTableRows(tableName, cursor, limit, &filter, &sort)
}
