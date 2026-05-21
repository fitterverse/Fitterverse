// Firebase Admin SDK — server-side only.
import admin from 'firebase-admin'

function initAdminApp(): admin.app.App {
  if (admin.apps.length > 0) return admin.apps[0]!

  let serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  // 10X RESILIENCE: Handle cases where the string is wrapped in extra quotes from .env
  if (serviceAccount) {
    serviceAccount = serviceAccount.trim();
    if (serviceAccount.startsWith("'") && serviceAccount.endsWith("'")) {
      serviceAccount = serviceAccount.slice(1, -1);
    }
    if (serviceAccount.startsWith('"') && serviceAccount.endsWith('"')) {
      serviceAccount = serviceAccount.slice(1, -1);
    }
  }

  try {
    const credential = serviceAccount
      ? admin.credential.cert(JSON.parse(serviceAccount))
      : admin.credential.applicationDefault();

    return admin.initializeApp({
      credential,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  } catch (error) {
    console.error("❌ FIREBASE ADMIN INIT ERROR:", error);
    // Fallback to basic init to prevent build crash
    return admin.initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  }
}

const adminApp = initAdminApp()
export const adminMessaging = admin.messaging(adminApp)
export default adminApp