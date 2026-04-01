import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
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
import type { FormAnswer, FormField, FormTemplate } from '@/types/form';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Loader2,
  Mail,
  XCircle,
} from 'lucide-react';

const LAYOUT_TYPES = new Set(['title', 'h2', 'h3', 'description', 'divider']);

/**
 * Public form page - accessible without login.
 * Users enter their name and email first, then fill the form.
 * Name, email, and form responses are saved together.
 */
export function PublicFormPage() {
  const { id } = useParams<{ id: string }>();

  // User info collection state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [userInfoSubmitted, setUserInfoSubmitted] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  // Form state
  const [form, setForm] = useState<FormTemplate | null>(null);
  const [formLoading, setFormLoading] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionComplete, setSubmissionComplete] = useState(false);
  const [showCancel, setShowCancel] = useState(false);

  // Answer state
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});


  // Load form on mount
  useEffect(() => {
    if (!id) {
      setFormError('Invalid form link.');
      setFormLoading(false);
      return;
    }

    const loadForm = async () => {
      setFormLoading(true);
      setFormError(null);
      try {
        const f = await formsApi.getById(id);
        if (f.status !== 'published') {
          setFormError('This form is not currently available.');
          return;
        }
        setForm(f);
      } catch (err) {
        console.error('Error loading form:', err);
        // Check if it's a permission error
        if (err instanceof Error && err.message.includes('permission')) {
          setFormError('Access denied. Please contact the form administrator.');
        } else {
          setFormError('Form not found or has been removed.');
        }
      } finally {
        setFormLoading(false);
      }
    };

    void loadForm();
  }, [id]);

  // Validate email format
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle user info submission (name and email)
  const handleUserInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError('');
    setEmailError('');

    // Validate name
    if (!name.trim()) {
      setNameError('Please enter your name.');
      return;
    }

    // Validate email
    if (!email.trim()) {
      setEmailError('Please enter your email address.');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    if (!id) return;

    setCheckingEmail(true);
    try {
      // Check if this email has already submitted this form
      const hasSubmitted = await responsesApi.hasSubmittedByEmail(id, email);
      if (hasSubmitted) {
        setAlreadySubmitted(true);
      } else {
        setUserInfoSubmitted(true);
      }
    } catch (err) {
      console.error('Error checking email:', err);
      // If we can't check (permission denied), allow the user to proceed
      // The duplicate check will happen on submission
      setUserInfoSubmitted(true);
    } finally {
      setCheckingEmail(false);
    }
  };

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
    if (!id || !form || !email || !name) return;

    const missingField = validateRequiredFields();
    if (missingField) {
      alert(`Please fill in the required field: "${missingField}"`);
      return;
    }

    setSubmitting(true);
    try {
      await responsesApi.submitPublic(id, email, name, buildAnswers());
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

  const handleBackToUserInfo = () => {
    setUserInfoSubmitted(false);
    setAnswers({});
  };

  const handleStartOver = () => {
    setName('');
    setEmail('');
    setUserInfoSubmitted(false);
    setAlreadySubmitted(false);
    setSubmitted(false);
    setAnswers({});
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

      default:
        return null;
    }
  };

  // Render user info collection screen (name and email)
  const renderUserInfoCollection = () => (
    <div className="mx-auto max-w-md">
      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="text-center space-y-4 mb-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200">
            <Mail className="h-8 w-8 text-gray-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-gray-900">Enter your details</h2>
            <p className="text-sm text-gray-500">
              Please enter your name and email address to access the form. Your response will be saved with your information.
            </p>
          </div>
        </div>

        {form && (
          <div className="mb-6 p-4 rounded-lg bg-gray-50 border border-gray-100">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Form</p>
            <p className="font-medium text-gray-800">{form.name}</p>
          </div>
        )}

        <form onSubmit={handleUserInfoSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameError('');
              }}
              className={nameError ? 'border-red-300 focus:ring-red-500' : ''}
            />
            {nameError && (
              <p className="text-sm text-red-600">{nameError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError('');
              }}
              className={emailError ? 'border-red-300 focus:ring-red-500' : ''}
            />
            {emailError && (
              <p className="text-sm text-red-600">{emailError}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={checkingEmail}
          >
            {checkingEmail ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              'Continue to Form'
            )}
          </Button>
        </form>
      </div>
    </div>
  );

  // Render form content
  const renderFormContent = () => {
    if (!form) return null;

    return (
      <div className="mx-auto max-w-2xl">
        {/* Back button and email indicator */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => setShowCancel(true)}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Mail className="h-4 w-4" />
            <span>{email}</span>
          </div>
        </div>

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

  // Render loading state
  if (formLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Loading form...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (formError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-md px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-900 text-white shadow-sm">
              <FileText className="h-4 w-4" />
            </div>
            <span className="font-semibold text-gray-900 text-lg">FormBuilder</span>
          </div>
        </header>
        <main className="px-4 sm:px-6 py-16">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <p className="text-lg font-medium text-gray-700">{formError}</p>
            <p className="text-sm text-gray-400">The form may have been removed or is no longer available.</p>
          </div>
        </main>
      </div>
    );
  }

  // Render already submitted state
  if (alreadySubmitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-md px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-900 text-white shadow-sm">
              <FileText className="h-4 w-4" />
            </div>
            <span className="font-semibold text-gray-900 text-lg">FormBuilder</span>
          </div>
        </header>
        <main className="px-4 sm:px-6 py-16">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
              <AlertCircle className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Already Submitted</h2>
            <p className="text-sm text-gray-500 max-w-sm text-center">
              The email address <strong>{email}</strong> has already been used to submit this form. Each email can only submit once.
            </p>
            <Button variant="outline" onClick={handleStartOver} className="mt-2">
              Use Different Email
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-md px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-900 text-white shadow-sm">
            <FileText className="h-4 w-4" />
          </div>
          <span className="font-semibold text-gray-900 text-lg">FormBuilder</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 sm:px-6 py-8">
        {submissionComplete ? (
          // Thank you screen after submission
          <div className="mx-auto max-w-md">
            <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Thank You, {name}!</h2>
              <p className="text-sm text-gray-500 mb-6">
                Your response has been submitted successfully. You can safely close this page.
              </p>
              <p className="text-xs text-gray-400">
                Submitted as: {email}
              </p>
            </div>
          </div>
        ) : userInfoSubmitted ? (
          renderFormContent()
        ) : (
          renderUserInfoCollection()
        )}
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
            <Button onClick={() => { setSubmitted(false); setSubmissionComplete(true); }}>
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
            <Button variant="destructive" onClick={() => { setShowCancel(false); handleBackToUserInfo(); }}>
              Yes, Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
