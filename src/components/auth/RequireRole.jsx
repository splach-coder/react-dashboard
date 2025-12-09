import { useAuth } from '../../context/AuthContext';

const defaultDenied = (
  <div className="p-4 text-sm text-red-700 bg-red-50 rounded">
    You do not have access to view this page.
  </div>
);

const defaultUnauthed = (
  <div className="p-4 text-sm text-yellow-700 bg-yellow-50 rounded">
    Please sign in to view this page.
  </div>
);

export default function RequireRole({
  allowed = [],
  fallback,
  loadingFallback,
  children,
}) {
  const { loading, isAuthenticated, hasRole } = useAuth();

  if (!allowed?.length || allowed.includes('public')) {
    return children;
  }

  if (loading) {
    return loadingFallback || <div className="p-4 text-sm">Checking access…</div>;
  }

  const isAuthorized = allowed.some(role => hasRole(role));

  if (isAuthorized) {
    return children;
  }

  if (!isAuthenticated) {
    return fallback || defaultUnauthed;
  }

  return fallback || defaultDenied;
}

