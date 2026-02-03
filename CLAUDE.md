# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bob University is a React Native mobile app for hair education, built with Expo. It provides video-based learning content, certifications, community features, and a stylist directory for hairstylists. The app uses a freemium model with Supabase for backend services.

## Development Commands

```bash
# Mobile app (root directory)
npm start          # Start Expo development server
npm run ios        # Run on iOS simulator (requires native build)
npm run android    # Run on Android emulator (requires native build)
npm run web        # Start web version

# Admin dashboard (from admin/ directory)
cd admin
npm run dev        # Start development server (localhost:3000)
npm run build      # Build for production
npm run lint       # Run ESLint

# EAS builds (requires eas-cli)
eas build --profile development --platform ios    # Dev build for iOS
eas build --profile development --platform android # Dev build for Android
eas build --profile preview --platform all        # Internal preview builds
eas build --profile production --platform all     # Production builds
```

## Tech Stack

### Mobile App
- **Framework**: React Native with Expo SDK 54
- **Routing**: Expo Router (file-based routing)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Video**: expo-video with Mux playback
- **Maps**: @rnmapbox/maps for stylist directory
- **Auth**: Supabase Auth with Apple/Google social login
- **Payments**: Stripe React Native SDK + Apple In-App Purchases

### Admin Dashboard
- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS v4
- **Video Upload**: Mux direct upload API
- **Rich Text**: react-quill-new
- **Charts**: Recharts
- **Drag & Drop**: @dnd-kit for lesson ordering

### Backend
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage (images bucket)
- **Edge Functions**: Deno-based functions in `supabase/functions/`
- **CRM Integration**: GoHighLevel (GHL) for marketing automation

## Architecture

### Mobile App File Structure
- `app/_layout.tsx` - Root layout with AuthProvider, StripeProvider, font loading, navigation guard
- `app/(auth)/` - Sign-in, sign-up screens
- `app/(tabs)/` - Main tabs: Home, Modules, Certification, Directory, Events, Community, Profile
- `app/(tabs)/community/` - Community posts, profiles, creation flow
- `app/module/[id].tsx` - Module detail with video list
- `app/video/[id].tsx` - Video player screen
- `app/onboarding/` - Skills assessment flow for new users
- `lib/` - Core utilities and hooks
- `components/` - Reusable UI components organized by domain

### Admin Dashboard Structure
- `admin/src/app/(dashboard)/` - All admin pages (modules, videos, users, analytics, community, etc.)
- `admin/src/app/api/` - API routes for Mux uploads/transcripts and analytics
- `admin/src/components/` - Shared components (Sidebar, analytics charts, editors)
- `admin/src/lib/supabase/` - Server/client/middleware Supabase clients

### Auth Flow
The root layout wraps the app in `AuthProvider` (`lib/auth.tsx`):
- Checks `has_completed_onboarding` in profiles table
- New users → `/onboarding` for skills assessment
- Returning users → `/(tabs)` main app
- Unauthenticated → `/(auth)/sign-in`

### Entitlement System
- `lib/hooks/useEntitlement.ts` - Checks subscription status from `entitlements` table with real-time updates
- Plans: `free`, `individual`, `salon`
- `isPremium` = active subscription with `individual` or `salon` plan
- `canAccessVideo(video)` - Returns true for free videos or premium users
- `checkVideoAccess(video)` - Returns detailed access info including drip unlock dates

## Environment Variables

### Mobile App (`.env`)
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=
```

### Admin Dashboard (`admin/.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=     # For admin operations
MUX_TOKEN_ID=
MUX_TOKEN_SECRET=
```

### Supabase Edge Functions (set in Supabase dashboard)
```
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
GHL_API_KEY=                   # GoHighLevel API key
GHL_LOCATION_ID=               # GoHighLevel location ID
RESEND_API_KEY=                # For transactional emails
```

## Database

### Key Tables
- `profiles` - User profiles with `role` (admin check), `salon_id`, `has_completed_onboarding`
- `modules` - Learning modules with `drip_buckets` for scheduled content release
- `videos` - Lessons within modules, `is_free` flag, Mux playback IDs
- `video_library` - Central video asset library, reusable across modules/collections
- `entitlements` - Subscription status per user (Stripe/Apple IAP integration)
- `subscription_records` - Detailed subscription history with source (stripe/apple)
- `subscription_plans` - Plan pricing linked to Stripe price IDs
- `revenue_ledger` - All revenue events for analytics (payments, refunds, fees)
- `purchases` - One-time purchase records (certifications, events)
- `certifications` / `user_certifications` - Certification definitions and user applications
- `stylist_profiles` - Public directory profiles with location data
- `events` / `event_registrations` - In-person events management
- `collections` / `collection_videos` / `collection_access` - Video collections with access control
- `community_posts` / `community_comments` / `community_reactions` - Community feature tables

### Type Generation
Regenerate TypeScript types after schema changes:
```bash
npx supabase gen types typescript --project-id <project-id> > lib/database.types.ts
```

## Supabase Edge Functions

Located in `supabase/functions/`:

**Payment Processing:**
- `payment-sheet` - Stripe payment intent creation for one-time purchases
- `create-subscription` - Stripe subscription setup
- `stripe-webhook` - Handle Stripe events, update entitlements/revenue_ledger, trigger emails/GHL
- `apple-iap-webhook` - Handle Apple In-App Purchase receipts
- `update-plan-pricing` - Sync pricing changes to Stripe

**Admin Operations:**
- `admin-subscription` - Admin subscription management (pause, cancel, modify)
- `manage-event` - Event CRUD operations
- `validate-video-access` - Server-side video access validation

**Notifications & Marketing:**
- `send-notification` - Push notifications
- `send-email` - Transactional emails via Resend
- `community-notification` - Community activity notifications
- `ghl-contact-sync` - Sync user profiles to GoHighLevel CRM
- `ghl-event-trigger` - Trigger GHL workflow events (subscription, certification, etc.)
- `ghl-tag-update` - Update GHL contact tags based on user actions
- `ghl-bulk-sync` - Bulk sync users to GHL
- `ghl-test-connection` - Test GHL API connection
- `unsubscribe` - Email unsubscribe handling

## Admin Access

Users must have `role = 'admin'` in the `profiles` table. The admin dashboard middleware checks this via the `get_user_role()` RPC function.

## Key Patterns

### Supabase Client Usage
- Mobile: Single client in `lib/supabase.ts` with AsyncStorage
- Admin Server Components: `createClient()` from `lib/supabase/server.ts`
- Admin Client Components: `createClient()` from `lib/supabase/client.ts`
- Admin privileged operations: `createAdminClient()` with service role key

### Video Playback
Videos use Mux for streaming. The `mux_playback_id` is stored in `videos` table. The mobile app uses `MuxVideoPlayer` component wrapping expo-video.

### Content Dripping
Modules support `drip_buckets` (JSON) for scheduled content release. Videos have `drip_days` for delay after subscription start. The `checkVideoAccess()` function calculates unlock dates based on `subscriptionStartDate`.

### Webhook Event Flow
Stripe webhooks trigger a chain of actions:
1. Update `entitlements` and `subscription_records` tables
2. Record to `revenue_ledger` with fee calculations
3. Send transactional email via `send-email` function
4. Trigger GHL workflow via `ghl-event-trigger`
5. Update GHL tags via `ghl-tag-update`
