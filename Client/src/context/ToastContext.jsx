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
      const id = Date.now() + Math.random();
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
  const isDark = theme === "dark";
  
  // Green accent color
  const accentColor = "#97AB33";

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
    // Base colors based on theme
    const baseColors = {
      bg: isDark ? "#111111" : "#FFFFFF",
      text: isDark ? "#FFFFFF" : "#1A202C",
      border: isDark ? "#2D3748" : "#E2E8F0",
      cardHover: isDark ? "#1A1A1A" : "#F7FAFC",
      muted: isDark ? "#A0AEC0" : "#718096",
    };

    // Type-specific colors using green accent
    switch (type) {
      case "success":
        return {
          ...baseColors,
          icon: accentColor,
          accent: accentColor,
          bgAccent: isDark ? "rgba(151, 171, 51, 0.15)" : "rgba(151, 171, 51, 0.1)",
          borderAccent: isDark ? "#2D3748" : "#E2E8F0",
        };
      case "error":
        return {
          ...baseColors,
          icon: "#EF4444",
          accent: "#EF4444",
          bgAccent: isDark ? "rgba(239, 68, 68, 0.15)" : "rgba(239, 68, 68, 0.1)",
          borderAccent: isDark ? "#2D3748" : "#E2E8F0",
        };
      case "warning":
        return {
          ...baseColors,
          icon: "#F59E0B",
          accent: "#F59E0B",
          bgAccent: isDark ? "rgba(245, 158, 11, 0.15)" : "rgba(245, 158, 11, 0.1)",
          borderAccent: isDark ? "#2D3748" : "#E2E8F0",
        };
      case "info":
        return {
          ...baseColors,
          icon: "#3B82F6",
          accent: "#3B82F6",
          bgAccent: isDark ? "rgba(59, 130, 246, 0.15)" : "rgba(59, 130, 246, 0.1)",
          borderAccent: isDark ? "#2D3748" : "#E2E8F0",
        };
      default:
        return {
          ...baseColors,
          icon: accentColor,
          accent: accentColor,
          bgAccent: isDark ? "rgba(151, 171, 51, 0.15)" : "rgba(151, 171, 51, 0.1)",
          borderAccent: isDark ? "#2D3748" : "#E2E8F0",
        };
    }
  };

  const getToastIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircle size={isMobile ? 18 : 20} />;
      case "error":
        return <XCircle size={isMobile ? 18 : 20} />;
      case "warning":
        return <AlertCircle size={isMobile ? 18 : 20} />;
      case "info":
        return <Info size={isMobile ? 18 : 20} />;
      default:
        return <Info size={isMobile ? 18 : 20} />;
    }
  };

  // Check if mobile
  const [isMobile, setIsMobile] = React.useState(false);
  
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const ToastItem = ({ toast }) => {
    const colors = getToastColors(toast.type);

    return (
      <div
        className="relative mb-2 sm:mb-3 rounded-xl shadow-lg transform transition-all duration-300 animate-slideIn"
        style={{
          backgroundColor: colors.bg,
          color: colors.text,
          border: `1px solid ${colors.border}`,
          maxWidth: isMobile ? "calc(100vw - 32px)" : "400px",
          minWidth: isMobile ? "calc(100vw - 32px)" : "300px",
          width: isMobile ? "calc(100vw - 32px)" : "auto",
          backdropFilter: "blur(10px)",
          boxShadow: isDark
            ? "0 10px 25px -5px rgba(0, 0, 0, 0.5)"
            : "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div className="flex items-start p-3 sm:p-4">
          {/* Icon */}
          <div
            className="flex-shrink-0 p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3"
            style={{
              backgroundColor: colors.bgAccent,
              color: colors.icon,
            }}
          >
            {getToastIcon(toast.type)}
          </div>

          {/* Message */}
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium pr-4 sm:pr-6" style={{ color: colors.text }}>
              {toast.message}
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={() => removeToast(toast.id)}
            className="flex-shrink-0 ml-1 sm:ml-2 p-1 rounded-full hover:bg-opacity-80 transition-colors"
            style={{ 
              color: colors.muted,
              minWidth: isMobile ? '36px' : '32px',
              minHeight: isMobile ? '36px' : '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={isMobile ? 16 : 18} />
          </button>
        </div>

        {/* Progress bar - only show if duration > 0 and not on mobile (to reduce visual noise) */}
        {toast.duration > 0 && !isMobile && (
          <div className="px-3 pb-3 sm:px-4 sm:pb-4">
            <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: colors.border }}>
              <div
                className="h-full rounded-full transition-all duration-1000 linear"
                style={{
                  width: `${Math.max(0, 100 - ((Date.now() - toast.timestamp) / toast.duration) * 100)}%`,
                  backgroundColor: colors.icon,
                }}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const positionClasses = {
    "top-left": "top-0 left-0 items-start",
    "top-center": "top-0 left-1/2 transform -translate-x-1/2 items-center",
    "top-right": "top-0 right-0 items-end",
    "bottom-left": "bottom-0 left-0 items-start",
    "bottom-center": "bottom-0 left-1/2 transform -translate-x-1/2 items-center",
    "bottom-right": "bottom-0 right-0 items-end",
  };

  const positionStyles = {
    "top-left": { top: isMobile ? 8 : 16, left: isMobile ? 8 : 16 },
    "top-center": { top: isMobile ? 8 : 16, left: '50%', transform: 'translateX(-50%)' },
    "top-right": { top: isMobile ? 8 : 16, right: isMobile ? 8 : 16 },
    "bottom-left": { bottom: isMobile ? 8 : 16, left: isMobile ? 8 : 16 },
    "bottom-center": { bottom: isMobile ? 8 : 16, left: '50%', transform: 'translateX(-50%)' },
    "bottom-right": { bottom: isMobile ? 8 : 16, right: isMobile ? 8 : 16 },
  };

  return (
    <>
      {Object.entries(positions).map(
        ([position, positionToasts]) =>
          positionToasts.length > 0 && (
            <div
              key={position}
              className="fixed z-[9999] flex flex-col"
              style={{
                ...positionStyles[position],
                pointerEvents: "none",
                maxWidth: isMobile ? '100vw' : 'auto',
              }}
            >
              {positionToasts.map((toast) => (
                <div
                  key={toast.id}
                  style={{
                    pointerEvents: "auto",
                    marginBottom: isMobile ? 4 : 8,
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

        /* Mobile-specific styles */
        @media (max-width: 640px) {
          .animate-slideIn {
            animation: slideIn 0.2s ease-out;
          }
        }
      `}</style>
    </>
  );
};
