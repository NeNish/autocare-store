import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import '@fontsource/cormorant-garamond/latin-300.css';
import '@fontsource/cormorant-garamond/latin-400.css';
import '@fontsource/cormorant-garamond/latin-500.css';
import '@fontsource/cormorant-garamond/latin-300-italic.css';
import '@fontsource/cormorant-garamond/latin-400-italic.css';
import { Suspense } from 'react';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MotionRuntime from '@/components/lux/MotionRuntime';
import Cursor from '@/components/lux/Cursor';
import Intro from '@/components/lux/Intro';

export const metadata = {
  title: { default: 'AutoCare · The Atelier of Clarity', template: '%s · AutoCare' },
  description:
    'Windshield care, elevated. Concentrated washer fluid tablets, rain-repellent sprays, waffle-weave microfiber towels and universal hook-type wiper blades.',
};

export const viewport = {
  themeColor: '#07080b',
};

// Runs before first paint: enables motion styles (unless the visitor prefers
// reduced motion) and shows the opening sequence only once per session.
const bootScript = `(function(){try{var d=document.documentElement;var r=window.matchMedia('(prefers-reduced-motion: reduce)').matches;if(!r)d.classList.add('motion-ok');if(r||sessionStorage.getItem('ac-intro')||location.pathname!=='/')d.classList.add('intro-seen');sessionStorage.setItem('ac-intro','1');}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body className="flex min-h-full flex-col bg-obsidian font-sans text-ivory">
        <a
          href="#main"
          className="sr-only z-[110] rounded-full bg-gold-light px-5 py-3 text-sm text-obsidian focus:not-sr-only focus:fixed focus:left-6 focus:top-6"
        >
          Skip to content
        </a>
        <Intro />
        <AuthProvider>
          <CartProvider>
            <Suspense fallback={<div className="fixed inset-x-0 top-0 z-40 h-20" />}>
              <Header />
            </Suspense>
            <main id="main" className="flex-1">
              {children}
            </main>
            <Footer />
          </CartProvider>
        </AuthProvider>
        <div className="grain" aria-hidden="true" />
        <Cursor />
        <MotionRuntime />
      </body>
    </html>
  );
}
