import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@/store/auth";
import { Layout } from "@/components/Layout";
import { Login } from "@/pages/Login";
import { Dashboard } from "@/pages/Dashboard";
import { Projects } from "@/pages/Projects";
import { WeeklyStatus } from "@/pages/WeeklyStatus";
import { RisksIssues } from "@/pages/RisksIssues";
import { Escalations } from "@/pages/Escalations";
import { Commercial } from "@/pages/Commercial";
import { Resources } from "@/pages/Resources";
import { Csat } from "@/pages/Csat";
import { Governance } from "@/pages/Governance";

function Protected({ children }: { children: JSX.Element }) {
  const token = useAuth((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const hydrate = useAuth((s) => s.hydrate);
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="projects" element={<Projects />} />
        <Route path="weekly-status" element={<WeeklyStatus />} />
        <Route path="risks-issues" element={<RisksIssues />} />
        <Route path="escalations" element={<Escalations />} />
        <Route path="commercial" element={<Commercial />} />
        <Route path="resources" element={<Resources />} />
        <Route path="csat" element={<Csat />} />
        <Route path="governance" element={<Governance />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
