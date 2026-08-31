import ThemeToggle from "./components/ThemeToggle";
import SidebarTables from "./components/SidebarTables";
import ActionRow from "./components/ActionRow";
import SidebarHeader from "./components/Header";
import RecentDBs from "./components/RecentDBs";
import { useLayout } from "../../context/AppLayout";

export default function Sidebar() {
    const { sidebarOpen } = useLayout();
    const collapsed = !sidebarOpen;

    return (
        <aside className="flex h-full w-full flex-col bg-surface select-none overflow-hidden">
            <SidebarHeader />
            <ActionRow />
            <div
                className={`flex-1 min-h-0 overflow-y-auto py-2 space-y-3 ${
                    collapsed ? "px-2" : "px-3"
                }`}
            >
                <RecentDBs />
                <SidebarTables />
            </div>
            <ThemeToggle />
        </aside>
    );
}
