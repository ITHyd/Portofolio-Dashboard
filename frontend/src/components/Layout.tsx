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

export function Layout() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="grid min-h-screen grid-cols-[250px_1fr]">
      <aside className="flex flex-col border-r border-bg-border bg-bg-surface/40 backdrop-blur-md">
        <div className="flex h-16 items-center gap-2 border-b border-bg-border px-5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-accent/15 text-accent shadow-glow">
            <Layers size={18} />
          </div>
          <div>
            <div className="font-display text-sm font-semibold">nxzen</div>
            <div className="text-[11px] uppercase tracking-wider text-ink-subtle">Portfolio Office</div>
          </div>
        </div>
        <nav className="mt-3 flex-1 space-y-0.5 overflow-y-auto px-3">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-accent/15 text-ink shadow-[inset_0_0_0_1px_rgba(99,102,241,0.35)]"
                    : "text-ink-muted hover:bg-bg-elevated/60 hover:text-ink"
                )
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto border-t border-bg-border bg-bg-surface/60 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-sm">{user?.full_name ?? "—"}</div>
              <div className="text-xs text-ink-subtle">{user?.role ?? ""}</div>
            </div>
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
