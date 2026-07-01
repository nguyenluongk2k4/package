"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useFirebaseAuth } from "./FirebaseAuthProvider";
import { useToast } from "./ToastProvider";
import { doc, setDoc } from "firebase/firestore";
import { Camera, ShieldAlert } from "lucide-react";
import SectionTitle from "./SectionTitle";
import SiteFooter from "./SiteFooter";
import SiteHeader from "./SiteHeader";

export default function ActivatePage() {
  const { user, db, refreshProfile } = useFirebaseAuth();
  const { showToast } = useToast();
  const router = useRouter();

  // Manual input states
  const [passportCode, setPassportCode] = useState("");
  const [contact, setContact] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Scanner states
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const [cameraError, setCameraError] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [hasBarcodeDetector, setHasBarcodeDetector] = useState(false);

  const expectedQrValue = "SAC-CODO:ACCOUNT-VERIFY";

  // Check support safely on client mount
  useEffect(() => {
    if (typeof window !== "undefined" && window.BarcodeDetector) {
      setHasBarcodeDetector(true);
    }
  }, []);

  // ── Activation helper ──
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

    try {
      const profileRef = doc(db, "users", user.uid);
      await setDoc(
        profileRef,
        {
          isActivated: true,
          passportCode: code.toUpperCase(),
          activatedAt: new Date(),
        },
        { merge: true }
      );
      
      // Đồng bộ state profile trên client ngay lập tức
      if (refreshProfile) {
        await refreshProfile();
      }

      showToast("✅ Kích hoạt Hộ chiếu thành công! Đã mở khóa Hành trình di sản.", "success");
      setTimeout(() => {
        router.push("/hanh-trinh");
      }, 500);
    } catch (error) {
      showToast(error.message || "Đã xảy ra lỗi khi kích hoạt. Vui lòng thử lại.", "error");
    }
  }, [user, db, refreshProfile, showToast, router]);

  // ── Camera Controller ──
  const startCamera = useCallback(async () => {
    try {
      setCameraError("");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsScanning(true);
      }
    } catch (err) {
      setCameraError("Không thể mở camera. Vui lòng kiểm tra quyền truy cập thiết bị.");
      setIsScanning(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  }, []);

  // Auto-start camera when page loads
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // QR Scanning Poll loop
  useEffect(() => {
    if (!isScanning) return;
    let mounted = true;

    async function pollScan() {
      if (typeof window === "undefined" || !window.BarcodeDetector) return;
      if (!detectorRef.current) {
        try {
          detectorRef.current = new window.BarcodeDetector({ formats: ["qr_code"] });
        } catch {
          return;
        }
      }
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;

      try {
        const barcodes = await detectorRef.current.detect(video);
        for (const barcode of barcodes) {
          const raw = barcode.rawValue.trim();
          if (raw === expectedQrValue || raw.startsWith("SCD-")) {
            if (!mounted) return;
            stopCamera();
            performActivation(raw === expectedQrValue ? "SCD-VERIFIED" : raw);
            return;
          }
        }
      } catch {
        // ignore
      }
    }

    const interval = setInterval(pollScan, 800);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [isScanning, performActivation, stopCamera]);

  // Manual Activate
  async function handleManualActivate(e) {
    e.preventDefault();
    if (!passportCode.trim()) {
      showToast("Vui lòng nhập mã passport của bạn!", "error");
      return;
    }
    setIsSubmitting(true);
    await performActivation(passportCode.trim());
    setIsSubmitting(false);
  }

  // Manual verification fallback button if BarcodeDetector is missing
  async function handleManualConfirmFallback() {
    stopCamera();
    await performActivation("SCD-FALLBACK");
  }

  return (
    <>
      <SiteHeader />
      <main className="page-shell">
        <SectionTitle
          eyebrow="Kích hoạt"
          title="Kích Hoạt Hộ Chiếu Di Sản"
          description="Đưa mã QR trên Hộ chiếu của bạn vào trước camera để quét tự động, hoặc nhập thông tin thủ công bên dưới."
        />

        <div className="activation-layout content-section">
          {/* Left Column: QR Scanner Panel */}
          <div className="activation-scanner-panel">
            <h3 style={{ margin: "0 0 10px", color: "#104c27", fontFamily: "var(--font-header, 'Baloo 2', sans-serif)", fontSize: "20px", fontWeight: "700" }}>
              <Camera size={22} style={{ marginRight: "8px", verticalAlign: "middle", color: "#104c27" }} />
              Quét mã QR tự động
            </h3>
            <p className="scanner-instruction" style={{ fontSize: "14px", color: "#666", margin: "0" }}>
              Đưa mã QR trước camera của thiết bị để kích hoạt tức thì.
            </p>

            <div className="scanner-view-container">
              <video ref={videoRef} className="scanner-camera-feed" autoPlay playsInline muted />
              {isScanning && <div className="scanner-laser-overlay" />}
              {cameraError && (
                <div className="scanner-error-display" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.8)", padding: "20px", textAlign: "center", zIndex: 2 }}>
                  <ShieldAlert size={36} style={{ marginBottom: "12px", color: "#e74c3c" }} />
                  <p className="scanner-error-msg" style={{ margin: 0, color: "#fff" }}>{cameraError}</p>
                </div>
              )}
            </div>

            {isScanning ? (
              <span className="scanner-status-text">Đang quét tìm mã QR...</span>
            ) : (
              <button type="button" className="btn secondary" onClick={startCamera} style={{ width: "auto", margin: "0 auto" }}>
                Thử lại camera
              </button>
            )}

            {!hasBarcodeDetector && isScanning && (
              <div className="scanner-fallback-banner" style={{ marginTop: "16px", padding: "12px", background: "rgba(16, 76, 39, 0.05)", borderRadius: "8px" }}>
                <p style={{ fontSize: "13px", color: "#555", margin: "0 0 10px" }}>
                  Trình duyệt này không hỗ trợ quét QR tự động.
                </p>
                <button className="btn secondary" type="button" onClick={handleManualConfirmFallback} style={{ padding: "6px 16px", fontSize: "13px", margin: "0 auto", display: "block" }}>
                  Kích hoạt nhanh
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Manual Input Form */}
          <div className="activation-manual-panel">
            <h3 style={{ margin: "0 0 10px", color: "#104c27", fontFamily: "var(--font-header, 'Baloo 2', sans-serif)", fontSize: "20px", fontWeight: "700" }}>
              Nhập thông tin thủ công
            </h3>
            <p className="scanner-instruction" style={{ fontSize: "14px", color: "#666", margin: "0" }}>
              Sử dụng phương thức này nếu camera không hoạt động hoặc không có thiết bị quét.
            </p>
            
            <form className="activation-form" onSubmit={handleManualActivate} style={{ marginTop: "24px" }}>
              <label>
                Mã passport
                <input
                  type="text"
                  placeholder="SCD-XXXXX"
                  value={passportCode}
                  onChange={(e) => setPassportCode(e.target.value)}
                  required
                />
              </label>
              <label>
                Số điện thoại hoặc email đăng ký
                <input
                  type="text"
                  placeholder="Nhập thông tin nhận hành trình"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                />
              </label>
              <button className="btn primary" type="submit" disabled={isSubmitting} style={{ width: "100%", marginTop: "16px" }}>
                {isSubmitting ? "Đang kích hoạt..." : "Kích hoạt hành trình"}
              </button>
            </form>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
