# Bob University - Implementation Plan

**Purpose**: Step-by-step implementation guide for Claude Code with MCP (Supabase & Stripe) access.
**Reference**: See `LAUNCH_AUDIT.md` for detailed gap analysis against PRD v2.1.

---

## Phase 1: Critical Database Migrations

These migrations are blocking - the app will crash without them.

### 1.1 Create `notification_preferences` Table

**Why**: `useNotificationPreferences` hook and notifications screen expect this table.

```sql
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Push notification preferences
  push_new_content BOOLEAN DEFAULT true,
  push_event_reminders BOOLEAN DEFAULT true,
  push_community_activity BOOLEAN DEFAULT true,
  push_account_alerts BOOLEAN DEFAULT true,

  -- Email preferences
  email_new_content BOOLEAN DEFAULT true,
  email_event_reminders BOOLEAN DEFAULT true,
  email_weekly_digest BOOLEAN DEFAULT true,
  email_marketing BOOLEAN DEFAULT false,

  -- Settings
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(user_id)
);

-- RLS policies
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 1.2 Create `email_logs` Table

**Why**: `send-email` edge function logs all sent emails here.

```sql
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT,
  status TEXT DEFAULT 'sent', -- sent, failed, bounced
  resend_id TEXT, -- ID from Resend API
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for querying by user
CREATE INDEX idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX idx_email_logs_email_type ON email_logs(email_type);
CREATE INDEX idx_email_logs_created_at ON email_logs(created_at DESC);

-- RLS policies
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own email logs"
  ON email_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert"
  ON email_logs FOR INSERT
  WITH CHECK (true); -- Edge functions use service role
```

### 1.3 Create `community_reports` Table

**Why**: PRD 3.10.7 requires content flagging system.

```sql
CREATE TABLE community_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- What's being reported (one of these will be set)
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES community_comments(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  reason TEXT NOT NULL, -- spam, harassment, inappropriate, other
  description TEXT,

  status TEXT DEFAULT 'pending', -- pending, reviewed, dismissed, actioned
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),

  -- Prevent duplicate reports
  UNIQUE(reporter_id, post_id),
  UNIQUE(reporter_id, comment_id),

  -- Ensure at least one target is set
  CONSTRAINT report_has_target CHECK (
    post_id IS NOT NULL OR comment_id IS NOT NULL OR reported_user_id IS NOT NULL
  )
);

-- Indexes
CREATE INDEX idx_community_reports_status ON community_reports(status);
CREATE INDEX idx_community_reports_post_id ON community_reports(post_id);
CREATE INDEX idx_community_reports_comment_id ON community_reports(comment_id);

-- RLS
ALTER TABLE community_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports"
  ON community_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view own reports"
  ON community_reports FOR SELECT
  USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports"
  ON community_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update reports"
  ON community_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### 1.4 Create `community_bans` Table

**Why**: PRD 3.10.7 requires user ban management.

```sql
CREATE TABLE community_bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  banned_by UUID NOT NULL REFERENCES auth.users(id),

  ban_type TEXT NOT NULL, -- temporary, permanent
  reason TEXT NOT NULL,

  starts_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ, -- NULL for permanent bans

  is_active BOOLEAN DEFAULT true,
  lifted_by UUID REFERENCES auth.users(id),
  lifted_at TIMESTAMPTZ,
  lift_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_community_bans_user_id ON community_bans(user_id);
CREATE INDEX idx_community_bans_is_active ON community_bans(is_active);

-- RLS
ALTER TABLE community_bans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bans"
  ON community_bans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage bans"
  ON community_bans FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Helper function to check if user is banned
CREATE OR REPLACE FUNCTION is_user_banned(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM community_bans
    WHERE user_id = check_user_id
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Phase 2: Apple In-App Purchases

### 2.1 Install Dependencies

```bash
npx expo install react-native-iap
```

### 2.2 Implement `useAppleIAP` Hook

**File**: `lib/hooks/useAppleIAP.ts`

The current file is a stub. Replace with full implementation:

```typescript
import { useState, useEffect, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import {
  initConnection,
  endConnection,
  getProducts,
  requestPurchase,
  finishTransaction,
  purchaseUpdatedListener,
  purchaseErrorListener,
  type ProductPurchase,
  type PurchaseError,
  type Product,
} from 'react-native-iap';
import { supabase } from '../supabase';
import { useAuth } from '../auth';

const PRODUCT_IDS = {
  individual_monthly: 'com.bobuniversity.individual.monthly',
  salon_monthly: 'com.bobuniversity.salon.monthly',
};

interface UseAppleIAPResult {
  products: Product[];
  loading: boolean;
  purchasing: boolean;
  error: string | null;
  purchase: (productId: string) => Promise<boolean>;
  restorePurchases: () => Promise<void>;
}

export function useAppleIAP(): UseAppleIAPResult {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize IAP connection
  useEffect(() => {
    if (Platform.OS !== 'ios') {
      setLoading(false);
      return;
    }

    let purchaseUpdateSubscription: any;
    let purchaseErrorSubscription: any;

    const init = async () => {
      try {
        await initConnection();

        // Get available products
        const availableProducts = await getProducts({
          skus: Object.values(PRODUCT_IDS),
        });
        setProducts(availableProducts);

        // Listen for purchase updates
        purchaseUpdateSubscription = purchaseUpdatedListener(
          async (purchase: ProductPurchase) => {
            const receipt = purchase.transactionReceipt;
            if (receipt) {
              // Verify receipt with backend
              await verifyReceipt(receipt);
              // Finish the transaction
              await finishTransaction({ purchase });
            }
          }
        );

        // Listen for purchase errors
        purchaseErrorSubscription = purchaseErrorListener(
          (err: PurchaseError) => {
            console.error('Purchase error:', err);
            setError(err.message);
            setPurchasing(false);
          }
        );
      } catch (err) {
        console.error('IAP init error:', err);
        setError('Failed to initialize in-app purchases');
      } finally {
        setLoading(false);
      }
    };

    init();

    return () => {
      purchaseUpdateSubscription?.remove();
      purchaseErrorSubscription?.remove();
      endConnection();
    };
  }, []);

  // Verify receipt with Supabase edge function
  const verifyReceipt = async (receipt: string) => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase.functions.invoke('apple-iap-webhook', {
        body: {
          receipt,
          userId: user.id,
        },
      });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Receipt verification error:', err);
      throw err;
    }
  };

  // Purchase a product
  const purchase = useCallback(async (productId: string): Promise<boolean> => {
    if (Platform.OS !== 'ios') {
      Alert.alert('Error', 'Apple purchases only available on iOS');
      return false;
    }

    setPurchasing(true);
    setError(null);

    try {
      await requestPurchase({ sku: productId });
      return true;
    } catch (err: any) {
      if (err.code === 'E_USER_CANCELLED') {
        // User cancelled, not an error
        return false;
      }
      setError(err.message || 'Purchase failed');
      return false;
    } finally {
      setPurchasing(false);
    }
  }, []);

  // Restore purchases
  const restorePurchases = useCallback(async () => {
    if (Platform.OS !== 'ios') return;

    setLoading(true);
    try {
      // react-native-iap handles restore internally
      // The purchaseUpdatedListener will receive restored purchases
      await getProducts({ skus: Object.values(PRODUCT_IDS) });
    } catch (err: any) {
      setError(err.message || 'Failed to restore purchases');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    products,
    loading,
    purchasing,
    error,
    purchase,
    restorePurchases,
  };
}
```

### 2.3 Update `subscribe.tsx` to Use Real IAP

**File**: `app/subscribe.tsx`

Update the iOS purchase flow to use the real hook:

```typescript
// In the component, replace stub calls with:
const { products, purchasing, purchase } = useAppleIAP();

const handleIOSPurchase = async (planType: 'individual' | 'salon') => {
  const productId = planType === 'individual'
    ? 'com.bobuniversity.individual.monthly'
    : 'com.bobuniversity.salon.monthly';

  const success = await purchase(productId);
  if (success) {
    // Entitlement will be updated via webhook
    // Show success state or navigate
  }
};
```

### 2.4 App Store Connect Configuration

Document the required App Store Connect setup:
- Create subscription group "Bob University Premium"
- Add products:
  - `com.bobuniversity.individual.monthly` - $49.99/month
  - `com.bobuniversity.salon.monthly` - $97.99/month
- Configure App Store Server Notifications URL to edge function

---

## Phase 3: Push Notifications

### 3.1 Install Dependencies

```bash
npx expo install expo-notifications expo-device
```

### 3.2 Create Push Notification Hook

**File**: `lib/hooks/usePushNotifications.ts`

```typescript
import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { supabase } from '../supabase';
import { useAuth } from '../auth';

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface UsePushNotificationsResult {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  error: string | null;
  requestPermissions: () => Promise<boolean>;
}

export function usePushNotifications(): UsePushNotificationsResult {
  const { user } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [error, setError] = useState<string | null>(null);

  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Listen for incoming notifications
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        setNotification(notification);
      }
    );

    // Listen for notification taps
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        // Handle deep linking based on notification data
        handleNotificationTap(data);
      }
    );

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  // Save token to database when user or token changes
  useEffect(() => {
    if (user?.id && expoPushToken) {
      saveTokenToDatabase(expoPushToken);
    }
  }, [user?.id, expoPushToken]);

  const saveTokenToDatabase = async (token: string) => {
    if (!user?.id) return;

    try {
      await supabase
        .from('profiles')
        .update({
          push_token: token,
          push_token_updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
    } catch (err) {
      console.error('Error saving push token:', err);
    }
  };

  const requestPermissions = async (): Promise<boolean> => {
    if (!Device.isDevice) {
      setError('Push notifications require a physical device');
      return false;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        setError('Push notification permissions not granted');
        return false;
      }

      // Get the token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      });

      setExpoPushToken(tokenData.data);

      // Configure Android channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
        });
      }

      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to get push token');
      return false;
    }
  };

  return {
    expoPushToken,
    notification,
    error,
    requestPermissions,
  };
}

function handleNotificationTap(data: any) {
  // Handle deep linking based on notification type
  // This will be called when user taps a notification
  if (data.type === 'new_video' && data.videoId) {
    // Navigate to video
    // router.push(`/video/${data.videoId}`);
  } else if (data.type === 'event_reminder' && data.eventId) {
    // Navigate to event
    // router.push(`/(tabs)/events/${data.eventId}`);
  }
  // Add more handlers as needed
}
```

### 3.3 Add `push_token` Column to Profiles

```sql
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS push_token TEXT,
ADD COLUMN IF NOT EXISTS push_token_updated_at TIMESTAMPTZ;

CREATE INDEX idx_profiles_push_token ON profiles(push_token) WHERE push_token IS NOT NULL;
```

### 3.4 Initialize in Root Layout

**File**: `app/_layout.tsx`

Add push notification initialization:

```typescript
import { usePushNotifications } from '../lib/hooks/usePushNotifications';

// Inside the component:
const { requestPermissions } = usePushNotifications();

useEffect(() => {
  // Request permissions after onboarding is complete
  if (user && profile?.has_completed_onboarding) {
    requestPermissions();
  }
}, [user, profile?.has_completed_onboarding]);
```

### 3.5 Update `send-notification` Edge Function

The existing function needs to support Expo push notifications. Verify it includes:

```typescript
// In send-notification/index.ts
import { Expo } from 'expo-server-sdk';

const expo = new Expo();

async function sendPushNotification(pushToken: string, title: string, body: string, data?: any) {
  if (!Expo.isExpoPushToken(pushToken)) {
    console.error('Invalid Expo push token:', pushToken);
    return;
  }

  const message = {
    to: pushToken,
    sound: 'default' as const,
    title,
    body,
    data,
  };

  const chunks = expo.chunkPushNotifications([message]);
  for (const chunk of chunks) {
    await expo.sendPushNotificationsAsync(chunk);
  }
}
```

---

## Phase 4: Community Moderation Integration

### 4.1 Add Report Button to Posts/Comments

**File**: `components/community/PostCard.tsx` (and CommentCard)

```typescript
const handleReport = async (reason: string) => {
  const { error } = await supabase
    .from('community_reports')
    .insert({
      reporter_id: user.id,
      post_id: post.id,
      reason,
    });

  if (!error) {
    Alert.alert('Report Submitted', 'Thank you for helping keep our community safe.');
  }
};
```

### 4.2 Check Ban Status Before Posting

**File**: `lib/hooks/useCommunity.ts` (or wherever posts are created)

```typescript
const checkBanStatus = async () => {
  const { data } = await supabase.rpc('is_user_banned', { check_user_id: user.id });
  return data;
};

const createPost = async (content: string) => {
  const isBanned = await checkBanStatus();
  if (isBanned) {
    Alert.alert('Cannot Post', 'Your account has been restricted from posting.');
    return;
  }
  // Continue with post creation...
};
```

### 4.3 Admin Moderation Queue

**File**: `admin/src/app/(dashboard)/community/reports/page.tsx`

Create admin page to view and action reports:

```typescript
// Fetch pending reports
const { data: reports } = await supabase
  .from('community_reports')
  .select(`
    *,
    reporter:profiles!reporter_id(full_name, email),
    post:community_posts(*),
    comment:community_comments(*)
  `)
  .eq('status', 'pending')
  .order('created_at', { ascending: false });
```

---

## Phase 5: Video Progress Tracking

### 5.1 Create `video_progress` Table (if not exists)

```sql
CREATE TABLE IF NOT EXISTS video_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,

  progress_seconds INTEGER DEFAULT 0,
  duration_seconds INTEGER,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,

  last_watched_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(user_id, video_id)
);

-- RLS
ALTER TABLE video_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own progress"
  ON video_progress FOR ALL
  USING (auth.uid() = user_id);

-- Index for quick lookups
CREATE INDEX idx_video_progress_user_video ON video_progress(user_id, video_id);
```

### 5.2 Create `useVideoProgress` Hook

**File**: `lib/hooks/useVideoProgress.ts`

```typescript
import { useState, useCallback } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../auth';

export function useVideoProgress(videoId: string) {
  const { user } = useAuth();
  const [progress, setProgress] = useState(0);

  const saveProgress = useCallback(async (seconds: number, duration: number) => {
    if (!user?.id) return;

    const completed = seconds >= duration * 0.9; // 90% = completed

    await supabase
      .from('video_progress')
      .upsert({
        user_id: user.id,
        video_id: videoId,
        progress_seconds: Math.floor(seconds),
        duration_seconds: Math.floor(duration),
        completed,
        completed_at: completed ? new Date().toISOString() : null,
        last_watched_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,video_id',
      });
  }, [user?.id, videoId]);

  const loadProgress = useCallback(async () => {
    if (!user?.id) return 0;

    const { data } = await supabase
      .from('video_progress')
      .select('progress_seconds')
      .eq('user_id', user.id)
      .eq('video_id', videoId)
      .single();

    return data?.progress_seconds || 0;
  }, [user?.id, videoId]);

  return { progress, saveProgress, loadProgress };
}
```

---

## Phase 6: Minor Improvements

### 6.1 Exit Survey on Cancellation

**File**: `app/subscription-cancel.tsx` (create new)

Simple modal/screen that asks why user is cancelling before completing cancellation.

### 6.2 Receipt History

**File**: `app/receipt-history.tsx` (create new)

Query `purchases` and `subscription_records` tables to show transaction history.

### 6.3 Restore Purchases Button

Add to profile/settings:

```typescript
<Button
  title="Restore Purchases"
  onPress={() => restorePurchases()}
/>
```

---

## Phase 7: Testing Checklist

### Database
- [ ] All four migrations applied successfully
- [ ] RLS policies working correctly
- [ ] `is_user_banned` function works

### Apple IAP
- [ ] Products load in sandbox
- [ ] Purchase flow completes
- [ ] Receipt verification works
- [ ] Entitlement updates after purchase

### Push Notifications
- [ ] Permissions request works
- [ ] Token saved to profile
- [ ] Notification received on device
- [ ] Deep linking from notification tap

### Community Moderation
- [ ] Report submission works
- [ ] Admin can view reports
- [ ] Ban prevents posting
- [ ] Ban expiration works

### Payments
- [ ] Stripe subscription works (Android/web)
- [ ] Apple IAP works (iOS)
- [ ] Webhook updates entitlements
- [ ] Cancellation flow works

---

## Quick Reference: File Locations

| Feature | Files to Modify/Create |
|---------|----------------------|
| Notification Prefs | Migration + `lib/hooks/useNotificationPreferences.ts` |
| Email Logs | Migration + `supabase/functions/send-email/index.ts` |
| Community Reports | Migration + `components/community/PostCard.tsx` + `admin/.../reports/page.tsx` |
| Community Bans | Migration + `lib/hooks/useCommunity.ts` |
| Apple IAP | `lib/hooks/useAppleIAP.ts` + `app/subscribe.tsx` |
| Push Notifications | `lib/hooks/usePushNotifications.ts` + `app/_layout.tsx` |
| Video Progress | Migration + `lib/hooks/useVideoProgress.ts` + `app/video/[id].tsx` |

---

## Execution Order

1. **Phase 1**: Run all 4 database migrations first (dependencies for everything else)
2. **Phase 5**: Video progress table (quick win, improves UX)
3. **Phase 3**: Push notifications (most user-facing impact)
4. **Phase 2**: Apple IAP (required for iOS App Store)
5. **Phase 4**: Community moderation (polish)
6. **Phase 6**: Minor improvements (nice to have)
7. **Phase 7**: Full testing pass

---

## Notes for Claude Code Session

- Use `mcp__supabase__apply_migration` for all DDL operations
- Use `mcp__supabase__execute_sql` for testing queries
- Run `mcp__supabase__get_advisors` after migrations to check for missing RLS
- Generate updated types after migrations: `npx supabase gen types typescript`

---

---

# Part 2: Feature Enhancements

The following features are recommended post-launch improvements based on industry research and best practices for learning apps.

---

## Phase 8: Gamification & Engagement System

Research shows gamified learning platforms see 60% higher course completion and 35% reduced churn. Apps combining streaks and milestones see 40-60% higher DAU.

### 8.1 Learning Streaks

**Database Migration**:

```sql
-- Add streak tracking to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_date DATE,
ADD COLUMN IF NOT EXISTS streak_freeze_count INTEGER DEFAULT 0;

-- Streak history for analytics
CREATE TABLE streak_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  streak_length INTEGER NOT NULL,
  started_at DATE NOT NULL,
  ended_at DATE NOT NULL,
  ended_reason TEXT, -- 'broken', 'ongoing'
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_streak_history_user ON streak_history(user_id);

ALTER TABLE streak_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own streaks"
  ON streak_history FOR SELECT
  USING (auth.uid() = user_id);
```

**Hook**: `lib/hooks/useStreak.ts`

```typescript
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../auth';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  streakFreezeCount: number;
}

export function useStreak() {
  const { user } = useAuth();
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStreak = useCallback(async () => {
    if (!user?.id) return;

    const { data } = await supabase
      .from('profiles')
      .select('current_streak, longest_streak, last_activity_date, streak_freeze_count')
      .eq('id', user.id)
      .single();

    if (data) {
      setStreak({
        currentStreak: data.current_streak || 0,
        longestStreak: data.longest_streak || 0,
        lastActivityDate: data.last_activity_date,
        streakFreezeCount: data.streak_freeze_count || 0,
      });
    }
    setLoading(false);
  }, [user?.id]);

  const recordActivity = useCallback(async () => {
    if (!user?.id) return;

    const today = new Date().toISOString().split('T')[0];
    const { data: profile } = await supabase
      .from('profiles')
      .select('current_streak, longest_streak, last_activity_date')
      .eq('id', user.id)
      .single();

    if (!profile) return;

    const lastDate = profile.last_activity_date;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newStreak = 1;

    if (lastDate === today) {
      // Already logged today
      return;
    } else if (lastDate === yesterdayStr) {
      // Continuing streak
      newStreak = (profile.current_streak || 0) + 1;
    }
    // else: streak broken, starts at 1

    const newLongest = Math.max(newStreak, profile.longest_streak || 0);

    await supabase
      .from('profiles')
      .update({
        current_streak: newStreak,
        longest_streak: newLongest,
        last_activity_date: today,
      })
      .eq('id', user.id);

    await fetchStreak();
  }, [user?.id, fetchStreak]);

  useEffect(() => {
    fetchStreak();
  }, [fetchStreak]);

  return { streak, loading, recordActivity };
}
```

**UI Component**: `components/gamification/StreakBadge.tsx`

Display current streak with fire emoji, animate milestones (7, 30, 100 days).

### 8.2 Achievement Badges

**Database Migration**:

```sql
-- Badge definitions (admin-managed)
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_url TEXT,
  category TEXT NOT NULL, -- 'learning', 'community', 'certification', 'streak'
  points INTEGER DEFAULT 0,
  criteria JSONB NOT NULL, -- { "type": "videos_completed", "count": 10 }
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User earned badges
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT now(),
  notified BOOLEAN DEFAULT false,

  UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_user_badges_user ON user_badges(user_id);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own badges"
  ON user_badges FOR SELECT
  USING (auth.uid() = user_id);

-- Seed initial badges
INSERT INTO badges (slug, name, description, category, criteria, points) VALUES
  ('first_video', 'First Steps', 'Watch your first video', 'learning', '{"type": "videos_completed", "count": 1}', 10),
  ('five_videos', 'Getting Started', 'Complete 5 videos', 'learning', '{"type": "videos_completed", "count": 5}', 25),
  ('module_master', 'Module Master', 'Complete an entire module', 'learning', '{"type": "modules_completed", "count": 1}', 50),
  ('week_streak', 'Week Warrior', 'Maintain a 7-day streak', 'streak', '{"type": "streak", "count": 7}', 30),
  ('month_streak', 'Dedicated Learner', 'Maintain a 30-day streak', 'streak', '{"type": "streak", "count": 30}', 100),
  ('first_post', 'Community Member', 'Create your first community post', 'community', '{"type": "posts_created", "count": 1}', 15),
  ('helpful_10', 'Helpful Hand', 'Receive 10 helpful reactions', 'community', '{"type": "helpful_received", "count": 10}', 40),
  ('certified', 'Ray Certified', 'Earn your first certification', 'certification', '{"type": "certifications_earned", "count": 1}', 200);
```

**Badge Checker Function** (Edge Function or DB trigger):

```typescript
// supabase/functions/check-badges/index.ts
// Called after video completion, post creation, etc.
// Checks if user meets criteria for any unearned badges
```

### 8.3 Points & Leaderboard

**Database Migration**:

```sql
-- Add points to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS weekly_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS points_last_reset TIMESTAMPTZ;

-- Point transactions for audit
CREATE TABLE point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  reason TEXT NOT NULL, -- 'video_completed', 'badge_earned', 'streak_bonus'
  reference_id UUID, -- video_id, badge_id, etc.
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_point_transactions_user ON point_transactions(user_id);
CREATE INDEX idx_point_transactions_created ON point_transactions(created_at DESC);

-- Leaderboard view (weekly)
CREATE VIEW weekly_leaderboard AS
SELECT
  p.id,
  p.full_name,
  p.avatar_url,
  p.weekly_points,
  p.current_streak,
  RANK() OVER (ORDER BY p.weekly_points DESC) as rank
FROM profiles p
WHERE p.weekly_points > 0
ORDER BY p.weekly_points DESC
LIMIT 100;
```

**Point Values**:
| Action | Points |
|--------|--------|
| Complete video | 10 |
| Complete module | 50 |
| 7-day streak | 25 |
| 30-day streak | 100 |
| First community post | 15 |
| Receive helpful reaction | 5 |
| Earn certification | 200 |

### 8.4 Progress Milestones & Celebrations

**Trigger push/in-app notifications at milestones**:
- First video completed
- 25%, 50%, 75%, 100% of module
- 10, 25, 50, 100 videos watched
- 7, 30, 100 day streaks

**UI**: Full-screen celebration modal with confetti animation.

---

## Phase 9: Learning Path & Skill Trees

### 9.1 Skill-Based Learning Paths

Create personalized learning journeys based on onboarding assessment.

**Database Migration**:

```sql
CREATE TABLE learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  target_persona TEXT, -- 'beginner_stylist', 'salon_owner', 'advanced'
  modules JSONB NOT NULL, -- ordered array of module_ids
  estimated_hours INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  path_id UUID NOT NULL REFERENCES learning_paths(id),
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  current_module_index INTEGER DEFAULT 0,

  UNIQUE(user_id, path_id)
);
```

**Recommended Paths**:
- "Bob Fundamentals" - For beginners
- "Advanced Cutting Techniques" - For experienced stylists
- "Salon Leadership" - For salon owners
- "Certification Prep" - Focused track to Ray Certified

### 9.2 Module Prerequisites UI

Visualize module dependencies as a skill tree. Locked modules show what's required to unlock.

---

## Phase 10: Social & Community Enhancements

### 10.1 Follow System

```sql
CREATE TABLE user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON user_follows(following_id);
```

Show follower/following counts on profiles. Feed can filter to "Following" posts.

### 10.2 Weekly Challenges

Admin-created challenges with deadlines:
- "Complete 3 cutting videos this week"
- "Post your best bob transformation"
- "Watch all videos in Module X"

```sql
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  criteria JSONB NOT NULL, -- { "type": "videos_in_module", "module_id": "...", "count": 3 }
  reward_points INTEGER DEFAULT 50,
  reward_badge_id UUID REFERENCES badges(id),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  progress INTEGER DEFAULT 0,

  UNIQUE(challenge_id, user_id)
);
```

### 10.3 Study Groups (Salon Teams Enhancement)

Allow salon teams to:
- See team member progress
- Compete on team leaderboard
- Set team learning goals
- Team chat/discussion

---

## Phase 11: Enhanced Video Experience

### 11.1 Bookmarks & Notes

```sql
CREATE TABLE video_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  timestamp_seconds INTEGER NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_video_bookmarks_user_video ON video_bookmarks(user_id, video_id);
```

Allow users to:
- Tap to bookmark a moment
- Add notes at specific timestamps
- Jump back to bookmarks
- Export notes as PDF

### 11.2 Speed & Accessibility Improvements

- Remember playback speed preference per user
- Adjustable caption font size
- High contrast mode for captions
- Audio descriptions (where available)

### 11.3 Chapter Markers

If Mux video has chapters, display:
- Chapter list in video player
- Skip to chapter
- Progress per chapter

---

## Phase 12: AI-Powered Features (Post-Raybot)

These are lighter-weight AI features that don't require the full Raybot assistant.

### 12.1 Smart Video Recommendations

Based on:
- Completion history
- Skill assessment results
- Time since last video in series
- Similar users' patterns

```sql
-- Simple: Track which videos commonly follow each other
CREATE TABLE video_view_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id),
  previous_video_id UUID REFERENCES videos(id),
  watched_at TIMESTAMPTZ DEFAULT now()
);
```

### 12.2 Auto-Generated Quizzes

Use AI to generate comprehension quizzes from video transcripts:
- 3-5 multiple choice questions per video
- Immediate feedback
- Points for correct answers
- Required for certification track

### 12.3 Technique Detection (Advanced)

If user uploads practice video (for certification):
- AI analyzes technique
- Provides automated feedback
- Suggests specific videos for improvement

---

## Phase 13: Monetization Enhancements

### 13.1 Referral Program

```sql
CREATE TABLE referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  uses INTEGER DEFAULT 0,
  max_uses INTEGER,
  reward_months INTEGER DEFAULT 1, -- free months for referrer
  referee_discount_percent INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE referral_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id UUID NOT NULL REFERENCES referral_codes(id),
  referee_id UUID NOT NULL REFERENCES auth.users(id),
  referrer_rewarded BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 13.2 Gift Subscriptions

Allow users to purchase subscriptions as gifts:
- 1, 3, 6, 12 month options
- Generates gift code
- Recipient redeems code

### 13.3 Corporate/Distributor Accounts

For product distributors who want to provide access to their salon customers:
- Bulk seat purchases
- Usage reporting
- Custom branding options

---

## Phase 14: Offline & Performance

### 14.1 Offline Video Downloads

```sql
CREATE TABLE offline_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  downloaded_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ, -- 30 days after download
  file_size_bytes BIGINT,

  UNIQUE(user_id, video_id)
);
```

Implementation requires:
- Mux offline playback tokens
- expo-file-system for storage
- Background download support

### 14.2 Low-Bandwidth Mode

- Lower quality default (480p)
- Audio-only option for tutorials
- Reduce image quality in community feed

---

## Implementation Priority Matrix

| Phase | Feature | Impact | Effort | Priority |
|-------|---------|--------|--------|----------|
| 8.1 | Learning Streaks | High | Low | 🔴 Do First |
| 8.2 | Badges | High | Medium | 🔴 Do First |
| 8.3 | Points/Leaderboard | Medium | Medium | 🟡 Soon |
| 9.1 | Learning Paths | High | Medium | 🟡 Soon |
| 10.1 | Follow System | Medium | Low | 🟡 Soon |
| 11.1 | Video Bookmarks | Medium | Low | 🟡 Soon |
| 10.2 | Weekly Challenges | Medium | Medium | 🟢 Later |
| 12.1 | Smart Recommendations | High | High | 🟢 Later |
| 13.1 | Referral Program | High | Medium | 🟢 Later |
| 14.1 | Offline Downloads | Medium | High | ⚪ Future |
| 12.3 | AI Technique Detection | High | Very High | ⚪ Future |

---

## Research Sources

- [Gamification Strategies for Mobile Apps](https://www.storyly.io/post/gamification-strategies-to-increase-app-engagement)
- [Streaks & Milestones Best Practices](https://www.plotline.so/blog/streaks-for-gamification-in-mobile-apps)
- [Top Gamification Tools 2026](https://www.plotline.so/blog/tools-to-gamify-apps)
- [EdTech App Features for Engagement](https://www.kodekx.com/blog/edtech-app-features-student-engagement-retention)
- [Duolingo Gamification Explained](https://www.strivecloud.io/blog/gamification-examples-boost-user-retention-duolingo)
- [Beauty Tech Trends CES 2026](https://www.cosmeticsdesign-europe.com/Article/2026/01/06/ai-led-and-smart-styling-key-beauty-tech-trends-at-ces-2026/)
- [Beauty Industry Trends 2025-2026](https://www.market-xcel.com/us/blogs/top-10-beauty-industry-trends-usa)
- [App Retention Benchmarks for Course Apps](https://passion.io/blog/mobile-app-retention-benchmarks-for-creators-course-coaching-apps)
