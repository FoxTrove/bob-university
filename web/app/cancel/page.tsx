'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function CancelContent() {
  const searchParams = useSearchParams();
  const source = searchParams.get('source');
  const isFromApp = source === 'ios_app';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
      <div className="max-w-md mx-auto text-center">
        {/* Cancel Icon */}
        <div className="w-20 h-20 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-serif font-bold text-white mb-4">
          {isFromApp ? 'No Problem!' : 'Subscription Cancelled'}
        </h1>

        <p className="text-gray-400 mb-8">
          {isFromApp
            ? "Your payment was not processed. You can subscribe anytime from the app when you're ready."
            : "No worries! Your payment was not processed. You can try again anytime or continue exploring our free content."
          }
        </p>

        <div className="space-y-4">
          {isFromApp ? (
            <>
              <a
                href="bob-university://"
                className="block w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 px-6 rounded-xl transition-colors"
              >
                Return to App
              </a>
              <Link
                href={`/subscribe?source=${source}`}
                className="block w-full bg-surface hover:bg-surface/80 text-white font-medium py-3 px-6 rounded-xl transition-colors border border-gray-800"
              >
                Try Again
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/subscribe"
                className="block w-full bg-primary hover:bg-primary/90 text-white font-medium py-3 px-6 rounded-xl transition-colors"
              >
                Try Again
              </Link>
              <a
                href="bob-university://"
                className="block w-full bg-surface hover:bg-surface/80 text-white font-medium py-3 px-6 rounded-xl transition-colors border border-gray-800"
              >
                Return to App
              </a>
            </>
          )}
        </div>

        <p className="text-gray-500 text-sm mt-8">
          Have questions?{' '}
          <a
            href="mailto:support@bobuniversity.com"
            className="text-primary hover:underline"
          >
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}

export default function CancelPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-gray-400">Loading...</div>
        </div>
      }
    >
      <CancelContent />
    </Suspense>
  );
}
