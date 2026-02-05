# Bob Company - v2.3 Features

## Session Info
- Branch: feature/ralph-session-20260203-2130
- Started: 2026-02-03 21:30
- PR: https://github.com/FoxTrove/bob-university/pull/2

## Completed

### Previous Session (User Types & Salon Features)
- [x] Create salon setup flow for salon owners
- [x] Add staff join flow with access code
- [x] Implement remove staff functionality in Team tab
- [x] Create client-specific Home screen content
- [x] Create salon owner Home dashboard
- [x] Add learning progress to individual stylist Home
- [x] Add staff progress tracking to Team tab
- [x] Add team certification status overview
- [x] Enforce subscription requirement for directory listing
- [x] Customize Profile tab by user type

### Email Invite Feature
- [x] Add email invite columns to staff_access_codes table
  - Story: 6.1
  - Acceptance: Migration adds `invited_email` and `invite_sent_at` columns
  - Test: Columns exist in Supabase

- [x] Create team-invite email template
  - Story: 6.1
  - Acceptance: Edge function has `team-invite` template with salon name, code, expiration
  - Test: Email sends with correct content

- [x] Add email invite UI to Team tab
  - Story: 6.1
  - Acceptance: "Invite via Email" button, email input, validation, success message
  - Test: Enter email → Send → Email received with code

## In Progress

## Backlog

### Phase 1: Batch Email Invites
> From Story 2.1: As a salon owner, I want to invite multiple team members at once

- [x] Update Team tab UI for batch email entry
  - Story: 2.1
  - Acceptance: TextInput accepts multiple comma-separated emails. UI shows count of emails entered.
  - Test: Enter "a@b.com, c@d.com" → Shows "2 emails"

- [x] Implement batch invite sending
  - Story: 2.1
  - Acceptance: Generate unique code for each email, send all invites, show success for each
  - Test: Enter 3 emails → All 3 receive invites with unique codes

- [x] Handle partial failures in batch invites
  - Story: 2.1
  - Acceptance: If 1 of 3 emails fails, show which succeeded and which failed
  - Test: Enter 1 invalid + 2 valid emails → See success for 2, error for 1

### Phase 2: Certification Ticket System
> From Story 3.1-3.3: Salon certification ticket pool

- [x] Create certification tickets database migration
  - Story: 3.1
  - Acceptance: Tables for `salon_certification_tickets` and `certification_assignments` created
  - Test: Tables exist with correct schema

- [x] Add 3 free tickets when salon subscription starts
  - Story: 3.1
  - Acceptance: Edge function/trigger creates 3 tickets when salon plan activates
  - Test: New salon subscriber has 3 tickets in pool

- [x] Build certification ticket dashboard in Team tab
  - Story: 3.1
  - Acceptance: Shows "X available / Y assigned" with list of assignments
  - Test: Salon owner sees ticket count and history

- [x] Implement assign ticket to team member flow
  - Story: 3.2
  - Acceptance: Select team member → Select certification type → Assign → Notification sent
  - Test: Assign ticket → Team member receives notification, can access certification

- [x] Add purchase additional tickets flow
  - Story: 3.3
  - Acceptance: "Buy More Tickets" button → Stripe checkout at ~30% discount → Tickets added
  - Test: Purchase 2 tickets → Pool increases by 2

### Phase 3: Additional Seats & Auto-Join
> From Story 2.2-2.3: Scale team beyond 5 seats, handle existing users

- [x] Add seat limit enforcement
  - Story: 2.2
  - Acceptance: Trying to add 6th member shows upsell modal for additional seats
  - Test: With 5 active members, invite 6th → See "Add Seats" prompt

- [x] Implement additional seat purchase via Stripe
  - Story: 2.2
  - Acceptance: Purchase $99/month per seat via Stripe (not Apple IAP), seat count increases
  - Test: Buy 2 seats → Can now have 7 team members

- [x] Create existing user detection in invite flow
  - Story: 2.3
  - Acceptance: If invited email has existing account, send in-app notification instead of email
  - Test: Invite existing user → They see in-app invite notification

- [x] Implement auto-join and subscription transfer
  - Story: 2.3
  - Acceptance: Existing user accepts → Joins salon, individual subscription cancelled if any
  - Test: Paying individual accepts → Joins salon, old subscription cancelled

### Phase 4: Private Events
> From Story 4.1-4.3: Request and manage private events

- [x] Create private event request form
  - Story: 4.1
  - Acceptance: Form with event type, dates, size, location, notes. Submits to admin dashboard.
  - Test: Submit request → Confirmation shown, appears in admin

- [x] Build private events section in Events tab
  - Story: 4.2
  - Acceptance: "My Private Events" section separate from public events
  - Test: Salon with private event sees it in dedicated section

- [x] Implement private event invitations
  - Story: 4.3
  - Acceptance: Invite team members or external guests, track RSVP status
  - Test: Invite 3 people → They receive invite, status tracked

- [x] Add team event registration for public events
  - Story: 5.1
  - Acceptance: Multi-select team members, bulk ticket purchase, each gets digital ticket
  - Test: Register 3 team members → 3 tickets purchased, 3 notifications sent

### Phase 5: Navigation & Branding
> From Story 1.1-1.2: Rebrand and optimize navigation

- [x] Rename Modules tab to University
  - Story: 1.1
  - Acceptance: Tab label shows "University" with graduation cap icon
  - Test: Navigation shows "University" not "Modules"

- [x] Update app display name to Bob Company
  - Story: 1.1
  - Acceptance: App name in app.json, splash screen, about screen all say "Bob Company"
  - Test: App appears as "Bob Company" everywhere

- [x] Implement user-type-based tab navigation
  - Story: 1.2
  - Acceptance: Tab bar shows different tabs based on user_type (see story for specs)
  - Test: Each user type sees their specific tabs

- [x] Add secondary navigation menu
  - Story: 1.2
  - Acceptance: Hamburger or profile sub-menu contains: Community, Directory, Notifications, Support
  - Test: Tap menu → See secondary items

- [x] Enhance team progress dashboard
  - Story: 2.4
  - Acceptance: Aggregate metrics: avg completion, most watched modules, engagement trends
  - Test: View Team tab → See team-wide statistics

### Phase 6: Quality Fixes
> From Review: TypeScript errors and code quality issues

- [x] Fix TypeScript errors in community feature
  - Story: N/A (Quality)
  - Acceptance: `npx tsc --noEmit` passes for mobile app files (excluding admin/)
  - Files: community/index.tsx, community/[id].tsx, community/create.tsx
  - Issues: Type compatibility for media_urls, likes_count, user_reactions, TextInput refs
  - Test: Run `npx tsc --noEmit 2>&1 | grep -v "^admin/"` returns no errors

- [x] Fix admin dashboard TypeScript path aliases
  - Story: N/A (Quality)
  - Acceptance: Admin dashboard `npm run build` passes
  - Issue: @/ path aliases not resolving to @/components/*, @/lib/*
  - Test: `cd admin && npm run build` succeeds

### Phase 7: Review Findings (Feb 4, 2026)
> From /ralph-review: Additional TypeScript and quality issues found

- [x] Fix TypeScript type imports in team.tsx
  - Story: N/A (Quality)
  - Acceptance: team.tsx compiles without TS errors
  - Issue: Importing non-existent type aliases (Profile, Salon, Module, etc.) from database.types.ts
  - Fix: Use Supabase's `Tables<'tablename'>` syntax or define local type aliases
  - Files: app/(tabs)/team.tsx (63 errors)
  - Test: `npx tsc --noEmit 2>&1 | grep "team.tsx"` returns no errors

- [x] Fix Button component icon prop
  - Story: N/A (Quality)
  - Acceptance: events/[id].tsx compiles without TS errors
  - Issue: Button component doesn't accept `icon` prop but code passes it
  - Files: app/(tabs)/events/[id].tsx:871
  - Test: `npx tsc --noEmit 2>&1 | grep "events/\[id\].tsx"` returns no errors

- [x] Fix private event request type mismatch
  - Story: N/A (Quality)
  - Acceptance: request-private.tsx compiles without TS errors
  - Issue: Insert payload has `salon_id` which doesn't exist on type
  - Files: app/(tabs)/events/request-private.tsx:91
  - Test: `npx tsc --noEmit 2>&1 | grep "request-private.tsx"` returns no errors

- [x] Fix TypeScript errors in hooks
  - Story: N/A (Quality)
  - Acceptance: All lib/hooks/*.ts files compile without TS errors
  - Issue: Various type errors in 9 hook files
  - Files: useCertifications.ts, useEntitlement.ts, useModules.ts, useNotificationPreferences.ts, useProfile.ts, usePushNotifications.ts, useSalonInvites.ts, useSubscriptionPlans.ts, useVideos.ts
  - Test: `npx tsc --noEmit 2>&1 | grep "lib/hooks"` returns no errors

- [x] Fix TypeScript errors in components
  - Story: N/A (Quality)
  - Acceptance: All component files compile without TS errors
  - Files: SalonOwnerHomeScreen.tsx, ModuleCard.tsx, ModuleGrid.tsx, VideoCard.tsx, VideoList.tsx
  - Issue: Property access on unknown types
  - Test: `npx tsc --noEmit 2>&1 | grep "components/"` returns no errors

- [x] Implement subscription cancel retention flow
  - Story: N/A (Quality - Incomplete implementation)
  - Acceptance: Retention offer modal shows with 2-3 month free offer when user cancels
  - Issue: Console log says "Retention offer function not implemented yet"
  - Files: app/subscription-cancel.tsx
  - Test: Tap cancel → See retention offer with "Stay and get 2 months free"
