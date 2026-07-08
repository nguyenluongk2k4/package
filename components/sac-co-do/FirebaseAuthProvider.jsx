"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirebaseServices } from "../../lib/firebase/client";

const FirebaseAuthContext = createContext(null);

export function FirebaseAuthProvider({ children }) {
  const services = useMemo(() => getFirebaseServices(), []);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [adminProfile, setAdminProfile] = useState(null);
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const cachedProfile = localStorage.getItem("firebase_profile_cache");
      if (cachedProfile) {
        setProfile(JSON.parse(cachedProfile));
      }
    } catch (error) {
      console.warn("[FirebaseAuth] Load cached profile failed:", error);
    }
  }, []);

  useEffect(() => {
    const handlePageShow = () => {
      try {
        const cachedProfile = localStorage.getItem("firebase_profile_cache");
        if (cachedProfile) {
          setProfile(JSON.parse(cachedProfile));
        }
      } catch (error) {
        console.warn("[FirebaseAuth] Refresh cached profile failed:", error);
      }

      if (services.auth?.currentUser && services.db) {
        const uid = services.auth.currentUser.uid;
        const profileRef = doc(services.db, "users", uid);
        getDoc(profileRef)
          .then((profileSnapshot) => {
            if (profileSnapshot.exists()) {
              setProfile({ id: uid, ...profileSnapshot.data() });
            }
          })
          .catch((error) => {
            console.warn("[FirebaseAuth] Refresh profile on pageshow failed:", error);
          });
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [services.auth, services.db]);

  useEffect(() => {
    if (profile) {
      localStorage.setItem("firebase_profile_cache", JSON.stringify(profile));
    } else {
      localStorage.removeItem("firebase_profile_cache");
    }
  }, [profile]);

  const refreshProfile = useCallback(async () => {
    if (!services.auth || !services.auth.currentUser || !services.db) return;

    const uid = services.auth.currentUser.uid;
    const profileRef = doc(services.db, "users", uid);

    try {
      const profileSnapshot = await getDoc(profileRef);
      if (profileSnapshot.exists()) {
        setProfile({ id: uid, ...profileSnapshot.data() });
      }
    } catch (error) {
      console.error("[FirebaseAuth] Refresh profile failed:", error);
    }
  }, [services.auth, services.db]);

  useEffect(() => {
    if (!services.auth || !services.db) {
      setLoading(false);
      return undefined;
    }

    return onAuthStateChanged(services.auth, async (nextUser) => {
      setUser(nextUser);
      setAuthError("");

      if (!nextUser) {
        setProfile(null);
        setAdminProfile(null);
        setLoading(false);
        return;
      }

      setLoading(false);

      try {
        const adminRef = doc(services.db, "adminUsers", nextUser.uid);
        const adminSnapshot = await getDoc(adminRef);
        setAdminProfile(adminSnapshot.exists() ? { id: adminSnapshot.id, ...adminSnapshot.data() } : null);
      } catch (error) {
        console.warn("[FirebaseAuth] Load admin profile failed:", error);
        setAdminProfile(null);
      }

      try {
        const profileRef = doc(services.db, "users", nextUser.uid);
        const profileSnapshot = await getDoc(profileRef);

        if (profileSnapshot.exists()) {
          setProfile({ id: nextUser.uid, ...profileSnapshot.data() });
        } else {
          setProfile({
            id: nextUser.uid,
            displayName: nextUser.displayName || "",
            email: nextUser.email || "",
            photoURL: nextUser.photoURL || "",
          });
        }
      } catch (error) {
        console.warn("[FirebaseAuth] Load user profile failed:", error);
        setProfile({
          id: nextUser.uid,
          displayName: nextUser.displayName || "",
          email: nextUser.email || "",
          photoURL: nextUser.photoURL || "",
        });
      }
    });
  }, [services.auth, services.db]);

  async function loginWithGoogle() {
    if (!services.auth || !services.googleProvider) {
      throw new Error("Firebase Auth is not configured.");
    }

    const credential = await signInWithPopup(services.auth, services.googleProvider);

    try {
      const profileRef = doc(services.db, "users", credential.user.uid);
      const profileSnapshot = await getDoc(profileRef);
      const profileData = {
        displayName: credential.user.displayName || "",
        email: credential.user.email || "",
        photoURL: credential.user.photoURL || "",
        lastLoginAt: serverTimestamp(),
      };

      await setDoc(
        profileRef,
        profileSnapshot.exists()
          ? profileData
          : {
              ...profileData,
              createdAt: serverTimestamp(),
            },
        { merge: true }
      );
    } catch (error) {
      console.warn("[FirebaseAuth] Save Google profile failed:", error);
    }

    return credential;
  }

  async function loginWithEmail(email, password) {
    if (!services.auth) {
      throw new Error("Firebase Auth is not configured.");
    }

    const credential = await signInWithEmailAndPassword(services.auth, email, password);

    try {
      const profileRef = doc(services.db, "users", credential.user.uid);
      await setDoc(
        profileRef,
        {
          lastLoginAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      console.warn("[FirebaseAuth] Update lastLoginAt failed:", error);
    }

    return credential;
  }

  async function registerWithEmail(email, password, displayName) {
    if (!services.auth) {
      throw new Error("Firebase Auth is not configured.");
    }

    const credential = await createUserWithEmailAndPassword(services.auth, email, password);

    if (displayName) {
      await updateProfile(credential.user, { displayName });
    }

    try {
      const profileRef = doc(services.db, "users", credential.user.uid);
      await setDoc(
        profileRef,
        {
          displayName: displayName || "",
          email: email || "",
          photoURL: "",
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      console.warn("[FirebaseAuth] Create initial profile failed:", error);
    }

    return credential;
  }

  async function logout() {
    if (services.auth) {
      await signOut(services.auth);
    }
  }

  const value = {
    ...services,
    user,
    profile,
    adminProfile,
    isAdmin: Boolean(adminProfile?.active && adminProfile?.role),
    authError,
    loading,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    logout,
    refreshProfile,
  };

  return <FirebaseAuthContext.Provider value={value}>{children}</FirebaseAuthContext.Provider>;
}

export function useFirebaseAuth() {
  const context = useContext(FirebaseAuthContext);

  if (!context) {
    throw new Error("useFirebaseAuth must be used inside FirebaseAuthProvider.");
  }

  return context;
}
