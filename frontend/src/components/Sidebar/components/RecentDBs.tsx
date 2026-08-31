import { ChevronDown, Database } from "lucide-react";
import { useState } from "react";
import { useLayout } from "../../../context/AppLayout";
import { useDbStore } from "../../../store/useDbStore";
import { useNavigate } from "react-router-dom";

export default function RecentDBs() {
    const [open, setOpen] = useState(true);
    const { recentDBs, dbPath, openDatabase } = useDbStore();
    const { sidebarOpen, toggleSidebar } = useLayout();
    const collapsed = !sidebarOpen;
    const navigate = useNavigate();

    const handleSelectRecent = async (path: string) => {
        try {
            const tbls = await openDatabase(path);
            if (tbls && tbls.length > 0) {
                navigate(`/tables/${tbls[0]}`);
            } else {
                navigate("/");
            }
        } catch (err) {
            console.error("Failed to open recent DB:", err);
        }
    };
    const handleClick = () => {
        setOpen(true);
        toggleSidebar();
    };
    return !collapsed ? (
        <div>
            <button
                onClick={() => setOpen((v) => !v)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-main group select-none"
            >
                <Database
                    size={15}
                    className="shrink-0 text-3rd group-hover:text-secondary"
                />

                <span className="flex-1 text-[13px] font-medium text-secondary group-hover:text-primary">
                    Recent DBs
                </span>

                {recentDBs.length > 0 && (
                    <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-main border border-subtle text-3rd font-mono">
                        {recentDBs.length}
                    </span>
                )}

                <ChevronDown
                    size={14}
                    className={`text-3rd transition-transform duration-200 ${
                        open ? "rotate-0" : "-rotate-90"
                    }`}
                />
            </button>

            <div
                className={`grid transition-all duration-200 ease-in-out ${
                    open
                        ? "grid-rows-[1fr] opacity-100 mt-1"
                        : "grid-rows-[0fr] opacity-0 mt-0 pointer-events-none"
                }`}
            >
                <div className="overflow-hidden">
                    <ul className="ml-2.5 border-l border-subtle pl-2 space-y-0.5 py-0.5">
                        {recentDBs.length === 0 ? (
                            <li className="px-2 py-2 text-[12px] text-3rd italic select-none">
                                No recent databases
                            </li>
                        ) : (
                            recentDBs.map((item) => {
                                const isActive = dbPath === item.path;
                                return (
                                    <li key={item.path}>
                                        <button
                                            onClick={() =>
                                                handleSelectRecent(item.path)
                                            }
                                            title={item.path}
                                            className={`flex items-center gap-2 w-full rounded px-2.5 py-1.5 text-left text-[12.5px] transition-colors truncate ${
                                                isActive
                                                    ? "bg-action-accent/15 text-action font-semibold"
                                                    : "text-secondary hover:bg-main hover:text-primary"
                                            }`}
                                        >
                                            <Database
                                                size={13}
                                                className={
                                                    isActive
                                                        ? "text-action shrink-0"
                                                        : "text-3rd shrink-0"
                                                }
                                            />
                                            <span className="truncate">
                                                {item.name}
                                            </span>
                                        </button>
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
                title={`Recent DBs (${recentDBs.length})`}
                aria-label={`Recent DBs (${recentDBs.length})`}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-transparent text-secondary hover:bg-main hover:text-primary hover:border-subtle transition-colors"
            >
                <Database size={18} />
            </button>
        </div>
    );
}
