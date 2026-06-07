"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
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
    if (!services.auth || !services.db) {
      setLoading(false);
      return undefined;
    }

    return onAuthStateChanged(services.auth, async (nextUser) => {
      console.log("🔄 [FirebaseAuth] onAuthStateChanged kích hoạt. User:", nextUser ? `${nextUser.email} (UID: ${nextUser.uid})` : "Chưa đăng nhập");
      setUser(nextUser);
      setProfile(null);
      setAdminProfile(null);
      setAuthError("");

      if (!nextUser) {
        setLoading(false);
        console.log("🔄 [FirebaseAuth] Không có user phiên hiện tại, dừng lại.");
        return;
      }

      try {
        console.log("🔄 [FirebaseAuth] Bắt đầu tải dữ liệu Firestore cho user:", nextUser.uid);
        
        // Cố gắng đọc admin profile, nếu offline hoặc lỗi thì bỏ qua hoặc để null
        let adminData = null;
        try {
          console.log("🔄 [FirebaseAuth] Đang đọc adminUsers collection...");
          const adminSnapshot = await getDoc(doc(services.db, "adminUsers", nextUser.uid));
          if (adminSnapshot.exists()) {
            adminData = { id: adminSnapshot.id, ...adminSnapshot.data() };
            console.log("🔄 [FirebaseAuth] Đã tìm thấy admin profile:", adminData);
          } else {
            console.log("🔄 [FirebaseAuth] UID không tồn tại trong danh sách adminUsers.");
          }
        } catch (adminError) {
          console.warn("⚠️ [FirebaseAuth] Không thể lấy admin profile từ Firestore (offline hoặc lỗi):", adminError);
        }
        setAdminProfile(adminData);

        // Cố gắng đọc user profile
        const profileRef = doc(services.db, "users", nextUser.uid);
        let userProfileData = null;
        let profileExists = false;

        try {
          console.log("🔄 [FirebaseAuth] Đang đọc users collection...");
          const profileSnapshot = await getDoc(profileRef);
          if (profileSnapshot.exists()) {
            userProfileData = profileSnapshot.data();
            profileExists = true;
            console.log("🔄 [FirebaseAuth] Đã tìm thấy user profile:", userProfileData);
          } else {
            console.log("🔄 [FirebaseAuth] Chưa có profile user trong DB.");
          }
        } catch (profileGetError) {
          console.warn("⚠️ [FirebaseAuth] Không thể lấy user profile từ Firestore (offline hoặc lỗi):", profileGetError);
        }

        const profileData = {
          displayName: nextUser.displayName || "",
          email: nextUser.email || "",
          photoURL: nextUser.photoURL || "",
          lastLoginAt: serverTimestamp(),
        };

        // Cố gắng cập nhật user profile lên Firestore
        try {
          console.log("🔄 [FirebaseAuth] Đang cập nhật metadata profile lên Firestore...");
          await setDoc(profileRef, profileExists ? profileData : {
            ...profileData,
            createdAt: serverTimestamp(),
          }, { merge: true });
          console.log("🔄 [FirebaseAuth] Đã đồng bộ profile lên Firestore thành công.");
        } catch (profileSetError) {
          console.warn("⚠️ [FirebaseAuth] Không thể cập nhật profile lên Firestore (offline hoặc lỗi):", profileSetError);
        }

        // Thiết lập profile cho state, ưu tiên dữ liệu từ firestore, fallback sang dữ liệu auth mặc định
        setProfile(
          userProfileData
            ? { id: nextUser.uid, ...userProfileData }
            : { id: nextUser.uid, ...profileData }
        );
        console.log("🔄 [FirebaseAuth] Đã lưu profile thành công vào component state.");
      } catch (error) {
        console.error("❌ [FirebaseAuth] Lỗi luồng load profile:", error);
        const isOffline = error.code === "unavailable" || 
                          error.message?.toLowerCase().includes("offline") ||
                          error.message?.toLowerCase().includes("unavailable");
        
        if (isOffline) {
          console.log("🔄 [FirebaseAuth] Đang offline, sử dụng thông tin Auth làm fallback profile...");
          setProfile({
            id: nextUser.uid,
            displayName: nextUser.displayName || "User",
            email: nextUser.email || "",
            photoURL: nextUser.photoURL || "",
            isOffline: true,
          });
        } else {
          setAuthError(error.message || "Không đọc được dữ liệu Firebase sau khi đăng nhập.");
        }
      } finally {
        setLoading(false);
        console.log("🔄 [FirebaseAuth] Hoàn thành xử lý AuthState.");
      }
    });
  }, [services.auth, services.db]);

  async function loginWithGoogle() {
    if (!services.auth || !services.googleProvider) {
      throw new Error("Firebase Auth is not configured.");
    }

    return signInWithPopup(services.auth, services.googleProvider);
  }

  async function loginWithEmail(email, password) {
    if (!services.auth) {
      throw new Error("Firebase Auth is not configured.");
    }

    return signInWithEmailAndPassword(services.auth, email, password);
  }

  async function registerWithEmail(email, password, displayName) {
    if (!services.auth) {
      throw new Error("Firebase Auth is not configured.");
    }

    const credential = await createUserWithEmailAndPassword(services.auth, email, password);
    if (displayName) {
      await updateProfile(credential.user, { displayName });
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
