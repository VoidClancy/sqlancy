import { useNavigate } from "react-router-dom";
import { useDbStore } from "../../../store/useDbStore";
import { Loader2, Plus, FileText } from "lucide-react";
import { useLayout } from "../../../context/AppLayout";

export default function ActionRow() {
    const navigate = useNavigate();
    const { sidebarOpen } = useLayout();
    const collapsed = !sidebarOpen;
    const { openDatabase, loading } = useDbStore();

    const handleOpenDB = async () => {
        try {
            const tbls = await openDatabase();
            if (tbls === null) return;

            if (tbls.length > 0) {
                navigate(`/tables/${tbls[0]}`);
            } else {
                navigate("/");
            }
        } catch (err) {
            console.error("Failed to open database:", err);
        }
    };

    return (
        <div className="shrink-0">
            {!collapsed ? (
                <div className="flex gap-2 p-3">
                    <button
                        onClick={handleOpenDB}
                        disabled={loading}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-action-accent px-3 py-2 text-sm font-medium text-action hover:bg-action-accent-hover active:bg-action-accent-active disabled:opacity-50 transition-colors shadow-sm"
                    >
                        {loading ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : (
                            <Plus size={14} />
                        )}
                        Open DB
                    </button>
                    <button
                        onClick={() => navigate("/query")}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-subtle bg-main px-3 py-2 text-sm font-medium text-secondary hover:bg-surface hover:text-primary transition-colors"
                    >
                        <FileText size={14} />
                        Query
                    </button>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-2 p-2">
                    <button
                        onClick={handleOpenDB}
                        disabled={loading}
                        title="Open Database"
                        className="flex h-9 w-9 items-center justify-center rounded-md bg-action-accent text-action hover:bg-action-accent-hover active:bg-action-accent-active disabled:opacity-50 transition-colors shadow-sm"
                    >
                        {loading ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Plus size={16} />
                        )}
                    </button>
                    <button
                        onClick={() => navigate("/query")}
                        title="Query Editor"
                        className="flex h-9 w-9 items-center justify-center rounded-md border border-subtle bg-main text-secondary hover:text-primary transition-colors"
                    >
                        <FileText size={16} />
                    </button>
                </div>
            )}
        </div>
    );
}
