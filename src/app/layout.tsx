import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';
import { Navigation } from '@/components/layout/Navigation';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'MovieMania - Stream Movies, TV Shows & Live TV',
  description: 'Your ultimate streaming destination. Watch movies, TV shows, and live TV in HD with no ads.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#070709',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <div className="bg-ambient-vignette" />
        <Navigation />
        {children}
        <MobileBottomNav />
        <Footer />
      </body>
    </html>
  );
}
