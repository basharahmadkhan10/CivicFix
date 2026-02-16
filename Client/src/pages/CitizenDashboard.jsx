import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import lightLogo from "../assets/images/img01.png";
import darkLogo from "../assets/images/img02.png";
import { useAuth } from "../context/AuthContext";

import {
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  Bell,
  User,
  MapPin,
  Filter,
  RefreshCw,
  LogOut,
  Eye,
  Menu,
  X,
} from "lucide-react";
import api from "../utils/api";
import Preloader from "../components/Preloader";

const CitizenDashboard = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    created: 0,
    assigned: 0,
    inProgress: 0,
    resolved: 0,
    rejected: 0,
    withdrawn: 0,
  });
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");
  
  const colors =
    theme === "light"
      ? {
          bg: "#ffffff",
          text: "#000000",
          card: "#e6f7f2", 
          border: "#d1f0e7",
          accent: "#000000",
          success: "#10b981",
          warning: "#f59e0b",
          danger: "#ef4444",
          info: "#14b8a6",
          primary: "#14b8a6",
          categoryBg: "#e2e8f0",
          categoryText: "#1e293b",
          citizen: "#aae8db",
        }
      : {
          bg: "#000000",
          text: "#ffffff",
          card: "#1a2e2a", 
          border: "#2d4d45",
          accent: "#ffffff",
          success: "#10b981",
          warning: "#f59e0b",
          danger: "#ef4444",
          info: "#2dd4bf",
          primary: "#14b8a6",
          categoryBg: "#4b5563",
          categoryText: "#f3f4f6",
          citizen: "#5eead4",
        };

  const currentLogo = theme === "dark" ? darkLogo : lightLogo;

  const getProfileImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;
    if (imagePath.startsWith("/uploads")) {
      return `http://localhost:5000${imagePath}`;
    }
    return imagePath;
  };
  
  const getUserInitials = (name) => {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
  };

  const refreshUserData = async () => {
    try {
      const response = await api.get("/v1/user/me");
      const freshUser = response.data?.data;
      if (freshUser) {
        setUser(freshUser);
        const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
        const updatedUser = { ...currentUser, ...freshUser };
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error("Error refreshing user:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchDashboardData(), refreshUserData()]);
      setTimeout(() => {
        setPageLoaded(true);
      }, 500);
    };
    loadData();
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshUserData();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);
  
  useEffect(() => {
    if (user?.name && pageLoaded) {
      toast.success(`Welcome back, ${user.name}!`, {
        position: "top-right",
        duration: 2000,
      });
    }
  }, [user, pageLoaded]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setProfileDropdownOpen(false);
      setMobileMenuOpen(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const complaintsRes = await api.get("/v1/complaints/my");
      setComplaints(complaintsRes.data?.data || []);

      const statsRes = await api.get("/v1/complaints/stats");
      setStats(statsRes.data?.data || {});

      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);

      toast.error("Failed to load dashboard data", {
        position: "top-right",
        duration: 5000,
      });
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.warning("Please enter a search query", {
        position: "top-right",
        duration: 3000,
      });
      return;
    }

    try {
      toast.info("Searching complaints...", {
        position: "top-right",
        duration: 2000,
      });

      const res = await api.get(
        `/v1/complaints/search?q=${encodeURIComponent(searchQuery)}`,
      );
      setComplaints(res.data?.data || []);

      if (res.data?.data?.length === 0) {
        toast.warning("No complaints found matching your search", {
          position: "top-right",
          duration: 4000,
        });
      } else {
        toast.success(`Found ${res.data?.data?.length} complaint(s)`, {
          position: "top-right",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Search failed. Please try again.", {
        position: "top-right",
        duration: 5000,
      });
    }
  };

  const handleFilter = async (status) => {
    setSelectedStatusFilter(status);
    try {
      toast.info(
        `Filtering ${status === "ALL" ? "all" : status.toLowerCase()} complaints...`,
        {
          position: "top-right",
          duration: 1500,
        },
      );

      if (status === "ALL") {
        await fetchDashboardData();
        toast.success("Showing all complaints", {
          position: "top-right",
          duration: 3000,
        });
        return;
      }

      const res = await api.get(`/v1/complaints/filter?status=${status}`);
      setComplaints(res.data?.data || []);

      if (res.data?.data?.length === 0) {
        toast.warning(`No ${status.toLowerCase()} complaints found`, {
          position: "top-right",
          duration: 4000,
        });
      } else {
        toast.success(
          `Showing ${res.data?.data?.length} ${status.toLowerCase()} complaint(s)`,
          {
            position: "top-right",
            duration: 3000,
          },
        );
      }
    } catch (error) {
      console.error("Filter error:", error);
      toast.error("Filter failed. Please try again.", {
        position: "top-right",
        duration: 5000,
      });
    }
  };

  const handleRefresh = () => {
    toast.info("Refreshing data...", {
      position: "top-right",
      duration: 2000,
    });
    fetchDashboardData();
    refreshUserData();
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
  
  const navigateToNewComplaint = () => {
    toast.info("Opening new complaint form...", {
      position: "top-right",
      duration: 2000,
    });
    navigate("/complaints/new");
  };

  const navigateToComplaintDetails = (id) => {
    toast.info("Loading complaint details...", {
      position: "top-right",
      duration: 1500,
    });
    navigate(`/complaints/${id}`);
  };

  const navigateToEditComplaint = (id) => {
    toast.info("Opening edit page...", {
      position: "top-right",
      duration: 1500,
    });
    navigate(`/complaints/${id}/edit`);
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

  const getStatusColor = (status) => {
    switch (status) {
      case "CREATED":
        return colors.info;
      case "ASSIGNED":
        return colors.warning;
      case "IN_PROGRESS":
        return colors.primary;
      case "RESOLVED":
        return colors.success;
      case "REJECTED":
      case "WITHDRAWN":
        return colors.danger;
      default:
        return "#6b7280";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "CREATED":
        return <AlertCircle size={16} />;
      case "ASSIGNED":
        return <Clock size={16} />;
      case "IN_PROGRESS":
        return <Clock size={16} />;
      case "RESOLVED":
        return <CheckCircle size={16} />;
      default:
        return <AlertCircle size={16} />;
    }
  };
  
  if (loading || !pageLoaded) {
    return <Preloader />;
  }

  const StatCard = ({ title, value, color, icon, subtitle }) => (
    <div
      className="p-4 sm:p-6 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer"
      onClick={() => {
        if (title === "Resolved" && value > 0) {
          handleFilter("RESOLVED");
        } else if (title === "In Progress" && value > 0) {
          handleFilter("IN_PROGRESS");
        } else if (title === "Assigned" && value > 0) {
          handleFilter("ASSIGNED");
        }
      }}
      style={{
        backgroundColor: colors.card,
        border: `1px solid ${colors.border}`,
      }}
    >
      <div className="flex justify-between items-start mb-2 sm:mb-4">
        <div
          className="p-1.5 sm:p-2 rounded-lg"
          style={{ backgroundColor: `${color}20` }}
        >
          <div style={{ color }}>{icon}</div>
        </div>
      </div>
      <h3 className="text-xl sm:text-2xl font-bold mb-1" style={{ color: colors.text }}>
        {value}
      </h3>
      <p className="text-sm sm:text-base" style={{ color: colors.text }}>
        {title}
      </p>
      {subtitle && (
        <p className="text-xs sm:text-sm mt-1 opacity-75" style={{ color: colors.text }}>
          {subtitle}
        </p>
      )}
    </div>
  );

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
          <div className="flex items-center">
            <img
              src={currentLogo}
              alt="CivicFix Logo"
              className="h-10 sm:h-12 md:h-14 w-auto object-contain"
            />
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
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors duration-200 hover:scale-105"
              style={{
                backgroundColor: theme === "dark" ? "#0a0a0a" : "#f5f5f5",
                borderColor: theme === "dark" ? "#1a1a1a" : "#e5e5e5",
                color: theme === "dark" ? "#ffffff" : "#000000",
              }}
            >
              {theme === "dark" ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span className="text-sm font-medium">Light</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  <span className="text-sm font-medium">Dark</span>
                </>
              )}
            </button>

            <button
              onClick={handleRefresh}
              className="p-3 rounded-xl transition-all duration-300 hover:scale-110"
              style={{
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
              }}
              title="Refresh Dashboard"
            >
              <RefreshCw size={18} />
            </button>

            <button
              onClick={navigateToNewComplaint}
              className="px-4 py-3 rounded-xl font-medium flex items-center space-x-2 transition-all duration-300 hover:scale-105"
              style={{
                backgroundColor: colors.primary,
                color: "white",
              }}
            >
              <Plus size={18} />
              <span>New Complaint</span>
            </button>

            <div className="relative">
              <button
                className="p-2"
                onClick={(e) => {
                  e.stopPropagation();
                  if (notifications.length > 0) {
                    toast.info(`You have ${notifications.length} notification(s)`, {
                      position: "top-right",
                      duration: 3000,
                    });
                  } else {
                    toast.info("No new notifications", {
                      position: "top-right",
                      duration: 3000,
                    });
                  }
                }}
              >
                <Bell size={20} />
              </button>
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                className="flex items-center space-x-2 p-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setProfileDropdownOpen(!profileDropdownOpen);
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden"
                  style={{
                    backgroundColor: user?.profileImage ? "transparent" : colors.primary,
                  }}
                >
                  {user?.profileImage ? (
                    <img
                      src={getProfileImageUrl(user.profileImage)}
                      alt={user.name}
                      className="w-full h-full object-cover"
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
                <span className="font-medium hidden lg:inline">
                  {user?.name || "User"}
                </span>
              </button>

              {profileDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-44 rounded-xl py-2 z-50"
                  style={{
                    backgroundColor: colors.card,
                    border: `1px solid ${colors.border}`,
                    boxShadow: `0 10px 25px rgba(0, 0, 0, 0.2)`,
                  }}
                >
                  <button
                    onClick={navigateToProfile}
                    className="flex items-center space-x-2 w-full px-4 py-3 hover:bg-opacity-80 text-left transition-colors"
                    style={{ backgroundColor: `${colors.border}10` }}
                  >
                    <User size={16} />
                    <span>Profile</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 w-full px-4 py-3 hover:bg-opacity-80 text-left transition-colors"
                    style={{ color: colors.danger, backgroundColor: `${colors.border}10` }}
                  >
                    <LogOut size={16} />
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
            className="md:hidden mt-3 p-4 rounded-lg animate-slideDown"
            style={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
              position: 'relative',
              zIndex: 100,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col space-y-3">
              <button
                onClick={() => {
                  toggleTheme();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-3 px-4 rounded-lg flex items-center justify-between"
                style={{ backgroundColor: `${colors.border}20` }}
              >
                <span>{theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode"}</span>
              </button>
              
              <button
                onClick={() => {
                  handleRefresh();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-3 px-4 rounded-lg flex items-center justify-between"
                style={{ backgroundColor: `${colors.border}20` }}
              >
                <span>🔄 Refresh</span>
              </button>
              
              <button
                onClick={() => {
                  navigateToNewComplaint();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-3 px-4 rounded-lg flex items-center justify-between"
                style={{ backgroundColor: colors.primary, color: "white" }}
              >
                <span>➕ New Complaint</span>
              </button>
              
              <button
                onClick={navigateToProfile}
                className="w-full text-left py-3 px-4 rounded-lg flex items-center justify-between"
                style={{ backgroundColor: `${colors.border}20` }}
              >
                <span>👤 Profile</span>
              </button>
              
              <button
                onClick={handleLogout}
                className="w-full text-left py-3 px-4 rounded-lg flex items-center justify-between"
                style={{ color: colors.danger, backgroundColor: `${colors.border}20` }}
              >
                <span>🚪 Logout</span>
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex mt-3 overflow-x-auto hide-scrollbar">
          {["overview", "my-complaints"].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                toast.info(`Switched to ${tab.replace("-", " ")} tab`, {
                  position: "top-right",
                  duration: 2000,
                });
                setMobileMenuOpen(false);
              }}
              className="flex-1 min-w-20 py-2 sm:py-3 text-xs sm:text-sm font-medium relative group"
              style={{
                color: activeTab === tab ? colors.primary : colors.text,
                opacity: activeTab === tab ? 1 : 0.7,
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1).replace("-", " ")}
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

      <main className="p-3 sm:p-4 md:p-6">
        {activeTab === "overview" && (
          <>
            {/* Welcome Section - Mobile Optimized */}
            <div className="mb-6 sm:mb-8 md:mb-12 mt-4 sm:mt-6 md:mt-12">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2">
                Welcome Back{" "}
                <span
                  className="font-bold block sm:inline text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl italic"
                  style={{ color: colors.primary }}
                >
                  {user?.name?.split(" ")[0] || "there"}
                </span>
              </h1>
              <p className="opacity-75 text-xs sm:text-sm md:text-base">
                Here's what's happening with your complaints today.
              </p>
            </div>

            {/* Stats Grid - Mobile Optimized */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4 mb-6 sm:mb-8">
              <StatCard
                title="Total"
                value={stats.total}
                color={colors.info}
                icon={<AlertCircle size={20} />}
              />
              <StatCard
                title="Created"
                value={stats.created}
                color={colors.info}
                icon={<AlertCircle size={20} />}
              />
              <StatCard
                title="Assigned"
                value={stats.assigned}
                color={colors.warning}
                icon={<Clock size={20} />}
              />
              <StatCard
                title="In Progress"
                value={stats.inProgress}
                color={colors.primary}
                icon={<Clock size={20} />}
              />
              <StatCard
                title="Resolved"
                value={stats.resolved}
                color={colors.success}
                icon={<CheckCircle size={20} />}
                subtitle={`${stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%`}
              />
            </div>

            {/* Quick Actions - Mobile Optimized */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 mb-6 sm:mb-8">
              <button
                onClick={navigateToNewComplaint}
                className="p-3 sm:p-4 rounded-xl text-left transition-all duration-300 hover:scale-[1.02]"
                style={{
                  backgroundColor: colors.card,
                  border: `1px solid ${colors.border}`,
                  borderLeft: `4px solid ${colors.primary}`,
                }}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <div
                    className="p-1.5 rounded-lg"
                    style={{ backgroundColor: `${colors.primary}20` }}
                  >
                    <Plus size={16} style={{ color: colors.primary }} />
                  </div>
                  <div className="font-medium text-sm">Report New Issue</div>
                </div>
                <p className="text-xs opacity-75">File a new complaint</p>
              </button>

              <button
                onClick={() => handleFilter("RESOLVED")}
                className="p-3 sm:p-4 rounded-xl text-left transition-all duration-300 hover:scale-[1.02]"
                style={{
                  backgroundColor: colors.card,
                  border: `1px solid ${colors.border}`,
                  borderLeft: `4px solid ${colors.success}`,
                }}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <div
                    className="p-1.5 rounded-lg"
                    style={{ backgroundColor: `${colors.success}20` }}
                  >
                    <CheckCircle size={16} style={{ color: colors.success }} />
                  </div>
                  <div className="font-medium text-sm">Resolved</div>
                </div>
                <p className="text-xs opacity-75">View resolved</p>
              </button>

              <button
                onClick={() => handleFilter("IN_PROGRESS")}
                className="p-3 sm:p-4 rounded-xl text-left transition-all duration-300 hover:scale-[1.02]"
                style={{
                  backgroundColor: colors.card,
                  border: `1px solid ${colors.border}`,
                  borderLeft: `4px solid ${colors.warning}`,
                }}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <div
                    className="p-1.5 rounded-lg"
                    style={{ backgroundColor: `${colors.warning}20` }}
                  >
                    <Clock size={16} style={{ color: colors.warning }} />
                  </div>
                  <div className="font-medium text-sm">In Progress</div>
                </div>
                <p className="text-xs opacity-75">Track ongoing</p>
              </button>

              <button
                onClick={handleRefresh}
                className="p-3 sm:p-4 rounded-xl text-left transition-all duration-300 hover:scale-[1.02]"
                style={{
                  backgroundColor: colors.card,
                  border: `1px solid ${colors.border}`,
                  borderLeft: `4px solid ${colors.info}`,
                }}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <div
                    className="p-1.5 rounded-lg"
                    style={{ backgroundColor: `${colors.info}20` }}
                  >
                    <RefreshCw size={16} style={{ color: colors.info }} />
                  </div>
                  <div className="font-medium text-sm">Refresh</div>
                </div>
                <p className="text-xs opacity-75">Update data</p>
              </button>
            </div>

            {/* Recent Complaints - Mobile Optimized */}
            <div>
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-xl font-bold">Recent Complaints</h2>
                <button
                  onClick={() => setActiveTab("my-complaints")}
                  className="text-xs sm:text-sm opacity-75 hover:opacity-100"
                  style={{ color: colors.primary }}
                >
                  View All →
                </button>
              </div>

              {complaints.length === 0 ? (
                <div className="text-center py-8 opacity-75">
                  <AlertCircle size={40} className="mx-auto mb-4 opacity-50" />
                  <h3 className="text-base sm:text-lg font-bold mb-2">No complaints yet</h3>
                  <p className="text-xs sm:text-sm opacity-75 mb-4">
                    Start by creating your first complaint!
                  </p>
                  <button
                    onClick={navigateToNewComplaint}
                    className="px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-medium text-sm sm:text-base"
                    style={{ backgroundColor: colors.primary, color: "white" }}
                  >
                    Create First Complaint
                  </button>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {complaints.slice(0, 5).map((complaint) => (
                    <div
                      key={complaint._id}
                      className="p-3 sm:p-4 rounded-xl transition-all duration-300 hover:scale-[1.01]"
                      style={{
                        backgroundColor: colors.card,
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: `${getStatusColor(complaint.status)}20`,
                                color: getStatusColor(complaint.status),
                              }}
                            >
                              {getStatusIcon(complaint.status)}
                              <span>{complaint.status}</span>
                            </span>
                            <span className="text-xs opacity-75">
                              {new Date(complaint.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <h3 className="font-bold text-base sm:text-lg mb-1">
                            {complaint.title}
                          </h3>
                          <p className="text-xs sm:text-sm opacity-75 line-clamp-2">
                            {complaint.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="text-xs opacity-75 flex items-center">
                              <MapPin size={12} className="mr-1" />
                              {complaint.area}
                            </span>
                            <span
                              className="text-xs px-2 py-1 rounded-full"
                              style={{
                                backgroundColor: colors.categoryBg,
                                color: colors.categoryText,
                              }}
                            >
                              {complaint.category}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => navigateToComplaintDetails(complaint._id)}
                          className="w-full sm:w-auto px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 text-sm transition-all duration-300 hover:scale-105"
                          style={{ backgroundColor: colors.primary, color: "white" }}
                        >
                          <Eye size={14} />
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === "my-complaints" && (
          <div>
            {/* Search and Filter - Mobile Optimized */}
            <div className="flex flex-col gap-3 mb-4 sm:mb-6">
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1">
                  My Complaints
                </h1>
                <p className="text-xs sm:text-sm opacity-75">
                  Track all your reported issues in one place
                </p>
              </div>

              <div className="flex flex-col gap-3">
                {/* Search Bar */}
                <div className="relative w-full">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder="Search complaints..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    className="w-full pl-9 pr-10 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: colors.card,
                      border: `1px solid ${colors.border}`,
                      focusRingColor: colors.primary,
                    }}
                  />
                  <button
                    onClick={handleSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <Search size={14} className="opacity-60" />
                  </button>
                </div>

                {/* Filter Buttons - Horizontal Scroll */}
                <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                  <button
                    onClick={() => handleFilter("ALL")}
                    className="px-3 py-2 rounded-lg text-xs whitespace-nowrap transition-all duration-300 flex-shrink-0"
                    style={{
                      backgroundColor: selectedStatusFilter === "ALL" ? colors.primary : colors.card,
                      color: selectedStatusFilter === "ALL" ? "white" : colors.text,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <Filter size={12} className="inline mr-1" />
                    All
                  </button>
                  {["CREATED", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "REJECTED"].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleFilter(status)}
                      className="px-3 py-2 rounded-lg text-xs whitespace-nowrap transition-all duration-300 flex-shrink-0"
                      style={{
                        backgroundColor: selectedStatusFilter === status ? getStatusColor(status) : colors.card,
                        color: selectedStatusFilter === status ? "white" : colors.text,
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Complaints List - Mobile Optimized */}
            {complaints.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <div className="max-w-md mx-auto px-4">
                  <AlertCircle size={40} className="mx-auto mb-4 opacity-50" />
                  <h3 className="text-base sm:text-lg font-bold mb-2">
                    No complaints found
                  </h3>
                  <p className="text-xs sm:text-sm opacity-75 mb-4">
                    {searchQuery
                      ? "No complaints match your search criteria."
                      : "You haven't created any complaints yet."}
                  </p>
                  {!searchQuery && (
                    <button
                      onClick={navigateToNewComplaint}
                      className="px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-medium text-sm transition-all duration-300"
                      style={{ backgroundColor: colors.primary, color: "white" }}
                    >
                      Create Your First Complaint
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {complaints.map((complaint) => (
                  <div
                    key={complaint._id}
                    className="p-3 sm:p-4 rounded-lg transition-all duration-300 hover:scale-[1.01]"
                    style={{
                      backgroundColor: colors.card,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <div className="flex flex-col gap-2">
                      {/* Status and Date */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${getStatusColor(complaint.status)}20`,
                            color: getStatusColor(complaint.status),
                          }}
                        >
                          {getStatusIcon(complaint.status)}
                          <span>{complaint.status}</span>
                        </span>
                        <span className="text-xs opacity-75">
                          {new Date(complaint.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="font-bold text-sm sm:text-base">
                        {complaint.title}
                      </h3>

                      {/* Category and Area */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="text-xs px-2 py-1 rounded-full"
                          style={{
                            backgroundColor: colors.categoryBg,
                            color: colors.categoryText,
                          }}
                        >
                          {complaint.category}
                        </span>
                        <span className="text-xs opacity-75 flex items-center">
                          <MapPin size={10} className="mr-1" />
                          {complaint.area}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={() => navigateToComplaintDetails(complaint._id)}
                          className="flex-1 px-3 py-2 rounded text-xs font-medium transition-all duration-300"
                          style={{
                            backgroundColor: colors.primary,
                            color: "white",
                          }}
                        >
                          View Details
                        </button>
                        {["CREATED", "ASSIGNED"].includes(complaint.status) && (
                          <button
                            onClick={() => navigateToEditComplaint(complaint._id)}
                            className="flex-1 px-3 py-2 rounded text-xs font-medium transition-all duration-300"
                            style={{
                              backgroundColor: colors.card,
                              border: `1px solid ${colors.border}`,
                            }}
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer - Mobile Optimized */}
      <footer
        className="mt-8 sm:mt-12 py-4 sm:py-6 px-3 sm:px-4 border-t"
        style={{
          borderColor: colors.border,
          backgroundColor: colors.bg,
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start space-x-2">
                <img
                  src={currentLogo}
                  alt="CivicFix Logo"
                  className="h-8 sm:h-10 md:h-12 w-auto object-contain"
                />
              </div>
              <p className="text-xs opacity-75 mt-1">
                Citizen Complaint Management System
              </p>
            </div>
            <div className="text-xs opacity-75">
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

export default CitizenDashboard;
