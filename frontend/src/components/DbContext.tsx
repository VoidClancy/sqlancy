import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
} from "react";
import { selectDbFile, openDB, getTables } from "./lib/db";

type DbContextType = {
    dbPath: string | null;
    tables: string[];
    loading: boolean;
    openDatabase: (filePath?: string) => Promise<string[] | null>;
    refreshTables: () => Promise<string[]>;
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
        [refreshTables],
    );

    useEffect(() => {
        refreshTables();
    }, [refreshTables]);

    return (
        <DbContext.Provider
            value={{ dbPath, tables, loading, openDatabase, refreshTables }}
        >
            {children}
        </DbContext.Provider>
    );
};
