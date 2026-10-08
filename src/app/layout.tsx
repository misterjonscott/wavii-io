import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Pacifico } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

const pacifico = Pacifico({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-pacifico',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Wavii.io | Live Event & Weather Discovery',
  description: 'Spatial event discovery powered by SeatGeek, Mapbox, and Open-Meteo.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} ${pacifico.variable} dark`}
    >
      <body className="font-sans antialiased bg-surface-dark text-slate-50 selection:bg-purple-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}