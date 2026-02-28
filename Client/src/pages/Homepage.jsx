import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import Preloader from "../components/Preloader";
import lightLogo from "../assets/images/img01.png"; 
import darkLogo from "../assets/images/img02.png"; 
import imgRepDark from "../assets/images/img03.png"; 
import imgRepLight from "../assets/images/img03.png"; 
import imgTrkDark from "../assets/images/img04.png"; 
import imgTrkLight from "../assets/images/img04.png"; 
import imgGov from "../assets/images/img05.png";
import imgComm from "../assets/images/img06.png"; 
const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap";

function injectFont() {
  if (!document.querySelector(`link[href="${FONT_HREF}"]`)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = FONT_HREF;
    document.head.appendChild(link);
  }
}

const TYPING_PHRASES = [
  "Report Issues Instantly",
  "Track Progress Live",
  "Connect with Officials",
  "Build Better Communities",
  "Make Your Voice Heard",
];

const SECTIONS = [
  {
    title: "Your City, Your Voice",
    subtitle: "Empowering Citizens to Be Heard",
    description:
      "CivicFix gives every citizen a simple and transparent way to raise local issues, ensuring their voices reach the right authorities without friction or delay.",
    reverse: false,
    tagColor: "#97AB33",
    tagLabel: "Citizens First",
  },
  {
    title: "Track Every Issue",
    subtitle: "From Report to Resolution",
    description:
      "Stay informed at every step with real-time updates, clear timelines, and full visibility into how reported issues are reviewed, assigned, and resolved.",
    reverse: true,
    tagColor: "#97AB33",
    tagLabel: "Real-Time Updates",
  },
  {
    title: "Government Accountability",
    subtitle: "Transparency That Builds Trust",
    description:
      "Local authorities manage complaints efficiently with structured workflows, performance tracking, and public accountability—creating trust through action.",
    reverse: false,
    tagColor: "#97AB33",
    tagLabel: "Government Portal",
  },
  {
    title: "Community Collaboration",
    subtitle: "Building Better Cities Together",
    description:
      "Citizens, officials, and communities work together to identify priorities, resolve recurring problems, and shape safer, cleaner, and smarter cities.",
    reverse: true,
    tagColor: "#97AB33",
    tagLabel: "Community Hub",
  },
];

const FEATURES = [
  {
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: "State-Driven Workflow",
    description:
      "Issues progress through strictly validated states: Reported → Verified → Assigned → In Progress → Resolved → Closed. Invalid transitions are rejected server-side.",
  },
  {
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    title: "Role-Based Authorization",
    description:
      "Fine-grained permissions at API layer: Citizens report, Officers resolve, Supervisors verify and assign, Admins oversee. Every action authenticated and authorized.",
  },
  {
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    title: "Immutable Audit Logs",
    description:
      "All critical actions generate append-only audit records. Complete traceability with timestamps, actor details, and state changes — no hard deletes, no data loss.",
  },
  {
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
        <path d="M12 22v-4" />
        <path d="M8 22h8" />
      </svg>
    ),
    title: "SLA Enforcement",
    description:
      "Service Level Agreements tracked per issue category. Automated escalation for overdue responses. SLA metrics drive accountability and performance monitoring.",
  },
  {
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="9" y1="9" x2="15" y2="15" />
        <line x1="15" y1="9" x2="9" y2="15" />
      </svg>
    ),
    title: "Backend Validation",
    description:
      "Centralized workflow validation logic ensures business rules are enforced server-side. No client-side trust — all state transitions verified before execution.",
  },
  {
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
        <rect x="2" y="2" width="20" height="20" rx="2" ry="2" />
      </svg>
    ),
    title: "Audit Analytics",
    description:
      "Structured historical tracking enables trend analysis, performance metrics, and compliance reporting. Full visibility into resolution times and officer workloads.",
  },
];

const STATS = [
  {
    value: "50",
    suffix: "+",
    label: "Active Citizens",
    sublabel: "Using the platform daily",
  },
  {
    value: "100",
    suffix: "+",
    label: "Issues Reported",
    sublabel: "Logged and tracked",
  },
  {
    value: "10",
    suffix: "+",
    label: "Cities Covered",
    sublabel: "Actively participating",
  },
  {
    value: "95",
    suffix: "%",
    label: "User Satisfaction",
    sublabel: "Positive feedback rate",
  },
];

function getTokens(isDark) {
  const accentColor = "#97AB33"; 

  return isDark
    ? {
        background: "#0A0A0A",
        backgroundAlt: "#121212",
        backgroundCard: "#1A1A1A",
        text: "#FFFFFF",
        textMuted: "#A0A0A0",
        textSecondary: "#CCCCCC",
        accent: accentColor,
        accentLight: "rgba(151, 171, 51, 0.15)",
        border: "rgba(255,255,255,0.1)",
        borderLight: "rgba(255,255,255,0.05)",
        buttonPrimary: accentColor,
        buttonPrimaryText: "#000000",
        buttonOutline: "transparent",
        buttonOutlineBorder: "rgba(255,255,255,0.2)",
        buttonOutlineText: "#FFFFFF",
        navBg: "rgba(10,10,10,0.95)",
        cardBg: "#1A1A1A",
        sectionBg: "#121212",
        glow: "rgba(151, 171, 51, 0.25)",
        shadow: "rgba(0,0,0,0.5)",
        statsBg: "#1A1A1A",
        statsText: "#FFFFFF",
        statsMuted: "#A0A0A0",
        marqueeBg: "#121212",
        imgFilter: "brightness(0.95) contrast(1.1)",
        toggleBg: "#1A1A1A",
        toggleBorder: "rgba(255,255,255,0.1)",
      }
    : {
        background: "#FFFFFF",
        backgroundAlt: "#F5F5F5",
        backgroundCard: "#FFFFFF",
        text: "#000000",
        textMuted: "#666666",
        textSecondary: "#333333",
        accent: accentColor,
        accentLight: "rgba(151, 171, 51, 0.1)",
        border: "rgba(0,0,0,0.1)",
        borderLight: "rgba(0,0,0,0.05)",
        buttonPrimary: accentColor,
        buttonPrimaryText: "#FFFFFF",
        buttonOutline: "transparent",
        buttonOutlineBorder: "rgba(0,0,0,0.2)",
        buttonOutlineText: "#000000",
        navBg: "rgba(255,255,255,0.95)",
        cardBg: "#FFFFFF",
        sectionBg: "#F8F8F8",
        glow: "rgba(151, 171, 51, 0.2)",
        shadow: "rgba(0,0,0,0.1)",
        statsBg: "#F0F0F0",
        statsText: "#000000",
        statsMuted: "#666666",
        marqueeBg: "#F0F0F0",
        imgFilter: "brightness(1) contrast(1)",
        toggleBg: "#F0F0F0",
        toggleBorder: "rgba(0,0,0,0.1)",
      };
}

const hexAlpha = (hex, alpha) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

const HomePage = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const t = getTokens(isDark);

  const [pageLoaded, setPageLoaded] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [typingText, setTypingText] = useState("");
  const [typingIndex, setTypingIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredImage, setHoveredImage] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(0);

  const sectionRefs = useRef([]);
  const rafId = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setPageLoaded(true), 2000);
    return () => clearTimeout(timer);
  }, []);


  useEffect(() => {
    injectFont();
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = sectionRefs.current.findIndex(
              (ref) => ref === entry.target,
            );
            if (index !== -1) setActiveSection(index);
          }
        });
      },
      { threshold: 0.4 },
    );

    sectionRefs.current.forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const currentPhrase = TYPING_PHRASES[typingIndex];
    const delay = deleting ? 50 : 100;

    const timeout = setTimeout(() => {
      if (!deleting) {
        if (typingText.length < currentPhrase.length) {
          setTypingText(currentPhrase.slice(0, typingText.length + 1));
        } else {
          setTimeout(() => setDeleting(true), 2000);
        }
      } else {
        if (typingText.length > 0) {
          setTypingText(currentPhrase.slice(0, typingText.length - 1));
        } else {
          setDeleting(false);
          setTypingIndex((prev) => (prev + 1) % TYPING_PHRASES.length);
        }
      }
    }, delay);

    return () => clearTimeout(timeout);
  }, [typingText, typingIndex, deleting]);

  const scrollToSection = (index) => {
    if (sectionRefs.current[index]) {
      sectionRefs.current[index].scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
    setMobileMenuOpen(false);
  };

  const sectionImages = [
    isDark ? imgRepDark : imgRepLight,
    isDark ? imgTrkDark : imgTrkLight,
    imgGov,
    imgComm,
  ];

  if (!pageLoaded) return <Preloader />;

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: t.background,
        color: t.text,
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        overflowX: "hidden",
        transition: "background-color 0.3s ease, color 0.3s ease",
      }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        
        .animate-fadeIn { animation: fadeIn 0.6s ease forwards; }
        .animate-slideDown { animation: slideDown 0.3s ease forwards; }
        .animate-pulse { animation: pulse 2s ease-in-out infinite; }
        
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${t.accent}40; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${t.accent}60; }
      `}</style>

      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          background: `radial-gradient(circle at 50% 50%, ${t.accentLight} 0%, transparent 70%)`,
          opacity: 0.5,
        }}
      />

      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: scrollY > 50 ? "12px 48px" : "20px 48px",
          backgroundColor: scrollY > 50 ? t.navBg : "transparent",
          backdropFilter: scrollY > 50 ? "blur(12px)" : "none",
          borderBottom: `1px solid ${scrollY > 50 ? t.border : "transparent"}`,
          transition: "all 0.3s ease",
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >

          <div
  onClick={() => scrollToSection(0)}
  style={{
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  }}
>
  <span style={{
    fontFamily: "'Inter', sans-serif",
    fontSize: "24px",
    fontWeight: "700",
    letterSpacing: "-0.5px",
    color: t.text,
  }}>
    CIVIC
  </span>
  <span style={{
    fontFamily: "'Inter', sans-serif",
    fontSize: "24px",
    fontWeight: "700",
    letterSpacing: "-0.5px",
    color: t.accent,
  }}>
    FIX
  </span>
</div>

          {/* Desktop Navigation */}
          <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
            {/* Section dots */}
            <div style={{ display: "flex", gap: "8px" }}>
              {SECTIONS.map((_, index) => {
                const sectionIndex = index + 1;
                const isActive = activeSection === sectionIndex;
                return (
                  <button
                    key={index}
                    onClick={() => scrollToSection(sectionIndex)}
                    style={{
                      padding: "4px",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        backgroundColor: isActive ? t.accent : t.textMuted,
                        opacity: isActive ? 1 : 0.3,
                        transform: isActive ? "scale(1.2)" : "scale(1)",
                        transition: "all 0.3s ease",
                      }}
                    />
                  </button>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Link
                to="/login"
                style={{
                  padding: "8px 16px",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: t.text,
                  textDecoration: "none",
                  border: `1px solid ${t.border}`,
                  borderRadius: "6px",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = t.accentLight)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                Sign In
              </Link>

              <Link
                to="/signup"
                style={{
                  padding: "8px 16px",
                  fontSize: "14px",
                  fontWeight: "600",
                  backgroundColor: t.accent,
                  color: t.buttonPrimaryText,
                  textDecoration: "none",
                  borderRadius: "6px",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Get Started
              </Link>

              <button
                onClick={toggleTheme}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "6px",
                  border: `1px solid ${t.border}`,
                  backgroundColor: t.toggleBg,
                  color: t.text,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease",
                }}
              >
                {isDark ? (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                ) : (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        ref={(el) => (sectionRefs.current[0] = el)}
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          padding: "120px 48px 80px",
          position: "relative",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            width: "100%",
            position: "relative",
            zIndex: 2,
          }}
        >
          <div className="animate-fadeIn" style={{ marginBottom: "24px" }}>
            <span
              style={{
                fontSize: "14px",
                fontWeight: "500",
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: t.accent,
              }}
            >
              Community Issue Platform
            </span>
          </div>

          <h1
            className="animate-fadeIn"
            style={{
              fontSize: "clamp(48px, 8vw, 96px)",
              fontWeight: "700",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              marginBottom: "24px",
            }}
          >
            Fix Your City,
            <br />
            <span style={{ color: t.accent }}>Together</span>
          </h1>

          <p
            className="animate-fadeIn"
            style={{
              fontSize: "18px",
              lineHeight: 1.6,
              color: t.textMuted,
              maxWidth: "500px",
              marginBottom: "40px",
            }}
          >
            CivicFix connects citizens with local government for transparent
            issue reporting and real-time resolution tracking.
          </p>

          <div
            className="animate-fadeIn"
            style={{
              display: "flex",
              gap: "16px",
              flexWrap: "wrap",
              marginBottom: "32px",
            }}
          >
            <Link
              to="/signup"
              style={{
                padding: "14px 32px",
                fontSize: "16px",
                fontWeight: "600",
                backgroundColor: t.accent,
                color: t.buttonPrimaryText,
                textDecoration: "none",
                borderRadius: "8px",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "translateY(-2px)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "translateY(0)")
              }
            >
              Start Reporting
            </Link>

            <Link
              to="/login"
              style={{
                padding: "14px 32px",
                fontSize: "16px",
                fontWeight: "500",
                color: t.text,
                textDecoration: "none",
                border: `1px solid ${t.border}`,
                borderRadius: "8px",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = t.accentLight;
                e.currentTarget.style.borderColor = t.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.borderColor = t.border;
              }}
            >
              Sign In
            </Link>
          </div>

          <div
            className="animate-fadeIn"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              fontSize: "16px",
              color: t.textMuted,
            }}
          >
            <span>{typingText}</span>
            <span
              style={{
                width: "2px",
                height: "20px",
                backgroundColor: t.accent,
                animation: "pulse 1s infinite",
              }}
            />
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            left: "50%",
            transform: "translateX(-50%)",
            opacity: Math.max(0, 1 - scrollY / 300),
            transition: "opacity 0.3s ease",
          }}
        >
          <div
            style={{
              width: "24px",
              height: "40px",
              border: `2px solid ${t.accent}`,
              borderRadius: "12px",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: "4px",
                height: "8px",
                backgroundColor: t.accent,
                borderRadius: "2px",
                marginTop: "6px",
                animation: "pulse 1.5s infinite",
              }}
            />
          </div>
        </div>
      </section>

      {/* Feature Sections */}
      {SECTIONS.map((section, index) => {
        const sectionIndex = index + 1;
        const image = sectionImages[index];

        return (
          <section
            key={index}
            ref={(el) => (sectionRefs.current[sectionIndex] = el)}
            style={{
              padding: "100px 48px",
              backgroundColor: index % 2 === 0 ? t.background : t.sectionBg,
              borderTop: `1px solid ${t.border}`,
            }}
          >
            <div
              style={{
                maxWidth: "1200px",
                margin: "0 auto",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "80px",
                alignItems: "center",
                direction: section.reverse ? "rtl" : "ltr",
              }}
            >
              {/* Content */}
              <div style={{ direction: "ltr" }}>
                {activeSection === sectionIndex && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "16px",
                    }}
                  >
                    <div
                      style={{
                        width: "4px",
                        height: "24px",
                        backgroundColor: t.accent,
                        borderRadius: "2px",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        letterSpacing: "1px",
                        textTransform: "uppercase",
                        color: t.accent,
                      }}
                    >
                      {section.tagLabel}
                    </span>
                  </div>
                )}

                <h2
                  style={{
                    fontSize: "clamp(32px, 5vw, 48px)",
                    fontWeight: "700",
                    lineHeight: 1.2,
                    marginBottom: "16px",
                  }}
                >
                  {section.title}
                </h2>

                <h3
                  style={{
                    fontSize: "20px",
                    fontWeight: "500",
                    color: t.accent,
                    marginBottom: "16px",
                  }}
                >
                  {section.subtitle}
                </h3>

                <p
                  style={{
                    fontSize: "16px",
                    lineHeight: 1.8,
                    color: t.textMuted,
                    marginBottom: "32px",
                  }}
                >
                  {section.description}
                </p>

                <Link
                  to="#"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: t.accent,
                    textDecoration: "none",
                    borderBottom: `1px solid ${t.accent}`,
                    paddingBottom: "4px",
                  }}
                >
                  Learn More
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 12L11 8L5 4" />
                  </svg>
                </Link>
              </div>

              {/* Image */}
              <div style={{ direction: "ltr" }}>
                <div
                  onMouseEnter={() => setHoveredImage(index)}
                  onMouseLeave={() => setHoveredImage(null)}
                  style={{
                    position: "relative",
                    borderRadius: "12px",
                    overflow: "hidden",
                    aspectRatio: "4/3",
                    border: `1px solid ${t.border}`,
                    boxShadow:
                      hoveredImage === index
                        ? `0 20px 40px ${t.shadow}`
                        : "none",
                    transition: "all 0.3s ease",
                  }}
                >
                  <img
                    src={image}
                    alt={section.title}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      filter: t.imgFilter,
                      transform:
                        hoveredImage === index ? "scale(1.05)" : "scale(1)",
                      transition: "transform 0.5s ease",
                    }}
                  />
                </div>
              </div>
            </div>
          </section>
        );
      })}

      {/* Features Grid */}
      <section
        style={{
          padding: "100px 48px",
          backgroundColor: t.sectionBg,
          borderTop: `1px solid ${t.border}`,
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div
            style={{
              textAlign: "center",
              marginBottom: "60px",
            }}
          >
            <h2
              style={{
                fontSize: "clamp(36px, 5vw, 48px)",
                fontWeight: "700",
                marginBottom: "16px",
              }}
            >
              Everything You Need
            </h2>
            <p
              style={{
                fontSize: "18px",
                color: t.textMuted,
                maxWidth: "600px",
                margin: "0 auto",
              }}
            >
              Powerful tools designed to make community reporting simple and
              effective
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "24px",
            }}
          >
            {FEATURES.map((feature, index) => (
              <div
                key={index}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  padding: "32px",
                  backgroundColor: t.cardBg,
                  border: `1px solid ${hoveredCard === index ? t.accent : t.border}`,
                  borderRadius: "12px",
                  transition: "all 0.3s ease",
                  transform:
                    hoveredCard === index
                      ? "translateY(-4px)"
                      : "translateY(0)",
                  boxShadow:
                    hoveredCard === index ? `0 12px 30px ${t.shadow}` : "none",
                }}
              >
                <div
                  style={{
                    fontSize: "32px",
                    marginBottom: "16px",
                  }}
                >
                  {feature.icon}
                </div>
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: "600",
                    marginBottom: "8px",
                  }}
                >
                  {feature.title}
                </h3>
                <p
                  style={{
                    fontSize: "14px",
                    lineHeight: 1.6,
                    color: t.textMuted,
                  }}
                >
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section
        style={{
          padding: "80px 48px",
          backgroundColor: t.background,
          borderTop: `1px solid ${t.border}`,
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "32px",
          }}
        >
          {STATS.map((stat, index) => (
            <div
              key={index}
              style={{
                textAlign: "center",
                padding: "32px",
                backgroundColor: t.cardBg,
                border: `1px solid ${t.border}`,
                borderRadius: "12px",
              }}
            >
              <div
                style={{
                  fontSize: "48px",
                  fontWeight: "700",
                  color: t.accent,
                  lineHeight: 1,
                  marginBottom: "8px",
                }}
              >
                {stat.value}
                {stat.suffix}
              </div>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  marginBottom: "4px",
                }}
              >
                {stat.label}
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: t.textMuted,
                }}
              >
                {stat.sublabel}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section
        style={{
          padding: "120px 48px",
          backgroundColor: t.sectionBg,
          borderTop: `1px solid ${t.border}`,
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            maxWidth: "800px",
            margin: "0 auto",
            position: "relative",
            zIndex: 2,
          }}
        >
          <h2
            style={{
              fontSize: "clamp(36px, 6vw, 56px)",
              fontWeight: "700",
              marginBottom: "20px",
            }}
          >
            Ready to Make a Difference?
          </h2>
          <p
            style={{
              fontSize: "18px",
              color: t.textMuted,
              marginBottom: "40px",
              maxWidth: "600px",
              margin: "0 auto 40px",
            }}
          >
            Join thousands of citizens building better cities through
            transparency and collaboration
          </p>

          <div
            style={{
              display: "flex",
              gap: "16px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Link
              to="/signup"
              style={{
                padding: "14px 32px",
                fontSize: "16px",
                fontWeight: "600",
                backgroundColor: t.accent,
                color: t.buttonPrimaryText,
                textDecoration: "none",
                borderRadius: "8px",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "translateY(-2px)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "translateY(0)")
              }
            >
              Start Free Today
            </Link>

            <Link
              to="/login"
              style={{
                padding: "14px 32px",
                fontSize: "16px",
                fontWeight: "500",
                color: t.text,
                textDecoration: "none",
                border: `1px solid ${t.border}`,
                borderRadius: "8px",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = t.accentLight;
                e.currentTarget.style.borderColor = t.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.borderColor = t.border;
              }}
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: "60px 48px 40px",
          backgroundColor: t.background,
          borderTop: `1px solid ${t.border}`,
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "32px",
              marginBottom: "48px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <img
                src={isDark ? darkLogo : lightLogo}
                alt="CivicFix"
                style={{ height: "32px", width: "auto" }}
              />
              <span
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                }}
              >
                CivicFix
              </span>
            </div>

            <div
              style={{
                display: "flex",
                gap: "32px",
                flexWrap: "wrap",
              }}
            >
              {["About", "Features", "Roles", "Contact"].map((item) => (
                <Link
                  key={item}
                  to="#"
                  style={{
                    fontSize: "14px",
                    color: t.textMuted,
                    textDecoration: "none",
                    transition: "color 0.2s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = t.accent)}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = t.textMuted)
                  }
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>

          <div
            style={{
              paddingTop: "32px",
              borderTop: `1px solid ${t.border}`,
              textAlign: "center",
              fontSize: "13px",
              color: t.textMuted,
            }}
          >
            © {new Date().getFullYear()} CivicFix. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
