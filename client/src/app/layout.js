import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Suspense } from 'react';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { CompareProvider } from '@/context/CompareContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MotionRuntime from '@/components/lux/MotionRuntime';
import Cursor from '@/components/lux/Cursor';
import Intro from '@/components/lux/Intro';
import Assistant from '@/components/vision/Assistant';
import CompareTray from '@/components/vision/CompareTray';

export const metadata = {
  title: { default: 'AutoCare · Visibility, engineered', template: '%s · AutoCare' },
  description:
    'Visibility technology for your windshield: beam wiper blades, rain repellent, concentrated washer fluid and microfiber care, with a vehicle compatibility finder and a care assistant.',
};

export const viewport = {
  themeColor: '#050608',
};

// Runs before first paint: enables motion styles (unless the visitor prefers reduced
// motion) and plays the opening sequence only once per session, on the homepage.
const bootScript = `(function(){try{var d=document.documentElement;var r=window.matchMedia('(prefers-reduced-motion: reduce)').matches;if(!r)d.classList.add('motion-ok');if(r||sessionStorage.getItem('ac-intro')||location.pathname!=='/')d.classList.add('intro-seen');sessionStorage.setItem('ac-intro','1');}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body className="flex min-h-full flex-col bg-obsidian font-sans text-frost">
        <a
          href="#main"
          className="sr-only z-[110] rounded-full bg-ice px-5 py-3 text-sm text-obsidian focus:not-sr-only focus:fixed focus:left-6 focus:top-6"
        >
          Skip to content
        </a>
        <Intro />
        <AuthProvider>
          <CartProvider>
            <CompareProvider>
              <Suspense fallback={<div className="fixed inset-x-0 top-0 z-40 h-20" />}>
                <Header />
              </Suspense>
              <main id="main" className="flex-1">
                {children}
              </main>
              <Footer />
              <Suspense fallback={null}>
                <CompareTray />
              </Suspense>
              <Assistant />
            </CompareProvider>
          </CartProvider>
        </AuthProvider>
        <div className="grain" aria-hidden="true" />
        <Cursor />
        <MotionRuntime />
      </body>
    </html>
  );
}
