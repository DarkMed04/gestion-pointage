import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans_Arabic, Outfit } from 'next/font/google';
import './globals.css';

const arabicFont = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-arabic',
});

const frenchFont = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-french',
});

export const metadata: Metadata = {
  title: 'Gestionnaire de Pointage | تدبير الحضور',
  description: 'Système sécurisé de gestion de pointage (Admin & Sécurité)',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#070b14',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${arabicFont.variable} ${frenchFont.variable} antialiased selection:bg-emerald-500/30`}
      >
        {children}
      </body>
    </html>
  );
}