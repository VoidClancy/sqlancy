import { ChevronDown, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { DropdownOption } from "../../types/DropdownOption";

interface DropdownProps<T> {
    value: T;
    options: DropdownOption<T>[];
    onChange: (value: T) => void;
    className?: string;
}

export function Dropdown<T>({
    value,
    options,
    onChange,
    className = "",
}: DropdownProps<T>) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const selectedOption = options.find((option) => option.value === value);
    const displayLabel = selectedOption?.label ?? (value ? String(value) : "");

    return (
        <div ref={ref} className={`relative ${className}`}>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    setOpen((prev) => !prev);
                }}
                className="
                    flex h-8 w-full items-center justify-between
                    gap-2 px-2.5
                    bg-main text-xs text-primary
                    outline-none select-none cursor-pointer
                    transition-colors hover:bg-surface
                "
            >
                <span className="truncate">{displayLabel}</span>

                <ChevronDown
                    size={13}
                    className={`
                        shrink-0 text-3rd
                        transition-transform duration-150
                        ${open ? "rotate-180" : ""}
                    `}
                />
            </button>

            {open && (
                <div
                    className="
                        absolute left-0 top-[calc(100%+4px)]
                        z-50 min-w-full w-max max-w-[240px]
                        max-h-60 overflow-y-auto
                        rounded-md border border-subtle
                        bg-surface p-1 shadow-xl
                    "
                >
                    {options.map((option, index) => {
                        const selected = option.value === value;

                        return (
                            <button
                                key={index}
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onChange(option.value);
                                    setOpen(false);
                                }}
                                className={`
                                    flex w-full items-center justify-between
                                    gap-3 rounded px-2.5 py-1.5
                                    text-left text-xs select-none cursor-pointer
                                    transition-colors
                                    ${
                                        selected
                                            ? "bg-main text-primary font-semibold"
                                            : "text-secondary hover:bg-main hover:text-primary"
                                    }
                                `}
                            >
                                <span className="truncate">{option.label}</span>

                                {selected && (
                                    <Check
                                        size={13}
                                        className="shrink-0 text-action"
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
