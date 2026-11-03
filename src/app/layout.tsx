import type { Metadata } from 'next';
import '@/styles/globals.css';
import { Navigation } from '@/components/layout/Navigation';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'MovieMania - Live IPTV & VOD Cinema Streaming',
  description: 'Watch thousands of free live TV channels, breaking news, sports, and cinema movies in HD.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="theme-color" content="#070709" />
      </head>
      <body>
        <div className="bg-ambient-vignette" />
        <Navigation />
        {children}
        <Footer />
      </body>
    </html>
  );
}

