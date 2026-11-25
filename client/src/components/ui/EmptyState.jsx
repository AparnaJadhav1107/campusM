import { Link } from "react-router-dom";
import { Inbox } from "lucide-react";

/*
 * One reusable empty state for every card/list in the app.
 * Layout is always the same centred column:
 *   peach icon circle → title → description → action button BELOW (own line).
 * The action button is never rendered inline beside the text.
 */
export default function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  to,
  minHeight = 158,
}) {
  return (
    <div
      className="flex-1 flex flex-col items-center justify-center text-center px-3 py-5 w-full min-w-0"
      style={{ minHeight }}
    >
      <span className="w-10 h-10 rounded-full bg-peach grid place-items-center shrink-0">
        <Icon size={18} className="text-primary" />
      </span>
      {title && <div className="text-[13px] font-semibold mt-2.5">{title}</div>}
      {description && <p className="text-[12px] text-muted mt-1 max-w-[320px] leading-relaxed">{description}</p>}
      {actionLabel && to && (
        <Link to={to} className="btn-primary mt-3">
          {actionLabel}
        </Link>
      )}
      {actionLabel && !to && onAction && (
        <button className="btn-primary mt-3" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
