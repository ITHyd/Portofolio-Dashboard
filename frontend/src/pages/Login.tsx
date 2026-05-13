import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogIn, ShieldCheck } from "lucide-react";
import { useAuth } from "@/store/auth";

export function Login() {
  const navigate = useNavigate();
  const login = useAuth((s) => s.login);
  const loading = useAuth((s) => s.loading);
  const [email, setEmail] = useState("admin@nxzen.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      navigate("/");
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Login failed");
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="pointer-events-none absolute inset-0 bg-aurora"
      />
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,rgba(130,149,171,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(130,149,171,0.08)_1px,transparent_1px)] [background-size:42px_42px] [mask-image:radial-gradient(circle_at_center,#000_35%,transparent_90%)]" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="card relative w-full max-w-md p-8"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-ink shadow-glow">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="eyebrow mb-2">Future Foresight</div>
            <h1 className="font-display text-[1.9rem] font-semibold">nxzen Portfolio Office</h1>
            <p className="text-sm text-ink-muted">Sign in to continue into the Cadent-style NxZen workspace.</p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="you@nxzen.com"
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="........"
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-rag-red/40 bg-rag-red/10 px-3 py-2 text-sm text-rag-red"
            >
              {error}
            </motion.div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            <LogIn size={16} />
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-ink-subtle">
          Default: <span className="text-ink-muted">admin@nxzen.com / admin123</span>
        </p>
      </motion.div>
    </div>
  );
}
