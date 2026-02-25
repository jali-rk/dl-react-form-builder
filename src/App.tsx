import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { GuestRoute } from '@/components/auth/GuestRoute';
import { Layout } from '@/components/layout/Layout';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { AdminLoginPage } from '@/pages/AdminLoginPage';
import { UserDashboardPage } from '@/pages/UserDashboardPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/signup" element={<GuestRoute><SignupPage /></GuestRoute>} />
          <Route path="/admin/login" element={<GuestRoute><AdminLoginPage /></GuestRoute>} />

          {/* User dashboard */}
          <Route
            path="/user/dashboard"
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <UserDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Admin-only routes */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout />
              </ProtectedRoute>
            }
          >
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
