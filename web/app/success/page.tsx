'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
      <div className="max-w-md mx-auto text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-serif font-bold text-white mb-4">
          Welcome to Bob University!
        </h1>

        <p className="text-gray-400 mb-8">
          Your subscription is now active. You have full access to all premium
          content.
        </p>

        <div className="bg-surface rounded-xl p-6 mb-8">
          <h2 className="text-lg font-medium text-white mb-3">What's Next?</h2>
          <ul className="text-left space-y-3">
            <li className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-primary flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-gray-300">
                Open the Bob University app to access your content
              </span>
            </li>
            <li className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-primary flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-gray-300">
                Start with the Core Curriculum in the University tab
              </span>
            </li>
            <li className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-primary flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-gray-300">
                Check your email for a receipt and welcome message
              </span>
            </li>
          </ul>
        </div>

        <a
          href="bobuniversity://"
          className="inline-block bg-primary hover:bg-primary/90 text-white font-medium py-3 px-8 rounded-xl transition-colors mb-4"
        >
          Open App
        </a>

        <p className="text-gray-500 text-sm">
          Don't have the app?{' '}
          <a
            href="https://apps.apple.com/app/bob-university"
            className="text-primary hover:underline"
          >
            Download for iOS
          </a>{' '}
          or{' '}
          <a
            href="https://play.google.com/store/apps/details?id=com.thebobco.bobuniversity"
            className="text-primary hover:underline"
          >
            Android
          </a>
        </p>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-gray-400">Loading...</div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
