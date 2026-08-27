import type { Metadata } from 'next';
import '@/styles/globals.css';
import Navigation from '@/components/Navigation';

export const metadata: Metadata = {
  title: 'StreamHub - Stream 10,000+ Free Live TV Channels, Sports & Movies',
  description: 'Your ultimate free live streaming destination. Watch 10,000+ live broadcast channels, global sports, breaking news, cinema movies, and entertainment in FHD/4K.',
  keywords: ['streaming', 'live tv', 'iptv', 'free live streaming', 'watch sports online', 'news channels', 'movies', 'streamhub', '1flex'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
      </body>
    </html>
  );
}
