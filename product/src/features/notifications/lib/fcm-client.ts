'use client'

// Client-side FCM: request permission, get token, send to server.
// All imports are dynamic to avoid SSR bundling issues.

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY

export async function requestPermissionAndGetToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  if (!('Notification' in window)) return null

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return null

  return getToken()
}

export async function getToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  if (!VAPID_KEY) {
    console.warn('[FCM] NEXT_PUBLIC_FIREBASE_VAPID_KEY is not set')
    return null
  }

  try {
    const { getMessaging, getToken: fcmGetToken } = await import('firebase/messaging')
    const { default: app } = await import('@/features/auth/client/firebase')

    const registration = await registerServiceWorker()
    if (!registration) return null

    const messaging = getMessaging(app)

    // Send firebase config to service worker so it can init FCM
    sendConfigToServiceWorker(registration)

    return await fcmGetToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    })
  } catch (err) {
    console.error('[FCM] getToken failed:', err)
    return null
  }
}

export async function deleteToken(): Promise<void> {
  try {
    const { getMessaging, deleteToken: fcmDeleteToken } = await import('firebase/messaging')
    const { default: app } = await import('@/features/auth/client/firebase')
    const messaging = getMessaging(app)
    await fcmDeleteToken(messaging)
  } catch {
    // Ignore — token may already be gone
  }
}

async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  try {
    return await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
    })
  } catch (err) {
    console.error('[FCM] SW registration failed:', err)
    return null
  }
}

function sendConfigToServiceWorker(registration: ServiceWorkerRegistration) {
  const target = registration.installing ?? registration.waiting ?? registration.active
  if (!target) return
  target.postMessage({
    type: 'FIREBASE_CONFIG',
    config: {
      apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    },
  })
}

export function getNotificationPermissionState(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined') return 'unsupported'
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission
}
