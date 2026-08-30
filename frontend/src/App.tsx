import { BrowserRouter } from "react-router-dom";
import "./App.css";
import AppLayout, { useLayout } from "./context/AppLayout";
import Router from "./components/Router";
import Sidebar from "./components/Sidebar/Sidebar";
import { DbProvider } from "./context/DbContext";

function AppShell() {
    const { sidebarOpen } = useLayout();

    return (
        <>
            <div
                className={`shrink-0 flex flex-col bg-surface border-r border-subtle transition-all duration-200 ${
                    sidebarOpen ? "w-64" : "w-[68px]"
                }`}
            >
                <Sidebar />
            </div>

            <div className="flex min-w-0 flex-1 flex-col h-full overflow-hidden">
                <Router />
            </div>
        </>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <DbProvider>
                <AppLayout>
                    <AppShell />
                </AppLayout>
            </DbProvider>
        </BrowserRouter>
    );
}
