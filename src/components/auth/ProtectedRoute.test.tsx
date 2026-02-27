import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { ProtectedRoute } from './ProtectedRoute';

// Mock the AuthContext
const mockUseAuth = vi.fn();
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

// Helper to capture <Navigate> targets
let navigatedTo: string | null = null;
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => {
      navigatedTo = to;
      return <div data-testid="navigate">{to}</div>;
    },
  };
});

function renderProtectedRoute(allowedRoles?: ('user' | 'admin')[]) {
  return render(
    <MemoryRouter>
      <ProtectedRoute allowedRoles={allowedRoles}>
        <div data-testid="protected-content">Protected Page</div>
      </ProtectedRoute>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    navigatedTo = null;
  });

  it('shows a loading spinner while auth is loading', () => {
    mockUseAuth.mockReturnValue({ user: null, appUser: null, loading: true });
    renderProtectedRoute();

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('redirects unauthenticated users to /login', () => {
    mockUseAuth.mockReturnValue({ user: null, appUser: null, loading: false });
    renderProtectedRoute();

    expect(navigatedTo).toBe('/login');
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('redirects to /login when user exists but appUser is null', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: '123' },
      appUser: null,
      loading: false,
    });
    renderProtectedRoute();

    expect(navigatedTo).toBe('/login');
  });

  it('renders children when user role is in allowedRoles', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: '123' },
      appUser: { uid: '123', role: 'admin' },
      loading: false,
    });
    renderProtectedRoute(['admin']);

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('renders children when no allowedRoles are specified', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: '456' },
      appUser: { uid: '456', role: 'user' },
      loading: false,
    });
    renderProtectedRoute();

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('redirects admin to /admin when accessing a user-only route', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: '123' },
      appUser: { uid: '123', role: 'admin' },
      loading: false,
    });
    renderProtectedRoute(['user']);

    expect(navigatedTo).toBe('/admin');
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('redirects regular user to /user/dashboard when accessing an admin-only route', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: '456' },
      appUser: { uid: '456', role: 'user' },
      loading: false,
    });
    renderProtectedRoute(['admin']);

    expect(navigatedTo).toBe('/user/dashboard');
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });
});
