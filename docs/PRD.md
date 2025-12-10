                                                                Bob University - Mobile App PRD




  Product Requirements Document
                      Bob University Mobile Application

                                     Version 1.0
                                 November 24, 2025
                      Prepared by FoxTrove.ai for Ray Hornback


Document Status              Draft - For Review
Project Name                 Bob University Mobile App
Client                       Ray Hornback
Development Partner          FoxTrove.ai (Kyle Rasmussen)
Target Launch                January/February 2026
Platforms                    iOS (App Store) & Android (Google Play)




                               CONFIDENTIAL | Page 1 of 22
                                                                Bob University - Mobile App PRD



1. Executive Summary
1.1 Product Vision
The Bob Company Hair Education App is a premium mobile platform designed to transform
how hairstylists learn and master cutting techniques. Built for Ray Hornback's established
hair education business, this app will serve as the primary delivery mechanism for
educational content, certifications, community building, and live event management.

The app addresses critical friction points in the current delivery and marketing system by
providing a native mobile experience that meets Gen Z stylists where they already are—on
their phones (not their emails). By implementing a freemium model with immediate access to
free content, the app creates a seamless pathway from discovery (Instagram) to
engagement (free app content) to conversion (paid subscription).

1.2 Business Objectives
   •​   Scale membership from 125 current members to 600+ members (4-5x growth)
   •​   Reduce friction in content delivery and member access
   •​   Enable freemium acquisition channel that bypasses email warm-up sequences
   •​   Increase engagement through push notifications and native mobile experience
   •​   Streamline certification and live event management
   •​   Build a client-facing stylist directory to create network effects

1.3 Success Metrics
 Metric                             Current State                 18-Month Target
 Active Members                     125                           500-600
 Monthly Recurring Revenue          ~$8,000                       $35,000+
 App Downloads (cumulative)         N/A                           2,000+
 Free-to-Paid Conversion Rate       N/A                           15-25%
 Monthly Churn Rate                 UNKNOWN                       <6%
 App Store Rating                   N/A                           4.5+ stars




                                 CONFIDENTIAL | Page 2 of 22
                                                                     Bob University - Mobile App PRD



2. Target Users & Personas
2.1 Primary Persona: The Aspiring Stylist
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

2.2 Secondary Persona: The Salon Owner
Name: Michelle, 38

Background: Owns a 5-chair salon, employs 4 junior stylists. Wants consistent training for
her team.

Goals: Upskill her entire team efficiently, ensure consistent quality across all stylists, reduce
training costs.

Pain Points: Can't afford to send everyone to in-person training, needs a scalable and easy
to access solution.

Tech Behavior: More comfortable with desktop but staff all use phones. Needs simple team
management.

2.3 Tertiary Persona: The Certification Seeker
Name: David, 30

Background: Experienced stylist looking to differentiate himself. Wants credentials to justify
premium pricing.

Goals: Get certified in Ray's methods, be listed in the stylist directory, attract clients who
want Ray's style.

Pain Points: Needs proof of skills beyond just watching videos. Needs recognition as a
business strategy.

2.4 End Consumer Persona: The Client
Name: Sarah, 35

Background: Loves Ray's Instagram content and haircut style but lives in Texas, not
Colorado.



                                   CONFIDENTIAL | Page 3 of 22
                                                                     Bob University - Mobile App PRD



Goals: Find a stylist near her who has been trained by Ray and can deliver similar results.

App Usage: Public-facing stylist directory (map view) to find certified stylists in her area.




                                   CONFIDENTIAL | Page 4 of 22
                                                                     Bob University - Mobile App PRD



3. Core Features & Requirements
3.1 User Authentication & Onboarding

3.1.1 Account Creation
    •​   Email/Password Registration: Standard email and password registration with email
         verification.
    •​   Social Login: Sign in with Apple (required for iOS) or Google authentication.
    •​   Passwordless Option: Magic link authentication via email for reduced friction.
    •​   Profile Information: Name, email, profile photo, salon name (optional), years of
         experience, location (for directory).

3.1.2 Onboarding Flow
    1.​ Welcome Screen: Brief introduction to Ray and The Bob Company brand.
    2.​ Skill Assessment: Optional 3-question quiz to personalize content
        recommendations.
    3.​ Free Content Preview: Highlight available free content to demonstrate value.
    4.​ Notification Permissions: Request push notification opt-in with clear value
        proposition.
    5.​ Home Screen: Land on personalized home screen with recommended content.

3.2 Freemium Model & Content Access

3.2.1 Free Tier (Freemium)
Users who download the app receive immediate access to free content without payment:

    •​   5-10 introductory videos showcasing Ray's teaching style and methodology
    •​   Preview clips from premium modules (first 2 minutes of select videos)
    •​   Access to live event calendar and ticket purchasing
    •​   Public stylist directory (view-only, cannot be listed)
    •​   Push notifications for new content and live events

3.2.2 Paid Subscription Tiers
 Feature                  Individual ($49/mo)                    Salon ($97/mo)
 Full Video Library       ✓ Complete access                      ✓ Complete access
 User Seats               1 user                                 Up to 5 staff members
 Staff Access Codes       N/A                                    ✓ Generate & manage codes
 Progress Tracking        ✓ Individual                           ✓ Team dashboard
 Certification Eligible   ✓ ($297-300 additional)                ✓ Per staff member
 AI Assistant             ✓ Full access                          ✓ Full access
 Event Discounts          10% off live events                    15% off live events per stylist

3.2.3 Upgrade Triggers & Paywalls
Strategic placement of upgrade prompts to maximize conversion:

    •​   Soft Paywall: When viewing locked content, show preview with 'Subscribe to Watch
         Full Video' overlay.
    •​   Progress Milestone: After completing 3 free videos, prompt: 'You're making great
         progress! Unlock 150+ more videos.'
    •​   Feature Gate: When attempting to access AI assistant or certifications as free user.
    •​   Time-Limited Offers: Push notification with limited-time discount for engaged free
         users.


                                   CONFIDENTIAL | Page 5 of 22
                              Bob University - Mobile App PRD




CONFIDENTIAL | Page 6 of 22
                                                                 Bob University - Mobile App PRD



3.3 Video Content Library

3.3.1 Content Organization
The video library consists of approximately 150 videos organized into structured modules:

   •​   Basics: Foundational cutting techniques, tool handling, client consultation
   •​   Core Sectioning: Ray's signature sectioning methodology
   •​   The Perfect Bob Method: Comprehensive bob cutting techniques (signature
        content)
   •​   Pixie Cuts: Short hair cutting techniques and variations
   •​   Layers & Long Hair: Layering techniques for medium to long hair
   •​   Men's Cutting: Male haircut techniques (future expansion)
   •​   Business & Pricing: Consultation, pricing strategies, client retention

3.3.2 Video Player Requirements
   •​   HD Streaming: Support for 720p and 1080p with adaptive bitrate based on
        connection.
   •​   Playback Controls: Play/pause, scrubbing, 10-second skip forward/back, playback
        speed (0.5x-2x).
   •​   Resume Playback: Remember position and resume from last viewed timestamp.
   •​   Offline Viewing: Download videos for offline access (paid subscribers only). Phase 2
        feature.
   •​   Closed Captions: Auto-generated captions with manual override capability. Phase 2
        feature.
   •​   Picture-in-Picture: Support iOS/Android PiP for multitasking.

3.3.3 Content Delivery Strategy
   •​   Bite-Sized Format: Videos are 6-8 minutes each, designed for busy stylists between
        clients.
   •​   Progressive Unlocking: Option to drip content monthly to encourage retention
        (configurable by admin).
   •​   Completion Tracking: Mark videos as complete, track module progress with visual
        indicators.
   •​   Related Content: 'Up Next' suggestions based on current module and viewing
        history.




                                 CONFIDENTIAL | Page 7 of 22
                                                                 Bob University - Mobile App PRD



3.4 Subscription & Payment Management

3.4.1 Payment Processing
  •​   Primary Processor: Stripe for all subscription and one-time payments.
  •​   Apple Pay / Google Pay: Native payment integrations for frictionless checkout.
  •​   In-App Purchases: For iOS, evaluate App Store IAP requirements (15% fee
       consideration).
  •​   Alternative Research: Evaluate Fanbasis as potential alternative payment
       processor.

3.4.2 Subscription Management
  •​   Plan Switching: Upgrade from Individual to Salon with prorated billing.
  •​   Cancellation: Self-service cancellation with exit survey and win-back offer.
  •​   Failed Payment Recovery: Dunning emails via GHL integration, grace period before
       access revocation.
  •​   Receipt & History: View payment history and download receipts in-app.

3.4.3 Salon Owner Features
  •​   Staff Access Codes: Generate unique invite codes for up to 5 team members.
  •​   Team Management: View list of active staff, revoke access, resend invites.
  •​   Team Progress: Dashboard showing each staff member's module completion.
  •​   Billing Consolidation: Single invoice for salon owner covering all staff access.




                                 CONFIDENTIAL | Page 8 of 22
                                                                        Bob University - Mobile App PRD



3.5 Certification Program

3.5.1 Certification Overview
Certifications are premium add-ons ($297-300 each) that validate mastery of specific
techniques and enable listing in the public stylist directory.

3.5.2 Certification Types (Initial Launch)
   •​   The Perfect Bob Certification: Mastery of Ray's signature bob cutting method.
   •​   Precision Pixie Certification: Short hair cutting expertise.
   •​   Ray-Certified Stylist (Master): Comprehensive certification covering all techniques.

3.5.3 Certification Process
   1.​ Prerequisites: Complete all videos in the relevant module with 100% completion.
   2.​ Purchase Certification: One-time payment of $297-300 via in-app purchase.
   3.​ Video Submission: Upload a video demonstrating the technique on a real client.
   4.​ Review Period: Ray reviews submission within 5-7 business days. Perhaps we don’t
       do this to reduce friction and workload?
   5.​ Priority Feedback: Chat with Ray and receive detailed feedback.
   6.​ Certificate & Badge: Digital certificate, in-app badge, and directory listing eligibility.

3.5.4 Certification Benefits
   •​   Downloadable digital certificate (PDF)
   •​   Profile badge visible to other users
   •​   Listing in public stylist directory with certification badges
   •​   Certificate verification via unique URL/QR code
   •​   Access to certified-only community features (Phase 2)




                                    CONFIDENTIAL | Page 9 of 22
                                                                    Bob University - Mobile App PRD



3.6 Live Events & Workshops

3.6.1 Event Types
   •​   Live Virtual Sessions: Real-time haircut demonstrations streamed within the app.
   •​   In-Person Workshops: Hands-on classes in physical locations.
   •​   Certification Bootcamps: Intensive in-person training leading to certification.

3.6.2 Event Discovery & Registration
   •​   Event Calendar: Browse upcoming events with filters (type, location, date).
   •​   Event Details: Description, instructor, location/platform, date/time, price, capacity.
   •​   Preview Videos: Short preview clips for in-person workshops showing what to
        expect.
   •​   In-App Ticket Purchase/Registration: Seamless checkout with Stripe integration.
   •​   Member Discounts: Automatic discount application for subscribers (10-15%).

3.6.3 Ticket Management
   •​   Digital Tickets: PDF tickets with QR code for check-in at in-person events.
   •​   Apple Wallet / Google Wallet: Add tickets to native wallet apps.
   •​   Email Confirmation: Triggered via Go High Level integration.
   •​   My Tickets: View purchased tickets and event history in profile.

3.6.4 Live Event Features
   •​   Push Notifications: Reminder 24 hours before, 1 hour before, and at event start.
   •​   Live Chat: Real-time Q&A during virtual sessions.
   •​   Recording Access: Ticket holders get replay access for 30 days after event.
   •​   Certification Upsell: Prompt attendees to pursue certification after workshop
        completion.




                                  CONFIDENTIAL | Page 10 of 22
                                                                     Bob University - Mobile App PRD



3.7 Certified Stylist Directory

3.7.1 Purpose
The stylist directory creates a public-facing feature allowing clients (end consumers) to find
Ray-certified stylists in their area. This adds tangible value to certification and creates
network effects that benefit both stylists and Ray's brand.

3.7.2 Directory Features (Public View)
   •​   Map View: Interactive map with pins showing certified stylists nationwide.
   •​   Search & Filter: Search by location, certification type, or stylist name.
   •​   Stylist Profiles: Photo, bio, certifications held, salon name/location, contact info.
   •​   Verification Badges: Visual indicators of certification status and level.
   •​   Portfolio: Optional gallery of work photos. Phase 2 feature.

3.7.3 Stylist Profile Management
   •​   Opt-In/Opt-Out: Certified stylists choose whether to be listed publicly.
   •​   Profile Editing: Update bio, contact info, salon details, profile photo.
   •​   Location Settings: Set service area (city/region, not exact address).
   •​   Link to External Booking: Optional link to stylist's booking system.

3.7.4 Data Model
Stylist directory data stored in Supabase with the following key fields: user_id,
display_name, bio, salon_name, city, state, country, latitude, longitude, certifications (array),
profile_photo_url, contact_email, booking_url, is_public, created_at, updated_at.




                                   CONFIDENTIAL | Page 11 of 22
                                                                Bob University - Mobile App PRD



3.8 AI Assistant (Raybot)

3.8.1 Purpose
A conversational AI assistant trained on Ray's teaching style and tone, knowledge, and
methodology. The bot serves as a 24/7 learning companion that can answer questions,
provide guidance, and direct users to relevant content.

3.8.2 Training & Personality
   •​   Knowledge Base: Trained on all video transcripts, course materials, and Ray's
        FAQs.
   •​   Voice & Tone: Friendly, encouraging, and professional—matching Ray's teaching
        style.
   •​   Response Accuracy: Cite specific videos when recommending content.
   •​   Limitations Transparency: Clearly acknowledge when question is outside scope;
        suggest contacting support.

3.8.3 Capabilities
   •​   Technique Questions: Answer questions about cutting techniques, tools, products.
   •​   Content Navigation: 'What video covers texturizing shears?' → Deep link to relevant
        video.
   •​   Learning Path Guidance: Recommend next videos based on skill level and
        interests.
   •​   Quick Tips: Provide brief technique reminders for reference during cuts.
   •​   Certification Guidance: Explain certification requirements and process.

3.8.4 Technical Implementation
   •​   LLM Provider: OpenAI GPT-4 or Anthropic Claude (TBD based on
        cost/performance).
   •​   RAG Architecture: Retrieval-augmented generation using vector embeddings of
        content.
   •​   Conversation History: Maintain context within session; optional long-term memory.
   •​   Usage Limits: Rate limiting to manage API costs (e.g., 50 messages/day).




                                 CONFIDENTIAL | Page 12 of 22
                                                                  Bob University - Mobile App PRD



3.9 Push Notifications

3.9.1 Notification Types
 Category                     Examples
 New Content                  New video added, new module available, monthly content drop
 Live Events                  Upcoming live session reminder, event starting now
 Progress                     Course completion, certification approved, streak reminder
 Engagement                   Weekly learning tip, personalized content recommendation
 Account                      Payment failed, subscription expiring, welcome message
 Promotional                  Limited-time discount, new certification available

3.9.2 Notification Preferences
   •​   Granular Controls: Users can enable/disable each notification category.
   •​   Quiet Hours: Set do-not-disturb windows.
   •​   Frequency Caps: Backend limits to prevent notification fatigue.

3.9.3 Technical Requirements
   •​   iOS: Apple Push Notification Service (APNs)
   •​   Android: Firebase Cloud Messaging (FCM)
   •​   Segmentation: Send targeted notifications by subscription tier, completion status,
        location.
   •​   Analytics: Track delivery, open rates, and conversion by notification type.




                                 CONFIDENTIAL | Page 13 of 22
                                                                     Bob University - Mobile App PRD



4. Technical Architecture
4.1 System Overview
The application follows a modern mobile architecture with a React Native frontend,
Supabase backend, and key third-party integrations for payments, CRM, and AI capabilities.

4.2 Technology Stack
 Layer                         Technology                          Purpose
 Mobile Apps                   React Native / Expo                 Cross-platform iOS & Android
 Database                      Supabase (PostgreSQL)               User data, content metadata,
                                                                   analytics
 Authentication                Supabase Auth                       Email, social login, magic links
 Video Hosting                 Supabase Storage / CDN              Video files with global delivery
 Payments                      Stripe                              Subscriptions, one-time
                                                                   purchases
 CRM & Email                   Go High Level (GHL)                 Marketing automation, email
                                                                   campaigns
 Push Notifications            Expo Push / FCM / APNs              Real-time notifications
 AI/ML                         OpenAI / Anthropic                  AI assistant, content processing
 Automation                    n8n                                 Workflow orchestration
 Analytics                     Mixpanel / Amplitude                User behavior analytics


4.3 Data Architecture

4.3.1 Core Database Tables
   •​   users: User accounts and profile information
   •​   subscriptions: Subscription status, tier, billing info (synced with Stripe)
   •​   modules: Course modules and organization
   •​   videos: Video metadata, storage URLs, access level
   •​   user_progress: Video completion, timestamps, module progress
   •​   certifications: Available certifications and requirements
   •​   user_certifications: User certification status, submissions, results
   •​   events: Live events and workshops
   •​   tickets: Event ticket purchases and QR codes
   •​   stylist_profiles: Public directory listings
   •​   staff_access_codes: Salon owner team management
   •​   ai_conversations: Chat history with AI assistant

4.3.2 Row Level Security (RLS)
Supabase RLS policies will enforce data access at the database level:

   •​   Users can only read/write their own profile and progress data
   •​   Salon owners can view (but not modify) their staff's progress
   •​   Video content requires active subscription (verified via subscription table)
   •​   Stylist directory profiles are public read, owner-only write
   •​   Admin users have elevated access for content management




                                   CONFIDENTIAL | Page 14 of 22
                                                               Bob University - Mobile App PRD



4.4 Third-Party Integrations

4.4.1 Go High Level (GHL) Integration
GHL remains the CRM and email marketing platform. The app integrates via API:

   •​   Contact Sync: New app users automatically added as GHL contacts
   •​   Event Triggers: App events (signup, purchase, completion) trigger GHL workflows
   •​   Email Campaigns: Transactional and marketing emails sent via GHL
   •​   Tags & Segments: App behavior updates GHL tags for targeted campaigns

4.4.2 Stripe Integration
   •​   Customer Creation: Stripe customer linked to app user on first purchase
   •​   Subscription Management: Create, update, cancel subscriptions via Stripe API
   •​   Webhooks: Listen for payment events (successful, failed, canceled)
   •​   Payment Methods: Support cards, Apple Pay, Google Pay via Stripe Elements
   •​   Invoicing: Automatic receipt generation and email delivery

4.4.3 n8n Workflow Automation
n8n provides workflow orchestration for automated processes:

   •​   Content Processing: New video upload → AI generates description → Slack
        approval → Publish
   •​   Email Automation: Event-triggered email drafts reviewed via Slack before sending
   •​   Certification Review: Submission notification to Ray with video link for review
   •​   Analytics Reports: Weekly summary reports delivered to Ray via email/Slack




                                CONFIDENTIAL | Page 15 of 22
                                                                         Bob University - Mobile App PRD



5. Key User Flows
5.1 Instagram to Paid Subscriber Journey
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

5.2 Video Learning Flow
    1.​ User opens app → lands on Home with personalized recommendations
    2.​ Navigate to Modules tab → browse by category
    3.​ Select module (e.g., 'The Perfect Bob') → see lesson list with progress
    4.​ Tap video → player opens with HD streaming
    5.​ Watch video → auto-marks complete at 90%
    6.​ 'Up Next' suggestion → continue learning or return to module

5.3 Certification Flow
    1.​ Complete all videos in required module (e.g., Perfect Bob)
    2.​ Navigate to Certifications tab → eligible certifications highlighted
    3.​ Purchase certification ($297-300) via in-app checkout
    4.​ Record and upload certification video (in-app camera or upload)
    5.​ Submission confirmed → wait for review (5-7 business days)
    6.​ Receive push notification with results
    7.​ If passed: badge awarded, certificate downloadable, directory eligible
    8.​ If needs work: detailed feedback provided, one free resubmission




                                    CONFIDENTIAL | Page 16 of 22
                                                               Bob University - Mobile App PRD



6. Admin Dashboard (Web Application)

6.1 Overview
The Admin Dashboard is a separate web application for Ray to manage all aspects of
Bob University. It provides full control over content, users, events, certifications,
and push notifications without requiring technical knowledge.

   •   URL: admin.bobuniversity.com (placeholder pending confirmation)
   •   Technology: Next.js web application with Tailwind CSS
   •   Authentication: Supabase Auth with admin role verification
   •   Hosting: Vercel (recommended for Next.js optimization)

6.2 Content Management

6.2.1 Video Management
   •   Video Upload: Direct upload to Mux via the admin interface
   •   Metadata Editing: Title, description, thumbnail, duration
   •   Draft/Publish Workflow: Videos can be saved as drafts before publishing
   •   Module Assignment: Assign videos to modules, set sort order
   •   Access Controls:
       - Free tier (available to all users)
       - Subscriber-only (requires active subscription)
       - Drip release (unlocks X days after subscription start)
   •   Bulk Operations: Publish/unpublish multiple videos at once

6.2.2 Module Management
   •   Create/Edit Modules: Title, description, thumbnail, sort order
   •   Draft/Publish Status: Modules can be hidden until ready
   •   Video Ordering: Drag-and-drop reordering of videos within modules
   •   Drip Configuration: Set unlock delay (days from subscription start) per module

6.2.3 Drip Release System
Content unlocks based on time elapsed since user's subscription start date:
   •   Module-level drip: "Module 3 unlocks 30 days after subscribing"
   •   Video-level drip: Individual videos can have unlock delays
   •   Override capability: Admin can manually unlock content for specific users

6.3 User Management
   •   User Search: Find users by name, email, subscription status
   •   User Profile View: See full user details, subscription history, progress
   •   Subscription Override: Grant/revoke access, extend subscriptions, change plans
   •   Progress View: See any user's video completion status and engagement
   •   Manual Entitlement: Grant free access for promotional purposes
   •   Export: Download user data as CSV for external analysis

6.4 Certification Management

6.4.1 Submission Review Queue
   •   Pending Submissions: List of all certification videos awaiting review
   •   Video Playback: Watch submitted videos directly in admin
   •   Approve/Reject Actions: One-click approval or rejection
   •   Feedback System: Provide detailed written feedback to user
   •   Resubmission Tracking: Track users on their second attempt

6.4.2 Certification Configuration
   •   Create Certifications: Define new certification types
   •   Prerequisites: Set required module completions
   •   Pricing: Set one-time purchase price ($297-300 range)
   •   Badge Design: Upload badge images for each certification

6.5 Event Management

6.5.1 Event Creation
   •   Event Types: In-person workshops, virtual sessions, certification bootcamps
   •   Event Details: Title, description, date/time, location, capacity, pricing
   •   Ticket Types: Early bird, regular, VIP tiers
   •   Member Discounts: Automatic percentage off for subscribers (10-15%)

6.5.2 Ticketing (MVP: In-App with Stripe)
   •   In-App Checkout: Stripe integration for ticket purchases
   •   Digital Tickets: QR codes for check-in
   •   Attendee Management: View registrations, check-in status
   •   Waitlist: Automatic waitlist when capacity reached
   •   Note: Eventbrite integration can be evaluated post-MVP if needed

6.5.3 Virtual Events (Phase 2)
   •   Live Streaming: Integration with streaming platform (Mux Live or similar)
   •   In-App Viewing: Members watch live events within the app
   •   Replay Access: Automatic recording available for ticket holders

6.6 Push Notification Center

6.6.1 Global Notifications
   •   Send Now: Immediate push to all users or subscribers
   •   Schedule: Set future date/time for delivery
   •   Rich Content: Title, body, optional deep link to content

6.6.2 Segmented Notifications
   •   By Subscription: Free users, Individual subscribers, Salon subscribers
   •   By Progress: Users who completed specific modules
   •   By Engagement: Inactive users (no activity in X days)
   •   By Certification: Certified vs non-certified users

6.6.3 Automated Notifications (System-Generated)
   •   Welcome Series: Day 1, Day 3, Day 7 after signup
   •   Continue Learning: Remind users with incomplete modules
   •   Module Completion: Congratulate and suggest next module
   •   Subscription Reminders: Expiring soon, payment failed
   •   Event Reminders: 24 hours before, 1 hour before event
   •   New Content: Notify when new videos are published

6.7 Analytics Dashboard
   •   Key Metrics: Active users, MRR, churn rate, free-to-paid conversion
   •   Content Performance: Most-watched videos, completion rates by module
   •   Acquisition: Downloads, signups, conversion funnel
   •   Engagement: DAU/MAU, session duration, retention curves
   •   Revenue: Subscription revenue, certification sales, event revenue
   •   Export: Download reports as CSV/PDF

6.8 Promo Codes & Discounts (Phase 2)
   •   Create Codes: Percentage or fixed amount discounts
   •   Usage Limits: Single use, limited uses, or unlimited
   •   Expiration: Set validity period
   •   Tracking: See redemption history and revenue impact




                               CONFIDENTIAL | Page 17 of 22
                                                                   Bob University - Mobile App PRD



7. Non-Functional Requirements
7.1 Performance
   •​   App Launch: Cold start under 3 seconds on modern devices
   •​   Video Start: First frame displayed within 2 seconds of tap
   •​   API Response: 95th percentile response time under 500ms
   •​   Offline Capability: Core navigation available offline, graceful degradation

7.2 Security
   •​   Data Encryption: TLS 1.3 for all data in transit, AES-256 at rest
   •​   Authentication: Secure token storage, session management, 2FA support (optional)
   •​   Video Protection: Signed URLs with expiration, prevent direct downloads
   •​   PCI Compliance: Handled by Stripe; no card data stored locally
   •​   Privacy: GDPR/CCPA compliant data handling, clear privacy policy

7.3 Scalability
   •​   User Base: Architecture supports 10,000+ users without major changes
   •​   Concurrent Video: CDN-backed video delivery handles traffic spikes
   •​   Database: Supabase auto-scaling with connection pooling

7.4 Reliability
   •​   Uptime Target: 99.5% availability for core app functionality
   •​   Backup: Daily automated database backups with 30-day retention
   •​   Monitoring: Error tracking, performance monitoring, alerting




                                  CONFIDENTIAL | Page 18 of 22
                                                                  Bob University - Mobile App PRD



8. Development Timeline

The development strategy involves two parallel workstreams: the Mobile App and the Admin Dashboard.
These will be developed concurrently where possible, with shared backend infrastructure.

8.1 Phase 1: Foundation (Weeks 1-5)
Goal: Launch core mobile functionality and essential admin capabilities

**Mobile App (Primary Focus)**
   •​   User authentication (email, Apple, Google)
   •​   Video library with Mux streaming and module organization
   •​   Freemium content gating with drip release system
   •​   Stripe subscription integration
   •​   Basic push notifications
   •​   Video progress tracking
   •​   App Store submission

**Admin Dashboard**
   •​   Next.js project setup with Supabase Auth
   •​   Admin role verification and protected routes
   •​   Video upload interface with Mux integration
   •​   Module/video management (CRUD, ordering, draft/publish)
   •​   Drip release configuration per video
   •​   Basic user list view

8.2 Phase 2: Enhanced Features (Weeks 6-8)
Goal: Add premium features and complete admin content management

**Mobile App**
   •​   Certification submission (video upload)
   •​   Certification badge display
   •​   Event listing and ticket purchase (Stripe)
   •​   Progress tracking and streaks
   •​   Push notification handling

**Admin Dashboard**
   •​   Certification review queue with video playback
   •​   Approve/reject workflow with feedback
   •​   Event creation and management
   •​   Stripe ticketing integration
   •​   Push notification center (global + segmented)
   •​   User management (view subscriptions, grant access)

8.3 Phase 3: Growth Features (Weeks 9-11)
Goal: Build features that create network effects and retention

**Mobile App**
   •​   AI assistant integration
   •​   Salon owner team management
   •​   Stylist directory (map view, profiles)
   •​   Offline video downloads
   •​   Enhanced notification handling

**Admin Dashboard**
   •​   Analytics dashboard (subscribers, revenue, engagement)
   •​   Automated push notifications (triggers)
   •​   Promo code management
   •​   GHL contact sync monitoring
   •​   n8n automation webhook configuration

8.4 Key Milestones
 Week    Milestone                              Deliverable
 Week 2  Core App + Basic Admin                 Internal mobile demo + admin login/upload
 Week 4  Video Library Complete                 All content migrated via admin, drip configured
 Week 5  Admin Content Management               Full video/module CRUD, user list
 Week 6  MVP Complete                           TestFlight/Beta + admin for Ray
 Week 8  App Store Launch                       Public mobile app + production admin
 Week 10 Premium Features                       Certifications, Events, Push Center
 Week 14 Full Platform                          All features deployed, analytics live

8.5 Development Priorities
The admin dashboard is critical for MVP because Ray needs to:
1. Upload and organize video content before mobile launch
2. Configure drip release schedules for existing content
3. View and manage users who sign up during soft launch
4. Send push notifications to drive engagement

Admin dashboard should reach basic functionality (video upload, module management, user list)
by Week 5 to support content migration and soft launch preparation.




                                   CONFIDENTIAL | Page 19 of 22
                                                                    Bob University - Mobile App PRD



9. Risks & Mitigations
Risk                       Impact                   Mitigation                   Owner
App Store Rejection        Launch delay             Follow guidelines            FoxTrove
                                                    strictly, submit early for
                                                    review
Content Migration Issues   Missing/broken videos    Thorough QA checklist,       Joint
                                                    parallel running period
Apple IAP Requirements     15% revenue cut          Evaluate web-based           FoxTrove
                                                    signup, reader app
                                                    exemption
User Adoption              Low downloads            Strong launch                Ray
                                                    campaign, influencer
                                                    promo
Video Hosting Costs        Higher than projected    CDN optimization,            FoxTrove
                                                    adaptive bitrate
AI Assistant Costs         API usage exceeds        Usage caps, caching,         FoxTrove
                           budget                   cheaper model for
                                                    simple queries




                                 CONFIDENTIAL | Page 20 of 22
                                                                Bob University - Mobile App PRD



10. Success Criteria
10.1 Launch Success (First 30 Days)
  •​   App approved and live on iOS App Store and Google Play
  •​   All 150 existing videos migrated and accessible
  •​   Existing 125 members successfully transitioned to app
  •​   Stripe payments processing correctly
  •​   No critical bugs blocking core functionality
  •​   App Store rating of 4.0+ stars

10.2 Growth Success (First 6 Months)
  •​   Total members reach 250+ (2x growth)
  •​   App downloads exceed 1,000
  •​   Free-to-paid conversion rate of 15%+
  •​   Monthly churn rate below 7%
  •​   10+ certifications sold
  •​   Successful live event sold via app

10.3 Long-Term Success (18-24 Months)
  •​   Total members reach 500-600 (4-5x growth)
  •​   MRR of $35,000+
  •​   Stylist directory with 50+ certified stylists listed
  •​   App becomes primary delivery mechanism (GHL web access deprecated)
  •​   Demonstrated acquisition channel from Instagram → App → Subscription




                              CONFIDENTIAL | Page 21 of 22
                                                                Bob University - Mobile App PRD



11. Appendix
11.1 Glossary
  •​   GHL: Go High Level - existing CRM and email marketing platform
  •​   MRR: Monthly Recurring Revenue
  •​   DAU/MAU: Daily Active Users / Monthly Active Users
  •​   RLS: Row Level Security (Supabase database security)
  •​   IAP: In-App Purchase
  •​   CDN: Content Delivery Network
  •​   RAG: Retrieval-Augmented Generation (AI technique)

11.2 Related Documents
  •​   Statement of Work (to be prepared)
  •​   Technical Architecture Diagram (to be prepared)

11.3 Open Questions
  •​   Apple IAP vs. web-based subscription: Which approach for iOS?
  •​   Fanbasis evaluation: Proceed with research as alternative to Stripe?
  •​   Content drip: Implement monthly unlocking or provide all content immediately?
  •​   AI assistant: OpenAI vs. Anthropic - cost and capability comparison needed
  •​   Offline downloads: Include in MVP or defer to Phase 2?




                                CONFIDENTIAL | Page 22 of 22
