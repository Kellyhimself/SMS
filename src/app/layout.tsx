import { Toaster } from 'sonner'
import { Providers } from './providers'
import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { cn } from '@/lib/utils'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'School Management System',
  description: 'A comprehensive school management system for Kenyan private schools',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'School Management System',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#000000',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="School Management System" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={cn(
        inter.className,
        "min-h-screen bg-gradient-to-br from-green-50 via-yellow-50 to-orange-50 text-sm sm-mobile:text-base md-mobile:text-lg"
      )}>
        <Providers>
          <Toaster />
          {children}
        </Providers>
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(
                  function(registration) {
                    console.log('Service Worker registration successful with scope: ', registration.scope);
                    
                    // Check for updates every hour
                    setInterval(() => {
                      registration.update();
                    }, 10800000);

                    // Handle updates
                    registration.addEventListener('updatefound', () => {
                      const newWorker = registration.installing;
                      newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                          // New content is available, show update notification
                          if (confirm('New version available! Reload to update?')) {
                            window.location.reload();
                          }
                        }
                      });
                    });
                  },
                  function(err) {
                    console.log('Service Worker registration failed: ', err);
                  }
                );

                // Handle controller change
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                  console.log('New service worker activated');
                });
              });
            }
          `}
        </Script>
      </body>
    </html>
  )
}
