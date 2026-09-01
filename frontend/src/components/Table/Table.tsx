import { useParams } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import { useTableData } from "./hooks/useTableData";
import { TableHeader } from "./components/TableHeader";
import { TableFooter } from "./components/TableFooter";
import { DataTable } from "./components/DataTable";

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
        activeFilter,
        searchTerm,
        setSearchTerm,
        filteredRows,
        pkSet,
        loadInitial,
        loadMore,
        applyFilter,
    } = useTableData(tableName);

    return (
        <div className="flex flex-col h-full w-full bg-page overflow-hidden">
            <TableHeader
                tableName={tableName}
                tableInfo={tableInfo}
                columns={columns}
                rows={rows}
                loading={loading}
                activeFilter={activeFilter}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onRefresh={loadInitial}
                onApplyFilter={applyFilter}
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
