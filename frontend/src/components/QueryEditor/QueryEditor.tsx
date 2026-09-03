import { AlertCircle } from "lucide-react";

import { useQueryEditor } from "./hooks/useQueryEditor";
import { QueryPanel } from "./components/QueryPanel";
import { Toolbar } from "./components/Toolbar";
import { ResultsBar } from "./components/ResultsBar";
import { ResultsGrid } from "./components/ResultsGrid";
import { Empty } from "./components/Empty";
import { ExecutionLog } from "./components/ExecutionLog";

export default function QueryEditorView() {
    const {
        queryText,
        setQueryText,
        result,
        error,
        executing,
        activeTab,
        setActiveTab,
        copied,
        copySQL,
        runQuery,
    } = useQueryEditor();

    const showEmptyResults = !result || !result.isSelect;

    return (
        <div className="flex flex-col h-full w-full bg-page overflow-hidden select-none">
            <Toolbar
                executing={executing}
                queryText={queryText}
                copied={copied}
                onCopy={copySQL}
                onRun={runQuery}
            />

            <QueryPanel queryText={queryText} setQueryText={setQueryText} />

            <ResultsBar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                result={result}
                error={error}
            />

            <div className="flex-1 overflow-auto relative bg-page">
                {activeTab === "results" ? (
                    error ? (
                        <div className="m-4 p-3.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono flex items-start gap-2.5">
                            <AlertCircle
                                size={16}
                                className="shrink-0 mt-0.5"
                            />
                            <div className="whitespace-pre-wrap leading-relaxed">
                                {error}
                            </div>
                        </div>
                    ) : showEmptyResults ? (
                        <Empty>
                            {result
                                ? "Query executed without returning rows."
                                : "Run a query to view result grid."}
                        </Empty>
                    ) : (
                        <ResultsGrid result={result!} />
                    )
                ) : (
                    <ExecutionLog result={result} error={error} />
                )}
            </div>
        </div>
    );
}
