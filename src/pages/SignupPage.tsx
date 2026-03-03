import { useAuth } from '@/contexts/AuthContext';
import { ArrowRight, Check, CheckCircle2, Circle, ExternalLink, Eye, EyeOff, FileText, Inbox, Loader2, Mail } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function SignupPage() {
  const { signUp, googleSignIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get('redirect');

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const passwordRequirements = useMemo(() => {
    return [
      { label: 'At least 8 characters', met: password.length >= 8 },
      { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
      { label: 'One lowercase letter', met: /[a-z]/.test(password) },
      { label: 'One number', met: /\d/.test(password) },
      { label: 'One special character (!@#$...)', met: /[^A-Za-z0-9]/.test(password) },
    ];
  }, [password]);

  const strengthScore = useMemo(() => {
    return passwordRequirements.filter((r) => r.met).length;
  }, [passwordRequirements]);

  const strengthLabel = useMemo(() => {
    if (password.length === 0) return { text: '', color: '', barColor: '' };
    if (strengthScore <= 2) return { text: 'Weak', color: 'text-red-500', barColor: 'bg-red-500' };
    if (strengthScore <= 3) return { text: 'Fair', color: 'text-orange-500', barColor: 'bg-orange-500' };
    if (strengthScore <= 4) return { text: 'Good', color: 'text-yellow-500', barColor: 'bg-yellow-500' };
    return { text: 'Strong', color: 'text-green-500', barColor: 'bg-green-500' };
  }, [password, strengthScore]);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (strengthScore < 4) {
      setError('Please choose a stronger password. Meet at least 4 of the 5 requirements.');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, displayName);
      setEmailSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Signup failed. Please try again.');
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
            Start creating <br />
            forms today.
          </h2>
          <p className="text-gray-400 text-lg max-w-md">
            Join thousands of users who build professional forms with our intuitive drag-and-drop builder.
          </p>
        </div>
        <p className="text-gray-500 text-sm">© 2026 FormBuilder. All rights reserved.</p>
      </div>

      {/* Right side - form */}
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
                  We've sent a verification link to
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
                      <p className="text-sm font-medium text-gray-900">Click the verification link</p>
                      <p className="text-xs text-gray-500">This activates your account</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-900 text-[11px] font-bold text-white">3</div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Come back and log in</p>
                      <p className="text-xs text-gray-500">Use the button below to sign in</p>
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

              {/* Action buttons */}
              <div className="space-y-3">
                <Link to={`/login${redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : ''}`} className="block">
                  <Button className="w-full gap-2">
                    Go to Login
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a
                  href="https://mail.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button variant="outline" className="w-full gap-2">
                    Open Gmail
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
                <p className="text-gray-500">Get started with FormBuilder for free</p>
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Full Name</Label>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="John Doe"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Password strength meter */}
                  {password.length > 0 && (
                    <div className="space-y-3 pt-1">
                      {/* Strength bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-400">Password strength</span>
                          <span className={`text-xs font-semibold ${strengthLabel.color}`}>
                            {strengthLabel.text}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((segment) => (
                            <div
                              key={`strength-${segment}`}
                              className={`h-1.5 flex-1 rounded-full transition-colors ${segment <= strengthScore ? strengthLabel.barColor : 'bg-gray-200'
                                }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Requirements checklist */}
                      <div className="grid grid-cols-1 gap-1.5">
                        {passwordRequirements.map((req) => (
                          <div key={req.label} className="flex items-center gap-2">
                            {req.met ? (
                              <Check className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                              <Circle className="h-3.5 w-3.5 text-gray-300" />
                            )}
                            <span
                              className={`text-xs ${req.met ? 'text-green-600' : 'text-gray-400'
                                }`}
                            >
                              {req.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading || googleLoading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-2 text-gray-400">or sign up with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={loading || googleLoading}
                onClick={async () => {
                  setError('');
                  setGoogleLoading(true);
                  try {
                    await googleSignIn();
                    navigate(redirectParam || '/user/dashboard');
                  } catch (err: unknown) {
                    const msg = err instanceof Error ? err.message : 'Google sign-up failed.';
                    if (!msg.includes('popup-closed-by-user') && !msg.includes('cancelled-popup-request')) {
                      setError(msg);
                    }
                  } finally {
                    setGoogleLoading(false);
                  }
                }}
              >
                {googleLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                )}
                Continue with Google
              </Button>

              <div className="text-center text-sm text-gray-500">
                Already have an account?{' '}
                <Link to={`/login${redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : ''}`} className="font-medium text-gray-900 hover:underline">
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
