import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import bgDark from "../assets/images/image_03.png";
import bgLight from "../assets/images/image_04.png";
import PrimaryButton from "../components/ui/PrimaryButton";
import { Eye, EyeOff, ArrowLeft, AlertCircle, CheckCircle } from "lucide-react";

const Signup = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "CITIZEN",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isFocused, setIsFocused] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  });
  const [typingText, setTypingText] = useState("");
  const [typingIndex, setTypingIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const backgroundImage = theme === "dark" ? bgDark : bgLight;
  const textOptions = [
    "Join CivicFix - Community Problem Solver",
    "Report issues in your locality",
    "Track your complaint status",
    "Connect with local authorities",
    "Make your city better, together",
  ];
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  const getThemeColors = () => {
    const accentColor = "#97AB33";
    
    if (theme === "light") {
      return {
        background: "#FFFFFF",
        cardBackground: "#FFFFFF",
        border: "#E2E8F0",
        text: "#1A202C",
        mutedText: "#718096",
        inputBackground: "#F7FAFC",
        buttonBg: accentColor,
        buttonText: "#FFFFFF",
        buttonHover: "#8A9E2E",
        error: "#E53E3E",
        success: "#38A169",
        accent: accentColor,
        accentLight: "rgba(151, 171, 51, 0.1)",
        gradient: "linear-gradient(135deg, #FFFFFF 0%, #F7FAFC 100%)",
      };
    }
    return {
      background: "#0A0A0A",
      cardBackground: "#111111",
      border: "#2D3748",
      text: "#FFFFFF",
      mutedText: "#A0AEC0",
      inputBackground: "#1A1A1A",
      buttonBg: accentColor,
      buttonText: "#000000",
      buttonHover: "#A8C03E",
      error: "#FC8181",
      success: "#68D391",
      accent: accentColor,
      accentLight: "rgba(151, 171, 51, 0.15)",
      gradient: "linear-gradient(135deg, #0A0A0A 0%, #111111 100%)",
    };
  };

  const colors = getThemeColors();

  const checkPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    return strength;
  };

  useEffect(() => {
    setPasswordStrength(checkPasswordStrength(formData.password));
  }, [formData.password]);

  useEffect(() => {
    const handleTyping = () => {
      const currentText = textOptions[currentTextIndex];

      if (!isDeleting && typingIndex < currentText.length) {
        setTimeout(() => {
          setTypingText(currentText.substring(0, typingIndex + 1));
          setTypingIndex(typingIndex + 1);
        }, 100);
      } else if (isDeleting && typingIndex > 0) {
        setTimeout(() => {
          setTypingText(currentText.substring(0, typingIndex - 1));
          setTypingIndex(typingIndex - 1);
        }, 50);
      } else if (!isDeleting && typingIndex === currentText.length) {
        setTimeout(() => setIsDeleting(true), 2000);
      } else if (isDeleting && typingIndex === 0) {
        setIsDeleting(false);
        setCurrentTextIndex((prev) => (prev + 1) % textOptions.length);
      }
    };

    const typingTimer = setTimeout(handleTyping, isDeleting ? 25 : 50);
    return () => clearTimeout(typingTimer);
  }, [typingIndex, isDeleting, currentTextIndex]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (passwordStrength < 75) {
      newErrors.password = "Password is too weak";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const userData = {
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        role: formData.role || "CITIZEN",
      };

      const result = await signup(userData);

      if (result.success) {
        alert(result.message || "Account created successfully!");
        setTimeout(() => {
          navigate("/login");
        }, 1000);
      } else {
        setErrors({ api: result.error });
      }
    } catch (error) {
      setErrors({
        api: error.message || "Registration failed",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = (strength) => {
    if (strength <= 25) return colors.error;
    if (strength <= 50) return "#F6AD55";
    if (strength <= 75) return "#68D391";
    return colors.success;
  };

  const getStrengthText = (strength) => {
    if (strength <= 25) return "Weak";
    if (strength <= 50) return "Fair";
    if (strength <= 75) return "Good";
    return "Strong";
  };

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
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .animate-slideUp {
          animation: slideUp 0.5s ease forwards;
        }
        
        .animate-pulse-slow {
          animation: pulse 2s ease-in-out infinite;
        }
        
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <div className="absolute top-4 left-4 z-20 lg:hidden">
        <button
          onClick={() => navigate('/')}
          className="p-2.5 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105"
          style={{
            backgroundColor: colors.cardBackground,
            border: `1px solid ${colors.border}`,
            color: colors.text,
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          }}
        >
          <ArrowLeft size={18} />
        </button>
      </div>

      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all duration-200 hover:scale-105"
          style={{
            backgroundColor: colors.cardBackground,
            border: `1px solid ${colors.border}`,
            color: colors.text,
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          }}
        >
          {theme === "dark" ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span className="text-xs font-medium hidden xs:inline">Light</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              <span className="text-xs font-medium hidden xs:inline">Dark</span>
            </>
          )}
        </button>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center min-h-screen p-4 lg:p-8 order-2 lg:order-1" >
        <div className="w-full max-w-md">
          <div
            className="rounded-2xl border p-6 lg:p-8 shadow-2xl backdrop-blur-sm animate-slideUp"
            style={{
              backgroundColor: colors.cardBackground,
              border: `2px solid ${colors.accent}`, 
              boxShadow: `0 8px 30px ${colors.accent}20`, 
            }}
          >
            <div className="text-center mb-6 lg:mb-8" >
              <h1
                className="text-2xl sm:text-3xl font-bold mb-2 tracking-tight"
                style={{ color: colors.text }}
              >
                Create Account
              </h1>
              <p
                className="text-sm"
                style={{ color: colors.mutedText }}
              >
                Join CivicFix to make your city better
              </p>
            </div>

            <form onSubmit={handleSignup} className="space-y-4 lg:space-y-5">
              {/* Name Input */}
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: colors.text }}
                >
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleInputChange}
                    onFocus={() => setIsFocused({ ...isFocused, name: true })}
                    onBlur={() => setIsFocused({ ...isFocused, name: false })}
                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all text-sm ${
                      errors.name ? "border-red-500" : ""
                    }`}
                    style={{
                      backgroundColor: colors.inputBackground,
                      borderColor: errors.name
                        ? colors.error
                        : isFocused.name
                          ? colors.accent
                          : colors.border,
                      color: colors.text,
                      outlineColor: colors.accent,
                    }}
                    required
                  />
                </div>
                {errors.name && (
                  <p className="mt-2 text-xs flex items-center gap-1" style={{ color: colors.error }}>
                    <AlertCircle size={12} />
                    {errors.name}
                  </p>
                )}
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: colors.text }}
                >
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={handleInputChange}
                    onFocus={() => setIsFocused({ ...isFocused, email: true })}
                    onBlur={() => setIsFocused({ ...isFocused, email: false })}
                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all text-sm ${
                      errors.email ? "border-red-500" : ""
                    }`}
                    style={{
                      backgroundColor: colors.inputBackground,
                      borderColor: errors.email
                        ? colors.error
                        : isFocused.email
                          ? colors.accent
                          : colors.border,
                      color: colors.text,
                      outlineColor: colors.accent,
                    }}
                    required
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-xs flex items-center gap-1" style={{ color: colors.error }}>
                    <AlertCircle size={12} />
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: colors.text }}
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleInputChange}
                    onFocus={() => setIsFocused({ ...isFocused, password: true })}
                    onBlur={() => setIsFocused({ ...isFocused, password: false })}
                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all text-sm pr-12 ${
                      errors.password ? "border-red-500" : ""
                    }`}
                    style={{
                      backgroundColor: colors.inputBackground,
                      borderColor: errors.password
                        ? colors.error
                        : isFocused.password
                          ? colors.accent
                          : colors.border,
                      color: colors.text,
                      outlineColor: colors.accent,
                    }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    style={{ color: colors.mutedText }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {formData.password && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs" style={{ color: colors.mutedText }}>
                        Password strength:
                      </span>
                      <span
                        className="text-xs font-semibold"
                        style={{ color: getStrengthColor(passwordStrength) }}
                      >
                        {getStrengthText(passwordStrength)}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${passwordStrength}%`,
                          backgroundColor: getStrengthColor(passwordStrength),
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <div className="flex items-center gap-1 text-xs" style={{ color: colors.mutedText }}>
                        {formData.password.length >= 8 ? (
                          <CheckCircle size={12} color={colors.success} />
                        ) : (
                          <div className="w-3 h-3 rounded-full border" style={{ borderColor: colors.border }} />
                        )}
                        <span>8+ characters</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs" style={{ color: colors.mutedText }}>
                        {/[A-Z]/.test(formData.password) ? (
                          <CheckCircle size={12} color={colors.success} />
                        ) : (
                          <div className="w-3 h-3 rounded-full border" style={{ borderColor: colors.border }} />
                        )}
                        <span>Uppercase</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs" style={{ color: colors.mutedText }}>
                        {/[0-9]/.test(formData.password) ? (
                          <CheckCircle size={12} color={colors.success} />
                        ) : (
                          <div className="w-3 h-3 rounded-full border" style={{ borderColor: colors.border }} />
                        )}
                        <span>Number</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs" style={{ color: colors.mutedText }}>
                        {/[^A-Za-z0-9]/.test(formData.password) ? (
                          <CheckCircle size={12} color={colors.success} />
                        ) : (
                          <div className="w-3 h-3 rounded-full border" style={{ borderColor: colors.border }} />
                        )}
                        <span>Special</span>
                      </div>
                    </div>
                  </div>
                )}

                {errors.password && (
                  <p className="mt-2 text-xs flex items-center gap-1" style={{ color: colors.error }}>
                    <AlertCircle size={12} />
                    {errors.password}
                  </p>
                )}
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: colors.text }}
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    onFocus={() =>
                      setIsFocused({ ...isFocused, confirmPassword: true })
                    }
                    onBlur={() =>
                      setIsFocused({ ...isFocused, confirmPassword: false })
                    }
                    className={`w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all text-sm pr-12 ${
                      errors.confirmPassword ? "border-red-500" : ""
                    }`}
                    style={{
                      backgroundColor: colors.inputBackground,
                      borderColor: errors.confirmPassword
                        ? colors.error
                        : isFocused.confirmPassword
                          ? colors.accent
                          : colors.border,
                      color: colors.text,
                      outlineColor: colors.accent,
                    }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    style={{ color: colors.mutedText }}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-2 text-xs flex items-center gap-1" style={{ color: colors.error }}>
                    <AlertCircle size={12} />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {errors.api && (
                <div
                  className="p-3 rounded-xl text-sm flex items-start gap-2 animate-slideUp"
                  style={{
                    backgroundColor: `${colors.error}10`,
                    color: colors.error,
                    border: `1px solid ${colors.error}20`,
                  }}
                >
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{errors.api}</span>
                </div>
              )}

              <PrimaryButton
                type="submit"
                loading={loading}
                fullWidth
                className="text-sm py-3.5 rounded-xl font-semibold mt-2"
                style={{
                  backgroundColor: colors.accent,
                  color: colors.buttonText,
                }}
              >
                Create Account
              </PrimaryButton>
              <div className="text-center pt-2">
                <p
                  className="text-sm"
                  style={{ color: colors.mutedText }}
                >
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="font-semibold hover:opacity-80 transition-opacity"
                    style={{ color: colors.accent }}
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </form>

            <div className="mt-6 text-center">
              <p
                className="text-xs"
                style={{ color: colors.mutedText }}
              >
                By creating an account, you agree to our{" "}
                <button className="underline hover:opacity-80 transition-opacity">
                  Terms
                </button>{" "}
                and{" "}
                <button className="underline hover:opacity-80 transition-opacity">
                  Privacy Policy
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden lg:block lg:w-1/2 relative order-1 lg:order-2">
        <div className="w-full h-screen relative overflow-hidden">
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
                background: theme === "dark"
                  ? "linear-gradient(to right, rgba(10,10,10,0.9) 0%, rgba(10,10,10,0.4) 50%, transparent 100%)"
                  : "linear-gradient(to right, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
              }}
            />

            <div className="absolute bottom-0 left-0 right-0 p-12">
              <div className="max-w-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className="w-1 h-12 rounded-full"
                    style={{ backgroundColor: colors.accent }}
                  />
                  <span
                    className="text-sm font-semibold uppercase tracking-wider"
                    style={{ color: colors.accent }}
                  >
                    Join CivicFix
                  </span>
                </div>
                
                <h2 className="text-4xl font-bold mb-4 leading-tight">
                  <span style={{ color: colors.text }}>Make Your</span>
                  <br />
                  <span style={{ color: colors.accent }}>City Better</span>
                </h2>

                <p className="text-lg mb-6 leading-relaxed opacity-90 min-h-[4rem]">
                  <span style={{ color: colors.text }}>{typingText}</span>
                  <span className="ml-1 animate-pulse-slow" style={{ color: colors.accent }}>|</span>
                </p>

                <div className="flex items-center gap-3">
                  <div
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: colors.accent }}
                  />
                  <span className="text-sm opacity-75" style={{ color: colors.text }}>
                    Join thousands of citizens
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

export default Signup;



