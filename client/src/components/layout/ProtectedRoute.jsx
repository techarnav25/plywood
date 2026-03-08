import { Navigate, useLocation } from 'react-router-dom';
import Spinner from '../common/Spinner.jsx';
import { useAuth } from '../../hooks/useAuth.js';

function ProtectedRoute({ children, roles = [] }) {
  const { isAuthenticated, isAuthLoading, admin } = useAuth();
  const location = useLocation();

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-950">
        <Spinner className="h-8 w-8 text-primary-700" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles.length > 0 && !roles.includes(admin?.role)) {
    if (admin?.role === 'labour') {
      return <Navigate to="/my-profile" replace />;
    }

    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;
