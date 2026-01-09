# Bob University E2E Testing Checklist

This checklist covers critical workflows for manual QA testing before releases.

---

## Admin Dashboard Workflows

### Authentication
- [ ] Login with admin credentials
- [ ] Logout and session cleanup
- [ ] Non-admin users see "Unauthorized" page

### Users Management
- [ ] Users list loads with all profiles
- [ ] User detail page shows correct info (plan, LTV, entitlements)
- [ ] Free users show "Free" badge
- [ ] Premium users show correct plan type (Individual/Salon)
- [ ] LTV calculations are accurate

### Subscription Plans (Settings)
- [ ] Plans load on Settings page
- [ ] Edit plan opens modal with correct data
- [ ] Description updates save correctly
- [ ] Features can be added/removed
- [ ] Apple/Google product IDs save correctly
- [ ] Price change warning appears when modifying amount
- [ ] Price change creates new Stripe price (check Stripe dashboard)
- [ ] Old Stripe price is archived after update
- [ ] Active/Inactive toggle works

### Video Management
- [ ] Videos list loads
- [ ] Video upload flow works (Mux integration)
- [ ] Video edit form saves changes
- [ ] Transcript upload/display works
- [ ] Video deletion works

### Module Management
- [ ] Modules list loads
- [ ] Create new module
- [ ] Add videos to module (drag & drop ordering)
- [ ] Edit module details
- [ ] Drip schedule configuration saves
- [ ] Delete module (with confirmation)

### Certifications
- [ ] Settings page loads certification config
- [ ] Required modules selection works
- [ ] Submissions queue shows pending reviews
- [ ] Approve/Reject workflow functions
- [ ] Feedback can be added

### Events
- [ ] Events list loads
- [ ] Create new event with all fields
- [ ] Edit event details
- [ ] View registrations for event
- [ ] Registration export works

### Collections
- [ ] Collections list loads
- [ ] Create collection with videos
- [ ] Edit collection
- [ ] Delete collection

### Analytics
- [ ] Overview dashboard loads with KPIs
- [ ] Revenue page shows charts and data
- [ ] Users page shows growth metrics
- [ ] Date range selector works (7d, 30d, 90d, etc.)
- [ ] CSV export downloads correct data

---

## Mobile App Workflows

### Authentication
- [ ] Sign up with email/password
- [ ] Sign in with email/password
- [ ] Sign in with Apple (iOS)
- [ ] Sign in with Google
- [ ] Logout clears session
- [ ] Password reset flow works

### Onboarding
- [ ] New user sees onboarding modal
- [ ] Progress bar advances correctly
- [ ] Assessment questions save to profile
- [ ] Upsell step appears for free users
- [ ] Skip button works
- [ ] "Start Learning" completes onboarding
- [ ] Returning user doesn't see onboarding again

### Video Playback
- [ ] Videos load and play from Mux
- [ ] Progress tracking works (saves position)
- [ ] Resume from last position works
- [ ] Double-tap to seek (-10s left, +10s right)
- [ ] Speed control (0.5x - 2x) works
- [ ] Fullscreen mode works
- [ ] 90% watch triggers completion
- [ ] Premium videos locked for free users
- [ ] Seek forward restricted for incomplete videos

### Subscription Purchase

#### iOS (Apple IAP - Placeholder)
- [ ] Subscribe screen shows plans from database
- [ ] Prices match database values
- [ ] Apple IAP alert shows correct product ID
- [ ] (Full IAP testing requires App Store Connect setup)

#### Android (Stripe)
- [ ] Subscribe screen shows plans from database
- [ ] Prices match database values
- [ ] Stripe payment sheet opens
- [ ] Test card payment succeeds
- [ ] Entitlement updates after purchase
- [ ] Premium content unlocks

### Modules & Progress
- [ ] Modules list loads
- [ ] Module detail shows videos
- [ ] Progress percentage updates correctly
- [ ] Completed videos show checkmark
- [ ] Module completion tracked

### Certification
- [ ] Certification page loads for premium users
- [ ] Progress shows correctly
- [ ] Video submission upload works
- [ ] Submission status displays

### Stylist Directory
- [ ] Directory loads with stylists
- [ ] Map shows locations (Mapbox)
- [ ] Filter/search works
- [ ] Profile modal shows details

### Events
- [ ] Events list loads
- [ ] Event detail shows info
- [ ] Registration flow works

### Profile
- [ ] Profile shows user info
- [ ] Plan status correct
- [ ] Settings accessible

---

## Integration Checks

### Stripe
- [ ] Webhook receives events (check Supabase logs)
- [ ] Subscription created syncs to entitlements
- [ ] Subscription canceled updates status
- [ ] Revenue ledger records transactions

### Mux
- [ ] Video uploads process correctly
- [ ] Playback works on all platforms
- [ ] Transcripts are generated

### Supabase
- [ ] RLS policies working (users see own data only)
- [ ] Admin service role access works
- [ ] Real-time updates work (if used)

---

## Edge Cases

- [ ] Expired subscription shows correct status
- [ ] Network offline handling (graceful errors)
- [ ] Large video library performance
- [ ] Deep link to video works
- [ ] Background app resume state

---

## Test Accounts

| Role | Email | Plan |
|------|-------|------|
| Admin | (set up locally) | N/A |
| Premium | (create test user) | Individual |
| Free | (create test user) | Free |

---

*Last Updated: January 2026*
