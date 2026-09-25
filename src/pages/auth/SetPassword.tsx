import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, ErrorMessage } from '../../components/ui';
import { Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function SetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message || 'Failed to set password.');
        return;
      }

      // After setting password, proceeds directly into TOTP setup
      navigate('/mfa/setup');
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred while setting password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full rounded-card border border-border bg-white p-7 sm:p-9 shadow-xs">
      <div className="text-center mb-6">
        <div className="inline-flex h-14 w-14 rounded-2xl bg-teal/15 border border-teal/40 p-2 items-center justify-center shadow-2xs mb-3 text-teal">
          <Lock className="w-7 h-7 text-teal" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-navy tracking-tight">
          Create Your Password
        </h1>
        <p className="text-xs text-gray mt-2 leading-relaxed max-w-sm mx-auto font-body">
          Choose a secure password for your HACSA Sankofa Insights account. Next, you will set up two-factor authentication.
        </p>
      </div>

      {error && (
        <div className="mb-5">
          <ErrorMessage message={error} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="new-password"
          label="New Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          helperText="Must be at least 8 characters with letters and numbers"
          required
        />

        <Input
          id="confirm-new-password"
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
            className="w-full"
          >
            Continue to Two-Factor Setup
          </Button>
        </div>
      </form>
    </div>
  );
}
