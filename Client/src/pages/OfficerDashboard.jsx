import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import {
  Camera,
  CheckCircle,
  Clock,
  MapPin,
  AlertCircle,
  Upload,
  FileText,
  User,
  Calendar,
  AlertTriangle,
  Home,
  RefreshCw,
  LogOut,
  Shield,
  Target,
  Bell,
  Search,
  Filter,
  BarChart3,
  Eye,
  Download,
  Loader,
  AlertOctagon,
  Menu,
  X,
} from "lucide-react";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";
import lightLogo from "../assets/images/img01.png";
import darkLogo from "../assets/images/img02.png";
import Preloader from "../components/Preloader";

const OfficerDashboard = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [assignedComplaints, setAssignedComplaints] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    pendingVerification: 0,
    resolved: 0,
    overdue: 0,
    resolutionRate: 0,
  });
  const [imageFile, setImageFile] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("assigned");
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState(null);
  const [verificationRemarks, setVerificationRemarks] = useState("");

  // Officer theme colors - Yellow/Orange palette
  const colors =
    theme === "light"
      ? {
          bg: "#ffffff",
          text: "#000000",
          card: "#fff9e6",
          border: "#ffe5b4",
          accent: "#000000",
          success: "#10b981",
          warning: "#f59e0b",
          danger: "#ef4444",
          info: "#f97316",
          primary: "#f97316",
          pending: "#8b5cf6",
          officer: "#f59e0b",
        }
      : {
          bg: "#000000",
          text: "#ffffff",
          card: "#1a1500",
          border: "#5c4a00",
          accent: "#ffffff",
          success: "#10b981",
          warning: "#f59e0b",
          danger: "#ef4444",
          info: "#f97316",
          primary: "#f97316",
          pending: "#a78bfa",
          officer: "#f59e0b",
        };

  const currentLogo = theme === "dark" ? darkLogo : lightLogo;

  useEffect(() => {
    fetchDashboardData();
    fetchUserProfile();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setProfileDropdownOpen(false);
      setMobileMenuOpen(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const fetchUserProfile = async () => {
    try {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
        return;
      }

      const response = await api.get("/v1/user/me");
      setUser(response.data?.data || null);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast.error("Failed to load user profile", {
        position: "top-right",
        duration: 3000,
      });
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const statsRes = await api.get("/v1/officer/dashboard");
      setStats(
        statsRes.data?.data || {
          total: 0,
          inProgress: 0,
          pendingVerification: 0,
          resolved: 0,
          overdue: 0,
          resolutionRate: 0,
        },
      );

      const complaintsRes = await api.get("/v1/officer/complaints");
      setAssignedComplaints(complaintsRes.data?.data || []);

      setLoading(false);

      toast.success("Dashboard data loaded successfully!", {
        position: "top-right",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data", {
        position: "top-right",
        duration: 5000,
      });
      setLoading(false);
    }
  };

  const getUserInitials = (name) => {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
  };

  const handleResolveComplaint = async (complaintId) => {
    if (!imageFile) {
      toast.error("Please upload a resolution image first", {
        position: "top-right",
        duration: 3000,
      });
      return;
    }

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(imageFile.type)) {
      toast.error("Please upload a valid image (JPEG, PNG, WEBP)", {
        position: "top-right",
        duration: 3000,
      });
      return;
    }

    if (imageFile.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB", {
        position: "top-right",
        duration: 3000,
      });
      return;
    }

    try {
      setUploading(true);
      setSelectedComplaint(complaintId);

      toast.info("Submitting complaint for verification...", {
        position: "top-right",
        duration: 2000,
      });

      const formData = new FormData();
      formData.append("image", imageFile);

      if (verificationRemarks.trim()) {
        formData.append("remarks", verificationRemarks.trim());
      }

      const response = await api.patch(
        `/v1/officer/complaints/${complaintId}/resolve`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 30000,
        },
      );

      if (response.data.success) {
        toast.success("Complaint submitted for verification successfully!", {
          position: "top-right",
          duration: 4000,
        });

        setImageFile(null);
        setVerificationRemarks("");
        setSelectedComplaint(null);

        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = "";

        await fetchDashboardData();
      }
    } catch (error) {
      console.error("Error resolving complaint:", error);

      if (error.code === "ECONNABORTED") {
        toast.error("Request timeout. Please try again.", {
          position: "top-right",
          duration: 5000,
        });
      } else if (error.response) {
        toast.error(
          error.response?.data?.message ||
            error.response?.data?.error ||
            `Server error: ${error.response.status}`,
          {
            position: "top-right",
            duration: 5000,
          },
        );
      } else if (error.request) {
        toast.error("No response from server. Please check your connection.", {
          position: "top-right",
          duration: 5000,
        });
      } else {
        toast.error("Failed to submit complaint", {
          position: "top-right",
          duration: 5000,
        });
      }
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully!", {
      position: "top-right",
      duration: 3000,
    });
    navigate("/login");
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "IN_PROGRESS": return colors.warning;
      case "PENDING_VERIFICATION": return colors.pending;
      case "RESOLVED": return colors.success;
      case "REJECTED": return colors.danger;
      default: return colors.info;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "IN_PROGRESS": return <Clock size={14} />;
      case "PENDING_VERIFICATION": return <AlertOctagon size={14} />;
      case "RESOLVED": return <CheckCircle size={14} />;
      default: return <AlertCircle size={14} />;
    }
  };

  const getButtonText = (status) => {
    switch (status) {
      case "IN_PROGRESS": return "Submit for Verification";
      case "PENDING_VERIFICATION": return "Re-submit Resolution";
      default: return "Submit Resolution";
    }
  };

  const navigateToProfile = () => {
    toast.info("Loading profile...", {
      position: "top-right",
      duration: 1500,
    });
    navigate("/profile");
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const StatCard = ({ title, value, color, icon, subtitle }) => (
    <div
      className="p-4 sm:p-5 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
      style={{
        backgroundColor: colors.card,
        border: `1px solid ${colors.border}`,
      }}
    >
      <div className="flex justify-between items-start mb-3">
        <div
          className="p-2 rounded-lg"
          style={{ backgroundColor: `${color}20` }}
        >
          <div style={{ color }}>{icon}</div>
        </div>
      </div>
      <h3 className="text-xl sm:text-2xl font-bold mb-1" style={{ color: colors.text }}>
        {value}
      </h3>
      <p className="text-sm sm:text-base font-medium" style={{ color: colors.text }}>
        {title}
      </p>
      {subtitle && (
        <p className="text-xs sm:text-sm mt-1 opacity-75" style={{ color: colors.text }}>
          {subtitle}
        </p>
      )}
    </div>
  );

  const filteredComplaints = assignedComplaints.filter((complaint) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      complaint.title?.toLowerCase().includes(query) ||
      complaint.description?.toLowerCase().includes(query) ||
      complaint.area?.toLowerCase().includes(query) ||
      complaint.category?.toLowerCase().includes(query)
    );
  });

  if (loading) return <Preloader />;

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {/* Header - Mobile Optimized */}
      <header
        className="sticky top-0 z-50 border-b px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4"
        style={{
          backgroundColor: colors.bg,
          borderColor: colors.border,
          backdropFilter: "blur(10px)",
        }}
      >
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <img
              src={currentLogo}
              alt="CivicFix Logo"
              className="h-8 sm:h-10 md:h-12 lg:h-14 w-auto object-contain"
            />
            <div className="hidden xs:block">
              <h1
                className="text-sm sm:text-base md:text-lg lg:text-xl font-bold"
                style={{ color: colors.primary }}
              >
                Officer
              </h1>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMobileMenuOpen(!mobileMenuOpen);
            }}
            className="md:hidden p-2 rounded-lg"
            style={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
            }}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1 lg:gap-2 px-2 lg:px-3 py-1.5 lg:py-2 rounded-xl border transition-colors duration-200 hover:scale-105"
              style={{
                backgroundColor: theme === "dark" ? "#0a0a0a" : "#f5f5f5",
                borderColor: theme === "dark" ? "#1a1a1a" : "#e5e5e5",
                color: theme === "dark" ? "#ffffff" : "#000000",
              }}
            >
              {theme === "dark" ? (
                <>
                  <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span className="text-xs lg:text-sm font-medium">Light</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  <span className="text-xs lg:text-sm font-medium">Dark</span>
                </>
              )}
            </button>

            <button
              onClick={() => fetchDashboardData()}
              className="p-2 lg:p-2.5 rounded-xl transition-all duration-300 hover:scale-110"
              style={{
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
              }}
              title="Refresh"
            >
              <RefreshCw size={16} className="lg:w-[18px] lg:h-[18px]" />
            </button>

            <div className="relative">
              <button
                className="flex items-center space-x-1 lg:space-x-2 p-1 lg:p-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setProfileDropdownOpen(!profileDropdownOpen);
                }}
              >
                <div
                  className="w-6 h-6 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-xs lg:text-sm"
                  style={{
                    backgroundColor: user?.profileImage ? "transparent" : colors.primary,
                    border: user?.profileImage ? `2px solid ${colors.primary}` : "none",
                  }}
                >
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user.name}
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => {
                        e.target.style.display = "none";
                        const parent = e.target.parentElement;
                        if (parent) {
                          const initials = document.createElement("span");
                          initials.style.color = "white";
                          initials.textContent = getUserInitials(user.name);
                          parent.appendChild(initials);
                        }
                      }}
                    />
                  ) : (
                    <span style={{ color: "white" }}>
                      {getUserInitials(user?.name)}
                    </span>
                  )}
                </div>
                <span className="font-medium text-xs lg:text-sm hidden lg:inline">
                  {user?.name || "Officer"}
                </span>
              </button>

              {profileDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-36 lg:w-44 rounded-xl py-1 lg:py-2 z-50"
                  style={{
                    backgroundColor: colors.card,
                    border: `1px solid ${colors.border}`,
                    backdropFilter: "blur(10px)",
                    boxShadow: `0 10px 25px rgba(0, 0, 0, 0.2)`,
                  }}
                >
                  <button
                    onClick={navigateToProfile}
                    className="flex items-center space-x-2 w-full px-3 lg:px-4 py-2 text-left text-xs lg:text-sm"
                    style={{ backgroundColor: `${colors.border}10` }}
                  >
                    <User size={14} className="lg:w-4 lg:h-4" />
                    <span>Profile</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 w-full px-3 lg:px-4 py-2 text-left text-xs lg:text-sm"
                    style={{
                      color: colors.danger,
                      backgroundColor: `${colors.border}10`,
                    }}
                  >
                    <LogOut size={14} className="lg:w-4 lg:h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div
            className="md:hidden mt-3 p-3 rounded-lg animate-slideDown"
            style={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
              position: 'relative',
              zIndex: 100,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col space-y-2">
              <button
                onClick={() => {
                  toggleTheme();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2.5 px-3 rounded-lg flex items-center justify-between text-sm"
                style={{ backgroundColor: `${colors.border}20` }}
              >
                <span>{theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode"}</span>
              </button>
              
              <button
                onClick={() => {
                  fetchDashboardData();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2.5 px-3 rounded-lg flex items-center justify-between text-sm"
                style={{ backgroundColor: `${colors.border}20` }}
              >
                <span>🔄 Refresh</span>
              </button>
              
              <button
                onClick={navigateToProfile}
                className="w-full text-left py-2.5 px-3 rounded-lg flex items-center justify-between text-sm"
                style={{ backgroundColor: `${colors.border}20` }}
              >
                <span>👤 Profile</span>
              </button>
              
              <button
                onClick={handleLogout}
                className="w-full text-left py-2.5 px-3 rounded-lg flex items-center justify-between text-sm"
                style={{ color: colors.danger, backgroundColor: `${colors.border}20` }}
              >
                <span>🚪 Logout</span>
              </button>
            </div>
          </div>
        )}

        {/* Tabs - Mobile Optimized */}
        <div className="flex mt-3 overflow-x-auto hide-scrollbar">
          {["assigned", "dashboard"].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                toast.info(`Switched to ${tab} tab`, {
                  position: "top-right",
                  duration: 2000,
                });
                setMobileMenuOpen(false);
              }}
              className="flex-1 min-w-20 py-2 text-xs sm:text-sm font-medium relative group"
              style={{
                color: activeTab === tab ? colors.primary : colors.text,
                opacity: activeTab === tab ? 1 : 0.7,
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {activeTab === tab && (
                <div
                  className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full"
                  style={{ backgroundColor: colors.primary }}
                />
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content - Mobile Optimized */}
      <main className="p-3 sm:p-4 md:p-6">
        {activeTab === "assigned" && (
          <div>
            <div className="flex flex-col gap-3 mb-4">
              <div>
                <h1
                  className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-1"
                  style={{ color: colors.primary }}
                >
                  Assigned Complaints
                </h1>
                <p className="text-xs opacity-75">Manage complaints assigned to you</p>
              </div>

              <div className="flex flex-col gap-3">
                {/* Search */}
                <div className="relative w-full">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2"
                    size={14}
                  />
                  <input
                    type="text"
                    placeholder="Search complaints..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 text-xs rounded-lg"
                    style={{
                      backgroundColor: colors.card,
                      border: `1px solid ${colors.border}`,
                      color: colors.text,
                    }}
                  />
                </div>

                {/* Filters - Horizontal Scroll */}
                <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                  <button
                    onClick={() => setSearchQuery("")}
                    className="px-2 py-1.5 rounded-lg text-2xs whitespace-nowrap flex-shrink-0"
                    style={{
                      backgroundColor: searchQuery === "" ? colors.primary : colors.card,
                      color: searchQuery === "" ? "white" : colors.text,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    All
                  </button>
                  {["IN_PROGRESS", "PENDING_VERIFICATION", "RESOLVED"].map((status) => (
                    <button
                      key={status}
                      onClick={() => setSearchQuery(status)}
                      className="px-2 py-1.5 rounded-lg text-2xs whitespace-nowrap flex-shrink-0"
                      style={{
                        backgroundColor: searchQuery === status ? getStatusColor(status) : colors.card,
                        color: searchQuery === status ? "white" : colors.text,
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      {status.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Image Upload Section - Mobile Optimized */}
            <div
              className="mb-4 p-4 rounded-lg"
              style={{
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
                borderLeft: `4px solid ${colors.primary}`,
              }}
            >
              <h2 className="font-bold mb-3 flex items-center text-sm">
                <Camera size={16} className="mr-2" style={{ color: colors.primary }} />
                Upload Resolution Image
              </h2>
              <div className="flex flex-col gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      if (file.size > 5 * 1024 * 1024) {
                        toast.error("File size must be less than 5MB");
                        return;
                      }
                      setImageFile(file);
                      toast.info(`Selected: ${file.name}`);
                    }
                  }}
                  className="w-full p-2 text-xs rounded-lg"
                  style={{
                    backgroundColor: colors.bg,
                    border: `1px solid ${colors.border}`,
                    color: colors.text,
                  }}
                />
                <div className="text-xs">
                  {imageFile ? (
                    <span style={{ color: colors.primary }}>✓ {imageFile.name}</span>
                  ) : (
                    <span className="opacity-75">No file selected</span>
                  )}
                </div>
              </div>
              <div className="mt-3">
                <textarea
                  value={verificationRemarks}
                  onChange={(e) => setVerificationRemarks(e.target.value)}
                  placeholder="Resolution remarks (optional)"
                  rows="2"
                  className="w-full p-2 text-xs rounded-lg"
                  style={{
                    backgroundColor: colors.bg,
                    border: `1px solid ${colors.border}`,
                    color: colors.text,
                  }}
                />
              </div>
              <p className="text-2xs opacity-75 mt-2">
                Max file size: 5MB. Upload before submitting.
              </p>
            </div>

            {/* Complaints List - Mobile Optimized */}
            {loading ? (
              <div className="text-center py-8 opacity-75">
                <Loader className="animate-spin w-6 h-6 mx-auto mb-2" />
                <p className="text-xs">Loading complaints...</p>
              </div>
            ) : filteredComplaints.length === 0 ? (
              <div className="text-center py-8">
                <FileText size={32} className="mx-auto mb-2 opacity-50" />
                <h3 className="text-sm font-bold mb-1">
                  {searchQuery ? "No complaints found" : "No complaints assigned"}
                </h3>
                <p className="text-xs opacity-75">
                  {searchQuery ? "Try changing your search" : "You have no complaints yet"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredComplaints.map((complaint) => (
                  <div
                    key={complaint._id}
                    className="p-3 rounded-lg"
                    style={{
                      backgroundColor: colors.card,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <div className="flex flex-col gap-3">
                      {/* Status Badge */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-2xs font-medium"
                          style={{
                            backgroundColor: `${getStatusColor(complaint.status)}20`,
                            color: getStatusColor(complaint.status),
                          }}
                        >
                          {getStatusIcon(complaint.status)}
                          <span>{complaint.status.replace("_", " ")}</span>
                        </span>
                        <span className="text-2xs opacity-75">
                          {formatDate(complaint.createdAt)}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="font-bold text-sm">{complaint.title}</h3>

                      {/* Description */}
                      <p className="text-xs opacity-75 line-clamp-2">
                        {complaint.description}
                      </p>

                      {/* Category, Area, Priority */}
                      <div className="flex flex-wrap items-center gap-2 text-2xs">
                        <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800">
                          {complaint.category}
                        </span>
                        <span className="flex items-center">
                          <MapPin size={10} className="mr-1" />
                          {complaint.area}
                        </span>
                        {complaint.priority && (
                          <span
                            className="px-2 py-0.5 rounded"
                            style={{
                              backgroundColor:
                                complaint.priority === "HIGH" || complaint.priority === "CRITICAL"
                                  ? `${colors.danger}20`
                                  : `${colors.warning}20`,
                              color:
                                complaint.priority === "HIGH" || complaint.priority === "CRITICAL"
                                  ? colors.danger
                                  : colors.warning,
                            }}
                          >
                            {complaint.priority}
                          </span>
                        )}
                      </div>

                      {/* Additional Info */}
                      <div className="text-2xs space-y-1">
                        <div>
                          <span className="opacity-75">Reported by:</span>{" "}
                          {complaint.user?.name || "Anonymous"}
                        </div>
                        <div>
                          <span className="opacity-75">Supervisor:</span>{" "}
                          {complaint.assignedTo?.name || "Not assigned"}
                        </div>
                        {complaint.sla?.dueBy && (
                          <div
                            className={
                              new Date(complaint.sla.dueBy) < new Date()
                                ? "text-red-500"
                                : "text-yellow-500"
                            }
                          >
                            <span className="opacity-75">Due:</span>{" "}
                            {formatDate(complaint.sla.dueBy)}
                            {new Date(complaint.sla.dueBy) < new Date() && " (OVERDUE)"}
                          </div>
                        )}
                      </div>

                      {/* Citizen Images */}
                      {complaint.images?.citizen?.length > 0 && (
                        <div className="mt-1">
                          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                            {complaint.images.citizen.map((img, index) => (
                              <img
                                key={index}
                                src={img}
                                alt={`Evidence ${index + 1}`}
                                className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                                onError={(e) => {
                                  e.target.src = "https://via.placeholder.com/64?text=Error";
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Previously Submitted Image */}
                      {complaint.images?.officer && complaint.status === "PENDING_VERIFICATION" && (
                        <div className="mt-1">
                          <span className="text-2xs opacity-75 block mb-1">Previous:</span>
                          <img
                            src={complaint.images.officer}
                            alt="Previous resolution"
                            className="w-16 h-16 object-cover rounded-lg border"
                            style={{ borderColor: colors.warning }}
                          />
                        </div>
                      )}

                      {/* Action Buttons */}
                      {(complaint.status === "IN_PROGRESS" || complaint.status === "PENDING_VERIFICATION") && (
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => {
                              setSelectedComplaint(complaint._id);
                              if (!imageFile) {
                                toast.error("Please select an image first");
                              } else {
                                handleResolveComplaint(complaint._id);
                              }
                            }}
                            disabled={!imageFile || uploading}
                            className="flex-1 px-3 py-2 rounded-lg text-2xs font-medium disabled:opacity-50"
                            style={{
                              backgroundColor:
                                complaint.status === "PENDING_VERIFICATION"
                                  ? colors.warning
                                  : colors.primary,
                              color: "white",
                            }}
                          >
                            {uploading && selectedComplaint === complaint._id ? (
                              <Loader className="animate-spin w-3 h-3 mx-auto" />
                            ) : (
                              getButtonText(complaint.status)
                            )}
                          </button>
                        </div>
                      )}

                      {/* Verified Status */}
                      {complaint.status === "RESOLVED" && (
                        <div
                          className="text-center p-2 rounded-lg mt-2"
                          style={{ backgroundColor: `${colors.success}20` }}
                        >
                          <CheckCircle size={16} className="mx-auto mb-1" style={{ color: colors.success }} />
                          <div className="text-2xs font-medium" style={{ color: colors.success }}>
                            Verified on {formatDate(complaint.updatedAt)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "dashboard" && (
          <>
            {/* Welcome Section */}
            <div className="mb-4">
              <h1
                className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-1"
                style={{ color: colors.primary }}
              >
                Welcome, Officer {user?.name?.split(" ")[0] || ""}
              </h1>
              <p className="text-xs opacity-75">
                Manage and resolve assigned complaints
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4">
              <StatCard
                title="Total"
                value={stats.total || 0}
                color={colors.info}
                icon={<FileText size={20} />}
                subtitle="Assigned"
              />
              <StatCard
                title="In Progress"
                value={stats.inProgress || 0}
                color={colors.warning}
                icon={<Clock size={20} />}
                subtitle="Working on"
              />
              <StatCard
                title="Pending"
                value={stats.pendingVerification || 0}
                color={colors.pending}
                icon={<AlertOctagon size={20} />}
                subtitle="Awaiting approval"
              />
              <StatCard
                title="Verified"
                value={stats.resolved || 0}
                color={colors.success}
                icon={<CheckCircle size={20} />}
                subtitle="Completed"
              />
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4">
              <StatCard
                title="Overdue"
                value={stats.overdue || 0}
                color={colors.danger}
                icon={<AlertTriangle size={20} />}
                subtitle="Past due date"
              />
              <StatCard
                title="Success Rate"
                value={`${Math.round(stats.resolutionRate || 0)}%`}
                color={colors.primary}
                icon={<Target size={20} />}
                subtitle="Verification rate"
              />
            </div>

            {/* Performance Bar */}
            <div className="mb-4">
              <h2 className="text-sm font-bold mb-2">Performance</h2>
              <div
                className="p-3 rounded-lg"
                style={{
                  backgroundColor: colors.card,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs opacity-75">Verification Rate</span>
                  <span className="text-sm font-bold" style={{ color: colors.primary }}>
                    {Math.round(stats.resolutionRate || 0)}%
                  </span>
                </div>
                <div className="h-2 rounded-full" style={{ backgroundColor: `${colors.border}50` }}>
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${stats.resolutionRate || 0}%`,
                      backgroundColor: colors.primary,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h2 className="text-sm font-bold mb-2">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setActiveTab("assigned")}
                  className="p-3 rounded-lg text-left transition-all duration-300"
                  style={{
                    backgroundColor: colors.card,
                    border: `1px solid ${colors.border}`,
                    borderLeft: `4px solid ${colors.primary}`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="p-1 rounded-lg"
                      style={{ backgroundColor: `${colors.primary}20` }}
                    >
                      <Eye size={14} style={{ color: colors.primary }} />
                    </div>
                    <span className="text-xs font-medium">View Assigned</span>
                  </div>
                  <p className="text-2xs opacity-75">Check complaints</p>
                </button>

                <button
                  onClick={() => {
                    toast.info("Reports feature coming soon");
                  }}
                  className="p-3 rounded-lg text-left transition-all duration-300"
                  style={{
                    backgroundColor: colors.card,
                    border: `1px solid ${colors.border}`,
                    borderLeft: `4px solid ${colors.primary}`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="p-1 rounded-lg"
                      style={{ backgroundColor: `${colors.primary}20` }}
                    >
                      <BarChart3 size={14} style={{ color: colors.primary }} />
                    </div>
                    <span className="text-xs font-medium">Reports</span>
                  </div>
                  <p className="text-2xs opacity-75">View performance</p>
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer - Mobile Optimized */}
      <footer
        className="mt-8 py-4 px-3 border-t"
        style={{
          borderColor: colors.border,
          backgroundColor: colors.bg,
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <div className="flex items-center space-x-2">
              <img
                src={currentLogo}
                alt="CivicFix Logo"
                className="h-8 w-auto object-contain"
              />
              <span className="text-xs font-bold" style={{ color: colors.primary }}>
                CivicFix Officer
              </span>
            </div>
            <div className="text-2xs opacity-75">
              © {new Date().getFullYear()} All rights reserved
            </div>
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
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default OfficerDashboard;
