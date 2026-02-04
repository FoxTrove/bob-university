import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../auth';
import type { Salon, Profile } from '../database.types';

interface SalonInvite {
  id: string;
  salon_id: string;
  invited_by_user_id: string;
  invited_user_id: string;
  status: string; // 'pending' | 'accepted' | 'declined' | 'expired'
  access_code_id: string | null;
  message: string | null;
  responded_at: string | null;
  expires_at: string;
  created_at: string | null;
  updated_at: string | null;
  salon?: Pick<Salon, 'id' | 'name' | 'owner_id'> | null;
  invitedBy?: Pick<Profile, 'id' | 'full_name' | 'email' | 'avatar_url'> | null;
}

interface UseSalonInvitesResult {
  invites: SalonInvite[];
  loading: boolean;
  error: string | null;
  pendingCount: number;
  refetch: () => Promise<void>;
  acceptInvite: (inviteId: string) => Promise<AcceptInviteResult>;
  declineInvite: (inviteId: string) => Promise<void>;
}

interface AcceptInviteResult {
  success: boolean;
  message: string;
  salon_id?: string;
  salon_name?: string;
  subscription_cancelled?: boolean;
  cancellation_details?: {
    plan?: string;
    cancel_at?: string;
  } | null;
}

export function useSalonInvites(): UseSalonInvitesResult {
  const { user } = useAuth();
  const [invites, setInvites] = useState<SalonInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvites = useCallback(async () => {
    if (!user?.id) {
      setInvites([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch pending invites with salon and inviter details
      const { data, error: fetchError } = await supabase
        .from('salon_invites')
        .select(`
          *,
          salon:salons(id, name, owner_id),
          invitedBy:profiles!salon_invites_invited_by_user_id_fkey(id, full_name, email, avatar_url)
        `)
        .eq('invited_user_id', user.id)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setInvites(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch invites';
      setError(message);
      console.error('Error fetching salon invites:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  // Subscribe to real-time invite changes
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`salon_invites:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'salon_invites',
          filter: `invited_user_id=eq.${user.id}`,
        },
        () => {
          fetchInvites();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchInvites]);

  const acceptInvite = useCallback(async (inviteId: string): Promise<AcceptInviteResult> => {
    const { data, error: fnError } = await supabase.functions.invoke('accept-salon-invite', {
      body: {
        invite_id: inviteId,
        action: 'accept',
      },
    });

    if (fnError) {
      throw new Error(fnError.message || 'Failed to accept invite');
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    // Remove the invite from local state
    setInvites((prev) => prev.filter((inv) => inv.id !== inviteId));

    return data as AcceptInviteResult;
  }, []);

  const declineInvite = useCallback(async (inviteId: string) => {
    const { data, error: fnError } = await supabase.functions.invoke('accept-salon-invite', {
      body: {
        invite_id: inviteId,
        action: 'decline',
      },
    });

    if (fnError) {
      throw new Error(fnError.message || 'Failed to decline invite');
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    // Remove the invite from local state
    setInvites((prev) => prev.filter((inv) => inv.id !== inviteId));
  }, []);

  const pendingCount = invites.filter((inv) => inv.status === 'pending').length;

  return {
    invites,
    loading,
    error,
    pendingCount,
    refetch: fetchInvites,
    acceptInvite,
    declineInvite,
  };
}
