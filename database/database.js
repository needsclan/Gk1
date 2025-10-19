import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

// firebase konfiguration for projektet
const firebaseConfig = {
  apiKey: "AIzaSyCJU1MKsdeLP7hieUZghstG_YiuFlEHl0U",
  authDomain: "login-test-ed02f.firebaseapp.com",
  projectId: "login-test-ed02f",
  storageBucket: "login-test-ed02f.appspot.com",
  messagingSenderId: "175138064797",
  appId: "1:175138064797:web:97bfb158f7d2ccdbb80774",
  databaseURL: "https://login-test-ed02f-default-rtdb.europe-west1.firebasedatabase.app",
};

// initialiser firebase app
const app = initializeApp(firebaseConfig);

// auth med lokal persistence via AsyncStorage
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// realtime database reference
const rtdb = getDatabase(app);

// peg eksplicit på gs bucket fra storage konsollen
const storage = getStorage(app, "gs://login-test-ed02f.firebasestorage.app");

// eksporter instanser
export { auth, rtdb, storage };
