# MZDATA Web

Premium Next.js rebuild of the MZDATA web dashboard.

## Stack

- Next.js
- Tailwind CSS
- shadcn/ui-style primitives
- Lucide icons

## Development

Set environment variables from `.env.example`, then install dependencies and run the app:

```bash
npm install
npm run dev
```

If your environment uses a different package manager, use the equivalent commands.

## Routes

- `/` - auth entry
- `/login` - login screen
- `/register` - registration screen
- `/dashboard` - workspace overview
- `/buy-data` - data purchase
- `/wallet` - wallet and funding accounts
- `/history` - transaction history
- `/profile` - account and referral controls

## API

The frontend points to the existing MZDATA backend API. Override the default base URL with:

```bash
NEXT_PUBLIC_API_BASE=
```

## Domain deployment

For the production web app on `mzdata.com`, deploy this workspace to Vercel and set:

```bash
NEXT_PUBLIC_API_BASE=/api/v1
```

That keeps the app same-origin on the custom domain while Vercel rewrites `/api/v1/*`, `/healthz`, and `/readyz` to the existing backend.

Legacy links from the old app are redirected in `next.config.mjs`:

- `/app/login` -> `/login`
- `/app/register` -> `/register`
- `/app/wallet` -> `/wallet`
- `/app/data` -> `/buy-data`
- `/app/history` -> `/history`
- `/app/profile` -> `/profile`
