import { Table2, Terminal, Clock, CheckCircle2 } from "lucide-react";
import { QueryResult } from "../../../lib";
import { ActiveTab } from "../types/ActiveTab";

interface ResultsBarProps {
    activeTab: ActiveTab;
    setActiveTab: (tab: ActiveTab) => void;
    result: QueryResult | null;
    error: string | null;
}

export function ResultsBar({
    activeTab,
    setActiveTab,
    result,
    error,
}: ResultsBarProps) {
    const tabClass = (tab: ActiveTab) =>
        `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === tab
                ? "bg-action-accent/15 text-action font-semibold"
                : "text-secondary hover:bg-main hover:text-primary"
        }`;

    return (
        <div className="shrink-0 border-b border-subtle bg-surface px-4 py-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1">
                <button
                    onClick={() => setActiveTab("results")}
                    className={tabClass("results")}
                >
                    <Table2 size={14} />
                    Results Grid
                    {result?.isSelect && result.rows && (
                        <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-main border border-subtle font-mono text-3rd">
                            {result.rows.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab("log")}
                    className={tabClass("log")}
                >
                    <Terminal size={14} />
                    Execution Log
                    {error && (
                        <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 animate-pulse" />
                    )}
                </button>
            </div>

            {result && (
                <div className="flex items-center gap-3 text-xs text-secondary font-mono">
                    <span className="flex items-center gap-1">
                        <Clock size={13} className="text-amber-500" />
                        {result.executionTime.toFixed(2)} ms
                    </span>
                    {!result.isSelect && (
                        <>
                            <span className="flex items-center gap-1 text-emerald-500">
                                <CheckCircle2 size={13} />
                                {result.rowsAffected} rows affected
                            </span>
                            {result.lastInsertId > 0 && (
                                <span className="text-blue-500">
                                    Last ID: {result.lastInsertId}
                                </span>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
