import { db } from "../../wailsjs/go/models";

export type ColumnInfo = db.ColumnInfo;
export type TableInfo = db.TableInfo;
export type TableRows = db.TableRows;
export type QueryResult = db.QueryResult;
export type RecentDB = db.RecentDB;
export type Cursor = Record<string, any>;
export type Filter = db.Filter;
export type SortBy = db.SortBy;
