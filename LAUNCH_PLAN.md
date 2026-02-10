# Bob University Launch Plan
## Target: February 23, 2026

**Last Updated:** February 10, 2026 (iOS payment strategy resolved)
**Days Until Launch:** 13 days
**Days Until App Store Submission:** 2-3 days (Feb 12-13)

---

## Timeline Overview

| Date | Milestone |
|------|-----------|
| Feb 9 (Today) | Audit complete, prioritize blockers |
| Feb 10-11 | Critical dev fixes (Apple IAP, APNs) |
| Feb 12-13 | **App Store Submission** |
| Feb 14-16 | **Soft Launch** (Beta testers) |
| Feb 16-22 | Bug fixes, pre-launch marketing |
| **Feb 23** | **HARD LAUNCH** |
| Feb 27 | Webinar |

---

## Current Status Summary

### What's Working (90%+ Complete)
- Stripe subscription payments (Android/Web)
- Content gating (free vs premium)
- Drip content system
- Onboarding flow (all user types)
- Cancel flow with retention offers
- GHL integration (contact sync, tags, workflows)
- Push notification infrastructure
- Admin dashboard
- Community feature
- Directory & maps
- Certification submission flow

### Critical Blockers (Must Fix Before Submission)

| # | Issue | Impact | Est. Time |
|---|-------|--------|-----------|
| ~~1~~ | ~~Apple IAP stub only~~ | ✅ **RESOLVED** - Using external link to web checkout (Epic v Apple ruling) | 0 hrs |
| 2 | **APNs certificate missing** | iOS push notifications fail | 1-2 hrs |
| 3 | **No E2E tests** | Can't validate payment flows | 4-6 hrs |

### High Priority (Before Launch)

| # | Issue | Impact | Est. Time |
|---|-------|--------|-----------|
| 4 | Verify free vs paid video configuration | Content access issues | 2-3 hrs |
| 5 | App Store assets (screenshots, description) | Submission requirement | 2-3 hrs |
| 6 | TestFlight & Android internal test builds | Beta testing | 1-2 hrs |
| 7 | Full payment flow QA (signup → payment → access) | User experience | 2-3 hrs |

---

## Detailed Task Breakdown

### TIER 1: Critical Blockers (Feb 10-11)

#### 1. ✅ iOS Payment Strategy (RESOLVED)

**Decision (Feb 10, 2026):** Using external link to web checkout instead of Apple IAP.

**Legal Context (Epic v Apple):**
- April 2023: Ninth Circuit ruled anti-steering rules violate California UCL. Nationwide injunction allows developers to link to external payment options.
- January 2024: Supreme Court denied cert. Injunction in full effect.
- April 2025: Judge Rogers found Apple in **willful violation** for trying to charge 27% on external link purchases. Apple ordered to stop enforcing those fees.
- **Current state**: External links are legal and fee-free. Apple was found in contempt; enforcement proceedings ongoing.

**Implementation Complete:**
- `app/subscribe.tsx` - Updated to show Apple-required warning modal, then opens `bobuniversity.com/subscribe` in browser
- iOS users complete Stripe checkout on web
- Single payment system (Stripe) for all platforms
- 0% Apple commission (vs 15-30% with IAP)

**Remaining Work:**
- Create `bobuniversity.com/subscribe` web page with Stripe Checkout
- Handle deep linking back to app after purchase (optional enhancement)

---

#### 2. Configure APNs Certificate

**Required Work:**
1. Apple Developer Portal:
   - Create APNs Key (p8 file)
   - Download and save securely

2. Expo Dashboard:
   - Add APNs key to project credentials
   - Or configure in eas.json for EAS Build

3. Test:
   - Build development app
   - Test push notification on physical device

---

#### 3. E2E Tests for Critical Flows

**Test Scenarios:**
```typescript
// tests/e2e/payment.test.ts
describe('Payment Flow', () => {
  test('Free user can browse free videos', async () => {});
  test('Free user sees paywall on premium video', async () => {});
  test('User can complete Stripe subscription', async () => {});
  test('Entitlement updates after payment', async () => {});
  test('User can access premium content after payment', async () => {});
});

describe('Cancel Flow', () => {
  test('User sees retention offer', async () => {});
  test('Accepting offer extends subscription', async () => {});
  test('Declining cancels at period end', async () => {});
});
```

**Tool Options:**
- Detox (React Native E2E)
- Maestro (simpler, YAML-based)
- Manual QA checklist (minimum)

---

### TIER 2: High Priority (Feb 11-13)

#### 4. Verify Free vs Paid Video Configuration

**Check in Admin Dashboard:**
- [ ] Identify which videos should be free (`is_free: true`)
- [ ] Verify 5-10 intro videos are marked free
- [ ] Confirm premium videos are gated
- [ ] Test drip content dates

**Database Query:**
```sql
-- Check free video count
SELECT COUNT(*) FROM videos WHERE is_free = true;

-- List free videos
SELECT id, title, module_id FROM videos WHERE is_free = true;

-- Check videos with drip delays
SELECT id, title, drip_days FROM videos WHERE drip_days > 0;
```

---

#### 5. App Store Assets

**iOS App Store:**
- [ ] 6.7" iPhone screenshots (5-8)
- [ ] 6.5" iPhone screenshots (5-8)
- [ ] 12.9" iPad Pro screenshots (optional)
- [ ] App icon (1024x1024)
- [ ] App preview video (30s, optional)
- [ ] Description (first 2 sentences critical)
- [ ] Keywords (100 chars)
- [ ] Privacy policy URL
- [ ] Support URL

**Google Play:**
- [ ] Feature graphic (1024x500)
- [ ] Screenshots (phone + tablet)
- [ ] Short description (80 chars)
- [ ] Full description
- [ ] Privacy policy URL

**Copy from MARKETING_LAUNCH_PLAN.md:**
```
App Name: Bob University - Hair Education
Subtitle: Pro Cutting Techniques & Tips
Keywords: hair education,haircutting,stylist training,barbering,certification,salon,bob techniques,haircut
```

---

#### 6. Test Builds

**iOS TestFlight:**
```bash
eas build --profile preview --platform ios
eas submit --platform ios
```

**Android Internal Testing:**
```bash
eas build --profile preview --platform android
# Upload AAB to Google Play Console internal testing track
```

---

### TIER 3: Pre-Launch Polish (Feb 14-22)

#### 7. Full User Flow QA

**Manual Test Checklist:**

**Authentication:**
- [ ] Email sign-up works
- [ ] Apple Sign-In works
- [ ] Google Sign-In works
- [ ] Password reset works

**Onboarding:**
- [ ] Individual stylist flow complete
- [ ] Salon owner flow complete
- [ ] Client flow complete
- [ ] Skills assessment saves correctly
- [ ] GHL contact created

**Content:**
- [ ] Free videos play without subscription
- [ ] Premium videos show paywall
- [ ] Video progress saves
- [ ] Resume playback works
- [ ] Module completion tracking works

**Subscription:**
- [ ] Plan selection displays correct prices
- [ ] Stripe payment completes
- [ ] Apple IAP payment completes (iOS)
- [ ] Entitlement updates immediately
- [ ] Premium content unlocks
- [ ] Receipt history shows purchases

**Community:**
- [ ] Can create post with image/video
- [ ] Comments work
- [ ] Reactions work
- [ ] Reporting works

**Certification:**
- [ ] Can view certification details
- [ ] Can submit video for review
- [ ] Status updates correctly

**Events:**
- [ ] Can browse events
- [ ] Can purchase tickets
- [ ] Confirmation received

**Push Notifications:**
- [ ] Permission prompt appears
- [ ] Token saved to database
- [ ] Test notification received

---

## Environment Checklist

### Required Environment Variables (Mobile)
```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=
```

### Required Edge Function Secrets (Supabase)
```
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
GHL_API_KEY=
GHL_LOCATION_ID=
RESEND_API_KEY=
# APPLE_SHARED_SECRET= (not needed - using external link instead of IAP)
```

### Required in App Store Connect
- [ ] ~~Subscription products created~~ (not needed - using external link)
- [ ] ~~Sandbox test users created~~ (not needed - using external link)
- [ ] Bank/tax info complete
- [ ] App Review contact info
- [ ] External link disclosure in app metadata (if required)

### Required in Google Play Console
- [ ] App created
- [ ] Store listing complete
- [ ] Content rating questionnaire
- [ ] Pricing configured

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| App Store rejection | Low | High | Submit early (Feb 12-13), external link approach is Apple-compliant |
| ~~Apple IAP not ready~~ | ~~Medium~~ | ~~Critical~~ | ✅ RESOLVED - Using external link to web checkout |
| Apple new compliance scheme | Low | Medium | Apple found in contempt April 2025; monitor enforcement proceedings |
| Critical bug in beta | Medium | Medium | 8-day soft launch buffer |
| Low initial downloads | Low | Low | Expected; webinar is growth engine |

---

## Go/No-Go Criteria (Feb 22)

**Must Have for Launch:**
- [ ] iOS app approved in App Store
- [ ] Android app approved in Google Play
- [ ] Stripe payments working (all platforms via external link for iOS)
- [ ] Web subscription page live at bobuniversity.com/subscribe
- [ ] Push notifications delivering
- [ ] All free content accessible
- [ ] Premium content properly gated
- [ ] GHL sync working
- [ ] No crash rate >1%

**Nice to Have:**
- [ ] E2E tests passing
- [ ] 100% of beta feedback addressed
- [ ] Perfect video playback

---

## Quick Reference Commands

```bash
# Start development
npm start

# Build for TestFlight
eas build --profile preview --platform ios

# Build for Google Play internal
eas build --profile preview --platform android

# Production build
eas build --profile production --platform all

# Check Supabase types
npx supabase gen types typescript --project-id <id> > lib/database.types.ts

# Run admin dashboard
cd admin && npm run dev
```

---

## Contacts

- **Kyle (Dev):** Focus on Apple IAP, APNs, technical blockers
- **Ray (Content):** Beta tester outreach, webinar prep, Instagram content

---

*Next Review: Feb 11, 2026 - After Apple IAP implementation*
