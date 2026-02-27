import { Loader2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';

interface GuestRouteProps {
  readonly children: React.ReactNode;
}

export function GuestRoute({ children }: GuestRouteProps) {
  const { user, appUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }
  
  // User is authenticated but appUser data hasn't loaded yet — show loader to avoid accidental redirects
  if (user && !appUser) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // If already authenticated, redirect based on role
  if (user && appUser) {
    const target = appUser.role === 'admin' ? '/admin' : '/user/dashboard';
    return <Navigate to={target} replace />;
  }

  return <>{children}</>;
}
