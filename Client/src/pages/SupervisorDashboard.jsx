import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import lightLogo from "../assets/images/img01.png";
import darkLogo from "../assets/images/img02.png";
import {
  Plus,
  Camera,
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  Bell,
  User,
  MapPin,
  Filter,
  Shield,
  Calendar,
  Users,
  MessageSquare,
  Eye,
  RefreshCw,
  LogOut,
  Upload,
  UserPlus,
  FileText,
  Target,
  Award,
  BarChart3,
  CheckSquare,
  XCircle,
  Edit,
  Send,
  Download,
  ChevronRight,
  Activity,
  Zap,
  Star,
  MoreVertical,
  Loader,
  AlertOctagon,
  Menu,
  X,
} from "lucide-react";
import api from "../utils/api";

const SupervisorDashboard = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [complaints, setComplaints] = useState([]);
  const [pendingVerification, setPendingVerification] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [stats, setStats] = useState({
    totalAssigned: 0,
    pendingReview: 0,
    inProgress: 0,
    resolved: 0,
    assigned: 0,
    created: 0,
    rejected: 0,
  });
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Modal states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [assignOfficer, setAssignOfficer] = useState("");
  const [updateData, setUpdateData] = useState({
    status: "",
    remarks: "",
    image: null,
    imagePreview: null,
  });
  const [verifyData, setVerifyData] = useState({
    action: "verify",
    remarks: "",
  });

  const [officers, setOfficers] = useState([]);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");

  // Supervisor theme colors - Blue theme
  const colors =
    theme === "light"
      ? {
        bg: "#FFFFFF",
        text: "#1A202C",
        card: "#FFFFFF",
        cardHover: "#F7FAFC",
        border: "#E2E8F0",
        accent: "#97AB33",
        accentLight: "rgba(151, 171, 51, 0.1)",
        accentHover: "#8A9E2E",
        success: "#38A169",
        warning: "#F6AD55",
        danger: "#FC8181",
        info: "#4299E1",
        primary: "#97AB33",
        categoryBg: "#EDF2F7",
        categoryText: "#2D3748",
        muted: "#718096",
        shadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        }
      : {
      bg: "#0A0A0A",
      text: "#FFFFFF",
      card: "#111111",
      cardHover: "#1A1A1A",
      border: "#2D3748",
      accent: "#97AB33",
      accentLight: "rgba(151, 171, 51, 0.15)",
      accentHover: "#A8C03E",
      success: "#68D391",
      warning: "#FBD38D",
      danger: "#FC8181",
      info: "#63B3ED",
      primary: "#97AB33",
      categoryBg: "#2D3748",
      categoryText: "#E2E8F0",
      muted: "#A0AEC0",
      shadow: "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)",
        };

  const currentLogo = theme === "dark" ? darkLogo : lightLogo;

  const getUserInitials = (name) => {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
  };

  useEffect(() => {
    fetchDashboardData();
    fetchUserProfile();
    fetchOfficers();
    fetchPendingVerification();
  }, []);

  useEffect(() => {
    filterComplaints();
  }, [searchQuery, selectedStatusFilter, complaints]);

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
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const statsRes = await api.get("/v1/supervisor/dashboard");
      setStats(statsRes.data?.data || {});

      const complaintsRes = await api.get("/v1/supervisor/complaints");
      setComplaints(complaintsRes.data?.data || []);

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

  const fetchPendingVerification = async () => {
    try {
      const response = await api.get(
        "/v1/supervisor/complaints/pending-verification",
      );
      setPendingVerification(response.data?.data || []);
    } catch (error) {
      console.error("Error fetching pending verification:", error);
    }
  };

  const fetchOfficers = async () => {
    try {
      const response = await api.get("/v1/supervisor/officers");
      setOfficers(response.data?.data || []);
    } catch (error) {
      console.error("Error fetching officers:", error);
      setOfficers([
        {
          _id: "1",
          name: "Officer John Doe",
          email: "john@example.com",
          department: "Field Operations",
        },
        {
          _id: "2",
          name: "Officer Jane Smith",
          email: "jane@example.com",
          department: "Traffic Control",
        },
        {
          _id: "3",
          name: "Officer Mike Johnson",
          email: "mike@example.com",
          department: "Public Works",
        },
      ]);
    }
  };

  const filterComplaints = () => {
    let filtered = [...complaints];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (complaint) =>
          complaint.title?.toLowerCase().includes(query) ||
          complaint.description?.toLowerCase().includes(query) ||
          complaint.area?.toLowerCase().includes(query) ||
          complaint.category?.toLowerCase().includes(query),
      );
    }

    if (selectedStatusFilter !== "ALL") {
      filtered = filtered.filter(
        (complaint) => complaint.status === selectedStatusFilter,
      );
    }

    setFilteredComplaints(filtered);
  };

  const handleSearch = (e) => {
    if (e.key === "Enter") {
      filterComplaints();
      toast.info("Search completed", {
        position: "top-right",
        duration: 2000,
      });
    }
  };

  const handleFilter = (status) => {
    setSelectedStatusFilter(status);
    toast.info(`Filtered by ${status === "ALL" ? "all" : status}`, {
      position: "top-right",
      duration: 2000,
    });
  };

  const handleRefresh = () => {
    toast.info("Refreshing dashboard data...", {
      position: "top-right",
      duration: 2000,
    });
    fetchDashboardData();
    fetchPendingVerification();
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

  const navigateToProfile = () => {
    toast.info("Loading profile...", {
      position: "top-right",
      duration: 1500,
    });
    navigate("/profile");
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  const openAssignModal = (complaint) => {
    setSelectedComplaint(complaint);
    setAssignOfficer("");
    setShowAssignModal(true);
  };

  const openUpdateModal = (complaint) => {
    setSelectedComplaint(complaint);
    setUpdateData({
      status: complaint.status,
      remarks: complaint.remarks || "",
      image: null,
      imagePreview: null,
    });
    setShowUpdateModal(true);
  };

  const openVerifyModal = (complaint) => {
    setSelectedComplaint(complaint);
    setVerifyData({
      action: "verify",
      remarks: "",
    });
    setShowVerifyModal(true);
  };

  const openDetailsModal = (complaint) => {
    setSelectedComplaint(complaint);
    setShowDetailsModal(true);
  };

  const handleAssignSubmit = async () => {
    if (!assignOfficer) {
      toast.error("Please select an officer", {
        position: "top-right",
        duration: 3000,
      });
      return;
    }

    try {
      setUpdating(true);

      toast.info("Assigning complaint...", {
        position: "top-right",
        duration: 2000,
      });

      const response = await api.patch(
        `/v1/supervisor/complaints/${selectedComplaint._id}/assign`,
        { officerId: assignOfficer },
      );

      if (response.data.success) {
        toast.success("Complaint assigned successfully!", {
          position: "top-right",
          duration: 4000,
        });
        setShowAssignModal(false);
        fetchDashboardData();
      }
    } catch (error) {
      console.error("Error assigning complaint:", error);
      toast.error(
        `Failed to assign complaint: ${error.response?.data?.message || error.message}`,
        {
          position: "top-right",
          duration: 5000,
        },
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateSubmit = async () => {
    if (!updateData.status) {
      toast.error("Please select a status", {
        position: "top-right",
        duration: 3000,
      });
      return;
    }

    try {
      setUpdating(true);

      toast.info("Updating complaint...", {
        position: "top-right",
        duration: 2000,
      });

      const formData = new FormData();
      formData.append("status", updateData.status);
      formData.append("remarks", updateData.remarks);
      if (updateData.image) {
        formData.append("image", updateData.image);
      }

      const response = await api.patch(
        `/v1/supervisor/complaints/${selectedComplaint._id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (response.data.success) {
        toast.success("Complaint updated successfully!", {
          position: "top-right",
          duration: 4000,
        });
        setShowUpdateModal(false);
        fetchDashboardData();
        fetchPendingVerification();
      }
    } catch (error) {
      console.error("Error updating complaint:", error);
      toast.error(
        `Failed to update complaint: ${error.response?.data?.message || error.message}`,
        {
          position: "top-right",
          duration: 5000,
        },
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleVerifySubmit = async () => {
    try {
      setUpdating(true);

      if (verifyData.action === "reject" && !verifyData.remarks.trim()) {
        toast.error("Please provide a reason for rejection", {
          position: "top-right",
          duration: 3000,
        });
        setUpdating(false);
        return;
      }

      toast.info(
        `${verifyData.action === "verify" ? "Verifying" : "Rejecting"} complaint...`,
        {
          position: "top-right",
          duration: 2000,
        },
      );

      const endpoint = verifyData.action === "verify" ? "verify" : "reject";
      const response = await api.patch(
        `/v1/supervisor/complaints/${selectedComplaint._id}/${endpoint}`,
        { remarks: verifyData.remarks },
      );

      if (response.data.success) {
        toast.success(
          `Complaint ${
            verifyData.action === "verify" ? "verified" : "rejected"
          } successfully!`,
          {
            position: "top-right",
            duration: 4000,
          },
        );
        setShowVerifyModal(false);
        fetchDashboardData();
        fetchPendingVerification();
      }
    } catch (error) {
      console.error("Error verifying complaint:", error);
      toast.error(
        `Failed to process complaint: ${error.response?.data?.message || error.message}`,
        {
          position: "top-right",
          duration: 5000,
        },
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB", {
          position: "top-right",
          duration: 3000,
        });
        e.target.value = "";
        return;
      }

      setUpdateData((prev) => ({
        ...prev,
        image: file,
        imagePreview: URL.createObjectURL(file),
      }));
      toast.info("Image selected", {
        position: "top-right",
        duration: 2000,
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "CREATED": return colors.info;
      case "ASSIGNED": return colors.warning;
      case "IN_PROGRESS": return colors.primary;
      case "PENDING_VERIFICATION": return colors.pending;
      case "RESOLVED": return colors.success;
      case "REJECTED":
      case "WITHDRAWN": return colors.danger;
      default: return "#6b7280";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "CREATED": return <AlertCircle size={14} />;
      case "ASSIGNED": return <Clock size={14} />;
      case "IN_PROGRESS": return <Target size={14} />;
      case "PENDING_VERIFICATION": return <AlertOctagon size={14} />;
      case "RESOLVED": return <CheckCircle size={14} />;
      case "REJECTED": return <XCircle size={14} />;
      default: return <AlertCircle size={14} />;
    }
  };

  const statusOptions = [
    { value: "ASSIGNED", label: "Assigned", color: colors.warning },
    { value: "IN_PROGRESS", label: "In Progress", color: colors.primary },
    {
      value: "PENDING_VERIFICATION",
      label: "Pending Verification",
      color: colors.pending,
    },
    { value: "RESOLVED", label: "Resolved", color: colors.success },
    { value: "REJECTED", label: "Rejected", color: colors.danger },
  ];

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
      <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1" style={{ color: colors.text }}>
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

  if (loading && !user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: colors.bg, color: colors.text }}
      >
        <div className="text-center">
          <Loader
            className="animate-spin w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4"
            style={{ color: colors.primary }}
          />
          <p className="text-sm sm:text-base">Loading Supervisor Dashboard...</p>
        </div>
      </div>
    );
  }

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
          <div
            onClick={() => navigate("/dashboard")}
            style={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
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
              className="flex items-center gap-1 lg:gap-2 px-2 lg:px-3 py-1.5 lg:py-2 rounded-xl border transition-colors duration-200"
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
              onClick={handleRefresh}
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
              <button className="p-1.5 lg:p-2 relative">
                <Bell size={16} className="lg:w-[18px] lg:h-[18px]" />
                {pendingVerification.length > 0 && (
                  <span
                    className="absolute top-0 right-0 w-2 h-2 rounded-full"
                    style={{ backgroundColor: colors.pending }}
                  />
                )}
              </button>
            </div>

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
                    backgroundColor: colors.primary,
                    color: "white",
                  }}
                >
                  <span>{getUserInitials(user?.name)}</span>
                </div>
                <span className="font-medium text-xs lg:text-sm hidden lg:inline">
                  {user?.name || "Supervisor"}
                </span>
              </button>

              {profileDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-36 lg:w-44 rounded-xl py-1 lg:py-2 z-50"
                  style={{
                    backgroundColor: colors.card,
                    border: `1px solid ${colors.border}`,
                    boxShadow: `0 10px 25px rgba(0, 0, 0, 0.2)`,
                  }}
                >
                  <button
                    onClick={navigateToProfile}
                    className="flex items-center space-x-2 w-full px-3 lg:px-4 py-2 hover:bg-opacity-80 text-left text-xs lg:text-sm"
                    style={{ backgroundColor: `${colors.border}10` }}
                  >
                    <User size={14} className="lg:w-4 lg:h-4" />
                    <span>Profile</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 w-full px-3 lg:px-4 py-2 hover:bg-opacity-80 text-left text-xs lg:text-sm"
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
                  handleRefresh();
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
          {["overview", "assigned", "pending", "officers"].map((tab) => (
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
              className="flex-1 min-w-16 py-2 text-xs sm:text-sm font-medium relative group"
              style={{
                color: activeTab === tab ? colors.primary : colors.text,
                opacity: activeTab === tab ? 1 : 0.7,
              }}
            >
              {tab === "overview" && "Overview"}
              {tab === "assigned" && "Assigned"}
              {tab === "pending" && "Pending"}
              {tab === "officers" && "Officers"}
              {tab === "pending" && pendingVerification.length > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-2xs flex items-center justify-center"
                  style={{ backgroundColor: colors.pending, color: "white" }}
                >
                  {pendingVerification.length}
                </span>
              )}
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
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <>
            <div className="mb-4 sm:mb-6 md:mb-8">
              <h1
                className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-1"
                style={{ color: colors.primary }}
              >
                Welcome, {user?.name?.split(" ")[0] || "Supervisor"}
              </h1>
              <p className="text-xs sm:text-sm opacity-75">
                Monitor and manage assigned complaints efficiently
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 lg:gap-6 mb-6">
              <StatCard
                title="Total Assigned"
                value={stats.totalAssigned || 0}
                color={colors.info}
                icon={<FileText size={20} />}
                subtitle="Under supervision"
              />
              <StatCard
                title="Pending Review"
                value={stats.pendingReview || 0}
                color={colors.pending}
                icon={<AlertOctagon size={20} />}
                subtitle="Need verification"
              />
              <StatCard
                title="In Progress"
                value={stats.inProgress || 0}
                color={colors.primary}
                icon={<Target size={20} />}
                subtitle="Being handled"
              />
              <StatCard
                title="Resolved"
                value={stats.resolved || 0}
                color={colors.success}
                icon={<CheckCircle size={20} />}
                subtitle="Successfully closed"
              />
            </div>

            {/* Pending Verification Alert */}
            {pendingVerification.length > 0 && (
              <div
                className="mb-4 sm:mb-6 p-3 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                style={{
                  backgroundColor: `${colors.pending}20`,
                  border: `1px solid ${colors.pending}`,
                }}
              >
                <div className="flex items-center gap-2">
                  <AlertOctagon size={20} style={{ color: colors.pending }} />
                  <div>
                    <h3 className="font-bold text-sm">Pending Verification</h3>
                    <p className="text-xs opacity-75">
                      {pendingVerification.length} complaint(s) waiting
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("pending")}
                  className="w-full sm:w-auto px-3 py-2 rounded-lg font-medium text-xs"
                  style={{
                    backgroundColor: colors.pending,
                    color: "white",
                  }}
                >
                  Review Now
                </button>
              </div>
            )}

            {/* Quick Actions */}
            <div className="mb-6">
              <h2 className="text-base sm:text-lg font-bold mb-3">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => setActiveTab("assigned")}
                  className="p-4 rounded-xl text-left transition-all duration-300 hover:scale-[1.02]"
                  style={{
                    backgroundColor: colors.card,
                    border: `1px solid ${colors.border}`,
                    borderLeft: `4px solid ${colors.primary}`,
                  }}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <div
                      className="p-1.5 rounded-lg"
                      style={{ backgroundColor: `${colors.primary}20` }}
                    >
                      <Eye size={16} style={{ color: colors.primary }} />
                    </div>
                    <div className="font-medium text-sm">Review</div>
                  </div>
                  <p className="text-xs opacity-75">View assigned complaints</p>
                </button>

                <button
                  onClick={() => setActiveTab("pending")}
                  className="p-4 rounded-xl text-left transition-all duration-300 hover:scale-[1.02]"
                  style={{
                    backgroundColor: colors.card,
                    border: `1px solid ${colors.border}`,
                    borderLeft: `4px solid ${colors.primary}`,
                  }}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <div
                      className="p-1.5 rounded-lg"
                      style={{ backgroundColor: `${colors.primary}20` }}
                    >
                      <AlertOctagon size={16} style={{ color: colors.primary }} />
                    </div>
                    <div className="font-medium text-sm">Verify</div>
                  </div>
                  <p className="text-xs opacity-75">
                    {pendingVerification.length} pending
                  </p>
                </button>

                <button
                  onClick={() => setActiveTab("officers")}
                  className="p-4 rounded-xl text-left transition-all duration-300 hover:scale-[1.02]"
                  style={{
                    backgroundColor: colors.card,
                    border: `1px solid ${colors.border}`,
                    borderLeft: `4px solid ${colors.primary}`,
                  }}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <div
                      className="p-1.5 rounded-lg"
                      style={{ backgroundColor: `${colors.primary}20` }}
                    >
                      <UserPlus size={16} style={{ color: colors.primary }} />
                    </div>
                    <div className="font-medium text-sm">Officers</div>
                  </div>
                  <p className="text-xs opacity-75">Manage field officers</p>
                </button>
              </div>
            </div>

            {/* Recent Assigned Complaints */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-base sm:text-lg font-bold">Recent Assigned</h2>
                <button
                  onClick={() => setActiveTab("assigned")}
                  className="text-xs opacity-75 hover:opacity-100"
                  style={{ color: colors.primary }}
                >
                  View All →
                </button>
              </div>

              {loading ? (
                <div className="text-center py-6 opacity-75">
                  <Loader className="animate-spin w-5 h-5 mx-auto mb-2" />
                  <p className="text-xs">Loading complaints...</p>
                </div>
              ) : complaints.length === 0 ? (
                <div className="text-center py-6 opacity-75">
                  <p className="text-xs">No complaints assigned yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {complaints.slice(0, 5).map((complaint) => (
                    <div
                      key={complaint._id}
                      className="p-3 rounded-xl"
                      style={{
                        backgroundColor: colors.card,
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-2xs font-medium"
                            style={{
                              backgroundColor: `${getStatusColor(complaint.status)}20`,
                              color: getStatusColor(complaint.status),
                            }}
                          >
                            {getStatusIcon(complaint.status)}
                            <span>{complaint.status}</span>
                          </span>
                          <span className="text-2xs opacity-75">
                            {new Date(complaint.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="font-bold text-sm">{complaint.title}</h3>
                        <p className="text-xs opacity-75 line-clamp-2">
                          {complaint.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-2xs">
                          <span className="flex items-center">
                            <MapPin size={10} className="mr-1" />
                            {complaint.area}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800">
                            {complaint.category}
                          </span>
                        </div>
                        <div className="flex gap-2 mt-1">
                          {complaint.status === "PENDING_VERIFICATION" && (
                            <button
                              onClick={() => openVerifyModal(complaint)}
                              className="flex-1 px-3 py-1.5 rounded-lg font-medium text-xs"
                              style={{
                                backgroundColor: colors.pending,
                                color: "white",
                              }}
                            >
                              Verify
                            </button>
                          )}
                          <button
                            onClick={() => openUpdateModal(complaint)}
                            className="flex-1 px-3 py-1.5 rounded-lg font-medium text-xs"
                            style={{
                              backgroundColor: colors.card,
                              border: `1px solid ${colors.border}`,
                            }}
                          >
                            Update
                          </button>
                          {!complaint.assignedToOfficer && (
                            <button
                              onClick={() => openAssignModal(complaint)}
                              className="flex-1 px-3 py-1.5 rounded-lg font-medium text-xs"
                              style={{
                                backgroundColor: colors.primary,
                                color: "white",
                              }}
                            >
                              Assign
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Assigned Complaints Tab */}
        {activeTab === "assigned" && (
          <div>
            <div className="flex flex-col gap-3 mb-4">
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold mb-1">
                  Assigned Complaints
                </h1>
                <p className="text-xs opacity-75">
                  Manage all complaints assigned to you
                </p>
              </div>

              <div className="flex flex-col gap-3">
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
                    onKeyPress={handleSearch}
                    className="w-full pl-8 pr-4 py-2 text-xs rounded-lg"
                    style={{
                      backgroundColor: colors.card,
                      border: `1px solid ${colors.border}`,
                      color: colors.text,
                    }}
                  />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                  <button
                    onClick={() => handleFilter("ALL")}
                    className="px-2 py-1.5 rounded-lg text-2xs whitespace-nowrap flex-shrink-0"
                    style={{
                      backgroundColor: selectedStatusFilter === "ALL" ? colors.primary : colors.card,
                      color: selectedStatusFilter === "ALL" ? "white" : colors.text,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    All
                  </button>
                  {["CREATED", "ASSIGNED", "IN_PROGRESS", "PENDING_VERIFICATION", "RESOLVED", "REJECTED"].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleFilter(status)}
                      className="px-2 py-1.5 rounded-lg text-2xs whitespace-nowrap flex-shrink-0"
                      style={{
                        backgroundColor: selectedStatusFilter === status ? getStatusColor(status) : colors.card,
                        color: selectedStatusFilter === status ? "white" : colors.text,
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      {status.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8 opacity-75">
                <Loader className="animate-spin w-6 h-6 mx-auto mb-2" />
                <p className="text-xs">Loading complaints...</p>
              </div>
            ) : filteredComplaints.length === 0 ? (
              <div className="text-center py-8">
                <FileText size={32} className="mx-auto mb-2 opacity-50" />
                <h3 className="text-sm font-bold mb-1">No complaints found</h3>
                <p className="text-xs opacity-75">
                  {searchQuery || selectedStatusFilter !== "ALL"
                    ? "Try changing your search or filter"
                    : "No complaints assigned yet"}
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
                    <div className="flex flex-col gap-2">
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
                          {new Date(complaint.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="font-bold text-sm">{complaint.title}</h3>
                      
                      <p className="text-xs opacity-75 line-clamp-2">
                        {complaint.description?.substring(0, 100)}
                        {complaint.description?.length > 100 ? "..." : ""}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 text-2xs">
                        <span className="flex items-center">
                          <MapPin size={10} className="mr-1" />
                          {complaint.area}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800">
                          {complaint.category}
                        </span>
                      </div>

                      <div className="flex gap-2 mt-1">
                        {complaint.status === "PENDING_VERIFICATION" && (
                          <button
                            onClick={() => openVerifyModal(complaint)}
                            className="flex-1 px-2 py-1.5 rounded text-2xs font-medium"
                            style={{
                              backgroundColor: colors.pending,
                              color: "white",
                            }}
                          >
                            Verify
                          </button>
                        )}
                        <button
                          onClick={() => openUpdateModal(complaint)}
                          className="flex-1 px-2 py-1.5 rounded text-2xs font-medium"
                          style={{
                            backgroundColor: colors.card,
                            border: `1px solid ${colors.border}`,
                          }}
                        >
                          Update
                        </button>
                        {!complaint.assignedToOfficer && (
                          <button
                            onClick={() => openAssignModal(complaint)}
                            className="flex-1 px-2 py-1.5 rounded text-2xs font-medium"
                            style={{
                              backgroundColor: colors.primary,
                              color: "white",
                            }}
                          >
                            Assign
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

        {/* Pending Verification Tab */}
        {activeTab === "pending" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold mb-1">
                  Pending Verification
                </h1>
                <p className="text-xs opacity-75">
                  Review complaints submitted by officers
                </p>
              </div>
              <button
                onClick={fetchPendingVerification}
                className="p-2 rounded-lg"
                style={{
                  backgroundColor: colors.card,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <RefreshCw size={14} />
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8 opacity-75">
                <Loader className="animate-spin w-6 h-6 mx-auto mb-2" />
                <p className="text-xs">Loading...</p>
              </div>
            ) : pendingVerification.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle size={32} className="mx-auto mb-2 opacity-50" />
                <h3 className="text-sm font-bold mb-1">All Caught Up!</h3>
                <p className="text-xs opacity-75">
                  No complaints pending verification
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingVerification.map((complaint) => (
                  <div
                    key={complaint._id}
                    className="p-3 rounded-lg"
                    style={{
                      backgroundColor: colors.card,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-2xs font-medium"
                          style={{
                            backgroundColor: `${colors.pending}20`,
                            color: colors.pending,
                          }}
                        >
                          <AlertOctagon size={12} />
                          PENDING
                        </span>
                      </div>

                      <h3 className="font-bold text-sm">{complaint.title}</h3>
                      
                      <p className="text-xs opacity-75 line-clamp-2">
                        {complaint.description}
                      </p>

                      {/* Image Preview */}
                      <div className="flex gap-2">
                        {complaint.images?.citizen?.length > 0 && (
                          <div className="flex-1">
                            <img
                              src={complaint.images.citizen[0]}
                              alt="Citizen"
                              className="w-full h-20 object-cover rounded-lg"
                              onError={(e) => {
                                e.target.src = "https://via.placeholder.com/100?text=No+Image";
                              }}
                            />
                          </div>
                        )}
                        {complaint.images?.officer && (
                          <div className="flex-1">
                            <img
                              src={complaint.images.officer}
                              alt="Officer"
                              className="w-full h-20 object-cover rounded-lg"
                              onError={(e) => {
                                e.target.src = "https://via.placeholder.com/100?text=No+Image";
                              }}
                            />
                          </div>
                        )}
                      </div>

                      {complaint.remarks && (
                        <div
                          className="p-2 rounded-lg text-xs"
                          style={{ backgroundColor: `${colors.border}20` }}
                        >
                          <span className="font-medium">Officer's Remarks:</span>
                          <p className="text-xs opacity-75 mt-1">{complaint.remarks}</p>
                        </div>
                      )}

                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => openVerifyModal(complaint)}
                          className="flex-1 px-3 py-2 rounded-lg font-medium text-xs"
                          style={{
                            backgroundColor: colors.primary,
                            color: "white",
                          }}
                        >
                          Review & Verify
                        </button>
                        <button
                          onClick={() => openDetailsModal(complaint)}
                          className="px-3 py-2 rounded-lg font-medium text-xs"
                          style={{
                            backgroundColor: colors.card,
                            border: `1px solid ${colors.border}`,
                          }}
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Officers Tab */}
        {activeTab === "officers" && (
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold mb-4">
              Field Officers
            </h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {officers.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <UserPlus size={32} className="mx-auto mb-2 opacity-50" />
                  <h3 className="text-sm font-bold mb-1">No officers found</h3>
                  <p className="text-xs opacity-75">
                    There are no field officers available.
                  </p>
                </div>
              ) : (
                officers.map((officer) => (
                  <div
                    key={officer._id}
                    className="p-3 rounded-lg"
                    style={{
                      backgroundColor: colors.card,
                      border: `1px solid ${colors.border}`,
                      borderLeft: `4px solid ${colors.primary}`,
                    }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: colors.primary,
                          color: "white",
                        }}
                      >
                        <User size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-sm truncate">{officer.name}</h3>
                        <p className="text-xs opacity-75 truncate">{officer.email}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="opacity-75">Dept:</span>
                        <span className="ml-1 font-medium">
                          {officer.department || "Field Ops"}
                        </span>
                      </div>
                      <div>
                        <span className="opacity-75">Status:</span>
                        <span className="ml-1 font-medium text-green-600">Active</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modals - Mobile Optimized */}
      {showAssignModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-xl p-4 max-w-md w-full"
            style={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
            }}
          >
            <h3 className="text-base font-bold mb-3">Assign to Officer</h3>
            <div className="mb-3">
              <p className="text-xs opacity-75 line-clamp-2">
                {selectedComplaint.title}
              </p>
            </div>

            <select
              value={assignOfficer}
              onChange={(e) => setAssignOfficer(e.target.value)}
              className="w-full p-2.5 text-sm rounded-lg mb-4"
              style={{
                backgroundColor: colors.bg,
                border: `1px solid ${colors.border}`,
                color: colors.text,
              }}
            >
              <option value="">Select officer</option>
              {officers.map((officer) => (
                <option key={officer._id} value={officer._id}>
                  {officer.name}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <button
                onClick={() => setShowAssignModal(false)}
                className="flex-1 p-2.5 rounded-lg font-medium text-sm"
                style={{
                  backgroundColor: colors.card,
                  border: `1px solid ${colors.border}`,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAssignSubmit}
                disabled={updating || !assignOfficer}
                className="flex-1 p-2.5 rounded-lg font-medium text-sm text-white disabled:opacity-50"
                style={{ backgroundColor: colors.primary }}
              >
                {updating ? "..." : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showUpdateModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-xl p-4 max-w-md w-full max-h-[90vh] overflow-y-auto"
            style={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
            }}
          >
            <h3 className="text-base font-bold mb-3">Update Complaint</h3>
            <div className="space-y-3">
              <select
                value={updateData.status}
                onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })}
                className="w-full p-2.5 text-sm rounded-lg"
                style={{
                  backgroundColor: colors.bg,
                  border: `1px solid ${colors.border}`,
                  color: colors.text,
                }}
              >
                <option value="">Select status</option>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <textarea
                value={updateData.remarks}
                onChange={(e) => setUpdateData({ ...updateData, remarks: e.target.value })}
                placeholder="Remarks..."
                rows="2"
                className="w-full p-2.5 text-sm rounded-lg"
                style={{
                  backgroundColor: colors.bg,
                  border: `1px solid ${colors.border}`,
                  color: colors.text,
                }}
              />

              <div>
                <label className="block mb-2 text-xs">Image (Optional)</label>
                <div
                  className="border-2 border-dashed rounded-lg p-3 text-center cursor-pointer"
                  style={{ borderColor: colors.border }}
                  onClick={() => document.getElementById("update-image").click()}
                >
                  <input
                    type="file"
                    id="update-image"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <Upload className="mx-auto mb-1" size={20} />
                  <p className="text-xs">Click to upload</p>
                </div>
                {updateData.imagePreview && (
                  <img
                    src={updateData.imagePreview}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded-lg mt-2"
                  />
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowUpdateModal(false)}
                className="flex-1 p-2.5 rounded-lg font-medium text-sm"
                style={{
                  backgroundColor: colors.card,
                  border: `1px solid ${colors.border}`,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateSubmit}
                disabled={updating || !updateData.status}
                className="flex-1 p-2.5 rounded-lg font-medium text-sm text-white disabled:opacity-50"
                style={{ backgroundColor: colors.primary }}
              >
                {updating ? "..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showVerifyModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-xl p-4 max-w-md w-full max-h-[90vh] overflow-y-auto"
            style={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
            }}
          >
            <h3 className="text-base font-bold mb-3">Verify Complaint</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {selectedComplaint.images?.citizen?.length > 0 && (
                  <img
                    src={selectedComplaint.images.citizen[0]}
                    alt="Original"
                    className="w-full h-20 object-cover rounded-lg"
                  />
                )}
                {selectedComplaint.images?.officer && (
                  <img
                    src={selectedComplaint.images.officer}
                    alt="Resolution"
                    className="w-full h-20 object-cover rounded-lg"
                  />
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setVerifyData({ ...verifyData, action: "verify" })}
                  className="flex-1 p-2 rounded-lg text-xs font-medium"
                  style={{
                    backgroundColor: verifyData.action === "verify" ? colors.success : colors.card,
                    color: verifyData.action === "verify" ? "white" : colors.text,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  Verify
                </button>
                <button
                  onClick={() => setVerifyData({ ...verifyData, action: "reject" })}
                  className="flex-1 p-2 rounded-lg text-xs font-medium"
                  style={{
                    backgroundColor: verifyData.action === "reject" ? colors.danger : colors.card,
                    color: verifyData.action === "reject" ? "white" : colors.text,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  Reject
                </button>
              </div>

              <textarea
                value={verifyData.remarks}
                onChange={(e) => setVerifyData({ ...verifyData, remarks: e.target.value })}
                placeholder={verifyData.action === "verify" ? "Verification notes..." : "Rejection reason..."}
                rows="2"
                className="w-full p-2.5 text-sm rounded-lg"
                style={{
                  backgroundColor: colors.bg,
                  border: `1px solid ${colors.border}`,
                  color: colors.text,
                }}
              />
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowVerifyModal(false)}
                className="flex-1 p-2.5 rounded-lg font-medium text-sm"
                style={{
                  backgroundColor: colors.card,
                  border: `1px solid ${colors.border}`,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleVerifySubmit}
                disabled={updating || (verifyData.action === "reject" && !verifyData.remarks.trim())}
                className="flex-1 p-2.5 rounded-lg font-medium text-sm text-white disabled:opacity-50"
                style={{
                  backgroundColor: verifyData.action === "verify" ? colors.success : colors.danger,
                }}
              >
                {updating ? "..." : verifyData.action === "verify" ? "Verify" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetailsModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-xl p-4 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            style={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
            }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold">Complaint Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-1 rounded-lg"
                style={{ backgroundColor: `${colors.border}20` }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <span
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-2xs"
                style={{
                  backgroundColor: `${getStatusColor(selectedComplaint.status)}20`,
                  color: getStatusColor(selectedComplaint.status),
                }}
              >
                {getStatusIcon(selectedComplaint.status)}
                {selectedComplaint.status}
              </span>

              <h4 className="font-bold text-base">{selectedComplaint.title}</h4>
              <p className="text-sm opacity-90">{selectedComplaint.description}</p>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="opacity-75">Category:</span>
                  <p className="font-medium">{selectedComplaint.category}</p>
                </div>
                <div>
                  <span className="opacity-75">Area:</span>
                  <p className="font-medium">{selectedComplaint.area}</p>
                </div>
                <div>
                  <span className="opacity-75">Reported By:</span>
                  <p className="font-medium">{selectedComplaint.user?.name || "Anonymous"}</p>
                </div>
                <div>
                  <span className="opacity-75">Officer:</span>
                  <p className="font-medium">{selectedComplaint.assignedToOfficer?.name || "Not assigned"}</p>
                </div>
              </div>

              {selectedComplaint.images?.citizen?.length > 0 && (
                <div>
                  <p className="text-xs font-medium mb-2">Images:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedComplaint.images.citizen.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt={`Image ${i + 1}`}
                        className="w-full h-16 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer
        className="mt-8 py-4 px-3 border-t"
        style={{
          borderColor: colors.border,
          backgroundColor: colors.bg,
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <div
            onClick={() => navigate("/dashboard")}
            style={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
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

export default SupervisorDashboard;


