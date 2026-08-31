import { useState } from "react";
import { executeQuery, QueryResult } from "../../../lib";
import { useDbStore } from "../../../store/useDbStore";
import { ActiveTab } from "../types/ActiveTab";

export function useQueryEditor() {
    const [queryText, setQueryText] = useState("SELECT * FROM sqlite_master;");
    const [result, setResult] = useState<QueryResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [executing, setExecuting] = useState(false);
    const [activeTab, setActiveTab] = useState<ActiveTab>("results");
    const [copied, setCopied] = useState(false);
    const { refreshTables } = useDbStore();

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

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            runQuery();
        }
    };

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
        handleKeyDown,
    };
}
