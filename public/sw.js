const CACHE_NAME = 'school-app-cache-v1';
const NEXT_STATIC_CACHE = 'next-static-assets-v1';
const OFFLINE_URL = '/offline.html';

const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/offline.html',
  // Add dynamic routes to cache
  '/dashboard',
  '/fees',
  '/students',
  '/communications',
  '/finance',
  '/settings'
];

// Updated NEXT_STATIC_ASSETS to include missing chunk filenames from error logs
const NEXT_STATIC_ASSETS = [
  // Core Next.js files
  '/_next/static/chunks/main.js',
  '/_next/static/chunks/webpack.js',
  '/_next/static/chunks/pages/_app.js',
  '/_next/static/chunks/pages/_error.js',
  '/_next/static/css/app.css',
  
  // App-specific chunks
  '/_next/static/chunks/app/layout-81b4e15978189f07.js',
  '/_next/static/chunks/app/page-10d169074b71cf3d.js',
  '/_next/static/chunks/src_app_globals_css_f9ee138c._.single.css',
  '/_next/static/chunks/src_app_page_tsx_c50bdba1._.js',
  '/_next/static/chunks/src_app_(auth)_login_page_tsx_c50bdba1._.js',
  '/_next/static/chunks/src_app_not-found_tsx_c50bdba1._.js',
  '/_next/static/chunks/src_app_(dashboard)_layout_tsx_c50bdba1._.js',
  '/_next/static/chunks/src_app_(dashboard)_dashboard_page_tsx_63d9e8c0._.js',
  '/_next/static/chunks/src_app_layout_tsx_ea9287a8._.js',
  '/_next/static/chunks/src_app_(dashboard)_layout_tsx_a1249c27._.js',
  '/_next/static/chunks/src_app_page_tsx_a1249c27._.js',
  '/_next/static/chunks/src_app_not-found_tsx_a1249c27._.js',
  
  // Next.js framework files
  '/_next/static/chunks/node_modules_next_dist_client_8f19e6fb._.js',
  '/_next/static/chunks/node_modules_next_dist_compiled_2ce9398a._.js',
  '/_next/static/chunks/node_modules_next_dist_2ecbf5fa._.js',
  '/_next/static/chunks/node_modules_next_dist_build_polyfills_polyfill-nomodule.js',
  '/_next/static/chunks/node_modules_next_dist_b758c999._.js',
  '/_next/static/chunks/node_modules_next_dist_1a6ee436._.js',
  
  // React and other dependencies
  '/_next/static/chunks/node_modules_react-dom_82bb97c6._.js',
  '/_next/static/chunks/node_modules_@supabase_node-fetch_browser_78c6afe4.js',
  '/_next/static/chunks/node_modules_@supabase_node-fetch_browser_4e855e84.js',
  
  // Fonts and styles
  '/_next/static/media/e4af272ccee01ff0-s.p.woff2',
  '/_next/static/chunks/[next]_internal_font_google_inter_59dee874_module_css_f9ee138c._.single.css',
  '/_next/static/chunks/[next]_internal_font_google_inter_e345bb4c_module_css_f9ee138c._.single.css',
  
  // Additional chunks
  '/_next/static/chunks/webpack-1ccbf55278267827.js',
  '/_next/static/chunks/main-app-d41d56f775a954bb.js',
  '/_next/static/chunks/ed0b0_@swc_helpers_cjs_d9e50ee1._.js',
  '/_next/static/chunks/polyfills-42372ed130431b0a.js'
];

// Modified install event to precache critical Next.js static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        ASSETS_TO_CACHE.map((url) =>
          fetch(url)
            .then((response) => {
              if (!response.ok) throw new Error(`Request for ${url} failed`);
              return cache.put(url, response);
            })
            .catch((err) => {
              console.warn('Asset failed to cache:', url, err);
            })
        )
      );
      }),
      caches.open(NEXT_STATIC_CACHE).then((cache) => {
        return Promise.all(
          NEXT_STATIC_ASSETS.map((url) =>
            fetch(url)
              .then((response) => {
                if (!response.ok) throw new Error(`Request for ${url} failed`);
                return cache.put(url, response);
              })
              .catch((err) => {
                console.warn('Next.js asset failed to cache:', url, err);
              })
          )
        );
      })
    ])
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== NEXT_STATIC_CACHE)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Modified fetch event to handle offline navigation better
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Handle navigation requests (e.g., /dashboard)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the successful response
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // Try to get the requested URL from cache
          return caches.match(event.request.url)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // If not in cache, try to get the app shell
              return caches.match('/')
                .then((shellResponse) => {
                  if (shellResponse) {
                    return shellResponse;
                  }
                  // If all else fails, show offline page
                  return caches.match(OFFLINE_URL);
                });
            });
        })
    );
    return;
  }

  // Runtime cache for Next.js static assets (JS/CSS chunks, fonts, etc.)
  if (event.request.url.includes('/_next/static/')) {
    event.respondWith(
      caches.open(NEXT_STATIC_CACHE).then((cache) =>
        cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          return fetch(event.request)
            .then((response) => {
              if (!response.ok) throw new Error(`Request for ${event.request.url} failed`);
              cache.put(event.request, response.clone());
              return response;
            })
            .catch(() => {
              // Return a valid Response for failed requests
              return new Response('', { 
                status: 503, 
                statusText: 'Service Unavailable',
                headers: new Headers({
                  'Content-Type': 'text/plain'
                })
              });
            });
        })
      )
    );
    return;
  }

  // Runtime cache for icons, fonts, images, etc.
  if (event.request.url.includes('/icons/') || 
      event.request.destination === 'image' || 
      event.request.destination === 'font') {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          return fetch(event.request)
            .then((response) => {
              if (!response.ok) throw new Error(`Request for ${event.request.url} failed`);
              cache.put(event.request, response.clone());
              return response;
            })
            .catch(() => {
              return new Response('', { 
                status: 503, 
                statusText: 'Service Unavailable',
                headers: new Headers({
                  'Content-Type': 'text/plain'
                })
              });
            });
        })
      )
    );
    return;
  }

  // Default fetch handler
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request)
        .then((response) => {
          // Cache successful responses
          if (response.ok) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('/') || caches.match(OFFLINE_URL);
          }
          return new Response('', { 
            status: 503, 
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain'
            })
          });
        });
    })
  );
});
