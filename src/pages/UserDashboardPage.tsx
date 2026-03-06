import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export function UserDashboardPage() {
  const { user, appUser, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const displayName = appUser?.displayName ?? user?.displayName ?? 'User';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-white text-sm font-medium">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <span className="font-medium text-gray-900">{displayName}</span>
        </div>
        <Button variant="outline" size="sm" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </header>
      <div className="flex h-[calc(100vh-65px)] items-center justify-center">
        <p className="text-gray-400 text-sm">User Dashboard — Coming Soon</p>
      </div>
    </div>
  );
}
