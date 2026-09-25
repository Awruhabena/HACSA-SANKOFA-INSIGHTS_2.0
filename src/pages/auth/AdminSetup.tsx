import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, ErrorMessage } from '../../components/ui';
import { KeyRound, ShieldAlert } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function AdminSetup() {
  const navigate = useNavigate();

  const [setupToken, setSetupToken] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!setupToken.trim()) {
      setError('System setup token is required.');
      return;
    }

    if (!fullName.trim() || !email.trim()) {
      setError('Full name and email are required.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('bootstrap-admin', {
        body: {
          email: email.trim(),
          password,
          full_name: fullName.trim(),
          setup_token: setupToken.trim(),
        },
      });

      let errorCode = data?.error;
      if (!errorCode && invokeError) {
        try {
          const errorBody = await (invokeError as any).context?.json();
          errorCode = errorBody?.error || invokeError.message;
        } catch {
          errorCode = invokeError.message;
        }
      }

      if (errorCode) {
        switch (errorCode) {
          case 'invalid_setup_token':
            setError('Invalid system setup token. Please check the token provided.');
            return;
          case 'admin_already_exists':
            setError('An Admin account already exists. System setup is permanently closed.');
            return;
          case 'weak_password':
            setError('Password must be at least 8 characters long.');
            return;
          case 'missing_fields':
            setError('All fields are required.');
            return;
          default:
            setError(typeof errorCode === 'string' ? errorCode : 'Failed to create Admin account.');
            return;
        }
      }

      // Automatically sign in the new Admin to establish session
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        navigate('/login');
      } else {
        // Proceed to mandatory TOTP setup
        navigate('/mfa/setup');
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred during setup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full rounded-card border border-border bg-white p-7 sm:p-9 shadow-xs">
      <div className="text-center mb-6">
        <div className="inline-flex h-14 w-14 rounded-2xl bg-gold/15 border border-gold/40 p-2 items-center justify-center shadow-2xs mb-3 text-gold">
          <KeyRound className="w-7 h-7 text-gold" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-navy tracking-tight">
          Set Up This System
        </h1>
        <p className="text-xs text-gray mt-2 leading-relaxed max-w-sm mx-auto font-body">
          Welcome to HACSA Sankofa Insights. The first person to complete this form with a valid setup token becomes the system <strong>Admin</strong>.
        </p>
      </div>

      <div className="mb-6 p-3 rounded-xl bg-gold/10 border border-gold/30 text-amber-950 text-xs flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-gold shrink-0 mt-0.5" />
        <span>
          Keep your setup token secure. It authorizes full administrative privileges and cannot be reused.
        </span>
      </div>

      {error && (
        <div className="mb-5">
          <ErrorMessage message={error} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="setup-token"
          label="System Setup Token"
          type="password"
          autoComplete="off"
          placeholder="Enter the secure setup token"
          value={setupToken}
          onChange={(e) => setSetupToken(e.target.value)}
          helperText="Provided by your system administrator during initial installation"
          required
        />

        <Input
          id="full-name"
          label="Admin Full Name"
          type="text"
          placeholder="e.g. Amara Mensah"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />

        <Input
          id="admin-email"
          label="Admin Email Address"
          type="email"
          placeholder="admin@hacsa.org"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          id="admin-password"
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          helperText="Must be at least 8 characters"
          required
        />

        <Input
          id="confirm-password"
          label="Confirm Password"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="w-full flex items-center justify-center gap-2"
          >
            <span>Create Admin Account</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
