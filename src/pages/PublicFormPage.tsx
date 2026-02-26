import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formsApi } from '@/api/formsApi';
import { responsesApi } from '@/api/responsesApi';
import { useAuth } from '@/contexts/AuthContext';
import type { FormTemplate, FormField, FormAnswer } from '@/types/form';

const LAYOUT_TYPES = new Set(['title', 'h2', 'h3', 'description', 'divider']);

export function PublicFormPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [form, setForm] = useState<FormTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showCancel, setShowCancel] = useState(false);

  // Answers state: keyed by field id
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});

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

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        const f = await formsApi.getById(id);
        if (f.status !== 'published') {
          setError('This form is not currently available.');
          return;
        }
        setForm(f);

        if (user) {
          const hasSubmitted = await responsesApi.hasSubmitted(id, user.uid);
          if (hasSubmitted) {
            setAlreadySubmitted(true);
          }
        }
      } catch {
        setError('Form not found.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id, user]);

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
    if (!id || !user || !form) return;

    const missingField = validateRequiredFields();
    if (missingField) {
      alert(`Please fill in the required field: "${missingField}"`);
      return;
    }

    setSubmitting(true);
    try {
      await responsesApi.submit(id, user.uid, buildAnswers());
      setSubmitted(true);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-400 text-sm">
        Loading form...
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-gray-700">{error ?? 'Form not found.'}</p>
          <p className="text-sm text-gray-400">The form you are looking for may have been removed or is no longer published.</p>
        </div>
      </div>
    );
  }

  // Already submitted screen
  if (alreadySubmitted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <AlertCircle className="h-8 w-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Already Submitted</h2>
          <p className="text-sm text-gray-500 max-w-sm">
            You have already submitted this form. Each account can only submit once.
          </p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center space-y-2">
          <p className="text-lg font-medium text-gray-700">Login Required</p>
          <p className="text-sm text-gray-400">You need to be logged in to submit this form.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
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
        <p className="text-center text-xs text-gray-300 mt-6">
          Powered by Form Builder
        </p>
      </div>

      {/* Success dialog */}
      <Dialog open={submitted} onOpenChange={() => {}}>
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
            <Button onClick={() => setAlreadySubmitted(true)}>
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
            <Button variant="destructive" onClick={() => globalThis.location.reload()}>
              Yes, Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
