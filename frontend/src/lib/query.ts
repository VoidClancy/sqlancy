import { ExecuteQuery } from "../../wailsjs/go/main/App";
import { QueryResult } from "./types";

export const executeQuery = (query: string): Promise<QueryResult> =>
    ExecuteQuery(query);
