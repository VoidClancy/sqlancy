import { AlertCircle } from "lucide-react";
import { QueryResult } from "../../../lib";

export function ExecutionLog({
    result,
    error,
}: {
    result: QueryResult | null;
    error: string | null;
}) {
    if (error) {
        return (
            <div className="p-4 font-mono text-xs space-y-3">
                <div className="p-4 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 font-mono space-y-2">
                    <div className="flex items-center gap-2 text-red-400 font-semibold text-xs">
                        <AlertCircle size={16} className="shrink-0" />
                        SQL Execution Error
                    </div>
                    <div className="whitespace-pre-wrap pl-6 text-[12px] leading-relaxed">
                        {error}
                    </div>
                </div>
            </div>
        );
    }

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
