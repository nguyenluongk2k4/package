"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ShieldCheck, X } from "lucide-react";

export default function FloatingAccountVerification() {
  const [showDialog, setShowDialog] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const [cameraError, setCameraError] = useState("");

  const expectedQrValue = "SAC-CODO:ACCOUNT-VERIFY";

  // ── Camera ──
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
      }
    } catch {
      setCameraError("Không thể mở camera. Vui lòng kiểm tra quyền truy cập.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (showDialog) {
      startCamera();
    } else {
      stopCamera();
    }
    return stopCamera;
  }, [showDialog, startCamera, stopCamera]);

  // Poll scan
  useEffect(() => {
    if (!showDialog) return;
    let mounted = true;

    async function pollScan() {
      if (!window.BarcodeDetector) return;
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
          if (barcode.rawValue.trim() === expectedQrValue) {
            if (!mounted) return;
            stopCamera();
            setShowDialog(false);
            alert("✅ Xác thực tài khoản thành công!");
            return;
          }
        }
      } catch {
        // ignore
      }
    }

    const interval = setInterval(pollScan, 800);
    return () => { mounted = false; clearInterval(interval); };
  }, [showDialog, expectedQrValue, stopCamera]);

  function handleConfirm() {
    stopCamera();
    setShowDialog(false);
    alert("✅ Xác thực tài khoản thành công!");
  }

  return (
    <>
      {/* Nút nổi góc dưới phải */}
      <button
        type="button"
        className="fab-verify"
        onClick={() => setShowDialog(true)}
        aria-label="Xác thực tài khoản"
      >
        <ShieldCheck size={22} strokeWidth={2.2} />
        <span>Xác nhận ngay</span>
      </button>

      {/* Dialog xác thực */}
      {showDialog ? (
        <div className="qr-scan-dialog" role="dialog" aria-modal="true" aria-labelledby="fab-verify-title">
          <div className="qr-scan-backdrop" onClick={() => { stopCamera(); setShowDialog(false); }} />
          <div className="qr-scan-panel">
            <button className="qr-scan-close" type="button" onClick={() => { stopCamera(); setShowDialog(false); }} aria-label="Đóng">
              <X size={20} />
            </button>
            <div className="qr-scan-copy">
              <span className="qr-badge">Xác thực</span>
              <h2 id="fab-verify-title">Xác thực tài khoản</h2>
              <p>Quét mã QR xác thực để kích hoạt tài khoản của bạn.</p>
            </div>
            <div className="qr-scan-view">
              <video ref={videoRef} className="qr-scan-camera" autoPlay playsInline muted />
              <div className="qr-scan-overlay" />
              {cameraError ? <p className="qr-scan-error">{cameraError}</p> : null}
            </div>
            {!window.BarcodeDetector ? (
              <p className="qr-scan-fallback-note">
                Trình duyệt chưa hỗ trợ quét QR tự động.{' '}
                <button className="qr-scan-confirm" type="button" onClick={handleConfirm}>
                  Xác thực thủ công
                </button>
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
