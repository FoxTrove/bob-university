import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabase';
import type { Entitlement, PlanType, Video } from '../database.types';
import { useAuth } from '../auth';

interface UseEntitlementResult {
  entitlement: Entitlement | null;
  loading: boolean;
  error: string | null;
  plan: PlanType;
  isActive: boolean;
  isPremium: boolean;
  canAccessVideo: (video: Video) => boolean;
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
    return isActive && (plan === 'individual' || plan === 'salon');
  }, [isActive, plan]);

  const canAccessVideo = useCallback(
    (video: Video): boolean => {
      // Free videos are accessible to everyone
      if (video.is_free) return true;

      // Premium videos require an active premium subscription
      return isPremium;
    },
    [isPremium]
  );

  return {
    entitlement,
    loading,
    error,
    plan,
    isActive,
    isPremium,
    canAccessVideo,
    refetch: fetchEntitlement,
  };
}
