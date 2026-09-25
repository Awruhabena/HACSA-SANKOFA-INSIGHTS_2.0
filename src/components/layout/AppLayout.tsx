import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import type { StaffProfile } from '../../lib/types';
import { RoleBadge } from '../ui/RoleBadge';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  ScrollText,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

const ROLE_WIDGET_STYLE: Record<StaffProfile['role'], string> = {
  admin: 'bg-gold/20 text-amber-900 border-gold/40',
  backup_admin: 'bg-teal/20 text-teal border-teal/40',
  staff: 'bg-navy/15 text-navy border-navy/30',
};

function initialsFor(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function activityFor(lastSignInAt: string | null): { label: string; active: boolean } {
  if (!lastSignInAt) return { label: 'Never signed in', active: false };
  const diffMs = Date.now() - new Date(lastSignInAt).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 5) return { label: 'Active now', active: true };
  if (minutes < 60) return { label: `${minutes}m ago`, active: false };
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return { label: `${hours}h ago`, active: false };
  const days = Math.floor(hours / 24);
  return { label: `${days}d ago`, active: false };
}

export function AppLayout() {
  const navigate = useNavigate();
  const { role, staffProfile, signOut, pendingRoleActions } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<StaffProfile[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);

  const isAdminOrBackup = role === 'admin' || role === 'backup_admin';

  useEffect(() => {
    if (!isAdminOrBackup) return;
    let cancelled = false;
    setLoadingTeam(true);
    api
      .getStaffDirectory()
      .then((staff) => {
        if (!cancelled) setTeamMembers(staff);
      })
      .catch(() => {
        if (!cancelled) setTeamMembers([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingTeam(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAdminOrBackup]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 select-none ${
      isActive
        ? 'bg-navy text-white shadow-xs'
        : 'text-ink/80 hover:text-ink hover:bg-black/5'
    }`;

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between p-5 overflow-y-auto">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-1 pt-1">
          <div className="h-10 w-10 rounded-2xl bg-white p-1 flex items-center justify-center shrink-0 border border-border shadow-2xs">
            <img
              src="/hacsa-logo.png"
              alt="HACSA Foundation Logo"
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-heading text-base font-bold text-navy tracking-tight leading-tight">
                HACSA Sankofa
              </h1>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-teal/15 text-[9px] font-bold text-teal tracking-wide uppercase font-heading">
                Insights
              </span>
            </div>
            <p className="text-[11px] font-medium text-gray">Heritage Foundation</p>
          </div>
        </div>

        {/* Primary Navigation - Visible to All Roles */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold text-gray uppercase tracking-widest font-heading mb-2">
            Workspace
          </p>
          <NavLink
            to="/dashboard"
            className={navLinkClass}
            onClick={() => setMobileMenuOpen(false)}
          >
            <LayoutDashboard className="w-4 h-4 text-teal" />
            <span>Dashboard</span>
          </NavLink>
          <NavLink
            to="/events"
            className={navLinkClass}
            onClick={() => setMobileMenuOpen(false)}
          >
            <CalendarDays className="w-4 h-4 text-teal" />
            <span>Events</span>
          </NavLink>
        </div>

        {/* Elevated Section - Visible only to Admin & Backup Admin */}
        {isAdminOrBackup && (
          <div className="space-y-1 pt-2 border-t border-border/60">
            <p className="px-3 text-[10px] font-bold text-gray uppercase tracking-widest font-heading mb-2">
              People & Security
            </p>
            <NavLink
              to="/staff"
              className={navLinkClass}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Users className="w-4 h-4 text-navy" />
              <span>Staff Directory</span>
            </NavLink>
            <NavLink
              to="/logs"
              className={navLinkClass}
              onClick={() => setMobileMenuOpen(false)}
            >
              <ScrollText className="w-4 h-4 text-navy" />
              <span>Staff Logs</span>
            </NavLink>
          </div>
        )}

        {/* General Settings */}
        <div className="space-y-1 pt-2 border-t border-border/60">
          <NavLink
            to="/settings"
            className={navLinkClass}
            onClick={() => setMobileMenuOpen(false)}
          >
            <SettingsIcon className="w-4 h-4 text-gray" />
            <span>Account Settings</span>
          </NavLink>
        </div>

        {/* Team Members Widget - Admin and Backup Admin only */}
        {isAdminOrBackup && (
          <div className="pt-2 border-t border-border/60">
            <div className="flex items-center justify-between px-3 mb-2.5">
              <span className="text-[10px] font-bold text-gray uppercase tracking-widest font-heading">
                Team Members
              </span>
              <NavLink
                to="/staff"
                className="text-[11px] font-bold text-teal hover:underline"
                onClick={() => setMobileMenuOpen(false)}
              >
                View all
              </NavLink>
            </div>

            <div className="space-y-1.5 px-1">
              {loadingTeam ? (
                <p className="text-[11px] text-gray px-1.5 py-2">Loading team…</p>
              ) : teamMembers.length === 0 ? (
                <p className="text-[11px] text-gray px-1.5 py-2">No other staff yet.</p>
              ) : (
                teamMembers.slice(0, 5).map((m) => {
                  const activity = activityFor(m.last_sign_in_at);
                  return (
                    <div
                      key={m.id}
                      className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-black/5 transition-colors"
                    >
                      <div className="relative shrink-0">
                        <div
                          className={`w-7 h-7 rounded-full border flex items-center justify-center text-[10px] font-bold font-heading ${ROLE_WIDGET_STYLE[m.role]}`}
                        >
                          {initialsFor(m.full_name)}
                        </div>
                        {activity.active && (
                          <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-teal ring-1.5 ring-cream" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-ink truncate leading-tight">
                          {m.full_name}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] text-gray truncate">
                          <span className="capitalize font-medium">{m.role.replace('_', ' ')}</span>
                          <span>·</span>
                          <span>{activity.label}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Pinned Bottom User & Sign Out */}
      <div className="pt-4 border-t border-border/80 space-y-3">
        {/* Current user badge */}
        <div className="flex items-center justify-between px-2 py-1 bg-white/70 rounded-xl border border-border/80">
          <div className="min-w-0 pr-2">
            <p className="text-xs font-bold text-navy truncate">
              {staffProfile?.full_name || 'Staff User'}
            </p>
            <p className="text-[10px] text-gray truncate">
              {staffProfile?.email}
            </p>
          </div>
          {role && <RoleBadge role={role} />}
        </div>

        {/* Sign Out Button */}
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-clay bg-clay/5 hover:bg-clay/15 border border-clay/20 transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream font-body text-ink flex flex-col md:flex-row">
      {/* Desktop Fixed Left Sidebar (~288px, warmer cream tone) */}
      <aside className="hidden md:flex flex-col w-72 fixed inset-y-0 left-0 bg-[#EDE6DC] border-r border-border z-30 shadow-xs">
        {sidebarContent}
      </aside>

      {/* Mobile Sticky Top Header with Hamburger */}
      <header className="md:hidden sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img
            src="/hacsa-logo.png"
            alt="HACSA Foundation Logo"
            className="h-8 w-8 object-contain"
          />
          <span className="font-heading font-bold text-navy text-sm">
            HACSA Sankofa Insights
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl text-navy hover:bg-cream border border-border transition-colors cursor-pointer"
          aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-ink/40 backdrop-blur-xs flex"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-72 max-w-[85vw] bg-[#EDE6DC] h-full shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 md:pl-72 flex flex-col min-w-0 min-h-screen">
        {/* Desktop Utility Bar */}
        <div className="hidden md:flex items-center justify-between px-8 py-3 border-b border-border/60 bg-white/40 backdrop-blur-xs text-xs text-gray">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-navy font-heading">HACSA Sankofa Insights</span>
            <ChevronRight className="w-3.5 h-3.5 text-gray/60" />
            <span className="capitalize">{role?.replace('_', ' ')} Portal</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleSignOut}
              className="hover:text-clay transition-colors flex items-center gap-1 font-semibold cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        </div>

        {/* Content container - Generous padding, max-w-admin (~1200px), centered */}
        <main className="flex-1 w-full max-w-admin mx-auto px-4 sm:px-8 py-6 sm:py-8">
          {/* Pending role-action banner. Without this there was no way to
              discover a designation or transfer request at all — the
              accept pages existed but nothing ever linked to them. */}
          {pendingRoleActions.length > 0 && (
            <div className="mb-6 space-y-3">
              {pendingRoleActions.map((action) => (
                <div
                  key={action.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-gold/40 bg-gold/10 px-4 py-3.5"
                >
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-navy font-heading">
                        {action.type === 'designation'
                          ? "You've been asked to become Backup Admin"
                          : "You've been asked to accept the Admin role"}
                      </p>
                      <p className="text-xs text-ink/70 mt-0.5">
                        {action.type === 'designation'
                          ? 'Review what this role involves, then accept or decline.'
                          : 'Accepting makes you the Admin. Review before deciding.'}
                      </p>
                    </div>
                  </div>
                  <NavLink
                    to={
                      action.type === 'designation'
                        ? `/designation/accept/${action.id}`
                        : `/transfer/accept/${action.id}`
                    }
                    className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-xl bg-navy px-4 py-2 text-xs font-semibold text-white hover:bg-navy/90 transition-colors"
                  >
                    Review request
                    <ChevronRight className="w-3.5 h-3.5" />
                  </NavLink>
                </div>
              ))}
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
