import { ColumnInfo, QueryResult } from "../../../lib";
import { Empty } from "./Empty";

export function ResultsGrid({ result }: { result: QueryResult }) {
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
                        {result.columns.map((col: ColumnInfo) => (
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
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                    value
                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                        : "bg-red-500/10 text-red-500 border border-red-500/20"
                }`}
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
