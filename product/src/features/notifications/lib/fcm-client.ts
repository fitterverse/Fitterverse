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


export function getNotificationPermissionState(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined') return 'unsupported'
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission
}
