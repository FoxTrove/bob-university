# Repository Guidelines

## Project Structure & Module Organization
- `app/` contains the Expo Router screens and navigation groups (e.g., `app/(auth)/`, `app/(tabs)/`).
- `components/`, `constants/`, `assets/`, `global.css` hold shared UI pieces, styling, and static assets.
- `lib/` contains core services such as the Supabase client and auth context.
- `admin/` is a separate Next.js 16 admin dashboard (App Router) with its own dependencies and tooling.
- `docs/` holds product documentation, including `docs/PRD.md`.
- `supabase/` stores backend/config resources.

## Product Scope (PRD)
- Use `docs/PRD.md` as the source of truth for feature scope and priorities.
- Mobile: freemium content, subscriptions, certifications, events, and stylist directory.
- Admin: content management, user management, certification review, events, and push notifications.
- Payments split: iOS requires Apple IAP; Android/web use Stripe (see PRD for compliance notes).

## Build, Test, and Development Commands
App (repo root):
- `npm start` runs the Expo dev server.
- `npm run ios` launches the iOS simulator build.
- `npm run android` launches the Android emulator build.
- `npm run web` starts the web build via Expo.

Admin (from `admin/`):
- `npm run dev` starts the Next.js dev server on `localhost:3000`.
- `npm run build` builds the production admin app.
- `npm start` runs the production build.

## Coding Style & Naming Conventions
- TypeScript/React Native code uses 2-space indentation, semicolons, and single quotes (follow existing files).
- Components use PascalCase (`LessonCard.tsx`), hooks use `useX` naming, and Expo routes follow file-based conventions inside `app/`.
- Styling uses NativeWind/Tailwind class strings; keep class ordering consistent with nearby code.

## Testing Guidelines
- No automated test runner is configured in `package.json` yet.
- If adding tests, prefer colocating with features (e.g., `components/__tests__/Button.test.tsx`) and add a script to `package.json`.

## Commit & Pull Request Guidelines
- Commits appear to follow Conventional Commits (e.g., `feat:`, `chore:`). Keep messages scoped and present-tense.
- PRs should include a short description of behavior changes, affected areas (app/admin), and any required config or env updates.
- Include screenshots or screen recordings for UI changes (especially mobile and admin dashboard).

## Configuration & Environment
- App requires `.env` with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- Stripe Payment Sheet needs `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` and Supabase Edge function secrets.
- Stylist directory map requires `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN`.
- Optional: `EXPO_PUBLIC_ONBOARDING_MUX_PLAYBACK_ID` for the welcome video.
- Admin requires `admin/.env.local` with Supabase keys and Mux credentials.
- Supabase Edge Functions use `supabase/.env` (see `supabase/.env.example`) for Stripe and Supabase keys.
- Stripe webhooks require `STRIPE_WEBHOOK_SECRET` in `supabase/.env`.
