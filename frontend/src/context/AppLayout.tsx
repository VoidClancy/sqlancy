import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
} from "react";
import { Toaster } from "react-hot-toast";
import { useDb } from "../hooks/useDb";
import {
    registerGlobalShortcuts,
    useGlobalShortcuts,
} from "../hooks/useShortcuts";

export type LayoutContextValue = {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
    toggleSidebar: () => void;
    isDark: boolean;
    toggleTheme: () => void;
};

const LayoutContext = createContext<LayoutContextValue | null>(null);

export function useLayout(): LayoutContextValue {
    const ctx = useContext(LayoutContext);
    if (!ctx) throw new Error("useLayout must be used within AppLayout");
    return ctx;
}

type AppLayoutProps = {
    children: React.ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const { handleOpenDB } = useDb();
    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem("theme");
        if (saved) return saved === "dark";
        return window.matchMedia("(prefers-color-scheme: dark)").matches;
    });

    useGlobalShortcuts();
    registerGlobalShortcuts([
        {
            key: "o",
            handler: handleOpenDB,
        },
    ]);

    const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);

    const toggleTheme = useCallback(() => {
        setIsDark((prev) => {
            const next = !prev;
            localStorage.setItem("theme", next ? "dark" : "light");
            document.documentElement.classList.toggle("dark", next);
            return next;
        });
    }, []);

    useEffect(() => {
        document.documentElement.classList.toggle("dark", isDark);
    }, [isDark]);

    return (
        <LayoutContext.Provider
            value={{
                sidebarOpen,
                setSidebarOpen,
                toggleSidebar,
                isDark,
                toggleTheme,
            }}
        >
            <div className="h-screen flex overflow-hidden bg-main text-primary antialiased relative">
                {children}
                <Toaster position="bottom-right" reverseOrder={false} />
            </div>
        </LayoutContext.Provider>
    );
}
