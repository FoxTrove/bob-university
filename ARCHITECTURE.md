# Bob University Architecture

## Tech Stack

### Mobile App
- **Framework**: React Native + Expo SDK 54
- **Routing**: Expo Router (file-based)
- **Styling**: NativeWind (Tailwind CSS)
- **Video**: expo-video + Mux
- **Maps**: @rnmapbox/maps
- **Payments**: Stripe RN SDK + Apple IAP

### Backend
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (email, Apple, Google)
- **Storage**: Supabase Storage
- **Edge Functions**: Deno (supabase/functions/)

## Directory Structure

```
app/
├── (auth)/           # Sign-in, sign-up
├── (tabs)/           # Main tab navigation
│   ├── index.tsx     # Home
│   ├── modules.tsx   # Learning content
│   ├── certification.tsx
│   ├── events/       # Events tab (nested routes)
│   ├── community/    # Community tab (nested routes)
│   ├── directory.tsx # Stylist directory
│   ├── inspiration.tsx # Client-only inspiration tab
│   ├── team.tsx      # Salon owner team management
│   └── profile.tsx
├── embed/            # Embeddable directory for external sites
├── onboarding/       # Skills assessment wizard
├── module/[id].tsx   # Module detail
├── video/[id].tsx    # Video player
└── subscribe.tsx     # Subscription purchase

lib/
├── auth.tsx          # AuthProvider, useAuth
├── supabase.ts       # Supabase client
├── hooks/
│   ├── useEntitlement.ts  # Subscription status
│   └── useProfile.ts      # Profile + user_type
└── database.types.ts # Generated types

components/
├── ui/               # Base components (Button, Card, Avatar)
├── layout/           # SafeContainer, etc.
├── video/            # MuxVideoPlayer
└── directory/        # StylistCard, StylistMap, etc.

supabase/functions/   # Edge functions
```

## User Types & Tab Visibility

| Tab | Individual Stylist | Salon Owner | Client |
|-----|-------------------|-------------|--------|
| Home | ✓ | ✓ | ✓ |
| Learn (Modules) | ✓ | ✓ | ✗ |
| Certify | ✓ | ✓ | ✗ |
| Events | ✓ | ✓ | ✓ |
| Community | ✓ | ✓ | ✗ |
| Stylists (Directory) | ✓ | ✓ | ✓ |
| Inspiration | ✗ | ✗ | ✓ |
| Team | ✗ | ✓ | ✗ |
| Profile | ✓ | ✓ | ✓ |

## Database Schema (Key Tables)

- `profiles` - User data, includes `user_type` enum
- `salons` - Salon entities owned by salon_owner users
- `staff_access_codes` - Invite codes for team members
- `entitlements` - Subscription status (Stripe/Apple)
- `modules` / `videos` - Learning content
- `stylist_profiles` - Public directory listings
- `community_posts` - Community content

## Auth & Entitlement Flow

1. User signs up → profile created with `has_completed_onboarding: false`
2. Onboarding → user selects type (salon_owner/individual_stylist/client)
3. Client users → skip assessment, routed to directory
4. Stylists → complete assessment, see upsell if not premium
5. Tab layout reads `user_type` from `useProfile()` hook
6. Content access checked via `useEntitlement()` hook
