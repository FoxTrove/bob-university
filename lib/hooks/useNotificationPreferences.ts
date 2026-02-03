import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../auth';
import logger from '../utils/logger';

export interface NotificationPreferences {
  id: string;
  user_id: string;
  learning_updates: boolean;
  progress_milestones: boolean;
  payment_receipts: boolean;
  subscription_updates: boolean;
  certification_updates: boolean;
  event_confirmations: boolean;
  event_reminders: boolean;
  promotional_emails: boolean;
  newsletter: boolean;
  tips_and_tutorials: boolean;
  community_notifications: boolean;
  created_at: string;
  updated_at: string;
}

interface UseNotificationPreferencesResult {
  preferences: NotificationPreferences | null;
  loading: boolean;
  error: string | null;
  updatePreference: (key: keyof NotificationPreferences, value: boolean) => Promise<void>;
  updateMultiplePreferences: (updates: Partial<NotificationPreferences>) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useNotificationPreferences(): UseNotificationPreferencesResult {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = useCallback(async () => {
    if (!user?.id) {
      setPreferences(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No row found - create default preferences
          const { data: newData, error: insertError } = await supabase
            .from('notification_preferences')
            .insert({ user_id: user.id })
            .select()
            .single();

          if (insertError) throw insertError;
          setPreferences(newData);
        } else {
          throw fetchError;
        }
      } else {
        setPreferences(data);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch preferences';
      setError(message);
      logger.error('Error fetching notification preferences:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const updatePreference = useCallback(
    async (key: keyof NotificationPreferences, value: boolean) => {
      if (!user?.id || !preferences) return;

      // Optimistic update
      setPreferences((prev) => (prev ? { ...prev, [key]: value } : prev));

      try {
        const { error: updateError } = await supabase
          .from('notification_preferences')
          .update({ [key]: value, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);

        if (updateError) throw updateError;
      } catch (err) {
        // Revert on error
        setPreferences((prev) => (prev ? { ...prev, [key]: !value } : prev));
        const message = err instanceof Error ? err.message : 'Failed to update preference';
        setError(message);
        logger.error('Error updating preference:', err);
      }
    },
    [user?.id, preferences]
  );

  const updateMultiplePreferences = useCallback(
    async (updates: Partial<NotificationPreferences>) => {
      if (!user?.id || !preferences) return;

      // Optimistic update
      const previousPreferences = { ...preferences };
      setPreferences((prev) => (prev ? { ...prev, ...updates } : prev));

      try {
        const { error: updateError } = await supabase
          .from('notification_preferences')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);

        if (updateError) throw updateError;
      } catch (err) {
        // Revert on error
        setPreferences(previousPreferences);
        const message = err instanceof Error ? err.message : 'Failed to update preferences';
        setError(message);
        logger.error('Error updating preferences:', err);
      }
    },
    [user?.id, preferences]
  );

  return {
    preferences,
    loading,
    error,
    updatePreference,
    updateMultiplePreferences,
    refetch: fetchPreferences,
  };
}
