import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { GuestRoute } from '@/components/auth/GuestRoute';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Layout } from '@/components/layout/Layout';
import { AuthProvider } from '@/contexts/AuthContext';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { FormBuilderPage } from '@/pages/FormBuilderPage';
import { FormViewPage } from '@/pages/FormViewPage';
import { FormResponsesPage } from '@/pages/FormResponsesPage';
import { PublicFormPage } from '@/pages/PublicFormPage';
import { FormsPage } from '@/pages/FormsPage';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { UserDashboardPage } from '@/pages/UserDashboardPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/forms/:id" element={<PublicFormPage />} />
          <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/signup" element={<GuestRoute><SignupPage /></GuestRoute>} />
          <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />

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
            <Route path="/admin" element={<HomePage />} />
            <Route path="/admin/forms" element={<FormsPage />} />
            <Route path="/admin/forms/new" element={<FormBuilderPage />} />
            <Route path="/admin/forms/edit/:id" element={<FormBuilderPage />} />
            <Route path="/admin/forms/view/:id" element={<FormViewPage />} />
            <Route path="/admin/forms/responses/:id" element={<FormResponsesPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
