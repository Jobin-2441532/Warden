# Warden Deployment Guide

## 1. Vercel Deployment

Warden is fully optimized for Vercel. 

### Steps to Deploy:
1. Push this repository to GitHub.
2. Go to [Vercel](https://vercel.com/new) and import the repository.
3. Configure the following Environment Variables in the Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon Key.
   - `ANTHROPIC_API_KEY`: Your Anthropic API key (for the Commerce Agent).
   - `RAZORPAY_KEY_ID`: Your Razorpay Test Key ID.
   - `RAZORPAY_KEY_SECRET`: Your Razorpay Test Key Secret.
   - `RAZORPAY_WEBHOOK_SECRET`: The secret you configure in Razorpay for webhooks.
4. Click **Deploy**.

## 2. Setting up Demo Data (Seed)
To ensure the site looks great out of the box for anyone exploring it:
1. Log into your Supabase Dashboard.
2. Navigate to the **SQL Editor**.
3. Copy and paste the contents of `scripts/supabase_seed.sql`.
4. Run the script to instantly populate a demo merchant, a clean catalog, active mandates, and a realistic audit log of transactions.

## 3. End-to-End Testing

Once deployed to your Vercel URL (e.g. `https://warden-app.vercel.app`), verify the following journey:

1. **Marketing Page (`/`)**: Verify animations run smoothly and CTAs direct to `/onboarding` and `/agent`.
2. **Onboarding (`/onboarding`)**: Test the multi-step flow.
3. **Dashboard (`/dashboard/catalog`)**: Ensure the left-side navigation allows seamless switching between Catalog, Readiness, Mandates, and Control Tower.
4. **Agent Chat (`/agent`)**: Act as a buyer. Request an item, verify the AI fetches it from the seeded catalog, and attempt to buy.
5. **Control Tower (`/dashboard/control-tower`)**: Return to the dashboard and ensure the live feed updated instantly via websockets, reflecting the exact chat interaction.

## 4. Production Hardening Implemented
- **Webhook Verification:** `app/api/webhook/razorpay/route.ts` securely verifies cryptographic signatures on payment callbacks.
- **Rate Limiting:** `app/api/chat/route.ts` implements IP-based rate limiting (15 req/min) to prevent abuse of the LLM API.
- **Input Validation:** API routes enforce strict Zod schema validation.
- **Error Boundaries & Loading:** `loading.tsx` and `error.tsx` exist inside `/dashboard` for graceful failure handling.
- **Health Check:** `/api/health` exposes a simple JSON ping for uptime monitoring.
- **Secure Gate:** `lib/gate.ts` runs strictly on the server, enforcing immutable constraints. 
