import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bob University - Subscribe',
  description: 'Subscribe to Bob University for premium hair education content',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background">{children}</body>
    </html>
  );
}
