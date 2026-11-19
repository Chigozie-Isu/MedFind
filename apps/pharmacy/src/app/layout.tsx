import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Manrope, Poppins } from 'next/font/google';
import { themeCss, themeInitScript } from '@medfind/ui/web';
import './globals.css';

// Headings use Poppins; body copy and buttons use Manrope.
const poppins = Poppins({ variable: '--font-poppins', weight: ['600'], subsets: ['latin'] });
const manrope = Manrope({ variable: '--font-manrope', weight: ['400', '500', '600'], subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MedFind Pharmacy',
  description: 'Manage reservations, inventory and earnings for your pharmacy.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${poppins.variable} ${manrope.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <style dangerouslySetInnerHTML={{ __html: themeCss() }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
