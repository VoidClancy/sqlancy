import { OpenDB, GetTables, SelectDbFile, GetTableInfo, GetTableRows, ExecuteQuery } from "../../../wailsjs/go/main/App"
import { db } from "../../../wailsjs/go/models"

export const selectDbFile = (): Promise<string> => SelectDbFile()

// Returns the directory containing the selected file (empty if cancelled)
export const selectDbDir = async (): Promise<string> => {
  const filePath = await SelectDbFile()
  if (!filePath) return ""
  // Handles both POSIX (/) and Windows (\) separators
  const idxSlash = filePath.lastIndexOf("/")
  const idxBack = filePath.lastIndexOf("\\")
  const idx = Math.max(idxSlash, idxBack)
  return idx > 0 ? filePath.substring(0, idx) : filePath
}

export const openDB = (path: string): Promise<void> => OpenDB(path)

export const getTables = (): Promise<string[]> => GetTables()

export const getTableInfo = (tableName: string): Promise<db.TableInfo> => GetTableInfo(tableName)

export const getTableRows = (
  tableName: string,
  cursor: Record<string, any> | null,
  limit: number
): Promise<db.TableRows> => GetTableRows(tableName, cursor || {}, limit)

export const executeQuery = (query: string): Promise<db.QueryResult> => ExecuteQuery(query)

// Convenience: browse, open, and return tables in one call
export const browseAndOpenDB = async (): Promise<{ path: string; dir: string; tables: string[] }> => {
  const path = await SelectDbFile()
  if (!path) return { path: "", dir: "", tables: [] }
  await OpenDB(path)
  const tables = await GetTables()
  const dir = path.substring(0, Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\")))
  return { path, dir, tables }
}
