const requiredFirebaseConfig = [
  ["NEXT_PUBLIC_FIREBASE_API_KEY", "apiKey"],
  ["NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", "authDomain"],
  ["NEXT_PUBLIC_FIREBASE_PROJECT_ID", "projectId"],
  ["NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", "messagingSenderId"],
  ["NEXT_PUBLIC_FIREBASE_APP_ID", "appId"],
];

export function getFirebaseConfig() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "",
  };

  const missingKeys = requiredFirebaseConfig
    .filter(([, configKey]) => !config[configKey])
    .map(([envKey]) => envKey);

  return {
    config,
    isConfigured: missingKeys.length === 0,
    missingKeys,
    appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    useEmulator: process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR === "true",
  };
}
