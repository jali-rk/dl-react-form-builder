import { Link, useLocation } from 'react-router-dom';
import { Bell, ChevronRight } from 'lucide-react';

const breadcrumbMap: Record<string, string> = {
  '/': 'Home',
  '/forms': 'Forms',
  '/forms/new': 'Form Builder',
  '/forms/edit': 'Form Builder',
};

function getBreadcrumbs(pathname: string): { label: string; href: string }[] {
  const crumbs: { label: string; href: string }[] = [{ label: 'Home', href: '/' }];

  if (pathname === '/') return crumbs;

  if (pathname.startsWith('/forms/') && pathname !== '/forms/new') {
    // Edit path e.g. /forms/edit/:id
    crumbs.push({ label: 'Forms', href: '/forms' });
    crumbs.push({ label: 'Form Builder', href: pathname });
  } else if (breadcrumbMap[pathname]) {
    const parts = pathname.split('/').filter(Boolean);
    let current = '';
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
  const crumbs = getBreadcrumbs(location.pathname);

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
            KJ
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-gray-900 leading-none">Kavindu Jayasekara</p>
            <p className="text-xs text-gray-400 leading-none mt-0.5">123456</p>
          </div>
        </div>
      </div>
    </header>
  );
}
