import React, { useCallback, useRef, useState } from "react";
import { executeQuery } from "./lib/db";
import { useDb } from "./DbContext";
import { db } from "../../wailsjs/go/models";
import {
    Play,
    Clock,
    CheckCircle2,
    AlertCircle,
    Table2,
    Terminal,
    Loader2,
    Code2,
    Copy,
    Check,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type ActiveTab = "results" | "log";

// ─── Hook ────────────────────────────────────────────────────────────────────

function useQueryEditor() {
    const [queryText, setQueryText] = useState("SELECT * FROM sqlite_master;");
    const [result, setResult] = useState<db.QueryResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [executing, setExecuting] = useState(false);
    const [activeTab, setActiveTab] = useState<ActiveTab>("results");
    const [copied, setCopied] = useState(false);
    const { refreshTables } = useDb();

    const runQuery = async () => {
        if (!queryText.trim() || executing) return;
        setExecuting(true);
        setError(null);
        setResult(null);
        try {
            const res = await executeQuery(queryText.trim());
            setResult(res);
            setActiveTab(res.isSelect ? "results" : "log");
            await refreshTables();
        } catch (err: any) {
            setError(err?.message || String(err));
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

// ─── QueryPanel ──────────────────────────────────────────────────────────────

interface QueryPanelProps {
    queryText: string;
    setQueryText: (text: string) => void;
    handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

function QueryPanel({
    queryText,
    setQueryText,
    handleKeyDown,
}: QueryPanelProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const isResizing = useRef(false);
    const startY = useRef(0);
    const startHeight = useRef(0);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        isResizing.current = true;
        startY.current = e.clientY;
        startHeight.current = containerRef.current?.offsetHeight ?? 176;
        document.body.style.cursor = "ns-resize";
        document.body.style.userSelect = "none";

        const onMouseMove = (e: MouseEvent) => {
            if (!isResizing.current || !containerRef.current) return;
            const newHeight = Math.max(
                80,
                Math.min(600, startHeight.current + e.clientY - startY.current),
            );
            containerRef.current.style.height = `${newHeight}px`;
        };

        const onMouseUp = () => {
            isResizing.current = false;
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    }, []);

    return (
        <div
            ref={containerRef}
            className="relative shrink-0 overflow-hidden bg-surface p-3 flex flex-col h-44"
        >
            <textarea
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter SQL query..."
                spellCheck={false}
                className="flex-1 w-full bg-main rounded-md border border-subtle p-3 font-mono text-xs text-primary placeholder:text-3rd focus:border-action-accent focus:outline-none resize-none transition-colors"
            />
            <div
                onMouseDown={handleMouseDown}
                className="absolute bottom-0 left-0 right-0 h-1 cursor-ns-resize group"
            >
                <div className="absolute inset-x-0 top-0 bg-subtle h-2 transition-colors group-hover:bg-action-accent-hover" />
            </div>
        </div>
    );
}

// ─── Toolbar ─────────────────────────────────────────────────────────────────

interface ToolbarProps {
    executing: boolean;
    queryText: string;
    copied: boolean;
    onCopy: () => void;
    onRun: () => void;
}

function Toolbar({
    executing,
    queryText,
    copied,
    onCopy,
    onRun,
}: ToolbarProps) {
    return (
        <div className="shrink-0 border-b border-subtle bg-surface px-4 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
                <Code2 size={18} className="text-action shrink-0" />
                <h1 className="text-sm font-bold text-primary">
                    SQL Query Editor
                </h1>
                <span className="text-[11px] text-3rd font-mono">
                    Press Ctrl+Enter to run
                </span>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={onCopy}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-subtle bg-main text-xs text-secondary hover:bg-surface hover:text-primary transition-colors"
                >
                    {copied ? (
                        <Check size={13} className="text-emerald-500" />
                    ) : (
                        <Copy size={13} />
                    )}
                    {copied ? "Copied" : "Copy SQL"}
                </button>
                <button
                    onClick={onRun}
                    disabled={executing || !queryText.trim()}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-md bg-action-accent text-xs font-semibold text-action hover:bg-action-accent-hover active:bg-action-accent-active disabled:opacity-50 transition-colors shadow-sm"
                >
                    {executing ? (
                        <>
                            <Loader2 size={14} className="animate-spin" />{" "}
                            Executing...
                        </>
                    ) : (
                        <>
                            <Play size={14} className="fill-current" /> Run
                            Query
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

// ─── ResultsBar ──────────────────────────────────────────────────────────────

interface ResultsBarProps {
    activeTab: ActiveTab;
    setActiveTab: (tab: ActiveTab) => void;
    result: db.QueryResult | null;
    error: string | null;
}

function ResultsBar({
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
                        <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
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

// ─── ResultsGrid ─────────────────────────────────────────────────────────────

function ResultsGrid({ result }: { result: db.QueryResult }) {
    if (!result.columns || result.columns.length === 0) {
        return <Empty>Query returned no columns.</Empty>;
    }

    return (
        <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-subtle border-separate border-spacing-0">
                <thead className="bg-surface sticky top-0 z-10 shadow-sm">
                    <tr>
                        <th className="w-12 px-3 py-2.5 text-center text-[11px] font-semibold text-3rd border-b border-subtle bg-surface">
                            #
                        </th>
                        {result.columns.map((col: db.ColumnInfo) => (
                            <th
                                key={col.name}
                                className="px-3.5 py-2.5 text-left text-[11px] font-semibold text-primary border-b border-subtle bg-surface select-none"
                            >
                                <div className="flex items-center gap-1.5">
                                    <span className="font-mono text-xs text-primary">
                                        {col.name}
                                    </span>
                                    {col.type && (
                                        <span className="text-[10px] text-3rd uppercase font-normal font-mono">
                                            {col.type}
                                        </span>
                                    )}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-subtle bg-page font-mono text-xs">
                    {!result.rows || result.rows.length === 0 ? (
                        <tr>
                            <td
                                colSpan={result.columns.length + 1}
                                className="px-4 py-8 text-center text-3rd italic"
                            >
                                Query returned 0 rows.
                            </td>
                        </tr>
                    ) : (
                        result.rows.map((row: any[], rIdx: number) => (
                            <tr
                                key={rIdx}
                                className="hover:bg-main/60 transition-colors"
                            >
                                <td className="px-3 py-2 text-center text-[11px] text-3rd border-r border-subtle/50 select-none bg-surface/30">
                                    {rIdx + 1}
                                </td>
                                {row.map((cell: any, cIdx: number) => (
                                    <td
                                        key={cIdx}
                                        className="px-3.5 py-2 text-primary whitespace-nowrap max-w-xs truncate"
                                    >
                                        <CellValue value={cell} />
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

function CellValue({ value }: { value: any }) {
    if (value === null || value === undefined) {
        return (
            <span className="px-1 py-0.5 rounded bg-subtle/40 text-[10px] font-sans font-medium text-3rd uppercase tracking-wider">
                NULL
            </span>
        );
    }
    if (typeof value === "boolean") {
        return (
            <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${value ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"}`}
            >
                {String(value)}
            </span>
        );
    }
    if (typeof value === "number") {
        return <span className="text-emerald-500">{value}</span>;
    }
    return <span title={String(value)}>{String(value)}</span>;
}

// ─── ExecutionLog ────────────────────────────────────────────────────────────

function ExecutionLog({ result }: { result: db.QueryResult | null }) {
    if (!result) {
        return (
            <div className="p-4 font-mono text-xs text-3rd italic">
                No query has been executed yet.
            </div>
        );
    }

    const stats = [
        {
            label: "Execution Time",
            value: `${result.executionTime.toFixed(2)} ms`,
            color: "text-amber-500",
        },
        {
            label: "Is Tabular Query",
            value: result.isSelect ? "Yes" : "No",
            color: "text-primary",
        },
        {
            label: "Rows Affected",
            value: result.rowsAffected,
            color: "text-primary",
        },
        {
            label: "Last Insert ID",
            value: result.lastInsertId,
            color: "text-primary",
        },
    ];

    return (
        <div className="p-4 font-mono text-xs space-y-3">
            <div className="p-3 rounded-md bg-surface border border-subtle text-primary">
                <div className="text-secondary text-[11px] mb-1">
                    Status Message
                </div>
                <div className="font-semibold text-emerald-500">
                    {result.message}
                </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {stats.map(({ label, value, color }) => (
                    <div
                        key={label}
                        className="p-3 rounded-md bg-surface border border-subtle"
                    >
                        <div className="text-[11px] text-3rd">{label}</div>
                        <div className={`text-sm font-semibold ${color}`}>
                            {value}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Shared ───────────────────────────────────────────────────────────────────

function Empty({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-full w-full items-center justify-center text-3rd text-xs italic">
            {children}
        </div>
    );
}

// ─── Root ────────────────────────────────────────────────────────────────────

export default function QueryEditorView() {
    const {
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
    } = useQueryEditor();

    const showEmptyResults = !result || !result.isSelect;

    return (
        <div className="flex flex-col h-full w-full bg-page overflow-hidden select-none">
            <Toolbar
                executing={executing}
                queryText={queryText}
                copied={copied}
                onCopy={copySQL}
                onRun={runQuery}
            />

            <QueryPanel
                queryText={queryText}
                setQueryText={setQueryText}
                handleKeyDown={handleKeyDown}
            />

            <ResultsBar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                result={result}
                error={error}
            />

            <div className="flex-1 overflow-auto relative bg-page">
                {error && (
                    <div className="m-4 p-3.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-mono flex items-start gap-2.5">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <div className="whitespace-pre-wrap">{error}</div>
                    </div>
                )}

                {activeTab === "results" ? (
                    showEmptyResults ? (
                        <Empty>
                            {result
                                ? "Query executed without returning rows."
                                : "Run a query to view result grid."}
                        </Empty>
                    ) : (
                        <ResultsGrid result={result!} />
                    )
                ) : (
                    <ExecutionLog result={result} />
                )}
            </div>
        </div>
    );
}
