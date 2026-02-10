# Bob University Web Subscription

A minimal web app for handling iOS subscription payments via external link (per Epic v Apple ruling).

## Background

Following the Epic v Apple court rulings (May 2025 injunction), iOS apps can direct users to external websites for purchases with 0% Apple commission during the injunction period. This web app provides the subscription checkout flow for iOS users.

## Deployment

1. Deploy to Vercel:
   ```bash
   cd web
   vercel
   ```

2. Set environment variables in Vercel dashboard (see `.env.example`)

3. Configure custom domain: `bobuniversity.com`

## Environment Variables

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_SIGNATURE_PRICE_ID` | Price ID for Signature plan |
| `STRIPE_STUDIO_PRICE_ID` | Price ID for Studio plan |
| `STRIPE_SALON_PRICE_ID` | Price ID for Salon plan |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `NEXT_PUBLIC_BASE_URL` | This site's URL (https://bobuniversity.com) |

## Flow

1. iOS app opens `bobuniversity.com/subscribe?plan=X&email=X&source=ios_app`
2. User sees plan details and clicks "Subscribe Now"
3. API creates Stripe Checkout session
4. User completes payment on Stripe
5. Stripe webhook updates entitlements (handled by existing `stripe-webhook` edge function)
6. Success page prompts user to return to app

## Monitoring: Apple Fee Ruling

⚠️ **IMPORTANT**: This approach depends on the current court injunction.

**What to monitor:**
- **Case**: Epic Games v. Apple (9th Circuit)
- **Status**: Injunction prevents Apple from charging commission on external link purchases
- **Risk**: Courts may determine a "reasonable fee" that Apple can charge

**Action items if fee is imposed:**
1. Evaluate if fee is lower than 15% Apple IAP (worth keeping external links)
2. If higher, implement Apple IAP fallback (see `lib/hooks/useAppleIAP.ts` stub)
3. Update `app/subscribe.tsx` to use Apple IAP for iOS

**Where to check:**
- Apple Developer News: https://developer.apple.com/news/
- Epic v Apple court filings: PACER or legal news outlets
- App Store Review Guidelines updates

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000/subscribe
