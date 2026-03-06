import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FormPreview } from '@/components/form-builder/FormPreview';
import { formsApi } from '@/api/formsApi';
import type { FormTemplate } from '@/types/form';

export function FormViewPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form, setForm] = useState<FormTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    formsApi
      .getById(id)
      .then(setForm)
      .catch((err) => {
        console.error('Failed to load form:', err);
        setError(err instanceof Error ? err.message : 'Failed to load form.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Loading form preview...
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-sm text-red-500">{error ?? 'Form not found.'}</p>
        <Button variant="outline" onClick={() => navigate('/admin/forms')}>
          Back to Forms
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/forms')}
            className="gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{form.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={form.status === 'published' ? 'success' : 'secondary'}>
                {form.status === 'published' ? 'Published' : 'Draft'}
              </Badge>
              <span className="text-xs text-gray-400">
                {form.type} · Created {new Date(form.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <Button onClick={() => navigate(`/admin/forms/edit/${form.id}`)}>
          Edit Form
        </Button>
      </div>

      {/* Preview */}
      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm min-h-[500px]">
        <FormPreview fields={form.fields} />
      </div>
    </div>
  );
}
