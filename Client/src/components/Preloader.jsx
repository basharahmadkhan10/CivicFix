import { useEffect, useMemo, useState } from "react";
import { useTheme } from "../context/ThemeContext";

const Preloader = ({ isLoading = true }) => {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(true);

  const palette = useMemo(() => {
    const isDark = theme === "dark";
    return {
      bg: isDark ? "#000000" : "#ffffff",
      fg: isDark ? "#ffffff" : "#000000",
      muted: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.55)",
      faint: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)",
      glow: isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.10)",
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
      style={{ backgroundColor: palette.bg }}
    >
      {/* soft radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(700px circle at 50% 45%, ${palette.glow}, transparent 65%)`,
        }}
      />

      <div className="relative flex flex-col items-center gap-6">
        {/* icon */}
        <div className="relative w-[140px] h-[140px]">
          <svg
            className="absolute left-[6px] top-[16px] gear gear-big"
            width="110"
            height="110"
            viewBox="0 0 100 100"
            aria-hidden="true"
          >
            <circle
              cx="50"
              cy="50"
              r="34"
              fill="none"
              stroke={palette.fg}
              strokeWidth="7"
              strokeDasharray="14 8"
              strokeLinecap="round"
              opacity="0.65"
            />
            <circle
              cx="50"
              cy="50"
              r="20"
              fill="none"
              stroke={palette.fg}
              strokeWidth="5"
              strokeDasharray="10 7"
              strokeLinecap="round"
              opacity="0.35"
            />
            <circle cx="50" cy="50" r="7" fill={palette.fg} opacity="0.35" />
          </svg>

          <svg
            className="absolute right-[10px] bottom-[16px] gear gear-small"
            width="74"
            height="74"
            viewBox="0 0 100 100"
            aria-hidden="true"
          >
            <circle
              cx="50"
              cy="50"
              r="28"
              fill="none"
              stroke={palette.fg}
              strokeWidth="6"
              strokeDasharray="12 7"
              strokeLinecap="round"
              opacity="0.55"
            />
            <circle
              cx="50"
              cy="50"
              r="14"
              fill="none"
              stroke={palette.fg}
              strokeWidth="4"
              strokeDasharray="8 6"
              strokeLinecap="round"
              opacity="0.30"
            />
            <circle cx="50" cy="50" r="6" fill={palette.fg} opacity="0.30" />
          </svg>

          {/* center hub */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full"
            style={{
              backgroundColor: palette.fg,
              opacity: 0.25,
              boxShadow: `0 0 18px ${palette.glow}`,
            }}
          />
        </div>

        {/* minimal loader line */}
        <div className="w-[220px]">
          <div
            className="h-[2px] w-full rounded-full overflow-hidden"
            style={{ backgroundColor: palette.faint }}
          >
            <div
              className="h-full w-[40%] rounded-full loader-sweep"
              style={{ backgroundColor: palette.fg, opacity: 0.75 }}
            />
          </div>

          {/* subtle “loading…” */}
          <div
            className="mt-3 text-xs tracking-[0.28em] uppercase text-center"
            style={{ color: palette.muted }}
          >
            Loading
          </div>
        </div>
      </div>

      <style>{`
        .gear { transform-origin: 50% 50%; }
        .gear-big { animation: spin 1.9s linear infinite; }
        .gear-small { animation: spinReverse 1.1s linear infinite; }

        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes spinReverse { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }

        .loader-sweep {
          animation: sweep 1.05s ease-in-out infinite;
          transform: translateX(-60%);
        }
        @keyframes sweep {
          0%   { transform: translateX(-60%); }
          50%  { transform: translateX(120%); }
          100% { transform: translateX(120%); }
        }
      `}</style>
    </div>
  );
};

export default Preloader;
