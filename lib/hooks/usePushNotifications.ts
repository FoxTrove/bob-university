import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { supabase } from '../supabase';
import { useAuth } from '../auth';
import { router } from 'expo-router';

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
  permissionStatus: Notifications.PermissionStatus | null;
  requestPermissions: () => Promise<boolean>;
}

export function usePushNotifications(): UsePushNotificationsResult {
  const { user } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<Notifications.PermissionStatus | null>(null);

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
        handleNotificationTap(data);
      }
    );

    // Check initial permission status
    Notifications.getPermissionsAsync().then(({ status }) => {
      setPermissionStatus(status);
    });

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
      // Use push_tokens table (used by send-notification edge function)
      const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';

      // Upsert the token - one token per user/platform combination
      const { error } = await supabase
        .from('push_tokens')
        .upsert(
          {
            user_id: user.id,
            token,
            platform,
            created_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,platform',
            ignoreDuplicates: false,
          }
        );

      if (error) {
        // If upsert fails due to unique constraint, try insert on conflict update
        await supabase
          .from('push_tokens')
          .delete()
          .eq('user_id', user.id)
          .eq('platform', platform);

        await supabase
          .from('push_tokens')
          .insert({
            user_id: user.id,
            token,
            platform,
          });
      }
    } catch (err) {
      console.error('Error saving push token:', err);
    }
  };

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    // Push notifications only work on physical devices
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

      setPermissionStatus(finalStatus);

      if (finalStatus !== 'granted') {
        setError('Push notification permissions not granted');
        return false;
      }

      // Get the Expo push token
      const projectId = process.env.EXPO_PUBLIC_PROJECT_ID;
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      setExpoPushToken(tokenData.data);

      // Configure Android notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#3b82f6',
        });

        // Create additional channels for different notification types
        await Notifications.setNotificationChannelAsync('learning', {
          name: 'Learning Updates',
          description: 'New content and course updates',
          importance: Notifications.AndroidImportance.HIGH,
        });

        await Notifications.setNotificationChannelAsync('events', {
          name: 'Event Reminders',
          description: 'Upcoming event notifications',
          importance: Notifications.AndroidImportance.HIGH,
        });

        await Notifications.setNotificationChannelAsync('community', {
          name: 'Community Activity',
          description: 'Comments, reactions, and mentions',
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      }

      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to get push token';
      setError(message);
      console.error('Push notification error:', err);
      return false;
    }
  }, []);

  return {
    expoPushToken,
    notification,
    error,
    permissionStatus,
    requestPermissions,
  };
}

function handleNotificationTap(data: Record<string, unknown>) {
  // Handle deep linking based on notification type
  const type = data.type as string | undefined;

  switch (type) {
    case 'new_video':
      if (data.videoId) {
        router.push(`/video/${data.videoId}`);
      }
      break;

    case 'new_module':
      if (data.moduleId) {
        router.push(`/module/${data.moduleId}`);
      }
      break;

    case 'event_reminder':
      if (data.eventId) {
        router.push(`/(tabs)/events/${data.eventId}`);
      }
      break;

    case 'certification_update':
      router.push('/(tabs)/certification');
      break;

    case 'community_mention':
    case 'community_comment':
    case 'community_reaction':
      if (data.postId) {
        router.push(`/(tabs)/community/post/${data.postId}`);
      } else {
        router.push('/(tabs)/community');
      }
      break;

    case 'subscription_update':
    case 'payment_failed':
      router.push('/(tabs)/profile');
      break;

    default:
      // Default: go to home
      router.push('/(tabs)');
  }
}
