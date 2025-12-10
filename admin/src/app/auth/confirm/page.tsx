'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AuthConfirmPage() {
  const router = useRouter();
  const [status, setStatus] = useState('Processing...');
  const supabase = createClient();

  useEffect(() => {
    const handleAuth = async () => {
      // Get the hash fragment from the URL
      const hash = window.location.hash;

      if (hash) {
        // Parse the hash fragment
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const type = params.get('type');

        if (accessToken && refreshToken) {
          // Set the session
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            setStatus('Error: ' + error.message);
            return;
          }

          // Redirect based on type
          if (type === 'recovery') {
            router.push('/reset-password');
          } else {
            router.push('/');
          }
          return;
        }
      }

      // No valid tokens, redirect to login
      setStatus('Invalid or expired link');
      setTimeout(() => router.push('/login'), 2000);
    };

    handleAuth();
  }, [router, supabase.auth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  );
}
