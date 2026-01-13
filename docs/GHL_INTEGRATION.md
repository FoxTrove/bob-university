# GoHighLevel (GHL) Integration Specification

**Version:** 1.0
**Date:** January 9, 2026
**Status:** Planning

---

## 1. Overview

GoHighLevel serves as Ray's CRM and email marketing platform. This document specifies the integration points between the Bob University app and GHL, covering requirements from PRD Section 4.4.1 plus additional value-adds.

### 1.1 PRD Requirements (Section 4.4.1)
- **Contact Sync**: New app users automatically added as GHL contacts
- **Event Triggers**: App events (signup, purchase, completion) trigger GHL workflows
- **Email Campaigns**: Transactional and marketing emails sent via GHL
- **Tags & Segments**: App behavior updates GHL tags for targeted campaigns

### 1.2 Additional Value-Adds Identified
- **Failed Payment Recovery**: Dunning emails via GHL (PRD 3.4.2)
- **Event Ticket Confirmation**: Email confirmation triggered via GHL (PRD 3.6.3)
- **Certification Journey Automation**: Multi-step email sequences for certification candidates
- **Re-engagement Campaigns**: Automated win-back for churned/inactive users
- **Lead Scoring**: App engagement data to score leads in GHL

---

## 2. Technical Architecture

### 2.1 Integration Pattern

```
Bob University App
       │
       ▼
Supabase Edge Function (ghl-sync)
       │
       ▼
GoHighLevel API v2
  └── https://services.leadconnectorhq.com
```

**Authentication**: Private Integration Token (Bearer token)
- Store in Supabase secrets: `GOHIGHLEVEL_API_KEY`
- Include `Location-Id` header for multi-location support

### 2.2 Data Flow Direction

| Direction | Purpose |
|-----------|---------|
| App → GHL | Contact creation, tag updates, event triggers |
| GHL → App | N/A (one-way sync for Phase 1) |

Future consideration: GHL webhooks could notify app of email engagement metrics.

---

## 3. Contact Sync

### 3.1 When to Create/Update GHL Contact

| App Event | GHL Action |
|-----------|------------|
| User signup (email/password) | Create contact |
| User signup (Apple/Google OAuth) | Create contact |
| Profile update | Update contact |
| User deleted | Tag as "churned" (don't delete) |

### 3.2 Contact Field Mapping

| App Field (profiles) | GHL Field |
|---------------------|-----------|
| email | email |
| full_name | firstName, lastName (split) |
| phone | phone |
| city, state, country | address.city, address.state, address.country |
| avatar_url | - (not mapped) |
| role | customField: "user_role" |
| salon_name | companyName |
| years_experience | customField: "years_experience" |
| created_at | dateAdded |

### 3.3 Edge Function: `ghl-contact-sync`

```typescript
// supabase/functions/ghl-contact-sync/index.ts
interface GHLContactPayload {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  companyName?: string;
  address?: {
    city?: string;
    state?: string;
    country?: string;
  };
  tags?: string[];
  customFields?: Array<{ key: string; value: string }>;
}

// POST https://services.leadconnectorhq.com/contacts/
// Headers: Authorization: Bearer {token}, Version: 2021-07-28
```

### 3.4 Trigger Implementation

**Option A: Database Trigger (Recommended)**
```sql
-- Supabase SQL: trigger on profiles INSERT
CREATE OR REPLACE FUNCTION sync_profile_to_ghl()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://{project}.supabase.co/functions/v1/ghl-contact-sync',
    body := jsonb_build_object(
      'user_id', NEW.id,
      'email', NEW.email,
      'full_name', NEW.full_name,
      'action', TG_OP
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ghl_sync
AFTER INSERT OR UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION sync_profile_to_ghl();
```

**Option B: App-Level Call**
Call edge function from mobile app after successful signup.

---

## 4. Tag & Segment Management

### 4.1 Tag Strategy

Tags enable GHL workflow segmentation. Apply tags based on app behavior:

| Category | Tags |
|----------|------|
| **Subscription Status** | `free_user`, `paid_individual`, `paid_salon`, `churned`, `trial` |
| **Subscription Lifecycle** | `payment_failed`, `cancellation_pending`, `win_back_eligible` |
| **Engagement Level** | `active_7d`, `active_30d`, `inactive_30d`, `inactive_90d` |
| **Content Progress** | `started_basics`, `completed_basics`, `started_bob_method`, `completed_bob_method` |
| **Certification** | `cert_eligible`, `cert_purchased`, `cert_submitted`, `cert_approved`, `cert_rejected` |
| **Events** | `event_attendee`, `event_ticket_holder`, `workshop_graduate` |
| **Role** | `stylist`, `salon_owner`, `educator`, `student` |
| **Goals** | `goal_master_bob`, `goal_grow_revenue`, `goal_train_staff` |

### 4.2 Tag Sync Events

| App Event | Add Tags | Remove Tags |
|-----------|----------|-------------|
| Signup completed | `free_user`, role tag | - |
| Subscription started | `paid_individual` or `paid_salon` | `free_user` |
| Subscription canceled | `churned` | `paid_*` |
| Payment failed | `payment_failed` | - |
| Payment recovered | - | `payment_failed` |
| Module started | `started_{module_slug}` | - |
| Module completed | `completed_{module_slug}` | `started_{module_slug}` |
| Cert purchased | `cert_purchased` | `cert_eligible` |
| Cert approved | `cert_approved` | `cert_submitted` |
| Event ticket purchased | `event_ticket_holder` | - |
| 30 days inactive | `inactive_30d` | `active_*` |

### 4.3 Edge Function: `ghl-tag-update`

```typescript
// PUT https://services.leadconnectorhq.com/contacts/{contactId}
// Body: { tags: ["tag1", "tag2"] }

interface TagUpdatePayload {
  user_id: string;
  email: string;
  add_tags: string[];
  remove_tags: string[];
}
```

---

## 5. Event Triggers → GHL Workflows

### 5.1 Webhook Events to GHL

GHL workflows can be triggered by inbound webhooks. Configure Bob University to POST to GHL webhook URLs when key events occur.

| App Event | GHL Workflow Purpose |
|-----------|---------------------|
| `user.signup` | Welcome email sequence |
| `subscription.created` | Onboarding email for paid members |
| `subscription.canceled` | Win-back email sequence |
| `payment.failed` | Dunning email sequence |
| `module.completed` | Congratulations + next steps email |
| `certification.purchased` | Cert journey kickoff email |
| `certification.submitted` | "Under review" confirmation email |
| `certification.approved` | Congratulations + directory invite email |
| `certification.rejected` | Feedback + retry guidance email |
| `event.ticket_purchased` | Ticket confirmation + calendar invite |
| `event.reminder_24h` | Event reminder email |
| `user.inactive_14d` | Re-engagement nudge email |

### 5.2 Webhook Payload Format

```typescript
interface GHLWebhookPayload {
  event: string;           // e.g., "user.signup"
  timestamp: string;       // ISO 8601
  contact: {
    email: string;
    firstName: string;
    lastName: string;
  };
  data: Record<string, any>; // Event-specific data
}

// Example: certification.approved
{
  "event": "certification.approved",
  "timestamp": "2026-01-09T15:30:00Z",
  "contact": {
    "email": "stylist@example.com",
    "firstName": "Jessica",
    "lastName": "Smith"
  },
  "data": {
    "certification_name": "Ray-Certified Stylist",
    "certificate_url": "https://app.bobuniversity.com/cert/abc123",
    "directory_eligible": true
  }
}
```

### 5.3 Edge Function: `ghl-event-trigger`

```typescript
// POST to GHL Workflow Inbound Webhook URL
// URL format: https://services.leadconnectorhq.com/hooks/{workflow_id}
```

---

## 6. Email Campaign Integration

### 6.1 Transactional Emails via GHL

Rather than building email templates in the app, trigger GHL workflows that send beautifully designed emails.

| Email Type | Trigger |
|------------|---------|
| Welcome email | `user.signup` webhook |
| Payment receipt | `payment.success` webhook (or Stripe + GHL direct) |
| Password reset | GHL workflow + magic link |
| Event ticket confirmation | `event.ticket_purchased` webhook |
| Certification result | `certification.approved` / `certification.rejected` |

### 6.2 Marketing Emails (GHL-Managed)

These campaigns run entirely within GHL, using tags/segments from app sync:

| Campaign | Segment | Trigger |
|----------|---------|---------|
| Free trial nurture | `free_user` | 3-day, 7-day, 14-day drip |
| Upgrade prompts | `free_user` + `active_7d` | Engaged free users |
| Certification upsell | `completed_bob_method` + `paid_*` | After module completion |
| Event promotion | All contacts | Manual / scheduled |
| Re-engagement | `inactive_30d` | Automated |
| Win-back | `churned` | 7-day, 30-day, 90-day post-cancel |

---

## 7. Failed Payment Recovery (Dunning)

### 7.1 Flow

1. Stripe webhook fires `invoice.payment_failed`
2. App edge function receives webhook
3. App adds `payment_failed` tag via GHL API
4. App triggers `payment.failed` webhook to GHL
5. GHL dunning workflow begins:
   - Day 0: "Oops, payment failed" email with update link
   - Day 3: Reminder email
   - Day 7: Final warning before access revocation
6. If payment recovers (Stripe `invoice.paid`):
   - Remove `payment_failed` tag
   - Trigger `payment.recovered` webhook (optional thank you email)
7. If payment not recovered by Day 10:
   - Revoke entitlement
   - Add `churned` tag
   - Trigger win-back workflow

### 7.2 Implementation

Extend existing `stripe-webhook` edge function:

```typescript
case 'invoice.payment_failed':
  // 1. Update entitlement status
  // 2. Call ghl-tag-update with payment_failed
  // 3. Call ghl-event-trigger with payment.failed event
  break;
```

---

## 8. Additional Value-Adds

### 8.1 Lead Scoring

Push app engagement metrics to GHL custom fields for sales prioritization:

| Metric | GHL Custom Field |
|--------|-----------------|
| Videos watched (count) | `app_videos_watched` |
| Modules completed (count) | `app_modules_completed` |
| Last active date | `app_last_active` |
| Total watch time (hours) | `app_watch_time_hours` |
| Certification status | `app_cert_status` |

Use these in GHL to build lead scoring rules:
- High engagement free users = hot upgrade leads
- Paid users with low engagement = churn risk

### 8.2 Assessment Data Sync

Sync onboarding assessment answers to GHL for personalization:

| Assessment Field | GHL Custom Field |
|-----------------|-----------------|
| role | `app_role` |
| experience | `app_years_experience` |
| goal | `app_primary_goal` |
| challenge | `app_challenge` |

GHL can use these for:
- Personalized email content
- Targeted campaign segments
- Sales conversation context

### 8.3 Referral Tracking

If implementing referrals:
- Tag referrers: `has_referrals`, `referral_count_{n}`
- Tag referred users: `referred_by_{user_id}`
- Trigger referral reward emails

### 8.4 Milestone Celebrations

Trigger celebratory emails for achievements:
- First video completed
- First module completed
- 10 videos watched
- 1-year anniversary
- Certification earned

### 8.5 Event Follow-Up Automation

Post-event sequences:
- Thank you email with recording access
- Feedback survey request
- Certification upsell (for workshop attendees)
- Next event promotion

---

## 9. Implementation Phases

### Phase 1: Core Integration (MVP)
1. Contact sync on signup
2. Basic tags (subscription status, role)
3. Signup webhook → welcome email workflow

**Estimated effort**: 2-3 days

### Phase 2: Engagement Tracking
1. Module completion tags
2. Activity tags (active/inactive)
3. Assessment data sync

**Estimated effort**: 1-2 days

### Phase 3: Payment & Dunning
1. Failed payment webhook integration
2. Dunning workflow setup in GHL
3. Win-back workflow setup

**Estimated effort**: 2-3 days

### Phase 4: Certification Journey
1. Certification lifecycle tags
2. Certification email workflows
3. Directory invite automation

**Estimated effort**: 1-2 days

### Phase 5: Advanced Features
1. Lead scoring sync
2. Milestone emails
3. Event follow-up automation

**Estimated effort**: 2-3 days

---

## 10. Edge Functions Required

| Function | Purpose |
|----------|---------|
| `ghl-contact-sync` | Create/update contacts in GHL |
| `ghl-tag-update` | Add/remove tags from contacts |
| `ghl-event-trigger` | POST webhooks to GHL workflows |
| `ghl-bulk-sync` | One-time sync of existing users |

---

## 11. Environment Variables

```env
# GHL Integration
GOHIGHLEVEL_API_KEY=         # Private Integration Token
GOHIGHLEVEL_LOCATION_ID=     # Location ID from GHL
GOHIGHLEVEL_WEBHOOK_URL=     # Base URL for inbound webhooks
```

---

## 12. GHL Workflow Setup (Ray's Side)

These workflows need to be created in GHL's workflow builder:

| Workflow Name | Trigger | Actions |
|---------------|---------|---------|
| Welcome Sequence | Inbound Webhook (user.signup) | Email series (Day 0, 3, 7) |
| Paid Onboarding | Inbound Webhook (subscription.created) | Welcome email + getting started |
| Dunning Sequence | Inbound Webhook (payment.failed) | Email series + escalation |
| Win-Back | Inbound Webhook (subscription.canceled) | Email series (Day 7, 30, 90) |
| Cert Journey | Inbound Webhook (certification.purchased) | Prep tips, submission reminder |
| Cert Result | Inbound Webhook (certification.approved/rejected) | Result email + next steps |
| Event Confirmation | Inbound Webhook (event.ticket_purchased) | Ticket email + calendar |
| Re-engagement | Tag trigger (inactive_30d) | Nudge email series |

---

## 13. Success Metrics

| Metric | Target |
|--------|--------|
| Contact sync accuracy | 99.9% |
| Webhook delivery success | 99.5% |
| Email open rate (welcome) | 40%+ |
| Free-to-paid conversion (via email) | 10%+ |
| Churn reduction (dunning recovery) | 20%+ of failed payments |

---

## 14. References

- [HighLevel API Documentation](https://marketplace.gohighlevel.com/docs/)
- [Webhook Integration Guide](https://marketplace.gohighlevel.com/docs/webhook/WebhookIntegrationGuide/index.html)
- [Custom Webhook Action](https://help.gohighlevel.com/support/solutions/articles/155000003305-workflow-action-custom-webhook)
- PRD Section 4.4.1 - Go High Level Integration
- PRD Section 3.4.2 - Failed Payment Recovery
