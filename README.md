This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3001](http://localhost:3001) with your browser to see the result.

The App Router lives under `src/app`. Copy `.env.example` to `.env` and set at least `DATABASE_URL`, `BETTER_AUTH_SECRET` (32+ characters), and `NEXT_PUBLIC_APP_URL` before running auth flows.

## Docker Setup

### Local Development

Runs only PostgreSQL — the app runs via `pnpm dev` on your host machine.

```bash
docker compose up -d        # start local Postgres on port 5431
docker compose down         # stop
docker compose down -v      # stop and delete data
```

### Production (VPS)

Runs both Postgres and the Next.js app.

```bash
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml logs -f app
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
