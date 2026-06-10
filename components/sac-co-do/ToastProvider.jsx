"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timeoutRef = useRef(null);
  const removeTimeoutRef = useRef(null);

  const dismissToast = useCallback((toastId) => {
    window.clearTimeout(timeoutRef.current);
    window.clearTimeout(removeTimeoutRef.current);
    timeoutRef.current = null;
    setToast((currentToast) => {
      if (!currentToast || (toastId && currentToast.id !== toastId)) {
        return currentToast;
      }

      return { ...currentToast, exiting: true };
    });
    removeTimeoutRef.current = window.setTimeout(() => {
      setToast(null);
      removeTimeoutRef.current = null;
    }, 220);
  }, []);

  const showToast = useCallback((message, type = "info") => {
    window.clearTimeout(timeoutRef.current);
    window.clearTimeout(removeTimeoutRef.current);
    setToast({
      id: Date.now(),
      message,
      type,
      exiting: false,
    });
    timeoutRef.current = window.setTimeout(() => {
      setToast((currentToast) => (currentToast ? { ...currentToast, exiting: true } : currentToast));
      timeoutRef.current = null;
      removeTimeoutRef.current = window.setTimeout(() => {
        setToast(null);
        removeTimeoutRef.current = null;
      }, 220);
    }, 3200);
  }, []);

  useEffect(() => {
    return () => {
      window.clearTimeout(timeoutRef.current);
      window.clearTimeout(removeTimeoutRef.current);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <div className="app-toast-viewport" aria-live="polite" aria-atomic="true">
        {toast ? (
          <div className={`app-toast app-toast-${toast.type} ${toast.exiting ? "is-exiting" : ""}`} role="status">
            <span className="app-toast-dot" aria-hidden="true" />
            <p>{toast.message}</p>
            <button type="button" onClick={() => dismissToast(toast.id)} aria-label="Đóng thông báo">
              ×
            </button>
          </div>
        ) : null}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider.");
  }

  return context;
}
