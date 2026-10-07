import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'daily.dev Hello world',
  description:
    'Your daily.dev, through the public API. Sign in with daily.dev to see your profile, feed and bookmarks, then use the docs and source to build your own app on top of daily.dev.',
};

const RootLayout = ({ children }: { children: ReactNode }) => (
  <html lang="en">
    <body>{children}</body>
  </html>
);

export default RootLayout;
