"use client";

import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/Icon";

export function Toast({ message, type = "error", duration = 5000, onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const bgColor = type === "error" ? "bg-error/10" : "bg-success/10";
  const borderColor = type === "error" ? "border-error" : "border-success";
  const textColor = type === "error" ? "text-error" : "text-success";
  const iconName = type === "error" ? "error" : "check_circle";

  return (
    <div
      className={`fixed bottom-4 right-4 max-w-md p-4 rounded-xl border ${bgColor} ${borderColor} ${textColor} font-montserrat text-body-sm flex items-center gap-3 shadow-lg z-50 animate-in fade-in slide-in-from-bottom-4`}
    >
      <Icon name={iconName} size={20} />
      <span>{message}</span>
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState({ message: null, type: "error" });

  const showToast = useCallback((message, type = "error", duration = 5000) => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: null, type: "error" }), duration);
  }, []);

  const showError = useCallback((message) => showToast(message, "error"), [showToast]);
  const showSuccess = useCallback((message) => showToast(message, "success", 3000), [showToast]);

  return {
    ...toast,
    showToast,
    showError,
    showSuccess,
    closeToast: () => setToast({ message: null, type: "error" }),
  };
}
