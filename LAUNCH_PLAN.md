# Bob University Launch Plan
## Target: February 23, 2026

**Last Updated:** February 10, 2026 (Pricing & checkout flow complete)
**Days Until Launch:** 13 days
**Days Until App Store Submission:** 2-3 days (Feb 12-13)

---

## Timeline Overview

| Date | Milestone |
|------|-----------|
| ~~Feb 9~~ | ~~Audit complete, prioritize blockers~~ |
| ~~Feb 10~~ | ✅ **Pricing & Checkout Flow Complete** |
| Feb 11 | APNs certificate, content verification |
| Feb 12-13 | **App Store Submission** |
| Feb 14-16 | **Soft Launch** (Beta testers) |
| Feb 16-22 | Bug fixes, pre-launch marketing |
| **Feb 23** | **HARD LAUNCH** |
| Feb 27 | Webinar |

---

## Current Status Summary

### ✅ COMPLETED TODAY (Feb 10)

| Task | Status |
|------|--------|
| iOS External Link Checkout | ✅ Complete - Modal + web redirect |
| Web Subscribe Page | ✅ Live at web-steel-seven-44.vercel.app/subscribe |
| Founders Pricing (Stripe) | ✅ All prices created in Stripe |
| Founders Pricing (Database) | ✅ subscription_plans table updated |
| Founders Pricing (Mobile) | ✅ app/subscribe.tsx updated |
| Founders Pricing (Web) | ✅ Web page shows correct prices |
| Deep Link Return Flow | ✅ Auto-redirects back to app after checkout |
| Success/Cancel Pages | ✅ iOS-optimized with app return |
| Personalized Checkout | ✅ Shows user's name on web page |

**Founders Pricing Summary:**
| Plan | Price |
|------|-------|
| Signature | $49/mo |
| Studio | $97/mo |
| Studio Annual | $970/yr (2 months free) |
| Certification | $297 one-time |
| Virtual Studio Salon | $3,000/yr |
| In-Person Cert | $9,500 ($7,500 Founders) |

---

### 🔴 CRITICAL BLOCKERS (Must Fix Before Submission)

| # | Issue | Impact | Est. Time | Status |
|---|-------|--------|-----------|--------|
| ~~1~~ | ~~Apple IAP~~ | ✅ RESOLVED | - | **DONE** |
| 2 | **APNs certificate missing** | iOS push notifications fail | 1-2 hrs | TODO |
| 3 | **Vercel env vars not set** | Web checkout won't work | 30 min | TODO |

### 🟡 HIGH PRIORITY (Before Submission)

| # | Issue | Impact | Est. Time | Status |
|---|-------|--------|-----------|--------|
| 4 | Verify free vs paid videos | Content access issues | 1 hr | TODO |
| 5 | App Store assets | Submission requirement | 2-3 hrs | TODO |
| 6 | TestFlight build | Beta testing | 1 hr | TODO |
| 7 | Full payment flow QA | User experience | 2 hrs | TODO |

### 🟢 NICE TO HAVE (Before Launch)

| # | Issue | Impact | Est. Time | Status |
|---|-------|--------|-----------|--------|
| 8 | E2E tests | Automated QA | 4-6 hrs | Optional |
| 9 | Android Play Store listing | Android launch | 2 hrs | TODO |

---

## Vercel Environment Variables (BLOCKING)

**Must add to Vercel dashboard before web checkout works:**

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_SIGNATURE_PRICE_ID=price_1SzNodHQIhtnmy73Uas7S3rr
STRIPE_STUDIO_PRICE_ID=price_1SzOmDHQIhtnmy73hxpfq6Ce
STRIPE_STUDIO_ANNUAL_PRICE_ID=price_1SzOmDHQIhtnmy73fMVdl2Ns
STRIPE_CERTIFICATION_PRICE_ID=price_1SzOmTHQIhtnmy73trO1zz5b
STRIPE_VIRTUAL_SALON_PRICE_ID=price_1SzOmMHQIhtnmy73Ay8tlKSC
STRIPE_INPERSON_CERT_PRICE_ID=price_1SzOmbHQIhtnmy73okJLk6yW
STRIPE_INPERSON_CERT_FOUNDERS_PRICE_ID=price_1SzOmbHQIhtnmy73baScE0n8
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_BASE_URL=https://bobuniversity.com
```

---

## Remaining Tasks Detail

### 1. APNs Certificate (1-2 hrs)

**Steps:**
1. Apple Developer Portal → Keys → Create APNs Key
2. Download .p8 file
3. Add to Expo credentials:
   ```bash
   eas credentials --platform ios
   ```
4. Test on physical device

### 2. Verify Content Configuration (1 hr)

**Check in Supabase:**
```sql
-- Free videos (should be 5-10 intro videos)
SELECT id, title, module_id FROM videos WHERE is_free = true;

-- Videos with drip delays
SELECT id, title, drip_days FROM videos WHERE drip_days > 0 ORDER BY drip_days;

-- Verify modules are published
SELECT id, title, is_published FROM modules WHERE is_published = true;
```

### 3. App Store Assets (2-3 hrs)

**iOS Required:**
- [ ] 6.7" iPhone screenshots (5-8)
- [ ] 6.5" iPhone screenshots (5-8)
- [ ] App icon 1024x1024
- [ ] Description (highlight: precision cutting, Ray's techniques)
- [ ] Keywords (100 chars max)
- [ ] Privacy policy URL
- [ ] Support URL
- [ ] **External link disclosure** (if Apple requires)

**Google Play:**
- [ ] Feature graphic 1024x500
- [ ] Phone screenshots
- [ ] Short description (80 chars)
- [ ] Full description

### 4. TestFlight Build (1 hr)

```bash
# Build for TestFlight
eas build --profile preview --platform ios

# Submit to App Store Connect
eas submit --platform ios
```

### 5. Payment Flow QA (2 hrs)

**Test Matrix:**

| Platform | Flow | Test |
|----------|------|------|
| iOS | External link → Web → Stripe → Deep link back | Manual |
| Android | In-app Stripe Payment Sheet | Manual |
| Web | Direct Stripe Checkout | Manual |

**Scenarios:**
- [ ] New user sign up → subscribe → access content
- [ ] Existing user → upgrade to Studio
- [ ] User → cancel → sees retention offer
- [ ] User → cancel confirmed → access until period end

---

## Go/No-Go Criteria (Feb 22)

### Must Have ✅
- [ ] iOS app approved in App Store
- [ ] Android app in Google Play (internal at minimum)
- [ ] Stripe payments working on web
- [ ] Web checkout page live with correct domain
- [ ] iOS deep link back to app working
- [ ] Push notifications delivering (iOS + Android)
- [ ] Free content accessible
- [ ] Premium content gated
- [ ] GHL sync working

### Nice to Have
- [ ] E2E tests passing
- [ ] 100% beta feedback addressed
- [ ] Custom domain (bobuniversity.com/subscribe)

---

## iOS Checkout Flow (Complete)

```
User taps Subscribe
       ↓
Apple-required modal
       ↓
"Continue to Website"
       ↓
Safari → bobuniversity.com/subscribe
• Personalized greeting with user's name
• Plan pre-selected
• Email pre-filled
       ↓
Stripe Checkout
       ↓
Success page (3-second countdown)
       ↓
Auto deep-link → bob-university://subscription-success
       ↓
App shows success, refreshes entitlement
       ↓
Auto-navigate to home
```

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| App Store rejection | Low | High | External link approach is court-approved |
| Vercel env vars not set | High | Critical | **Do this immediately** |
| APNs not configured | High | Medium | Beta testers can't test push |
| Critical bug in beta | Medium | Medium | 8-day buffer before launch |

---

## Quick Reference

```bash
# Mobile development
npm start

# Web development
cd web && npm run dev

# Deploy web to Vercel
cd web && vercel --prod

# iOS TestFlight build
eas build --profile preview --platform ios
eas submit --platform ios

# Android build
eas build --profile preview --platform android
```

---

## Next Actions (Priority Order)

1. **🔴 Set Vercel env vars** (blocks web checkout)
2. **🔴 Configure APNs certificate** (blocks iOS push)
3. **🟡 Verify free video configuration**
4. **🟡 Create App Store screenshots**
5. **🟡 Submit TestFlight build**
6. **🟡 Full QA pass**

---

*Next Review: Feb 11, 2026 - After APNs and content verification*
