import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, ErrorMessage } from '../../components/ui';
import { ShieldAlert, CheckCircle, XCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

export default function AcceptDesignation() {
  const navigate = useNavigate();
  const { token } = useParams<{ token?: string }>();
  const { pendingRoleActions, refreshPendingRoleActions } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'prompt' | 'accepted' | 'declined'>('prompt');

  const requestId = token || pendingRoleActions.find((a) => a.type === 'designation')?.id;

  const handleAccept = async () => {
    if (!requestId) {
      setError('No active Backup Admin designation request found.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.acceptBackupAdminDesignation(requestId);
      if (res && res.status === 'totp_required') {
        navigate('/mfa/setup');
        return;
      }
      await refreshPendingRoleActions();
      setStatus('accepted');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Failed to accept designation. Please try again.');
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
          <div className="inline-flex h-16 w-16 rounded-full bg-teal/15 text-teal p-3 items-center justify-center mx-auto mb-2">
            <CheckCircle className="w-10 h-10 text-teal" />
          </div>
          <h2 className="font-heading text-xl font-bold text-navy">
            Designation Accepted
          </h2>
          <p className="text-xs text-gray">
            You are now a <strong>Backup Admin</strong> for HACSA Sankofa Insights. Redirecting to your dashboard...
          </p>
        </div>
      ) : status === 'declined' ? (
        <div className="text-center py-6 space-y-3">
          <div className="inline-flex h-16 w-16 rounded-full bg-clay/10 text-clay p-3 items-center justify-center mx-auto mb-2">
            <XCircle className="w-10 h-10 text-clay" />
          </div>
          <h2 className="font-heading text-xl font-bold text-navy">
            Designation Declined
          </h2>
          <p className="text-xs text-gray">
            You will continue in your current role as Staff. Returning to dashboard...
          </p>
        </div>
      ) : (
        <>
          <div className="text-center mb-6">
            <div className="inline-flex h-14 w-14 rounded-2xl bg-teal/15 border border-teal/40 p-2 items-center justify-center shadow-2xs mb-3 text-teal">
              <ShieldAlert className="w-7 h-7 text-teal" />
            </div>
            <h1 className="font-heading text-xl sm:text-2xl font-bold text-navy tracking-tight">
              Backup Admin Designation
            </h1>
            <p className="text-xs text-gray mt-2 leading-relaxed max-w-sm mx-auto font-body">
              Your system Admin has designated you as the <strong>Backup Admin</strong> for HACSA Sankofa Insights.
            </p>
          </div>

          <div className="mb-6 space-y-3 p-4 rounded-2xl bg-cream border border-border/80 text-xs text-ink/80 font-body">
            <p className="font-bold text-navy">What this responsibility means:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-1 text-[11px] leading-relaxed">
              <li>Full access to team management, staff directory, and audit logs.</li>
              <li>Ability to assist team members with account resets and invites.</li>
              <li>Ensures operational continuity if the primary Admin is unavailable.</li>
            </ul>
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
              className="w-full"
            >
              Accept Backup Admin Designation
            </Button>

            <Button
              type="button"
              variant="secondary"
              disabled={loading}
              onClick={handleDecline}
              className="w-full text-xs"
            >
              Decline Designation
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
