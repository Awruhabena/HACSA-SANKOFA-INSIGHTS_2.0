# HACSA Sankofa Insights

Event registration, feedback collection and analytics for the Heritage & Cultural Society of Africa.

Attendees register and leave feedback through public QR-code links. Staff sign in to a protected dashboard to manage events and view analytics, including AI-generated summaries of attendee feedback.

## Stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · React Router v7 · Recharts · Supabase (Postgres, Auth, Edge Functions)

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the real values
npm run dev
```

The app runs at `http://localhost:5173`.

To test QR codes from a phone, expose the dev server on your local network:

```bash
npm run dev -- --host
```

Then open the printed **Network** address (not `localhost`) — QR codes encode whatever origin you are browsing from, so `localhost` links will not resolve on another device.

## Environment variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon (publishable) key |

The anon key is public by design — it ships in the client bundle. Access control is enforced by Postgres Row Level Security and by role checks inside each RPC, not by keeping this key secret.

Set both in the hosting provider's environment settings as well as locally. `.env.local` is gitignored and never reaches a build server.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run Oxlint |
| `npm run preview` | Preview the production build locally |

## Roles

| Role | Capabilities |
|---|---|
| **Admin** | Everything, including staff management, audit logs, invitations and role transfers |
| **Backup Admin** | Same as Admin, from the moment they accept designation |
| **Staff** | Events (create, edit, delete), AI summaries, dashboard analytics |

Every account uses TOTP two-factor authentication. There is no password reset link on the sign-in page — resets are initiated by an Admin, or from within the app once signed in.

New staff are invited by email, and must additionally enter a 6-digit code that is shown only on the inviting Admin's screen and relayed separately (by phone or in person). This means a compromised inbox alone is not enough to claim an account.

## Attendee categories

Attendees are classified automatically from the country and heritage country they provide:

- **Local (Ghana)** — currently in Ghana
- **Continental Africa** — currently elsewhere in Africa
- **African Diaspora** — outside Africa, with African heritage
- **International Supporters** — outside Africa, without African heritage

Heritage country is required only when registering from outside Africa, since that answer is what separates the last two groups.

## Deployment

Any static host works. On Vercel, `vercel.json` rewrites all routes to `index.html` so client-side routing and deep links (including QR code registration URLs) resolve correctly.

Remember to set the two environment variables in the hosting dashboard — a gitignored `.env.local` never reaches the build.

## Backend

Schema, RPCs, edge functions and data flow are documented in [`BACKEND_HANDOFF.md`](./BACKEND_HANDOFF.md).
