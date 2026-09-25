export interface CountryOption {
  value: string;
  label: string;
  group: string;
}

export const COUNTRIES: CountryOption[] = [
  // Ghana
  { value: 'Ghana', label: 'Ghana', group: 'Ghana' },
  // Africa
  { value: 'Nigeria', label: 'Nigeria', group: 'Africa' },
  { value: 'Kenya', label: 'Kenya', group: 'Africa' },
  { value: 'South Africa', label: 'South Africa', group: 'Africa' },
  { value: 'Senegal', label: 'Senegal', group: 'Africa' },
  { value: 'Côte d\'Ivoire', label: 'Côte d\'Ivoire', group: 'Africa' },
  { value: 'Togo', label: 'Togo', group: 'Africa' },
  { value: 'Benin', label: 'Benin', group: 'Africa' },
  { value: 'Burkina Faso', label: 'Burkina Faso', group: 'Africa' },
  { value: 'Ethiopia', label: 'Ethiopia', group: 'Africa' },
  { value: 'Tanzania', label: 'Tanzania', group: 'Africa' },
  { value: 'Uganda', label: 'Uganda', group: 'Africa' },
  { value: 'Rwanda', label: 'Rwanda', group: 'Africa' },
  { value: 'Morocco', label: 'Morocco', group: 'Africa' },
  { value: 'Egypt', label: 'Egypt', group: 'Africa' },
  { value: 'Other African country', label: 'Other African country', group: 'Africa' },
  // Diaspora
  { value: 'United States', label: 'United States', group: 'Rest of World' },
  { value: 'United Kingdom', label: 'United Kingdom', group: 'Rest of World' },
  { value: 'Canada', label: 'Canada', group: 'Rest of World' },
  { value: 'Jamaica', label: 'Jamaica', group: 'Rest of World' },
  { value: 'Trinidad and Tobago', label: 'Trinidad and Tobago', group: 'Rest of World' },
  { value: 'Barbados', label: 'Barbados', group: 'Rest of World' },
  { value: 'Brazil', label: 'Brazil', group: 'Rest of World' },
  { value: 'France', label: 'France', group: 'Rest of World' },
  { value: 'Germany', label: 'Germany', group: 'Rest of World' },
  { value: 'Netherlands', label: 'Netherlands', group: 'Rest of World' },
  { value: 'Other Caribbean', label: 'Other Caribbean', group: 'Rest of World' },
  { value: 'Other Europe', label: 'Other Europe', group: 'Rest of World' },
  { value: 'Other (rest of world)', label: 'Other (rest of world)', group: 'Rest of World' },
];

export const HERITAGE_COUNTRIES: CountryOption[] = [
  ...COUNTRIES,
  { value: 'Prefer not to say', label: 'Prefer not to say', group: 'Other' },
];

/**
 * Whether a country is in Africa, derived from the existing `group` field
 * rather than a duplicated list — keeps this in sync automatically if the
 * country list is ever extended.
 *
 * Used to decide whether heritage country must be answered: for someone
 * registering from outside Africa it is the only thing distinguishing
 * African Diaspora from International Supporters, so leaving it optional
 * there would silently misclassify people.
 */
export function isAfricanCountry(country: string): boolean {
  const match = COUNTRIES.find((c) => c.value === country);
  return match?.group === 'Africa' || match?.group === 'Ghana';
}

// Exact dropdown values verified against database
export const INDUSTRIES = [
  'Technology',
  'Education',
  'Healthcare',
  'Arts & Creative',
  'Non-profit / NGO',
  'Finance & Business',
  'Media & Communications',
  'Government & Public Sector',
  'Tourism & Hospitality',
  'Student',
] as const;

export const OCCUPATION_STATUSES = [
  'Professional',
  'Entrepreneur',
  'Student',
  'Retired',
] as const;

export type RegionType =
  | 'local_ghana'
  | 'continental_africa'
  | 'diaspora'
  | 'international_supporter';

export const REGION_TYPE_LABELS: Record<RegionType, string> = {
  local_ghana: 'Local (Ghana)',
  continental_africa: 'Continental Africa',
  diaspora: 'African Diaspora',
  international_supporter: 'International Supporters',
};

// Brand palette chart colours
export const BRAND_CHART_COLORS = {
  teal: '#3C8C89',
  navy: '#1D3A58',
  gold: '#C8963E',
  sage: '#6B7A5E',
  clay: '#A63D2F',
  ochre: '#D97706',
};

export const REGION_TYPE_COLOURS: Record<RegionType, string> = {
  local_ghana: BRAND_CHART_COLORS.teal,
  diaspora: BRAND_CHART_COLORS.gold,
  continental_africa: BRAND_CHART_COLORS.navy,
  international_supporter: BRAND_CHART_COLORS.sage,
};

/** Action label mapping for staff logs with graceful fallback */
export const AUDIT_ACTION_LABELS: Record<string, string> = {
  create_event: 'created an event',
  update_event: 'updated an event',
  delete_event: 'deleted an event',
  generate_summary: 'generated an AI event summary',
  invite_staff: 'invited a new staff member',
  deactivate_staff: 'deactivated a staff account',
  reactivate_staff: 'reactivated a staff account',
  designate_backup_admin: 'designated a new Backup Admin',
  accept_backup_admin: 'accepted Backup Admin designation',
  decline_backup_admin: 'declined Backup Admin designation',
  initiate_transfer: 'initiated Admin permission transfer',
  accept_transfer: 'accepted Admin permission transfer',
  decline_transfer: 'declined Admin permission transfer',
  reset_password: 'triggered a password reset',
  reset_mfa: 'triggered an MFA reset',
  change_password: 'changed their password',
};

export function formatAuditAction(action: string, targetName?: string): string {
  const baseAction = AUDIT_ACTION_LABELS[action] || action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  if (targetName) {
    return `${baseAction} for "${targetName}"`;
  }
  return baseAction;
}

/** Helper: group COUNTRIES into optgroup-friendly structure */
export function getCountryGroups(countries: CountryOption[]) {
  const groups: { label: string; options: { value: string; label: string }[] }[] = [];
  const seen = new Set<string>();

  for (const c of countries) {
    const groupLabel = c.group || 'Other';
    if (!seen.has(groupLabel)) {
      seen.add(groupLabel);
      groups.push({
        label: groupLabel,
        options: countries
          .filter((o) => (o.group || 'Other') === groupLabel)
          .map((o) => ({ value: o.value, label: o.label })),
      });
    }
  }
  return groups;
}
