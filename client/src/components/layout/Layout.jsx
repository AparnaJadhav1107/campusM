import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  MessageSquareWarning,
  ListOrdered,
  Flame,
  Map,
  Shapes,
  BarChart3,
  History,
  Settings,
  LogOut,
  Search,
  Bell,
  ChevronDown,
  Menu,
  LayoutGrid,
  X,
} from "lucide-react";
import { useAuthStore, useUIStore } from "../../store/index.js";
import { api } from "../../services/api.js";

const LINKS = [
  ["/", "Dashboard", LayoutDashboard],
  ["/students", "Students", Users],
  ["/complaints", "Complaints", MessageSquareWarning],
  ["/queue", "Complaint Queue", ListOrdered],
  ["/priority", "Priority Requests", Flame],
  ["/resources", "Campus Resources", Map],
  ["/dsa", "DSA Visualizer", Shapes],
  ["/reports", "Reports", BarChart3],
  ["/activity", "Activity History", History],
  ["/settings", "Settings", Settings],
];

function SidebarBody({ onNavigate }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <>
      <div className="flex items-center gap-2 px-3 pt-4 pb-3">
        <span className="w-8 h-8 rounded-lg bg-primary text-white grid place-items-center shrink-0">
          <LayoutGrid size={15} />
        </span>
        <div className="leading-tight min-w-0">
          <div className="font-bold text-[13px] truncate">Smart Campus</div>
          <div className="text-[11px] text-muted">Management System</div>
        </div>
        <button
          className="ml-auto lg:hidden text-muted hover:text-ink transition-colors"
          onClick={onNavigate}
          aria-label="Close menu"
        >
          <X size={17} />
        </button>
      </div>

      <nav className="app-sidebar-nav">
        {LINKS.map(([to, label, Icon]) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            onClick={onNavigate}
            className={({ isActive }) => "navlink" + (isActive ? " active" : "")}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-2 border-t border-line">
        <button
          className="navlink w-full"
          onClick={() => {
            logout();
            onNavigate?.();
            navigate("/login");
          }}
        >
          <LogOut size={16} />
          Logout
        </button>
        <div className="px-2 pt-1 pb-1 text-[11px] text-muted">
          Signed in as <b className="text-ink">{user?.name || "Guest"}</b> ·{" "}
          <span className="capitalize">{user?.role || ""}</span>
        </div>
      </div>
    </>
  );
}

export default function Layout() {
  const { user } = useAuthStore();
  const { sidebarOpen, setSidebar, toast } = useUIStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [pendingCount, setPendingCount] = useState(0);

  const title =
    LINKS.find(([to]) => to === location.pathname)?.[1] ||
    (location.pathname.startsWith("/complaints/") ? "Complaint Detail" : "Smart Campus");

  // Real notification count: pending complaints from the API, refreshed per route.
  useEffect(() => {
    let alive = true;
    api("/notifications")
      .then((d) => {
        if (alive) setPendingCount(d.pendingComplaints ?? 0);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [location.pathname]);

  const submitSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    // Numeric queries are student IDs (Students page); anything else searches complaints.
    const target = /^\d+$/.test(q) ? "/students" : "/complaints";
    navigate(`${target}?search=${encodeURIComponent(q)}`);
  };

  return (
    <div className="app-shell">
      {/* Desktop sidebar — fixed, never scrolls with content */}
      <aside className="app-sidebar hidden lg:flex">
        <SidebarBody onNavigate={() => {}} />
      </aside>

      {/* Mobile drawer */}
      <div
        className={"drawer-backdrop lg:hidden" + (sidebarOpen ? " open" : "")}
        onClick={() => setSidebar(false)}
      />
      <aside className={"drawer-panel lg:hidden" + (sidebarOpen ? " open" : "")}>
        <div className="app-sidebar h-full shadow-2xl">
          <SidebarBody onNavigate={() => setSidebar(false)} />
        </div>
      </aside>

      {/* Right column: fixed header + the ONLY scrolling area */}
      <div className="app-main-col">
        <header className="app-header">
          <button
            className="lg:hidden btn-ghost !px-2 shrink-0"
            onClick={() => setSidebar(true)}
            aria-label="Open menu"
          >
            <Menu size={17} />
          </button>
          <h1 className="page-title truncate">{title}</h1>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <form onSubmit={submitSearch} className="relative hidden sm:block">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search students, complaints…"
                className="input !rounded-full !pl-8 w-[190px] xl:w-[250px]"
              />
            </form>

            <button
              className="relative w-9 h-9 shrink-0 grid place-items-center rounded-full bg-white border border-line hover:bg-[#f7f5f2] transition-colors"
              onClick={() => navigate("/complaints")}
              aria-label="Pending complaints"
              title="Pending complaints"
            >
              <Bell size={16} />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-danger text-white text-[10px] font-bold grid place-items-center pop-in">
                  {pendingCount}
                </span>
              )}
            </button>

            <div className="flex items-center gap-2 pl-1">
              <span className="w-8 h-8 rounded-full bg-peach grid place-items-center font-bold text-primary text-[13px] shrink-0">
                {(user?.name || "U").slice(0, 1)}
              </span>
              <span className="leading-tight hidden md:block">
                <b className="block text-[13px]">{user?.name || "Guest"}</b>
                <small className="text-muted capitalize text-[11px]">{user?.role || ""}</small>
              </span>
              <ChevronDown size={14} className="text-muted hidden md:block" />
            </div>
          </div>
        </header>

        {/* Mobile search row (inside the fixed header area, below title bar on small screens is avoided — search lives in content top) */}
        <main className="app-content">
          <form onSubmit={submitSearch} className="relative sm:hidden mb-3">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search students, complaints…"
              className="input !rounded-full !pl-8"
            />
          </form>
          <div key={location.pathname} className="fade-up">
            <Outlet />
          </div>
        </main>
      </div>

      {toast && (
        <div className="fixed bottom-5 right-5 z-[60] bg-ink text-white px-4 py-2.5 rounded-lg toast-in shadow-xl text-[13px] max-w-[86vw]">
          {toast}
        </div>
      )}
    </div>
  );
}
