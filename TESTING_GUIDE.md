# Bob University - Pre-Launch Testing Guide
**Version:** 1.0.0
**Test Date:** _______________
**Tester:** _______________
**Device:** _______________
**iOS Version:** _______________

---

## How to Use This Guide
1. Go through each section systematically
2. Mark items: ✅ Pass | ❌ Fail | ⚠️ Minor Issue | ⏭️ Skipped
3. Add notes for any issues found
4. Screenshots help - note screen name + issue

---

## 1. Authentication Flow

### 1.1 Sign Up (New User)
| Test | Status | Notes |
|------|--------|-------|
| App loads to sign-in screen | | |
| "Sign Up" link visible and tappable | | |
| Email/password fields work | | |
| Password requirements shown | | |
| Sign up creates account | | |
| Email verification (if enabled) | | |
| Error states show properly (invalid email, weak password) | | |

### 1.2 Sign In (Existing User)
| Test | Status | Notes |
|------|--------|-------|
| Email field works | | |
| Password field works (secure entry) | | |
| "Forgot Password" link works | | |
| Sign in succeeds with valid credentials | | |
| Error message for wrong password | | |
| Error message for non-existent account | | |

### 1.3 Social Login
| Test | Status | Notes |
|------|--------|-------|
| "Sign in with Apple" button visible | | |
| Apple sign-in flow opens | | |
| Apple sign-in completes successfully | | |
| "Sign in with Google" button visible | | |
| Google sign-in flow opens | | |
| Google sign-in completes successfully | | |

### 1.4 Sign Out
| Test | Status | Notes |
|------|--------|-------|
| Sign out option in Profile | | |
| Confirmation prompt (if any) | | |
| Returns to sign-in screen | | |
| Cannot access app without signing in again | | |

---

## 2. Onboarding Flow (New Users)

### 2.1 Skills Assessment
| Test | Status | Notes |
|------|--------|-------|
| Onboarding screen appears for new users | | |
| Questions display correctly | | |
| Can select answers | | |
| Can navigate between questions | | |
| Progress indicator works | | |
| Can complete assessment | | |
| Results saved correctly | | |

---

## 3. Home Tab

### 3.1 Home Screen
| Test | Status | Notes |
|------|--------|-------|
| Home tab loads without error | | |
| Welcome message shows user name | | |
| Continue watching section (if applicable) | | |
| Featured content displays | | |
| Recommended videos display | | |
| Pull to refresh works | | |
| All cards are tappable | | |
| Navigation to video works | | |

### 3.2 Role-Based Home (if applicable)
| Test | Status | Notes |
|------|--------|-------|
| Individual stylist sees correct home | | |
| Salon owner sees correct home | | |
| Client sees correct home | | |

---

## 4. Modules/Curriculum Tab

### 4.1 Module List
| Test | Status | Notes |
|------|--------|-------|
| Modules tab loads | | |
| All modules display | | |
| Module thumbnails load | | |
| Module titles correct | | |
| Progress indicators show | | |
| Locked/unlocked states correct | | |
| Pull to refresh works | | |

### 4.2 Module Detail
| Test | Status | Notes |
|------|--------|-------|
| Tapping module opens detail | | |
| Module description displays | | |
| Video list displays | | |
| Video thumbnails load | | |
| Video durations shown | | |
| Free vs premium indicators | | |
| Progress per video shows | | |
| Back navigation works | | |

### 4.3 Video Player
| Test | Status | Notes |
|------|--------|-------|
| Video loads and plays | | |
| Play/pause works | | |
| Seek bar works | | |
| Volume control works | | |
| Fullscreen toggle works | | |
| Progress saves when exiting | | |
| Resume from where left off | | |
| Video completes properly | | |
| Captions/subtitles (if available) | | |
| Portrait/landscape orientation | | |

### 4.4 Content Access
| Test | Status | Notes |
|------|--------|-------|
| Free videos play for free users | | |
| Premium videos blocked for free users | | |
| Upgrade prompt shown for locked content | | |
| Premium videos play for subscribers | | |
| Drip content shows unlock date | | |

---

## 5. Certification Tab

### 5.1 Certification List
| Test | Status | Notes |
|------|--------|-------|
| Certifications tab loads | | |
| Available certifications display | | |
| Certification details visible | | |
| Price displayed correctly | | |
| Requirements listed | | |

### 5.2 Certification Detail
| Test | Status | Notes |
|------|--------|-------|
| Tapping certification opens detail | | |
| Full description displays | | |
| Prerequisites shown | | |
| Apply/Purchase button works | | |
| Application form (if applicable) | | |

### 5.3 User Certifications
| Test | Status | Notes |
|------|--------|-------|
| Earned certifications display | | |
| In-progress certifications show | | |
| Certificate view/download | | |

---

## 6. Directory Tab (Stylist Finder)

### 6.1 Map View
| Test | Status | Notes |
|------|--------|-------|
| Directory tab loads | | |
| Map displays correctly | | |
| User location requested | | |
| Stylist pins appear on map | | |
| Tapping pin shows preview | | |
| Map zooms/pans smoothly | | |

### 6.2 List View
| Test | Status | Notes |
|------|--------|-------|
| List view toggle works | | |
| Stylist cards display | | |
| Photos load | | |
| Distance/location shown | | |
| Specialties listed | | |

### 6.3 Stylist Profile
| Test | Status | Notes |
|------|--------|-------|
| Tapping stylist opens profile | | |
| Profile photo displays | | |
| Bio/description shows | | |
| Contact info visible | | |
| Salon/location info | | |
| Certifications displayed | | |
| Social links work | | |

---

## 7. Events Tab

### 7.1 Events List
| Test | Status | Notes |
|------|--------|-------|
| Events tab loads | | |
| Upcoming events display | | |
| Event images load | | |
| Dates/times correct | | |
| Location info shown | | |
| Price displayed | | |
| Past events (if shown) | | |

### 7.2 Event Detail
| Test | Status | Notes |
|------|--------|-------|
| Tapping event opens detail | | |
| Full description displays | | |
| Schedule/agenda shown | | |
| Location with map | | |
| Register/Purchase button | | |
| Registration form works | | |

### 7.3 Private Event Request
| Test | Status | Notes |
|------|--------|-------|
| Request private event option | | |
| Request form loads | | |
| All fields work | | |
| Submission succeeds | | |
| Confirmation shown | | |

---

## 8. Community Tab

### 8.1 Feed
| Test | Status | Notes |
|------|--------|-------|
| Community tab loads | | |
| Posts display in feed | | |
| Images load in posts | | |
| Author info shown | | |
| Timestamps correct | | |
| Pull to refresh works | | |
| Infinite scroll loads more | | |

### 8.2 Post Interactions
| Test | Status | Notes |
|------|--------|-------|
| Like/react to post | | |
| Unlike works | | |
| Comment on post | | |
| View all comments | | |
| Reply to comment | | |
| Delete own comment | | |
| Share post (if available) | | |
| Report post option | | |

### 8.3 Create Post
| Test | Status | Notes |
|------|--------|-------|
| Create post button visible | | |
| Text input works | | |
| Add image works | | |
| Image preview shows | | |
| Remove image works | | |
| Post publishes successfully | | |
| Post appears in feed | | |
| Character limit (if any) | | |

### 8.4 User Profiles
| Test | Status | Notes |
|------|--------|-------|
| Tapping username opens profile | | |
| Profile displays correctly | | |
| User's posts shown | | |
| Follow/unfollow (if available) | | |

---

## 9. Profile Tab

### 9.1 Profile View
| Test | Status | Notes |
|------|--------|-------|
| Profile tab loads | | |
| Profile photo displays | | |
| Name displays correctly | | |
| Email shown | | |
| Membership/plan status | | |
| Stats (videos watched, etc.) | | |

### 9.2 Edit Profile
| Test | Status | Notes |
|------|--------|-------|
| Edit profile option | | |
| Change name works | | |
| Change photo works | | |
| Camera option works | | |
| Photo library option works | | |
| Save changes works | | |
| Cancel discards changes | | |

### 9.3 Stylist Profile Settings
| Test | Status | Notes |
|------|--------|-------|
| Stylist settings (if applicable) | | |
| Directory visibility toggle | | |
| Salon/location editing | | |
| Specialties selection | | |
| Social links editing | | |

### 9.4 Subscription Management
| Test | Status | Notes |
|------|--------|-------|
| Current plan displayed | | |
| Upgrade option visible | | |
| Manage subscription button | | |
| Cancel subscription flow | | |
| Retention offer shown | | |

### 9.5 Settings
| Test | Status | Notes |
|------|--------|-------|
| Notification settings | | |
| Push notification toggles | | |
| Email notification toggles | | |
| Privacy settings | | |
| Terms of service link | | |
| Privacy policy link | | |
| App version shown | | |
| Sign out button | | |

---

## 10. Subscription/Payment Flow

### 10.1 Subscribe Screen
| Test | Status | Notes |
|------|--------|-------|
| Subscribe screen loads | | |
| All plans display | | |
| Prices correct (Founders pricing) | | |
| Plan features listed | | |
| Most popular badge shows | | |
| Free plan shown | | |

### 10.2 iOS External Checkout
| Test | Status | Notes |
|------|--------|-------|
| Tapping Subscribe shows modal | | |
| Modal text is Apple-compliant | | |
| "Continue to Website" works | | |
| Safari opens subscribe page | | |
| User email pre-filled | | |
| User name shown on web | | |
| Plan pre-selected | | |
| Stripe checkout loads | | |

### 10.3 Payment Completion
| Test | Status | Notes |
|------|--------|-------|
| Payment succeeds in Stripe | | |
| Success page shows | | |
| Countdown timer works | | |
| Deep link back to app | | |
| App shows success screen | | |
| Entitlement updated | | |
| Premium content now accessible | | |

### 10.4 Cancel Flow
| Test | Status | Notes |
|------|--------|-------|
| Cancel page loads (if cancelled) | | |
| Return to app works | | |
| Try again works | | |

---

## 11. Push Notifications

### 11.1 Permission
| Test | Status | Notes |
|------|--------|-------|
| Notification permission requested | | |
| Permission prompt shown | | |
| Can allow notifications | | |
| Can deny notifications | | |

### 11.2 Receiving Notifications
| Test | Status | Notes |
|------|--------|-------|
| Notification received (test) | | |
| Notification appears in tray | | |
| Tapping notification opens app | | |
| Deep links to correct screen | | |

---

## 12. Deep Links

### 12.1 URL Schemes
| Test | Status | Notes |
|------|--------|-------|
| bob-university:// opens app | | |
| bob-university://subscription-success | | |
| Video deep links (if any) | | |
| Module deep links (if any) | | |

---

## 13. Error States & Edge Cases

### 13.1 Network Errors
| Test | Status | Notes |
|------|--------|-------|
| Offline mode message | | |
| Retry button works | | |
| Cached content (if any) | | |
| Reconnect auto-refreshes | | |

### 13.2 Empty States
| Test | Status | Notes |
|------|--------|-------|
| No videos watched yet | | |
| No certifications earned | | |
| No community posts | | |
| Empty search results | | |

### 13.3 Loading States
| Test | Status | Notes |
|------|--------|-------|
| Spinners/skeletons show | | |
| Not stuck on loading | | |
| Graceful timeout handling | | |

---

## 14. Visual Polish

### 14.1 General UI
| Test | Status | Notes |
|------|--------|-------|
| Consistent fonts throughout | | |
| Colors match brand | | |
| No cut-off text | | |
| Images not stretched | | |
| Touch targets large enough | | |
| Safe area respected (notch) | | |
| Dark mode (if supported) | | |

### 14.2 Animations
| Test | Status | Notes |
|------|--------|-------|
| Transitions smooth | | |
| No janky scrolling | | |
| Tab switching smooth | | |
| Modal animations work | | |

### 14.3 Text & Content
| Test | Status | Notes |
|------|--------|-------|
| No typos in UI | | |
| No placeholder text | | |
| No "Lorem ipsum" | | |
| Dates formatted correctly | | |
| Currency formatted correctly | | |

---

## 15. Performance

| Test | Status | Notes |
|------|--------|-------|
| App launches quickly (<3s) | | |
| Navigation is responsive | | |
| Scrolling is smooth (60fps) | | |
| Videos load quickly | | |
| Images load without delay | | |
| No memory warnings | | |
| No crashes during testing | | |

---

## 16. Team/Salon Features (if applicable)

### 16.1 Salon Management
| Test | Status | Notes |
|------|--------|-------|
| Team tab visible for salon owners | | |
| Team members list | | |
| Invite team member | | |
| Remove team member | | |
| Team member progress | | |

### 16.2 Salon Invites
| Test | Status | Notes |
|------|--------|-------|
| Receive invite notification | | |
| Accept invite flow | | |
| Decline invite flow | | |
| Join salon successfully | | |

---

## Issue Summary

### Critical (Blockers)
| Issue | Screen | Priority |
|-------|--------|----------|
| | | |
| | | |
| | | |

### Major Issues
| Issue | Screen | Priority |
|-------|--------|----------|
| | | |
| | | |
| | | |

### Minor Issues / Polish
| Issue | Screen | Priority |
|-------|--------|----------|
| | | |
| | | |
| | | |

---

## Sign-Off

| Role | Name | Date | Approval |
|------|------|------|----------|
| Developer | | | |
| Product Owner | | | |
| QA Tester | | | |

---

*Testing Guide v1.0 - Bob University*
