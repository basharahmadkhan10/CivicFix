import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import bgDark from "../assets/images/image_01.png";
import bgLight from "../assets/images/image_02.png";
import PrimaryButton from "../components/ui/PrimaryButton";
import { ArrowLeft, Mail, RefreshCw, Shield, AlertCircle } from "lucide-react";

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

  const backgroundImage = theme === "dark" ? bgDark : bgLight;
  const [displayText, setDisplayText] = useState("");
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    if (showOtpVerification && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (showOtpVerification && countdown === 0) {
      setCanResendOtp(true);
    }
  }, [showOtpVerification, countdown]);
  
  const getThemeColors = () => {
    if (theme === "light") {
      return {
        background: "#ffffff",
        cardBackground: "#cad4f3",
        border: "#B0B0B0",
        text: "#000000",
        mutedText: "#555555",
        inputBackground: "#F5F5F5",
        buttonBg: "#000000",
        buttonText: "#ffffff",
        buttonHover: "#111111",
        error: "#dc2626",
        success: "#16a34a",
        tabActiveBg: "#000000",
        tabActiveText: "#ffffff",
        tabInactiveBg: "#F5F5F5",
        tabInactiveText: "#666666",
        accent: "#000000",
      };
    }
    return {
      background: "#000000",
      cardBackground: "#0a0a0a",
      border: "#1a1a1a",
      text: "#ffffff",
      mutedText: "#adadad",
      inputBackground: "#050505",
      buttonBg: "#ffffff",
      buttonText: "#000000",
      buttonHover: "#f5f5f5",
      error: "#ef4444",
      success: "#22c55e",
      tabActiveBg: "#ffffff",
      tabActiveText: "#000000",
      tabInactiveBg: "#1a1a1a",
      tabInactiveText: "#adadad",
      accent: "#ffffff",
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

    console.log("Login attempt with:", { email, role });

    const response = await fetch("https://civicfix-backend01.onrender.com/api/v1/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.toLowerCase().trim(),
        password,
        role: role,
      }),
    });

    const data = await response.json();
    
    // 🔴 CRITICAL: Log the FULL response
    console.log("🔴 FULL LOGIN RESPONSE:", {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data: data
    });

    if (!response.ok) {
      throw new Error(
        data.message || `Login failed with status ${response.status}`,
      );
    }

    if (data.success) {
      // Check ALL possible locations for otpRequired
      const otpRequired = data.data?.otpRequired || data.otpRequired || data.requiresOtp;
      
      console.log("🔴 OTP Required check:", {
        "data.data?.otpRequired": data.data?.otpRequired,
        "data.otpRequired": data.otpRequired,
        "data.requiresOtp": data.requiresOtp,
        "final otpRequired": otpRequired
      });
      
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
        console.log("Redirecting to:", dashboardRoute);

        setTimeout(() => {
          navigate(dashboardRoute);
        }, 100);
      }
    } else {
      setError(data.message || "Login failed");
    }
  } catch (err) {
    console.error("❌ Login error details:", err);
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
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.toLowerCase().trim(),
            otp: otpString,
          }),
        },
      );

      const data = await response.json();
      console.log("OTP verification response:", data);

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
        setTimeout(() => {
          navigate(dashboardRoute);
        }, 1000);
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
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.toLowerCase().trim(),
          }),
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

        setTimeout(() => {
          document.getElementById("otp-0")?.focus();
        }, 100);
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

  const getTabColor = (tab) => {
    switch (tab) {
      case "citizen":
        return "#10b981";
      case "officer":
        return "#f59e0b";
      case "supervisor":
        return "#3b82f6";
      case "admin":
        return "#8b5cf6";
      default:
        return colors.tabActiveBg;
    }
  };

  return (
    <div
      className="min-h-screen flex overflow-hidden"
      style={{ backgroundColor: colors.background }}
    >
      <div>
        <button
          onClick={() => navigate(`/`)}
          className="mb-4 mt-3 px-4 py-2 rounded-lg flex items-center hover:opacity-90 transition-opacity font-bolder"
          style={{
            color: theme === "dark" ? "#ffffff" : "#000000",
          }}
        >
          <ArrowLeft
            size={18}
            className="mr-2 h-7 w-10"
            style={{ color: theme === "dark" ? "#ffffff" : "#000000" }}
          />
        </button>
      </div>

      {/* Theme toggle */}
      <div className="absolute top-4 right-4 lg:top-6 lg:right-6 z-10">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 px-3 py-1.5 lg:px-4 lg:py-2 rounded-lg border transition-colors duration-200"
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

      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-4 lg:p-8 relative">
        
        <div
          className="w-full max-w-md rounded-xl lg:rounded-2xl border p-6 lg:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.1)]"
          style={{
            backgroundColor: colors.cardBackground,
            borderColor: colors.border,
          }}
        >
         
          {showOtpVerification ? (
            <div className="w-full">
            
              <div className="text-center mb-6 lg:mb-8">
                <div
                  className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4"
                  style={{
                    backgroundColor: `${getTabColor(activeTab)}20`,
                    color: getTabColor(activeTab),
                  }}
                >
                  <Shield size={24} />
                </div>
                <h1
                  className="text-2xl lg:text-3xl font-bold mb-2"
                  style={{ color: colors.text }}
                >
                  Verify OTP
                </h1>
                <p
                  style={{ color: colors.mutedText }}
                  className="text-xs lg:text-sm"
                >
                  Enter the 6-digit code sent to your email
                </p>
                <p
                  className="font-medium mt-2"
                  style={{ color: getTabColor(activeTab) }}
                >
                  {email}
                </p>
                <p className="text-xs mt-1" style={{ color: colors.mutedText }}>
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}{" "}
                  Account
                </p>
              </div>

              {error && (
                <div
                  className="mb-4 p-3 rounded-lg text-sm"
                  style={{
                    backgroundColor: `${colors.error}10`,
                    color: colors.error,
                    border: `1px solid ${colors.error}`,
                  }}
                >
                  <AlertCircle size={16} className="inline mr-2" />
                  {error}
                </div>
              )}

              {message && (
                <div
                  className="mb-4 p-3 rounded-lg text-sm"
                  style={{
                    backgroundColor: `${colors.success}10`,
                    color: colors.success,
                    border: `1px solid ${colors.success}`,
                  }}
                >
                  {message}
                </div>
              )}

              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div className="flex justify-center gap-2 mb-6">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      maxLength="1"
                      value={otp[index]}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      className="w-10 h-10 lg:w-12 lg:h-12 text-center text-lg lg:text-xl rounded-lg border focus:outline-none focus:ring-2"
                      style={{
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.border,
                        color: colors.text,
                        focusRingColor: getTabColor(activeTab),
                      }}
                      required
                      disabled={loading}
                    />
                  ))}
                </div>

                <div className="space-y-4">
                  <PrimaryButton
                    type="submit"
                    loading={loading}
                    fullWidth
                    className="text-sm lg:text-base"
                    style={{
                      backgroundColor: getTabColor(activeTab),
                      color: colors.buttonText,
                    }}
                  >
                    Verify OTP
                  </PrimaryButton>

                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      onClick={handleBackToLogin}
                      className="text-sm flex items-center gap-2"
                      style={{ color: colors.mutedText }}
                      disabled={loading}
                    >
                      <ArrowLeft size={14} />
                      Back to Login
                    </button>

                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={!canResendOtp || loading}
                      className={`text-sm ${canResendOtp ? "" : "opacity-50 cursor-not-allowed"}`}
                      style={{ color: getTabColor(activeTab) }}
                    >
                      {canResendOtp ? (
                        <span className="flex items-center gap-1">
                          <RefreshCw size={14} />
                          Resend OTP
                        </span>
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
                  className="text-2xl lg:text-3xl font-bold mb-2 tracking-tight"
                  style={{ color: colors.text }}
                >
                  Welcome Back
                </h1>
                <p
                  style={{ color: colors.mutedText }}
                  className="text-xs lg:text-sm"
                >
                  Sign in to your CivicFix account
                </p>
              </div>

              
              <div
                className="grid grid-cols-2  gap-4 mb-6 lg:mb-8 rounded-lg p-1"
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
                    className={`py-2.5 px-2 text-xs lg:text-sm font-medium rounded-md transition-all duration-200 ${activeTab === tab.id ? "" : "opacity-80"}`}
                    style={{
                      backgroundColor:
                        activeTab === tab.id
                          ? getTabColor(tab.id)
                          : "transparent",
                      color:
                        activeTab === tab.id
                          ? colors.tabActiveText
                          : colors.tabInactiveText,
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {error && (
                <div
                  className="mb-4 p-3 rounded-lg text-sm"
                  style={{
                    backgroundColor: `${colors.error}10`,
                    color: colors.error,
                    border: `1px solid ${colors.error}`,
                  }}
                >
                  <AlertCircle size={16} className="inline mr-2" />
                  {error}
                </div>
              )}

              {message && (
                <div
                  className="mb-4 p-3 rounded-lg text-sm"
                  style={{
                    backgroundColor: `${colors.success}10`,
                    color: colors.success,
                    border: `1px solid ${colors.success}`,
                  }}
                >
                  {message}
                </div>
              )}

              <form
                onSubmit={handleLoginSubmit}
                className="space-y-4 lg:space-y-6"
              >
                
                <div>
                  <label
                    className="block text-xs lg:text-sm font-medium mb-1 lg:mb-2"
                    style={{ color: colors.text }}
                  >
                    Email Address *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder={`Enter your ${activeTab} email`}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2.5 lg:px-3 lg:py-3.5 border rounded-lg focus:outline-none transition-all duration-200 text-sm lg:text-base"
                      style={{
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.border,
                        color: colors.text,
                      }}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

               
                <div>
                  <label
                    className="block text-xs lg:text-sm font-medium mb-1 lg:mb-2"
                    style={{ color: colors.text }}
                  >
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2.5 lg:px-3 lg:py-3.5 border rounded-lg focus:outline-none transition-all duration-200 text-sm lg:text-base pr-10"
                      style={{
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.border,
                        color: colors.text,
                      }}
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ color: colors.mutedText }}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <PrimaryButton
                  type="submit"
                  loading={loading}
                  fullWidth
                  className="text-sm lg:text-base mt-4"
                  style={{
                    backgroundColor: getTabColor(activeTab),
                    color: colors.buttonText,
                  }}
                >
                  Sign In as{" "}
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </PrimaryButton>

                {/* Sign up link - only for citizens */}
                {activeTab === "citizen" && (
                  <div className="text-center pt-2">
                    <p
                      className="text-xs lg:text-sm"
                      style={{ color: colors.mutedText }}
                    >
                      Don't have an account?{" "}
                      <Link
                        to="/signup"
                        className="font-medium"
                        style={{ color: colors.text }}
                      >
                        Sign up
                      </Link>
                    </p>
                  </div>
                )}
              </form>

              <div className="mt-4 lg:mt-6 text-center">
                <p
                  className="text-xs lg:text-sm"
                  style={{ color: colors.mutedText }}
                >
                  © {new Date().getFullYear()} CivicFix. All rights reserved.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="hidden lg:block lg:w-200 h-150 top-22 right-15 relative p-4">
        <div className="w-full h-full overflow-hidden relative">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          >
            
            <div
              className="absolute inset-0"
              style={{
                backgroundColor:
                  theme === "dark"
                    ? "rgba(0,0,0,0.3)"
                    : "rgba(255,255,255,0.1)",
              }}
            ></div>

            <div className="absolute bottom-0 left-0 right-35 p-6 lg:p-8 bg-gradient-to-t from-black/80 via-black/60 to-transparent">
              <div className="max-w-lg mx-auto">
                <h2 className="text-lg lg:text-2xl font-bold mb-2">
                  <span className="text-[#d9d9d9]">
                    {showOtpVerification
                      ? "Secure OTP Verification"
                      : `Welcome to ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Portal`}
                  </span>
                </h2>

                <p className="text-sm lg:text-base mb-2 lg:mb-6 leading-relaxed font-bold text-[#d9d9d9]">
                  <span>{displayText}</span>
                  <span className="animate-pulse">|</span>
                </p>

                <div className="flex items-center gap-2 mt-4">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getTabColor(activeTab) }}
                    ></div>
                    <span className="text-xs lg:text-sm text-[#d9d9d9]">
                      {showOtpVerification
                        ? "OTP Verification"
                        : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Login`}
                    </span>
                  </div>
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


