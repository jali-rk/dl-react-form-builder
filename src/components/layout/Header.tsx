import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronRight, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const breadcrumbMap: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/forms': 'Forms',
  '/admin/forms/new': 'Form Builder',
  '/admin/forms/edit': 'Form Builder',
};

function getBreadcrumbs(pathname: string): { label: string; href: string }[] {
  const crumbs: { label: string; href: string }[] = [{ label: 'Dashboard', href: '/admin' }];

  if (pathname === '/admin') return crumbs;

  if (pathname.startsWith('/admin/forms/edit/')) {
    crumbs.push(
      { label: 'Forms', href: '/admin/forms' },
      { label: 'Form Builder', href: pathname },
    );
  } else if (breadcrumbMap[pathname]) {
    const parts = pathname.replace('/admin', '').split('/').filter(Boolean);
    let current = '/admin';
    for (const part of parts) {
      current += `/${part}`;
      if (breadcrumbMap[current]) {
        crumbs.push({ label: breadcrumbMap[current], href: current });
      }
    }
  }

  return crumbs;
}

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, appUser, signOut } = useAuth();
  const crumbs = getBreadcrumbs(location.pathname);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const displayName = appUser?.displayName ?? user?.displayName ?? 'User';

  const initials = displayName === 'User'
    ? 'U'
    : displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-500">
        {crumbs.map((crumb, index) => (
          <span key={crumb.href} className="flex items-center gap-1.5">
            {index > 0 && <ChevronRight className="h-3.5 w-3.5 text-gray-300" />}
            {index === crumbs.length - 1 ? (
              <span className="font-medium text-gray-900">{crumb.label}</span>
            ) : (
              <Link to={crumb.href} className="hover:text-gray-900 transition-colors">
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* Right section */}
      <div className="flex items-center gap-3">
        <button className="relative flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors">
          <Bell className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-400 text-white text-xs font-semibold overflow-hidden">
            {initials}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-gray-900 leading-none">
              {displayName}
            </p>
            <p className="text-xs text-gray-400 leading-none mt-0.5">
              {appUser?.role === 'admin' ? 'Admin' : 'User'}
            </p>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
