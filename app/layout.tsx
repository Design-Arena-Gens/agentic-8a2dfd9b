import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Luna AI Companion',
  description: 'An emotionally intelligent AI companion experience created for the web.'
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
