import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Spinner } from '../components/ui';

export function ProtectedRoute() {
  const { isAuthenticated, needsMfaEnrollment, mfaRequired, needsPassword, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Spinner className="w-8 h-8 text-teal" />
      </div>
    );
  }

  // 1. No session -> /login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Session flagged as needing a password (invite flow)
  if (needsPassword) {
    return <Navigate to="/invite/default/password" replace />;
  }

  // 3. No verified TOTP factor -> /mfa/setup
  if (needsMfaEnrollment) {
    return <Navigate to="/mfa/setup" replace />;
  }

  // 4. Session not at AAL2 -> /mfa/verify
  if (mfaRequired) {
    return <Navigate to="/mfa/verify" replace />;
  }

  // 5. Otherwise allow
  return <Outlet />;
}
