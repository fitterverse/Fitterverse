// Firebase Admin SDK — server-side only.
// Uses Application Default Credentials on Firebase App Hosting (auto-provided).
// For local dev: set FIREBASE_SERVICE_ACCOUNT_JSON env var with the service account JSON string.

import admin from 'firebase-admin'

function initAdminApp(): admin.app.App {
  if (admin.apps.length > 0) return admin.apps[0]!

  const credential = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
    ? admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON))
    : admin.credential.applicationDefault()

  return admin.initializeApp({
    credential,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  })
}

const adminApp = initAdminApp()
export const adminMessaging = admin.messaging(adminApp)
export default adminApp
