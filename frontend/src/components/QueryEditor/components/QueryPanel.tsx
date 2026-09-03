import { EditorView, keymap, lineNumbers } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { sql, SQLite } from "@codemirror/lang-sql";
import { lintGutter, linter, Diagnostic } from "@codemirror/lint";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { oneDark } from "@codemirror/theme-one-dark";
import { useCallback, useEffect, useRef } from "react";
interface QueryPanelProps {
    queryText: string;
    setQueryText: (text: string) => void;
}

function sqlLinter(view: EditorView): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    const doc = view.state.doc.toString();

    // Check unclosed single quotes
    let inSingleQuote = false;
    let singleQuoteStart = -1;
    for (let i = 0; i < doc.length; i++) {
        if (doc[i] === "'") {
            if (inSingleQuote) {
                inSingleQuote = false;
            } else {
                inSingleQuote = true;
                singleQuoteStart = i;
            }
        }
    }
    if (inSingleQuote && singleQuoteStart !== -1) {
        diagnostics.push({
            from: singleQuoteStart,
            to: doc.length,
            severity: "error",
            message: "Unclosed string literal",
        });
    }

    // Check unclosed double quotes
    let inDoubleQuote = false;
    let doubleQuoteStart = -1;
    for (let i = 0; i < doc.length; i++) {
        if (doc[i] === '"') {
            if (inDoubleQuote) {
                inDoubleQuote = false;
            } else {
                inDoubleQuote = true;
                doubleQuoteStart = i;
            }
        }
    }
    if (inDoubleQuote && doubleQuoteStart !== -1) {
        diagnostics.push({
            from: doubleQuoteStart,
            to: doc.length,
            severity: "error",
            message: "Unclosed identifier quote",
        });
    }

    // Check unmatched parentheses
    let depth = 0;
    let lastOpen = -1;
    for (let i = 0; i < doc.length; i++) {
        if (doc[i] === "(") {
            depth++;
            lastOpen = i;
        } else if (doc[i] === ")") {
            depth--;
            if (depth < 0) {
                diagnostics.push({
                    from: i,
                    to: i + 1,
                    severity: "error",
                    message: "Unexpected closing parenthesis",
                });
                depth = 0;
            }
        }
    }
    if (depth > 0 && lastOpen !== -1) {
        diagnostics.push({
            from: lastOpen,
            to: lastOpen + 1,
            severity: "error",
            message: "Unclosed parenthesis",
        });
    }

    return diagnostics;
}

export function QueryPanel({ queryText, setQueryText }: QueryPanelProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);
    const isResizing = useRef(false);
    const startY = useRef(0);
    const startHeight = useRef(0);

    useEffect(() => {
        if (!editorRef.current) return;

        const startState = EditorState.create({
            doc: queryText,
            extensions: [
                history(),
                keymap.of([...defaultKeymap, ...historyKeymap]),
                sql({ dialect: SQLite }),
                oneDark,
                linter(sqlLinter),
                lintGutter(),
                lineNumbers(),
                EditorView.updateListener.of((update) => {
                    if (update.docChanged) {
                        setQueryText(update.state.doc.toString());
                    }
                }),

                EditorView.theme({
                    "&": {
                        height: "100%",
                        fontSize: "13px",
                        fontFamily:
                            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                        backgroundColor: "transparent",
                    },
                    ".cm-scroller": { overflow: "auto" },
                    ".cm-content": { caretColor: "var(--color-primary)" },
                    ".cm-gutters": {
                        backgroundColor: "transparent",
                        border: "none",
                        color: "var(--color-3rd)",
                    },
                    ".cm-activeLineGutter": { backgroundColor: "transparent" },
                    ".cm-activeLine": {
                        backgroundColor: "rgba(255,255,255,0.03)",
                    },
                    ".cm-cursor": {
                        borderLeftColor: "var(--color-action-accent)",
                    },
                }),
            ],
        });

        const view = new EditorView({
            state: startState,
            parent: editorRef.current,
        });
        viewRef.current = view;

        return () => view.destroy();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sync external state → editor (e.g. when loaded externally)
    useEffect(() => {
        const view = viewRef.current;
        if (!view) return;
        const current = view.state.doc.toString();
        if (current !== queryText) {
            view.dispatch({
                changes: { from: 0, to: current.length, insert: queryText },
            });
        }
    }, [queryText]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        isResizing.current = true;
        startY.current = e.clientY;
        startHeight.current = containerRef.current?.offsetHeight ?? 176;
        document.body.style.cursor = "ns-resize";
        document.body.style.userSelect = "none";

        const onMouseMove = (e: MouseEvent) => {
            if (!isResizing.current || !containerRef.current) return;
            const newHeight = Math.max(
                80,
                Math.min(600, startHeight.current + e.clientY - startY.current),
            );
            containerRef.current.style.height = `${newHeight}px`;
        };
        const onMouseUp = () => {
            isResizing.current = false;
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
        };
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
    }, []);

    return (
        <div
            ref={containerRef}
            className="relative shrink-0 overflow-hidden bg-surface p-3 flex flex-col h-44"
        >
            <div
                ref={editorRef}
                className="flex-1 min-h-0 bg-main rounded-md border border-subtle focus-within:border-action-accent transition-colors overflow-hidden"
            />
            <div
                onMouseDown={handleMouseDown}
                className="absolute bottom-0 left-0 right-0 h-1 cursor-ns-resize group"
            >
                <div className="absolute inset-x-0 top-0 bg-subtle h-2 transition-colors group-hover:bg-action-accent-hover" />
            </div>
        </div>
    );
}
