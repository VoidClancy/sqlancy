import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
} from "react";
import {
    selectDbFile,
    openDB,
    getTables,
    addToRecent,
    getRecentDBs,
    RecentDB,
} from "../lib";

type DbContextType = {
    dbPath: string | null;
    tables: string[];
    recentDBs: RecentDB[];
    loading: boolean;
    openDatabase: (filePath?: string) => Promise<string[] | null>;
    refreshTables: () => Promise<string[]>;
    refreshRecentDBs: () => Promise<RecentDB[]>;
};

const DbContext = createContext<DbContextType | null>(null);

export const useDb = (): DbContextType => {
    const ctx = useContext(DbContext);
    if (!ctx) {
        throw new Error("useDb must be used within a DbProvider");
    }
    return ctx;
};

export const DbProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [dbPath, setDbPath] = useState<string | null>(null);
    const [tables, setTables] = useState<string[]>([]);
    const [recentDBs, setRecentDBs] = useState<RecentDB[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const refreshTables = useCallback(async (): Promise<string[]> => {
        try {
            const tbls = await getTables();
            const list = tbls || [];
            setTables(list);
            return list;
        } catch (err) {
            console.error("Failed to fetch tables:", err);
            setTables([]);
            return [];
        }
    }, []);

    const refreshRecentDBs = useCallback(async (): Promise<RecentDB[]> => {
        try {
            const list = await getRecentDBs();
            const recent = list || [];
            setRecentDBs(recent);
            return recent;
        } catch (err) {
            console.error("Failed to fetch recent DBs:", err);
            setRecentDBs([]);
            return [];
        }
    }, []);

    const openDatabase = useCallback(
        async (filePath?: string): Promise<string[] | null> => {
            setLoading(true);
            try {
                let targetPath = filePath;
                if (!targetPath) {
                    targetPath = await selectDbFile();
                }
                if (!targetPath) {
                    setLoading(false);
                    return null;
                }

                await openDB(targetPath);

                const name = targetPath.split(/[\\/]/).pop() ?? targetPath;
                await addToRecent(name, targetPath);
                await refreshRecentDBs();
                setDbPath(targetPath);
                const tbls = await refreshTables();
                setLoading(false);
                return tbls;
            } catch (err) {
                console.error("Failed to open database:", err);
                setLoading(false);
                throw err;
            }
        },
        [refreshTables, refreshRecentDBs],
    );

    useEffect(() => {
        refreshTables();
        refreshRecentDBs();
    }, [refreshTables, refreshRecentDBs]);

    return (
        <DbContext.Provider
            value={{
                dbPath,
                tables,
                recentDBs,
                loading,
                openDatabase,
                refreshTables,
                refreshRecentDBs,
            }}
        >
            {children}
        </DbContext.Provider>
    );
};
