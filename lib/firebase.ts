import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import { createUserWithEmailAndPassword, getAuth, type Auth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
}

const firebaseEnabled = Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId)
let cachedAuth: Auth | null = null

function getFirebaseAuth(): Auth {
  if (!firebaseEnabled) {
    const error = new Error('Firebase is not configured') as Error & { code?: string }
    error.code = 'firebase/not-configured'
    throw error
  }

  if (!cachedAuth) {
    const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
    cachedAuth = getAuth(app)
  }
  return cachedAuth
}

export async function createAccountForRegistration(email: string, password: string): Promise<string> {
  const credential = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password)
  return credential.user.getIdToken(true)
}

export function firebaseErrorCode(error: unknown): string | undefined {
  return (error as { code?: string })?.code
}

export const MIN_PASSWORD_LENGTH = 6
