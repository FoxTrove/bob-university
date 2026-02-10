'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const source = searchParams.get('source');
  const isFromApp = source === 'ios_app';

  const [countdown, setCountdown] = useState(isFromApp ? 3 : null);
  const [hasRedirected, setHasRedirected] = useState(false);

  // Auto-redirect to app after countdown (iOS app users only)
  useEffect(() => {
    if (!isFromApp || countdown === null || hasRedirected) return;

    if (countdown === 0) {
      setHasRedirected(true);
      // Deep link back to the app with success status
      window.location.href = 'bob-university://subscription-success';
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, isFromApp, hasRedirected]);

  const handleOpenApp = () => {
    setHasRedirected(true);
    window.location.href = 'bob-university://subscription-success';
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
      <div className="max-w-md mx-auto text-center">
        {/* Success Animation */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
          <div className="relative w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-serif font-bold text-white mb-4">
          Welcome to Bob University!
        </h1>

        <p className="text-gray-400 mb-8">
          Your subscription is now active. You have full access to all premium content.
        </p>

        {/* iOS App User - Auto redirect */}
        {isFromApp && (
          <div className="bg-surface rounded-xl p-6 mb-6 border border-gray-800">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-white font-medium">Returning to app...</span>
            </div>

            {countdown !== null && countdown > 0 && (
              <p className="text-gray-400 text-sm mb-4">
                Redirecting in <span className="text-primary font-bold">{countdown}</span> seconds
              </p>
            )}

            <button
              onClick={handleOpenApp}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-6 rounded-xl transition-colors"
            >
              Open App Now
            </button>
          </div>
        )}

        {/* Web/Other Users - Manual flow */}
        {!isFromApp && (
          <>
            <div className="bg-surface rounded-xl p-6 mb-8 border border-gray-800">
              <h2 className="text-lg font-medium text-white mb-4">What&apos;s Next?</h2>
              <ul className="text-left space-y-3">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-300">Open the Bob University app to access your content</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-300">Start with the Core Curriculum in the University tab</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-300">Check your email for a receipt and welcome message</span>
                </li>
              </ul>
            </div>

            <a
              href="bob-university://"
              className="inline-block bg-primary hover:bg-primary/90 text-white font-medium py-3 px-8 rounded-xl transition-colors mb-4"
            >
              Open App
            </a>

            <p className="text-gray-500 text-sm">
              Don&apos;t have the app?{' '}
              <a href="https://apps.apple.com/app/bob-university" className="text-primary hover:underline">
                Download for iOS
              </a>{' '}
              or{' '}
              <a href="https://play.google.com/store/apps/details?id=com.thebobco.bobuniversity" className="text-primary hover:underline">
                Android
              </a>
            </p>
          </>
        )}

        {/* Confirmation details */}
        <div className="mt-8 pt-6 border-t border-gray-800">
          <p className="text-gray-500 text-xs">
            A confirmation email has been sent to your inbox.
            {sessionId && (
              <span className="block mt-1">
                Reference: {sessionId.slice(0, 8)}...
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="flex items-center gap-3 text-gray-400">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Processing...
          </div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
