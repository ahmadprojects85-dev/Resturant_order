# Deployment Guide

This application is built with Next.js, Prisma, and SQLite. Follow these steps to deploy it to various platforms.

## Prerequisites

1. **Environment Variables**: Use `.env.example` as a template to create your production `.env` file.
2. **Database**: The default configuration uses SQLite (`dev.db`). For platforms that don't support persistent disk storage (like Vercel), you should switch to a hosted PostgreSQL or MySQL database.

## Deployment Options

### 1. Cloudflare Pages (Recommended for High Performance)
> [!WARNING]
> Cloudflare Pages is serverless. **SQLite (`dev.db`) will NOT work** because it requires a persistent disk. You must switch to a remote database.

1. **Database Options**:
   - **Supabase (Postgres)**: Easiest. High compatibility with Prisma.
   - **Cloudflare D1**: Native but requires minor configuration changes.
2. **Setup**:
   - Connect your GitHub repo to Cloudflare Pages.
   - Select **Next.js** as the framework.
   - Add `DATABASE_URL` in the Cloudflare Dashboard settings.
3. **Build**: Cloudflare will automatically build and deploy your app.

### 2. Vercel (Recommended for simplicity)
> [!IMPORTANT]
> Since Vercel is serverless, SQLite will not persist data between requests. Use a hosted database like Vercel Postgres or Supabase.

1. Connect your repository to Vercel.
2. Add your environment variables (especially `DATABASE_URL`).
3. Vercel will automatically detect Next.js and run `npm run build`.

### 2. Railway / Render / DigitalOcean (Recommended for SQLite)
These platforms allow mounting a persistent volume, which is required if you want to keep using SQLite.

1. **Build Command**: `npm run build`
2. **Start Command**: `npm run start`
3. **Environment Variables**: Add `DATABASE_URL="file:./data/prod.db"` and ensure the `/data` directory is mounted on a persistent volume.

### 3. Docker (VPS / Cloud Run)
Use the provided `Dockerfile` to build a containerized version of the app.

```bash
docker build -t restaurant-app .
docker run -p 3000:3000 restaurant-app
```

## Post-Deployment Checklist
- [ ] Run `npx prisma db push` or `npx prisma migrate deploy` to set up the production database.
- [ ] Verify that all environment variables are correctly set.
- [ ] Test the `/kitchen` and `/admin` routes to ensure they are accessible.
