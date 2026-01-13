# Bob University Project Roadmap

This document outlines the systematic plan for completing the Bob University application, aligned with PRD Version 2.0.

## Phase 1: Foundation (Current Status: ~70% Complete)
**Goal:** Launch core mobile functionality and robust content delivery.

- [x] **Data Migration & Management**
    - [x] Schema Design (Users, Modules, Videos)
    - [x] Migrate Videos from GHL to Mux
    - [x] Fix Mux Video Errors & Titles
    - [ ] **Next**: Verify all videos play correctly in App
- [x] **App Infrastructure**
    - [x] Project Setup (Expo/React Native)
    - [x] Authentication (Supabase Auth)
    - [x] Basic Navigation (Tabs)
- [ ] **Content Experience**
    - [ ] **Rich Media Lessons**: Support Video + Text + Image + PDF attachments. (New V2 feature)
    - [ ] **Video Player Enhancements**: Implement "Enforced Watching" (no scrubbing for certs), Speed Controls.
    - [ ] **Module Logic**: Implement "Prerequisites" toggle and "Customizable Structures" for salons.
    - [ ] **Progress Tracking**: Ensure accurate % completion and visual checklists.
    - [ ] **Collections**: Implement Collections for flexible content grouping (New V2 feature).
- [ ] **Onboarding & Personalization**
    - [ ] Implement new **Persona Selection** (Stylist, Salon Owner, Certification Client).
    - [ ] Build **Extended Skill Assessment**.
    - [ ] Create **Pop-up Tours**.
    - [ ] **Events & Workshops**: Added Start/End times, Zoom integration, and Calendar view. (V2 Update)

## Phase 2: Engagement & Monetization (Status: ~20% Complete)
**Goal:** Enable payments, subscriptions, and certifications.

- [ ] **Payments & Subscriptions**
    - [x] Stripe Integration (Backend/Webhooks setup)
    - [ ] **In-App Purchases (iOS)**: Implement RevenueCat or comparable IAP logic (Critical for iOS launch).
    - [ ] **Feature Gating**: Implement `checkSubscription` logic to lock "Advanced Modules" and "Certifications".
- [ ] **Certifications**
    - [x] Database Schema (`user_certifications`)
    - [ ] **Submission Flow**: UI to upload video, payment step ($297).
    - [ ] **Review Dashboard**: Admin interface to approve/reject.
    - [ ] **Physical Material Automation**: Webhook to shipping provider.
- [ ] **Stylist Directory**
    - [ ] Public Map View (Mapbox integration).
    - [ ] Stylist Profile Editing.

## Phase 3: Polish & Launch
**Goal:** Refine UX and ensure stability.

- [ ] **Analytics**: Implement PostHog/Mixpanel for engagement tracking.
- [ ] **Push Notifications**: Setup Expo Push / OneSignal. Implement V2 cadence (1 week, 24hr, 1hr) and Quiet Hours.
- [ ] **Admin Dashboard (Web)**: Comprehensive management for Ray. Add AI Workflows and expanded Analytics.

---

## Immediate Next Steps (Systematic Plan)
1.  **Consolidate Content Logic**: Now that videos are fixed, ensure the **Mobile App Module/Video View** handles the new PRD requirements (Prerequisites, Gating).
2.  **Onboarding Overhaul**: Implement the new Persona-based onboarding flow.
3.  **Completion of Stripe/IAP**: Finalize the payment loop.
