import { create } from "zustand";
import {
    selectDbFile,
    openDB,
    getTables,
    addToRecent,
    removeFromRecent,
    getRecentDBs,
    RecentDB,
} from "../lib";
import { showToast } from "../components/shared/CustomToast";

interface DbState {
    dbPath: string | null;
    tables: string[];
    recentDBs: RecentDB[];
    loading: boolean;
    error: string | null;

    // Actions
    openDatabase: (filePath?: string) => Promise<string[] | null>;
    removeRecentDB: (filePath: string) => Promise<void>;
    refreshTables: () => Promise<string[]>;
    refreshRecentDBs: () => Promise<RecentDB[]>;
    clearError: () => void;
}

export const useDbStore = create<DbState>((set, get) => ({
    dbPath: null,
    tables: [],
    recentDBs: [],
    loading: false,
    error: null,

    clearError: () => set({ error: null }),

    refreshTables: async () => {
        try {
            const tbls = await getTables();
            const list = tbls || [];
            set({ tables: list });
            return list;
        } catch (err: any) {
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
        } catch (err: any) {
            console.error("Failed to fetch recent DBs:", err);
            set({ recentDBs: [] });
            return [];
        }
    },

    removeRecentDB: async (filePath: string) => {
        try {
            await removeFromRecent(filePath);
            await get().refreshRecentDBs();
            showToast.info(`Removed "${filePath.split(/[\\/]/).pop()}" from recent DBs`);
        } catch (err: any) {
            const msg = err?.message || String(err);
            showToast.error(msg, "Failed to Remove Recent DB");
        }
    },

    openDatabase: async (filePath?: string) => {
        set({ loading: true, error: null });
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
        } catch (err: any) {
            const msg = err?.message || String(err);
            console.error("Failed to open database:", err);
            showToast.error(msg, "Failed to Open Database");
            set({ loading: false, error: msg });
            throw err;
        }
    },
}));

// Initialize store data on module load
useDbStore.getState().refreshTables();
useDbStore.getState().refreshRecentDBs();
