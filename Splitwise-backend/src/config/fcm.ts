import admin from 'firebase-admin';
import { env } from './env';
import { createLogger } from '../shared/utils/logger';

const log = createLogger('fcm');

let initialized = false;

export function initFirebase(): void {
  if (initialized) return;

  const serviceAccountJson = Buffer.from(
    env.FIREBASE_SERVICE_ACCOUNT_BASE64,
    'base64'
  ).toString('utf-8');

  const serviceAccount = JSON.parse(serviceAccountJson) as admin.ServiceAccount;

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  initialized = true;
  log.info('Firebase Admin SDK initialized');
}

export function getFirebaseMessaging(): admin.messaging.Messaging {
  if (!initialized) {
    initFirebase();
  }
  return admin.messaging();
}

export { admin };
