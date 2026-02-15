import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import bgDark from "../assets/images/image_03.png";
import bgLight from "../assets/images/image_04.png";
import PrimaryButton from "../components/ui/PrimaryButton";

const Signup = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "CITIZEN", // Default role as per schema
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
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

  // Password strength checker
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
  }, [typingIndex, isDeleting, currentTextIndex, textOptions]);

  // Validation function
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

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Signup.jsx - Update the handleSignup function
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

      console.log("Attempting registration with data:", userData);

      // Call the register function from AuthContext
      const result = await signup(userData); // This now calls /auth/register

      console.log("Registration result:", result);

      if (result.success) {
        alert(result.message || "✅ Account created successfully!");

        // Check if user was auto-logged in
        if (result.token && result.user) {
          console.log("Auto-login successful, redirecting to dashboard...");
          setTimeout(() => {
            navigate("/dashboard");
          }, 1000);
        } else {
          console.log("Registration successful, redirecting to login...");
          setTimeout(() => {
            navigate("/login");
          }, 1000);
        }
      } else {
        setErrors({ api: result.error });
      }
    } catch (error) {
      console.error("Registration error:", error);
      setErrors({
        api: error.message || "Registration failed",
      });
    } finally {
      setLoading(false);
    }
  };
  // Define colors based on theme
  const getThemeColors = () => {
    if (theme === "light") {
      return {
        background: "#ffffff",
        cardBackground: "#D5D5D5",
        border: "#B0B0B0",
        text: "#000000",
        mutedText: "#555555",
        inputBackground: "#F5F5F5",
        buttonBg: "#000000",
        buttonText: "#ffffff",
        buttonHover: "#333333",
        error: "#dc2626",
        success: "#16a34a",
        strengthWeak: "#dc2626",
        strengthMedium: "#f59e0b",
        strengthStrong: "#16a34a",
      };
    }
    // Dark theme (default)
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
      strengthWeak: "#ef4444",
      strengthMedium: "#f59e0b",
      strengthStrong: "#22c55e",
    };
  };

  const colors = getThemeColors();

  const getStrengthColor = (strength) => {
    if (strength <= 25) return colors.strengthWeak;
    if (strength <= 50) return colors.strengthMedium;
    return colors.strengthStrong;
  };

  return (
    <div
      className="min-h-screen flex overflow-hidden"
      style={{ backgroundColor: colors.background }}
    >
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
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor =
              theme === "dark" ? "#1a1a1a" : "#e5e5e5";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor =
              theme === "dark" ? "#0a0a0a" : "#f5f5f5";
          }}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? (
            <>
              <svg
                className="w-4 h-4 lg:w-5 lg:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                ></path>
              </svg>
              <span className="text-xs lg:text-sm font-medium">Light Mode</span>
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4 lg:w-5 lg:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                ></path>
              </svg>
              <span className="text-xs lg:text-sm font-medium">Dark Mode</span>
            </>
          )}
        </button>
      </div>

      {/* Left Side - Signup Form */}
      <div className="w-full lg:w-180 flex flex-col items-center justify-center p-4 lg:p-8 relative">
        {/* Signup Card */}
        <div
          className="w-120 lg:h-180 rounded-xl lg:rounded-2xl border p-6 lg:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.1)]"
          style={{
            backgroundColor: colors.cardBackground,
            borderColor: colors.border,
          }}
        >
          {/* Signup Form Container */}
          <div className="w-full max-w-md">
            {/* Logo/Brand */}
            <div className="text-center mb-6 lg:mb-8">
              <h1
                className="text-2xl lg:text-3xl font-bold mb-2 tracking-tight"
                style={{ color: colors.text }}
              >
                Create Account
              </h1>
              <p
                style={{ color: colors.mutedText }}
                className="text-xs lg:text-sm"
              >
                Join CivicFix to make your city better
              </p>
            </div>

            <form onSubmit={handleSignup} className="space-y-4 lg:space-y-6">
              {/* Name Input */}
              <div>
                <label
                  className="block text-xs lg:text-sm font-medium mb-1 lg:mb-2"
                  style={{ color: colors.text }}
                >
                  Full Name *
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
                    className={`w-full px-3 py-2.5 lg:px-3 lg:py-3.5 border rounded-lg focus:outline-none transition-all duration-200 text-sm lg:text-base ${
                      errors.name ? "border-red-500" : ""
                    }`}
                    style={{
                      backgroundColor: colors.inputBackground,
                      borderColor: errors.name
                        ? colors.error
                        : isFocused.name
                          ? colors.text
                          : colors.border,
                      color: colors.text,
                    }}
                    required
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-xs" style={{ color: colors.error }}>
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Email Input */}
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
                    name="email"
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={handleInputChange}
                    onFocus={() => setIsFocused({ ...isFocused, email: true })}
                    onBlur={() => setIsFocused({ ...isFocused, email: false })}
                    className={`w-full px-2 py-1.5 lg:px-3 lg:py-2.5  border rounded-lg focus:outline-none transition-all duration-200 text-sm lg:text-base ${
                      errors.email ? "border-red-500" : ""
                    }`}
                    style={{
                      backgroundColor: colors.inputBackground,
                      borderColor: errors.email
                        ? colors.error
                        : isFocused.email
                          ? colors.text
                          : colors.border,
                      color: colors.text,
                    }}
                    required
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs" style={{ color: colors.error }}>
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password Input with Strength Meter */}
              <div>
                <label
                  className="block text-xs lg:text-sm font-medium mb-1 lg:mb-2"
                  style={{ color: colors.text }}
                >
                  Password *
                </label>
                <div className="relative">
                  <input
                    type="password"
                    name="password"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleInputChange}
                    onFocus={() =>
                      setIsFocused({ ...isFocused, password: true })
                    }
                    onBlur={() =>
                      setIsFocused({ ...isFocused, password: false })
                    }
                    className={`w-full px-3 py-2.5 lg:px-3 lg:py-3.5 lg:py-2.5  border rounded-lg focus:outline-none transition-all duration-200 text-sm lg:text-base ${
                      errors.password ? "border-red-500" : ""
                    }`}
                    style={{
                      backgroundColor: colors.inputBackground,
                      borderColor: errors.password
                        ? colors.error
                        : isFocused.password
                          ? colors.text
                          : colors.border,
                      color: colors.text,
                    }}
                    required
                  />
                </div>

                {/* Password Strength Meter */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="text-xs"
                        style={{ color: colors.mutedText }}
                      >
                        Password strength:
                      </span>
                      <span
                        className="text-xs font-medium"
                        style={{ color: getStrengthColor(passwordStrength) }}
                      >
                        {passwordStrength <= 25
                          ? "Weak"
                          : passwordStrength <= 50
                            ? "Medium"
                            : "Strong"}
                      </span>
                    </div>
                    <div className="w-full h-1 rounded-full bg-gray-600">
                      <div
                        className="h-1 rounded-full transition-all duration-300"
                        style={{
                          width: `${passwordStrength}%`,
                          backgroundColor: getStrengthColor(passwordStrength),
                        }}
                      ></div>
                    </div>
                    <div
                      className="mt-1 text-xs"
                      style={{ color: colors.mutedText }}
                    >
                      • At least 8 characters
                      <br />
                      • Include uppercase letter
                      <br />
                      • Include number
                      <br />• Include special character
                    </div>
                  </div>
                )}

                {errors.password && (
                  <p className="mt-1 text-xs" style={{ color: colors.error }}>
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password Input */}
              <div>
                <label
                  className="block text-xs lg:text-sm font-medium mb-1 lg:mb-2"
                  style={{ color: colors.text }}
                >
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type="password"
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
                    className={`w-full px-3 py-2.5 lg:px-3 lg:py-3.5 border rounded-lg focus:outline-none transition-all duration-200 text-sm lg:text-base ${
                      errors.confirmPassword ? "border-red-500" : ""
                    }`}
                    style={{
                      backgroundColor: colors.inputBackground,
                      borderColor: errors.confirmPassword
                        ? colors.error
                        : isFocused.confirmPassword
                          ? colors.text
                          : colors.border,
                      color: colors.text,
                    }}
                    required
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs" style={{ color: colors.error }}>
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* API Error Message */}
              {errors.api && (
                <div
                  className="p-3 rounded-lg text-sm"
                  style={{
                    backgroundColor: theme === "dark" ? "#1a1a1a" : "#f5f5f5",
                    color: colors.error,
                    border: `1px solid ${colors.error}`,
                  }}
                >
                  {errors.api}
                </div>
              )}

              {/* Create Account Button */}
              <PrimaryButton
                type="submit"
                loading={loading}
                fullWidth
                className="text-sm lg:text-base"
                style={{
                  backgroundColor: colors.buttonBg,
                  color: colors.buttonText,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.buttonHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.buttonBg;
                }}
              >
                Create Account
              </PrimaryButton>

              {/* Already have account link */}
              <div className="text-center pt-2">
                <p
                  className="text-xs lg:text-sm"
                  style={{ color: colors.mutedText }}
                >
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="font-medium transition-colors duration-200"
                    style={{ color: colors.text }}
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </form>

            {/* Footer */}
            <div className="mt-4 lg:mt-6 text-center">
              <p
                className="text-xs lg:text-sm"
                style={{ color: colors.mutedText }}
              >
                By creating an account, you agree to our Terms and Privacy
                Policy
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Background Image */}
      <div className="hidden lg:block lg:w-200 h-150 top-22 right-15 relative p-4">
        {/* Background Image Container */}
        <div className="w-full h-full rounded-xl lg:rounded-2xl overflow-hidden relative">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          >
            {/* Theme-aware overlay */}
            <div
              className="absolute inset-0"
              style={{
                backgroundColor:
                  theme === "dark"
                    ? "rgba(0,0,0,0.3)"
                    : "rgba(255,255,255,0.1)",
              }}
            ></div>

            {/* Text Overlay */}
            <div className="absolute bottom-0 left-0 top-95 right-40 p-6 lg:p-8 bg-gradient-to-t from-black/80 via-black/60 to-transparent rounded-xl lg:rounded-2xl">
              <div className="max-w-lg mx-auto">
                {/* Typing Text Effect */}
                <div className="mb-4">
                  <h2 className="text-lg lg:text-2xl font-bold mb-2">
                    <span className="text-[#d9d9d9]">{typingText}</span>
                    <span className="animate-pulse text-[#d9d9d9]">|</span>
                  </h2>
                </div>

                {/* CivicFix Description */}
                <p className="text-sm lg:text-base mb-2 mr-5 lg:mb-6 leading-relaxed text-[#d9d9d9]">
                  Join thousands of citizens and government agencies working
                  together to solve local issues. Your voice matters in building
                  a better city.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
