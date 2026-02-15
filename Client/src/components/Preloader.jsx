import { useEffect, useMemo, useState } from "react";
import { useTheme } from "../context/ThemeContext";

const Preloader = ({ isLoading = true }) => {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(true);
  const palette = useMemo(() => {
    const dark = {
      bg: "#000000",
      panel: "rgba(255,255,255,0.04)",
      stroke: "#9CA3AF", // grey
      stroke2: "#6B7280",
      cap: "#FBBF24", // yellow
      cap2: "#F59E0B",
      glow: "rgba(251,191,36,0.25)",
    };
    const light = {
      bg: "#0B1220",
      panel: "rgba(255,255,255,0.06)",
      stroke: "#9CA3AF",
      stroke2: "#6B7280",
      cap: "#FBBF24",
      cap2: "#F59E0B",
      glow: "rgba(251,191,36,0.25)",
    };

    return theme === "light" ? light : dark;
  }, [theme]);
  useEffect(() => {
    if (!isLoading) {
      const t = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(t);
    }
    setVisible(true);
  }, [isLoading]);
  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "auto";
    };
  }, [visible]);

  if (!visible) return null;
  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-300 ${
        isLoading ? "opacity-100" : "opacity-0"
      }`}
      style={{ backgroundColor: palette.bg }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 45%, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.85) 70%)",
        }}
      />

      <div
        className="relative w-[280px] h-[220px] rounded-2xl flex items-center justify-center"
        style={{
          backgroundColor: palette.panel,
          boxShadow: `0 0 40px rgba(0,0,0,0.55)`,
          border: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div
          className="absolute -inset-6 rounded-[28px] opacity-40"
          style={{
            background: `radial-gradient(circle, ${palette.glow} 0%, rgba(0,0,0,0) 70%)`,
            filter: "blur(10px)",
          }}
        />

        <div className="relative w-[160px] h-[160px]">
          <svg
            className="absolute left-[8px] top-[18px] gear gear-big"
            width="120"
            height="120"
            viewBox="0 0 100 100"
            aria-hidden="true"
          >
            <circle
              cx="50"
              cy="50"
              r="34"
              fill="none"
              stroke={palette.stroke}
              strokeWidth="8"
              strokeDasharray="14 8"
              strokeLinecap="round"
            />
            <circle
              cx="50"
              cy="50"
              r="20"
              fill="none"
              stroke={palette.stroke2}
              strokeWidth="6"
              strokeDasharray="10 7"
              strokeLinecap="round"
            />
            <circle cx="50" cy="50" r="8" fill={palette.stroke2} />
          </svg>
          <svg
            className="absolute right-[10px] bottom-[18px] gear gear-small"
            width="78"
            height="78"
            viewBox="0 0 100 100"
            aria-hidden="true"
          >
            <circle
              cx="50"
              cy="50"
              r="28"
              fill="none"
              stroke={palette.stroke}
              strokeWidth="7"
              strokeDasharray="12 7"
              strokeLinecap="round"
            />
            <circle
              cx="50"
              cy="50"
              r="14"
              fill="none"
              stroke={palette.stroke2}
              strokeWidth="5"
              strokeDasharray="8 6"
              strokeLinecap="round"
            />
            <circle cx="50" cy="50" r="6" fill={palette.stroke2} />
          </svg>
          <div className="absolute top-[-6px] left-1/2 -translate-x-1/2">
            <svg
              width="86"
              height="64"
              viewBox="0 0 100 75"
              aria-hidden="true"
              style={{
                filter: `drop-shadow(0 8px 18px rgba(0,0,0,0.6))`,
              }}
            >
            
              <path
                d="M16 44c0-18 15-32 34-32s34 14 34 32v10H16V44z"
                fill={palette.cap}
              />
              
              <path
                d="M10 54h80c4 0 7 3 7 7s-3 7-7 7H10c-4 0-7-3-7-7s3-7 7-7z"
                fill={palette.cap2}
              />
             
              <path
                d="M50 12v42"
                stroke="rgba(0,0,0,0.15)"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <path
                d="M35 15v39"
                stroke="rgba(0,0,0,0.10)"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M65 15v39"
                stroke="rgba(0,0,0,0.10)"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full"
            style={{
              background: "radial-gradient(circle, #D1D5DB 0%, #6B7280 70%)",
              boxShadow: "0 0 10px rgba(255,255,255,0.08)",
            }}
          />
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1 opacity-80">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="w-8 h-2 rounded-sm"
              style={{
                background:
                  "repeating-linear-gradient(45deg, #FBBF24 0px, #FBBF24 7px, rgba(255,255,255,0.08) 7px, rgba(255,255,255,0.08) 14px)",
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        .gear { transform-origin: 50% 50%; }
        .gear-big { animation: spin 2.0s linear infinite; }
        .gear-small { animation: spinReverse 1.05s linear infinite; }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spinReverse {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
      `}</style>
    </div>
  );
};

export default Preloader;
