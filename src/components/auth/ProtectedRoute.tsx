import { Loader2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types/auth';

interface ProtectedRouteProps {
  readonly children: React.ReactNode;
  readonly allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, appUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" role="status" aria-live="polite">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <span className="sr-only">Loading…</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // User is authenticated but appUser profile is still loading from Firestore
  if (!appUser) {
    return (
      <div className="flex h-screen items-center justify-center" role="status" aria-live="polite">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <span className="sr-only">Loading…</span>
      </div>
    );
  }

  // Redirect to correct dashboard if role doesn't match allowed roles
  if (allowedRoles && !allowedRoles.includes(appUser.role)) {
    const target = appUser.role === 'admin' ? '/admin' : '/user/dashboard';
    return <Navigate to={target} replace />;
  }

  return <>{children}</>;
}
