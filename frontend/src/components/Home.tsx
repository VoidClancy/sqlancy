import { Loader2, FolderOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDbStore } from "../store/useDbStore";

const CAPABILITIES = [
    "cursor pagination",
    "composite primary keys",
    "WITHOUT ROWID",
    "rowid fallback",

    "SQL editor",
];

export default function HomeView() {
    const navigate = useNavigate();
    const { openDatabase, loading } = useDbStore();

    const handleOpenDB = async () => {
        try {
            const tbls = await openDatabase();
            if (tbls === null) return;
            if (tbls.length > 0) {
                navigate(`/tables/${tbls[0]}`);
            }
        } catch (err) {
            console.error("Failed to open DB:", err);
        }
    };

    return (
        <div className="flex h-full w-full flex-col items-center justify-center bg-page select-none overflow-auto">
            <div className="flex flex-col items-center gap-8 px-8 max-w-sm w-full">
                <div className="text-center">
                    <h1 className="font-mono text-3xl font-bold tracking-tight text-primary leading-none">
                        sqlite
                        <span className="text-secondary"> browser</span>
                    </h1>
                </div>

                <button
                    onClick={handleOpenDB}
                    disabled={loading}
                    className="group relative w-full flex items-center justify-center gap-2.5 rounded-lg border border-subtle bg-surface px-5 py-3 text-sm font-medium text-primary hover:border-action-accent hover:text-action hover:bg-action-accent/5 active:scale-[0.98] disabled:opacity-50 transition-all duration-150 shadow-sm"
                >
                    {loading ? (
                        <Loader2
                            size={15}
                            className="animate-spin text-action"
                        />
                    ) : (
                        <FolderOpen
                            size={15}
                            className="text-3rd group-hover:text-action transition-colors"
                        />
                    )}
                    {loading ? "Opening…" : "Open a .db file"}
                    {!loading && (
                        <span className="absolute right-3 font-mono text-[10px] text-3rd group-hover:text-action/60 transition-colors">
                            ⌘O
                        </span>
                    )}
                </button>

                <p className="text-[11px] text-3rd text-center">
                    or pick a table from the sidebar
                </p>

                <div className="w-full pt-4 border-t border-subtle">
                    <ul className="flex flex-wrap justify-center gap-x-3 gap-y-1.5">
                        {CAPABILITIES.map((cap, i) => (
                            <li
                                key={cap}
                                className="flex items-center gap-1.5 text-[10px] font-mono text-3rd"
                            >
                                {i > 0 && (
                                    <span className="text-subtle select-none">
                                        ·
                                    </span>
                                )}
                                {cap}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
