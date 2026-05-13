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
  PanelLeftClose,
  PanelLeftOpen,
  Smile,
  Users,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/store/auth";
import { cn } from "@/lib/cn";
import { ThemeToggle } from "@/components/ThemeToggle";
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

  return (
    <div
      className={cn(
        "grid min-h-screen transition-[grid-template-columns] duration-200",
        collapsed ? "grid-cols-[72px_1fr]" : "grid-cols-[250px_1fr]"
      )}
    >
      <aside className="flex flex-col border-r border-bg-border bg-bg-surface/40 backdrop-blur-md">
        <div
          className={cn(
            "flex h-16 items-center gap-2 border-b border-bg-border",
            collapsed ? "justify-center px-2" : "px-5"
          )}
        >
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent shadow-glow">
            <Layers size={18} />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="font-display text-sm font-semibold">nxzen</div>
              <div className="text-[11px] uppercase tracking-wider text-ink-subtle">Portfolio Office</div>
            </div>
          )}
          {!collapsed && (
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="shrink-0 rounded-lg border border-bg-border p-1.5 text-ink-muted hover:text-ink"
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
            className="mx-auto mt-2 rounded-lg border border-bg-border p-1.5 text-ink-muted hover:text-ink"
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen size={14} />
          </button>
        )}
        <nav className={cn("mt-3 flex-1 space-y-0.5 overflow-y-auto", collapsed ? "px-2" : "px-3")}>
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                cn(
                  "flex items-center rounded-xl text-sm transition-colors",
                  collapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2",
                  isActive
                    ? "bg-accent/15 text-ink shadow-[inset_0_0_0_1px_rgba(99,102,241,0.35)]"
                    : "text-ink-muted hover:bg-bg-elevated/60 hover:text-ink"
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
            "mt-auto border-t border-bg-border bg-bg-surface/60 py-3",
            collapsed ? "px-2" : "px-4"
          )}
        >
          <div className={cn("flex items-center gap-2", collapsed ? "justify-center" : "justify-between")}>
            {!collapsed && (
              <div className="min-w-0">
                <div className="truncate text-sm">{user?.full_name ?? "—"}</div>
                <div className="text-xs text-ink-subtle">{user?.role ?? ""}</div>
              </div>
            )}
            <button
              className="shrink-0 rounded-lg border border-bg-border p-2 text-ink-muted hover:text-ink"
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

      <main className="relative overflow-x-hidden">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-bg-border bg-bg-base/60 px-8 backdrop-blur-md">
          <div>
            <div className="text-xs uppercase tracking-wider text-ink-subtle">Portfolio</div>
            <div className="font-display text-lg font-semibold">nxzen UK · Active Portfolio</div>
          </div>
          <div className="flex items-center gap-3">
            <ImportButton />
            <span className="text-xs text-ink-muted">Welcome, {user?.full_name?.split(" ")[0]}</span>
            <ThemeToggle />
          </div>
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
