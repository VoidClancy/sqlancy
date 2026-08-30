import { ChevronDown, Table2, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { useDb } from "../../context/DbContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLayout } from "../../context/AppLayout";

export default function SidebarTables() {
    const [tablesOpen, setTablesOpen] = useState(true);
    const [searchFilter, setSearchFilter] = useState("");

    const navigate = useNavigate();
    const location = useLocation();
    const { sidebarOpen, toggleSidebar } = useLayout();
    const collapsed = !sidebarOpen;
    const { tables, loading } = useDb();

    const filteredTables = useMemo(() => {
        if (!searchFilter.trim()) return tables;
        const lower = searchFilter.toLowerCase();
        return tables.filter((t) => t.toLowerCase().includes(lower));
    }, [tables, searchFilter]);

    const handleClick = () => {
        setTablesOpen(true);
        toggleSidebar();
    };
    return !collapsed ? (
        <div>
            <button
                onClick={() => setTablesOpen((v) => !v)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-main group select-none"
            >
                <Table2
                    size={15}
                    className="shrink-0 text-3rd group-hover:text-secondary"
                />
                <span className="flex-1 text-[13px] font-medium text-secondary group-hover:text-primary">
                    Tables
                </span>
                <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-main border border-subtle text-3rd font-mono">
                    {tables.length}
                </span>
                <ChevronDown
                    size={14}
                    className={`text-3rd transition-transform duration-200 ${
                        tablesOpen ? "rotate-0" : "-rotate-90"
                    }`}
                />
            </button>

            <div
                className={`grid transition-all duration-200 ease-in-out ${
                    tablesOpen
                        ? "grid-rows-[1fr] opacity-100 mt-1"
                        : "grid-rows-[0fr] opacity-0 mt-0 pointer-events-none"
                }`}
            >
                <div className="overflow-hidden space-y-1">
                    {tables.length > 5 && (
                        <div className="relative mx-1 my-1.5">
                            <Search
                                size={12}
                                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-3rd"
                            />
                            <input
                                type="text"
                                placeholder="Filter tables..."
                                value={searchFilter}
                                onChange={(e) =>
                                    setSearchFilter(e.target.value)
                                }
                                className="h-7 w-full rounded-md border border-subtle bg-main pl-7 pr-2 text-[11px] text-primary placeholder:text-3rd focus:border-action-accent focus:outline-none transition-colors"
                            />
                        </div>
                    )}

                    <ul className="ml-2.5 border-l border-subtle pl-2 space-y-0.5 py-0.5">
                        {tables.length === 0 ? (
                            <li className="px-2 py-2 text-[12px] text-3rd italic">
                                {loading
                                    ? "Loading tables..."
                                    : "No database opened"}
                            </li>
                        ) : filteredTables.length === 0 ? (
                            <li className="px-2 py-2 text-[12px] text-3rd italic">
                                No matching tables
                            </li>
                        ) : (
                            filteredTables.map((t) => {
                                const isActive =
                                    location.pathname === `/tables/${t}`;
                                return (
                                    <li key={t}>
                                        <Link
                                            to={`/tables/${t}`}
                                            className={`flex items-center gap-2 w-full rounded px-2.5 py-1.5 text-left text-[12.5px] transition-colors truncate ${
                                                isActive
                                                    ? "bg-action-accent/15 text-action font-semibold"
                                                    : "text-secondary hover:bg-main hover:text-primary"
                                            }`}
                                        >
                                            <Table2
                                                size={13}
                                                className={
                                                    isActive
                                                        ? "text-action shrink-0"
                                                        : "text-3rd shrink-0"
                                                }
                                            />
                                            <span className="truncate">
                                                {t}
                                            </span>
                                        </Link>
                                    </li>
                                );
                            })
                        )}
                    </ul>
                </div>
            </div>
        </div>
    ) : (
        <div className="flex flex-col items-center">
            <button
                onClick={handleClick}
                title={`Tables (${tables.length})`}
                aria-label={`Tables (${tables.length})`}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-transparent text-secondary hover:bg-main hover:text-primary hover:border-subtle transition-colors"
            >
                <Table2 size={18} />
            </button>
        </div>
    );
}
