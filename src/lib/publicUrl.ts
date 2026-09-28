/**
 * The address the outside world should use to reach this app.
 *
 * QR codes and staff-invitation links used to be built from
 * window.location.origin, i.e. whatever address the admin happened to be
 * browsing. Open the dashboard through a Vercel deployment-specific or
 * branch URL (which Vercel protects behind a login) and every QR code and
 * invite link inherited that address, so a phone scanning the poster landed
 * on Vercel's sign-in page instead of the registration form.
 *
 * Set VITE_PUBLIC_BASE_URL to the stable production address in the hosting
 * dashboard. If it is unset (local development, phone testing over the
 * network with `npm run dev -- --host`) it falls back to the current origin,
 * so those workflows are unchanged.
 */
const configured = ((import.meta.env.VITE_PUBLIC_BASE_URL as string | undefined) ?? '')
  .trim()
  .replace(/\/+$/, '');

export const PUBLIC_BASE_URL: string = configured || window.location.origin;