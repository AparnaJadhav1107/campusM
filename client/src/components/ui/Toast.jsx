import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { useUIStore } from "../../store/index.js";

const TYPES = {
  success: { Icon: CheckCircle2, iconClass: "text-success", barClass: "border-l-success" },
  error: { Icon: XCircle, iconClass: "text-danger", barClass: "border-l-danger" },
  info: { Icon: Info, iconClass: "text-primary", barClass: "border-l-primary" },
};

const AUTO_DISMISS_MS = 3500;
const EXIT_MS = 200;

function ToastItem({ toast }) {
  const dismissToast = useUIStore((s) => s.dismissToast);
  const [leaving, setLeaving] = useState(false);
  const { Icon, iconClass, barClass } = TYPES[toast.type] || TYPES.info;

  const close = () => {
    setLeaving(true);
    setTimeout(() => dismissToast(toast.id), EXIT_MS);
  };

  useEffect(() => {
    const t = setTimeout(close, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast.id]);

  return (
    <div
      role="status"
      className={
        "pointer-events-auto flex items-start gap-2.5 bg-white border border-line border-l-4 rounded-lg shadow-[0_10px_28px_rgba(34,34,34,0.14)] px-3 py-2.5 text-[13px] " +
        barClass +
        " " +
        (leaving ? "toast-out" : "toast-in")
      }
    >
      <Icon size={17} className={iconClass + " shrink-0 mt-[1px]"} />
      <p className="flex-1 min-w-0 leading-snug pt-[1px]">{toast.message}</p>
      <button
        onClick={close}
        aria-label="Dismiss notification"
        className="shrink-0 text-muted hover:text-ink transition-colors mt-[1px]"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default function Toasts() {
  const toasts = useUIStore((s) => s.toasts);
  return (
    <div className="fixed z-[100] top-3 inset-x-3 flex flex-col gap-2 pointer-events-none sm:inset-x-auto sm:right-5 sm:top-[66px] sm:w-[350px]">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
