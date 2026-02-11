# The Bob Company Web Subscription

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

3. Configure custom domain: `app.thebobcompany.com`

## Environment Variables

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_SIGNATURE_PRICE_ID` | Price ID for Signature plan |
| `STRIPE_STUDIO_PRICE_ID` | Price ID for Studio plan |
| `STRIPE_SALON_PRICE_ID` | Price ID for Salon plan |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `NEXT_PUBLIC_BASE_URL` | This site's URL (https://app.thebobcompany.com) |

## Flow

1. iOS app opens `app.thebobcompany.com/subscribe?plan=X&email=X&source=ios_app`
2. User sees plan details and clicks "Subscribe Now"
3. API creates Stripe Checkout session
4. User completes payment on Stripe
5. Stripe webhook updates entitlements (handled by existing `stripe-webhook` edge function)
6. Success page prompts user to return to app

## Legal Context: Epic v Apple (Current as of Feb 2026)

### What Happened
1. **April 2023**: Ninth Circuit ruled Apple's anti-steering rules violate California UCL. Nationwide injunction issued allowing developers to link to external payment options.

2. **January 2024**: Supreme Court denied cert for both parties. Injunction went into full effect.

3. **April 2025**: Judge Rogers found Apple in **willful violation** of the injunction. Apple's 27% commission on external link purchases was ruled to "thwart the injunction's goals."
   - Apple was ordered to **stop enforcing link-out restrictions and fees**
   - Sanctions ordered, Apple referred for possible criminal contempt

### Current State
- ✅ External links to web checkout are **legal and fee-free**
- ✅ We can include buttons/links directing users to external purchases
- ✅ We can communicate with users about off-app purchasing
- ⚠️ This is an **ongoing enforcement situation**, not a final resolution

### What Apple Can Still Do
- Require App Store for iOS app distribution
- Require Apple IAP for *in-app* transactions (we're doing external, so this doesn't apply)

### What to Monitor
- **District court enforcement proceedings** - Apple may try new compliance schemes
- **Apple Developer News**: https://developer.apple.com/news/
- **App Store Review Guidelines updates** - Watch for new link-out policies
- **Legal news** - "Epic Apple injunction" for any new rulings

### If Apple Finds a Legal Way to Charge Fees
1. Evaluate the fee percentage vs 15% Apple IAP
2. If external link + fee is still cheaper → keep current approach
3. If Apple IAP is cheaper → implement IAP fallback (see `lib/hooks/useAppleIAP.ts` stub)

### Key Takeaway
Apple was found in contempt for trying to charge 27%. Until enforcement proceedings conclude and Apple finds a court-approved fee structure (if any), **external links remain fee-free**.

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000/subscribe
