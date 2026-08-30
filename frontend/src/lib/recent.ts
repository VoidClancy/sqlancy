import { GetRecentDBs, AddToRecent } from "../../wailsjs/go/main/App";
import { RecentDB } from "./types";

export async function getRecentDBs(): Promise<Array<RecentDB>> {
    return await GetRecentDBs();
}

export async function addToRecent(name: string, path: string): Promise<void> {
    return await AddToRecent(name, path);
}
