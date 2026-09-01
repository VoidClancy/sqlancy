import { Key } from "lucide-react";
import { ColumnInfo } from "../../../lib";

interface DataTableProps {
    columns: ColumnInfo[];
    filteredRows: any[][];
    pkSet: Set<string>;
    searchTerm: string;
}

export function DataTable({
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
