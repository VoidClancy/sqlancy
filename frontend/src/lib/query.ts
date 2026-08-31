import { ExecuteQuery } from "../../wailsjs/go/main/App";
import { QueryResult } from "./types";

export const executeQuery = async (query: string): Promise<QueryResult> => {
    if (
        typeof window === "undefined" ||
        !(window as any).go?.main?.App?.ExecuteQuery
    ) {
        throw new Error(
            "Wails desktop runtime is not connected (running in web browser mode). Open the desktop application window to execute SQL queries.",
        );
    }
    return await ExecuteQuery(query);
};
