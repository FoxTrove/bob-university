# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bob University is a React Native mobile app for hair education, built with Expo. It provides video-based learning content, certifications, and a stylist directory for hairstylists. The app uses a freemium model with Supabase for backend services.

## Development Commands

```bash
npm start          # Start Expo development server
npm run ios        # Start on iOS simulator
npm run android    # Start on Android emulator
npm run web        # Start web version
```

## Tech Stack

- **Framework**: React Native with Expo SDK 54
- **Routing**: Expo Router (file-based routing)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **State**: React Context for auth state

## Architecture

### File-based Routing (`app/`)
- `app/_layout.tsx` - Root layout with AuthProvider and navigation guard
- `app/(auth)/` - Authentication screens (sign-in, sign-up)
- `app/(tabs)/` - Main app tabs (Home, Learn/Modules, Profile)

### Auth Flow
The root layout (`app/_layout.tsx`) wraps the app in `AuthProvider` and handles routing:
- Unauthenticated users redirect to `/(auth)/sign-in`
- Authenticated users redirect to `/(tabs)`

### Core Libraries (`lib/`)
- `lib/supabase.ts` - Supabase client with AsyncStorage for session persistence
- `lib/auth.tsx` - React Context providing `session`, `user`, and `loading` state

## Environment Variables

Required in `.env`:
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

## NativeWind Configuration

Global styles imported via `global.css` in the root layout. Metro config in `metro.config.js` uses `withNativeWind` wrapper.

## Admin Dashboard (`admin/`)

The admin dashboard is a Next.js app for managing content, users, and app settings.

### Admin Commands (from `admin/` directory)
```bash
npm run dev        # Start development server (localhost:3000)
npm run build      # Build for production
npm start          # Run production build
```

### Admin Tech Stack
- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS
- **Auth**: Supabase Auth with admin role verification
- **Video Upload**: Mux direct upload API

### Admin Features
- Video upload with Mux integration
- Module management (CRUD)
- User management (view subscribers)
- Events and Collections management
- Certifications management (settings + review queue)
- Stylist Directory management
- Analytics dashboard with KPIs and charts

### Analytics (`admin/src/app/(dashboard)/analytics/`)
The analytics section provides business intelligence dashboards:

**Pages:**
- `/analytics` - Overview dashboard with KPIs
- `/analytics/revenue` - Revenue deep-dive
- `/analytics/users` - User growth and retention

**Key Components (`admin/src/components/analytics/`):**
- `DateRangeSelector` - Quick select (1d, 7d, 30d, 90d, 1y) + custom picker
- `MetricCard` - Stat cards with period comparison (↑↓ indicators)
- `AnalyticsLineChart`, `AnalyticsBarChart`, `AnalyticsPieChart` - Chart wrappers
- `ExportCSVButton` - CSV export functionality

**Libraries:**
- `recharts` - Charting
- `date-fns` - Date manipulation

**Utilities (`admin/src/lib/`):**
- `analytics.ts` - Date range helpers, formatters
- `analytics-queries.ts` - Supabase query functions for metrics

### Admin Environment Variables (`admin/.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
MUX_TOKEN_ID=
MUX_TOKEN_SECRET=
```

### Certifications (`admin/src/app/(dashboard)/certifications/`)
Single certification system: "Ray-Certified Stylist" - one certification that endorses stylists in Ray's methods.

**Features:**
- Settings: Configure title, description, price ($297), badge image, required modules
- Review toggle: Enable/disable video submission review
- Submissions table: View all certification applications with status filtering
- Approve/reject workflow with feedback
- CSV export

**Database Tables:**
- `certification_settings` - Singleton config row
- `certification_required_modules` - Which modules are prerequisites
- `user_certifications` - User certification status and submissions

### Stylist Directory (`admin/src/app/(dashboard)/directory/`)
Admin view of certified stylists who can be listed in the public directory.

**Features:**
- View all stylist profiles with stats
- Edit profile details (bio, location, contact info, social links)
- Toggle public visibility
- View certification status

**Database Table:**
- `stylist_profiles` - Stylist directory profiles with location, contact, and visibility

**Future Features (not yet built):**
- Public-facing directory pages with map (Mapbox)
- Embeddable directory widget for Ray's websites

### Admin Access
Users must have `role = 'admin'` in the `profiles` table to access the admin dashboard.
