import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, ErrorMessage } from '../../components/ui';
import { ShieldCheck, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

export default function AcceptTransfer() {
  const navigate = useNavigate();
  const { token } = useParams<{ token?: string }>();
  const { pendingRoleActions, refreshPendingRoleActions } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'prompt' | 'accepted' | 'declined'>('prompt');

  const requestId = token || pendingRoleActions.find((a) => a.type === 'transfer')?.id;

  const handleAccept = async () => {
    if (!requestId) {
      setError('No active Admin permission transfer request found.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.acceptTransfer(requestId);
      await refreshPendingRoleActions();
      setStatus('accepted');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Failed to accept transfer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = () => {
    setStatus('declined');
    setTimeout(() => {
      navigate('/dashboard');
    }, 1500);
  };

  return (
    <div className="w-full rounded-card border border-border bg-white p-7 sm:p-9 shadow-xs">
      {status === 'accepted' ? (
        <div className="text-center py-6 space-y-3">
          <div className="inline-flex h-16 w-16 rounded-full bg-gold/15 text-amber-900 p-3 items-center justify-center mx-auto mb-2">
            <CheckCircle className="w-10 h-10 text-gold" />
          </div>
          <h2 className="font-heading text-xl font-bold text-navy">
            Admin Permissions Accepted
          </h2>
          <p className="text-xs text-gray">
            You are now the primary <strong>Admin</strong> for HACSA Sankofa Insights. Redirecting to your dashboard...
          </p>
        </div>
      ) : status === 'declined' ? (
        <div className="text-center py-6 space-y-3">
          <div className="inline-flex h-16 w-16 rounded-full bg-clay/10 text-clay p-3 items-center justify-center mx-auto mb-2">
            <XCircle className="w-10 h-10 text-clay" />
          </div>
          <h2 className="font-heading text-xl font-bold text-navy">
            Transfer Declined
          </h2>
          <p className="text-xs text-gray">
            Permission transfer declined. Returning to dashboard...
          </p>
        </div>
      ) : (
        <>
          <div className="text-center mb-6">
            <div className="inline-flex h-14 w-14 rounded-2xl bg-gold/15 border border-gold/40 p-2 items-center justify-center shadow-2xs mb-3 text-gold">
              <ShieldCheck className="w-7 h-7 text-gold" />
            </div>
            <h1 className="font-heading text-xl sm:text-2xl font-bold text-navy tracking-tight">
              Accept Admin Permissions
            </h1>
            <p className="text-xs text-gray mt-2 leading-relaxed max-w-sm mx-auto font-body">
              The current system Admin has initiated a transfer of full administrative ownership to you.
            </p>
          </div>

          <div className="mb-6 p-4 rounded-2xl bg-clay/10 border border-clay/20 text-xs text-ink/90 font-body space-y-2">
            <div className="flex items-center gap-2 font-bold text-clay">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Consequences of accepting this transfer:</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              You will become the primary <strong>Admin</strong> with full control over the system. The previous Admin will transition to the <strong>Staff</strong> role.
            </p>
          </div>

          {error && (
            <div className="mb-5">
              <ErrorMessage message={error} />
            </div>
          )}

          <div className="space-y-3">
            <Button
              type="button"
              variant="primary"
              loading={loading}
              onClick={handleAccept}
              className="w-full bg-gold hover:bg-gold/90 text-white"
            >
              Accept Admin Ownership
            </Button>

            <Button
              type="button"
              variant="secondary"
              disabled={loading}
              onClick={handleDecline}
              className="w-full text-xs"
            >
              Decline Transfer
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
