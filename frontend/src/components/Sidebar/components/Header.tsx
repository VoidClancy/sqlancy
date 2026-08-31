import { useLayout } from "../../../context/AppLayout";
import { Database, ChevronLeft } from "lucide-react";

export default function SidebarHeader() {
    const { sidebarOpen, toggleSidebar } = useLayout();
    const collapsed = !sidebarOpen;

    return (
        <div
            className={`flex h-14 shrink-0 items-center border-b border-subtle px-3 ${
                collapsed ? "justify-center" : "justify-between"
            }`}
        >
            {!collapsed ? (
                <>
                    <div className="flex items-center gap-2.5 min-w-0">
                        <Database size={18} className="text-action shrink-0" />
                        <span className="text-sm font-semibold leading-none text-primary truncate">
                            SQLite Browser
                        </span>
                    </div>

                    <button
                        onClick={toggleSidebar}
                        aria-label="Collapse sidebar"
                        title="Collapse sidebar"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-3rd hover:bg-main hover:text-primary hover:border-subtle transition-colors"
                    >
                        <ChevronLeft size={16} />
                    </button>
                </>
            ) : (
                <button
                    onClick={toggleSidebar}
                    aria-label="Expand sidebar"
                    title="Expand sidebar"
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-action-accent/15 text-action hover:bg-action-accent/25 transition-colors"
                >
                    <Database size={16} />
                </button>
            )}
        </div>
    );
}
