import { Code2, Check, Copy, Loader2, Play } from "lucide-react";

interface ToolbarProps {
    executing: boolean;
    queryText: string;
    copied: boolean;
    onCopy: () => void;
    onRun: () => void;
}

export function Toolbar({
    executing,
    queryText,
    copied,
    onCopy,
    onRun,
}: ToolbarProps) {
    return (
        <div className="shrink-0 border-b border-subtle bg-surface px-4 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
                <Code2 size={18} className="text-action shrink-0" />
                <h1 className="text-sm font-bold text-primary">
                    SQL Query Editor
                </h1>
                <span className="text-[11px] text-3rd font-mono">
                    Press Ctrl+Enter to run
                </span>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={onCopy}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-subtle bg-main text-xs text-secondary hover:bg-surface hover:text-primary transition-colors"
                >
                    {copied ? (
                        <Check size={13} className="text-emerald-500" />
                    ) : (
                        <Copy size={13} />
                    )}
                    {copied ? "Copied" : "Copy SQL"}
                </button>
                <button
                    onClick={onRun}
                    disabled={executing || !queryText.trim()}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-md bg-action-accent text-xs font-semibold text-action hover:bg-action-accent-hover active:bg-action-accent-active disabled:opacity-50 transition-colors shadow-sm"
                >
                    {executing ? (
                        <>
                            <Loader2 size={14} className="animate-spin" />{" "}
                            Executing...
                        </>
                    ) : (
                        <>
                            <Play size={14} className="fill-current" /> Run
                            Query
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
