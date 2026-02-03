# Bob University Mobile Application
## Product Requirements Document

**Version 2.2**
**February 3, 2026**
**Prepared by FoxTrove.ai for Ray Hornback**

| Metadata | Details |
| :--- | :--- |
| **Document Status** | Updated - New Pricing Tiers & User Types (Paige Meeting Feb 3) |
| **Project Name** | Bob University Mobile App |
| **Client** | Ray Hornback |
| **Development Partner** | FoxTrove.ai (Kyle Rasmussen) |
| **Target Launch** | January/February 2026 |
| **Platforms** | iOS (App Store) & Android (Google Play) |


## 1. Executive Summary

### 1.1 Product Vision
The Bob Company Hair Education App is a premium mobile platform designed to transform
how hairstylists learn and master cutting techniques. Built for Ray Hornback's established
hair education business, this app will serve as the primary delivery mechanism for
educational content, certifications, community building, and live event management.

The app addresses critical friction points in the current delivery and marketing system by
providing a native mobile experience that meets Gen Z stylists where they already are—on
their phones (not their emails). By implementing a freemium model with immediate access to
free content, the app creates a seamless pathway from discovery (Instagram) to
engagement (free app content) to conversion (paid subscription).

### 1.2 Business Objectives
- Scale membership from 125 current members to 600+ members (4-5x growth)
- Reduce friction in content delivery and member access
- Enable freemium acquisition channel that bypasses email warm-up sequences
- Increase engagement through push notifications and native mobile experience
- Streamline certification and live event management
- Build a client-facing stylist directory to create network effects

### 1.3 Success Metrics
| Metric | Current State | 18-Month Target |
| :--- | :--- | :--- |
| Active Members | 125 | 500-600 |
| Monthly Recurring Revenue | ~$8,000 | $35,000+ |
| App Downloads (cumulative) | N/A | 2,000+ |
| Free-to-Paid Conversion Rate | N/A | 15-25% |
| Monthly Churn Rate | UNKNOWN | <6% |
| App Store Rating | N/A | 4.5+ stars |


## 2. Target Users & Personas

### 2.1 Primary Persona: The Aspiring Stylist
Name: Jessica, 24

Background: Recently graduated from cosmetology school, working at her first salon.
Follows Ray on Instagram and loves his clean, modern cutting style.

Goals: Build confidence with precision cuts, learn techniques her school didn't teach, charge
more for her services.

Pain Points: Limited time between clients, needs bite-sized content she can consume on
breaks. Overwhelmed by YouTube's inconsistent quality. Wants a trusted resource that will
elevate her skills.

Tech Behavior: Phone-first, rarely checks email, discovers content through
Instagram/TikTok, expects instant access.

### 2.2 Secondary Persona: The Salon Owner
Name: Michelle, 38

Background: Owns a 5-chair salon, employs 4 junior stylists. Wants consistent training for
her team.

Goals: Upskill her entire team efficiently, ensure consistent quality across all stylists, reduce
training costs.

Pain Points: Can't afford to send everyone to in-person training, needs a scalable and easy
to access solution.

Tech Behavior: More comfortable with desktop but staff all use phones. Needs simple team
management.

### 2.3 Tertiary Persona: The Certification Seeker
Name: David, 30

Background: Experienced stylist looking to differentiate himself. Wants credentials to justify
premium pricing.

Goals: Get certified in Ray's methods, be listed in the stylist directory, attract clients who
want Ray's style.

Pain Points: Needs proof of skills beyond just watching videos. Needs recognition as a
business strategy.

### 2.4 End Consumer Persona: The Client
Name: Sarah, 35

Background: Loves Ray's Instagram content and haircut style but lives in Texas, not
Colorado.


Goals: Find a stylist near her who has been trained by Ray and can deliver similar results.

App Usage: Public-facing stylist directory (map view) to find certified stylists in her area.


## 3. Core Features & Requirements

### 3.1 User Authentication & Onboarding

#### 3.1.1 Account Creation
- Email/Password Registration: Standard email and password registration with email
verification.
- Social Login: Sign in with Apple (required for iOS) or Google authentication.
- Passwordless Option: Magic link authentication via email for reduced friction.
- Profile Information: Name, email, profile photo, salon name (optional), years of
experience, location (for directory).

#### 3.1.2 Onboarding Flow
1. **Welcome Screen**: Brief introduction to Ray and The Bob Company brand.

2. **User Type Selection**: Users select their profile type to customize the experience:
   - **Salon Owner**: "Looking to grow the skills of your team" → Routes to salon dashboard with team management
   - **Individual Stylist**: "Looking to grow your business" → Routes to standard learning experience
   - **Client/Customer**: "Looking to get your hair done" → Routes to directory-only view (no education content, no community)

3. **Skill Assessment** (Stylists only): Detailed assessment to gauge current level and personalize content recommendations.

4. **Pop-up Tour**: Guided walkthrough of key app features based on selected user type.

5. **Free Content Preview** (Stylists only): Highlight available free content to demonstrate value.

6. **Notification Permissions**: Request push notification opt-in with clear value proposition.

7. **Home Screen**: Land on personalized home screen based on user type.

### 3.2 Freemium Model & Content Access

#### 3.2.1 Free Tier (Freemium)
Users who download the app receive immediate access to free content without payment:

- 5-10 introductory videos showcasing Ray's teaching style and methodology
- Preview clips from premium modules (first 2 minutes of select videos)
- Full community access (view, post, comment, react)
- Access to live event calendar and ticket purchasing
- Public stylist directory (view-only, cannot be listed)
- Push notifications for new content and live events

**Note:** Client/Customer users only get directory access (no community, no education content).

#### 3.2.2 Individual Stylist Tiers

| Feature | Free | Signature ($69/mo) | Studio ($149/mo) |
| :--- | :--- | :--- | :--- |
| Intro Videos | ✓ | ✓ | ✓ |
| Community Access | ✓ | ✓ | ✓ |
| Core Curriculum & Vault | - | ✓ | ✓ |
| Monthly Live Workshop | - | ✓ | ✓ |
| Celebrity Cut Breakdown | - | ✓ | ✓ |
| Weekly "Ask Ray" Live | - | - | ✓ |
| Demand (Business/Pricing Content) | - | - | ✓ |
| Studio-Only Replays | - | - | ✓ |
| Reserved Seats at Live Events | - | - | ✓ |
| Directory Listing | - | ✓ | ✓ |
| Certification Eligible | - | ✓ ($297 upsell) | ✓ ($297 upsell) |
| Community Badge | - | "Signature" | "Studio" |

**Certification ($297 one-time upsell)**:
- 4-week live cohort with Ray (quarterly)
- Starts with "The Bob" certification
- Future certifications: Pixie, Shag
- Adds "Certified" badge to profile and community posts
- **Must maintain active subscription to stay listed in directory**

#### 3.2.3 Salon Owner Tiers

| Feature | Salon ($150/mo or $997/year) |
| :--- | :--- |
| Full Course Access | ✓ All Signature + Studio content |
| Team Seats | 5 included (can shuffle members) |
| Team Progress Dashboard | ✓ Monitor all stylists |
| Admin Management | ✓ Add/remove team members |
| Certification Discount | ~30% off per stylist certification |
| Reserved Event Seats | ✓ For team |
| Priority Support | ✓ |

**Salon Value Proposition**: Individual pricing for 5 stylists would cost ~$4,485/year (5 × $69 × 12 + certifications). Salon plan offers significant savings.

**Additional Seats**: Salons can add seats beyond 5 at discounted per-seat rate.

#### 3.2.4 Upgrade Triggers & Gating
Strategic placement of upgrade prompts to maximize conversion:

- **Hard Gate**: Core curriculum, vault, and live workshops require Signature+ subscription.
- **Soft Paywall**: When viewing locked content, show preview with 'Subscribe to Watch Full Video' overlay.
- **Progress Milestone**: After completing 3 free videos, prompt: 'You're making great progress! Unlock 150+ more videos.'
- **Feature Gate**: When attempting to access certifications, directory listing, or Studio content.
- **Tier Upsell**: Signature users see value proposition for Studio tier when accessing locked Studio content.
- **Certification Upsell**: After completing core modules, prompt certification purchase with clear value proposition.
- **Time-Limited Offers**: Push notification with limited-time discount for engaged free users.

#### 3.2.5 Cancellation Flow & Retention
When users attempt to cancel their subscription:

1. **Exit Survey**: Ask reason for cancellation (price, not using, found alternative, other)
2. **Directory Warning**: "You will be removed from the Certified Stylist Directory"
3. **Retention Offer**: Offer 2-3 months free to stay (configurable by admin)
4. **Confirm Cancellation**: If declined, process cancellation with access until period end

**Churn Reduction Tactics**:
- Directory removal creates friction for certified stylists who rely on client discovery
- Retention offers give users time to re-engage
- Exit survey data informs product improvements


### 3.3 Content Library & Collections

#### 3.3.1 Content Organization
The library is organized into Modules and Collections.
- Collections: Flexible grouping of content that can be assigned directly to users to bypass paywalls (e.g., for specific promotions or workshops).
- Customizable Structure: Modules can be structured or customized per salon/client needs.
- Prerequisite Logic: Modules can have prerequisites (e.g., must complete "Basics" before "The Perfect Bob"). Toggled per module.
- Core Modules:
- Basics: Foundational cutting techniques, tool handling, client consultation
- Core Sectioning: Ray's signature sectioning methodology
- The Perfect Bob Method: Comprehensive bob cutting techniques (signature content)
- Pixie Cuts: Short hair cutting techniques and variations
- Layers & Long Hair: Layering techniques for medium to long hair
- Business & Pricing: Consultation, pricing strategies, client retention

#### 3.3.2 Video Player Requirements
- HD Streaming: Support for 720p and 1080p with adaptive bitrate based on connection.
- Playback Controls: Play/pause, scrubbing, 10-second skip, Playback Speed (0.5x-2x).
- Resume Playback: Remember position and resume from last viewed timestamp.
- Enforced Viewing: Capability to require minimum watch time before marking as complete (prevent scrubbing for certification requirements).
- Offline Viewing: Download videos for offline access (paid subscribers only). Phase 2 feature.
- Closed Captions: Auto-generated captions with manual override capability. Phase 2 feature.
- Picture-in-Picture: Support iOS/Android PiP for multitasking.

#### 3.3.3 Content Delivery Strategy
- Bite-Sized Format: Videos are 6-8 minutes each.
- Flexible Release: Modules can 'drip' content on schedules or be available all at once.
- Completion Tracking: Mark videos as complete, track module progress with visual indicators (checklists, percentage).
- Related Content: 'Up Next' suggestions.

#### 3.3.4 Lesson Structure (Rich Media)
Lessons are no longer just video. They support a rich media experience:
- Primary Media: Video (Mux streaming).
- Text Blocks: Instructional text, tips, and key takeaways.
- Inline Images: Photo diagrams or reference images.
- Attachments: Downloadable PDFs (diagrams, worksheets).


### 3.4 Subscription & Payment Management

#### 3.4.1 Payment Processing
- Primary Processor: Stripe for web/Android.
- Apple IAP: Required for iOS app.
- Pricing Adjustment: Pricing may need to be increased for iOS/Apple payments to offset 15-30% transaction fees.
- Alternative Research: Evaluate Fanbasis as potential alternative payment
processor.

#### 3.4.2 Subscription Management
- Plan Switching: Upgrade from Individual to Salon with prorated billing.
- Cancellation: Self-service cancellation with exit survey and win-back offer.
- Failed Payment Recovery: Dunning emails via GHL integration, grace period before
access revocation.
- Receipt & History: View payment history and download receipts in-app.

#### 3.4.3 Salon Owner Features
- **5 Included Seats**: Salon subscription includes 5 team member seats by default.
- **Seat Shuffling**: Can reassign seats to different team members (unlimited shuffles per year).
- **Staff Access Codes**: Generate unique invite codes for team members.
- **Team Management**: View list of active staff, revoke access, resend invites.
- **Detailed Analytics**: Monitor stylist engagement, video completion percentages, and module progress dashboards.
- **Billing Consolidation**: Single invoice for salon owner covering all staff access.
- **Certification Discounts**: Team members get ~30% off certification purchases.
- **Additional Seats**: Can purchase extra seats beyond 5 at discounted rate.

**Salon Dashboard Features**:
- Quick action: "Book a Live Event with Ray" button
- Team certification status overview
- Aggregate team progress metrics

### 3.5 Certification Program

#### 3.5.1 Certification Overview
Certifications are premium add-ons that validate mastery of specific methods through a live cohort experience.
"This stylist is certified and approved by Ray in his methods - he has confidence to endorse them."

#### 3.5.2 Distinct Certification Models
- **Distinct Types**: Multiple certification types (The Bob, The Pixie, The Shag).
- **Initial Focus**: The Bob Certification. Future expansion to Pixie and Shag as upsells.
- **Pricing**: $297 per certification (individual stylists). Salon teams get ~30% discount.
- **Cohort Model**: Certifications run as quarterly 4-week live intensives.
- **Physical Fulfillment**: Automation to generate and ship physical materials (certificates, rewards) upon completion.

#### 3.5.3 Certification Process (Cohort-Based)
1. **Prerequisites**: Must have active Signature or Studio subscription.
2. **Purchase Certification**: One-time payment of $297 via in-app purchase.
3. **Register for Cohort**: Select upcoming quarterly cohort (4-week intensive).
4. **Live Sessions**: 90-minute live sessions every Monday for 4 weeks with Ray.
5. **Work Through Syllabus**: Complete certification curriculum during cohort.
6. **Test Out**: Demonstrate technique at end of 4 weeks.
7. **Certificate & Badge**: Digital certificate, in-app badge, and directory listing eligibility.
8. **Resubmission**: One free resubmission allowed if initially not passed.

**Cohort Schedule**: Certifications offered quarterly (4 cohorts per year).

#### 3.5.4 Certification Benefits
- Downloadable digital certificate (PDF)
- Profile badge visible to other users
- Listing in public stylist directory
- Certificate verification via unique URL/QR code
- Access to certified-only community features (Phase 2)

#### 3.5.5 Implementation Decisions
- Video Storage: Supabase Storage for submission videos (cost-effective for review)
- Review Workflow: Configurable via admin toggle (can enable/disable)
- Module Requirements: Admin can select which modules are required for eligibility


### 3.6 Live Events & Workshops

#### 3.6.1 Event Types
- Live Virtual Sessions: Real-time haircut demonstrations streamed within the app.
- In-Person Workshops: Hands-on classes in physical locations.
- Certification Bootcamps: Intensive in-person training leading to certification.

#### 3.6.2 Event Discovery & Registration
- Event Calendar: Browse upcoming events with filters (type, location, date).
- Event Details: Description, instructor, location/platform, date/time, price, capacity.
- Preview Videos: Short preview clips for in-person workshops showing what to
expect.
- In-App Ticket Purchase/Registration: Seamless checkout with Stripe integration.
- Member Discounts: Automatic discount application for subscribers (10-15%).

#### 3.6.3 Ticket Management
- Digital Tickets: PDF tickets with QR code for check-in at in-person events.
- Apple Wallet / Google Wallet: Add tickets to native wallet apps.
- Email Confirmation: Triggered via Go High Level integration.
- My Tickets: View purchased tickets and event history in profile.

#### 3.6.4 Live Event Features
- Timings: Events now support specific Start and End times.
- Virtual Events: Zooom integration with automated link delivery upon ticket purchase.
- Calendar: Dedicated event calendar view with preview videos.
- Discounts: Automated member discount recognition at checkout.
- Push Notifications: Reminder 1 week before, 24 hours before, and 1 hour before.
- Live Chat: Real-time Q&A during virtual sessions.
- Recording Access: Ticket holders get replay access for 30 days after event.
- Certification Upsell: Prompt attendees to pursue certification after workshop
completion.


### 3.7 Certified Stylist Directory

#### 3.7.1 Purpose
The stylist directory creates a public-facing feature allowing clients (end consumers) to find
Ray-certified stylists in their area. This adds tangible value to certification and creates
network effects that benefit both stylists and Ray's brand.

**Directory Listing Requirements**:
- Must have active Signature, Studio, or Salon subscription
- Certified stylists get "Certified" badge on their listing
- **Listing automatically removed if subscription lapses** (key churn reduction feature)
- This validates that listed stylists have continuing education access

#### 3.7.2 Directory Features (Public View)
- Map View: Interactive map with pins showing certified stylists nationwide (Mapbox).
- List View: Card-based grid of certified stylists with search/filter.
- Search & Filter: Search by location or stylist name.
- Stylist Profiles: Photo, bio, salon name/location, contact info, Instagram, booking link.
- Verification Badge: Visual "Ray-Certified" badge indicator.
- Portfolio: Optional gallery of work photos. Phase 2 feature.

#### 3.7.3 Stylist Profile Management
- Profile Creation: Certified stylists create their profile from the mobile app.
- Opt-In/Opt-Out: Stylists choose whether to be listed publicly (is_public toggle).
- Profile Editing: Update bio, contact info, salon details, profile photo.
- Location Settings: Set city/state/country plus coordinates for map placement.
- Social Links: Instagram handle for social proof.
- Link to External Booking: Optional link to stylist's booking system.

#### 3.7.4 Data Model
Stylist directory data stored in Supabase with the following key fields: user_id,
display_name, bio, salon_name, city, state, country, latitude, longitude,
profile_photo_url, contact_email, phone, instagram_handle, booking_url, is_public,
created_at, updated_at.

#### 3.7.5 Embeddable Directory
- Ray can embed the directory on his external websites via iframe.
- Customizable via query params: theme (light/dark), location filter.
- Responsive design for various embed sizes.

#### 3.7.6 Implementation Decisions
- Map Provider: Mapbox (50k free map loads/month).
- Profile Creation: User-initiated from mobile app (not auto-created on certification).
- Directory Features: Full map + search from initial release.


### 3.8 AI Assistant (Raybot) - [POST-LAUNCH / DEFERRED]

#### 3.8.1 Purpose
A conversational AI assistant trained on Ray's teaching style and tone, knowledge, and
methodology. The bot serves as a 24/7 learning companion that can answer questions,
provide guidance, and direct users to relevant content.

#### 3.8.2 Training & Personality
- Knowledge Base: Trained on all video transcripts, course materials, and Ray's
FAQs.
- Voice & Tone: Friendly, encouraging, and professional—matching Ray's teaching
style.
- Response Accuracy: Cite specific videos when recommending content.
- Limitations Transparency: Clearly acknowledge when question is outside scope;
suggest contacting support.

#### 3.8.3 Capabilities
- Technique Questions: Answer questions about cutting techniques, tools, products.
- Content Navigation: 'What video covers texturizing shears?' → Deep link to relevant
video.
- Learning Path Guidance: Recommend next videos based on skill level and
interests.
- Quick Tips: Provide brief technique reminders for reference during cuts.
- Certification Guidance: Explain certification requirements and process.

#### 3.8.4 Technical Implementation
- LLM Provider: OpenAI GPT-4 or Anthropic Claude (TBD based on
cost/performance).
- RAG Architecture: Retrieval-augmented generation using vector embeddings of
content.
- Conversation History: Maintain context within session; optional long-term memory.
- Usage Limits: Rate limiting to manage API costs (e.g., 50 messages/day).


### 3.9 Push Notifications

#### 3.9.1 Notification Types
| Category | Examples |
| :--- | :--- |
| New Content | New video added, new module available, monthly content drop |
| Live Events | Upcoming live session reminder, event starting now |
| Progress | Course completion, certification approved, streak reminder |
| Engagement | Weekly learning tip, personalized content recommendation |
| Account | Payment failed, subscription expiring, welcome message |
| Promotional | Limited-time discount, new certification available |

#### 3.9.2 Notification Preferences
- Cadence: Configurable triggers (1 week, 24hr, 1hr) for events.
- Quiet Hours: Users can set do-not-disturb windows.
- Frequency Caps: Backend limits to prevent notification fatigue.

#### 3.9.3 Technical Requirements
- iOS: Apple Push Notification Service (APNs)
- Android: Firebase Cloud Messaging (FCM)
- Segmentation: Send targeted notifications by subscription tier, completion status,
location.
- Analytics: Track delivery, open rates, and conversion by notification type.


### 3.10 Community Feature

#### 3.10.1 Overview
The Community feature provides a social space within the app where stylists can share their work, ask questions, exchange tips, and request feedback from peers. This feature serves as a key selling point for the app, fostering engagement and creating a sense of belonging among Bob University members.

**Key Value Propositions:**
- Peer-to-peer learning and support
- Showcase work for feedback and inspiration
- Build relationships within the stylist community
- Increase app engagement and retention

#### 3.10.2 Access & Permissions
| User Type | Capabilities |
| :--- | :--- |
| Client/Customer | No community access (directory only) |
| Free Stylists | Create posts, comment, react, report content |
| Signature Members | Same + "Signature" badge on posts |
| Studio Members | Same + "Studio" badge on posts |
| Certified Stylists | Same + "Certified" badge on posts (stacks with tier badge) |
| Admins | Full moderation capabilities |

**Badge Display**: Users can have multiple badges (e.g., "Studio + Certified"). Badges appear on all community posts and profile.

#### 3.10.3 Post Types & Categories
Posts can be assigned to categories for easy filtering:
- **Show Your Work**: Photos/videos of haircuts for inspiration
- **Questions**: Technical questions seeking advice
- **Tips & Tricks**: Sharing techniques and best practices
- **General**: Open discussion

**Feedback Request Mode:**
Posts can be marked as "Requesting Feedback" to explicitly invite constructive critique and "roast-style" feedback from the community.

#### 3.10.4 Content Support
Posts support rich media content:
- **Text**: Written content, descriptions, questions
- **Images**: Multiple photo uploads (before/after, process shots)
- **Videos**: Short video clips of techniques or results
- Storage: Supabase Storage bucket (`community-media`)
- File organization: `{user_id}/{timestamp}-{filename}`

#### 3.10.5 Engagement Features
| Feature | Description |
| :--- | :--- |
| Reactions | Multiple reaction types: ❤️ Like, 🔥 Fire, 💇 Haircut, 💡 Helpful |
| Comments | Threaded comments with reply support |
| Reporting | Users can flag inappropriate content |

#### 3.10.6 Feed & Discovery
- **Main Feed**: Chronological feed of all published posts
- **Category Filters**: Filter by category or feedback requests
- **Pull-to-Refresh**: Standard refresh pattern
- **Infinite Scroll**: Paginated loading for performance

#### 3.10.7 Moderation System
**Post-Moderation Approach:**
Content goes live immediately. Users can report violations, and admins review flagged content.

**Report Reasons:**
- Spam
- Harassment
- Inappropriate content
- Misinformation
- Other

**Admin Actions:**
- Dismiss report (content OK)
- Hide content (soft delete with reason)
- Ban user (temporary or permanent)

#### 3.10.8 Mobile App Screens
| Screen | Purpose |
| :--- | :--- |
| Community Tab | Main feed with category filters |
| Post Detail | Full post view with comments |
| Create Post | Compose new post with media |
| My Posts | User's own post history |

#### 3.10.9 Admin Dashboard
**Moderation Queue (`/community`):**
- List of reported content awaiting review
- Content preview (text, images, video playback)
- One-click approve/reject actions
- User ban management

**Community Analytics:**
- Posts per day/week/month
- Engagement metrics (reactions, comments)
- Top contributors
- Report volume and resolution rate

#### 3.10.10 Data Model
**Core Tables:**
- `community_posts`: User posts with content and media
- `community_comments`: Comments with threading support
- `community_reactions`: User reactions on posts
- `community_reports`: Flagged content for review
- `community_bans`: Banned users

**Key Fields (community_posts):**
```
id, user_id, content, media_urls (JSONB), category,
is_feedback_request, is_published, is_hidden,
likes_count, comments_count, created_at, updated_at
```

#### 3.10.11 Push Notifications
| Trigger | Notification |
| :--- | :--- |
| New comment on your post | "{Name} commented on your post" |
| New reaction on your post | "{Name} reacted to your post" |
| Your report was actioned | "Thanks for reporting. We've taken action." |

#### 3.10.12 Future Enhancements (Post-Launch)
- Follow users to see their posts in a dedicated feed
- Bookmark/save posts for later reference
- Direct messaging between community members
- Featured posts section curated by admin
- Community challenges/contests


## 4. Technical Architecture

### 4.1 System Overview
The application follows a modern mobile architecture with a React Native frontend,
Supabase backend, and key third-party integrations for payments, CRM, and AI capabilities.

### 4.2 Technology Stack
| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| Mobile Apps | React Native / Expo | Cross-platform iOS & Android |
| Database | Supabase (PostgreSQL) | User data, content metadata, analytics |
| Authentication | Supabase Auth | Email, social login, magic links |
| Video Hosting | Supabase Storage / CDN | Video files with global delivery |
| Payments | Stripe | Subscriptions, one-time purchases |
| CRM & Email | Go High Level (GHL) | Marketing automation, email campaigns |
| Push Notifications | Expo Push / FCM / APNs | Real-time notifications |
| AI/ML | OpenAI / Anthropic | AI assistant, content processing |
| Automation | n8n | Workflow orchestration |
| Analytics | Mixpanel / Amplitude | User behavior analytics |


### 4.3 Data Architecture

#### 4.3.1 Core Database Tables
- users: User accounts and profile information
- subscriptions: Subscription status, tier, billing info (synced with Stripe)
- modules: Course modules and organization
- videos: Video metadata, storage URLs, access level
- user_progress: Video completion, timestamps, module progress
- certifications: Available certifications and requirements
- user_certifications: User certification status, submissions, results
- events: Live events and workshops
- tickets: Event ticket purchases and QR codes
- stylist_profiles: Public directory listings
- staff_access_codes: Salon owner team management
- ai_conversations: Chat history with AI assistant
- community_posts: User-generated community posts
- community_comments: Comments on community posts
- community_reactions: Reactions (likes, fire, haircut, helpful)
- community_reports: Flagged content for moderation
- community_bans: Banned community users

#### 4.3.2 Row Level Security (RLS)
Supabase RLS policies will enforce data access at the database level:

- Users can only read/write their own profile and progress data
- Salon owners can view (but not modify) their staff's progress
- Video content requires active subscription (verified via subscription table)
- Stylist directory profiles are public read, owner-only write
- Admin users have elevated access for content management


### 4.4 Third-Party Integrations

#### 4.4.1 Go High Level (GHL) Integration
GHL remains the CRM and email marketing platform. The app integrates via API:

- Contact Sync: New app users automatically added as GHL contacts
- Event Triggers: App events (signup, purchase, completion) trigger GHL workflows
- Email Campaigns: Transactional and marketing emails sent via GHL
- Tags & Segments: App behavior updates GHL tags for targeted campaigns

#### 4.4.2 Stripe Integration
- Customer Creation: Stripe customer linked to app user on first purchase
- Subscription Management: Create, update, cancel subscriptions via Stripe API
- Webhooks: Listen for payment events (successful, failed, canceled)
- Payment Methods: Support cards, Apple Pay, Google Pay via Stripe Elements
- Invoicing: Automatic receipt generation and email delivery

#### 4.4.3 n8n Workflow Automation
n8n provides workflow orchestration for automated processes:

- Content Processing: New video upload → AI generates description → Slack
approval → Publish
- Email Automation: Event-triggered email drafts reviewed via Slack before sending
- Certification Review: Submission notification to Ray with video link for review
- Analytics Reports: Weekly summary reports delivered to Ray via email/Slack


## 5. Key User Flows

### 5.1 Instagram to Paid Subscriber Journey
This is the critical acquisition flow that addresses current friction:

1.​ Discovery: User sees Ray's Instagram post about a cutting technique
2.​ CTA: Post includes 'Download our free app' call-to-action
3.​ App Store: User downloads app (takes 30-60 seconds)
4.​ Quick Signup: Create account via Apple/Google sign-in (10 seconds)
5.​ Free Content: Immediately access free videos, explore app
6.​ Engagement: Watch 2-3 free videos, experience Ray's teaching style
7.​ Paywall: Attempt to access premium content, see upgrade prompt
8.​ Conversion: Subscribe via in-app purchase (Apple Pay = 2 taps)
9.​ Full Access: Instant access to all 150+ videos
Total time from Instagram to paid subscriber: 5-10 minutes

(vs. current flow: days/weeks via email warm-up sequence)

### 5.2 Video Learning Flow
1.​ User opens app → lands on Home with personalized recommendations
2.​ Navigate to Modules tab → browse by category
3.​ Select module (e.g., 'The Perfect Bob') → see lesson list with progress
4.​ Tap video → player opens with HD streaming
5.​ Watch video → auto-marks complete at 90%
6.​ 'Up Next' suggestion → continue learning or return to module

### 5.3 Certification Flow
1.​ Complete all videos in required module (e.g., Perfect Bob)
2.​ Navigate to Certifications tab → eligible certifications highlighted
3.​ Purchase certification ($297-300) via in-app checkout
4.​ Record and upload certification video (in-app camera or upload)
5.​ Submission confirmed → wait for review (5-7 business days)
6.​ Receive push notification with results
7.​ If passed: badge awarded, certificate downloadable, directory eligible
8.​ If needs work: detailed feedback provided, one free resubmission


## 6. Admin Dashboard (Web Application)

### 6.1 Overview
The Admin Dashboard is a separate web application for Ray to manage all aspects of
Bob University. It provides full control over content, users, events, certifications,
and push notifications without requiring technical knowledge.

- URL: admin.bobuniversity.com (placeholder pending confirmation)
- Technology: Next.js web application with Tailwind CSS
- Authentication: Supabase Auth with admin role verification
- Hosting: Vercel (recommended for Next.js optimization)

### 6.2 Content Management

#### 6.2.1 Video Management
- Video Upload: Direct upload to Mux via the admin interface
- Metadata Editing: Title, description, thumbnail, duration
- Draft/Publish Workflow: Videos can be saved as drafts before publishing
- Module Assignment: Assign videos to modules, set sort order
- Access Controls:
- Free tier (available to all users)
- Subscriber-only (requires active subscription)
- Drip release (unlocks X days after subscription start)
- Bulk Operations: Publish/unpublish multiple videos at once

#### 6.2.2 Module Management
- Create/Edit Modules: Title, description, thumbnail, sort order
- Draft/Publish Status: Modules can be hidden until ready
- Video Ordering: Drag-and-drop reordering of videos within modules
- Drip Configuration: Set unlock delay (days from subscription start) per module

#### 6.2.3 Drip Release System
Content unlocks based on time elapsed since user's subscription start date:
- Module-level drip: "Module 3 unlocks 30 days after subscribing"
- Video-level drip: Individual videos can have unlock delays
- Override capability: Admin can manually unlock content for specific users

### 6.3 User Management
- User Search: Find users by name, email, subscription status
- User Profile View: See full user details, subscription history, progress
- Subscription Override: Grant/revoke access, extend subscriptions, change plans
- Progress View: See any user's video completion status and engagement
- Manual Entitlement: Grant free access for promotional purposes
- Export: Download user data as CSV for external analysis

### 6.4 Certification Management

#### 6.4.1 Submission Review Queue
- Pending Submissions: List of all certification videos awaiting review
- Video Playback: Watch submitted videos directly in admin
- Approve/Reject Actions: One-click approval or rejection
- Feedback System: Provide detailed written feedback to user
- Resubmission Tracking: Track users on their second attempt

#### 6.4.2 Certification Configuration
- Create Certifications: Define new certification types
- Prerequisites: Set required module completions
- Pricing: Set one-time purchase price ($297-300 range)
- Badge Design: Upload badge images for each certification

### 6.5 Event Management

#### 6.5.1 Event Creation
- Event Types: In-person workshops, virtual sessions, certification bootcamps
- Event Details: Title, description, date/time, location, capacity, pricing
- Ticket Types: Early bird, regular, VIP tiers
- Member Discounts: Automatic percentage off for subscribers (10-15%)

#### 6.5.2 Ticketing (MVP: In-App with Stripe)
- In-App Checkout: Stripe integration for ticket purchases
- Digital Tickets: QR codes for check-in
- Attendee Management: View registrations, check-in status
- Waitlist: Automatic waitlist when capacity reached
- Note: Eventbrite integration can be evaluated post-MVP if needed

#### 6.5.3 Virtual Events (Phase 2)
- Live Streaming: Integration with streaming platform (Mux Live or similar)
- In-App Viewing: Members watch live events within the app
- Replay Access: Automatic recording available for ticket holders

### 6.6 Push Notification Center

#### 6.6.1 Global Notifications
- Send Now: Immediate push to all users or subscribers
- Schedule: Set future date/time for delivery
- Rich Content: Title, body, optional deep link to content

#### 6.6.2 Segmented Notifications
- By Subscription: Free users, Individual subscribers, Salon subscribers
- By Progress: Users who completed specific modules
- By Engagement: Inactive users (no activity in X days)
- By Certification: Certified vs non-certified users

#### 6.6.3 Automated Notifications (System-Generated)
- Welcome Series: Day 1, Day 3, Day 7 after signup
- Continue Learning: Remind users with incomplete modules
- Module Completion: Congratulate and suggest next module
- Subscription Reminders: Expiring soon, payment failed
- Event Reminders: 24 hours before, 1 hour before event
- New Content: Notify when new videos are published

### 6.7 Payment & Subscriptions Strategy (Split)
> [!WARNING]
> COMPLIANCE CRITICAL
- **Subscriptions**:
    - **iOS**: Must use **Apple In-App Purchases (IAP)** (`StoreKit`).
    - **Android**: Use **Stripe Subscriptions**.
- **One-Time Purchases** (Events, Certifications):
    - **iOS**: If considered "Digital Goods" consumed in-app (e.g. Certifications access), Apple may require IAP.
    - **Events**: Physical/Live events can use Stripe (Physical Goods/Services exception).
    - **Current Plan**: Use Stripe for Events and Certifications initially, but prepare for IAP fallback if rejected during App Store Review.

### 6.8 Analytics Dashboard - [DEFERRED TO PHASE 2]
The Analytics Dashboard now includes combined metrics for Revenue, Location, Fees, Churn, Conversion, and new user growth. *Note: Deferred until financial integrations (Apple/Stripe/Google) are fully ready.*

**Date Range Selection**
- Quick select: Today, 7 days, 30 days, 90 days, 1 year
- Custom date range picker
- Period-over-period comparison (vs previous period)
- Combined iOS + Android view with platform breakout

**Overview Dashboard (`/analytics`)**
- KPI Summary: Revenue, Active Users (MAU), New Users, Churn Rate, Conversion Rate
- Revenue trend chart (line graph)
- User growth chart (total + new users)
- Platform distribution (iOS vs Android pie chart)

**Revenue Analytics (`/analytics/revenue`)**
- Key Metrics: Total Revenue, MRR, ARPU, Refund Rate
- Revenue over time (daily/monthly trend)
- Revenue by product type (Subscription/Event/Certification)
- Revenue by platform (iOS/Apple vs Android/Stripe)
- Recent transactions table with CSV export

**User Analytics (`/analytics/users`)**
- Key Metrics: Total Users, New Users, MAU, Conversion Rate
- Active users panel: DAU, WAU, MAU with DAU/MAU stickiness ratio
- User growth chart over time
- Users by subscription plan (Free/Individual/Salon)
- Platform distribution breakdown
- Retention cohort analysis table

**Future Analytics (Phase 2)**
- Content Analytics: Watch time, video completion rates, drop-off analysis
- Event Analytics: Attendance rates, no-shows, capacity utilization
- Certification Analytics: Pass rates, revenue, time-to-certify

**Export Capabilities**
- CSV export on all data tables
- Date range filtering on all reports

### 6.8 Promo Codes & Discounts (Phase 2)
- Create Codes: Percentage or fixed amount discounts
- Usage Limits: Single use, limited uses, or unlimited
- Expiration: Set validity period
- Tracking: See redemption history and revenue impact

### 6.9 AI & Automations
- Workflows: Backend automation for content and member management.
- Future Scope: AI Chatbot (post-launch) and deeper AI integrations.


## 7. Non-Functional Requirements

### 7.1 Performance
- App Launch: Cold start under 3 seconds on modern devices
- Video Start: First frame displayed within 2 seconds of tap
- API Response: 95th percentile response time under 500ms
- Offline Capability: Core navigation available offline, graceful degradation

### 7.2 Security
- Data Encryption: TLS 1.3 for all data in transit, AES-256 at rest
- Authentication: Secure token storage, session management, 2FA support (optional)
- Video Protection: Signed URLs with expiration, prevent direct downloads
- PCI Compliance: Handled by Stripe; no card data stored locally
- Privacy: GDPR/CCPA compliant data handling, clear privacy policy

### 7.3 Scalability
- User Base: Architecture supports 10,000+ users without major changes
- Concurrent Video: CDN-backed video delivery handles traffic spikes
- Database: Supabase auto-scaling with connection pooling

### 7.4 Reliability
- Uptime Target: 99.5% availability for core app functionality
- Backup: Daily automated database backups with 30-day retention
- Monitoring: Error tracking, performance monitoring, alerting


## 8. Development Timeline

The development strategy involves two parallel workstreams: the Mobile App and the Admin Dashboard.
These will be developed concurrently where possible, with shared backend infrastructure.

### 8.1 Phase 1: Foundation (Weeks 1-5)
Goal: Launch core mobile functionality and essential admin capabilities

**Mobile App (Primary Focus)**
- User authentication (email, Apple, Google)
- Video library with Mux streaming and module organization
- Freemium content gating with drip release system
- Stripe subscription integration
- Basic push notifications
- Video progress tracking
- App Store submission

**Admin Dashboard**
- Next.js project setup with Supabase Auth
- Admin role verification and protected routes
- Video upload interface with Mux integration
- Module/video management (CRUD, ordering, draft/publish)
- Drip release configuration per video
- Basic user list view

### 8.2 Phase 2: Enhanced Features (Weeks 6-8)
Goal: Add premium features and complete admin content management

**Mobile App**
- Certification submission (video upload)
- Certification badge display
- Event listing and ticket purchase (Stripe)
- Progress tracking and streaks
- Push notification handling

**Admin Dashboard**
- Certification review queue with video playback
- Approve/reject workflow with feedback
- Event creation and management
- Stripe ticketing integration
- Push notification center (global + segmented)
- User management (view subscriptions, grant access)

### 8.3 Phase 3: Growth Features (Weeks 9-11)
Goal: Build features that create network effects and retention

**Mobile App**
- AI assistant integration
- Salon owner team management
- Stylist directory (map view, profiles)
- Offline video downloads
- Enhanced notification handling

**Admin Dashboard**
- Analytics dashboard (subscribers, revenue, engagement)
- Automated push notifications (triggers)
- Promo code management
- GHL contact sync monitoring
- n8n automation webhook configuration

### 8.4 Key Milestones
| Week | Milestone | Deliverable |
| :--- | :--- | :--- |
| Week 2 | Core App + Basic Admin | Internal mobile demo + admin login/upload |
| Week 4 | Video Library Complete | All content migrated via admin, drip configured |
| Week 5 | Admin Content Management | Full video/module CRUD, user list |
| Week 6 | MVP Complete | TestFlight/Beta + admin for Ray |
| Week 8 | App Store Launch | Public mobile app + production admin |
| Week 10 | Premium Features | Certifications, Events, Push Center |
| Week 14 | Full Platform | All features deployed, analytics live |

### 8.5 Development Priorities
The admin dashboard is critical for MVP because Ray needs to:

1. Upload and organize video content before mobile launch
2. Configure drip release schedules for existing content
3. View and manage users who sign up during soft launch
4. Send push notifications to drive engagement

Admin dashboard should reach basic functionality (video upload, module management, user list)
by Week 5 to support content migration and soft launch preparation.


## 9. Risks & Mitigations
| Risk | Impact | Mitigation | Owner |
| :--- | :--- | :--- | :--- |
| App Store Rejection | Launch delay | Follow guidelines strictly, submit early for review | FoxTrove |
| Content Migration Issues | Missing/broken videos | Thorough QA checklist, parallel running period | Joint |
| Apple IAP Requirements | 15% revenue cut | Evaluate web-based signup, reader app exemption | FoxTrove |
| User Adoption | Low downloads | Strong launch campaign, influencer promo | Ray |
| Video Hosting Costs | Higher than projected | CDN optimization, adaptive bitrate | FoxTrove |
| AI Assistant Costs | API usage exceeds budget | Usage caps, caching, cheaper model for simple queries | FoxTrove |


## 10. Success Criteria

### 10.1 Launch Success (First 30 Days)
- App approved and live on iOS App Store and Google Play
- All 150 existing videos migrated and accessible
- Existing 125 members successfully transitioned to app
- Stripe payments processing correctly
- No critical bugs blocking core functionality
- App Store rating of 4.0+ stars

### 10.2 Growth Success (First 6 Months)
- Total members reach 250+ (2x growth)
- App downloads exceed 1,000
- Free-to-paid conversion rate of 15%+
- Monthly churn rate below 7%
- 10+ certifications sold
- Successful live event sold via app

### 10.3 Long-Term Success (18-24 Months)
- Total members reach 500-600 (4-5x growth)
- MRR of $35,000+
- Stylist directory with 50+ certified stylists listed
- App becomes primary delivery mechanism (GHL web access deprecated)
- Demonstrated acquisition channel from Instagram → App → Subscription


## 11. Appendix

### 11.1 Glossary
- GHL: Go High Level - existing CRM and email marketing platform
- MRR: Monthly Recurring Revenue
- DAU/MAU: Daily Active Users / Monthly Active Users
- RLS: Row Level Security (Supabase database security)
- IAP: In-App Purchase
- CDN: Content Delivery Network
- RAG: Retrieval-Augmented Generation (AI technique)

### 11.2 Related Documents
- Statement of Work (to be prepared)
- Technical Architecture Diagram (to be prepared)

### 11.3 Open Questions
- Apple IAP vs. web-based subscription: Which approach for iOS?
- Content drip: Implement monthly unlocking or provide all content immediately?
- AI assistant: OpenAI vs. Anthropic - cost and capability comparison needed
- Offline downloads: Include in MVP or defer to Phase 2?


## 12. Revision History

| Date | Version | Description | Author |
| :--- | :--- | :--- | :--- |
| **Feb 3, 2026** | **2.2** | **New Pricing Tiers & User Types (Paige Meeting)**<br>Major pricing and user flow overhaul:<br>- **User Types:** Added 3 profile types during onboarding (Salon Owner, Individual Stylist, Client/Customer)<br>- **Individual Tiers:** Free → Signature ($69/mo) → Studio ($149/mo) with distinct feature sets<br>- **Studio Tier:** Weekly "Ask Ray" live, Demand content, studio-only replays, reserved event seats<br>- **Salon Pricing:** $150/mo or $997/year with 5 seats included, certification discounts<br>- **Certification:** $297 upsell, quarterly 4-week live cohorts, starts with Bob<br>- **Directory:** Requires active subscription to maintain listing (churn reduction)<br>- **Cancellation Flow:** Exit survey, directory warning, retention offer (2-3 months free)<br>- **Community Badges:** Tier badges (Signature, Studio, Certified) on posts<br>- **Client Profile:** Directory-only access, no community or education | FoxTrove.ai |
| **Jan 13, 2026** | **2.1** | **Community Feature**<br>Added Section 3.10 Community Feature:<br>- Social feed with posts, comments, and reactions<br>- Media support (images, videos)<br>- "Requesting Feedback" mode for peer critique<br>- Category filters (Show Your Work, Questions, Tips)<br>- Post-moderation system with admin queue<br>- Database schema (5 tables) and storage bucket | FoxTrove.ai |
| **Dec 16, 2025** | **2.0** | **Major V2 Update**<br>Integrated changes from Dec 12 & Dec 15 meetings:<br>- **Features:** Collections, Rich Media Lessons, Virtual Events, Certified Stylist Directory.<br>- **Monetization:** Defined subscription tiers, gating logic, and one-time purchases (Certifications/Events).<br>- **Admin:** Expanded analytics, event management, and notification center. | FoxTrove.ai |
| **Initial** | **1.0** | Initial Draft Release | FoxTrove.ai |


