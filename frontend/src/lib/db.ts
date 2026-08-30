import {
    OpenDB,
    GetTables,
    SelectDbFile,
    GetTableInfo,
    GetTableRows,
} from "../../wailsjs/go/main/App";
import { TableInfo, TableRows } from "./types";

export const selectDbFile = (): Promise<string> => SelectDbFile();

export const selectDbDir = async (): Promise<string> => {
    const filePath = await SelectDbFile();
    if (!filePath) return "";
    const idxSlash = filePath.lastIndexOf("/");
    const idxBack = filePath.lastIndexOf("\\");
    const idx = Math.max(idxSlash, idxBack);
    return idx > 0 ? filePath.substring(0, idx) : filePath;
};

export const openDB = (path: string): Promise<void> => OpenDB(path);

export const getTables = (): Promise<string[]> => GetTables();

export const getTableInfo = (tableName: string): Promise<TableInfo> =>
    GetTableInfo(tableName);

export const getTableRows = (
    tableName: string,
    cursor: Record<string, any> | null,
    limit: number,
): Promise<TableRows> => GetTableRows(tableName, cursor || {}, limit);
