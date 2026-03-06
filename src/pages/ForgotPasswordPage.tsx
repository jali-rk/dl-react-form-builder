import { FileText, Loader2, Mail, ArrowLeft, CheckCircle2, Inbox } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await resetPassword(email);
      setEmailSent(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send reset email.';
      if (msg.includes('user-not-found') || msg.includes('invalid-email')) {
        setError('No account found with this email address.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-900 text-white flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
            <FileText className="h-5 w-5" />
          </div>
          <span className="font-bold text-xl">FormBuilder</span>
        </div>
        <div className="space-y-4">
          <h2 className="text-4xl font-bold leading-tight">
            Don't worry, <br />
            we've got you.
          </h2>
          <p className="text-gray-400 text-lg max-w-md">
            Reset your password in just a few steps and get back to building amazing forms.
          </p>
        </div>
        <p className="text-gray-500 text-sm">© 2026 FormBuilder. All rights reserved.</p>
      </div>

      {/* Right side */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-white">
              <FileText className="h-5 w-5" />
            </div>
            <span className="font-bold text-xl text-gray-900">FormBuilder</span>
          </div>

          {emailSent ? (
            <div className="space-y-8">
              {/* Success header */}
              <div className="text-center space-y-3">
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-50 ring-8 ring-green-50/50">
                      <Mail className="h-10 w-10 text-green-600" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-green-500 ring-4 ring-white">
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Check your email</h1>
                <p className="text-gray-500 text-sm leading-relaxed">
                  We've sent a password reset link to
                </p>
                <p className="font-semibold text-gray-900">{email}</p>
              </div>

              {/* Steps card */}
              <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-5 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Next steps</p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-900 text-[11px] font-bold text-white">1</div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Open your inbox</p>
                      <p className="text-xs text-gray-500">Look for an email from FormBuilder</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-900 text-[11px] font-bold text-white">2</div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Click the reset link</p>
                      <p className="text-xs text-gray-500">Set your new password</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-900 text-[11px] font-bold text-white">3</div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Log in with your new password</p>
                      <p className="text-xs text-gray-500">You're all set!</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Spam notice */}
              <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <Inbox className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
                <p className="text-sm text-amber-700">
                  Can't find the email? Check your <span className="font-medium">spam</span> or <span className="font-medium">junk</span> folder.
                </p>
              </div>

              {/* Back to login */}
              <Link to="/login" className="block">
                <Button className="w-full gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Login
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Back link */}
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to login
              </Link>

              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-gray-900">Reset your password</h1>
                <p className="text-gray-500">
                  Enter the email address associated with your account and we'll send you a link to reset your password.
                </p>
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="mr-2 h-4 w-4" />
                  )}
                  Send Reset Link
                </Button>
              </form>

              <div className="text-center text-sm text-gray-500">
                Remember your password?{' '}
                <Link to="/login" className="font-medium text-gray-900 hover:underline">
                  Sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
