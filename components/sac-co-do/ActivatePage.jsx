"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useFirebaseAuth } from "./FirebaseAuthProvider";
import { useToast } from "./ToastProvider";
import { Camera, ShieldAlert, CheckCircle2 } from "lucide-react";
import SectionTitle from "./SectionTitle";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

export default function ActivatePage() {
  const { user, db, loading, refreshProfile, profile } = useFirebaseAuth();
  const { showToast } = useToast();
  const router = useRouter();

  // Input state
  const [passportCode, setPassportCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const isActivated = !!profile?.isActivated;

  // ── Authentication Protection ──
  useEffect(() => {
    if (!loading && !user) {
      showToast("Vui lòng đăng nhập trước khi kích hoạt hộ chiếu di sản!", "error");
      router.push("/dang-nhap");
    }
  }, [user, loading, router, showToast]);

  // ── Auto-fill passport code if already activated ──
  useEffect(() => {
    if (isActivated && profile?.passportCode) {
      setPassportCode(profile.passportCode);
    }
  }, [isActivated, profile]);

  // ── QR Scanner initialization using html5-qrcode ──
  useEffect(() => {
    // Only scan if user is logged in AND not activated yet
    if (!user || isActivated) return;
    
    let html5QrCode;
    let isMounted = true;

    const timer = setTimeout(async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        
        const container = document.getElementById("qr-reader");
        if (!container || !isMounted) return;

        html5QrCode = new Html5Qrcode("qr-reader");
        
        const config = {
          fps: 12,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const size = Math.floor(minEdge * 0.65);
            return { width: size, height: size };
          }
        };

        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            const raw = decodedText.trim();
            
            // Auto redirect if user accidentally scans a station check-in QR
            const checkinMatch = raw.match(/\/checkin\/([a-zA-Z0-9-]+)/) || raw.match(/^[a-zA-Z0-9-]+$/);
            const potentialSlug = checkinMatch ? checkinMatch[1] || raw : null;
            const validSlugs = ["trang-an", "hoa-lu", "bai-dinh", "pho-co-hoa-lu", "tam-coc", "hang-mua"];
            
            if (raw.includes("/checkin/") || (potentialSlug && validSlugs.includes(potentialSlug))) {
              const slug = potentialSlug || raw.split("/checkin/")[1]?.split("?")[0];
              if (slug && validSlugs.includes(slug)) {
                showToast("Phát hiện mã QR check-in trạm! Đang di chuyển sang trang check-in...", "success");
                if (html5QrCode && html5QrCode.isScanning) {
                  html5QrCode.stop().catch(() => {});
                }
                router.push(`/checkin/${slug}`);
                return;
              }
            }

            const cleanCode = raw.toUpperCase();
            setPassportCode(cleanCode);
            showToast(`Phát hiện mã QR: ${cleanCode}`, "info");
          },
          () => {
            // Ignore verbose scan errors
          }
        );
      } catch (err) {
        console.warn("Failed to initialize html5-qrcode:", err);
        if (isMounted) {
          setCameraError("Không thể kích hoạt camera quét QR. Bạn vẫn có thể nhập mã thủ công ở bên phải.");
        }
      }
    }, 500);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch((err) => console.log("Clean up stop error:", err));
      }
    };
  }, [user, isActivated, showToast]);

  // ── Database Verification & Activation ──
  const performActivation = useCallback(async (code) => {
    if (!user) {
      showToast("Vui lòng đăng nhập trước khi kích hoạt hộ chiếu di sản!", "error");
      router.push("/dang-nhap");
      return;
    }
    if (!db) {
      showToast("Lỗi kết nối cơ sở dữ liệu. Vui lòng thử lại sau.", "error");
      return;
    }

    const cleanCode = code.trim().toUpperCase();

    try {
      const { doc, getDoc, runTransaction, serverTimestamp } = await import("firebase/firestore");
      
      // 1. Check if activation code exists
      const codeRef = doc(db, "activationCodes", cleanCode);
      const codeSnap = await getDoc(codeRef);

      if (!codeSnap.exists()) {
        showToast(`Mã "${cleanCode}" không tồn tại trên hệ thống! Vui lòng kiểm tra lại.`, "error");
        return;
      }

      const codeData = codeSnap.data();
      if (codeData.status === "used") {
        showToast("Mã kích hoạt này đã được sử dụng cho tài khoản khác!", "error");
        return;
      }
      if (codeData.status === "inactive") {
        showToast("Mã kích hoạt này đã bị vô hiệu hóa hoặc thu hồi!", "error");
        return;
      }

      // 2. Perform transaction to activate passport and mark code as used
      const userRef = doc(db, "users", user.uid);
      await runTransaction(db, async (transaction) => {
        // Update code status
        transaction.update(codeRef, {
          status: "used",
          usedBy: user.uid,
          usedEmail: user.email || "",
          usedAt: serverTimestamp(),
        });

        // Update user activation profile
        transaction.update(userRef, {
          isActivated: true,
          passportCode: cleanCode,
          activatedAt: serverTimestamp(),
        });
      });

      // Synchronize client profile state instantly
      if (refreshProfile) {
        await refreshProfile();
      }

      // Play wooden stamp sound
      const stampSound = new Audio("https://assets.mixkit.co/active_storage/sfx/2012/2012-84.wav");
      stampSound.play().catch(() => {});

      showToast("Kích hoạt Hộ chiếu thành công! Đã mở khóa Hành trình di sản.", "success");
      
      setTimeout(() => {
        router.push("/hanh-trinh");
      }, 1000);
    } catch (error) {
      showToast(error.message || "Đã xảy ra lỗi khi kích hoạt. Vui lòng thử lại.", "error");
    }
  }, [user, db, refreshProfile, showToast, router]);

  const handleManualActivate = async (e) => {
    e.preventDefault();
    if (isActivated) return;
    if (!passportCode.trim()) {
      showToast("Vui lòng nhập hoặc quét mã passport!", "error");
      return;
    }
    setIsSubmitting(true);
    await performActivation(passportCode.trim());
    setIsSubmitting(false);
  };

  if (loading || !user) {
    return (
      <>
        <SiteHeader />
        <main className="page-shell" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
          <div className="spinner" style={{ width: "40px", height: "40px", border: "4px solid rgba(16, 76, 39, 0.1)", borderTopColor: "#104c27", borderRadius: "50%", animation: "spin-loader 1s linear infinite" }} />
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="page-shell">
        <SectionTitle
          eyebrow="Kích hoạt"
          title="Kích Hoạt Hộ Chiếu Di Sản"
          description="Đưa mã QR trên Hộ chiếu của bạn vào trước camera để tự động điền, hoặc nhập thông tin thủ công bên dưới."
        />

        <div className="activation-layout content-section">
          {/* Left Column: QR Scanner Panel */}
          <div className="activation-scanner-panel">
            <h3 style={{ margin: "0 0 10px", color: "#104c27", fontFamily: "var(--font-header, 'Baloo 2', sans-serif)", fontSize: "20px", fontWeight: "700" }}>
              <Camera size={22} style={{ marginRight: "8px", verticalAlign: "middle", color: "#104c27" }} />
              Quét mã QR tự động
            </h3>
            {isActivated ? (
              <p className="scanner-instruction" style={{ fontSize: "14px", color: "#38a169", fontWeight: "bold", margin: "0 0 20px 0" }}>
                Tài khoản của bạn đã được kích hoạt Hộ chiếu di sản thành công. Camera quét đã tự động tắt để tiết kiệm pin.
              </p>
            ) : (
              <p className="scanner-instruction" style={{ fontSize: "14px", color: "#666", margin: "0 0 20px 0" }}>
                Đưa mã QR trước camera của thiết bị để quét tự động liên tục.
              </p>
            )}

            <div className="scanner-view-container" style={{ display: isActivated ? "none" : "block" }}>
              <div id="qr-reader" />
              {cameraError && (
                <div className="scanner-error-display" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.85)", padding: "20px", textAlign: "center", zIndex: 2 }}>
                  <ShieldAlert size={36} style={{ marginBottom: "12px", color: "#e53e3e" }} />
                  <p className="scanner-error-msg" style={{ margin: 0, color: "#fff", fontSize: "13px" }}>{cameraError}</p>
                </div>
              )}
            </div>

            {isActivated && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "260px", background: "rgba(16, 76, 39, 0.05)", borderRadius: "12px", padding: "20px", border: "1px solid rgba(16, 76, 39, 0.15)" }}>
                <CheckCircle2 size={48} style={{ color: "#38a169", marginBottom: "16px" }} />
                <strong style={{ color: "#104c27", fontSize: "16px" }}>Hộ chiếu đã sẵn sàng!</strong>
                <p style={{ fontSize: "13px", color: "#555", margin: "8px 0 0 0", textAlign: "center" }}>
                  Hãy vào mục hành trình để bắt đầu đóng dấu mộc di sản Ninh Bình.
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Manual Input / Confirmation Form */}
          <div className="activation-manual-panel">
            <h3 style={{ margin: "0 0 10px", color: "#104c27", fontFamily: "var(--font-header, 'Baloo 2', sans-serif)", fontSize: "20px", fontWeight: "700" }}>
              Thông tin kích hoạt
            </h3>
            <p className="scanner-instruction" style={{ fontSize: "14px", color: "#666", margin: "0" }}>
              Mã QR sau khi quét được sẽ tự động điền vào ô dưới. Nhấn kích hoạt để xác nhận kích hoạt tài khoản.
            </p>
            
            <form className="activation-form" onSubmit={handleManualActivate} style={{ marginTop: "24px" }}>
              <label>
                Mã kích hoạt hộ chiếu
                <input
                  type="text"
                  placeholder="Ví dụ: SC#7A9X"
                  value={passportCode}
                  onChange={(e) => setPassportCode(e.target.value)}
                  required
                  disabled={isActivated}
                  style={{ textTransform: "uppercase", background: isActivated ? "#edf2f7" : "#fff", color: isActivated ? "#4a5568" : "#000" }}
                />
              </label>
              <button 
                className="btn primary" 
                type="submit" 
                disabled={isSubmitting || isActivated} 
                style={{ 
                  width: "100%", 
                  marginTop: "16px",
                  background: isActivated ? "#cbd5e0" : "linear-gradient(135deg, #104c27 0%, #1a743b 100%)",
                  color: isActivated ? "#718096" : "#fff",
                  cursor: isActivated ? "not-allowed" : "pointer"
                }}
              >
                {isSubmitting ? "Đang kích hoạt..." : isActivated ? "Tài khoản đã kích hoạt" : "Kích hoạt (Xác nhận OK)"}
              </button>
            </form>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
