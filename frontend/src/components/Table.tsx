import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";
import { getTableInfo, getTableRows, TableInfo, ColumnInfo } from "../lib";
import {
    Table2,
    RefreshCw,
    Search,
    Key,
    Layers,
    ChevronRight,
    Loader2,
    AlertCircle,
    Hash,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TableState {
    tableInfo: TableInfo | null;
    columns: ColumnInfo[];
    rows: any[][];
    nextCursor: Record<string, any> | null;
    hasMore: boolean;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

function useTableData(tableName: string) {
    const [state, setState] = useState<TableState>({
        tableInfo: null,
        columns: [],
        rows: [],
        nextCursor: null,
        hasMore: false,
    });
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const loadInitial = useCallback(async () => {
        setLoading(true);
        setError(null);
        setState({
            tableInfo: null,
            columns: [],
            rows: [],
            nextCursor: null,
            hasMore: false,
        });

        try {
            const [info, result] = await Promise.all([
                getTableInfo(tableName),
                getTableRows(tableName, null, 100),
            ]);
            setState({
                tableInfo: info,
                columns: result.columns || [],
                rows: result.rows || [],
                nextCursor: result.nextCursor || null,
                hasMore: result.hasMore || false,
            });
        } catch (err: any) {
            setError(err?.message || String(err));
        } finally {
            setLoading(false);
        }
    }, [tableName]);

    const loadMore = useCallback(async () => {
        if (!state.nextCursor || loadingMore || !state.hasMore) return;
        setLoadingMore(true);
        try {
            const result = await getTableRows(tableName, state.nextCursor, 100);
            setState((prev) => ({
                ...prev,
                rows: [...prev.rows, ...(result.rows || [])],
                nextCursor: result.nextCursor || null,
                hasMore: result.hasMore || false,
            }));
        } catch (err: any) {
            setError(err?.message || String(err));
        } finally {
            setLoadingMore(false);
        }
    }, [tableName, state.nextCursor, state.hasMore, loadingMore]);

    useEffect(() => {
        loadInitial();
    }, [loadInitial]);

    const filteredRows = useMemo(() => {
        if (!searchTerm.trim()) return state.rows;
        const lower = searchTerm.toLowerCase();
        return state.rows.filter((row) =>
            row.some(
                (cell) =>
                    cell !== null && String(cell).toLowerCase().includes(lower),
            ),
        );
    }, [state.rows, searchTerm]);

    const pkSet = useMemo(
        () => new Set(state.tableInfo?.primaryKey || []),
        [state.tableInfo],
    );

    return {
        ...state,
        loading,
        loadingMore,
        error,
        searchTerm,
        setSearchTerm,
        filteredRows,
        pkSet,
        loadInitial,
        loadMore,
    };
}

// ─── TableHeader ──────────────────────────────────────────────────────────────

interface TableHeaderProps {
    tableName: string;
    tableInfo: TableInfo | null;
    columns: ColumnInfo[];
    rows: any[][];
    loading: boolean;
    searchTerm: string;
    onSearchChange: (v: string) => void;
    onRefresh: () => void;
}

const logicalOperators: string[] = ["IN", "="];

function TableHeader({
    tableName,
    tableInfo,
    columns,
    rows,
    loading,
    searchTerm,
    onSearchChange,
    onRefresh,
}: TableHeaderProps) {
    const hasPK =
        tableInfo && tableInfo.primaryKey && tableInfo.primaryKey.length > 0;

    return (
        <div className="shrink-0 border-b border-subtle bg-surface px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-action-accent/10 text-action shrink-0">
                    <Table2 size={20} />
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <h1 className="text-base font-bold text-primary truncate font-mono">
                            {tableName}
                        </h1>

                        {tableInfo?.withoutRowID && (
                            <Badge color="purple" icon={<Layers size={10} />}>
                                WITHOUT ROWID
                            </Badge>
                        )}

                        {hasPK ? (
                            <Badge color="blue" icon={<Key size={10} />}>
                                PK: {tableInfo!.primaryKey.join(", ")}
                            </Badge>
                        ) : (
                            <Badge color="amber" icon={<Hash size={10} />}>
                                No PK (_rowid_)
                            </Badge>
                        )}
                    </div>
                    <p className="text-xs text-secondary mt-0.5">
                        {columns.length} columns &bull; {rows.length} rows
                        loaded
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <div className="relative flex items-center justify-center gap-2">
                    <p>where</p>

                    <select>
                        {columns.map((c) => {
                            return <option>{c.name}</option>;
                        })}
                    </select>
                    <select>
                        {logicalOperators.map((op) => {
                            return <option>{op}</option>;
                        })}
                    </select>
                    <input type="text" />
                    <button>Filter</button>
                </div>
                <div className="relative">
                    <Search
                        size={14}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-3rd"
                    />
                    <input
                        type="text"
                        placeholder="Search loaded rows..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="h-8 w-48 sm:w-64 rounded-md border border-subtle bg-main pl-8 pr-3 text-xs text-primary placeholder:text-3rd focus:border-action-accent focus:outline-none transition-colors"
                    />
                </div>
                <button
                    onClick={onRefresh}
                    disabled={loading}
                    title="Refresh table"
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-subtle bg-main text-secondary hover:bg-surface hover:text-primary disabled:opacity-50 transition-colors"
                >
                    <RefreshCw
                        size={14}
                        className={loading ? "animate-spin text-action" : ""}
                    />
                </button>
            </div>
        </div>
    );
}

// ─── DataTable ────────────────────────────────────────────────────────────────

interface DataTableProps {
    columns: ColumnInfo[];
    filteredRows: any[][];
    pkSet: Set<string>;
    searchTerm: string;
}

function DataTable({
    columns,
    filteredRows,
    pkSet,
    searchTerm,
}: DataTableProps) {
    return (
        <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-subtle border-separate border-spacing-0">
                <thead className="bg-surface sticky top-0 z-10 shadow-sm">
                    <tr>
                        <th className="w-12 px-3 py-2.5 text-center text-[11px] font-semibold text-3rd border-b border-subtle bg-surface">
                            #
                        </th>
                        {columns.map((col) => (
                            <th
                                key={col.name}
                                className="px-3.5 py-2.5 text-left text-[11px] font-semibold text-primary border-b border-subtle bg-surface select-none"
                            >
                                <div className="flex items-center gap-1.5">
                                    {pkSet.has(col.name) && (
                                        <Key
                                            size={11}
                                            className="text-blue-500 shrink-0"
                                        />
                                    )}
                                    <span className="font-mono text-xs text-primary">
                                        {col.name}
                                    </span>
                                    <span className="text-[10px] text-3rd uppercase font-normal font-mono">
                                        {col.type || "ANY"}
                                    </span>
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody className="divide-y divide-subtle bg-page font-mono text-xs">
                    {filteredRows.length === 0 ? (
                        <tr>
                            <td
                                colSpan={columns.length + 1}
                                className="px-4 py-8 text-center text-3rd italic"
                            >
                                {searchTerm
                                    ? "No matching rows found."
                                    : "Table is empty."}
                            </td>
                        </tr>
                    ) : (
                        filteredRows.map((row, rIdx) => (
                            <tr
                                key={rIdx}
                                className="hover:bg-main/60 transition-colors"
                            >
                                <td className="px-3 py-2 text-center text-[11px] text-3rd border-r border-subtle/50 select-none bg-surface/30">
                                    {rIdx + 1}
                                </td>
                                {row.map((cell, cIdx) => (
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

// ─── TableFooter ──────────────────────────────────────────────────────────────

interface TableFooterProps {
    filteredRows: any[][];
    totalRows: any[][];
    hasMore: boolean;
    loadingMore: boolean;
    onLoadMore: () => void;
}

function TableFooter({
    filteredRows,
    totalRows,
    hasMore,
    loadingMore,
    onLoadMore,
}: TableFooterProps) {
    return (
        <div className="shrink-0 border-t border-subtle bg-surface px-4 py-2.5 flex items-center justify-between gap-3 text-xs select-none">
            <div className="text-secondary">
                Showing{" "}
                <span className="font-semibold text-primary">
                    {filteredRows.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-primary">
                    {totalRows.length}
                </span>{" "}
                loaded rows
            </div>

            {hasMore ? (
                <button
                    onClick={onLoadMore}
                    disabled={loadingMore}
                    className="flex items-center gap-1.5 rounded-md bg-action-accent px-3 py-1.5 font-medium text-action hover:bg-action-accent-hover active:bg-action-accent-active disabled:opacity-50 transition-colors shadow-sm"
                >
                    {loadingMore ? (
                        <>
                            <Loader2 size={13} className="animate-spin" />{" "}
                            Loading more...
                        </>
                    ) : (
                        <>
                            Load More Rows <ChevronRight size={13} />
                        </>
                    )}
                </button>
            ) : (
                <span className="text-3rd italic">All rows loaded</span>
            )}
        </div>
    );
}

// ─── Shared ───────────────────────────────────────────────────────────────────

type BadgeColor = "purple" | "blue" | "amber";

const badgeStyles: Record<BadgeColor, string> = {
    purple: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    blue: "bg-blue-500/10   text-blue-500   border-blue-500/20",
    amber: "bg-amber-500/10  text-amber-500  border-amber-500/20",
};

function Badge({
    color,
    icon,
    children,
}: {
    color: BadgeColor;
    icon: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${badgeStyles[color]}`}
        >
            {icon} {children}
        </span>
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

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function Table() {
    const { tableName } = useParams<{ tableName: string }>();

    if (!tableName) {
        return (
            <div className="p-8 text-center text-secondary">
                No table selected.
            </div>
        );
    }

    const {
        tableInfo,
        columns,
        rows,
        hasMore,
        loading,
        loadingMore,
        error,
        searchTerm,
        setSearchTerm,
        filteredRows,
        pkSet,
        loadInitial,
        loadMore,
    } = useTableData(tableName);

    return (
        <div className="flex flex-col h-full w-full bg-page overflow-hidden">
            <TableHeader
                tableName={tableName}
                tableInfo={tableInfo}
                columns={columns}
                rows={rows}
                loading={loading}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onRefresh={loadInitial}
            />

            {error && (
                <div className="m-4 p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <div className="flex-1 overflow-auto relative">
                {loading ? (
                    <div className="flex h-full w-full items-center justify-center gap-2 text-secondary text-sm">
                        <Loader2
                            size={20}
                            className="animate-spin text-action"
                        />
                        Loading table rows...
                    </div>
                ) : columns.length === 0 ? (
                    <div className="flex h-full w-full items-center justify-center text-3rd text-sm italic">
                        No columns or data available.
                    </div>
                ) : (
                    <DataTable
                        columns={columns}
                        filteredRows={filteredRows}
                        pkSet={pkSet}
                        searchTerm={searchTerm}
                    />
                )}
            </div>

            <TableFooter
                filteredRows={filteredRows}
                totalRows={rows}
                hasMore={hasMore}
                loadingMore={loadingMore}
                onLoadMore={loadMore}
            />
        </div>
    );
}
