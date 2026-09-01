import { Loader2, ChevronRight } from "lucide-react";

interface TableFooterProps {
    filteredRows: any[][];
    totalRows: any[][];
    hasMore: boolean;
    loadingMore: boolean;
    onLoadMore: () => void;
}

export function TableFooter({
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
                            Load More <ChevronRight size={13} />
                        </>
                    )}
                </button>
            ) : (
                <span className="text-3rd italic">All rows loaded</span>
            )}
        </div>
    );
}
