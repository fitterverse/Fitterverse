// Firebase Messaging Service Worker
// Handles background push notifications when the app tab is not in focus.
// This file must live at the root of the public directory so FCM can find it at /firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js')

// Config is injected at runtime via a message from the main thread.
// We cache it on first receipt so subsequent background messages work.
let firebaseConfig = null

self.addEventListener('message', (event) => {
  if (event.data?.type === 'FIREBASE_CONFIG') {
    firebaseConfig = event.data.config
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig)
    }
  }
})

function getMessaging() {
  if (!firebase.apps.length) return null
  return firebase.messaging()
}

// Background message handler — fires when the app is not focused
self.addEventListener('push', () => {
  // FCM's compat SDK handles this automatically once messaging is initialized.
  // This listener ensures the SW stays active.
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

// Lazily init and wire background handler after config arrives
function tryInitMessaging() {
  const messaging = getMessaging()
  if (!messaging) return
  messaging.onBackgroundMessage((payload) => {
    const { title, body, icon, badge, data } = payload.notification ?? {}
    self.registration.showNotification(title ?? 'Fitterverse', {
      body:  body  ?? '',
      icon:  icon  ?? '/favicons/pwa-192.svg',
      badge: badge ?? '/favicons/favicon-32.svg',
      data:  payload.data ?? {},
      tag:   payload.data?.type ?? 'fitterverse',
      renotify: false,
    })
  })
}

// Retry init in case config arrives after SW is already registered
let initAttempts = 0
const initInterval = setInterval(() => {
  tryInitMessaging()
  if (firebase.apps.length || ++initAttempts > 10) clearInterval(initInterval)
}, 500)
