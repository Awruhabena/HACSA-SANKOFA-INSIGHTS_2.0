import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Role, StaffProfile } from '../lib/types';

export interface PendingRoleAction {
  id: string;
  // Matches the database column exactly: the table has a `type` column
  // with values 'designation' | 'transfer'. An earlier version of this
  // interface declared `action_type: 'backup_admin' | 'permission_transfer'`,
  // which matched nothing — every .find() on it silently returned
  // undefined, so the accept pages could never locate a real request.
  type: 'designation' | 'transfer';
  initiator_id: string;
  target_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  created_at: string;
  resolved_at: string | null;
}

interface AuthContextType {
  user: { id: string; email: string; user_metadata?: Record<string, unknown> } | null;
  role: Role | null;
  staffProfile: StaffProfile | null;
  pendingRoleActions: PendingRoleAction[];
  refreshPendingRoleActions: () => Promise<void>;
  isAuthenticated: boolean;
  mfaRequired: boolean;
  mfaVerified: boolean;
  needsMfaEnrollment: boolean;
  needsPassword: boolean;
  isLoading: boolean;
  deactivationNotice: string | null;
  clearDeactivationNotice: () => void;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; emailNotConfirmed?: boolean }>;
  verifyMfa: (code: string) => Promise<{
    success: boolean;
    error?: string;
    isLocked?: boolean;
    attemptsRemaining?: number;
    lockedUntil?: string;
  }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string; user_metadata?: Record<string, unknown> } | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [staffProfile, setStaffProfile] = useState<StaffProfile | null>(null);
  const [pendingRoleActions, setPendingRoleActions] = useState<PendingRoleAction[]>([]);

  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaVerified, setMfaVerified] = useState(false);
  const [needsMfaEnrollment, setNeedsMfaEnrollment] = useState(false);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deactivationNotice, setDeactivationNotice] = useState<string | null>(() => {
    return sessionStorage.getItem('hacsa_deactivation_notice');
  });

  const clearDeactivationNotice = useCallback(() => {
    setDeactivationNotice(null);
    sessionStorage.removeItem('hacsa_deactivation_notice');
  }, []);

  const refreshPendingRoleActions = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('pending_role_actions')
        .select('*')
        .eq('target_id', user.id)
        .eq('status', 'pending');
      if (data) {
        setPendingRoleActions(data as PendingRoleAction[]);
      }
    } catch {
      // Ignored if table not ready
    }
  }, [user]);

  const checkUserStatus = useCallback(async (sessionUser: any) => {
    if (!sessionUser) {
      setUser(null);
      setRole(null);
      setStaffProfile(null);
      setMfaRequired(false);
      setMfaVerified(false);
      setNeedsMfaEnrollment(false);
      setPendingRoleActions([]);
      setIsLoading(false);
      return;
    }

    try {
      // 1. Check TOTP factors and AAL level via real Supabase MFA API
      const [factorsRes, aalRes] = await Promise.all([
        supabase.auth.mfa.listFactors(),
        supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
      ]);

      const totpFactors = factorsRes.data?.totp ?? [];
      const hasVerifiedTotp = totpFactors.some((f) => f.status === 'verified');
      const aalData = aalRes.data;

      if (!hasVerifiedTotp) {
        // No TOTP factor enrolled yet -> Must enroll TOTP
        setNeedsMfaEnrollment(true);
        setMfaRequired(true);
        setMfaVerified(false);
      } else if (aalData?.currentLevel === 'aal1' && aalData?.nextLevel === 'aal2') {
        // Factor enrolled, but session is only AAL1 -> Must verify TOTP code
        setNeedsMfaEnrollment(false);
        setMfaRequired(true);
        setMfaVerified(false);
      } else {
        // Session is fully verified at AAL2
        setNeedsMfaEnrollment(false);
        setMfaRequired(false);
        setMfaVerified(true);
      }

      // Check if session flagged as needing password (invite flow)
      if (sessionUser.user_metadata?.needs_password) {
        setNeedsPassword(true);
      } else {
        setNeedsPassword(false);
      }

      // 2. Query staff profile & role
      const { data: profile } = await supabase
        .from('staff_profiles')
        .select('*')
        .eq('id', sessionUser.id)
        .maybeSingle();

      // A completely absent row can only ever mean "hasn't finished
      // signing up yet" — deactivation is a soft flag (is_active = false)
      // on an EXISTING row; it never deletes the row. So there is no
      // page-by-page guessing needed here: no row, ever, on any page,
      // simply means mid-signup, and genuine deactivation is only ever
      // profile.is_active === false on a row that does exist.
      if (!profile) {
        setRole(null);
        setStaffProfile(null);
      } else if (!profile.is_active) {
        sessionStorage.setItem(
          'hacsa_deactivation_notice',
          'Your account has been deactivated. Please contact your Admin for assistance.'
        );
        setDeactivationNotice(
          'Your account has been deactivated. Please contact your Admin for assistance.'
        );
        await supabase.auth.signOut();
        setUser(null);
        setRole(null);
        setStaffProfile(null);
        setIsLoading(false);
        window.location.href = '/login';
        return;
      } else {
        setRole(profile.role);
        setStaffProfile(profile);
      }

      // 3. Query pending role action requests targeting this user
      try {
        const { data: pending } = await supabase
          .from('pending_role_actions')
          .select('*')
          .eq('target_id', sessionUser.id)
          .eq('status', 'pending');
        if (pending) {
          setPendingRoleActions(pending as PendingRoleAction[]);
        }
      } catch {
        // Ignored
      }
    } catch {
      // Failure to check status
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial session lookup
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user as any);
        checkUserStatus(session.user);
      } else {
        setUser(null);
        setRole(null);
        setStaffProfile(null);
        setIsLoading(false);
      }
    });

    // Rule: Never call Supabase directly from inside onAuthStateChange's callback!
    // Defer with setTimeout(..., 0)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => {
        if (session?.user) {
          setUser(session.user as any);
          checkUserStatus(session.user);
        } else {
          setUser(null);
          setRole(null);
          setStaffProfile(null);
          setMfaRequired(false);
          setMfaVerified(false);
          setNeedsMfaEnrollment(false);
          setPendingRoleActions([]);
          setIsLoading(false);
        }
      }, 0);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [checkUserStatus]);

  const signIn = async (email: string, password: string) => {
    clearDeactivationNotice();
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (
          error.message.includes('Email not confirmed') ||
          (error as any).code === 'email_not_confirmed'
        ) {
          return { error, emailNotConfirmed: true };
        }
        // No fake login bypass! A failed call must always fail.
        return { error };
      }

      if (data.user) {
        setUser(data.user as any);
        await checkUserStatus(data.user);
      }
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const verifyMfa = async (code: string) => {
    if (!user) {
      return { success: false, error: 'No authenticated user session found' };
    }

    try {
      // 1. Check lockout via RPC check_mfa_lockout
      try {
        const { data: isLocked } = await supabase.rpc('check_mfa_lockout', {
          p_user_id: user.id,
        });
        if (isLocked) {
          return {
            success: false,
            isLocked: true,
            error: 'Account temporarily locked due to too many failed attempts.',
          };
        }
      } catch {
        // Fallback if RPC not yet deployed
      }

      // 2. Fetch enrolled TOTP factor
      const factorsRes = await supabase.auth.mfa.listFactors();
      const totpFactor = factorsRes.data?.totp?.[0];
      if (!totpFactor) {
        return { success: false, error: 'No TOTP factor enrolled. Please configure authenticator.' };
      }

      // 3. Challenge and verify
      const challengeRes = await supabase.auth.mfa.challenge({ factorId: totpFactor.id });
      if (challengeRes.error) {
        return { success: false, error: challengeRes.error.message };
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challengeRes.data.id,
        code: code.trim(),
      });

      if (verifyError) {
        // Record failure
        try {
          const { data: failData } = await supabase.rpc('record_mfa_failure', {
            p_user_id: user.id,
          });
          if (failData) {
            return {
              success: false,
              error: verifyError.message,
              isLocked: failData.locked,
              attemptsRemaining: failData.attempts_remaining,
              lockedUntil: failData.locked_until,
            };
          }
        } catch {
          // Ignored
        }
        return { success: false, error: verifyError.message || 'Incorrect verification code' };
      }

      // 4. On success: clear failures
      try {
        await supabase.rpc('clear_mfa_failures', { p_user_id: user.id });
      } catch {
        // Ignored
      }

      setMfaVerified(true);
      setMfaRequired(false);

      // Rule: Full page load so route guards re-read the new AAL2 state cleanly
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 200);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Verification failed' };
    }
  };

  const signOut = async () => {
    setUser(null);
    setRole(null);
    setStaffProfile(null);
    setMfaRequired(false);
    setMfaVerified(false);
    setNeedsMfaEnrollment(false);
    setPendingRoleActions([]);
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignored
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        staffProfile,
        pendingRoleActions,
        refreshPendingRoleActions,
        isAuthenticated: !!user,
        mfaRequired,
        mfaVerified,
        needsMfaEnrollment,
        needsPassword,
        isLoading,
        deactivationNotice,
        clearDeactivationNotice,
        signIn,
        verifyMfa,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
