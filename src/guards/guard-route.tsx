import { Outlet } from "react-router-dom";

// Auth guard disabled for local CRM development
// All routes are accessible without login
export default function ProtectedRoute({ user }: { user: any }) {
  return <Outlet />;
}
