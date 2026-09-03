import { useState, useEffect, useMemo, useCallback } from "react";
import {
    getTableInfo,
    getTableRows,
    TableInfo,
    ColumnInfo,
    Filter,
    SortBy,
} from "../../../lib";
import { db } from "../../../../wailsjs/go/models";

export interface TableState {
    tableInfo: TableInfo | null;
    columns: ColumnInfo[];
    rows: any[][];
    nextCursor: Record<string, any> | null;
    hasMore: boolean;
    activeFilter: Filter | null;
    sortBy: SortBy | null;
}

export function useTableData(tableName: string) {
    const [state, setState] = useState<TableState>({
        tableInfo: null,
        columns: [],
        rows: [],
        nextCursor: null,
        hasMore: false,
        activeFilter: null,
        sortBy: null,
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
            activeFilter: null,
            sortBy: null,
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
                activeFilter: null,
                sortBy: null,
            });
        } catch (err: any) {
            setError(err?.message || String(err));
        } finally {
            setLoading(false);
        }
    }, [tableName]);

    const applyFilter = useCallback(
        async (filter: Filter | null) => {
            setLoading(true);
            setError(null);
            try {
                const result = await getTableRows(
                    tableName,
                    null,
                    100,
                    filter || undefined,
                    state.sortBy || undefined,
                );
                setState((prev) => ({
                    ...prev,
                    rows: result.rows || [],
                    nextCursor: result.nextCursor || null,
                    hasMore: result.hasMore || false,
                    activeFilter: filter,
                }));
            } catch (err: any) {
                setError(err?.message || String(err));
            } finally {
                setLoading(false);
            }
        },
        [tableName, state.sortBy],
    );

    const toggleSort = useCallback(
        async (columnName: string) => {
            setLoading(true);
            setError(null);

            let nextSort: SortBy | null = null;
            if (!state.sortBy || state.sortBy.column !== columnName) {
                nextSort = db.SortBy.createFrom({
                    column: columnName,
                    order: "ASC",
                });
            } else if (state.sortBy.order === "ASC") {
                nextSort = db.SortBy.createFrom({
                    column: columnName,
                    order: "DESC",
                });
            } else {
                nextSort = null;
            }

            try {
                const result = await getTableRows(
                    tableName,
                    null,
                    100,
                    state.activeFilter || undefined,
                    nextSort || undefined,
                );
                setState((prev) => ({
                    ...prev,
                    rows: result.rows || [],
                    nextCursor: result.nextCursor || null,
                    hasMore: result.hasMore || false,
                    sortBy: nextSort,
                }));
            } catch (err: any) {
                setError(err?.message || String(err));
            } finally {
                setLoading(false);
            }
        },
        [tableName, state.sortBy, state.activeFilter],
    );

    const loadMore = useCallback(async () => {
        if (!state.nextCursor || loadingMore || !state.hasMore) return;
        setLoadingMore(true);
        try {
            const result = await getTableRows(
                tableName,
                state.nextCursor,
                100,
                state.activeFilter || undefined,
                state.sortBy || undefined,
            );
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
    }, [tableName, state.nextCursor, state.hasMore, state.activeFilter, state.sortBy, loadingMore]);

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
        setState,
        setSearchTerm,
        filteredRows,
        pkSet,
        loadInitial,
        loadMore,
        applyFilter,
        toggleSort,
    };
}
