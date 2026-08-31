import {
    OpenDB,
    GetTables,
    SelectDbFile,
    GetTableInfo,
    GetTableRows,
} from "../../wailsjs/go/main/App";
import { db } from "../../wailsjs/go/models";
import { TableInfo, TableRows } from "./types";

const isWailsAvailable = (): boolean => {
    return (
        typeof window !== "undefined" &&
        Boolean((window as any).go?.main?.App)
    );
};

export const selectDbFile = async (): Promise<string> => {
    if (!isWailsAvailable()) return "";
    return await SelectDbFile();
};

export const selectDbDir = async (): Promise<string> => {
    if (!isWailsAvailable()) return "";
    const filePath = await SelectDbFile();
    if (!filePath) return "";
    const idxSlash = filePath.lastIndexOf("/");
    const idxBack = filePath.lastIndexOf("\\");
    const idx = Math.max(idxSlash, idxBack);
    return idx > 0 ? filePath.substring(0, idx) : filePath;
};

export const openDB = async (path: string): Promise<void> => {
    if (!isWailsAvailable()) {
        throw new Error("Wails desktop runtime is not connected.");
    }
    return await OpenDB(path);
};

export const getTables = async (): Promise<string[]> => {
    if (!isWailsAvailable()) return [];
    return await GetTables();
};

export const getTableInfo = async (tableName: string): Promise<TableInfo> => {
    if (!isWailsAvailable()) {
        return db.TableInfo.createFrom({
            name: tableName,
            columns: [],
            primaryKey: [],
            withoutRowID: false,
        });
    }
    return await GetTableInfo(tableName);
};

export const getTableRows = async (
    tableName: string,
    cursor: Record<string, any> | null,
    limit: number,
): Promise<TableRows> => {
    if (!isWailsAvailable()) {
        return db.TableRows.createFrom({
            columns: [],
            rows: [],
            nextCursor: {},
            hasMore: false,
        });
    }
    return await GetTableRows(tableName, cursor || {}, limit);
};
