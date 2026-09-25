import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Input, NoticeBanner } from '../../components/ui';
import { ArrowRight, Eye, EyeOff, ShieldCheck, MailWarning } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function Login() {
  const navigate = useNavigate();
  const { signIn, deactivationNotice, clearDeactivationNotice } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUnconfirmed, setIsUnconfirmed] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setError('Please enter both your email address and password.');
      return;
    }

    setLoading(true);
    setError(null);
    setIsUnconfirmed(false);
    setResendSuccess(false);

    try {
      const { error: authError, emailNotConfirmed } = await signIn(email, password);

      if (emailNotConfirmed) {
        setIsUnconfirmed(true);
        setError('Your email has not been confirmed yet. Please check your inbox or resend the confirmation email.');
      } else if (authError) {
        setError('Incorrect email or password. Please check your credentials.');
      } else {
        navigate('/dashboard');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) return;
    try {
      await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
      });
      setResendSuccess(true);
    } catch {
      setError('Could not resend confirmation email. Please contact your Admin.');
    }
  };

  return (
    <div className="w-full rounded-card border border-border bg-white p-7 sm:p-9 shadow-xs">
      {/* Brand header */}
      <div className="text-center mb-7">
        <div className="inline-flex h-16 w-16 rounded-2xl bg-cream border border-border p-2 items-center justify-center shadow-2xs mb-3">
          <img
            src="/hacsa-logo.png"
            alt="HACSA Foundation Logo"
            className="h-full w-full object-contain"
          />
        </div>
        <h1 className="font-heading text-2xl font-bold text-navy tracking-tight">
          HACSA Foundation
        </h1>
        <p className="text-xs text-gray uppercase tracking-widest font-semibold mt-1">
          Staff Sign In
        </p>
        <p className="font-aside text-teal text-base mt-1 font-bold">
          Preserving heritage, empowering communities
        </p>
      </div>

      {/* Deactivation redirect notice */}
      {deactivationNotice && (
        <div className="mb-6">
          <NoticeBanner
            message={deactivationNotice}
            variant="gold"
            className="text-xs"
          />
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div
          className="mb-6 rounded-xl border border-clay/30 bg-clay/10 p-3.5 text-xs font-semibold text-clay text-center space-y-2"
          role="alert"
        >
          <p>{error}</p>
          {isUnconfirmed && (
            <div>
              {resendSuccess ? (
                <span className="text-teal font-bold block pt-1">
                  Confirmation email resent! Please check your inbox.
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  className="inline-flex items-center gap-1 text-teal underline font-bold hover:text-teal-pressed cursor-pointer pt-1"
                >
                  <MailWarning className="w-3.5 h-3.5" />
                  <span>Resend confirmation email</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="login-email"
          label="Staff Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="staff@hacsa.org"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (deactivationNotice) clearDeactivationNotice();
          }}
          required
        />

        <Input
          id="login-password"
          label="Password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (deactivationNotice) clearDeactivationNotice();
          }}
          required
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1.5 text-gray hover:text-navy rounded-lg transition-colors cursor-pointer"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4 text-gray hover:text-navy" />
              ) : (
                <Eye className="w-4 h-4 text-gray hover:text-navy" />
              )}
            </button>
          }
        />

        <div className="pt-2">
          <Button
            type="submit"
            loading={loading}
            variant="primary"
            className="w-full flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>Sign In</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Button>
        </div>
      </form>

      <div className="mt-8 pt-4 border-t border-border/60 flex items-center justify-center gap-1.5 text-xs text-gray font-medium">
        <ShieldCheck className="w-4 h-4 text-teal" />
        <span>Authorized Personnel Only · Protected by TOTP</span>
      </div>
    </div>
  );
}
