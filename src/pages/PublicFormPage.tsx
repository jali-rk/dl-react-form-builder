import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * Public form link handler.
 *
 * When a user clicks a shared form link (/forms/:id):
 * - If already logged in → redirect to user dashboard with ?formId=...
 * - If not logged in → redirect to /login?redirect=/user/dashboard?formId=...
 */
export function PublicFormPage() {
  const { id } = useParams<{ id: string }>();
  const { user, appUser, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    const dashboardUrl = `/user/dashboard?formId=${id}`;

    if (user && appUser) {
      // Already logged in → go straight to dashboard with the form
      navigate(dashboardUrl, { replace: true });
    } else {
      // Not logged in → send to login with redirect back
      navigate(`/login?redirect=${encodeURIComponent(dashboardUrl)}`, { replace: true });
    }
  }, [id, user, appUser, loading, navigate]);

  // Show a loading spinner while auth state resolves
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
    </div>
  );
}
