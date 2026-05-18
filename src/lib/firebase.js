import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAGrO_8HAT8P9sKupu1nI5OMXOVJYvJN9M",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "expedicao-fotus-agro.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "expedicao-fotus-agro",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "expedicao-fotus-agro.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "837961978108",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:837961978108:web:24e40f8f57097fc0c88779",
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

// Dados salvos em: artifacts/expedicao-fotus-agro/public/data/{colecao}
const DATA_ROOT = 'artifacts/expedicao-fotus-agro/public/data'
export const colPath = (col) => `${DATA_ROOT}/${col}`

// Prefixo para Storage (uploads de arquivos)
export const storagePrefixo = 'expedicao-fotus-agro'
