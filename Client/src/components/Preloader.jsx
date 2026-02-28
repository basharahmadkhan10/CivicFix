import { useEffect, useMemo, useState } from "react";
import { useTheme } from "../context/ThemeContext";

const Preloader = ({ isLoading = true }) => {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(true);

  const palette = useMemo(() => {
    const accentColor = "#97AB33";
    const isDark = theme === "dark";
    
    if (isDark) {
      return {
        bg: "#0A0A0A",
        fg: "#FFFFFF",
        accent: accentColor,
        accentLight: "rgba(151, 171, 51, 0.3)",
        muted: "rgba(255,255,255,0.55)",
        faint: "rgba(255,255,255,0.08)",
        glow: `radial-gradient(700px circle at 50% 45%, ${accentColor}30, transparent 65%)`,
        cardGlow: `0 0 30px ${accentColor}40`,
      };
    }
    return {
      bg: "#FFFFFF",
      fg: "#1A202C",
      accent: accentColor,
      accentLight: "rgba(151, 171, 51, 0.2)",
      muted: "rgba(0,0,0,0.55)",
      faint: "rgba(0,0,0,0.05)",
      glow: `radial-gradient(700px circle at 50% 45%, ${accentColor}20, transparent 65%)`,
      cardGlow: `0 0 30px ${accentColor}30`,
    };
  }, [theme]);

  useEffect(() => {
    if (!isLoading) {
      const t = setTimeout(() => setVisible(false), 450);
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
      style={{ 
        backgroundColor: palette.bg,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        .gear { transform-origin: 50% 50%; }
        .gear-big { animation: spin 2.2s linear infinite; }
        .gear-small { animation: spinReverse 1.4s linear infinite; }

        @keyframes spin { 
          from { transform: rotate(0deg); } 
          to { transform: rotate(360deg); } 
        }
        @keyframes spinReverse { 
          from { transform: rotate(0deg); } 
          to { transform: rotate(-360deg); } 
        }

        .loader-sweep {
          animation: sweep 1.2s ease-in-out infinite;
          transform: translateX(-60%);
        }
        @keyframes sweep {
          0%   { transform: translateX(-60%); }
          50%  { transform: translateX(120%); }
          100% { transform: translateX(120%); }
        }

        .pulse-dot {
          animation: pulse 1.5s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.2); }
        }

        .fade-in {
          animation: fadeIn 0.8s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* soft radial glow with accent color */}
      <div
        className="absolute inset-0 pointer-events-none"
      />

      <div className="relative flex flex-col items-center gap-8 fade-in">
        {/* logo text with accent */}
        <div className="flex items-center gap-2 mb-2">
          <span style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "28px",
            fontWeight: "700",
            letterSpacing: "-0.5px",
            color: palette.fg,
          }}>
            CIVIC
            <span style={{ color: palette.accent }}>FIX</span>
          </span>
        </div>

        {/* animated icon */}
        <div className="relative w-[160px] h-[160px]">
          {/* outer ring with accent */}
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
              r="38"
              fill="none"
              stroke={palette.accent}
              strokeWidth="6"
              strokeDasharray="16 10"
              strokeLinecap="round"
              opacity="0.5"
            />
            <circle
              cx="50"
              cy="50"
              r="26"
              fill="none"
              stroke={palette.fg}
              strokeWidth="5"
              strokeDasharray="12 8"
              strokeLinecap="round"
              opacity="0.35"
            />
            <circle cx="50" cy="50" r="10" fill={palette.accent} opacity="0.25" />
          </svg>

          <svg
            className="absolute right-[12px] bottom-[18px] gear gear-small"
            width="84"
            height="84"
            viewBox="0 0 100 100"
            aria-hidden="true"
          >
            <circle
              cx="50"
              cy="50"
              r="30"
              fill="none"
              stroke={palette.accent}
              strokeWidth="5"
              strokeDasharray="14 8"
              strokeLinecap="round"
              opacity="0.4"
            />
            <circle
              cx="50"
              cy="50"
              r="18"
              fill="none"
              stroke={palette.fg}
              strokeWidth="4"
              strokeDasharray="10 6"
              strokeLinecap="round"
              opacity="0.3"
            />
            <circle cx="50" cy="50" r="8" fill={palette.accent} opacity="0.2" />
          </svg>

          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full pulse-dot"
            style={{
              backgroundColor: palette.accent,
              boxShadow: `0 0 20px ${palette.accent}`,
            }}
          />
        </div>

        {/* loader line with accent */}
        <div className="w-[240px]">
          <div
            className="h-[3px] w-full rounded-full overflow-hidden"
            style={{ backgroundColor: palette.faint }}
          >
            <div
              className="h-full w-[40%] rounded-full loader-sweep"
              style={{ backgroundColor: palette.accent }}
            />
          </div>

          {/* loading text with proper font */}
          <div
            className="mt-4 text-xs tracking-[0.3em] uppercase text-center font-medium"
            style={{ color: palette.muted }}
          >
            Loading
          </div>
          
          {/* subtle brand message */}
          <div
            className="mt-6 text-[10px] tracking-wider text-center"
            style={{ color: palette.accent, opacity: 0.6 }}
          >
            building better cities together
          </div>
        </div>
      </div>
    </div>
  );
};

export default Preloader;

