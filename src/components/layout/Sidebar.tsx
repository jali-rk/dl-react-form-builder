import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, Settings, ChevronRight, ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
  { icon: FileText, label: 'Forms', href: '/admin/forms' },
];

export function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(true);

  return (
    <aside
      className={cn(
        'relative flex flex-col border-r border-gray-200 bg-white transition-all duration-300',
        collapsed ? 'w-14' : 'w-56',
      )}
    >
      {/* Logo area */}
      <div className="flex h-14 items-center justify-center border-b border-gray-200 px-3">
        {collapsed ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900 text-white font-bold text-sm">
            F
          </div>
        ) : (
          <span className="font-bold text-gray-900 text-base">FormBuilder</span>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-1 p-2 flex-1">
        {navItems.map(({ icon: Icon, label, href }) => {
          const active = location.pathname === href || (href !== '/admin' && location.pathname.startsWith(href));
          return (
            <Tooltip key={href} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  to={href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900',
                    collapsed && 'justify-center',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{label}</span>}
                </Link>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right">
                  {label}
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:text-gray-900 shadow-sm"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </aside>
  );
}
