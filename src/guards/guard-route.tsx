import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useVisibleModules } from "../hooks/useVisibleModules";
import { useOrganizationStore } from "../stores/organizationStore";

interface ProtectedRouteProps {
  user?: any;
  moduleId?: string;
}

export default function ProtectedRoute({ moduleId }: ProtectedRouteProps) {
  const { visibleModules } = useVisibleModules();
  const location = useLocation();

  if (!moduleId) {
    return <Outlet />;
  }

  const module = visibleModules.find(m => m.id === moduleId);
  const isLocked = module?.isLocked;

  if (module && isLocked) {
    return <Navigate to="/dashboard/upgrade" state={{ from: location.pathname, moduleId }} replace />;
  }

  return <Outlet />;
}

