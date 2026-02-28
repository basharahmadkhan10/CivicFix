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
  Home,
  FileText,
  BarChart3,
  Settings,
} from "lucide-react";
import api from "../utils/api";
import Preloader from "../components/Preloader";

const CitizenDashboard = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const toast = useToast();
  const { logout } = useAuth();
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

  const getThemeColors = () => {
    const accentColor = "#97AB33";
    
    if (theme === "light") {
      return {
        bg: "#FFFFFF",
        text: "#1A202C",
        card: "#FFFFFF",
        cardHover: "#F7FAFC",
        border: "#E2E8F0",
        borderAccent: `2px solid ${accentColor}`,
        accent: accentColor,
        accentLight: "rgba(151, 171, 51, 0.1)",
        accentHover: "#8A9E2E",
        success: "#38A169",
        warning: "#F6AD55",
        danger: "#FC8181",
        info: "#4299E1",
        primary: accentColor,
        categoryBg: "#EDF2F7",
        categoryText: "#2D3748",
        muted: "#718096",
        shadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      };
    }
    return {
      bg: "#0A0A0A",
      text: "#FFFFFF",
      card: "#111111",
      cardHover: "#1A1A1A",
      border: "#2D3748",
      borderAccent: `2px solid ${accentColor}`,
      accent: accentColor,
      accentLight: "rgba(151, 171, 51, 0.15)",
      accentHover: "#A8C03E",
      success: "#68D391",
      warning: "#FBD38D",
      danger: "#FC8181",
      info: "#63B3ED",
      primary: accentColor,
      categoryBg: "#2D3748",
      categoryText: "#E2E8F0",
      muted: "#A0AEC0",
      shadow: "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)",
    };
  };

  const colors = getThemeColors();
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
      toast.success(`Welcome back, ${user.name}!`);
    }
  }, [user, pageLoaded]);

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
      toast.error("Failed to load dashboard data");
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.warning("Please enter a search query");
      return;
    }
    try {
      toast.info("Searching complaints...");
      const res = await api.get(`/v1/complaints/search?q=${encodeURIComponent(searchQuery)}`);
      setComplaints(res.data?.data || []);
      if (res.data?.data?.length === 0) {
        toast.warning("No complaints found matching your search");
      } else {
        toast.success(`Found ${res.data?.data?.length} complaint(s)`);
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Search failed. Please try again.");
    }
  };

  const handleFilter = async (status) => {
    setSelectedStatusFilter(status);
    try {
      toast.info(`Filtering ${status === "ALL" ? "all" : status.toLowerCase()} complaints...`);
      if (status === "ALL") {
        await fetchDashboardData();
        toast.success("Showing all complaints");
        return;
      }
      const res = await api.get(`/v1/complaints/filter?status=${status}`);
      setComplaints(res.data?.data || []);
      if (res.data?.data?.length === 0) {
        toast.warning(`No ${status.toLowerCase()} complaints found`);
      } else {
        toast.success(`Showing ${res.data?.data?.length} ${status.toLowerCase()} complaint(s)`);
      }
    } catch (error) {
      console.error("Filter error:", error);
      toast.error("Filter failed. Please try again.");
    }
  };

  const handleRefresh = () => {
    toast.info("Refreshing data...");
    fetchDashboardData();
    refreshUserData();
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully!");
    navigate("/login");
  };

  const navigateToNewComplaint = () => {
    toast.info("Opening new complaint form...");
    navigate("/complaints/new");
  };

  const navigateToComplaintDetails = (id) => {
    toast.info("Loading complaint details...");
    navigate(`/complaints/${id}`);
  };

  const navigateToEditComplaint = (id) => {
    toast.info("Opening edit page...");
    navigate(`/complaints/${id}/edit`);
  };

  const navigateToProfile = () => {
    toast.info("Loading profile...");
    navigate("/profile");
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "CREATED": return colors.info;
      case "ASSIGNED": return colors.warning;
      case "IN_PROGRESS": return colors.accent;
      case "RESOLVED": return colors.success;
      case "REJECTED":
      case "WITHDRAWN": return colors.danger;
      default: return colors.muted;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "CREATED": return <AlertCircle size={16} />;
      case "ASSIGNED": return <Clock size={16} />;
      case "IN_PROGRESS": return <Clock size={16} />;
      case "RESOLVED": return <CheckCircle size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  if (loading || !pageLoaded) {
    return <Preloader />;
  }

  const StatCard = ({ title, value, color, icon, subtitle }) => (
    <div
      className="p-4 sm:p-6 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer"
      onClick={() => {
        if (title === "Resolved" && value > 0) handleFilter("RESOLVED");
        else if (title === "In Progress" && value > 0) handleFilter("IN_PROGRESS");
        else if (title === "Assigned" && value > 0) handleFilter("ASSIGNED");
      }}
      style={{
        backgroundColor: colors.card,
        border: `1px solid ${color}30`,
        boxShadow: colors.shadow,
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
        <p className="text-xs sm:text-sm mt-1" style={{ color: colors.muted }}>
          {subtitle}
        </p>
      )}
    </div>
  );

  return (
    <div
      className="min-h-screen"
      style={{ 
        backgroundColor: colors.bg, 
        color: colors.text,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        * { font-family: 'Inter', sans-serif; }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slideDown { animation: slideDown 0.3s ease-out; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Clean Header - No border on nav */}
      <header
        className="sticky top-0 z-50 px-3 sm:px-4 md:px-6 py-2 sm:py-3"
        style={{
          backgroundColor: colors.bg,
          backdropFilter: "blur(10px)",
        }}
      >
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div
            onClick={() => navigate("/dashboard")}
            style={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <img
              src={currentLogo}
              alt="CivicFix"
              style={{ height: "32px", width: "auto", objectFit: "contain" }}
            />
            <span style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "20px",
              fontWeight: "700",
              letterSpacing: "-0.5px",
              color: colors.text,
            }}>
              CIVIC
              <span style={{ color: colors.accent }}>FIX</span>
            </span>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={(e) => { e.stopPropagation(); setMobileMenuOpen(!mobileMenuOpen); }}
            className="md:hidden p-2 rounded-lg"
            style={{
              backgroundColor: colors.card,
            }}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Desktop Actions - No borders */}
          <div className="hidden md:flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="px-3 py-2 rounded-lg transition-all duration-200 hover:bg-opacity-80"
              style={{
                backgroundColor: colors.cardHover,
                color: colors.text,
              }}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>

            <button
              onClick={handleRefresh}
              className="p-2 rounded-lg transition-all duration-200 hover:bg-opacity-80"
              style={{
                backgroundColor: colors.cardHover,
              }}
            >
              <RefreshCw size={18} />
            </button>

            <button
              onClick={navigateToNewComplaint}
              className="px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-all duration-200 hover:opacity-90"
              style={{
                backgroundColor: colors.accent,
                color: theme === "dark" ? "#000" : "#FFF",
              }}
            >
              <Plus size={18} />
              <span className="hidden lg:inline">New Complaint</span>
              <span className="lg:hidden">New</span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                className="flex items-center space-x-2 p-1.5 rounded-lg"
                onClick={(e) => { e.stopPropagation(); setProfileDropdownOpen(!profileDropdownOpen); }}
                style={{
                  backgroundColor: colors.cardHover,
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden"
                  style={{ backgroundColor: colors.accent }}
                >
                  {user?.profileImage ? (
                    <img src={getProfileImageUrl(user.profileImage)} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span style={{ color: theme === "dark" ? "#000" : "#FFF" }}>
                      {getUserInitials(user?.name)}
                    </span>
                  )}
                </div>
                <span className="font-medium hidden lg:inline">{user?.name?.split(" ")[0] || "User"}</span>
              </button>

              {profileDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 rounded-lg py-2 z-50"
                  style={{
                    backgroundColor: colors.card,
                    border: `1px solid ${colors.border}`,
                    boxShadow: colors.shadow,
                  }}
                >
                  <button 
                    onClick={navigateToProfile} 
                    className="flex items-center space-x-2 w-full px-4 py-3 hover:bg-opacity-80 text-left transition-colors"
                    style={{ color: colors.text }}
                  >
                    <User size={16} />
                    <span>Profile</span>
                  </button>
                  <button 
                    onClick={handleLogout} 
                    className="flex items-center space-x-2 w-full px-4 py-3 hover:bg-opacity-80 text-left transition-colors"
                    style={{ color: colors.danger }}
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
              boxShadow: colors.shadow,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col space-y-2">
              <button 
                onClick={() => { toggleTheme(); setMobileMenuOpen(false); }}
                className="w-full text-left py-3 px-4 rounded-lg"
                style={{ backgroundColor: colors.cardHover }}
              >
                <span style={{ color: colors.text }}>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
              </button>
              <button 
                onClick={() => { handleRefresh(); setMobileMenuOpen(false); }}
                className="w-full text-left py-3 px-4 rounded-lg"
                style={{ backgroundColor: colors.cardHover }}
              >
                <span style={{ color: colors.text }}>🔄 Refresh</span>
              </button>
              <button 
                onClick={() => { navigateToNewComplaint(); setMobileMenuOpen(false); }}
                className="w-full text-left py-3 px-4 rounded-lg"
                style={{ backgroundColor: colors.accent, color: theme === "dark" ? "#000" : "#FFF" }}
              >
                <span>➕ New Complaint</span>
              </button>
              <button 
                onClick={navigateToProfile}
                className="w-full text-left py-3 px-4 rounded-lg"
                style={{ backgroundColor: colors.cardHover }}
              >
                <span style={{ color: colors.text }}>👤 Profile</span>
              </button>
              <button 
                onClick={handleLogout}
                className="w-full text-left py-3 px-4 rounded-lg"
                style={{ backgroundColor: colors.cardHover, color: colors.danger }}
              >
                <span>🚪 Logout</span>
              </button>
            </div>
          </div>
        )}

        {/* Tabs - Clean with accent color for active */}
        <div className="flex mt-4 space-x-1">
          {["overview", "my-complaints"].map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setMobileMenuOpen(false); }}
              className="flex-1 py-2.5 text-sm font-medium rounded-lg transition-all"
              style={{
                backgroundColor: activeTab === tab ? colors.accent : "transparent",
                color: activeTab === tab ? (theme === "dark" ? "#000" : "#FFF") : colors.muted,
              }}
            >
              {tab === "overview" ? "Overview" : "My Complaints"}
            </button>
          ))}
        </div>
      </header>

      <main className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
        {activeTab === "overview" && (
          <>
            {/* Welcome Section */}
            <div className="mb-6 sm:mb-8 mt-4">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2">
                Welcome Back{" "}
                <span className="block sm:inline" style={{ color: colors.accent }}>
                  {user?.name?.split(" ")[0] || "there"}
                </span>
              </h1>
              <p className="text-sm sm:text-base" style={{ color: colors.muted }}>
                Here's what's happening with your complaints today.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6 sm:mb-8">
              <StatCard title="Total" value={stats.total} color={colors.info} icon={<AlertCircle size={20} />} />
              <StatCard title="Created" value={stats.created} color={colors.info} icon={<AlertCircle size={20} />} />
              <StatCard title="Assigned" value={stats.assigned} color={colors.warning} icon={<Clock size={20} />} />
              <StatCard title="In Progress" value={stats.inProgress} color={colors.accent} icon={<Clock size={20} />} />
              <StatCard title="Resolved" value={stats.resolved} color={colors.success} icon={<CheckCircle size={20} />} subtitle={`${stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%`} />
            </div>

            {/* Quick Actions - Clean cards with subtle borders */}
            <div className="grid grid-cols-2 gap-3 mb-6 sm:mb-8">
              <button 
                onClick={navigateToNewComplaint}
                className="p-4 rounded-lg text-left transition-all duration-200 hover:scale-[1.02]"
                style={{ 
                  backgroundColor: colors.card, 
                  border: `1px solid ${colors.border}`,
                }}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${colors.accent}20` }}>
                    <Plus size={16} style={{ color: colors.accent }} />
                  </div>
                  <div className="font-medium text-sm" style={{ color: colors.text }}>Report New Issue</div>
                </div>
                <p className="text-xs" style={{ color: colors.muted }}>File a new complaint</p>
              </button>

              <button 
                onClick={() => handleFilter("RESOLVED")}
                className="p-4 rounded-lg text-left transition-all duration-200 hover:scale-[1.02]"
                style={{ 
                  backgroundColor: colors.card, 
                  border: `1px solid ${colors.border}`,
                }}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${colors.success}20` }}>
                    <CheckCircle size={16} style={{ color: colors.success }} />
                  </div>
                  <div className="font-medium text-sm" style={{ color: colors.text }}>Resolved</div>
                </div>
                <p className="text-xs" style={{ color: colors.muted }}>View resolved</p>
              </button>

              <button 
                onClick={() => handleFilter("IN_PROGRESS")}
                className="p-4 rounded-lg text-left transition-all duration-200 hover:scale-[1.02]"
                style={{ 
                  backgroundColor: colors.card, 
                  border: `1px solid ${colors.border}`,
                }}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${colors.warning}20` }}>
                    <Clock size={16} style={{ color: colors.warning }} />
                  </div>
                  <div className="font-medium text-sm" style={{ color: colors.text }}>In Progress</div>
                </div>
                <p className="text-xs" style={{ color: colors.muted }}>Track ongoing</p>
              </button>

              <button 
                onClick={handleRefresh}
                className="p-4 rounded-lg text-left transition-all duration-200 hover:scale-[1.02]"
                style={{ 
                  backgroundColor: colors.card, 
                  border: `1px solid ${colors.border}`,
                }}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${colors.info}20` }}>
                    <RefreshCw size={16} style={{ color: colors.info }} />
                  </div>
                  <div className="font-medium text-sm" style={{ color: colors.text }}>Refresh</div>
                </div>
                <p className="text-xs" style={{ color: colors.muted }}>Update data</p>
              </button>
            </div>

            {/* Recent Complaints */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg sm:text-xl font-bold" style={{ color: colors.text }}>Recent Complaints</h2>
                <button onClick={() => setActiveTab("my-complaints")} className="text-sm" style={{ color: colors.accent }}>
                  View All →
                </button>
              </div>

              {complaints.length === 0 ? (
                <div className="text-center py-8 rounded-lg" style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
                  <AlertCircle size={40} className="mx-auto mb-4" style={{ color: colors.muted }} />
                  <h3 className="text-base sm:text-lg font-bold mb-2" style={{ color: colors.text }}>No complaints yet</h3>
                  <p className="text-sm mb-4" style={{ color: colors.muted }}>Start by creating your first complaint!</p>
                  <button 
                    onClick={navigateToNewComplaint} 
                    className="px-6 py-3 rounded-lg font-medium text-sm"
                    style={{ backgroundColor: colors.accent, color: theme === "dark" ? "#000" : "#FFF" }}
                  >
                    Create First Complaint
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {complaints.slice(0, 5).map((complaint) => (
                    <div 
                      key={complaint._id} 
                      className="p-4 rounded-lg transition-all duration-200 hover:shadow-md"
                      style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span 
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                              style={{ backgroundColor: `${getStatusColor(complaint.status)}20`, color: getStatusColor(complaint.status) }}
                            >
                              {getStatusIcon(complaint.status)} {complaint.status}
                            </span>
                            <span className="text-xs" style={{ color: colors.muted }}>
                              {new Date(complaint.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <h3 className="font-bold text-base sm:text-lg mb-1" style={{ color: colors.text }}>{complaint.title}</h3>
                          <p className="text-xs sm:text-sm line-clamp-2" style={{ color: colors.muted }}>{complaint.description}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="text-xs flex items-center" style={{ color: colors.muted }}>
                              <MapPin size={12} className="mr-1" /> {complaint.area}
                            </span>
                            <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: colors.categoryBg, color: colors.categoryText }}>
                              {complaint.category}
                            </span>
                          </div>
                        </div>
                        <button 
                          onClick={() => navigateToComplaintDetails(complaint._id)}
                          className="w-full sm:w-auto px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 text-sm"
                          style={{ backgroundColor: colors.accent, color: theme === "dark" ? "#000" : "#FFF" }}
                        >
                          <Eye size={14} /> View
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
            {/* Search and Filter */}
            <div className="flex flex-col gap-3 mb-4">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold" style={{ color: colors.text }}>My Complaints</h1>
              <div className="flex flex-col gap-3">
                {/* Search Bar */}
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" size={16} style={{ color: colors.muted }} />
                  <input 
                    type="text" 
                    placeholder="Search complaints..." 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    className="w-full pl-9 pr-10 py-3 text-sm rounded-lg focus:outline-none focus:ring-1"
                    style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}`, color: colors.text }} 
                  />
                  <button 
                    onClick={handleSearch} 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <Search size={14} style={{ color: colors.muted }} />
                  </button>
                </div>

                {/* Filter Buttons */}
                <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                  <button 
                    onClick={() => handleFilter("ALL")} 
                    className="px-3 py-2 rounded-lg text-xs whitespace-nowrap transition-all flex-shrink-0"
                    style={{ 
                      backgroundColor: selectedStatusFilter === "ALL" ? colors.accent : colors.cardHover, 
                      color: selectedStatusFilter === "ALL" ? (theme === "dark" ? "#000" : "#FFF") : colors.text, 
                    }}
                  >
                    <Filter size={12} className="inline mr-1" /> All
                  </button>
                  {["CREATED", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "REJECTED"].map((status) => (
                    <button 
                      key={status} 
                      onClick={() => handleFilter(status)} 
                      className="px-3 py-2 rounded-lg text-xs whitespace-nowrap transition-all flex-shrink-0"
                      style={{ 
                        backgroundColor: selectedStatusFilter === status ? getStatusColor(status) : colors.cardHover, 
                        color: selectedStatusFilter === status ? "#FFF" : colors.text, 
                      }}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Complaints List */}
            {complaints.length === 0 ? (
              <div className="text-center py-8 sm:py-12 rounded-lg" style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
                <AlertCircle size={40} className="mx-auto mb-4" style={{ color: colors.muted }} />
                <h3 className="text-base sm:text-lg font-bold mb-2" style={{ color: colors.text }}>No complaints found</h3>
                <p className="text-sm mb-4" style={{ color: colors.muted }}>
                  {searchQuery ? "No complaints match your search criteria." : "You haven't created any complaints yet."}
                </p>
                {!searchQuery && (
                  <button 
                    onClick={navigateToNewComplaint} 
                    className="px-6 py-3 rounded-lg font-medium text-sm"
                    style={{ backgroundColor: colors.accent, color: theme === "dark" ? "#000" : "#FFF" }}
                  >
                    Create Your First Complaint
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {complaints.map((complaint) => (
                  <div 
                    key={complaint._id} 
                    className="p-4 rounded-lg transition-all duration-200 hover:shadow-md"
                    style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span 
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                          style={{ backgroundColor: `${getStatusColor(complaint.status)}20`, color: getStatusColor(complaint.status) }}
                        >
                          {getStatusIcon(complaint.status)} {complaint.status}
                        </span>
                        <span className="text-xs" style={{ color: colors.muted }}>{new Date(complaint.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h3 className="font-bold text-sm sm:text-base" style={{ color: colors.text }}>{complaint.title}</h3>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: colors.categoryBg, color: colors.categoryText }}>
                          {complaint.category}
                        </span>
                        <span className="text-xs flex items-center" style={{ color: colors.muted }}>
                          <MapPin size={10} className="mr-1" /> {complaint.area}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-1">
                        <button 
                          onClick={() => navigateToComplaintDetails(complaint._id)} 
                          className="flex-1 px-3 py-2 rounded text-xs font-medium"
                          style={{ backgroundColor: colors.accent, color: theme === "dark" ? "#000" : "#FFF" }}
                        >
                          View Details
                        </button>
                        {["CREATED", "ASSIGNED"].includes(complaint.status) && (
                          <button 
                            onClick={() => navigateToEditComplaint(complaint._id)} 
                            className="flex-1 px-3 py-2 rounded text-xs font-medium"
                            style={{ backgroundColor: colors.cardHover, color: colors.text }}
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

      {/* Clean Footer - No border */}
      <footer className="mt-8 py-6 px-3 sm:px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-xs" style={{ color: colors.muted }}>
            © {new Date().getFullYear()} CivicFix. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default CitizenDashboard;
