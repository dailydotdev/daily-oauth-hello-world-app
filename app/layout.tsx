import type { ReactNode } from 'react';
import './globals.css';

const title = 'daily.dev Hello world';
const description =
  'Your daily.dev, through the public API. Sign in with daily.dev to see your profile, feed and bookmarks, then use the docs and source to build your own app on top of daily.dev.';
const ogImage =
  'https://media.daily.dev/image/upload/s--VAY5ToZt--/f_auto/v1724209435/public/daily.dev%20-%20open%20graph';

export const metadata = {
  title,
  description,
  icons: {
    icon: [
      { url: 'https://daily.dev/favicon.ico', sizes: 'any' },
      { url: 'https://daily.dev/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: 'https://daily.dev/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: 'https://daily.dev/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    siteName: 'daily.dev',
    title,
    description,
    images: [{ url: ogImage }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@dailydotdev',
    title,
    description,
    images: [ogImage],
  },
};

const RootLayout = ({ children }: { children: ReactNode }) => (
  <html lang="en">
    <body>{children}</body>
  </html>
);

export default RootLayout;
