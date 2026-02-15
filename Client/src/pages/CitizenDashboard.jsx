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
  TrendingUp,
  RefreshCw,
  LogOut,
  Eye,
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
  const { name } = useAuth();
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
  const [notifications, setNotifications] = useState([]);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");
  const colors =
    theme === "light"
      ? {
          bg: "#ffffff",
          text: "#000000",
          card: "#e6f7f2", 
          border: "#d1f0e7", // Lighter version for borders
          accent: "#000000",
          success: "#10b981",
          warning: "#f59e0b",
          danger: "#ef4444",
          info: "#14b8a6", // Teal for info
          primary: "#14b8a6", // Teal primary
          categoryBg: "#e2e8f0",
          categoryText: "#1e293b",
          citizen: "#aae8db", // Your specified color
        }
      : {
          bg: "#000000",
          text: "#ffffff",
          card: "#1a2e2a", 
          border: "#2d4d45", // Dark border with #aae8db influence
          accent: "#ffffff",
          success: "#10b981",
          warning: "#f59e0b",
          danger: "#ef4444",
          info: "#2dd4bf", // Bright teal for info
          primary: "#14b8a6", // Teal primary
          categoryBg: "#4b5563",
          categoryText: "#f3f4f6",
          citizen: "#5eead4", // Lighter version for dark mode
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
        // Update localStorage
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
      className="p-6 rounded-xl transition-all duration-300 hover:scale-[1.05] hover:shadow-lg cursor-pointer"
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
      <div className="flex justify-between items-start mb-4">
        <div
          className="p-2 rounded-lg"
          style={{ backgroundColor: `${color}20` }}
        >
          <div style={{ color }}>{icon}</div>
        </div>
      </div>
      <h3 className="text-2xl font-bold mb-1" style={{ color: colors.text }}>
        {value}
      </h3>
      <p style={{ color: colors.text }} className="font-medium">
        {title}
      </p>
      {subtitle && (
        <p className="text-sm mt-1 opacity-75" style={{ color: colors.text }}>
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
      <header
        className="sticky top-0 z-50 border-b px-6 py-4"
        style={{
          backgroundColor: colors.bg,
          borderColor: colors.border,
          backdropFilter: "blur(10px)",
        }}
      >
        <div className="flex justify-between items-center gap-50">
          <div className="flex items-center space-x-4">
            <img
              src={currentLogo}
              alt="CivicFix Logo"
              className="h-14 w-auto object-contain"
            />
          </div>

          <div className="flex items-center space-x-4">
            
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors duration-200 hover:scale-105"
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
                    className="w-5 h-5"
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
                  <span className="text-sm font-medium">Light</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
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
              <RefreshCw
                size={18}
                className="hover:rotate-180 transition-transform duration-500"
              />
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
                onClick={() => {
                  if (notifications.length > 0) {
                    toast.info(
                      `You have ${notifications.length} notification(s)`,
                      {
                        position: "top-right",
                        duration: 3000,
                      },
                    );
                  } else {
                    toast.info("No new notifications", {
                      position: "top-right",
                      duration: 3000,
                    });
                  }
                }}
              >
                <Bell size={20} />
                {notifications.length > 0 && (
                  <span
                    className="absolute top-1 right-1 w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: colors.danger }}
                  />
                )}
              </button>
            </div>

            <div className="relative">
              <button
                className="flex items-center space-x-2 p-2"
                onClick={(e) => {
                  e.stopPropagation();
                  const dropdown = document.getElementById("profile-dropdown");
                  if (dropdown) {
                    dropdown.classList.toggle("hidden");
                  }
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden"
                  style={{
                    backgroundColor: user?.profileImage
                      ? "transparent"
                      : colors.primary,
                    border: user?.profileImage
                      ? `2px solid ${colors.primary}`
                      : "none",
                  }}
                >
                  {user?.profileImage ? (
                    <img
                      src={getProfileImageUrl(user.profileImage)}
                      alt={user.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to initials if image fails to load
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
                <span className="font-medium hidden md:inline">
                  {user?.name || "User"}
                </span>
              </button>

              <div
                id="profile-dropdown"
                className="absolute right-0 mt-2 w-44 rounded-xl hidden transition-all duration-300 z-50"
                style={{
                  backgroundColor: colors.card,
                  border: `1px solid ${colors.border}`,
                  backdropFilter: "blur(10px)",
                  boxShadow: `0 10px 25px rgba(0, 0, 0, 0.2)`,
                }}
              >
                <div className="py-2">
                  <button
                    onClick={navigateToProfile}
                    className="flex items-center space-x-2 w-full px-4 py-3 hover:bg-opacity-80 text-left transition-colors"
                    style={{
                      backgroundColor: `${colors.border}10`,
                    }}
                  >
                    <User size={16} />
                    <span>Profile</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 w-full px-4 py-3 hover:bg-opacity-80 text-left transition-colors"
                    style={{
                      color: colors.danger,
                      backgroundColor: `${colors.border}10`,
                    }}
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex mt-4 overflow-x-auto">
          {["overview", "my-complaints"].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                toast.info(`Switched to ${tab.replace("-", " ")} tab`, {
                  position: "top-right",
                  duration: 2000,
                });
              }}
              className="flex-1 min-w-24 py-3 text-sm font-medium relative group"
              style={{
                color: activeTab === tab ? colors.primary : colors.text,
                opacity: activeTab === tab ? 1 : 0.7,
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1).replace("-", " ")}
              {activeTab === tab && (
                <div
                  className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full transition-all duration-300"
                  style={{ backgroundColor: colors.primary }}
                />
              )}
              <div className="absolute bottom-0 left-1/2 right-1/2 h-0.5 bg-transparent group-hover:left-1/4 group-hover:right-1/4 transition-all duration-300" />
            </button>
          ))}
        </div>
      </header>
      <main className="p-4 md:p-6">
        {activeTab === "overview" && (
          <>
            {/* Welcome Section */}
            <div className="mb-12 mt-12">
              <h1 className="text-2xl md:text-5xl font-bold m-2 mb-2">
                Welcome Back{" "}
                <span
                  className="font-bolder text-2xl md:text-5xl font-sans italic"
                  style={{ color: colors.primary }}
                >
                  {user?.name || "there"}
                </span>{" "}
                !
              </h1>
              <p className="opacity-75 m-2 ">
                Here's what's happening with your complaints today.
              </p>
            </div>
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <StatCard
                  title="Total Complaints"
                  value={stats.total}
                  color={colors.info}
                  icon={<AlertCircle size={24} />}
                />
                <StatCard
                  title="Created"
                  value={stats.created}
                  color={colors.info}
                  icon={<AlertCircle size={24} />}
                />
                <StatCard
                  title="Assigned"
                  value={stats.assigned}
                  color={colors.warning}
                  icon={<Clock size={24} />}
                />
                <StatCard
                  title="In Progress"
                  value={stats.inProgress}
                  color={colors.primary}
                  icon={<Clock size={24} />}
                />
                <StatCard
                  title="Resolved"
                  value={stats.resolved}
                  color={colors.success}
                  icon={<CheckCircle size={24} />}
                  subtitle={`${stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}% resolution rate`}
                />
              </div>
            </div>
            <div className="mb-8 ">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={navigateToNewComplaint}
                  className="p-4 rounded-xl text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                  style={{
                    backgroundColor: colors.card,
                    border: `1px solid ${colors.border}`,
                    borderLeft: `4px solid ${colors.primary}`,
                  }}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${colors.primary}20` }}
                    >
                      <Plus size={20} style={{ color: colors.primary }} />
                    </div>
                    <div className="font-medium">Report New Issue</div>
                  </div>
                  <p className="text-sm opacity-75">File a new complaint</p>
                </button>

                <button
                  onClick={() => handleFilter("RESOLVED")}
                  className="p-4 rounded-xl text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                  style={{
                    backgroundColor: colors.card,
                    border: `1px solid ${colors.border}`,
                    borderLeft: `4px solid ${colors.success}`,
                  }}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${colors.success}20` }}
                    >
                      <CheckCircle
                        size={20}
                        style={{ color: colors.success }}
                      />
                    </div>
                    <div className="font-medium">Resolved Issues</div>
                  </div>
                  <p className="text-sm opacity-75">View resolved complaints</p>
                </button>

                <button
                  onClick={() => handleFilter("IN_PROGRESS")}
                  className="p-4 rounded-xl text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                  style={{
                    backgroundColor: colors.card,
                    border: `1px solid ${colors.border}`,
                    borderLeft: `4px solid ${colors.warning}`,
                  }}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${colors.warning}20` }}
                    >
                      <Clock size={20} style={{ color: colors.warning }} />
                    </div>
                    <div className="font-medium">In Progress</div>
                  </div>
                  <p className="text-sm opacity-75">Track ongoing work</p>
                </button>

                <button
                  onClick={() => handleRefresh()}
                  className="p-4 rounded-xl text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                  style={{
                    backgroundColor: colors.card,
                    border: `1px solid ${colors.border}`,
                    borderLeft: `4px solid ${colors.info}`,
                  }}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${colors.info}20` }}
                    >
                      <RefreshCw size={20} style={{ color: colors.info }} />
                    </div>
                    <div className="font-medium">Refresh Data</div>
                  </div>
                  <p className="text-sm opacity-75">Update dashboard</p>
                </button>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Recent Complaints</h2>
                <button
                  onClick={() => setActiveTab("my-complaints")}
                  className="text-sm opacity-75 hover:opacity-100 hover:scale-105 transition-all"
                  style={{ color: colors.primary }}
                >
                  View All →
                </button>
              </div>

              {complaints.length === 0 ? (
                <div className="text-center py-8 opacity-75">
                  <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-bold mb-2">No complaints yet</h3>
                  <p className="opacity-75 mb-6">
                    Start by creating your first complaint!
                  </p>
                  <button
                    onClick={navigateToNewComplaint}
                    className="px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105"
                    style={{
                      backgroundColor: colors.primary,
                      color: "white",
                    }}
                  >
                    Create First Complaint
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {complaints.slice(0, 5).map((complaint) => (
                    <div
                      key={complaint._id}
                      className="p-4 rounded-xl transition-all duration-300 hover:scale-[1.01] hover:shadow-lg"
                      style={{
                        backgroundColor: colors.card,
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium"
                              style={{
                                backgroundColor: `${getStatusColor(complaint.status)}20`,
                                color: getStatusColor(complaint.status),
                              }}
                            >
                              {getStatusIcon(complaint.status)}
                              <span>{complaint.status}</span>
                            </span>
                            <span className="text-sm opacity-75">
                              {new Date(
                                complaint.createdAt,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <h3 className="font-bold text-lg mb-1">
                            {complaint.title}
                          </h3>
                          <p className="opacity-75 line-clamp-2">
                            {complaint.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 mt-3">
                            <span className="text-sm opacity-75 flex items-center">
                              <MapPin size={14} className="mr-1" />
                              {complaint.area}
                            </span>
                            <span
                              className="text-sm px-3 py-1 rounded-full"
                              style={{
                                backgroundColor: colors.categoryBg,
                                color: colors.categoryText,
                                fontWeight: "500",
                              }}
                            >
                              {complaint.category}
                            </span>
                            {complaint.priority && (
                              <span
                                className="text-sm px-2 py-1 rounded"
                                style={{
                                  backgroundColor:
                                    complaint.priority === "HIGH"
                                      ? `${colors.danger}20`
                                      : complaint.priority === "MEDIUM"
                                        ? `${colors.warning}20`
                                        : `${colors.success}20`,
                                  color:
                                    complaint.priority === "HIGH"
                                      ? colors.danger
                                      : complaint.priority === "MEDIUM"
                                        ? colors.warning
                                        : colors.success,
                                }}
                              >
                                {complaint.priority}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            navigateToComplaintDetails(complaint._id)
                          }
                          className="px-4 py-2 rounded-lg font-medium flex items-center gap-2 whitespace-nowrap transition-all duration-300 hover:scale-105 hover:shadow-md"
                          style={{
                            backgroundColor: colors.primary,
                            color: "white",
                          }}
                        >
                          <Eye size={16} />
                          View Details
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">
                  My Complaints
                </h1>
                <p className="opacity-75">
                  Track all your reported issues in one place
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="Search complaints..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-10 pr-4 py-2 rounded-lg w-full focus:outline-none focus:ring-2"
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
                    <Search size={16} className="opacity-60" />
                  </button>
                </div>
                <div className="flex gap-2 overflow-x-auto">
                  <button
                    onClick={() => handleFilter("ALL")}
                    className="px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all duration-300"
                    style={{
                      backgroundColor:
                        searchQuery === "" && selectedStatusFilter === "ALL"
                          ? colors.primary
                          : colors.card,
                      color:
                        searchQuery === "" && selectedStatusFilter === "ALL"
                          ? "white"
                          : colors.text,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <Filter size={14} className="inline mr-1" />
                    All
                  </button>
                  {[
                    "CREATED",
                    "ASSIGNED",
                    "IN_PROGRESS",
                    "RESOLVED",
                    "REJECTED",
                  ].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleFilter(status)}
                      className="px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all duration-300"
                      style={{
                        backgroundColor: colors.card,
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {complaints.length === 0 ? (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-bold mb-2">
                    No complaints found
                  </h3>
                  <p className="opacity-75 mb-6">
                    {searchQuery
                      ? "No complaints match your search criteria."
                      : "You haven't created any complaints yet."}
                  </p>
                  {!searchQuery && (
                    <button
                      onClick={navigateToNewComplaint}
                      className="px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg"
                      style={{
                        backgroundColor: colors.primary,
                        color: "white",
                      }}
                    >
                      Create Your First Complaint
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div
                className="overflow-x-auto rounded-xl border"
                style={{ borderColor: colors.border }}
              >
                <table
                  className="w-full"
                  style={{ borderCollapse: "separate", borderSpacing: "0" }}
                >
                  <thead>
                    <tr
                      style={{
                        borderBottom: `1px solid ${colors.border}`,
                        backgroundColor: `${colors.border}10`,
                      }}
                    >
                      <th className="text-left p-4 font-medium">Title</th>
                      <th className="text-left p-4 font-medium">Category</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Date</th>
                      <th className="text-left p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.map((complaint) => (
                      <tr
                        key={complaint._id}
                        style={{ borderBottom: `1px solid ${colors.border}` }}
                        className="hover:bg-opacity-50 transition-colors"
                      >
                        <td className="p-4">
                          <div className="font-medium">{complaint.title}</div>
                          <div className="text-sm opacity-75 mt-1 line-clamp-2">
                            {complaint.description.substring(0, 100)}
                            {complaint.description.length > 100 ? "..." : ""}
                          </div>
                        </td>
                        <td className="p-4">
                          <span
                            className="px-3 py-1 rounded-full text-sm"
                            style={{
                              backgroundColor: colors.categoryBg,
                              color: colors.categoryText,
                              fontWeight: "500",
                            }}
                          >
                            {complaint.category}
                          </span>
                        </td>
                        <td className="p-4">
                          <span
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium"
                            style={{
                              backgroundColor: `${getStatusColor(complaint.status)}20`,
                              color: getStatusColor(complaint.status),
                            }}
                          >
                            {getStatusIcon(complaint.status)}
                            <span>{complaint.status}</span>
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="text-sm">
                            {new Date(complaint.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                navigateToComplaintDetails(complaint._id)
                              }
                              className="px-3 py-1 rounded text-sm transition-all duration-300 hover:scale-105 hover:shadow-sm"
                              style={{
                                backgroundColor: colors.card,
                                border: `1px solid ${colors.border}`,
                              }}
                            >
                              View
                            </button>
                            {["CREATED", "ASSIGNED"].includes(
                              complaint.status,
                            ) && (
                              <button
                                onClick={() =>
                                  navigateToEditComplaint(complaint._id)
                                }
                                className="px-3 py-1 rounded text-sm transition-all duration-300 hover:scale-105 hover:shadow-sm"
                                style={{
                                  backgroundColor: colors.primary,
                                  color: "white",
                                }}
                              >
                                Edit
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
      <footer
        className="mt-12 py-6 px-4 border-t"
        style={{
          borderColor: colors.border,
          backgroundColor: colors.bg,
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center space-x-2">
                <img
                  src={currentLogo}
                  alt="CivicFix Logo"
                  className="h-16 w-20 object-contain mb-5"
                />
              </div>
              <p className="text-sm opacity-75 mt-1">
                Citizen Complaint Management System
              </p>
            </div>
            <div className="text-sm opacity-75">
              © {new Date().getFullYear()} All rights reserved
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CitizenDashboard;
