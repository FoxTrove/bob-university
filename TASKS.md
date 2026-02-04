# Bob Company - v2.3 Features

## Session Info
- Branch: feature/ralph-session-20260203-2130
- Started: 2026-02-03 21:30
- PR: (filled when created)

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

- [ ] Enhance team progress dashboard
  - Story: 2.4
  - Acceptance: Aggregate metrics: avg completion, most watched modules, engagement trends
  - Test: View Team tab → See team-wide statistics
