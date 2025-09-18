import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyDhXlMGUO_ob18UQHWPGxrJLpt_uN-_gz8",
  authDomain: "digital-asset-mapping.firebaseapp.com",
  projectId: "digital-asset-mapping",
  storageBucket: "digital-asset-mapping.firebasestorage.app",
  messagingSenderId: "598181947688",
  appId: "1:598181947688:web:4a13be2b0308f22044c81d"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export default app