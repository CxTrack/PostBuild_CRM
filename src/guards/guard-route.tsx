import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function ProtectedRoute({ user }: { user: any }) {
  const location = useLocation();

  if (!user) {
    return (
      <Navigate
        to="/access"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return <Outlet />;
}
