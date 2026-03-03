import { Loader2 } from 'lucide-react';
import { Navigate, useSearchParams } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';

interface GuestRouteProps {
  readonly children: React.ReactNode;
}

export function GuestRoute({ children }: GuestRouteProps) {
  const { user, appUser, loading } = useAuth();
  const [searchParams] = useSearchParams();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" role="status" aria-live="polite">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <span className="sr-only">Loading…</span>
      </div>
    );
  }
  
  // User is authenticated but appUser data hasn't loaded yet — show loader to avoid accidental redirects
  if (user && !appUser) {
    return (
      <div className="flex h-screen items-center justify-center" role="status" aria-live="polite">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <span className="sr-only">Loading…</span>
      </div>
    );
  }

  // If already authenticated, redirect based on role or redirect param
  if (user && appUser) {
    const redirectParam = searchParams.get('redirect');
    const target = redirectParam || (appUser.role === 'admin' ? '/admin' : '/user/dashboard');
    return <Navigate to={target} replace />;
  }

  return <>{children}</>;
}

