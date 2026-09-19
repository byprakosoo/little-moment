# Little Moment

Little Moment is a private, mobile-first family journal for saving daily stories, child milestones, and photos together. It is designed as a self-hosted template: each family forks the repository and deploys its own app, database, OAuth credentials, and email delivery credentials.

## Features

- Google OAuth and email/password authentication through Better Auth.
- Family membership and one-time email invitations.
- Configurable family name and parent labels (defaults: `Baba` and `Bubu`).
- Timeline with search, date/type/author filters, milestones, and daily stories.
- Create, edit, delete, and photo gallery support.
- Private family-scoped data access through Drizzle ORM and MySQL-compatible TiDB.
- Preview mode for reviewing the UI without a database.

## Stack

- Next.js 15 + React 19 + TypeScript
- Better Auth
- Drizzle ORM + MySQL/TiDB Cloud Starter
- Vercel deployment
- Gmail SMTP for invitation delivery (optional)

## Quick start: preview mode

Preview mode uses generic local fixture data and localStorage. It does not require a database or external credentials.

```bash
npm install
npm run dev
```

Open `http://localhost:3010`. To make the mode explicit, use `NEXT_PUBLIC_BACKEND_MODE=preview`.

## API mode

1. Copy the environment template:

   ```bash
   cp .env.example .env.local
   ```

2. Fill in a TiDB Cloud MySQL connection string, a random `BETTER_AUTH_SECRET`, and:

   ```dotenv
   NEXT_PUBLIC_BACKEND_MODE=api
   BETTER_AUTH_URL=http://localhost:3010
   NEXT_PUBLIC_APP_URL=http://localhost:3010
   ```

3. Apply the schema and start the app:

   ```bash
   # Jalur yang direkomendasikan untuk database baru maupun existing:
   npm run db:migrate
   # Gunakan db:push hanya untuk database development yang memang direview.
   npm run dev
   ```

Use `DEPLOY.md` for the complete TiDB, Vercel, Google OAuth, and Gmail SMTP setup. Keep Secret variables in the deployment provider; never place real values in tracked files.

## Production deployment

Each family should create its own:

1. GitHub fork or repository.
2. TiDB Cloud Starter database and connection string.
3. Vercel project and environment variables.
4. Google OAuth client with that deployment's callback URL.
5. Gmail App Password if email invitations are enabled.

The deployment URL must be used consistently for `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`, and Google OAuth origins/redirects. Run `npm run db:migrate` against the target database before the first API-mode deployment.

## Privacy model

Every API query resolves the authenticated user's family membership before reading or writing family data. Deployments are intentionally isolated rather than using one shared multi-family database. Photos are compressed in the browser and stored as private data URLs in the `photos` table for the MVP; move to private object storage before scaling photo volume.

## Development checks

```bash
npx tsc --noEmit
npm run build
git diff --check
```

See `SECURITY.md` before publishing a fork or changing a repository's visibility.

## License

MIT. See [LICENSE](./LICENSE).
