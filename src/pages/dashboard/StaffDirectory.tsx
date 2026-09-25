import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { StaffProfile } from '../../lib/types';
import {
  Button,
  Card,
  Input,
  RoleBadge,
  CodeDisplay,
  OtpInput,
  Modal,
  ConfirmDialog,
  ErrorMessage,
  Spinner,
} from '../../components/ui';
import {
  Users,
  UserPlus,
  ShieldCheck,
  KeyRound,
  RotateCcw,
  UserX,
  UserCheck,
  AlertTriangle,
  PhoneCall,
  Clock,
} from 'lucide-react';

function humanizeLastActive(dateStr: string | null): string {
  if (!dateStr) return 'Never signed in';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMin = Math.floor(diffMs / (1000 * 60));
  if (diffMin < 5) return 'Active now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default function StaffDirectory() {
  const { role } = useAuth();
  const [staffList, setStaffList] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Invite Modal
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteResultCode, setInviteResultCode] = useState<string | null>(null);

  // Designation Modal (Admin re-enters TOTP code to designate Backup Admin)
  const [designateTarget, setDesignateTarget] = useState<StaffProfile | null>(null);
  const [adminTotpCode, setAdminTotpCode] = useState('');
  const [designating, setDesignating] = useState(false);
  const [designationSuccess, setDesignationSuccess] = useState(false);

  // Deactivate/Reactivate Confirmation
  const [toggleActiveTarget, setToggleActiveTarget] = useState<{
    staff: StaffProfile;
    active: boolean;
  } | null>(null);
  const [togglingActive, setTogglingActive] = useState(false);

  // Assisted Resets (Password & MFA)
  const [resetTarget, setResetTarget] = useState<{
    staff: StaffProfile;
    type: 'password' | 'mfa';
  } | null>(null);
  const [resetting, setResetting] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  const fetchStaff = async () => {
    try {
      const data = await api.getStaffDirectory();
      setStaffList(data);
    } catch {
      setError('Failed to load staff directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const hasCurrentBackupAdmin = staffList.some(
    (s) => s.role === 'backup_admin' && s.is_active
  );

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;

    setInviting(true);
    setError(null);
    try {
      const res = await api.inviteStaff(inviteName.trim(), inviteEmail.trim());
      setInviteResultCode(res.verification_code);
      await fetchStaff();
    } catch {
      setError('Could not send invite. Please try again.');
    } finally {
      setInviting(false);
    }
  };

  const handleCloseInviteModal = () => {
    setInviteModalOpen(false);
    setInviteName('');
    setInviteEmail('');
    setInviteResultCode(null);
  };

  const handleConfirmDesignate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!designateTarget || adminTotpCode.length !== 6) return;

    setDesignating(true);
    setError(null);
    try {
      // Re-verify Admin TOTP factor to confirm action
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

      await api.designateBackupAdmin(designateTarget.id);
      setDesignationSuccess(true);
      await fetchStaff();
    } catch (err: any) {
      setError(err?.message || 'Failed to designate Backup Admin. Please check your authentication code.');
    } finally {
      setDesignating(false);
    }
  };

  const handleCloseDesignateModal = () => {
    setDesignateTarget(null);
    setAdminTotpCode('');
    setDesignationSuccess(false);
  };

  const handleConfirmToggleActive = async () => {
    if (!toggleActiveTarget) return;
    setTogglingActive(true);
    try {
      await api.toggleStaffActive(toggleActiveTarget.staff.id, toggleActiveTarget.active);
      await fetchStaff();
      setToggleActiveTarget(null);
    } catch {
      setError('Failed to update staff account status.');
    } finally {
      setTogglingActive(false);
    }
  };

  const handleConfirmReset = async () => {
    if (!resetTarget) return;
    setResetting(true);
    try {
      if (resetTarget.type === 'password') {
        await api.resetStaffPassword(resetTarget.staff.id);
        setResetSuccessMessage(`Password reset link generated for ${resetTarget.staff.full_name}.`);
      } else {
        await api.resetStaffMfa(resetTarget.staff.id);
        setResetSuccessMessage(`MFA factor reset for ${resetTarget.staff.full_name}. They will be prompted to set up TOTP on next login.`);
      }
      setResetTarget(null);
      setTimeout(() => setResetSuccessMessage(null), 5000);
    } catch {
      setError('Failed to process assisted reset.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-navy/15 text-navy border border-navy/30">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-navy tracking-tight">
              Staff Directory & Security
            </h1>
            <p className="text-xs text-gray mt-0.5">
              Manage personnel accounts, backup administration, and assisted resets.
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          onClick={() => setInviteModalOpen(true)}
          className="inline-flex items-center gap-2 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Invite Staff</span>
        </Button>
      </div>

      {resetSuccessMessage && (
        <div className="p-3.5 rounded-xl bg-teal/15 border border-teal/40 text-xs font-semibold text-teal-pressed flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          <span>{resetSuccessMessage}</span>
        </div>
      )}

      {error && <ErrorMessage message={error} />}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner className="w-8 h-8 text-teal" />
        </div>
      ) : (
        <Card className="p-0 overflow-hidden divide-y divide-border/60">
          <div className="px-6 py-4 bg-cream/50 flex items-center justify-between text-xs font-bold text-gray uppercase tracking-wider font-heading">
            <span>Staff Member</span>
            <span className="hidden sm:inline">Role & Status</span>
            <span>Actions</span>
          </div>

          <div className="divide-y divide-border/60">
            {staffList.map((staff) => {
              const isDeactivated = !staff.is_active;
              const isEligibleForBackup =
                staff.role === 'staff' &&
                staff.is_active &&
                !hasCurrentBackupAdmin;

              return (
                <div
                  key={staff.id}
                  className={`p-5 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                    isDeactivated
                      ? 'bg-black/5 opacity-60'
                      : 'hover:bg-cream/30'
                  }`}
                >
                  {/* Name, Email, Avatar */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-white border border-border flex items-center justify-center font-heading font-bold text-navy text-sm shadow-2xs shrink-0">
                      {staff.full_name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-heading font-bold text-sm text-navy truncate">
                          {staff.full_name}
                        </p>
                        {isDeactivated && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-clay/15 text-clay border border-clay/30 uppercase font-heading">
                            Deactivated
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray truncate font-mono">
                        {staff.email}
                      </p>
                      <p className="text-[11px] text-gray/80 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray/60" />
                        <span>{humanizeLastActive(staff.last_sign_in_at)}</span>
                      </p>
                    </div>
                  </div>

                  {/* Role Badge and Status */}
                  <div className="flex items-center gap-3 sm:justify-center">
                    <RoleBadge role={staff.role} />
                    {staff.backup_admin_pending && (
                      <span className="text-[10px] font-bold text-gold uppercase tracking-wider bg-gold/15 px-2 py-0.5 rounded-full border border-gold/30">
                        Pending Acceptance
                      </span>
                    )}
                  </div>

                  {/* Row Actions */}
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    {/* Designate as Backup Admin (only for eligible staff when no backup admin exists) */}
                    {isEligibleForBackup && role === 'admin' && (
                      <button
                        type="button"
                        onClick={() => setDesignateTarget(staff)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-teal/15 text-teal hover:bg-teal/25 border border-teal/30 transition-colors cursor-pointer flex items-center gap-1"
                        title="Designate as Backup Admin"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Designate Backup</span>
                      </button>
                    )}

                    {/* Reset Password */}
                    <button
                      type="button"
                      onClick={() => setResetTarget({ staff, type: 'password' })}
                      className="p-1.5 rounded-lg text-gray hover:text-navy hover:bg-black/5 transition-colors cursor-pointer"
                      title="Trigger Password Reset"
                      aria-label="Reset Password"
                    >
                      <KeyRound className="w-4 h-4" />
                    </button>

                    {/* Reset MFA */}
                    <button
                      type="button"
                      onClick={() => setResetTarget({ staff, type: 'mfa' })}
                      className="p-1.5 rounded-lg text-gray hover:text-navy hover:bg-black/5 transition-colors cursor-pointer"
                      title="Trigger MFA Reset"
                      aria-label="Reset MFA"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    {/* Deactivate / Reactivate (Cannot deactivate primary admin) */}
                    {staff.role !== 'admin' && (
                      <button
                        type="button"
                        onClick={() =>
                          setToggleActiveTarget({ staff, active: !staff.is_active })
                        }
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          staff.is_active
                            ? 'text-gray hover:text-clay hover:bg-clay/10'
                            : 'text-teal hover:text-teal-pressed hover:bg-teal/10'
                        }`}
                        title={staff.is_active ? 'Deactivate Account' : 'Reactivate Account'}
                        aria-label={staff.is_active ? 'Deactivate Account' : 'Reactivate Account'}
                      >
                        {staff.is_active ? (
                          <UserX className="w-4 h-4" />
                        ) : (
                          <UserCheck className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Invite Staff Modal */}
      <Modal
        open={inviteModalOpen}
        onClose={handleCloseInviteModal}
        title={inviteResultCode ? 'Staff Invitation Generated' : 'Invite Staff Member'}
      >
        {inviteResultCode ? (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-cream border border-border/80 text-xs text-ink/80 leading-relaxed font-body">
              <div className="flex items-center gap-2 font-bold text-navy mb-1.5">
                <PhoneCall className="w-4 h-4 text-teal" />
                <span>Strict Security Protocol:</span>
              </div>
              <p>
                Give this 6-digit verification code to <strong>{inviteName}</strong>{' '}
                <strong>by phone or in person</strong>.
              </p>
              <p className="mt-1 font-semibold text-clay">
                Never send this verification code via email.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray uppercase tracking-widest text-center">
                One-Time Verification Code
              </label>
              <CodeDisplay code={inviteResultCode} />
            </div>

            <div className="p-3 rounded-xl bg-gold/15 border border-gold/40 text-[11px] font-semibold text-amber-950 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-gold shrink-0 mt-0.5" />
              <span>
                Warning: This code will not be shown again once you close this window.
              </span>
            </div>

            <Button
              type="button"
              variant="primary"
              onClick={handleCloseInviteModal}
              className="w-full"
            >
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSendInvite} className="space-y-4">
            <p className="text-xs text-gray leading-relaxed">
              Invite a colleague to join the HACSA Sankofa Insights portal. They will create their password and configure mandatory two-factor authentication upon first login.
            </p>

            <Input
              id="invite-name"
              label="Full Name *"
              placeholder="e.g. Kwame Mensah"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              required
            />

            <Input
              id="invite-email"
              label="Email Address *"
              type="email"
              placeholder="kwame@hacsa.org (or personal email)"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              helperText="Any organizational or personal domain is accepted"
              autoComplete="off"
              required
            />

            <div className="pt-2 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCloseInviteModal}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={inviting}>
                Send Invite
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Designate Backup Admin Modal (Re-enter TOTP Code) */}
      <Modal
        open={!!designateTarget}
        onClose={handleCloseDesignateModal}
        title="Designate Backup Admin"
      >
        {designationSuccess ? (
          <div className="text-center py-6 space-y-3">
            <ShieldCheck className="w-12 h-12 text-teal mx-auto" />
            <h3 className="font-heading font-bold text-lg text-navy">
              Designation Request Sent
            </h3>
            <p className="text-xs text-gray">
              {designateTarget?.full_name} will see a notification banner upon their next login to accept the Backup Admin role.
            </p>
            <Button
              type="button"
              variant="primary"
              onClick={handleCloseDesignateModal}
              className="mt-2"
            >
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleConfirmDesignate} className="space-y-4">
            <p className="text-xs text-gray leading-relaxed">
              You are designating <strong>{designateTarget?.full_name}</strong> as the system <strong>Backup Admin</strong>.
            </p>

            <div className="p-3 rounded-xl bg-teal/10 border border-teal/30 text-xs text-teal-pressed">
              Backup Admins have full access to the staff directory, logs, and account resets.
            </div>

            <div className="pt-2 space-y-2">
              <label className="block text-center text-xs font-bold text-navy uppercase tracking-wider font-heading">
                Confirm It's You: Enter Your Current TOTP Code
              </label>
              <OtpInput
                value={adminTotpCode}
                onChange={setAdminTotpCode}
              />
            </div>

            <div className="pt-4 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCloseDesignateModal}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={designating}
                disabled={adminTotpCode.length !== 6}
              >
                Confirm Designation
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Deactivate/Reactivate Confirmation Dialog */}
      <ConfirmDialog
        open={!!toggleActiveTarget}
        onClose={() => setToggleActiveTarget(null)}
        title={
          toggleActiveTarget?.active
            ? 'Reactivate Staff Account?'
            : 'Deactivate Staff Account?'
        }
        confirmLabel={toggleActiveTarget?.active ? 'Reactivate' : 'Deactivate'}
        confirmVariant={toggleActiveTarget?.active ? 'primary' : 'danger'}
        loading={togglingActive}
        onConfirm={handleConfirmToggleActive}
        description={
          toggleActiveTarget?.active ? (
            <p>
              Reactivating <strong>{toggleActiveTarget.staff.full_name}</strong> will restore their access to the portal immediately.
            </p>
          ) : (
            <p>
              Deactivating <strong>{toggleActiveTarget?.staff.full_name}</strong> will immediately revoke their session and block all portal access until reactivated.
            </p>
          )
        }
      />

      {/* Assisted Reset Confirmation Dialog */}
      <ConfirmDialog
        open={!!resetTarget}
        onClose={() => setResetTarget(null)}
        title={
          resetTarget?.type === 'password'
            ? 'Trigger Password Reset?'
            : 'Trigger MFA Reset?'
        }
        confirmLabel="Proceed"
        confirmVariant="navy"
        loading={resetting}
        onConfirm={handleConfirmReset}
        description={
          resetTarget?.type === 'password' ? (
            <p>
              Send an assisted password reset link to <strong>{resetTarget?.staff.email}</strong>?
            </p>
          ) : (
            <p>
              Reset the two-factor authentication factor for <strong>{resetTarget?.staff.full_name}</strong>? They will be forced to reconfigure TOTP on next login.
            </p>
          )
        }
      />
    </div>
  );
}
