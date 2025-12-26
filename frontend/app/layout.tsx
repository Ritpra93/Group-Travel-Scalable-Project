import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { Navigation } from '@/components/layout/Navigation';
import { Providers } from './providers';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Wanderlust | Plan Your Next Adventure',
  description:
    'Collaborative trip planning made beautiful. Plan, budget, and experience unforgettable adventures with your travel crew.',
  keywords: ['travel', 'trip planning', 'adventure', 'group travel', 'itinerary'],
  authors: [{ name: 'Wanderlust Team' }],
  openGraph: {
    title: 'Wanderlust | Plan Your Next Adventure',
    description: 'Collaborative trip planning made beautiful.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="antialiased">
        <Providers>
          <Navigation />
          {children}
        </Providers>
      </body>
    </html>
  );
}
