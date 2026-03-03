import { formsApi } from '@/api/formsApi';
import { responsesApi } from '@/api/responsesApi';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import type { FormAnswer, FormField, FormResponse, FormTemplate } from '@/types/form';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Clock,
  Eye,
  FileText,
  Inbox,
  Loader2,
  LogOut,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const LAYOUT_TYPES = new Set(['title', 'h2', 'h3', 'description', 'divider']);

/** Enriched response type returned by listByUser */
type UserResponse = FormResponse & { form_name: string };

export function UserDashboardPage() {
  const { user, appUser, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Form ID from query param (e.g. /user/dashboard?formId=abc123)
  const formIdFromUrl = searchParams.get('formId');

  // Active form being filled
  const [activeFormId, setActiveFormId] = useState<string | null>(formIdFromUrl);
  const [form, setForm] = useState<FormTemplate | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  // Answer state
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});

  // ─── My Submissions state ─────────────────────────────────────
  const [myResponses, setMyResponses] = useState<UserResponse[]>([]);
  const [responsesLoading, setResponsesLoading] = useState(false);
  const [viewingResponse, setViewingResponse] = useState<UserResponse | null>(null);
  const [viewingForm, setViewingForm] = useState<FormTemplate | null>(null);
  const [viewingLoading, setViewingLoading] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const displayName = appUser?.displayName ?? user?.displayName ?? 'User';
  const userInitial = displayName.charAt(0).toUpperCase();

  // ─── Fetch user's submitted responses ─────────────────────────
  const loadMyResponses = useCallback(async () => {
    if (!user) return;
    setResponsesLoading(true);
    try {
      const res = await responsesApi.listByUser(user.uid);
      setMyResponses(res);
    } catch (err) {
      console.error('Failed to load responses:', err);
    } finally {
      setResponsesLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadMyResponses();
  }, [loadMyResponses]);

  // Load form when activeFormId changes
  useEffect(() => {
    if (!activeFormId) {
      setForm(null);
      setFormError(null);
      setAlreadySubmitted(false);
      setSubmitted(false);
      setAnswers({});
      return;
    }

    const loadForm = async () => {
      setFormLoading(true);
      setFormError(null);
      setAlreadySubmitted(false);
      setSubmitted(false);
      setAnswers({});
      try {
        const f = await formsApi.getById(activeFormId);
        if (f.status !== 'published') {
          setFormError('This form is not currently available.');
          return;
        }
        setForm(f);

        if (user) {
          const hasSubmitted = await responsesApi.hasSubmitted(activeFormId, user.uid);
          if (hasSubmitted) {
            setAlreadySubmitted(true);
          }
        }
      } catch {
        setFormError('Form not found or has been removed.');
      } finally {
        setFormLoading(false);
      }
    };

    void loadForm();
  }, [activeFormId, user]);

  // Sync activeFormId with query param
  useEffect(() => {
    if (activeFormId) {
      setSearchParams({ formId: activeFormId }, { replace: true });
    } else if (formIdFromUrl) {
      setSearchParams({}, { replace: true });
    }
  }, [activeFormId]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateAnswer = useCallback((fieldId: string, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
  }, []);

  const toggleCheckbox = useCallback((fieldId: string, optionLabel: string, checked: boolean) => {
    setAnswers((prev) => {
      const current = (prev[fieldId] as string[]) ?? [];
      const next = checked
        ? [...current, optionLabel]
        : current.filter((v) => v !== optionLabel);
      return { ...prev, [fieldId]: next };
    });
  }, []);

  const validateRequiredFields = (): string | null => {
    if (!form) return null;
    for (const field of form.fields) {
      if (!field.required || LAYOUT_TYPES.has(field.type)) continue;
      const val = answers[field.id];
      const isEmpty = !val || (Array.isArray(val) ? val.length === 0 : val.trim() === '');
      if (isEmpty) return field.label;
    }
    return null;
  };

  const buildAnswers = (): FormAnswer[] => {
    if (!form) return [];
    return form.fields
      .filter((f) => !LAYOUT_TYPES.has(f.type))
      .map((f) => ({
        field_id: f.id,
        field_label: f.label,
        field_type: f.type,
        value: answers[f.id] ?? (f.type === 'checkbox' ? [] : ''),
      }));
  };

  const handleSubmit = async () => {
    if (!activeFormId || !user || !form) return;

    const missingField = validateRequiredFields();
    if (missingField) {
      alert(`Please fill in the required field: "${missingField}"`);
      return;
    }

    setSubmitting(true);
    try {
      await responsesApi.submit(activeFormId, user.uid, buildAnswers());
      setSubmitted(true);
      // Refresh the submissions list
      void loadMyResponses();
    } catch (err) {
      console.error('Submission failed:', err);
      if (err instanceof Error && err.message.includes('already submitted')) {
        setAlreadySubmitted(true);
      } else {
        alert(err instanceof Error ? err.message : 'Submission failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackToDashboard = () => {
    setActiveFormId(null);
    setForm(null);
    setFormError(null);
    setAlreadySubmitted(false);
    setSubmitted(false);
    setAnswers({});
  };

  // ─── View a submitted response (read-only) ───────────────────
  const handleViewResponse = async (response: UserResponse) => {
    setViewingResponse(response);
    setViewingLoading(true);
    try {
      const f = await formsApi.getById(response.form_id);
      setViewingForm(f);
    } catch {
      setViewingForm(null);
    } finally {
      setViewingLoading(false);
    }
  };

  const handleBackFromViewing = () => {
    setViewingResponse(null);
    setViewingForm(null);
  };

  // Format date nicely
  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  // Render a single input field
  const renderField = (field: FormField) => {
    switch (field.type) {
      case 'title':
        return <h1 key={field.id} className="text-2xl font-bold text-gray-900">{field.label || 'Form Title'}</h1>;
      case 'h2':
        return <h2 key={field.id} className="text-xl font-semibold text-gray-800">{field.label || 'Section Heading'}</h2>;
      case 'h3':
        return <h3 key={field.id} className="text-base font-semibold text-gray-700">{field.label || 'Sub-heading'}</h3>;
      case 'description':
        return <p key={field.id} className="text-sm text-gray-500">{field.label || 'Add a description here'}</p>;
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
              placeholder={field.placeholder}
              value={(answers[field.id] as string) ?? ''}
              onChange={(e) => updateAnswer(field.id, e.target.value)}
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
              placeholder={field.placeholder}
              value={(answers[field.id] as string) ?? ''}
              onChange={(e) => updateAnswer(field.id, e.target.value)}
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
                <label key={opt.id} className="flex items-center gap-2.5 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="radio"
                    name={field.id}
                    className="h-4 w-4 accent-gray-900"
                    checked={(answers[field.id] as string) === opt.label}
                    onChange={() => updateAnswer(field.id, opt.label)}
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
                <label key={opt.id} className="flex items-center gap-2.5 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded accent-gray-900"
                    checked={((answers[field.id] as string[]) ?? []).includes(opt.label)}
                    onChange={(e) => toggleCheckbox(field.id, opt.label, e.target.checked)}
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
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
              <p className="text-xs text-gray-400">Click to upload or drag and drop</p>
              {field.accept && <p className="text-xs text-gray-300 mt-1">{field.accept}</p>}
              <input type="file" className="hidden" accept={field.accept} />
            </label>
          </div>
        );

      default:
        return null;
    }
  };

  // ─── Render a read-only answer value ─────────────────────────
  const renderReadOnlyAnswer = (answer: FormAnswer) => {
    const val = answer.value;

    if (Array.isArray(val)) {
      if (val.length === 0) {
        return <span className="text-gray-400 italic text-sm">No selection</span>;
      }
      return (
        <div className="flex flex-wrap gap-1.5">
          {val.map((v, i) => (
            <span
              key={i}
              className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700"
            >
              {v}
            </span>
          ))}
        </div>
      );
    }

    if (!val || (typeof val === 'string' && val.trim() === '')) {
      return <span className="text-gray-400 italic text-sm">No answer</span>;
    }

    return <p className="text-sm text-gray-800 whitespace-pre-wrap">{val}</p>;
  };

  // ─── Render the read-only response viewer ────────────────────
  const renderResponseViewer = () => {
    if (!viewingResponse) return null;

    if (viewingLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-3">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Loading submission...</p>
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-2xl">
        {/* Back button */}
        <div className="mb-6">
          <button
            onClick={handleBackFromViewing}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
        </div>

        {/* Response card */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {/* Header with form name & status */}
          <div className="bg-gradient-to-r from-gray-50 to-white px-8 py-5 border-b border-gray-100">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-gray-900">
                  {viewingResponse.form_name}
                </h2>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Submitted on {formatDate(viewingResponse.submitted_at)}</span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Submitted
              </span>
            </div>
          </div>

          {/* Read-only answers */}
          <div className="px-8 py-6">
            {viewingForm ? (
              <div className="space-y-5">
                {viewingForm.fields.map((field) => {
                  // Layout-only fields
                  if (LAYOUT_TYPES.has(field.type)) {
                    switch (field.type) {
                      case 'title':
                        return <h1 key={field.id} className="text-xl font-bold text-gray-900">{field.label}</h1>;
                      case 'h2':
                        return <h2 key={field.id} className="text-lg font-semibold text-gray-800">{field.label}</h2>;
                      case 'h3':
                        return <h3 key={field.id} className="text-base font-semibold text-gray-700">{field.label}</h3>;
                      case 'description':
                        return <p key={field.id} className="text-sm text-gray-500">{field.label}</p>;
                      case 'divider':
                        return <hr key={field.id} className="border-t border-gray-200" />;
                      default:
                        return null;
                    }
                  }

                  // Find the matching answer
                  const answer = viewingResponse.answers.find((a) => a.field_id === field.id);

                  return (
                    <div key={field.id} className="rounded-lg border border-gray-100 bg-gray-50/50 p-4 space-y-1.5">
                      <Label className="text-sm font-medium text-gray-500">{field.label}</Label>
                      {answer ? renderReadOnlyAnswer(answer) : (
                        <span className="text-gray-400 italic text-sm">No answer</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Fallback: show raw answers if form structure couldn't be loaded */
              <div className="space-y-5">
                {viewingResponse.answers.map((answer, idx) => (
                  <div key={idx} className="rounded-lg border border-gray-100 bg-gray-50/50 p-4 space-y-1.5">
                    <Label className="text-sm font-medium text-gray-500">{answer.field_label}</Label>
                    {renderReadOnlyAnswer(answer)}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer notice */}
          <div className="bg-gray-50 border-t border-gray-100 px-8 py-3">
            <p className="text-xs text-gray-400 text-center">
              This submission is read-only and cannot be edited.
            </p>
          </div>
        </div>
      </div>
    );
  };

  // ─── Render Form Content ─────────────────────────────────────
  const renderFormContent = () => {
    if (formLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-3">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Loading form...</p>
        </div>
      );
    }

    if (formError) {
      return (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
          <p className="text-lg font-medium text-gray-700">{formError}</p>
          <p className="text-sm text-gray-400">The form may have been removed or is no longer available.</p>
          <Button variant="outline" onClick={handleBackToDashboard} className="mt-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      );
    }

    if (alreadySubmitted) {
      return (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <AlertCircle className="h-8 w-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Already Submitted</h2>
          <p className="text-sm text-gray-500 max-w-sm text-center">
            You have already submitted this form. Each account can only submit once.
          </p>
          <Button variant="outline" onClick={handleBackToDashboard} className="mt-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      );
    }

    if (!form) return null;

    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="space-y-6 py-2">
            {form.fields.map((field) => renderField(field))}
          </div>

          <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => setShowCancel(true)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // ─── Render Dashboard Home (no form selected) ────────────────
  const renderDashboardHome = () => {
    return (
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Welcome section */}
        <div className="text-center space-y-2 py-6">
          <h2 className="text-2xl font-bold text-gray-900">Welcome back, {displayName}!</h2>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            View your form submissions below. Click on a form link shared by an admin to fill a new form.
          </p>
        </div>

        {/* My Submissions section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900">
              <ClipboardList className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">My Submissions</h3>
            {myResponses.length > 0 && (
              <span className="ml-auto text-xs font-medium text-gray-400 bg-gray-100 rounded-full px-2.5 py-0.5">
                {myResponses.length} {myResponses.length === 1 ? 'form' : 'forms'}
              </span>
            )}
          </div>

          {responsesLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-sm">Loading your submissions...</p>
            </div>
          ) : myResponses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4 rounded-xl border border-dashed border-gray-200 bg-white">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100">
                <Inbox className="h-8 w-8 text-gray-300" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-gray-500">No submissions yet</p>
                <p className="text-xs text-gray-400 max-w-xs">
                  When an admin shares a form link with you, open it to fill and submit it. Your submissions will appear here.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              {myResponses.map((response) => (
                <div
                  key={response.id}
                  className="group flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer"
                  onClick={() => handleViewResponse(response)}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-gray-900">
                        {response.form_name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Clock className="h-3 w-3 text-gray-300" />
                        <span className="text-xs text-gray-400">
                          {formatDate(response.submitted_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="h-3 w-3" />
                      Submitted
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 group-hover:bg-gray-100 group-hover:text-gray-600 transition-colors">
                      <Eye className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─── Determine what to render ────────────────────────────────
  const renderMainContent = () => {
    // 1. Viewing a submitted response (read-only)
    if (viewingResponse) return renderResponseViewer();

    // 2. Filling a form
    if (activeFormId) return renderFormContent();

    // 3. Dashboard home with submissions list
    return renderDashboardHome();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-900 text-white shadow-sm">
            <FileText className="h-4 w-4" />
          </div>
          <span className="font-semibold text-gray-900 text-lg">FormBuilder</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-gray-800 to-gray-900 text-white text-sm font-medium shadow-sm">
              {userInitial}
            </div>
            <span className="font-medium text-gray-700 text-sm hidden sm:block">{displayName}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowLogout(true)} className="gap-2 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 sm:px-6 py-8">
        {/* Show back button if a form is active (and we're not viewing a response) */}
        {activeFormId && !viewingResponse && !formLoading && !formError && !alreadySubmitted && form && (
          <div className="mx-auto max-w-2xl mb-6">
            <button
              onClick={handleBackToDashboard}
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </button>
          </div>
        )}

        {renderMainContent()}
      </main>

      {/* Success dialog */}
      <Dialog open={submitted} onOpenChange={() => { }}>
        <DialogContent className="max-w-sm text-center" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader className="items-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-2">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="text-xl">Submitted Successfully!</DialogTitle>
            <DialogDescription>
              Thank you for your response. Your form has been submitted successfully.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="justify-center sm:justify-center">
            <Button onClick={() => { setSubmitted(false); setAlreadySubmitted(true); }}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel confirmation dialog */}
      <Dialog open={showCancel} onOpenChange={setShowCancel}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader className="items-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-2">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <DialogTitle className="text-xl">Cancel Form?</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel? Your responses will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="justify-center sm:justify-center gap-2">
            <Button variant="outline" onClick={() => setShowCancel(false)}>
              Go Back
            </Button>
            <Button variant="destructive" onClick={() => { setShowCancel(false); handleBackToDashboard(); }}>
              Yes, Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logout confirmation dialog */}
      <Dialog open={showLogout} onOpenChange={setShowLogout}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader className="items-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-2">
              <LogOut className="h-8 w-8 text-red-500" />
            </div>
            <DialogTitle className="text-xl">Logout?</DialogTitle>
            <DialogDescription>
              Are you sure you want to log out of your account?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="justify-center sm:justify-center gap-2">
            <Button variant="outline" onClick={() => setShowLogout(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => { setShowLogout(false); handleSignOut(); }}>
              Yes, Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
