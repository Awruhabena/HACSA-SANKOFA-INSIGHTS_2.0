export type RoleType = 'admin' | 'backup_admin' | 'staff';

interface RoleBadgeProps {
  role: RoleType | string;
  className?: string;
}

export function RoleBadge({ role, className = '' }: RoleBadgeProps) {
  // Normalize role string
  const normalized = role.toLowerCase().replace(/[-\s]/g, '_');

  let badgeStyles = 'bg-navy/15 text-navy border-navy/30';
  let label = 'Staff';

  if (normalized === 'admin') {
    badgeStyles = 'bg-gold/20 text-amber-900 border-gold/40';
    label = 'Admin';
  } else if (normalized === 'backup_admin' || normalized === 'backupadmin') {
    badgeStyles = 'bg-teal/20 text-teal border-teal/40';
    label = 'Backup Admin';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border font-heading tracking-wide ${badgeStyles} ${className}`}
    >
      {label}
    </span>
  );
}
