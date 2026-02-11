'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#f7f3ef] flex items-center justify-center py-12 px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-8">
            <Image
              src="/logo.png"
              alt="The Bob Company"
              width={200}
              height={70}
              className="mx-auto"
            />
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#e5e0db]">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1 className="text-2xl font-serif font-bold text-[#1a1a1a] mb-4">
              Password Updated!
            </h1>

            <p className="text-[#6b6b6b] mb-8">
              Your password has been successfully updated. You can now sign in with your new password.
            </p>

            <a
              href="bob-university://"
              className="inline-block w-full bg-primary hover:bg-primary/90 text-white font-semibold py-4 px-8 rounded-full transition-colors text-center"
            >
              Open App
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f3ef] flex items-center justify-center py-12 px-4">
      <div className="max-w-md mx-auto w-full">
        <div className="text-center mb-8">
          <Image
            src="/logo.png"
            alt="The Bob Company"
            width={200}
            height={70}
            className="mx-auto"
          />
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#e5e0db]">
          <h1 className="text-2xl font-serif font-bold text-[#1a1a1a] mb-2 text-center">
            Reset Your Password
          </h1>

          <p className="text-[#6b6b6b] text-center mb-8">
            Enter your new password below.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#1a1a1a] mb-2">
                New Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[#e5e0db] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-[#1a1a1a]"
                placeholder="Enter new password"
                required
                minLength={8}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#1a1a1a] mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[#e5e0db] focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-[#1a1a1a]"
                placeholder="Confirm new password"
                required
                minLength={8}
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white font-semibold py-4 px-8 rounded-full transition-colors"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
