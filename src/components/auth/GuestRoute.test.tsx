import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { GuestRoute } from './GuestRoute';

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

function renderGuestRoute() {
  return render(
    <MemoryRouter>
      <GuestRoute>
        <div data-testid="guest-content">Guest Page</div>
      </GuestRoute>
    </MemoryRouter>,
  );
}

describe('GuestRoute', () => {
  beforeEach(() => {
    navigatedTo = null;
  });

  it('shows a loading spinner while auth is loading', () => {
    mockUseAuth.mockReturnValue({ user: null, appUser: null, loading: true });
    renderGuestRoute();

    expect(screen.queryByTestId('guest-content')).not.toBeInTheDocument();
    // Loader2 renders an SVG with the animate-spin class
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows a loading spinner when user exists but appUser has not loaded yet', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: '123' },
      appUser: null,
      loading: false,
    });
    renderGuestRoute();

    expect(screen.queryByTestId('guest-content')).not.toBeInTheDocument();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('redirects an authenticated admin to /admin', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: '123' },
      appUser: { uid: '123', role: 'admin' },
      loading: false,
    });
    renderGuestRoute();

    expect(navigatedTo).toBe('/admin');
    expect(screen.queryByTestId('guest-content')).not.toBeInTheDocument();
  });

  it('redirects an authenticated regular user to /user/dashboard', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: '456' },
      appUser: { uid: '456', role: 'user' },
      loading: false,
    });
    renderGuestRoute();

    expect(navigatedTo).toBe('/user/dashboard');
    expect(screen.queryByTestId('guest-content')).not.toBeInTheDocument();
  });

  it('renders children for unauthenticated visitors', () => {
    mockUseAuth.mockReturnValue({ user: null, appUser: null, loading: false });
    renderGuestRoute();

    expect(screen.getByTestId('guest-content')).toBeInTheDocument();
    expect(screen.getByText('Guest Page')).toBeInTheDocument();
  });
});
