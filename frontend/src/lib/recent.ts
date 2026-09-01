import {
    GetRecentDBs,
    AddToRecent,
    RemoveFromRecent,
} from "../../wailsjs/go/main/App";
import { RecentDB } from "./types";

const isWailsAvailable = (): boolean => {
    return (
        typeof window !== "undefined" &&
        Boolean((window as any).go?.main?.App)
    );
};

export async function getRecentDBs(): Promise<Array<RecentDB>> {
    if (!isWailsAvailable()) return [];
    return await GetRecentDBs();
}

export async function addToRecent(name: string, path: string): Promise<void> {
    if (!isWailsAvailable()) return;
    return await AddToRecent(name, path);
}

export async function removeFromRecent(path: string): Promise<void> {
    if (!isWailsAvailable()) return;
    return await RemoveFromRecent(path);
}
