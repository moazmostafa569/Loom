// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA-d11rM6MdAsaqbam_8Nlb_4ke7gXU1DA",
  authDomain: "loom-e8754.firebaseapp.com",
  projectId: "loom-e8754",
  storageBucket: "loom-e8754.firebasestorage.app",
  messagingSenderId: "570923330669",
  appId: "1:570923330669:web:b32dadb94572614336a364",
  measurementId: "G-PFBYC6X45N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export { auth };