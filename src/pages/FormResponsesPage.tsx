import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Users, ChevronDown, ChevronRight, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { formsApi } from '@/api/formsApi';
import { responsesApi } from '@/api/responsesApi';
import type { FormTemplate, FormResponse, FormField, FormAnswer } from '@/types/form';

export function FormResponsesPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormTemplate | null>(null);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [formData, responsesData] = await Promise.all([
        formsApi.getById(id),
        responsesApi.listByForm(id),
      ]);
      if (!formData) {
        setError('Form not found.');
        return;
      }
      setForm(formData);
      setResponses(responsesData);
    } catch (err) {
      console.error('Failed to load responses:', err);
      setError('Failed to load responses.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleExpand = (responseId: string) => {
    setExpandedId((prev) => (prev === responseId ? null : responseId));
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /** Render form fields in preview style with submitted values filled in */
  const renderFilledField = (field: FormField, answer: FormAnswer | undefined) => {
    const value = answer?.value;

    switch (field.type) {
      case 'title':
        return (
          <h1 key={field.id} className="text-2xl font-bold text-gray-900">
            {field.label || 'Form Title'}
          </h1>
        );
      case 'h2':
        return (
          <h2 key={field.id} className="text-xl font-semibold text-gray-800">
            {field.label || 'Section Heading'}
          </h2>
        );
      case 'h3':
        return (
          <h3 key={field.id} className="text-base font-semibold text-gray-700">
            {field.label || 'Sub-heading'}
          </h3>
        );
      case 'description':
        return (
          <p key={field.id} className="text-sm text-gray-500">
            {field.label || 'Description'}
          </p>
        );
      case 'divider':
        return <hr key={field.id} className="border-t border-gray-200" />;

      case 'text':
        return (
          <div key={field.id} className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="ml-1 text-red-500">*</span>}
            </Label>
            <Input
              readOnly
              value={typeof value === 'string' ? value : ''}
              className="bg-gray-50 cursor-default"
            />
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id} className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="ml-1 text-red-500">*</span>}
            </Label>
            <Textarea
              readOnly
              value={typeof value === 'string' ? value : ''}
              className="bg-gray-50 cursor-default"
            />
          </div>
        );

      case 'radio':
        return (
          <div key={field.id} className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="ml-1 text-red-500">*</span>}
            </Label>
            <div className="space-y-2">
              {(field.options ?? []).map((opt) => (
                <label key={opt.id} className="flex items-center gap-2.5 text-sm text-gray-600">
                  <input
                    type="radio"
                    name={`${field.id}-preview`}
                    checked={value === opt.label}
                    readOnly
                    className="h-4 w-4 accent-gray-900"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.id} className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="ml-1 text-red-500">*</span>}
            </Label>
            <div className="space-y-2">
              {(field.options ?? []).map((opt) => (
                <label key={opt.id} className="flex items-center gap-2.5 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={Array.isArray(value) && value.includes(opt.label)}
                    readOnly
                    className="h-4 w-4 rounded accent-gray-900"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
        );

      case 'file':
        return (
          <div key={field.id} className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="ml-1 text-red-500">*</span>}
            </Label>
            <div className="flex items-center h-10 px-3 rounded-md border border-gray-200 bg-gray-50 text-sm text-gray-500">
              {typeof value === 'string' && value ? value : 'No file uploaded'}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const handleExportCSV = () => {
    if (!form || responses.length === 0) return;

    const fieldLabels: string[] = [];
    const fieldIdToLabel = new Map<string, string>();

    for (const r of responses) {
      for (const a of r.answers) {
        if (!fieldIdToLabel.has(a.field_id)) {
          fieldIdToLabel.set(a.field_id, a.field_label);
          fieldLabels.push(a.field_label);
        }
      }
    }

    const headers = ['#', 'Name', 'Submitted At', ...fieldLabels];

    const rows = responses.map((r, i) => {
      const answerMap = new Map(r.answers.map((a) => [a.field_id, a.value]));
      const values = [...fieldIdToLabel.keys()].map((fid) => {
        const val = answerMap.get(fid);
        if (!val) return '';
        return Array.isArray(val) ? val.join('; ') : val;
      });
      return [String(i + 1), r.user_name, formatDate(r.submitted_at), ...values];
    });

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${form.name.replaceAll(/\s+/g, '_')}_responses.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-gray-600" />
          <p className="text-sm text-gray-400">Loading responses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/forms')} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Forms
        </Button>
        <div className="flex items-center justify-center py-24">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/forms')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-gray-900">{form?.name}</h1>
              <Badge variant={form?.status === 'published' ? 'success' : 'secondary'}>
                {form?.status === 'published' ? 'Published' : 'Draft'}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">Form responses</p>
          </div>
        </div>

        {responses.length > 0 && (
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExportCSV}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        )}
      </div>

      {/* Responses table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Table header row */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-5 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">
            <Users className="h-4 w-4" />
            <span>Responses</span>
          </div>
          <Badge variant="outline">{responses.length} total</Badge>
        </div>

        {responses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 mb-3">
              <Inbox className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-500">No responses yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Responses will appear here once users submit this form.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {responses.map((response, idx) => {
              const isExpanded = expandedId === response.id;
              return (
                <div key={response.id}>
                  {/* Row */}
                  <button
                    onClick={() => toggleExpand(response.id)}
                    className={`flex w-full items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-gray-50 ${isExpanded ? 'bg-gray-50' : ''}`}
                  >
                    {/* Index */}
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-500">
                      {idx + 1}
                    </span>

                    {/* Name + date */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {response.user_name}
                      </p>
                    </div>

                    {/* Date */}
                    <span className="hidden sm:block text-xs text-gray-400 shrink-0">
                      {formatDate(response.submitted_at)}
                    </span>

                    {/* Answer count */}
                    <Badge variant="outline" className="shrink-0 text-[11px]">
                      {response.answers.length} {response.answers.length === 1 ? 'answer' : 'answers'}
                    </Badge>

                    {/* Chevron */}
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                    )}
                  </button>

                  {/* Expanded answers — preview style */}
                  {isExpanded && form && (
                    <div className="border-t border-gray-100 bg-gray-50/50 px-5 pb-5 pt-4">
                      {/* Date on mobile */}
                      <p className="sm:hidden text-xs text-gray-400 mb-4 pl-11">
                        {formatDate(response.submitted_at)}
                      </p>

                      <div className="ml-11 max-w-xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="space-y-6">
                          {form.fields.map((field) => {
                            const answer = response.answers.find((a) => a.field_id === field.id);
                            return renderFilledField(field, answer);
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
