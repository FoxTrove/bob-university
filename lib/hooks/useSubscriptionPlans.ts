import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export interface SubscriptionPlan {
  id: string;
  plan: 'individual' | 'salon';
  stripe_product_id: string;
  stripe_price_id: string;
  amount_cents: number;
  currency: string;
  interval: string;
  is_active: boolean;
  apple_product_id: string | null;
  google_product_id: string | null;
  description: string | null;
  features: string[];
}

interface UseSubscriptionPlansResult {
  plans: SubscriptionPlan[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSubscriptionPlans(): UseSubscriptionPlansResult {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('amount_cents', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      // Transform features from JSON to array if needed
      const transformedPlans = (data || []).map((plan) => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features : [],
      }));

      setPlans(transformedPlans);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch plans';
      setError(message);
      console.error('Error fetching subscription plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  return {
    plans,
    loading,
    error,
    refetch: fetchPlans,
  };
}

// Helper to format price for display
export function formatPlanPrice(amountCents: number, currency: string = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}
