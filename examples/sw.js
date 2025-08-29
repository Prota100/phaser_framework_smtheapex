// Simple Service Worker for Phaser Framework 2025
const CACHE_NAME = 'phaser-framework-2025-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/basic-game-example.js',
  '/responsive-game-example.js',
  '/audio-game-example.js',
  '/gesture-game-example.js',
  '/performance-game-example.js',
  '/advanced-game-example.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('Cache install failed:', error);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

console.log('🎮 Phaser Framework 2025 Service Worker loaded!');