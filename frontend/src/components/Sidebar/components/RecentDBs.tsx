import { ChevronDown, Database, X, AlertTriangle } from "lucide-react";
import { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useLayout } from "../../../context/AppLayout";
import { useDbStore } from "../../../store/useDbStore";
import { useNavigate } from "react-router-dom";
import { RecentDB } from "../../../lib";

export default function RecentDBs() {
    const [open, setOpen] = useState(true);
    const [dbToRemove, setDbToRemove] = useState<RecentDB | null>(null);
    const [isClosingModal, setIsClosingModal] = useState(false);
    const { recentDBs, dbPath, openDatabase, removeRecentDB } = useDbStore();
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
            // Error toast is handled by useDbStore
        }
    };

    const handleStartRemove = (e: React.MouseEvent, item: RecentDB) => {
        e.stopPropagation();
        setIsClosingModal(false);
        setDbToRemove(item);
    };

    const closeModalWithAnimation = useCallback((onComplete?: () => void) => {
        setIsClosingModal(true);
        setTimeout(() => {
            setDbToRemove(null);
            setIsClosingModal(false);
            if (onComplete) onComplete();
        }, 180);
    }, []);

    const handleConfirmRemove = async () => {
        if (!dbToRemove) return;
        const targetPath = dbToRemove.path;
        closeModalWithAnimation(async () => {
            await removeRecentDB(targetPath);
        });
    };

    const handleClick = () => {
        setOpen(true);
        toggleSidebar();
    };

    return (
        <>
            {!collapsed ? (
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
                                            <li
                                                key={item.path}
                                                className="group relative flex items-center"
                                            >
                                                <button
                                                    onClick={() =>
                                                        handleSelectRecent(item.path)
                                                    }
                                                    title={`Name: ${item.name}\nPath: ${item.path}`}
                                                    className={`flex flex-col w-full rounded px-2.5 py-1.5 pr-7 text-left transition-colors truncate ${
                                                        isActive
                                                            ? "bg-action-accent/15 text-action font-semibold"
                                                            : "text-secondary hover:bg-main hover:text-primary"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <Database
                                                            size={13}
                                                            className={
                                                                isActive
                                                                    ? "text-action shrink-0"
                                                                    : "text-3rd shrink-0"
                                                            }
                                                        />
                                                        <span className="truncate text-[12.5px]">
                                                            {item.name}
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] text-3rd font-mono truncate pl-5 opacity-70 group-hover:opacity-100 transition-opacity">
                                                        {item.path}
                                                    </span>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={(e) =>
                                                        handleStartRemove(e, item)
                                                    }
                                                    title={`Remove ${item.name} from recent list`}
                                                    className="absolute right-1 top-2.5 opacity-0 group-hover:opacity-100 p-1 text-3rd hover:text-red-400 transition-all rounded hover:bg-surface"
                                                >
                                                    <X size={13} />
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
            )}

            {/* Portal-rendered Fullscreen Confirmation Modal Overlay */}
            {dbToRemove &&
                createPortal(
                    <div
                        className={`fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 select-none ${
                            isClosingModal ? "animate-overlay-out" : "animate-overlay-in"
                        }`}
                        onClick={() => closeModalWithAnimation()}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className={`w-full max-w-sm rounded-xl border border-subtle bg-surface p-5 shadow-2xl space-y-4 ${
                                isClosingModal ? "animate-modal-out" : "animate-modal-in"
                            }`}
                        >
                            <div className="flex items-start gap-3.5">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-400">
                                    <AlertTriangle size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-semibold text-primary">
                                        Remove Recent Database
                                    </h3>
                                    <p className="mt-1 text-xs text-secondary leading-relaxed">
                                        Are you sure you want to remove{" "}
                                        <span className="font-semibold text-primary">
                                            "{dbToRemove.name}"
                                        </span>{" "}
                                        from your recent list?
                                    </p>
                                    <div className="mt-2.5 p-2 rounded-md bg-main border border-subtle font-mono text-[11px] text-3rd truncate">
                                        {dbToRemove.path}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-subtle">
                                <button
                                    type="button"
                                    onClick={() => closeModalWithAnimation()}
                                    className="px-3.5 py-1.5 rounded-md border border-subtle bg-main text-xs font-medium text-secondary hover:bg-surface hover:text-primary transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmRemove}
                                    className="px-3.5 py-1.5 rounded-md bg-red-500 text-xs font-semibold text-white hover:bg-red-600 active:bg-red-700 transition-colors shadow-sm"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body,
                )}
        </>
    );
}
