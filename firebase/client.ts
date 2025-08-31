
import { getApp, getApps, initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyChSpsELdLS4hzJ3YW7v7LNuFyfhz6lY6U",
    authDomain: "prepguru-9ad9e.firebaseapp.com",
    projectId: "prepguru-9ad9e",
    storageBucket: "prepguru-9ad9e.firebasestorage.app",
    messagingSenderId: "484624729828",
    appId: "1:484624729828:web:6809453b40aacf06f64ef1",
    measurementId: "G-28W7VQ4ENV"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
// const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);