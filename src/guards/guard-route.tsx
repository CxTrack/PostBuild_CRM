import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useVisibleModules } from "../hooks/useVisibleModules";

interface ProtectedRouteProps {
  user?: any;
  moduleId?: string;
}

export default function ProtectedRoute({ moduleId }: ProtectedRouteProps) {
  const { visibleModules } = useVisibleModules();
  const location = useLocation();

  if (moduleId) {
    const module = visibleModules.find(m => m.id === moduleId);

    // Check if the module is in the visible list for this industry
    const isModuleInTemplate = !!module;

    // Check if it's locked by the plan
    const isLocked = module?.isLocked;

    if (!isModuleInTemplate || isLocked) {
      console.warn(`[RouteGuard] Access denied to module: ${moduleId}. Locked: ${isLocked}, InTemplate: ${isModuleInTemplate}`);
      return <Navigate to="/dashboard/upgrade" state={{ from: location.pathname, moduleId }} replace />;
    }
  }

  return <Outlet />;
}

