import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  onboardingComplete: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  onboardingComplete: false,
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  const fetchProfileStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('has_completed_onboarding')
        .eq('id', userId)
        .single();
      
      if (data) {
        setOnboardingComplete(data.has_completed_onboarding || false);
      }
    } catch (e) {
      console.error('Error fetching onboarding status:', e);
      // Optional: Add a retry mechanism or alert integration here
    }
  };

  const refreshProfile = async () => {
    if (session?.user?.id) {
        await fetchProfileStatus(session.user.id);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Safety timeout: stop loading after 5 seconds if Supabase hangs
    const timeoutFn = setTimeout(() => {
        if (mounted && loading) {
            console.warn('Auth initialization timed out, forcing load completion.');
            setLoading(false);
        }
    }, 5000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      if (session?.user) {
        fetchProfileStatus(session.user.id).finally(() => {
             if (mounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    }).catch(err => {
        console.error("Session fetch error:", err);
        if (mounted) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      setSession(session);
      if (session?.user) {
         await fetchProfileStatus(session.user.id);
      } else {
         setOnboardingComplete(false);
      }
      setLoading(false);
    });

    return () => {
        mounted = false;
        clearTimeout(timeoutFn);
        subscription.unsubscribe();
    };
  }, []);


  return (
    <AuthContext.Provider value={{ 
        session, 
        user: session?.user ?? null, 
        loading, 
        onboardingComplete,
        refreshProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
