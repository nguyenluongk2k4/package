"use client";

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
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

  // Đọc dữ liệu từ cache trong useEffect đầu tiên (chạy sau khi mount ở client) để tránh lỗi hydration mismatch
  useEffect(() => {
    try {
      const cachedUser = localStorage.getItem("firebase_user_cache");
      const cachedProfile = localStorage.getItem("firebase_profile_cache");
      if (cachedUser) {
        setUser(JSON.parse(cachedUser));
        setLoading(false);
      }
      if (cachedProfile) {
        setProfile(JSON.parse(cachedProfile));
      }
    } catch (e) {
      console.warn("⚠️ [FirebaseAuth] Lỗi nạp cache từ localStorage:", e);
    }
  }, []);

  // Lắng nghe sự kiện pageshow để phát hiện và nạp lại trạng thái mới nhất từ cache/Firestore khi quay lại (Back/Forward) bằng trình duyệt
  useEffect(() => {
    const handlePageShow = () => {
      console.log("🔄 [FirebaseAuth] Trình duyệt kích hoạt pageshow (bfcache). Đồng bộ trạng thái...");
      try {
        const cachedUser = localStorage.getItem("firebase_user_cache");
        const cachedProfile = localStorage.getItem("firebase_profile_cache");
        if (cachedUser) {
          setUser(JSON.parse(cachedUser));
        }
        if (cachedProfile) {
          setProfile(JSON.parse(cachedProfile));
        }
      } catch (e) {
        console.warn("⚠️ [FirebaseAuth] Lỗi làm mới dữ liệu từ cache trong pageshow:", e);
      }

      // Đọc trực tiếp từ Firestore để lấy thông tin mới nhất trên server ngầm
      if (services.auth && services.auth.currentUser && services.db) {
        const uid = services.auth.currentUser.uid;
        const profileRef = doc(services.db, "users", uid);
        getDoc(profileRef)
          .then((profileSnapshot) => {
            if (profileSnapshot.exists()) {
              const data = profileSnapshot.data();
              setProfile({ id: uid, ...data });
              console.log("🔄 [FirebaseAuth] Cập nhật profile ngầm thành công sau pageshow:", data);
            }
          })
          .catch((err) => {
            console.warn("⚠️ [FirebaseAuth] Lỗi cập nhật profile ngầm sau pageshow:", err);
          });
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [services.auth, services.db]);

  // Đồng bộ user vào localStorage để phục hồi tức thì khi Back/Reload
  useEffect(() => {
    if (user) {
      localStorage.setItem(
        "firebase_user_cache",
        JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        })
      );
    } else {
      localStorage.removeItem("firebase_user_cache");
    }
  }, [user]);

  // Đồng bộ profile vào localStorage để giữ trạng thái mở khóa tức thì khi Back/Reload
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
      console.log("🔄 [FirebaseAuth] Đang nạp lại profile...");
      const profileSnapshot = await getDoc(profileRef);
      if (profileSnapshot.exists()) {
        const data = profileSnapshot.data();
        setProfile({ id: uid, ...data });
        console.log("🔄 [FirebaseAuth] Nạp lại profile thành công:", data);
      }
    } catch (e) {
      console.error("❌ [FirebaseAuth] Lỗi nạp lại profile:", e);
    }
  }, [services.auth, services.db]);

  useEffect(() => {
    if (!services.auth || !services.db) {
      setLoading(false);
      return undefined;
    }

    return onAuthStateChanged(services.auth, async (nextUser) => {
      console.log("🔄 [FirebaseAuth] onAuthStateChanged kích hoạt. User:", nextUser ? `${nextUser.email} (UID: ${nextUser.uid})` : "Chưa đăng nhập");
      setUser(nextUser);
      setAuthError("");

      if (!nextUser) {
        setProfile(null);
        setAdminProfile(null);
        setLoading(false);
        console.log("🔄 [FirebaseAuth] Không có user phiên hiện tại, dừng lại.");
        return;
      }

      // Đặt loading = false ngay lập tức để giải phóng giao diện người dùng, tránh chớp nhoáng đăng xuất hoặc treo màn hình loading
      setLoading(false);

      // Tải các thông tin profile bổ sung từ Firestore một cách bất đồng bộ ở background
      (async () => {
        try {
          console.log("🔄 [FirebaseAuth] Bắt đầu tải dữ liệu Firestore cho user:", nextUser.uid);

          // 1. Tải admin profile
          const adminRef = doc(services.db, "adminUsers", nextUser.uid);
          const adminSnapshot = await getDoc(adminRef);
          if (adminSnapshot.exists()) {
            setAdminProfile({ id: adminSnapshot.id, ...adminSnapshot.data() });
          } else {
            setAdminProfile(null);
          }
        } catch (adminError) {
          console.warn("⚠️ [FirebaseAuth] Không thể lấy admin profile:", adminError);
        }

        try {
          // 2. Tải user profile (Chỉ READ, không WRITE trên mỗi lượt tải trang để giữ dữ liệu an toàn và hiệu năng tốt)
          const profileRef = doc(services.db, "users", nextUser.uid);
          const profileSnapshot = await getDoc(profileRef);
          if (profileSnapshot.exists()) {
            const userProfileData = profileSnapshot.data();
            setProfile({ id: nextUser.uid, ...userProfileData });
            console.log("🔄 [FirebaseAuth] Đã đồng bộ user profile thành công:", userProfileData);
          } else {
            // Dùng thông tin mặc định từ Auth
            setProfile({
              id: nextUser.uid,
              displayName: nextUser.displayName || "",
              email: nextUser.email || "",
              photoURL: nextUser.photoURL || "",
            });
          }
        } catch (profileGetError) {
          console.warn("⚠️ [FirebaseAuth] Không thể lấy user profile:", profileGetError);
          // Fallback khi lỗi/offline
          setProfile({
            id: nextUser.uid,
            displayName: nextUser.displayName || "",
            email: nextUser.email || "",
            photoURL: nextUser.photoURL || "",
          });
        }
      })();
    });
  }, [services.auth, services.db]);

  async function loginWithGoogle() {
    if (!services.auth || !services.googleProvider) {
      throw new Error("Firebase Auth is not configured.");
    }

    const credential = await signInWithPopup(services.auth, services.googleProvider);
    
    // Đồng bộ thông tin profile khi đăng nhập
    try {
      const profileRef = doc(services.db, "users", credential.user.uid);
      const profileSnapshot = await getDoc(profileRef);
      const profileData = {
        displayName: credential.user.displayName || "",
        email: credential.user.email || "",
        photoURL: credential.user.photoURL || "",
        lastLoginAt: serverTimestamp(),
      };
      
      await setDoc(profileRef, profileSnapshot.exists() ? profileData : {
        ...profileData,
        createdAt: serverTimestamp(),
      }, { merge: true });
    } catch (e) {
      console.warn("⚠️ [FirebaseAuth] Không thể lưu profile khi đăng nhập Google:", e);
    }

    return credential;
  }

  async function loginWithEmail(email, password) {
    if (!services.auth) {
      throw new Error("Firebase Auth is not configured.");
    }

    const credential = await signInWithEmailAndPassword(services.auth, email, password);
    
    // Cập nhật lastLoginAt khi đăng nhập email
    try {
      const profileRef = doc(services.db, "users", credential.user.uid);
      await setDoc(profileRef, {
        lastLoginAt: serverTimestamp(),
      }, { merge: true });
    } catch (e) {
      console.warn("⚠️ [FirebaseAuth] Không thể cập nhật lastLoginAt:", e);
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

    // Tạo tài liệu profile mới cho user trong database
    try {
      const profileRef = doc(services.db, "users", credential.user.uid);
      await setDoc(profileRef, {
        displayName: displayName || "",
        email: email || "",
        photoURL: "",
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      }, { merge: true });
    } catch (e) {
      console.warn("⚠️ [FirebaseAuth] Không thể tạo profile ban đầu:", e);
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
