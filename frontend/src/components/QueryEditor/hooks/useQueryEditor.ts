import { useEffect, useState } from "react";
import { executeQuery, QueryResult } from "../../../lib";
import { useDbStore } from "../../../store/useDbStore";
import { ActiveTab } from "../types/ActiveTab";
import { useShortcut } from "../../../hooks/useShortcuts";

export function useQueryEditor() {
    const [queryText, setQueryText] = useState("SELECT * FROM sqlite_master;");
    const [result, setResult] = useState<QueryResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [executing, setExecuting] = useState(false);
    const [activeTab, setActiveTab] = useState<ActiveTab>("results");
    const [copied, setCopied] = useState(false);
    const { refreshTables } = useDbStore();
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (
                (event.ctrlKey || event.metaKey) &&
                event.key.toLowerCase() === "enter"
            ) {
                event.preventDefault();

                runQuery();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    const runQuery = async () => {
        const sqlQuery = queryText.trim();
        if (!sqlQuery || executing) return;

        setExecuting(true);
        setError(null);
        setResult(null);

        try {
            const res = await executeQuery(sqlQuery);
            setResult(res);
            setActiveTab(res.isSelect ? "results" : "log");
            await refreshTables();
        } catch (err: any) {
            const errMsg =
                err?.message ||
                (typeof err === "string" ? err : JSON.stringify(err));
            setError(errMsg);
            setActiveTab("log");
        } finally {
            setExecuting(false);
        }
    };
    useShortcut("Enter", runQuery);

    const copySQL = () => {
        navigator.clipboard.writeText(queryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return {
        queryText,
        setQueryText,
        result,
        error,
        executing,
        activeTab,
        setActiveTab,
        copied,
        copySQL,
        runQuery,
    };
}
