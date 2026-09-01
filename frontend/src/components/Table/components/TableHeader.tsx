import { Hash, Key, Layers, RefreshCw, Search, Table2, X } from "lucide-react";
import { useEffect, useState } from "react";

import { ColumnInfo, Filter, TableInfo } from "../../../lib";
import { db } from "../../../../wailsjs/go/models";
import { Dropdown } from "../../shared/Dropdown";
import { DropdownOption } from "../../../types/DropdownOption";
import { LogicalOperator } from "../../../types/LogicalOperator";
import { logicalOperators } from "../../../constants/logicalOperators";

interface TableHeaderProps {
    tableName: string;
    tableInfo: TableInfo | null;
    columns: ColumnInfo[];
    rows: any[][];
    loading: boolean;
    activeFilter: Filter | null;
    searchTerm: string;
    onSearchChange: (v: string) => void;
    onRefresh: () => void;
    onApplyFilter: (filter: Filter | null) => void;
}

export function TableHeader({
    tableName,
    tableInfo,
    columns,
    rows,
    loading,
    activeFilter,
    searchTerm,
    onSearchChange,
    onRefresh,
    onApplyFilter,
}: TableHeaderProps) {
    const hasPK =
        tableInfo && tableInfo.primaryKey && tableInfo.primaryKey.length > 0;

    const [filterCol, setFilterCol] = useState<string>("");
    const [filterOp, setFilterOp] = useState<LogicalOperator>("=");
    const [filterVal, setFilterVal] = useState<string>("");

    useEffect(() => {
        if (columns.length > 0 && !filterCol) {
            setFilterCol(columns[0].name);
        }
    }, [columns, filterCol]);

    const handleFilter = () => {
        if (!filterCol || !filterOp) return;

        if (
            filterOp !== "IS NULL" &&
            filterOp !== "IS NOT NULL" &&
            !filterVal.trim()
        ) {
            return;
        }

        const filter: Filter = db.Filter.createFrom({
            column: filterCol,
            operator: filterOp,
            value: filterVal,
        });

        onApplyFilter(filter);
    };

    const handleClearFilter = () => {
        setFilterVal("");
        onApplyFilter(null);
    };

    const operatorOptions: DropdownOption<LogicalOperator>[] = Object.entries(
        logicalOperators,
    ).map(([value, label]) => ({
        value: value as LogicalOperator,
        label,
    }));

    const columnOptions: DropdownOption<string>[] = columns.map((column) => ({
        value: column.name,
        label: column.name,
    }));

    return (
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-subtle bg-surface px-4 py-2.5 select-none">
            {/* Left: Table Title & Metadata */}
            <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-action-accent/10 text-action">
                    <Table2 size={18} />
                </div>

                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <h1 className="truncate font-mono text-sm font-bold text-primary">
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

                    <p className="text-[11px] text-3rd">
                        {columns.length} columns &bull; {rows.length} rows
                        loaded
                    </p>
                </div>
            </div>

            {/* Right: Controls Bar */}
            <div className="flex items-stretch gap-2">
                {/* Filter Strip */}
                <div className="flex h-fit items-center border border-subtle">
                    <span
                        className="
                flex items-center
                bg-main
                px-2.5 py-2
                text-[10px]
                font-semibold
                uppercase
                tracking-widest
                text-3rd
                select-none
            "
                    >
                        Where
                    </span>

                    <div className="border-l border-subtle">
                        <Dropdown
                            value={filterCol}
                            options={columnOptions}
                            onChange={setFilterCol}
                            className="w-32 sm:w-36"
                        />
                    </div>

                    <div className="border-l border-subtle">
                        <Dropdown
                            value={filterOp}
                            options={operatorOptions}
                            onChange={(value: LogicalOperator) =>
                                setFilterOp(value)
                            }
                            className="w-28 sm:w-32"
                        />
                    </div>

                    <input
                        type="text"
                        value={filterVal}
                        disabled={
                            filterOp === "IS NULL" || filterOp === "IS NOT NULL"
                        }
                        onChange={(e) => setFilterVal(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleFilter()}
                        placeholder={
                            filterOp === "IS NULL" || filterOp === "IS NOT NULL"
                                ? "—"
                                : filterOp === "IN" || filterOp === "NOT IN"
                                  ? "1, 2, 3…"
                                  : "value"
                        }
                        className="
                h-8
                w-24
                border-l border-subtle
                bg-main
                px-2.5
                text-xs
                font-mono
                text-primary
                placeholder:text-3rd
                outline-none
                focus:bg-surface
                disabled:cursor-not-allowed
                disabled:opacity-30
                sm:w-28
            "
                    />

                    <button
                        type="button"
                        onClick={handleFilter}
                        className="
                h-8
                border-l border-subtle
                bg-main
                px-3
                text-xs
                text-secondary
                transition-colors
                hover:bg-surface
                hover:text-primary
                active:text-primary
            "
                    >
                        Apply
                    </button>

                    {activeFilter && (
                        <button
                            type="button"
                            onClick={handleClearFilter}
                            title="Clear filter"
                            className="
                    flex h-8
                    items-center gap-1
                    border-l border-subtle
                    px-2.5
                    text-xs
                    text-red-400
                    transition-colors
                    hover:bg-red-500/10
                    active:bg-red-500/15
                "
                        >
                            <X size={11} />
                            Clear
                        </button>
                    )}
                </div>

                {/* Quick Search */}
                <div className="relative self-stretch">
                    <Search
                        size={12}
                        className="
                pointer-events-none
                absolute left-2.5 top-1/2
                -translate-y-1/2
                text-3rd
            "
                    />

                    <input
                        type="text"
                        placeholder="Search rows…"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="
                h-full w-40 border border-subtle bg-main
                pl-8 pr-2.5 text-xs text-primary
                placeholder:text-3rd outline-none transition-colors focus:border-action-accent sm:w-48
            "
                    />
                </div>

                {/* Refresh */}
                <button
                    type="button"
                    onClick={onRefresh}
                    disabled={loading}
                    title="Refresh"
                    className="
            flex self-stretch
            w-8 shrink-0
            items-center justify-center
           
            border border-subtle
            bg-main
            text-3rd
            transition-colors
            hover:text-primary
            disabled:opacity-40
        "
                >
                    <RefreshCw
                        size={13}
                        className={loading ? "animate-spin text-action" : ""}
                    />
                </button>
            </div>
        </div>
    );
}

type BadgeColor = "purple" | "blue" | "amber";

const badgeStyles: Record<BadgeColor, string> = {
    purple: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    blue: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    amber: "bg-amber-500/10 text-amber-500 border-amber-500/20",
};

export function Badge({
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
            className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium font-mono ${badgeStyles[color]}`}
        >
            {icon}
            {children}
        </span>
    );
}
