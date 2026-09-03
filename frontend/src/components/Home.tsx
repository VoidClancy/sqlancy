import { Loader2, FolderOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDbStore } from "../store/useDbStore";
import { useDb } from "../hooks/useDb";

export default function HomeView() {
    const { loading } = useDbStore();

    const { handleOpenDB } = useDb();

    return (
        <div className="flex h-full w-full flex-col items-center justify-center bg-page select-none overflow-auto">
            <div className="flex flex-col items-center gap-8 px-8 max-w-sm w-full">
                <div className="text-center">
                    <h1 className="font-mono text-3xl font-bold tracking-tight text-primary leading-none">
                        SQL
                        <span className="text-secondary">ancy</span>
                    </h1>
                    <p className="mt-2 text-sm text-3rd">
                        A simple, minimal Sqlite browser.
                    </p>
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
                    or pick one from recents.
                </p>
            </div>
        </div>
    );
}
