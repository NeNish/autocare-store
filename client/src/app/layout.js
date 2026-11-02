import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Suspense } from 'react';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: { default: 'AutoCare · Windshield Care & Wiper Blades', template: '%s · AutoCare' },
  description:
    'Washer fluid tablets, rain-repellent sprays, waffle-weave microfiber towels and universal hook-type wiper blades.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <AuthProvider>
          <CartProvider>
            <Suspense fallback={<div className="sticky top-0 z-30 h-16 bg-ink" />}>
              <Header />
            </Suspense>
            <main className="flex-1">{children}</main>
            <Footer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
