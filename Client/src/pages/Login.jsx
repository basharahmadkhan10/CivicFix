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
  const [statsCount, setStatsCount] = useState({
    activeCitizens: 0,
    issuesReported: 0,
    citiesCovered: 0,
    satisfaction: 0
  });
  const [pageLoaded, setPageLoaded] = useState(false);
  const [typingText, setTypingText] = useState("");
  const [typingIndex, setTypingIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [countingStarted, setCountingStarted] = useState(false);
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

  // ✅ YOUR EXACT STATS VALUES
  const statsTargets = {
    activeCitizens: 50,
    issuesReported: 100,
    citiesCovered: 10,
    satisfaction: 95
  };

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
            
            // ✅ Start counting when stats section becomes visible (index 6)
            if (index === 6 && !countingStarted) {
              setCountingStarted(true);
              startCounting();
            }
          }
        });
      },
      {
        threshold: 0.4,
      },
    );

    sectionRefs.current.forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, [countingStarted]);

  // ✅ FIXED: Start counting function
  const startCounting = () => {
    const duration = 2000; // 2 seconds
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      
      setStatsCount({
        activeCitizens: Math.floor(statsTargets.activeCitizens * easeOutQuart),
        issuesReported: Math.floor(statsTargets.issuesReported * easeOutQuart),
        citiesCovered: Math.floor(statsTargets.citiesCovered * easeOutQuart),
        satisfaction: Math.floor(statsTargets.satisfaction * easeOutQuart)
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  };

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
    if (window.innerWidth < 768) return;
    
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
    setMobileMenuOpen(false);
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
  
  // ✅ Updated stats with your values
  const stats = [
    { 
      label: "Active Citizens", 
      value: statsCount.activeCitizens, 
      target: 50,
      suffix: "+ using the platform" 
    },
    { 
      label: "Issues Reported", 
      value: statsCount.issuesReported, 
      target: 100,
      suffix: "+ logged so far" 
    },
    { 
      label: "Cities Covered", 
      value: statsCount.citiesCovered, 
      target: 10,
      suffix: "+ actively participating" 
    },
    { 
      label: "User Satisfaction", 
      value: statsCount.satisfaction, 
      target: 95,
      suffix: "% positive feedback" 
    },
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
      {/* Background gradient effect - hidden on mobile */}
      <div
        className="fixed inset-0 pointer-events-none z-0 hidden md:block"
        style={{
          background: `
            radial-gradient(
              800px at ${mousePosition.x}% ${mousePosition.y}%,
              ${theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"},
              transparent 70%
            )
          `,
        }}
      />
      
      {/* Navigation - same as before */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 px-4 py-3 transition-all duration-300 ${
          scrollY > 50 ? "backdrop-blur-md bg-opacity-95" : ""
        }`}
        style={{
          backgroundColor:
            theme === "dark"
              ? scrollY > 50
                ? "rgba(0,0,0,0.95)"
                : "rgba(0,0,0,0.98)"
              : scrollY > 50
                ? "rgba(255,255,255,0.95)"
                : "rgba(255,255,255,0.98)",
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        {/* ... keep your existing navigation code ... */}
        <div className="flex items-center justify-between">
          <div
            className="flex items-center cursor-pointer group"
            onClick={() => scrollToSection(0)}
          >
            <img
              src={currentLogo}
              alt="CivicFix Logo"
              className="h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg focus:outline-none"
            style={{ color: colors.text }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
            <div className="flex items-center space-x-2">
              {sections.map((_, index) => {
                const sectionIndex = index + 1;
                const isActive = activeSection === sectionIndex;
                return (
                  <button
                    key={index}
                    onClick={() => scrollToSection(sectionIndex)}
                    className="relative transition-all duration-300 rounded-2xl p-1"
                    style={{
                      backgroundColor: isActive ? (theme === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)") : "transparent",
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full transition-all duration-300"
                      style={{
                        backgroundColor: isActive ? colors.accent : colors.mutedText,
                        opacity: isActive ? 1 : 0.5,
                        transform: isActive ? "scale(1.25)" : "scale(1)",
                      }}
                    />
                  </button>
                );
              })}
            </div>

            <div className="flex items-center space-x-3">
              <Link to="/login" className="text-sm font-medium relative group overflow-hidden px-3 py-2" style={{ color: colors.text }}>
                <span className="relative z-10">Sign In</span>
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" style={{ background: colors.shinyOverlay }} />
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 group-hover:w-full transition-all duration-300" style={{ backgroundColor: colors.accent }} />
              </Link>

              <PrimaryButton as={Link} to="/signup" theme={theme} className="relative overflow-hidden group px-4 py-2 text-sm">
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <span className="relative z-10">Get Started</span>
              </PrimaryButton>

              <button onClick={toggleTheme} className="p-2 rounded-lg border transition-all duration-200 hover:scale-105" style={{
                backgroundColor: theme === "dark" ? "#0a0a0a" : "#f5f5f5",
                borderColor: theme === "dark" ? "#1a1a1a" : "#e5e5e5",
                color: theme === "dark" ? "#ffffff" : "#000000",
              }}>
                {theme === "dark" ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 p-4 rounded-lg animate-slideDown" style={{
            backgroundColor: theme === "dark" ? "#1a1a1a" : "#f5f5f5",
            border: `1px solid ${colors.border}`,
          }}>
            <div className="flex flex-wrap gap-2 mb-4">
              {sections.map((section, index) => (
                <button key={index} onClick={() => scrollToSection(index + 1)} className="px-3 py-2 rounded-lg text-sm transition-all" style={{
                  backgroundColor: activeSection === index + 1 ? colors.accent : "transparent",
                  color: activeSection === index + 1 ? (theme === "dark" ? "#000" : "#fff") : colors.text,
                  border: `1px solid ${colors.border}`,
                }}>
                  {section.title.split(" ")[0]}
                </button>
              ))}
            </div>
            <div className="flex flex-col space-y-3">
              <Link to="/login" className="w-full text-center py-3 rounded-lg font-medium" style={{
                backgroundColor: theme === "dark" ? "#333" : "#e5e5e5",
                color: colors.text,
              }} onClick={() => setMobileMenuOpen(false)}>
                Sign In
              </Link>
              <Link to="/signup" className="w-full text-center py-3 rounded-lg font-medium" style={{
                backgroundColor: colors.accent,
                color: theme === "dark" ? "#000" : "#fff",
              }} onClick={() => setMobileMenuOpen(false)}>
                Get Started
              </Link>
              <button onClick={() => { toggleTheme(); setMobileMenuOpen(false); }} className="w-full text-center py-3 rounded-lg font-medium flex items-center justify-center gap-2" style={{
                backgroundColor: theme === "dark" ? "#333" : "#e5e5e5",
                color: colors.text,
              }}>
                {theme === "dark" ? "Switch to Light" : "Switch to Dark"}
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section ref={(el) => (sectionRefs.current[0] = el)} className="relative min-h-screen flex items-center justify-center px-4 pt-16 overflow-hidden">
        <div className="absolute inset-0 transition-all duration-300" style={{
          boxShadow: getDynamicShadow(-2),
          transform: `translateY(${scrollY * 0.1}px)`,
          background: colors.gradient,
        }} />

        <div className="relative z-10 max-w-6xl mx-auto text-center px-2">
          <div className="mb-8 md:mb-12">
            <div className="mb-3 md:mb-4 h-8 md:h-12">
              <span className="text-base md:text-2xl lg:text-3xl font-light inline-block" style={{ color: colors.mutedText }}>
                {typingText}
                <span className="ml-1 animate-pulse" style={{ color: colors.accent }}>|</span>
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-4 md:mb-6 leading-tight">
              Fix Your City,
              <br />
              <span className="font-bold relative inline-block mt-2" style={{
                color: colors.accent,
                textShadow: `0 5px 20px ${colors.glow}`,
              }}>
                Together
                <div className="absolute -bottom-2 left-0 w-full h-0.5 md:h-1" style={{
                  background: `linear-gradient(90deg, transparent, ${colors.accent}, transparent)`,
                }} />
              </span>
            </h1>
            
            <p className="text-sm sm:text-base md:text-xl lg:text-2xl mb-6 md:mb-10 max-w-3xl mx-auto leading-relaxed px-2" style={{ color: colors.mutedText }}>
              CivicFix connects citizens with local government for transparent
              issue reporting and real-time resolution tracking.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center px-4 sm:px-0">
            <PrimaryButton as={Link} to="/signup" size="lg" theme={theme} className="text-sm sm:text-base md:text-lg px-6 sm:px-8 py-3 sm:py-4 rounded-xl relative overflow-hidden group w-full sm:w-auto">
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative z-10">Start Reporting</span>
            </PrimaryButton>
            
            <SecondaryButton as={Link} to="/login" size="lg" theme={theme} className="text-sm sm:text-base md:text-lg px-6 sm:px-8 py-3 sm:py-4 rounded-xl relative overflow-hidden group w-full sm:w-auto">
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative z-10">Sign In</span>
            </SecondaryButton>
          </div>
        </div>

        <div className="absolute bottom-4 md:bottom-8 left-1/2 transform -translate-x-1/2 transition-opacity duration-300 hidden sm:block" style={{ opacity: Math.max(0, 1 - scrollY / 300) }}>
          <div className="animate-bounce">
            <div className="w-5 h-8 md:w-6 md:h-10 rounded-full border-2 flex items-start justify-center p-1" style={{ borderColor: colors.accent }}>
              <div className="w-1 h-2 rounded-full animate-pulse" style={{ backgroundColor: colors.accent }} />
            </div>
          </div>
        </div>
      </section>

      {/* Feature Sections */}
      {sections.map((section, index) => (
        <section key={index} ref={(el) => (sectionRefs.current[index + 1] = el)} className="py-12 md:py-20 px-4 relative" style={{
          backgroundColor: index % 2 === 0 ? colors.sectionBg : colors.background,
        }}>
          <div className="max-w-6xl mx-auto">
            <div className={`flex flex-col ${section.reverse ? "lg:flex-row-reverse" : "lg:flex-row"} items-center gap-6 md:gap-8 lg:gap-12`}>
              <div className="w-full lg:w-1/2 order-2 lg:order-1">
                <div className="flex items-center gap-3 mb-4">
                  {activeSection === index + 1 && (
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full animate-pulse" style={{ backgroundColor: colors.accent }} />
                  )}
                </div>
                
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 relative">
                  {section.title}
                  {activeSection === index + 1 && (
                    <div className="absolute -left-4 md:-left-8 top-2 md:top-3 w-1 h-8 md:h-12 rounded-full" style={{ backgroundColor: colors.accent }} />
                  )}
                </h2>
                
                <p className="text-base sm:text-lg md:text-xl font-medium mb-3 md:mb-4" style={{ color: colors.accent }}>
                  {section.subtitle}
                </p>
                
                <p className="text-sm sm:text-base md:text-lg leading-relaxed opacity-90" style={{ color: colors.mutedText }}>
                  {section.description}
                </p>
              </div>

              <div className="w-full lg:w-1/2 order-1 lg:order-2 mb-6 lg:mb-0">
                <div className="h-48 sm:h-64 md:h-80 lg:h-96 rounded-xl md:rounded-2xl overflow-hidden relative group/image"
                  onMouseMove={handleTilt} onMouseLeave={resetTilt} onMouseEnter={() => setHoveredImageCard(index)}
                  style={{
                    backgroundColor: colors.cardBg,
                    border: `1px solid ${colors.border}`,
                    boxShadow: getDynamicShadow(index * 10),
                  }}
                >
                  <span className="absolute inset-0 -translate-x-full group-hover/image:translate-x-full transition-transform duration-1000 z-20 hidden md:block" style={{
                    background: colors.shinyOverlay,
                    width: "200%",
                    left: "-50%",
                  }} />
                  <img src={section.image} alt={section.title} className="w-full h-full object-cover transition-transform duration-700 group-hover/image:scale-110" loading="lazy" />
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* Features Grid Section */}
      <section ref={(el) => (sectionRefs.current[5] = el)} className="py-12 md:py-20 px-4" style={{ backgroundColor: colors.sectionBg }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6">Everything You Need</h2>
            <p className="text-sm sm:text-base md:text-xl max-w-3xl mx-auto px-4" style={{ color: colors.mutedText }}>
              Powerful tools designed to make community reporting simple and effective
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {features.map((feature, index) => (
              <div key={index} className="p-4 sm:p-6 md:p-8 rounded-lg md:rounded-xl transition-all duration-300 group relative overflow-hidden"
                onMouseEnter={() => setHoveredCard(index + 50)} onMouseLeave={() => setHoveredCard(null)}
                style={{
                  backgroundColor: colors.cardBg,
                  border: `1px solid ${colors.border}`,
                  boxShadow: getDynamicShadow(index + 100),
                }}
              >
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 hidden md:block" style={{
                  background: colors.shinyOverlay,
                  width: "200%",
                  left: "-50%",
                }} />

                <div className="relative z-10">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold mb-2 md:mb-3">{feature.title}</h3>
                  <p className="text-xs sm:text-sm md:text-base leading-relaxed" style={{ color: colors.mutedText }}>
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ✅ STATS SECTION - NOW DYNAMIC WITH YOUR VALUES */}
      <section ref={(el) => (sectionRefs.current[6] = el)} className="py-12 md:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="text-center p-3 sm:p-4 md:p-6 lg:p-8 rounded-lg md:rounded-xl transition-all duration-300 hover:scale-105 group relative overflow-hidden"
                onMouseEnter={() => setHoveredCard(index + 200)} onMouseLeave={() => setHoveredCard(null)}
                style={{
                  backgroundColor: colors.cardBg,
                  border: `1px solid ${colors.border}`,
                  boxShadow: getDynamicShadow(index + 200),
                }}
              >
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 hidden md:block" style={{
                  background: colors.shinyOverlay,
                  width: "200%",
                  left: "-50%",
                }} />

                <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-1 md:mb-2 transition-all duration-500 relative z-10" style={{ color: colors.accent }}>
                  {index === 3 ? `${stat.value}%` : `${stat.value}+`}
                </div>
                <div className="text-xs sm:text-sm md:text-base lg:text-lg font-medium mb-1 relative z-10" style={{ color: colors.text }}>
                  {stat.label}
                </div>
                <div className="text-2xs sm:text-xs md:text-sm opacity-80 relative z-10" style={{ color: colors.mutedText }}>
                  {stat.suffix}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section ref={(el) => (sectionRefs.current[7] = el)} className="py-12 md:py-20 px-4" style={{ backgroundColor: colors.sectionBg }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-8 px-4">
            Ready to Make a Difference?
          </h2>
          <p className="text-sm sm:text-base md:text-xl mb-6 md:mb-12 max-w-2xl mx-auto px-4" style={{ color: colors.mutedText }}>
            Join thousands of citizens building better cities through transparency and collaboration
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center px-4">
            <PrimaryButton as={Link} to="/signup" size="lg" theme={theme} className="rounded-lg md:rounded-xl px-6 sm:px-8 md:px-10 py-3 md:py-4 relative overflow-hidden group w-full sm:w-auto">
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative z-10 text-sm sm:text-base">Start Free Today</span>
            </PrimaryButton>
            
            <SecondaryButton as={Link} to="/login" size="lg" theme={theme} className="rounded-lg md:rounded-xl px-6 sm:px-8 md:px-10 py-3 md:py-4 relative overflow-hidden group w-full sm:w-auto">
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative z-10 text-sm sm:text-base">Sign In</span>
            </SecondaryButton>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 md:py-12 px-4" style={{
        borderTop: `1px solid ${colors.border}`,
        backgroundColor: colors.background,
      }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <div className="flex items-center justify-center md:justify-start space-x-2 md:space-x-3 mb-2">
                <img src={currentLogo} alt="CivicFix Logo" className="h-8 md:h-10 w-auto object-contain" />
                <span className="text-lg md:text-xl font-bold">CivicFix</span>
              </div>
              <p className="text-xs md:text-sm opacity-80" style={{ color: colors.mutedText }}>
                Building better cities, together.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-4 md:gap-8">
              {["About", "Features", "Contact"].map((item, idx) => (
                <Link key={idx} to="#" className="text-xs md:text-sm relative group overflow-hidden px-2 py-1" style={{ color: colors.text }}>
                  <span className="relative z-10">{item}</span>
                  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 hidden md:block" style={{ background: colors.shinyOverlay }} />
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 group-hover:w-full transition-all duration-300" style={{ backgroundColor: colors.accent }} />
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-6 md:mt-8 pt-6 md:pt-8 text-center" style={{ borderTop: `1px solid ${colors.border}` }}>
            <p className="text-xs md:text-sm opacity-80" style={{ color: colors.mutedText }}>
              © {new Date().getFullYear()} CivicFix. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default HomePage;
