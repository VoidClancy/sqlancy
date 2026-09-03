import { useEffect } from "react";

type ShortcutHandler = () => void;

const globalShortcuts = new Map<string, ShortcutHandler>();

export function registerGlobalShortcuts(
    shortcuts: { key: string; handler: ShortcutHandler }[],
) {
    for (const { key, handler } of shortcuts) {
        globalShortcuts.set(key.toLowerCase(), handler);
    }
}

export function useGlobalShortcuts() {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!event.ctrlKey && !event.metaKey) return;

            const key = event.key.toLowerCase();
            const handler = globalShortcuts.get(key);

            if (!handler) return;

            event.preventDefault();
            handler();
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            globalShortcuts.clear();
        };
    }, []);
}

export function useShortcut(key: string, handler: ShortcutHandler) {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (
                (event.ctrlKey || event.metaKey) &&
                event.key.toLowerCase() === key.toLowerCase()
            ) {
                event.preventDefault();
                handler();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [key, handler]);
}
