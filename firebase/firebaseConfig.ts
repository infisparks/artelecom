// src/firebase/firebaseConfig.ts
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// Firebase configuration using environment variables
const firebaseConfig = {
    apiKey: "AIzaSyDF3A99qxqjfBr1w7w3hD-30caQ7ISVVw4",
    authDomain: "artravels-af2e9.firebaseapp.com",
    databaseURL: "https://artravels-af2e9-default-rtdb.firebaseio.com",
    projectId: "artravels-af2e9",
    storageBucket: "artravels-af2e9.firebasestorage.app",
    messagingSenderId: "614343100995",
    appId: "1:614343100995:web:51430af2e1d106e61f62f6",
    measurementId: "G-CRBFL3871B"
  };
  
// Initialize Firebase app if not already initialized
let app: FirebaseApp;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Firebase services
const auth = getAuth(app);
const database = getDatabase(app);

// Export Firebase services for use in other parts of the app
export { auth, database };

