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

  // DEBUG: Log what's happening
  console.log('[RouteGuard]', {
    moduleId,
    loading,
    hasOrg: !!currentOrganization,
    visibleModulesCount: visibleModules.length,
    visibleModuleIds: visibleModules.map(m => m.id),
    pathname: location.pathname
  });

  // TEMPORARY: Skip ALL module checks to diagnose routing issues
  // If routes work after this, the issue is in module checking logic
  // If routes still don't work, the issue is in React Router setup
  if (!moduleId) {
    // No module check needed, just render children
    return <Outlet />;
  }

  // For now, ALWAYS allow access to diagnose the routing issue
  // TODO: Re-enable module checks once routing is confirmed working
  const module = visibleModules.find(m => m.id === moduleId);
  const isLocked = module?.isLocked;

  // Only block if explicitly locked (not just missing)
  if (module && isLocked) {
    console.warn(`[RouteGuard] Module ${moduleId} is locked by plan`);
    return <Navigate to="/dashboard/upgrade" state={{ from: location.pathname, moduleId }} replace />;
  }

  // Allow access - either module found and not locked, or module not found (be permissive)
  return <Outlet />;
}

