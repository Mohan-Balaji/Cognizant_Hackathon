import { initializeApp, getApps } from "firebase/app";
import {getAuth} from "firebase/auth";
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTHDOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECTID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGEBUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASEMESSAGINGSENDERID   ,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APPID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps();
const auth = getAuth(app)
export {app,auth};