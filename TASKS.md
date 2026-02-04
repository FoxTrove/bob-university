# Bob University - User Types & Salon Features

## Session Info
- Branch: feature/ralph-session-20260203-2130
- Started: 2026-02-03 21:30
- PR: (filled when created)

## Completed

- [x] Create salon setup flow for salon owners
  - Acceptance: When a salon_owner completes onboarding, they're prompted to create their salon (name, optional logo). Salon is created in `salons` table with `owner_id`.
  - Test: New salon owner sees "Create Your Salon" screen, enters name, salon appears in database.

- [x] Add staff join flow with access code
  - Acceptance: Add "Join a Salon" option in profile for individual_stylists. Enter 6-char code → validates against `staff_access_codes` → links user to salon via `salon_id` in profiles.
  - Test: Generate code in Team tab, use code in another account, that user's profile.salon_id is set.

- [x] Implement remove staff functionality in Team tab
  - Acceptance: Each staff member in Team tab has options menu with "Remove from Team". Removes their `salon_id` from profiles.
  - Test: Tap options → Remove → Confirm → Staff member no longer appears in list.

## In Progress

## Backlog

### Phase 2: Home Screen Customization

- [x] Create client-specific Home screen content
  - Acceptance: When user_type='client', Home shows: "Find a Stylist" CTA, featured stylists carousel, upcoming events, quick tips.
  - Test: Log in as client → Home shows directory-focused content, no learning modules.

- [x] Create salon owner Home dashboard
  - Acceptance: When user_type='salon_owner', Home shows: Team overview card (X/5 members), team certification progress, "Book Event with Ray" CTA, recent activity.
  - Test: Log in as salon owner → Home shows team-focused dashboard.

- [x] Add learning progress to individual stylist Home
  - Acceptance: When user_type='individual_stylist', Home shows: Continue watching section, module progress, certification upsell if not certified.
  - Test: Stylist with partial progress sees relevant content on Home.

### Phase 3: Team Management Polish

- [ ] Add staff progress tracking to Team tab
  - Acceptance: Each staff member card shows overall completion percentage. Tap to expand shows per-module progress.
  - Test: Staff with 50% video completion shows "50% Complete" on their card.

- [ ] Add team certification status overview
  - Acceptance: Team tab header shows "X of Y team members certified". Certified members show badge on card.
  - Test: Team with 2/5 certified shows this stat, certified members have visible badge.

### Phase 4: Directory & Profile Polish

- [ ] Enforce subscription requirement for directory listing
  - Acceptance: `stylist_profiles.is_public` can only be true if user has active subscription. Edge function or RLS enforces this.
  - Test: Cancelled subscriber's profile automatically becomes private.

- [ ] Customize Profile tab by user type
  - Acceptance: Clients see simplified profile (no certifications, no directory listing). Salon owners see salon management link. Stylists see full profile with directory settings.
  - Test: Each user type sees appropriate profile options.
