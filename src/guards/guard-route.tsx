import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useVisibleModules } from "../hooks/useVisibleModules";
import { useOrganizationStore } from "../stores/organizationStore";

interface ProtectedRouteProps {
  user?: any;
  moduleId?: string;
}

export default function ProtectedRoute({ moduleId }: ProtectedRouteProps) {
  const { visibleModules } = useVisibleModules();
  const { currentOrganization, loading } = useOrganizationStore();
  const location = useLocation();

  // If organization is still loading, allow access (will recheck when loaded)
  if (loading) {
    return <Outlet />;
  }

  if (moduleId) {
    // If no organization is set yet, be permissive and allow access
    // This handles the case where user just logged in but org data isn't loaded
    if (!currentOrganization) {
      console.log(`[RouteGuard] No organization loaded, allowing access to: ${moduleId}`);
      return <Outlet />;
    }

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

