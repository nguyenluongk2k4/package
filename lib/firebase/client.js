import { getApp, getApps, initializeApp } from "firebase/app";
import {
  connectAuthEmulator,
  getAuth,
  GoogleAuthProvider,
} from "firebase/auth";
import {
  connectFirestoreEmulator,
  initializeFirestore,
} from "firebase/firestore";
import { getFirebaseConfig } from "./config";

let cachedServices = null;
let emulatorConnected = false;

export function getFirebaseServices() {
  if (cachedServices) {
    return cachedServices;
  }

  const env = getFirebaseConfig();

  if (!env.isConfigured) {
    cachedServices = {
      ...env,
      app: null,
      auth: null,
      db: null,
      googleProvider: null,
    };
    return cachedServices;
  }

  const app = getApps().length ? getApp() : initializeApp(env.config);
  const auth = getAuth(app);
  const db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    useFetchStreams: false,
  });
  const googleProvider = new GoogleAuthProvider();

  if (env.useEmulator && typeof window !== "undefined" && !emulatorConnected) {
    connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "localhost", 8080);
    emulatorConnected = true;
  }

  cachedServices = {
    ...env,
    app,
    auth,
    db,
    googleProvider,
  };

  return cachedServices;
}
