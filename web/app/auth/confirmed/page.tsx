'use client';

import Image from 'next/image';

export default function EmailConfirmedPage() {
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
            Email Confirmed!
          </h1>

          <p className="text-[#6b6b6b] mb-8">
            Your email has been verified. You can now sign in to The Bob Company app and start learning.
          </p>

          <a
            href="bob-university://"
            className="inline-block w-full bg-primary hover:bg-primary/90 text-white font-semibold py-4 px-8 rounded-full transition-colors text-center mb-4"
          >
            Open App
          </a>

          <p className="text-sm text-[#6b6b6b]">
            Don&apos;t have the app yet?{' '}
            <a href="https://apps.apple.com/app/bob-company/id123456789" className="text-primary hover:underline">
              Download now
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
