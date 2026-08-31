import { create } from "zustand";
import {
    selectDbFile,
    openDB,
    getTables,
    addToRecent,
    getRecentDBs,
    RecentDB,
} from "../lib";

interface DbState {
    dbPath: string | null;
    tables: string[];
    recentDBs: RecentDB[];
    loading: boolean;

    // Actions
    openDatabase: (filePath?: string) => Promise<string[] | null>;
    refreshTables: () => Promise<string[]>;
    refreshRecentDBs: () => Promise<RecentDB[]>;
}

export const useDbStore = create<DbState>((set, get) => ({
    dbPath: null,
    tables: [],
    recentDBs: [],
    loading: false,

    refreshTables: async () => {
        try {
            const tbls = await getTables();
            const list = tbls || [];
            set({ tables: list });
            return list;
        } catch (err) {
            console.error("Failed to fetch tables:", err);
            set({ tables: [] });
            return [];
        }
    },

    refreshRecentDBs: async () => {
        try {
            const list = await getRecentDBs();
            const recent = list || [];
            set({ recentDBs: recent });
            return recent;
        } catch (err) {
            console.error("Failed to fetch recent DBs:", err);
            set({ recentDBs: [] });
            return [];
        }
    },

    openDatabase: async (filePath?: string) => {
        set({ loading: true });
        try {
            let targetPath = filePath;
            if (!targetPath) {
                targetPath = await selectDbFile();
            }
            if (!targetPath) {
                set({ loading: false });
                return null;
            }

            await openDB(targetPath);

            const name = targetPath.split(/[\\/]/).pop() ?? targetPath;
            await addToRecent(name, targetPath);
            set({ dbPath: targetPath });
            await get().refreshRecentDBs();
            const tbls = await get().refreshTables();
            set({ loading: false });
            return tbls;
        } catch (err) {
            console.error("Failed to open database:", err);
            set({ loading: false });
            throw err;
        }
    },
}));

// Initialize store data on module load
useDbStore.getState().refreshTables();
useDbStore.getState().refreshRecentDBs();
