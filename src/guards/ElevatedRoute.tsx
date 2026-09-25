import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Spinner } from '../components/ui';

/**
 * Guard for routes visible only to Admin and Backup Admin.
 * Staff members attempting to access are redirected to /dashboard.
 */
export function ElevatedRoute() {
  const { role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Spinner className="w-8 h-8 text-teal" />
      </div>
    );
  }

  if (role !== 'admin' && role !== 'backup_admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
