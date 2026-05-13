import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  BarChart3,
  Briefcase,
  CheckCircle2,
  Flag,
  Layers,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Smile,
  Users,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/store/auth";
import { cn } from "@/lib/cn";
import { ImportButton } from "@/components/ImportButton";

const NAV = [
  { to: "/", label: "Dashboard", icon: BarChart3, end: true },
  { to: "/projects", label: "Project Register", icon: Briefcase },
  { to: "/weekly-status", label: "Weekly Status", icon: Flag },
  { to: "/risks-issues", label: "Risks & Issues", icon: AlertTriangle },
  { to: "/escalations", label: "Escalations", icon: AlertTriangle },
  { to: "/commercial", label: "Commercial", icon: Wallet },
  { to: "/resources", label: "Resources", icon: Users },
  { to: "/csat", label: "Client Satisfaction", icon: Smile },
  { to: "/governance", label: "Governance", icon: CheckCircle2 },
];

const SIDEBAR_COLLAPSED_KEY = "nxzen.sidebar.collapsed";

export function Layout() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
  });

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  const sidebarWidth = collapsed ? 72 : 250;

  return (
    <div className="page-shell min-h-screen">
      <aside
        style={{ width: sidebarWidth }}
        className="fixed inset-y-0 left-0 z-30 flex flex-col border-r border-black/5 bg-[#111318] text-white shadow-[18px_0_36px_-28px_rgba(3,3,4,0.65)] transition-[width] duration-200"
      >
        <div
          className={cn(
            "flex h-20 items-center gap-3 border-b border-white/10",
            collapsed ? "justify-center px-2" : "px-5"
          )}
        >
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-[#111318] shadow-glow">
            <Layers size={18} />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="font-display text-base font-semibold tracking-[-0.02em] text-white">nxzen</div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent/85">Portfolio Office</div>
            </div>
          )}
          {!collapsed && (
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="shrink-0 rounded-lg p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose size={14} />
            </button>
          )}
        </div>
        {collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="mx-auto mt-3 rounded-lg p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen size={14} />
          </button>
        )}
        <nav className={cn("mt-4 flex-1 space-y-1 overflow-y-auto", collapsed ? "px-2" : "px-3")}>
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                cn(
                  "relative flex items-center rounded-xl text-sm transition-colors",
                  collapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2",
                  isActive
                    ? "bg-white/10 text-white shadow-[inset_3px_0_0_0_rgb(var(--accent))]"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                )
              }
            >
              <Icon size={16} />
              {!collapsed && label}
            </NavLink>
          ))}
        </nav>

        <div
          className={cn(
            "mt-auto border-t border-white/10 bg-black/10 py-4",
            collapsed ? "px-2" : "px-4"
          )}
        >
          <div className={cn("flex items-center gap-2", collapsed ? "justify-center" : "justify-between")}>
            {!collapsed && (
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-white">{user?.full_name ?? "-"}</div>
                <div className="text-xs uppercase tracking-[0.14em] text-white/45">{user?.role ?? ""}</div>
              </div>
            )}
            <button
              className="shrink-0 rounded-lg p-2 text-red-300 transition-colors hover:bg-red-400/10 hover:text-red-200"
              onClick={() => {
                logout();
                navigate("/login");
              }}
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      <main
        style={{ marginLeft: sidebarWidth }}
        className="relative min-h-screen overflow-x-hidden transition-[margin-left] duration-200"
      >
        <header className="sticky top-0 z-20 border-b border-bg-border bg-bg-base/90 px-8 py-5 backdrop-blur-md">
          <div className="flex items-center justify-between gap-6">
            <div className="min-w-0 flex-1">
              <div className="eyebrow">
                <Menu size={12} />
                Active Portfolio
              </div>
              <div className="mt-1 truncate font-display text-[1.45rem] font-semibold leading-tight text-ink">
                nxzen UK Portfolio Office
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <ImportButton />
              <span className="whitespace-nowrap rounded-full border border-bg-border bg-white/75 px-3 py-2 text-xs font-semibold text-ink-muted">
                Welcome, {user?.full_name?.split(" ")[0]}
              </span>
            </div>
          </div>
          <p className="mt-2 text-sm leading-snug text-ink-muted">
            Operational delivery, commercial health, governance, and escalation visibility in one workspace.
          </p>
        </header>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="px-8 py-6"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
