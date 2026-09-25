import { useState } from 'react';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { Button, Input, OtpInput, ErrorMessage } from '../../components/ui';
import { ShieldCheck, PhoneCall, Mail } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function InviteVerify() {
  const navigate = useNavigate();
  const { token } = useParams<{ token?: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const initialEmail = searchParams.get('email') || (location.state as any)?.email || '';
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your invited email address.');
      return;
    }
    if (code.length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('verify_invite_code', {
        p_email: email.trim().toLowerCase(),
        p_code: code.trim(),
      });

      if (rpcError) {
        setError(rpcError.message || 'Failed to verify invite code.');
        return;
      }

      if (!data || !data.valid) {
        const reason = data?.reason;
        if (reason === 'not_found_or_expired') {
          setError('This invite code was not found or has expired. Please ask your Admin to issue a new invite.');
        } else if (reason === 'incorrect_code') {
          setError('Incorrect verification code. Please check the 6-digit code relayed by your Admin.');
        } else {
          setError('Invalid verification code. Please check with your Admin.');
        }
        return;
      }

      // Valid invite! Proceed to Set Password screen
      navigate(`/invite/${token || data.invite_id || 'default'}/password`, {
        state: {
          email: email.trim().toLowerCase(),
          fullName: data.full_name,
          inviteId: data.invite_id,
        },
      });
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred during verification.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full rounded-card border border-border bg-white p-7 sm:p-9 shadow-xs">
      <div className="text-center mb-6">
        <div className="inline-flex h-14 w-14 rounded-2xl bg-teal/15 border border-teal/40 p-2 items-center justify-center shadow-2xs mb-3 text-teal">
          <ShieldCheck className="w-7 h-7 text-teal" />
        </div>
        <h1 className="font-heading text-2xl font-bold text-navy tracking-tight">
          Confirm Your Invite
        </h1>
        <p className="text-xs text-gray mt-2 leading-relaxed max-w-sm mx-auto font-body">
          You've been invited to join the HACSA Sankofa Insights team. Please enter the verification code provided by your Admin.
        </p>
      </div>

      <div className="mb-6 p-3.5 rounded-xl bg-cream border border-border/80 text-ink/80 text-xs flex items-start gap-2.5">
        <PhoneCall className="w-4 h-4 text-teal shrink-0 mt-0.5" />
        <span>
          For security, this 6-digit code was relayed to you <strong>by phone or in person</strong> by your Admin. It was never sent by email.
        </span>
      </div>

      {error && (
        <div className="mb-5">
          <ErrorMessage message={error} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {!initialEmail ? (
          <div>
            <Input
              id="invite-email"
              label="Your Invited Email Address"
              type="email"
              placeholder="name@hacsa.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        ) : (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-cream/70 border border-border text-xs text-ink/80">
            <Mail className="w-4 h-4 text-teal shrink-0" />
            <span>Invited as: <strong>{email}</strong></span>
          </div>
        )}

        <div className="py-2">
          <label className="block text-center text-xs font-bold text-gray uppercase tracking-widest mb-3">
            6-Digit Verification Code
          </label>
          <OtpInput
            value={code}
            onChange={(val) => {
              setCode(val);
              if (error) setError(null);
            }}
            error={!!error}
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          loading={loading}
          disabled={code.length !== 6 || !email.trim()}
          className="w-full"
        >
          Continue
        </Button>
      </form>
    </div>
  );
}
