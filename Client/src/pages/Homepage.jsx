import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import PrimaryButton from "../components/ui/PrimaryButton";
import SecondaryButton from "../components/ui/SecondaryButton";
import Preloader from "../components/Preloader";
import lightLogo from "../assets/images/img01.png";
import darkLogo from "../assets/images/img02.png";
import imgReport from "../assets/images/img03.png";
import imgTrack from "../assets/images/img04.png";
import imgGov from "../assets/images/img05.png";
import imgCommunity from "../assets/images/img06.png";

const HomePage = () => {
  const { theme, toggleTheme } = useTheme();
  const [scrollY, setScrollY] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [activeSection, setActiveSection] = useState(0);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredImageCard, setHoveredImageCard] = useState(null);
  const [statsCount, setStatsCount] = useState({ 0: 0, 1: 0, 2: 0, 3: 0 });
  const [pageLoaded, setPageLoaded] = useState(false);
  const [typingText, setTypingText] = useState("");
  const [typingIndex, setTypingIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const sectionRefs = useRef([]);
  const rafId = useRef(null);

  const typingPhrases = [
    "Report Issues Instantly",
    "Track Progress Live",
    "Connect with Officials",
    "Build Better Communities",
    "Make Your Voice Heard",
  ];
  const currentLogo = theme === "dark" ? darkLogo : lightLogo;

  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoaded(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(
      () => {
        const currentPhrase = typingPhrases[typingIndex];

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
            setTypingIndex((prev) => (prev + 1) % typingPhrases.length);
          }
        }
      },
      deleting ? 50 : 100,
    );

    return () => clearTimeout(timeout);
  }, [typingText, typingIndex, deleting]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      setMousePosition({ x, y });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = sectionRefs.current.findIndex(
              (sec) => sec === entry.target,
            );
            if (index !== -1) {
              setActiveSection(index);
            }
          }
        });
      },
      {
        threshold: 0.6,
      },
    );

    sectionRefs.current.forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const stats = [
      { target: 10000, duration: 2000 },
      { target: 50000, duration: 2500 },
      { target: 100, duration: 1500 },
      { target: 95, duration: 1800 },
    ];

    const startCounting = () => {
      stats.forEach((stat, index) => {
        const startTime = Date.now();
        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / stat.duration, 1);
          const easeOut = 1 - Math.pow(1 - progress, 3);
          const current = Math.floor(stat.target * easeOut);

          setStatsCount((prev) => ({
            ...prev,
            [index]: current,
          }));

          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };
        animate();
      });
    };

    if (activeSection >= 6) {
      startCounting();
    }
  }, [activeSection]);

  const getThemeColors = () => {
    if (theme === "light") {
      return {
        background: "#ffffff",
        text: "#000000",
        mutedText: "#666666",
        accent: "#000000",
        cardBg: "#cad4f3",
        border: "rgba(0,0,0,0.1)",
        gradient: "linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)",
        buttonBg: "#000000",
        buttonText: "#ffffff",
        sectionBg: "#d4d4d4",
        glow: "rgba(0,0,0,0.15)",
        shadow: "rgba(0,0,0,0.1)",
        shinyOverlay:
          "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.5) 50%, transparent 60%)",
      };
    }
    return {
      background: "#000000",
      text: "#ffffff",
      mutedText: "#cccccc",
      accent: "#ffffff",
      cardBg: "#111111",
      border: "rgba(255,255,255,0.1)",
      gradient: "linear-gradient(135deg, #000000 0%, #0a0a0a 100%)",
      buttonBg: "#ffffff",
      buttonText: "#000000",
      sectionBg: "#050505",
      glow: "rgba(255,255,255,0.15)",
      shadow: "rgba(255,255,255,0.1)",
      shinyOverlay:
        "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.25) 50%, transparent 60%)",
    };
  };

  const colors = getThemeColors();
  const getDynamicShadow = (index) => {
    if (hoveredCard === index) {
      const offsetX = ((mousePosition.x - 50) / 50) * 10;
      const offsetY = ((mousePosition.y - 50) / 50) * 10;
      return `${offsetX}px ${offsetY}px 40px ${colors.shadow}`;
    }
    return `0 8px 30px ${theme === "dark" ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.08)"}`;
  };

  const handleTilt = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = -((y - centerY) / centerY) * 5;
    const rotateY = ((x - centerX) / centerX) * 5;

    if (rafId.current) cancelAnimationFrame(rafId.current);

    rafId.current = requestAnimationFrame(() => {
      card.style.transform = `
        perspective(1200px)
        rotateX(${rotateX}deg)
        rotateY(${rotateY}deg)
        scale(1.04)
      `;
    });
  };
  const resetTilt = (e) => {
    if (rafId.current) cancelAnimationFrame(rafId.current);
    e.currentTarget.style.transform = `
      perspective(1200px)
      rotateX(0deg)
      rotateY(0deg)
      scale(1)
    `;
  };

  const scrollToSection = (index) => {
    if (sectionRefs.current[index]) {
      sectionRefs.current[index].scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };
  const sections = [
    {
      title: "Your City, Your Voice",
      subtitle: "Empowering Citizens to Be Heard",
      description:
        "CivicFix gives every citizen a simple and transparent way to raise local issues, ensuring their voices reach the right authorities without friction or delay.",
      reverse: false,
      image: imgReport,
    },
    {
      title: "Track Every Issue",
      subtitle: "From Report to Resolution",
      description:
        "Stay informed at every step with real-time updates, clear timelines, and full visibility into how reported issues are reviewed, assigned, and resolved.",
      reverse: true,
      image: imgTrack,
    },
    {
      title: "Government Accountability",
      subtitle: "Transparency That Builds Trust",
      description:
        "Local authorities manage complaints efficiently with structured workflows, performance tracking, and public accountability—creating trust through action.",
      reverse: false,
      image: imgGov,
    },
    {
      title: "Community Collaboration",
      subtitle: "Building Better Cities Together",
      description:
        "Citizens, officials, and communities work together to identify priorities, resolve recurring problems, and shape safer, cleaner, and smarter cities.",
      reverse: true,
      image: imgCommunity,
    },
  ];
  const features = [
    {
      title: "Instant Reporting",
      description:
        "Submit complaints quickly with photos, location, and details — no long forms.",
    },
    {
      title: "Precise Mapping",
      description:
        "Mark the exact location of issues on interactive maps for faster resolution.",
    },
    {
      title: "Live Updates",
      description:
        "Receive status updates from authorities when your complaint is acknowledged and in progress.",
    },
    {
      title: "Community Collaboration",
      description:
        "Engage with neighbors, report recurring issues, and suggest improvements for your area.",
    },
    {
      title: "Insightful Analytics",
      description:
        "Track trends in complaints to see which areas need attention most.",
    },
    {
      title: "Secure Platform",
      description:
        "Your data and reports are safe — we do not share personal information without consent.",
    },
  ];
  const stats = [
    { label: "Active Citizens", value: 1200, suffix: "using the platform" },
    { label: "Issues Reported", value: 350, suffix: "logged so far" },
    { label: "Cities Covered", value: 3, suffix: "actively participating" },
    { label: "User Satisfaction", value: 87, suffix: "% positive feedback" },
  ];
  if (!pageLoaded) {
    return <Preloader />;
  }

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{
        backgroundColor: colors.background,
        color: colors.text,
      }}
    >
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `
            radial-gradient(
              800px at ${mousePosition.x}% ${mousePosition.y}%,
              ${theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"},
              transparent 70%
            )
          `,
          transition: "background 0.1s linear",
        }}
      />
      <nav
        className={`fixed top-0 left-0 right-0 z-50 px-6 py-4 transition-all duration-300 ${
          scrollY > 100 ? "backdrop-blur-md bg-opacity-90" : ""
        }`}
        style={{
          backgroundColor:
            theme === "dark"
              ? scrollY > 100
                ? "rgba(0,0,0,0.9)"
                : "rgba(0,0,0,0.95)"
              : scrollY > 100
                ? "rgba(255,255,255,0.9)"
                : "rgba(255,255,255,0.95)",
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <div className="max-w-7xl h-8 p-5 mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div
              className="flex items-center space-x-3 cursor-pointer group"
              onClick={() => scrollToSection(0)}
            >
              <img
                src={currentLogo}
                alt="CivicFix Logo"
                className="h-16 w-20 object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="hidden md:flex items-center space-x-3">
              {sections.map((_, index) => {
                const sectionIndex = index + 1;
                const isActive = activeSection === sectionIndex;

                return (
                  <button
                    key={index}
                    onClick={() => scrollToSection(sectionIndex)}
                    className="relative transition-all duration-300 rounded-2xl"
                    style={{
                      padding: "6px",
                      backgroundColor: isActive
                        ? theme === "dark"
                          ? "rgba(255,255,255,0.15)"
                          : "rgba(0,0,0,0.1)"
                        : "transparent",
                      backdropFilter: isActive ? "blur(6px)" : "none",
                    }}
                  >
                    <div
                      className="w-3 h-3 rounded-full transition-all duration-300"
                      style={{
                        backgroundColor: isActive
                          ? colors.accent
                          : colors.mutedText,
                        opacity: isActive ? 1 : 0.5,
                        transform: isActive ? "scale(1.25)" : "scale(1)",
                        boxShadow: isActive
                          ? `0 0 10px ${colors.accent}`
                          : "none",
                      }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <Link
              to="/login"
              className="text-md font-medium relative group overflow-hidden px-3 py-2"
              style={{ color: colors.text }}
            >
              <span className="relative z-10">Sign In</span>
              
              <span
                className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                style={{
                  background: colors.shinyOverlay,
                }}
              />
              
              <span
                className="absolute -bottom-1 left-0 w-0 h-0.5 group-hover:w-full transition-all duration-300"
                style={{ backgroundColor: colors.accent }}
              />
            </Link>

            <PrimaryButton
              as={Link}
              to="/signup"
              theme={theme}
              className="relative overflow-hidden group w-33 h-10"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative z-10 text-md">Get Started</span>
            </PrimaryButton>

            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-3 py-1.5 lg:px-4 lg:py-2 rounded-lg border transition-all duration-200 hover:scale-105"
              style={{
                backgroundColor: theme === "dark" ? "#0a0a0a" : "#f5f5f5",
                borderColor: theme === "dark" ? "#1a1a1a" : "#e5e5e5",
                color: theme === "dark" ? "#ffffff" : "#000000",
              }}
            >
              {theme === "dark" ? (
                <>
                  <svg
                    className="w-4 h-4 lg:w-5 lg:h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  <span className="text-xs lg:text-sm font-medium">Light</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 lg:w-5 lg:h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                  <span className="text-xs lg:text-sm font-medium">Dark</span>
                </>
              )}
            </button>
          </div>
        </div>
      </nav>
      <section
        ref={(el) => (sectionRefs.current[0] = el)}
        className="relative min-h-screen flex items-center justify-center px-6 pt-20 overflow-hidden"
      >
    
        <div
          className="absolute inset-0 transition-all duration-300"
          style={{
            boxShadow: getDynamicShadow(-2),
            transform: `translateY(${scrollY * 0.1}px)`,
            background: colors.gradient,
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <div className="mb-12">
        
            <div className="mb-4 h-12">
              <span
                className="text-2xl md:text-3xl font-light inline-block"
                style={{ color: colors.mutedText }}
              >
                {typingText}
                <span
                  className="ml-1 animate-pulse"
                  style={{ color: colors.accent }}
                >
                  |
                </span>
              </span>
            </div>

            <h1
              className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
              style={{
                transform: `translateY(${Math.max(0, scrollY * 0.05)}px)`,
                textShadow: `0 10px 30px ${colors.shadow}`,
              }}
            >
              Fix Your City,
              <br />
              <span
                className="font-bold relative inline-block"
                style={{
                  color: colors.accent,
                  textShadow: `0 5px 20px ${colors.glow}`,
                }}
              >
                Together
                <div
                  className="absolute -bottom-2 left-0 w-full h-1"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${colors.accent}, transparent)`,
                  }}
                />
              </span>
            </h1>
            <p
              className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto leading-relaxed opacity-90"
              style={{
                color: colors.mutedText,
                transform: `translateY(${Math.max(0, scrollY * 0.03)}px)`,
              }}
            >
              CivicFix connects citizens with local government for transparent
              issue reporting and real-time resolution tracking.
            </p>
          </div>

          <div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            style={{
              transform: `translateY(${Math.max(0, scrollY * 0.02)}px)`,
            }}
          >
            <PrimaryButton
              as={Link}
              to="/signup"
              size="lg"
              theme={theme}
              className="text-lg px-8 py-4 rounded-xl relative overflow-hidden group w-40 h-12"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative z-10">Start Reporting</span>
            </PrimaryButton>
            <SecondaryButton
              as={Link}
              to="/login"
              size="lg"
              theme={theme}
              className="text-lg px-8 py-4 rounded-xl relative overflow-hidden group"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative z-10">Sign In</span>
            </SecondaryButton>
          </div>
        </div>

      
        <div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 transition-opacity duration-300"
          style={{ opacity: Math.max(0, 1 - scrollY / 300) }}
        >
          <div className="animate-bounce">
            <div
              className="w-6 h-10 rounded-full border-2 flex items-start justify-center p-1"
              style={{ borderColor: colors.accent }}
            >
              <div
                className="w-1 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: colors.accent }}
              />
            </div>
          </div>
        </div>
      </section>
      {sections.map((section, index) => (
        <section
          key={index}
          ref={(el) => (sectionRefs.current[index + 1] = el)}
          className="py-20 px-6 relative"
          style={{
            backgroundColor:
              index % 2 === 0 ? colors.sectionBg : colors.background,
          }}
        >
          <div className="max-w-6xl mx-auto">
            <div
              className={`flex flex-col ${
                section.reverse ? "lg:flex-row-reverse" : "lg:flex-row"
              } items-center gap-12`}
            >
              {/* Text Content */}
              <div className="lg:w-1/2">
                <div className="flex items-center gap-3 mb-6">
                  {activeSection === index + 1 && (
                    <div
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{ backgroundColor: colors.accent }}
                    />
                  )}
                </div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6 relative">
                  {section.title}
                  {activeSection === index + 1 && (
                    <div
                      className="absolute -left-8 top-3 w-1 h-12 rounded-full"
                      style={{ backgroundColor: colors.accent }}
                    />
                  )}
                </h2>
                <p
                  className="text-xl font-medium mb-4"
                  style={{ color: colors.accent }}
                >
                  {section.subtitle}
                </p>
                <p
                  className="text-lg leading-relaxed opacity-90"
                  style={{ color: colors.mutedText }}
                >
                  {section.description}
                </p>
              </div>

              {/* Visual Image Card with Shiny Effect on the Div */}
              <div className="lg:w-1/2">
                <div
                  className="h-70 w-130 lg:h-96 rounded-2xl overflow-hidden relative group/image"
                  onMouseMove={handleTilt}
                  onMouseLeave={resetTilt}
                  onMouseEnter={() => setHoveredImageCard(index)}
                  style={{
                    backgroundColor: colors.cardBg,
                    border: `1px solid ${colors.border}`,
                    boxShadow: getDynamicShadow(index * 10),
                    transition:
                      "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                >
                  {/* Shiny overlay effect on the div (not on image) */}
                  <span
                    className="absolute inset-0 -translate-x-full group-hover/image:translate-x-full transition-transform duration-1000 z-20"
                    style={{
                      background: colors.shinyOverlay,
                      width: "200%",
                      left: "-50%",
                    }}
                  />
                  <img
                    src={section.image}
                    alt={section.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover/image:scale-110"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}
      <section
        ref={(el) => (sectionRefs.current[5] = el)}
        className="py-20 px-6"
        style={{ backgroundColor: colors.sectionBg }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Everything You Need
            </h2>
            <p
              className="text-xl max-w-3xl mx-auto opacity-90"
              style={{ color: colors.mutedText }}
            >
              Powerful tools designed to make community reporting simple and
              effective
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-8 rounded-xl transition-all duration-300 group relative overflow-hidden"
                onMouseEnter={() => setHoveredCard(index + 50)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  backgroundColor: colors.cardBg,
                  border: `1px solid ${colors.border}`,
                  boxShadow: getDynamicShadow(index + 100),
                  transform:
                    hoveredCard === index + 100 ? "translateY(-8px)" : "none",
                }}
              >
                <span
                  className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                  style={{
                    background: colors.shinyOverlay,
                    width: "200%",
                    left: "-50%",
                  }}
                />

                <div className="relative z-10">
                  <div className="text-4xl mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p
                    className="opacity-90 transition-opacity duration-300 group-hover:opacity-100"
                    style={{ color: colors.mutedText }}
                  >
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section
        ref={(el) => (sectionRefs.current[6] = el)}
        className="py-20 px-6"
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="text-center p-8 rounded-xl transition-all duration-300 hover:scale-105 group relative overflow-hidden"
                onMouseEnter={() => setHoveredCard(index + 200)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  backgroundColor: colors.cardBg,
                  border: `1px solid ${colors.border}`,
                  boxShadow: getDynamicShadow(index + 200),
                }}
              >
                <span
                  className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                  style={{
                    background: colors.shinyOverlay,
                    width: "200%",
                    left: "-50%",
                  }}
                />

                <div
                  className="text-4xl font-bold mb-2 transition-all duration-500 relative z-10"
                  style={{
                    color: colors.accent,
                  }}
                >
                  {index === 3
                    ? `${statsCount[index]}%`
                    : `${statsCount[index].toLocaleString()}+`}
                </div>
                <div
                  className="text-lg font-medium mb-1 relative z-10"
                  style={{ color: colors.text }}
                >
                  {stat.label}
                </div>
                <div
                  className="text-sm opacity-80 relative z-10"
                  style={{ color: colors.mutedText }}
                >
                  {stat.suffix}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section
        ref={(el) => (sectionRefs.current[7] = el)}
        className="py-20 px-6"
        style={{ backgroundColor: colors.sectionBg }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            Ready to Make a Difference?
          </h2>
          <p
            className="text-xl mb-12 max-w-2xl mx-auto opacity-90"
            style={{ color: colors.mutedText }}
          >
            Join thousands of citizens building better cities through
            transparency and collaboration
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <PrimaryButton
              as={Link}
              to="/signup"
              size="lg"
              theme={theme}
              className="rounded-xl px-10 py-4 relative overflow-hidden group"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative z-10">Start Free Today</span>
            </PrimaryButton>
            <SecondaryButton
              as={Link}
              to="/login"
              size="lg"
              theme={theme}
              className="rounded-xl px-10 py-4 relative overflow-hidden group"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative z-10">Sign In to Continue</span>
            </SecondaryButton>
          </div>
        </div>
      </section>
      <footer
        className="py-12 px-6"
        style={{
          borderTop: `1px solid ${colors.border}`,
          backgroundColor: colors.background,
        }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center space-x-3 mb-4">
                <img
                  src={currentLogo}
                  alt="CivicFix Logo"
                  className="h-10 w-auto object-contain"
                />
                <span className="text-xl font-bold">CivicFix</span>
              </div>
              <p
                className="text-sm opacity-80"
                style={{ color: colors.mutedText }}
              >
                Building better cities, together.
              </p>
            </div>

            <div className="flex space-x-8">
              {["About", "Features", "Contact"].map((item, idx) => (
                <Link
                  key={idx}
                  to="#"
                  className="text-sm relative group overflow-hidden px-2 py-1"
                  style={{ color: colors.text }}
                >
                  <span className="relative z-10">{item}</span>
                 
                  <span
                    className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                    style={{
                      background: colors.shinyOverlay,
                    }}
                  />
                  <span
                    className="absolute -bottom-1 left-0 w-0 h-0.5 group-hover:w-full transition-all duration-300"
                    style={{ backgroundColor: colors.accent }}
                  />
                </Link>
              ))}
            </div>
          </div>

          <div
            className="mt-8 pt-8 text-center"
            style={{ borderTop: `1px solid ${colors.border}` }}
          >
            <p
              className="text-sm opacity-80"
              style={{ color: colors.mutedText }}
            >
              © {new Date().getFullYear()} CivicFix. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;

