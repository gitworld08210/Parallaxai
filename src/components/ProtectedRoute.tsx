import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthProvider';
import { AppLoadingScreen } from '@/components/layout/AppLoadingScreen';

export const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <AppLoadingScreen />;
  }

  if (!user) {
    return <Navigate to={`/auth?next=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return <Outlet />;
};

export const AdminOSGate = ({ children }: { children?: React.ReactNode }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <AppLoadingScreen />;
  }

  // FIX: Check authentication FIRST before checking authorization
  if (!user) {
    return <Navigate to={`/auth?next=${encodeURIComponent(location.pathname)}`} replace />;
  }

  const isAdmin = profile?.account_type === "organization" ||
                  profile?.is_admin ||
                  profile?.is_founder ||
                  ["COO", "CEO", "HR Head", "Finance Head"].includes((profile?.role || "").trim());

  if (!isAdmin) {
    return <Navigate to="/admin-os/no-access" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export const ExecutiveGate = ({ children }: { children?: React.ReactNode }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <AppLoadingScreen />;
  }

  // FIX: Check authentication FIRST
  if (!user) {
    return <Navigate to={`/auth?next=${encodeURIComponent(location.pathname)}`} replace />;
  }

  const isExec = profile?.is_founder || ["COO", "CEO"].includes((profile?.role || "").trim());

  if (!isExec) {
    return <Navigate to="/admin-os/no-access" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
