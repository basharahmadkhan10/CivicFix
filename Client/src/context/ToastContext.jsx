import React, { createContext, useState, useContext, useCallback } from "react";
import { createPortal } from "react-dom";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";
import { useTheme } from "./ThemeContext";
const ToastContext = createContext();
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const { theme } = useTheme();
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(
    ({ message, type = "info", duration = 2000, position = "top-right" }) => {
      const id = Date.now();
      const newToast = {
        id,
        message,
        type,
        duration,
        position,
        timestamp: Date.now(),
      };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [],
  );

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback(
    (message, options = {}) => {
      return addToast({ message, type: "success", ...options });
    },
    [addToast],
  );

  const error = useCallback(
    (message, options = {}) => {
      return addToast({ message, type: "error", ...options });
    },
    [addToast],
  );

  const warning = useCallback(
    (message, options = {}) => {
      return addToast({ message, type: "warning", ...options });
    },
    [addToast],
  );

  const info = useCallback(
    (message, options = {}) => {
      return addToast({ message, type: "info", ...options });
    },
    [addToast],
  );
  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider
      value={{ success, error, warning, info, removeToast, clearAll }}
    >
      {children}
      {createPortal(
        <ToastContainer
          toasts={toasts}
          removeToast={removeToast}
          theme={theme}
        />,
        document.body,
      )}
    </ToastContext.Provider>
  );
};

const ToastContainer = ({ toasts, removeToast, theme }) => {
  // Group toasts by position
  const positions = {
    "top-left": toasts.filter((t) => t.position === "top-left"),
    "top-center": toasts.filter((t) => t.position === "top-center"),
    "top-right": toasts.filter((t) => t.position === "top-right"),
    "bottom-left": toasts.filter((t) => t.position === "bottom-left"),
    "bottom-center": toasts.filter((t) => t.position === "bottom-center"),
    "bottom-right": toasts.filter((t) => t.position === "bottom-right"),
  };

  const getToastColors = (type) => {
    if (theme === "light") {
      const baseColors = {
        bg: "#ffffff",
        text: "#000000",
        border: "#e5e7eb",
        cardBg: "#cad4f3", 
      };

      switch (type) {
        case "success":
          return {
            ...baseColors,
            icon: "#10b981",
            accent: "#059669",
            bgAccent: "#d1fae5",
            borderAccent: "#a7f3d0",
          };
        case "error":
          return {
            ...baseColors,
            icon: "#ef4444",
            accent: "#dc2626",
            bgAccent: "#fee2e2",
            borderAccent: "#fecaca",
          };
        case "warning":
          return {
            ...baseColors,
            icon: "#f59e0b",
            accent: "#d97706",
            bgAccent: "#fef3c7",
            borderAccent: "#fde68a",
          };
        case "info":
          return {
            ...baseColors,
            icon: "#3b82f6",
            accent: "#2563eb",
            bgAccent: "#dbeafe",
            borderAccent: "#bfdbfe",
          };
        default:
          return {
            ...baseColors,
            icon: "#6b7280",
            accent: "#4b5563",
            bgAccent: "#f3f4f6",
            borderAccent: "#e5e7eb",
          };
      }
    } else {
      const baseColors = {
        bg: "#111111", 
        text: "#ffffff",
        border: "#374151",
        cardBg: "#1a1a1a",
      };

      switch (type) {
        case "success":
          return {
            ...baseColors,
            icon: "#34d399",
            accent: "#10b981",
            bgAccent: "#064e3b",
            borderAccent: "#065f46",
          };
        case "error":
          return {
            ...baseColors,
            icon: "#f87171",
            accent: "#ef4444",
            bgAccent: "#7f1d1d",
            borderAccent: "#991b1b",
          };
        case "warning":
          return {
            ...baseColors,
            icon: "#fbbf24",
            accent: "#f59e0b",
            bgAccent: "#78350f",
            borderAccent: "#92400e",
          };
        case "info":
          return {
            ...baseColors,
            icon: "#60a5fa",
            accent: "#3b82f6",
            bgAccent: "#1e3a8a",
            borderAccent: "#1e40af",
          };
        default:
          return {
            ...baseColors,
            icon: "#9ca3af",
            accent: "#6b7280",
            bgAccent: "#1f2937",
            borderAccent: "#374151",
          };
      }
    }
  };

  const getToastIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircle size={20} />;
      case "error":
        return <XCircle size={20} />;
      case "warning":
        return <AlertCircle size={20} />;
      case "info":
        return <Info size={20} />;
      default:
        return <Info size={20} />;
    }
  };

  const ToastItem = ({ toast }) => {
    const colors = getToastColors(toast.type);

    return (
      <div
        className="relative mb-3 rounded-xl shadow-lg transform transition-all duration-300 animate-slideIn"
        style={{
          backgroundColor: colors.bg,
          color: colors.text,
          border: `1px solid ${colors.border}`,
          maxWidth: "400px",
          minWidth: "300px",
          backdropFilter: "blur(10px)",
          boxShadow:
            theme === "dark"
              ? "0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)"
              : "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        }}
      >
        
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
          style={{ backgroundColor: colors.accent }}
        />

        <div className="flex items-start p-4 pl-6">
          <div
            className="flex-shrink-0 p-2 rounded-lg mr-3"
            style={{
              backgroundColor: colors.bgAccent,
              color: colors.icon,
            }}
          >
            {getToastIcon(toast.type)}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium pr-6">{toast.message}</p>
            {toast.duration > 0 && (
              <div className="mt-2 flex items-center">
                <div className="flex-1 h-1 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-full rounded-full transition-all duration-1000 linear"
                    style={{
                      width: `${Math.max(0, 100 - ((Date.now() - toast.timestamp) / toast.duration) * 100)}%`,
                      backgroundColor: colors.accent,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => removeToast(toast.id)}
            className="flex-shrink-0 ml-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            style={{ color: colors.text }}
          >
            <X size={18} />
          </button>
        </div>
      </div>
    );
  };

  const positionClasses = {
    "top-left": "top-4 left-4 items-start",
    "top-center": "top-4 left-1/2 transform -translate-x-1/2 items-center",
    "top-right": "top-4 right-4 items-end",
    "bottom-left": "bottom-4 left-4 items-start",
    "bottom-center":
      "bottom-4 left-1/2 transform -translate-x-1/2 items-center",
    "bottom-right": "bottom-4 right-4 items-end",
  };

  return (
    <>
      {Object.entries(positions).map(
        ([position, positionToasts]) =>
          positionToasts.length > 0 && (
            <div
              key={position}
              className={`fixed z-[9999] flex flex-col ${positionClasses[position]}`}
              style={{
                pointerEvents: "none",
              }}
            >
              {positionToasts.map((toast) => (
                <div
                  key={toast.id}
                  style={{
                    pointerEvents: "auto",
                  }}
                >
                  <ToastItem toast={toast} />
                </div>
              ))}
            </div>
          ),
      )}

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideOut {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(-20px);
          }
        }

        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }

        .animate-slideOut {
          animation: slideOut 0.3s ease-in;
        }
      `}</style>
    </>
  );
};
