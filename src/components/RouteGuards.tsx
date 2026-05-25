import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAdminAccess } from '../hooks/useAdminAccess';

function FullScreenState({ message, subtle = false }: { message: string; subtle?: boolean }) {
  return (
    <main className="min-h-[60vh] flex items-center justify-center px-6">
      <div
        className={
          subtle
            ? 'max-w-lg w-full text-center'
            : 'max-w-lg w-full bg-surface-container-lowest rounded-[2rem] p-8 whisper-shadow border border-surface-container text-center'
        }
      >
        {subtle ? (
          <div className="inline-flex items-center gap-3 rounded-full bg-surface-container-low px-5 py-3 text-sm font-semibold text-on-surface-variant">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
            {message}
          </div>
        ) : (
          <p className="text-on-surface font-semibold text-lg">{message}</p>
        )}
      </div>
    </main>
  );
}

export function ProtectedRoute() {
  const { user, profile, loading, authReady, authMessage } = useAuth();
  const location = useLocation();

  if (loading) {
    return <FullScreenState message="Preparing your workspace..." subtle />;
  }

  if (!authReady) {
    return <FullScreenState message={authMessage ?? 'Authentication is not configured yet.'} />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const metadataBlocked = user.app_metadata?.blocked === true;
  if (profile?.is_blocked || metadataBlocked) {
    return (
      <FullScreenState
        message={
          profile?.blocked_reason || user.app_metadata?.blocked_reason
            ? `This account is blocked. Reason: ${profile?.blocked_reason ?? user.app_metadata?.blocked_reason}`
            : 'This account is blocked. Contact support if you think this is a mistake.'
        }
      />
    );
  }

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <Outlet />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export function AdminRoute() {
  const { user, loading, authReady, authMessage } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminAccess(user);
  const location = useLocation();

  if (loading || adminLoading) {
    return <FullScreenState message="Checking admin access..." subtle />;
  }

  if (!authReady) {
    return <FullScreenState message={authMessage ?? 'Authentication is not configured yet.'} />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
