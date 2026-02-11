'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function AuthErrorPage() {
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
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          <h1 className="text-2xl font-serif font-bold text-[#1a1a1a] mb-4">
            Something Went Wrong
          </h1>

          <p className="text-[#6b6b6b] mb-8">
            The link may have expired or is invalid. Please try again or request a new link.
          </p>

          <Link
            href="/"
            className="inline-block w-full bg-primary hover:bg-primary/90 text-white font-semibold py-4 px-8 rounded-full transition-colors text-center mb-4"
          >
            Go to Home
          </Link>

          <p className="text-sm text-[#6b6b6b]">
            Need help?{' '}
            <a href="mailto:support@thebobcompany.com" className="text-primary hover:underline">
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
