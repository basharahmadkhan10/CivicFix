import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import bgDark from "../assets/images/image_01.png";
import bgLight from "../assets/images/image_02.png";
import PrimaryButton from "../components/ui/PrimaryButton";
import {
  ArrowLeft,
  Mail,
  RefreshCw,
  Shield,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";

const Login = () => {
  const { login, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("citizen");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [pendingLoginData, setPendingLoginData] = useState(null);
  const [countdown, setCountdown] = useState(60);
  const [canResendOtp, setCanResendOtp] = useState(false);
  const [displayText, setDisplayText] = useState("");
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const backgroundImage = theme === "dark" ? bgDark : bgLight;

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const roleMessages = {
    citizen: [
      "Report issues in your city instantly.",
      "Track complaints in real time.",
      "Be the voice of your community.",
    ],
    officer: [
      "Manage assigned complaints efficiently.",
      "Coordinate with departments smoothly.",
      "Resolve issues faster with CivicFix.",
    ],
    supervisor: [
      "Monitor complaint workflows live.",
      "Ensure timely resolution of issues.",
      "Lead your team with smart oversight.",
    ],
    admin: [
      "Control the entire CivicFix system.",
      "Manage users and permissions.",
      "Maintain operational transparency.",
    ],
  };

  useEffect(() => {
    if (showOtpVerification && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (showOtpVerification && countdown === 0) {
      setCanResendOtp(true);
    }
  }, [showOtpVerification, countdown]);

  // Typing effect
  useEffect(() => {
    const messages = roleMessages[activeTab];
    const currentMessage = messages[textIndex];

    const typingSpeed = 100;
    const pauseTime = 1500;

    let timeout;

    if (charIndex < currentMessage.length) {
      timeout = setTimeout(() => {
        setDisplayText((prev) => prev + currentMessage[charIndex]);
        setCharIndex(charIndex + 1);
      }, typingSpeed);
    } else {
      timeout = setTimeout(() => {
        setDisplayText("");
        setCharIndex(0);
        setTextIndex((prev) => (prev + 1) % messages.length);
      }, pauseTime);
    }

    return () => clearTimeout(timeout);
  }, [charIndex, textIndex, activeTab]);

  useEffect(() => {
    setDisplayText("");
    setCharIndex(0);
    setTextIndex(0);
  }, [activeTab]);

  // Modern theme with #97AB33 accent
  const getThemeColors = () => {
    const accentColor = "#97AB33";

    if (theme === "light") {
      return {
        background: "#FFFFFF",
        cardBackground: "#FFFFFF",
        border: "#E5E7EB",
        text: "#111827",
        mutedText: "#6B7280",
        inputBackground: "#F9FAFB",
        buttonBg: accentColor,
        buttonText: "#FFFFFF",
        buttonHover: "#8A9E2E",
        error: "#DC2626",
        success: "#10B981",
        tabActiveBg: accentColor,
        tabActiveText: "#FFFFFF",
        tabInactiveBg: "#F3F4F6",
        tabInactiveText: "#4B5563",
        accent: accentColor,
        accentLight: "rgba(151, 171, 51, 0.1)",
        gradient: "linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 100%)",
      };
    }
    return {
      background: "#0A0A0A",
      cardBackground: "#111111",
      border: "#1F1F1F",
      text: "#FFFFFF",
      mutedText: "#9CA3AF",
      inputBackground: "#1A1A1A",
      buttonBg: accentColor,
      buttonText: "#000000",
      buttonHover: "#A8C03E",
      error: "#EF4444",
      success: "#10B981",
      tabActiveBg: accentColor,
      tabActiveText: "#000000",
      tabInactiveBg: "#1F1F1F",
      tabInactiveText: "#9CA3AF",
      accent: accentColor,
      accentLight: "rgba(151, 171, 51, 0.15)",
      gradient: "linear-gradient(135deg, #0A0A0A 0%, #111111 100%)",
    };
  };

  const colors = getThemeColors();

  const getRoleFromTab = (tab) => {
    switch (tab) {
      case "citizen":
        return "CITIZEN";
      case "officer":
        return "OFFICER";
      case "supervisor":
        return "SUPERVISOR";
      case "admin":
        return "ADMIN";
      default:
        return "CITIZEN";
    }
  };

  const getDashboardRoute = (role) => {
    switch (role) {
      case "CITIZEN":
        return "/dashboard";
      case "OFFICER":
        return "/officer-dashboard";
      case "SUPERVISOR":
        return "/supervisor-dashboard";
      case "ADMIN":
        return "/admin-dashboard";
      default:
        return "/dashboard";
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (!email || !password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    try {
      const role = getRoleFromTab(activeTab);

      const response = await fetch(
        "https://civicfix-backend01.onrender.com/api/v1/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.toLowerCase().trim(),
            password,
            role: role,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || `Login failed with status ${response.status}`,
        );
      }

      if (data.success) {
        const otpRequired =
          data.data?.otpRequired || data.otpRequired || data.requiresOtp;

        if (otpRequired) {
          setPendingLoginData({
            email: email.toLowerCase().trim(),
            role: role,
          });
          setShowOtpVerification(true);
          setMessage("Please enter the OTP sent to your email");
          setCountdown(60);
          setCanResendOtp(false);

          setTimeout(() => {
            document.getElementById("otp-0")?.focus();
          }, 100);
        } else {
          const token = data.data?.token || data.token;
          const userData = data.data?.user ||
            data.data || {
              _id: "temp-id",
              name: email.split("@")[0],
              email: email,
              role: role,
            };

          login(token, userData);
          const dashboardRoute = getDashboardRoute(userData.role || role);
          setTimeout(() => navigate(dashboardRoute), 100);
        }
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleOtpSubmit = async (e) => {
    if (e) e.preventDefault();
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setError("Please enter 6-digit OTP");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "https://civicfix-backend01.onrender.com/api/v1/auth/login/verify-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.toLowerCase().trim(),
            otp: otpString,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "OTP verification failed");
      }

      if (data.success) {
        const token = data?.data?.token;
        const userData = data?.data?.user;

        if (!token || !userData) {
          throw new Error("Invalid OTP response structure");
        }

        login(token, userData);
        setMessage("OTP verified! Redirecting...");
        const dashboardRoute = getDashboardRoute(userData.role);
        setTimeout(() => navigate(dashboardRoute), 1000);
      } else {
        setError(data.message || "Invalid OTP");
      }
    } catch (err) {
      setError(err.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResendOtp) return;
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "https://civicfix-backend01.onrender.com/api/v1/auth/login/resend-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.toLowerCase().trim() }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to resend OTP");
      }

      if (data.success) {
        setMessage("New OTP sent to your email!");
        setOtp(["", "", "", "", "", ""]);
        setCountdown(60);
        setCanResendOtp(false);
        setTimeout(() => document.getElementById("otp-0")?.focus(), 100);
      } else {
        setError(data.message || "Failed to resend OTP");
      }
    } catch (err) {
      setError(err.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowOtpVerification(false);
    setOtp(["", "", "", "", "", ""]);
    setError("");
    setMessage("");
    setPendingLoginData(null);
  };

  const getTabColor = () => colors.accent; 

  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row overflow-hidden"
      style={{
        backgroundColor: colors.background,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        
        * {
          font-family: 'Inter', sans-serif;
        }
        
        @keyframes blink {
          50% { opacity: 0; }
        }
        
        .animate-blink {
          animation: blink 1s step-end infinite;
        }

        /* Mobile-specific styles */
        @media (max-width: 768px) {
          input, button {
            min-height: 44px; /* Better touch targets */
          }
          
          .otp-input {
            width: calc(16.666% - 4px) !important;
            aspect-ratio: 1/1;
          }
        }
      `}</style>

      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between p-4 lg:hidden"
        style={{
          backgroundColor: colors.cardBackground,
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <button
          onClick={() => navigate(`/`)}
          className="p-2 rounded-lg flex items-center justify-center transition-all duration-200 hover:opacity-80"
          style={{
            backgroundColor: colors.inputBackground,
            border: `1px solid ${colors.border}`,
            color: colors.text,
          }}
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: colors.text }}>
            CIVIC
          </span>
          <span className="text-sm font-semibold" style={{ color: colors.accent }}>
            FIX
          </span>
        </div>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg transition-all duration-200 hover:opacity-80"
          style={{
            backgroundColor: colors.inputBackground,
            border: `1px solid ${colors.border}`,
            color: colors.text,
          }}
        >
          {theme === "dark" ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>

      {/* Desktop Theme Toggle */}
      <div className="hidden lg:block absolute top-6 right-6 z-20">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 hover:opacity-80"
          style={{
            backgroundColor: colors.cardBackground,
            border: `1px solid ${colors.border}`,
            color: colors.text,
          }}
        >
          {theme === "dark" ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <span className="text-xs font-medium">Light</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
              <span className="text-xs font-medium">Dark</span>
            </>
          )}
        </button>
      </div>

      {/* Mobile - Full width form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center min-h-screen p-4 lg:p-8 order-2 lg:order-1"
        style={{
          paddingTop: isMobile ? "80px" : "2rem",
          paddingBottom: isMobile ? "2rem" : "2rem",
        }}
      >
        <div className="w-full max-w-md">
          <div
            className="rounded-2xl border shadow-xl backdrop-blur-sm"
            style={{
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
            }}
          >
            <div className="p-6 lg:p-8">
              {showOtpVerification ? (
                <div className="w-full">
                  <div className="text-center mb-6">
                    <div
                      className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 mx-auto"
                      style={{
                        backgroundColor: colors.accentLight,
                        color: colors.accent,
                      }}
                    >
                      <Shield size={20} />
                    </div>
                    <h1
                      className="text-xl lg:text-2xl font-bold mb-2"
                      style={{ color: colors.text }}
                    >
                      Verify OTP
                    </h1>
                    <p
                      className="text-xs lg:text-sm mb-2"
                      style={{ color: colors.mutedText }}
                    >
                      Enter the 6-digit code sent to
                    </p>
                    <p
                      className="text-sm lg:text-base font-medium break-all px-2"
                      style={{ color: colors.accent }}
                    >
                      {email}
                    </p>
                  </div>

                  {error && (
                    <div
                      className="mb-4 p-3 rounded-lg text-xs lg:text-sm flex items-start gap-2"
                      style={{
                        backgroundColor: `${colors.error}10`,
                        color: colors.error,
                        border: `1px solid ${colors.error}20`,
                      }}
                    >
                      <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  {message && (
                    <div
                      className="mb-4 p-3 rounded-lg text-xs lg:text-sm"
                      style={{
                        backgroundColor: `${colors.success}10`,
                        color: colors.success,
                        border: `1px solid ${colors.success}20`,
                      }}
                    >
                      {message}
                    </div>
                  )}

                  <form onSubmit={handleOtpSubmit} className="space-y-6">
                    <div className="flex justify-center gap-2">
                      {[0, 1, 2, 3, 4, 5].map((index) => (
                        <input
                          key={index}
                          id={`otp-${index}`}
                          type="text"
                          maxLength="1"
                          value={otp[index]}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          className="w-10 h-10 sm:w-12 sm:h-12 text-center text-base lg:text-lg rounded-lg border focus:outline-none focus:ring-2 transition-all"
                          style={{
                            backgroundColor: colors.inputBackground,
                            borderColor: colors.border,
                            color: colors.text,
                            outlineColor: colors.accent,
                          }}
                          required
                          disabled={loading}
                          inputMode="numeric"
                          pattern="\d*"
                        />
                      ))}
                    </div>

                    <div className="space-y-4">
                      <PrimaryButton
                        type="submit"
                        loading={loading}
                        fullWidth
                        className="text-sm py-3 rounded-lg font-semibold"
                        style={{
                          backgroundColor: colors.accent,
                          color: colors.buttonText,
                        }}
                      >
                        Verify OTP
                      </PrimaryButton>

                      <div className="flex justify-between items-center">
                        <button
                          type="button"
                          onClick={handleBackToLogin}
                          className="text-xs lg:text-sm flex items-center gap-1 hover:opacity-80 transition-opacity"
                          style={{ color: colors.mutedText }}
                          disabled={loading}
                        >
                          <ArrowLeft size={14} />
                          Back
                        </button>

                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={!canResendOtp || loading}
                          className={`text-xs lg:text-sm flex items-center gap-1 ${
                            canResendOtp
                              ? "hover:opacity-80"
                              : "opacity-50 cursor-not-allowed"
                          } transition-opacity`}
                          style={{ color: colors.accent }}
                        >
                          {canResendOtp ? (
                            <>
                              <RefreshCw size={14} />
                              Resend
                            </>
                          ) : (
                            `Resend in ${countdown}s`
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="w-full">
                  <div className="text-center mb-6 lg:mb-8">
                    <h1
                      className="text-2xl lg:text-4xl font-bold mb-2 tracking-tight"
                      style={{ color: colors.text }}
                    >
                      Welcome Back
                    </h1>
                    <p className="text-sm lg:text-base" style={{ color: colors.mutedText }}>
                      Sign in to continue to CivicFix
                    </p>
                  </div>

                  <div
                    className="grid grid-cols-4 gap-1 p-1 rounded-lg mb-6 lg:mb-8"
                    style={{ backgroundColor: colors.tabInactiveBg }}
                  >
                    {[
                      { id: "citizen", label: "Citizen" },
                      { id: "officer", label: "Officer" },
                      { id: "supervisor", label: "Supervisor" },
                      { id: "admin", label: "Admin" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className="py-2 px-1 text-xs lg:text-sm font-medium rounded-md transition-all duration-200"
                        style={{
                          backgroundColor:
                            activeTab === tab.id ? colors.accent : "transparent",
                          color:
                            activeTab === tab.id
                              ? colors.buttonText
                              : colors.tabInactiveText,
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {error && (
                    <div
                      className="mb-4 p-3 rounded-lg text-xs lg:text-sm flex items-start gap-2"
                      style={{
                        backgroundColor: `${colors.error}10`,
                        color: colors.error,
                        border: `1px solid ${colors.error}20`,
                      }}
                    >
                      <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  {message && (
                    <div
                      className="mb-4 p-3 rounded-lg text-xs lg:text-sm"
                      style={{
                        backgroundColor: `${colors.success}10`,
                        color: colors.success,
                        border: `1px solid ${colors.success}20`,
                      }}
                    >
                      {message}
                    </div>
                  )}

                  <form onSubmit={handleLoginSubmit} className="space-y-4 lg:space-y-5">
                    <div>
                      <label
                        className="block text-xs lg:text-sm font-medium mb-1.5 lg:mb-2"
                        style={{ color: colors.text }}
                      >
                        Email Address
                      </label>
                      <input
                        type="email"
                        placeholder={`Enter your ${activeTab} email`}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all text-sm"
                        style={{
                          backgroundColor: colors.inputBackground,
                          borderColor: colors.border,
                          color: colors.text,
                          outlineColor: colors.accent,
                        }}
                        required
                        disabled={loading}
                        inputMode="email"
                      />
                    </div>

                    <div>
                      <label
                        className="block text-xs lg:text-sm font-medium mb-1.5 lg:mb-2"
                        style={{ color: colors.text }}
                      >
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all text-sm pr-10 lg:pr-12"
                          style={{
                            backgroundColor: colors.inputBackground,
                            borderColor: colors.border,
                            color: colors.text,
                            outlineColor: colors.accent,
                          }}
                          required
                          disabled={loading}
                        />
                        <button
                          type="button"
                          className="absolute right-2 lg:right-3 top-1/2 transform -translate-y-1/2 p-1"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{ color: colors.mutedText }}
                        >
                          {showPassword ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                      </div>
                    </div>

                    <PrimaryButton
                      type="submit"
                      loading={loading}
                      fullWidth
                      className="text-sm py-2.5 lg:py-3 rounded-lg font-semibold mt-2"
                      style={{
                        backgroundColor: colors.accent,
                        color: colors.buttonText,
                      }}
                    >
                      Sign In as{" "}
                      {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                    </PrimaryButton>
                    
                    {activeTab === "citizen" && (
                      <div className="text-center pt-2">
                        <p
                          className="text-xs lg:text-sm"
                          style={{ color: colors.mutedText }}
                        >
                          Don't have an account?{" "}
                          <Link
                            to="/signup"
                            className="font-medium hover:opacity-80 transition-opacity"
                            style={{ color: colors.accent }}
                          >
                            Sign up
                          </Link>
                        </p>
                      </div>
                    )}
                  </form>

                  <div className="mt-4 lg:mt-6 text-center">
                    <p className="text-xs" style={{ color: colors.mutedText }}>
                      © {new Date().getFullYear()} CivicFix. All rights reserved.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop - Background Image Section */}
      <div className="hidden lg:block lg:w-1/2 relative order-1 lg:order-2">
        <div className="w-full h-screen relative overflow-hidden">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              filter: theme === "dark" ? "brightness(0.7)" : "brightness(0.9)",
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  theme === "dark"
                    ? "linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)"
                    : "linear-gradient(to right, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)",
              }}
            />
            <div className="absolute bottom-0 left-0 right-0 p-12">
              <div className="max-w-lg">
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className="w-1 h-8 rounded-full"
                    style={{ backgroundColor: colors.accent }}
                  />
                  <span className="text-sm font-medium uppercase tracking-wider text-white">
                    {activeTab} Portal
                  </span>
                </div>

                <h2 className="text-3xl font-bold mb-3 leading-tight text-white">
                  {showOtpVerification ? (
                    "Secure Your Account"
                  ) : (
                    <>
                      Welcome to the{" "}
                      <span style={{ color: colors.accent }}>
                        {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                      </span>{" "}
                      Dashboard
                    </>
                  )}
                </h2>
                <p className="text-lg mb-6 leading-relaxed text-white/90">
                  <span>{displayText}</span>
                  <span className="ml-1 animate-blink">|</span>
                </p>

                <div className="flex items-center gap-3">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: colors.accent }}
                  />
                  <span className="text-sm text-white/75">
                    {showOtpVerification
                      ? "Secure 2FA Verification"
                      : `${activeTab}-specific access`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
