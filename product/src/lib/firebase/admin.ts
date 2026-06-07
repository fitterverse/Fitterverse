import admin from 'firebase-admin'

let cachedApp: admin.app.App | null = null

function getServiceAccountJson() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()
  if (!raw) return null

  const unwrapped =
    (raw.startsWith("'") && raw.endsWith("'")) ||
    (raw.startsWith('"') && raw.endsWith('"'))
      ? raw.slice(1, -1)
      : raw

  return unwrapped
}

function initAdminApp(): admin.app.App {
  if (cachedApp) return cachedApp
  if (admin.apps.length > 0) {
    cachedApp = admin.apps[0]!
    return cachedApp
  }

  const serviceAccountJson = getServiceAccountJson()

  try {
    const credential = serviceAccountJson
      ? admin.credential.cert(JSON.parse(serviceAccountJson))
      : admin.credential.applicationDefault()

    cachedApp = admin.initializeApp({
      credential,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    })

    return cachedApp
  } catch (cause) {
    console.error('FIREBASE ADMIN INIT ERROR', cause)

    throw new Error(
      serviceAccountJson
        ? 'FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.'
        : 'Firebase Admin credentials are not configured.'
    )
  }
}

export function getAdminMessaging() {
  return admin.messaging(initAdminApp())
}

export default initAdminApp
