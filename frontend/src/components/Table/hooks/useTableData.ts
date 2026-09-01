import { useState, useEffect, useMemo, useCallback } from "react";
import {
    getTableInfo,
    getTableRows,
    TableInfo,
    ColumnInfo,
    Filter,
} from "../../../lib";

export interface TableState {
    tableInfo: TableInfo | null;
    columns: ColumnInfo[];
    rows: any[][];
    nextCursor: Record<string, any> | null;
    hasMore: boolean;
    activeFilter: Filter | null;
}

export function useTableData(tableName: string) {
    const [state, setState] = useState<TableState>({
        tableInfo: null,
        columns: [],
        rows: [],
        nextCursor: null,
        hasMore: false,
        activeFilter: null,
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
        [tableName],
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
    }, [tableName, state.nextCursor, state.hasMore, state.activeFilter, loadingMore]);

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
    };
}
