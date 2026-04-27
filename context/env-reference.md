# Mirofish Environment Reference

Canonical local reference for configuration and secret handling.

## Canonical Local Files

- `.env.local`
  - local development config
- `.env.local.example`
  - safe template
- `.env.production`
  - local production-style values if needed, but keep uncommitted
- `.env.vercel`
  - deployment-oriented values if you keep a local reference file, but keep uncommitted

## Required Variables

| Variable | Purpose | Typical Scope |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | local + Vercel |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser-safe Supabase anon key | local + Vercel |
| `SUPABASE_SERVICE_ROLE_KEY` | server-side Supabase access | local + Vercel |
| `KIMI_API_KEY` | Kimi/Moonshot API access | local + Vercel |

## Optional Variables

| Variable | Purpose |
| --- | --- |
| `KIMI_API_BASE_URL` | override Kimi endpoint |
| `KIMI_MODEL` | model selection |
| `USE_MOCK_SIMULATION` | force mock mode for local/dev workflows |
| `VERCEL_OIDC_TOKEN` | deployment/runtime integration if present |

## Safe Working Rules

- keep live values in local-only files
- never commit `.env.production`, `.env.vercel`, or `.env.local`
- use `.env.local.example` as the source of truth for required variable names
