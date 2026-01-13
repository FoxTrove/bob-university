# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bob University is a React Native mobile app for hair education, built with Expo. It provides video-based learning content, certifications, and a stylist directory for hairstylists. The app uses a freemium model with Supabase for backend services.

## Development Commands

```bash
# Mobile app (root directory)
npm start          # Start Expo development server
npm run ios        # Start on iOS simulator
npm run android    # Start on Android emulator
npm run web        # Start web version

# Admin dashboard (from admin/ directory)
cd admin
npm run dev        # Start development server (localhost:3000)
npm run build      # Build for production
npm run lint       # Run ESLint
```

## Tech Stack

### Mobile App
- **Framework**: React Native with Expo SDK 54
- **Routing**: Expo Router (file-based routing)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Video**: expo-video with Mux playback
- **Maps**: @rnmapbox/maps for stylist directory
- **Auth**: Supabase Auth with Apple/Google social login
- **Payments**: Stripe React Native SDK

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

## Architecture

### Mobile App File Structure
- `app/_layout.tsx` - Root layout with AuthProvider, font loading, navigation guard
- `app/(auth)/` - Sign-in, sign-up screens
- `app/(tabs)/` - Main tabs: Home, Modules, Certification, Directory, Events, Profile
- `app/module/[id].tsx` - Module detail with video list
- `app/video/[id].tsx` - Video player screen
- `app/onboarding/` - Skills assessment flow for new users
- `lib/` - Core utilities and hooks
- `components/` - Reusable UI components organized by domain

### Admin Dashboard Structure
- `admin/src/app/(dashboard)/` - All admin pages (modules, videos, users, analytics, etc.)
- `admin/src/app/api/` - API routes for Mux uploads and analytics
- `admin/src/components/` - Shared components (Sidebar, analytics charts, editors)
- `admin/src/lib/supabase/` - Server/client/middleware Supabase clients

### Auth Flow
The root layout wraps the app in `AuthProvider` (`lib/auth.tsx`):
- Checks `has_completed_onboarding` in profiles table
- New users → `/(onboarding)` for skills assessment
- Returning users → `/(tabs)` main app
- Unauthenticated → `/(auth)/sign-in`

### Entitlement System
- `lib/hooks/useEntitlement.ts` - Checks subscription status from `entitlements` table
- Plans: `free`, `individual`, `salon`
- `isPremium` = active subscription with `individual` or `salon` plan
- `canAccessVideo(video)` - Returns true for free videos or premium users

## Environment Variables

### Mobile App (`.env`)
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

### Admin Dashboard (`admin/.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=     # For admin operations
MUX_TOKEN_ID=
MUX_TOKEN_SECRET=
```

## Database

### Key Tables
- `profiles` - User profiles with `role` (admin check), `salon_id`, `has_completed_onboarding`
- `modules` - Learning modules with `drip_buckets` for scheduled content release
- `videos` - Lessons within modules, `is_free` flag, Mux playback IDs
- `video_library` - Central video asset library, reusable across modules/collections
- `entitlements` - Subscription status per user (Stripe integration)
- `subscription_records` - Detailed subscription history
- `revenue_ledger` - All revenue events for analytics
- `certification_settings` - Singleton config for "Ray-Certified Stylist" certification
- `user_certifications` - User certification applications and status
- `stylist_profiles` - Public directory profiles with location data
- `events` / `event_registrations` - In-person events management
- `collections` / `collection_videos` / `collection_access` - Video collections with access control

### Type Generation
Regenerate TypeScript types after schema changes:
```bash
npx supabase gen types typescript --project-id <project-id> > lib/database.types.ts
```

### Migrations
Located in `supabase/migrations/`. Key migrations:
- `001_initial_schema.sql` - Core tables
- `021_revenue_ledger_and_subscriptions.sql` - Analytics data model

## Supabase Edge Functions

Located in `supabase/functions/`:
- `payment-sheet` - Stripe payment intent creation
- `create-subscription` - Stripe subscription setup
- `stripe-webhook` - Handle Stripe events, update revenue_ledger
- `admin-subscription` - Admin subscription management
- `manage-event` - Event CRUD operations
- `send-notification` - Push notifications

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
Modules support `drip_buckets` (JSON) for scheduled content release. Videos have `drip_days` for delay after subscription start.
