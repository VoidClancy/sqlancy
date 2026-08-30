import { Moon, Sun } from "lucide-react";
import { useLayout } from "../AppLayout";

export default function ThemeToggle() {
    const { isDark, toggleTheme, sidebarOpen } = useLayout();
    const collapsed = !sidebarOpen;

    return (
        <div className="shrink-0 border-t border-subtle p-2 flex justify-center">
            <button
                onClick={toggleTheme}
                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 w-full text-3rd hover:bg-main hover:text-primary transition-colors ${
                    collapsed ? "justify-center px-0" : ""
                }`}
            >
                {isDark ? (
                    <Sun size={16} className="shrink-0 text-amber-400" />
                ) : (
                    <Moon size={16} className="shrink-0" />
                )}
                {!collapsed && (
                    <span className="text-xs font-medium text-secondary truncate">
                        {isDark ? "Light Mode" : "Dark Mode"}
                    </span>
                )}
            </button>
        </div>
    );
}
