import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import type { StaffProfile } from '../../lib/types';
import { Button, Input, Card, OtpInput, ErrorMessage } from '../../components/ui';
import {
  Settings as SettingsIcon,
  KeyRound,
  ArrowRightLeft,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

export default function Settings() {
  const { role, user } = useAuth();

  // Change Password States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Transfer Admin Permissions States (Admin-only)
  const [staffList, setStaffList] = useState<StaffProfile[]>([]);
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [adminTotpCode, setAdminTotpCode] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferPending, setTransferPending] = useState(false);

  useEffect(() => {
    if (role === 'admin') {
      api.getStaffDirectory().then(setStaffList);
    }
  }, [role]);

  const backupAdmin = staffList.find((s) => s.role === 'backup_admin' && s.is_active);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setPasswordError('Please provide both current and new passwords.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(false);

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        setPasswordError(updateError.message || 'Failed to update password.');
        setPasswordLoading(false);
        return;
      }

      setPasswordLoading(false);
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch (err: any) {
      setPasswordError(err?.message || 'Failed to update password.');
      setPasswordLoading(false);
    }
  };

  const handleInitiateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmPhrase.trim().toLowerCase() !== 'transfer admin permissions') {
      setTransferError('Please type the exact confirmation phrase.');
      return;
    }
    if (adminTotpCode.length !== 6) {
      setTransferError('Please enter your 6-digit TOTP code.');
      return;
    }

    setTransferLoading(true);
    setTransferError(null);

    try {
      // Re-verify Admin TOTP factor to authorize transfer
      const factors = await supabase.auth.mfa.listFactors();
      const totpFactor = factors.data?.totp?.[0];
      if (totpFactor) {
        const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({
          factorId: totpFactor.id,
        });
        if (chErr) throw new Error(chErr.message);
        const { error: vErr } = await supabase.auth.mfa.verify({
          factorId: totpFactor.id,
          challengeId: challenge.id,
          code: adminTotpCode.trim(),
        });
        if (vErr) throw new Error('Invalid authentication code. Please check your authenticator app.');
      }

      await api.transferAdminPermissions(adminTotpCode);
      setTransferPending(true);
    } catch (err: any) {
      setTransferError(err?.message || 'Failed to initiate transfer. Check your authentication code.');
    } finally {
      setTransferLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-7 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex items-center gap-3 pb-2 border-b border-border/60">
        <div className="p-2.5 rounded-2xl bg-teal/15 text-teal border border-teal/30">
          <SettingsIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-navy tracking-tight">
            Account Settings & Security
          </h1>
          <p className="text-xs text-gray mt-0.5">
            Manage your credentials and system ownership transfers.
          </p>
        </div>
      </div>

      {/* Change Password Card - Available to all roles */}
      <Card className="p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border/60">
          <KeyRound className="w-5 h-5 text-teal" />
          <div>
            <h2 className="font-heading text-base font-bold text-navy">
              Change Account Password
            </h2>
            <p className="text-xs text-gray">
              Signed in as <span className="font-mono text-ink">{user?.email}</span>
            </p>
          </div>
        </div>

        {passwordSuccess && (
          <div className="p-3.5 rounded-xl bg-teal/15 border border-teal/40 text-xs font-semibold text-teal-pressed flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>Your password has been successfully updated.</span>
          </div>
        )}

        {passwordError && <ErrorMessage message={passwordError} />}

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <Input
            id="current-password"
            label="Current Password"
            type="password"
            placeholder="••••••••"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="new-password"
              label="New Password"
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              helperText="Min. 8 characters"
              required
            />

            <Input
              id="confirm-new-password"
              label="Confirm New Password"
              type="password"
              placeholder="••••••••"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              loading={passwordLoading}
              className="cursor-pointer"
            >
              Update Password
            </Button>
          </div>
        </form>
      </Card>

      {/* Transfer Admin Permissions Card - Admin only */}
      {role === 'admin' && (
        <Card className="p-6 sm:p-8 space-y-5 border-gold/40">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gold/15 text-gold border border-gold/30">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-heading text-base font-bold text-navy">
                  Transfer Admin Ownership
                </h2>
                <p className="text-xs text-gray">
                  Permanently transfer primary Admin authority to the Backup Admin.
                </p>
              </div>
            </div>

            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gold/20 text-amber-900 border border-gold/40 font-heading">
              Admin Only
            </span>
          </div>

          {transferPending ? (
            <div className="p-6 rounded-2xl bg-cream border border-gold/40 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-gold/20 text-amber-900 flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6 text-gold" />
              </div>
              <h3 className="font-heading font-bold text-lg text-navy">
                Transfer Request Initiated
              </h3>
              <p className="text-xs text-gray max-w-md mx-auto leading-relaxed">
                A transfer authorization has been dispatched to{' '}
                <strong>{backupAdmin?.full_name || 'the Backup Admin'}</strong>. The transfer will take effect immediately upon their acceptance.
              </p>
            </div>
          ) : !backupAdmin ? (
            <div className="p-4 rounded-xl bg-cream border border-border text-xs text-gray">
              <p className="font-semibold text-navy">No active Backup Admin designated.</p>
              <p className="mt-1">
                You must designate an active Backup Admin in the Staff Directory before initiating an ownership transfer.
              </p>
            </div>
          ) : (
            <form onSubmit={handleInitiateTransfer} className="space-y-5">
              <div className="p-4 rounded-2xl bg-clay/10 border border-clay/20 text-xs text-ink/90 font-body space-y-2">
                <div className="flex items-center gap-2 font-bold text-clay">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Important Governance Warning:</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Transferring permissions is an irreversible governance handover.
                  <strong> {backupAdmin.full_name}</strong> will become the primary{' '}
                  <strong>Admin</strong>, and your account will automatically become{' '}
                  <strong>Staff</strong>.
                </p>
              </div>

              {transferError && <ErrorMessage message={transferError} />}

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-navy font-heading">
                    Type <strong>"transfer admin permissions"</strong> to confirm:
                  </label>
                  <Input
                    label=""
                    placeholder="transfer admin permissions"
                    value={confirmPhrase}
                    onChange={(e) => setConfirmPhrase(e.target.value)}
                    autoComplete="off"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-center text-xs font-bold text-navy uppercase tracking-wider font-heading">
                    Enter Your Current TOTP Code
                  </label>
                  <OtpInput
                    value={adminTotpCode}
                    onChange={setAdminTotpCode}
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  loading={transferLoading}
                  disabled={
                    confirmPhrase.trim().toLowerCase() !== 'transfer admin permissions' ||
                    adminTotpCode.length !== 6
                  }
                  className="bg-gold hover:bg-gold/90 text-white"
                >
                  Initiate Transfer to {backupAdmin.full_name}
                </Button>
              </div>
            </form>
          )}
        </Card>
      )}
    </div>
  );
}
