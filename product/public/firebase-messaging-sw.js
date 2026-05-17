// Firebase Messaging Service Worker
// Config is hardcoded (all NEXT_PUBLIC_ values) so Firebase initialises
// immediately on install — no postMessage race condition.

importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey:            'AIzaSyA-rMRXQ_iSvOF8NS-PcItEGh-iQ8U-kCs',
  authDomain:        'fitterverse.firebaseapp.com',
  projectId:         'fitterverse',
  storageBucket:     'fitterverse.firebasestorage.app',
  messagingSenderId: '46698969942',
  appId:             '1:46698969942:web:982e736a4e2223cb9734f7',
})

const messaging = firebase.messaging()

// Background message handler — fires when the app tab is not focused
messaging.onBackgroundMessage((payload) => {
  const notification = payload.notification ?? {}
  self.registration.showNotification(notification.title ?? 'Fitterverse', {
    body:     notification.body  ?? '',
    icon:     '/favicons/pwa-192.svg',
    badge:    '/favicons/favicon-32.svg',
    data:     payload.data ?? {},
    tag:      payload.data?.type ?? 'fitterverse',
    renotify: false,
  })
})

// Handle notification click — open the app to the relevant page
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || 'https://fitterverse.in/dashboard'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes('fitterverse.in') && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return clients.openWindow(url)
    })
  )
})
