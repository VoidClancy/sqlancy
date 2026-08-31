export function Empty({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-full w-full items-center justify-center text-3rd text-xs italic">
            {children}
        </div>
    );
}
