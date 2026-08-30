import ThemeToggle from "./ThemeToggle";
import SidebarTables from "./SidebarTables";
import ActionRow from "./ActionRow";
import SidebarHeader from "./Header";

export default function Sidebar() {
    return (
        <aside className="flex h-full w-full flex-col bg-surface select-none overflow-hidden">
            <SidebarHeader />
            <ActionRow />
            <SidebarTables />
            <ThemeToggle />
        </aside>
    );
}
