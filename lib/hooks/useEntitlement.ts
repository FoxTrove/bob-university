import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabase';
import type { Entitlement, PlanType, Video } from '../database.types';
import { useAuth } from '../auth';

interface VideoAccessResult {
  hasAccess: boolean;
  reason?: string;
  daysUntilUnlock?: number;
}

interface UseEntitlementResult {
  entitlement: Entitlement | null;
  loading: boolean;
  error: string | null;
  plan: PlanType;
  isActive: boolean;
  isPremium: boolean;
  subscriptionStartDate: Date | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  canAccessVideo: (video: Video) => boolean;
  checkVideoAccess: (video: Video) => VideoAccessResult;
  refetch: () => Promise<void>;
}

export function useEntitlement(): UseEntitlementResult {
  const { user } = useAuth();
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEntitlement = useCallback(async () => {
    if (!user?.id) {
      setEntitlement(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('entitlements')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        // User might not have an entitlement yet (edge case)
        if (fetchError.code === 'PGRST116') {
          // No rows returned - treat as free tier
          setEntitlement(null);
        } else {
          throw fetchError;
        }
      } else {
        setEntitlement(data);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch entitlement';
      setError(message);
      console.error('Error fetching entitlement:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchEntitlement();
  }, [fetchEntitlement]);

  // Subscribe to real-time entitlement changes for auto-refresh after payment
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`entitlements:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'entitlements',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchEntitlement();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchEntitlement]);

  const plan: PlanType = entitlement?.plan || 'free';

  const isActive = useMemo(() => {
    if (!entitlement) return false;
    if (entitlement.status !== 'active') return false;

    // Check if subscription period is still valid
    if (entitlement.current_period_end) {
      const endDate = new Date(entitlement.current_period_end);
      if (endDate < new Date()) {
        return false;
      }
    }

    return true;
  }, [entitlement]);

  const isPremium = useMemo(() => {
    return isActive && (plan === 'individual' || plan === 'signature' || plan === 'studio' || plan === 'salon');
  }, [isActive, plan]);

  const subscriptionStartDate = useMemo(() => {
    if (!entitlement?.current_period_start) return null;
    return new Date(entitlement.current_period_start);
  }, [entitlement?.current_period_start]);

  // Check video access with detailed drip information
  const checkVideoAccess = useCallback(
    (video: Video): VideoAccessResult => {
      // Free videos are accessible to everyone
      if (video.is_free) {
        return { hasAccess: true };
      }

      // Premium videos require an active premium subscription
      if (!isPremium) {
        return { hasAccess: false, reason: 'Premium subscription required' };
      }

      // Check content dripping
      const dripDays = video.drip_days || 0;
      if (dripDays > 0 && subscriptionStartDate) {
        const dripUnlockDate = new Date(subscriptionStartDate);
        dripUnlockDate.setDate(dripUnlockDate.getDate() + dripDays);

        if (new Date() < dripUnlockDate) {
          const daysUntilUnlock = Math.ceil(
            (dripUnlockDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
          return {
            hasAccess: false,
            reason: `Unlocks in ${daysUntilUnlock} day${daysUntilUnlock === 1 ? '' : 's'}`,
            daysUntilUnlock,
          };
        }
      }

      return { hasAccess: true };
    },
    [isPremium, subscriptionStartDate]
  );

  // Simple boolean check for backwards compatibility
  const canAccessVideo = useCallback(
    (video: Video): boolean => {
      return checkVideoAccess(video).hasAccess;
    },
    [checkVideoAccess]
  );

  return {
    entitlement,
    loading,
    error,
    plan,
    isActive,
    isPremium,
    subscriptionStartDate,
    currentPeriodEnd: entitlement?.current_period_end || null,
    cancelAtPeriodEnd: entitlement?.cancel_at_period_end || false,
    canAccessVideo,
    checkVideoAccess,
    refetch: fetchEntitlement,
  };
}
