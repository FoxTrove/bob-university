import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import type { Profile } from '../database.types';
import { useAuth } from '../auth';

export type UserType = 'salon_owner' | 'individual_stylist' | 'client' | null;

interface UseProfileResult {
  profile: Profile | null;
  userType: UserType;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useProfile(): UseProfileResult {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user?.id) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No profile found
          setProfile(null);
        } else {
          throw fetchError;
        }
      } else {
        setProfile(data);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch profile';
      setError(message);
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Subscribe to real-time profile changes
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`profiles:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        () => {
          fetchProfile();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchProfile]);

  const userType: UserType = (profile?.user_type as UserType) || null;

  return {
    profile,
    userType,
    loading,
    error,
    refetch: fetchProfile,
  };
}
