'use client';

import Link from 'next/link';
import Image from 'next/image';

const FEATURES = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: '14+ Hours of Curriculum',
    description: 'Master precision cutting techniques with Ray\'s comprehensive video library.',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Live Workshops',
    description: 'Join monthly specialty workshops and Ask Ray sessions for real-time learning.',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
    title: 'Get Certified',
    description: 'Earn your Ray Certification and stand out in the industry.',
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    title: 'Join the Community',
    description: 'Connect with stylists worldwide, share your work, and grow together.',
  },
];

const STATS = [
  { value: '14+', label: 'Hours of Content' },
  { value: '1000+', label: 'Stylists Learning' },
  { value: '50+', label: 'Live Sessions/Year' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f7f3ef]">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 pt-12 pb-16 sm:pt-16 sm:pb-24">
          <div className="text-center">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <Image
                src="/logo.png"
                alt="The Bob Company"
                width={280}
                height={100}
                className="h-auto"
                priority
              />
            </div>

            <p className="text-xl sm:text-2xl text-[#6b6b6b] max-w-2xl mx-auto mb-8">
              Master precision cutting with Ray. Transform your craft, elevate your career.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <a
                href="https://apps.apple.com/app/bob-company/id123456789"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-[#1a1a1a] text-white font-semibold py-4 px-8 rounded-xl hover:bg-[#333] transition-colors"
              >
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <div className="text-left">
                  <div className="text-xs opacity-75">Download on the</div>
                  <div className="text-lg leading-tight">App Store</div>
                </div>
              </a>

              <a
                href="https://play.google.com/store/apps/details?id=com.foxtrove.bobuniversity"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-[#1a1a1a] text-white font-semibold py-4 px-8 rounded-xl hover:bg-[#333] transition-colors"
              >
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                </svg>
                <div className="text-left">
                  <div className="text-xs opacity-75">Get it on</div>
                  <div className="text-lg leading-tight">Google Play</div>
                </div>
              </a>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center gap-8 sm:gap-16">
              {STATS.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-primary">{stat.value}</div>
                  <div className="text-sm text-[#6b6b6b]">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Marquee Banner */}
      <section className="bg-primary py-4 overflow-hidden">
        <div className="whitespace-nowrap animate-marquee">
          <span className="text-white text-sm sm:text-base font-medium tracking-wide mx-8">
            LOVE YOUR STYLE TRUST YOUR STYLIST
          </span>
          <span className="text-white/60 text-sm sm:text-base mx-8">•</span>
          <span className="text-white text-sm sm:text-base font-medium tracking-wide mx-8">
            THE BOB COMPANY — SHORT HAIR SPECIALISTS
          </span>
          <span className="text-white/60 text-sm sm:text-base mx-8">•</span>
          <span className="text-white text-sm sm:text-base font-medium tracking-wide mx-8">
            LOVE YOUR STYLE TRUST YOUR STYLIST
          </span>
          <span className="text-white/60 text-sm sm:text-base mx-8">•</span>
          <span className="text-white text-sm sm:text-base font-medium tracking-wide mx-8">
            THE BOB COMPANY — SHORT HAIR SPECIALISTS
          </span>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1a1a1a] mb-4">
              Everything You Need to Master Your Craft
            </h2>
            <p className="text-[#6b6b6b] max-w-2xl mx-auto">
              From foundational techniques to advanced precision cutting, The Bob Company gives you direct access to Ray&apos;s expertise.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {FEATURES.map((feature, index) => (
              <div
                key={index}
                className="bg-[#f7f3ef] rounded-2xl p-6 border border-[#e5e0db] hover:border-primary/50 transition-colors"
              >
                <div className="text-primary mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-[#1a1a1a] mb-2">{feature.title}</h3>
                <p className="text-[#6b6b6b]">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 bg-[#f7f3ef]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1a1a1a] mb-4">
            Ready to Transform Your Career?
          </h2>
          <p className="text-[#6b6b6b] mb-8 max-w-2xl mx-auto">
            Join thousands of stylists who are elevating their craft with The Bob Company. Start your journey today.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/subscribe"
              className="inline-flex items-center justify-center bg-primary hover:bg-primary/90 text-white font-semibold py-4 px-8 rounded-full transition-colors text-lg"
            >
              View Plans & Pricing
            </Link>
            <a
              href="https://thebobcompany.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-white hover:bg-gray-50 text-[#1a1a1a] font-semibold py-4 px-8 rounded-full border border-[#e5e0db] transition-colors text-lg"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white border-t border-[#e5e0db]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center">
              <Image
                src="/logo.png"
                alt="The Bob Company"
                width={140}
                height={50}
                className="h-auto"
              />
            </div>

            <div className="flex items-center gap-6 text-sm text-[#6b6b6b]">
              <a href="https://thebobcompany.com/privacy" className="hover:text-[#1a1a1a] transition-colors">
                Privacy Policy
              </a>
              <a href="https://thebobcompany.com/terms" className="hover:text-[#1a1a1a] transition-colors">
                Terms of Service
              </a>
              <a href="mailto:support@thebobcompany.com" className="hover:text-[#1a1a1a] transition-colors">
                Support
              </a>
            </div>

            <div className="text-sm text-[#6b6b6b]">
              &copy; {new Date().getFullYear()} The Bob Company
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
