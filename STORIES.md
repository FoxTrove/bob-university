# Bob Company User Stories

## Personas
- **Individual Stylist (Jessica)**: Recently graduated from cosmetology school, phone-first, wants to build skills and confidence with precision cuts
- **Salon Owner (Michelle)**: Owns a multi-chair salon, wants consistent training for team, needs simple team management
- **Certification Seeker (David)**: Experienced stylist seeking credentials to justify premium pricing and attract clients
- **Client (Sarah)**: End consumer looking to find a Ray-certified stylist in their area

---

## Epic 1: Brand & Navigation

### Story 1.1: Rebrand App to Bob Company
**As an** app user,
**I want** the app branded as "Bob Company" with "University" as the education section,
**So that** the branding reflects the full ecosystem serving clients, stylists, and salons.

**Acceptance Criteria:**
- [ ] App name displays as "Bob Company" throughout
- [ ] Educational content section branded as "University" in navigation
- [ ] Navigation labels updated (Modules → University)
- [ ] Any Bob University references updated to Bob Company where appropriate

**Priority:** High
**Complexity:** M

---

### Story 1.2: User Type-Based Navigation
**As an** app user,
**I want** navigation tailored to my user type,
**So that** I see only the features relevant to me without clutter.

**Acceptance Criteria:**
- [ ] Individual Stylist sees: Home, University, Certify, Events, Profile
- [ ] Salon Owner sees: Home, University, Team, Events, Profile
- [ ] Client sees: Directory, Profile only
- [ ] Secondary items (Community, Directory, Notifications, Support) in hamburger/profile menu for stylists

**Priority:** High
**Complexity:** L

---

## Epic 2: Salon Team Management

### Story 2.1: Batch Email Invites ✅
**As a** salon owner,
**I want** to invite multiple team members at once by entering multiple emails,
**So that** I can quickly onboard my entire team.

**Acceptance Criteria:**
- [x] Given I'm on the Team tab, when I tap "Invite via Email", I can enter multiple email addresses
- [x] Given I enter 3 emails, when I tap "Send Invites", all 3 receive invite emails with unique access codes
- [x] Given invites are sent, I see a success message listing all invited emails
- [x] Given an email fails validation, that specific email is highlighted with an error

**Priority:** High
**Complexity:** M
**Status:** ✅ Implemented

---

### Story 2.2: Additional Seat Purchases
**As a** salon owner,
**I want** to purchase additional team seats beyond my included 5,
**So that** my larger team can all access training.

**Acceptance Criteria:**
- [ ] Given I have 5 active team members, when I try to invite a 6th, I see an upsell to purchase additional seats
- [ ] Given I tap "Add Seats", I can purchase seats at $99/month each via Stripe
- [ ] Given I purchase 2 additional seats, I can now have 7 active team members
- [ ] Given I'm on iOS, additional seat purchase uses Stripe (not Apple IAP)

**Priority:** High
**Complexity:** L

---

### Story 2.3: Existing User Auto-Join
**As a** salon owner,
**I want** existing app users I invite to automatically join my salon,
**So that** they don't need to create a new account.

**Acceptance Criteria:**
- [ ] Given I invite user@example.com who has an existing account, they receive an in-app notification (not email)
- [ ] Given they accept, they automatically join my salon team
- [ ] Given they had an individual subscription, it is cancelled and salon covers their access
- [ ] Given they join, their existing progress and data is preserved

**Priority:** Medium
**Complexity:** L

---

### Story 2.4: Team Progress Dashboard
**As a** salon owner,
**I want** to view my team's training progress,
**So that** I can ensure everyone is staying on track.

**Acceptance Criteria:**
- [ ] Given I'm on Team tab, I see a list of all team members with progress indicators
- [ ] Given I tap a team member, I see their video completion percentages by module
- [ ] Given I view the dashboard, I see aggregate team metrics (avg completion, most watched modules)

**Priority:** Medium
**Complexity:** M

---

## Epic 3: Certification Ticket System

### Story 3.1: Certification Ticket Pool
**As a** salon owner,
**I want** a pool of certification tickets I can assign to team members,
**So that** I have flexibility in who gets certified.

**Acceptance Criteria:**
- [ ] Given I have a salon subscription, I have 3 certification tickets in my pool
- [ ] Given I'm on Team tab, I see available vs assigned ticket count
- [ ] Given I view my dashboard, I understand the difference between "Get Certified" (for me) and "Assign Team Certifications"

**Priority:** High
**Complexity:** M

---

### Story 3.2: Assign Certification to Team Member
**As a** salon owner,
**I want** to assign a certification ticket to a team member,
**So that** they can get certified at no additional cost.

**Acceptance Criteria:**
- [ ] Given I have available tickets, when I tap "Assign Certification", I see a list of team members
- [ ] Given I select a team member and certification type, the ticket is assigned
- [ ] Given assignment is successful, my available ticket count decreases by 1
- [ ] Given the team member, they receive notification they've been granted certification access

**Priority:** High
**Complexity:** M

---

### Story 3.3: Purchase Additional Certification Tickets
**As a** salon owner,
**I want** to buy more certification tickets at a discounted rate,
**So that** more of my team can get certified.

**Acceptance Criteria:**
- [ ] Given I have 0 available tickets, I see option to "Purchase More Tickets"
- [ ] Given I purchase tickets, they're added to my pool at ~30% discount ($207 vs $297)
- [ ] Given tickets are purchased, they work for any certification type (Bob, Pixie, Shag)

**Priority:** Medium
**Complexity:** M

---

## Epic 4: Private Events

### Story 4.1: Request Private Event
**As a** salon owner,
**I want** to request a custom event for my team,
**So that** we can get personalized training.

**Acceptance Criteria:**
- [ ] Given I'm on Events tab, I see "Request Private Event" button
- [ ] Given I tap it, I see a form with: event type, preferred dates, team size, location, special requests
- [ ] Given I submit, I see confirmation that Ray will review and schedule a call
- [ ] Given I submit, the request is logged in admin dashboard

**Priority:** Medium
**Complexity:** M

---

### Story 4.2: View Private Events
**As a** salon owner,
**I want** to see my private events separate from public events,
**So that** I can easily find events created for my salon.

**Acceptance Criteria:**
- [ ] Given I have a private event, it appears in "My Private Events" section
- [ ] Given I view Events tab, public and private events are clearly separated
- [ ] Given I view a private event, I can invite attendees (team members or external guests)

**Priority:** Medium
**Complexity:** S

---

### Story 4.3: Invite Attendees to Private Event
**As a** salon owner,
**I want** to invite people to my private event,
**So that** my team and guests can attend.

**Acceptance Criteria:**
- [ ] Given I'm viewing my private event, I can invite team members from my roster
- [ ] Given I want to invite external guests, I can enter their email addresses
- [ ] Given invites are sent, invitees receive notification/email with event details
- [ ] Given I view the event, I see who has been invited and their response status

**Priority:** Medium
**Complexity:** M

---

## Epic 5: Team Event Registration

### Story 5.1: Register Team for Public Event
**As a** salon owner,
**I want** to register multiple team members for an event at once,
**So that** I can easily send my team to training.

**Acceptance Criteria:**
- [ ] Given I'm viewing a public event, I see option to "Register Team Members"
- [ ] Given I tap it, I can multi-select team members to register
- [ ] Given I select 3 team members, I purchase 3 tickets in one transaction
- [ ] Given registration is complete, each team member gets their own digital ticket
- [ ] Given registration is complete, team members receive notification of their registration

**Priority:** Medium
**Complexity:** M

---

## Epic 6: Email Invite System (In Progress)

### Story 6.1: Single Email Invite
**As a** salon owner,
**I want** to invite a team member via email,
**So that** they receive the access code automatically.

**Acceptance Criteria:**
- [ ] Given I'm on Team tab, I can enter an email and tap "Send Invite"
- [ ] Given I send invite, an access code is generated and stored with the email
- [ ] Given invite is sent, recipient receives email with code, salon name, and how-to-join steps
- [ ] Given the code is used, I can see who redeemed it in my team list

**Priority:** High
**Complexity:** S
**Status:** ✅ Implemented (migration, edge function, UI complete)

---

## Implementation Phases

### Phase 1: Foundation (Current Session)
- Story 6.1: Single Email Invite ✅ (Complete)
- Story 2.1: Batch Email Invites ✅ (Complete)

### Phase 2: Certification System
- Story 3.1: Certification Ticket Pool
- Story 3.2: Assign Certification to Team Member
- Story 3.3: Purchase Additional Certification Tickets

### Phase 3: Additional Seats & Auto-Join
- Story 2.2: Additional Seat Purchases
- Story 2.3: Existing User Auto-Join

### Phase 4: Private Events
- Story 4.1: Request Private Event
- Story 4.2: View Private Events
- Story 4.3: Invite Attendees to Private Event
- Story 5.1: Register Team for Public Event

### Phase 5: Navigation & Branding
- Story 1.1: Rebrand App to Bob Company
- Story 1.2: User Type-Based Navigation
- Story 2.4: Team Progress Dashboard

---

## Summary

- **6 Epics** covering the v2.3 PRD features
- **13 User Stories** ready for implementation
- **1 Story Complete** (Single Email Invite)
- **Estimated Phases:** 5 phases for incremental delivery
