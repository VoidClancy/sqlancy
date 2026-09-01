import toast, { Toast } from "react-hot-toast";
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from "lucide-react";

export type ToastType = "error" | "success" | "info" | "warning";

const icons: Record<ToastType, React.ReactNode> = {
    error: <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />,
    success: <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />,
    warning: <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />,
    info: <Info size={18} className="text-blue-400 shrink-0 mt-0.5" />,
};

const borderStyles: Record<ToastType, string> = {
    error: "border-red-500/30 bg-red-950/60 text-red-100 shadow-red-950/40",
    success: "border-emerald-500/30 bg-emerald-950/60 text-emerald-100 shadow-emerald-950/40",
    warning: "border-amber-500/30 bg-amber-950/60 text-amber-100 shadow-amber-950/40",
    info: "border-blue-500/30 bg-blue-950/60 text-blue-100 shadow-blue-950/40",
};

interface CustomToastProps {
    t: Toast;
    message: string;
    title?: string;
    type: ToastType;
}

export function CustomToast({ t, message, title, type }: CustomToastProps) {
    return (
        <div
            className={`
                flex items-start gap-3 p-3.5 rounded-lg border shadow-xl backdrop-blur-md transition-all duration-200 max-w-md w-full pointer-events-auto select-none
                ${borderStyles[type]}
                ${t.visible ? "animate-toast-in" : "animate-toast-out"}
            `}
        >
            {icons[type]}

            <div className="flex-1 min-w-0 font-sans">
                {title && (
                    <h4 className="text-xs font-bold text-white mb-0.5 tracking-wide">
                        {title}
                    </h4>
                )}
                <p className="text-[12px] font-mono leading-relaxed break-words opacity-90">
                    {message}
                </p>
            </div>

            <button
                type="button"
                onClick={() => toast.dismiss(t.id)}
                className="text-white/60 hover:text-white transition-colors p-1 rounded hover:bg-white/10 shrink-0"
                title="Dismiss notification"
            >
                <X size={14} />
            </button>
        </div>
    );
}

export const showToast = {
    error: (message: string, title?: string) =>
        toast.custom((t) => (
            <CustomToast t={t} message={message} title={title} type="error" />
        )),
    success: (message: string, title?: string) =>
        toast.custom((t) => (
            <CustomToast t={t} message={message} title={title} type="success" />
        )),
    info: (message: string, title?: string) =>
        toast.custom((t) => (
            <CustomToast t={t} message={message} title={title} type="info" />
        )),
    warning: (message: string, title?: string) =>
        toast.custom((t) => (
            <CustomToast t={t} message={message} title={title} type="warning" />
        )),
};
