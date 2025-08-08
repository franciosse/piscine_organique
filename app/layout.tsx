//app/layout.tsx
import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';

export const metadata: Metadata = {
  title: 'Piscine Organique',
  description: 'Construisez votre piscine organique avec nous'
};

export const viewport: Viewport = {
  maximumScale: 1
};

const manrope = Manrope({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`bg-white dark:bg-gray-950 text-black dark:text-white ${manrope.className}`}>
      <body className="min-h-[100dvh] bg-gray-50">{children}</body>
    </html>
  );
}
