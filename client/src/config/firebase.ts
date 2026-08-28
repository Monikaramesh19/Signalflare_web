import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyC26PndDoc2Wk329c7cmPGhew65ZO4BNks",
    authDomain: "signalflare-ff189.firebaseapp.com",
    projectId: "signalflare-ff189",
    storageBucket: "signalflare-ff189.firebasestorage.app",
    messagingSenderId: "14507113873",
    appId: "1:14507113873:web:eb489353a6bdf8c353ae30",
    measurementId: "G-ZK8YSSYRR3"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
