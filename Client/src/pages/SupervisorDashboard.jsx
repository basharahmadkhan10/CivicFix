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
  TrendingUp,
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
          bg: "#ffffff",
          text: "#000000",
          card: "#e6f0ff", // Light blue tint
          border: "#b8d4ff", // Light blue border
          accent: "#000000",
          success: "#10b981",
          warning: "#f59e0b",
          danger: "#ef4444",
          info: "#3b82f6", // Blue for info
          primary: "#3b82f6", // Blue primary
          pending: "#f97316", // Orange for pending
          supervisor: "#3b82f6", // Blue for supervisor theme
        }
      : {
          bg: "#000000",
          text: "#ffffff",
          card: "#0a1a2f", // Dark blue tint
          border: "#1e3a8a", // Dark blue border
          accent: "#ffffff",
          success: "#10b981",
          warning: "#f59e0b",
          danger: "#ef4444",
          info: "#60a5fa", // Light blue for info
          primary: "#3b82f6", // Blue primary
          pending: "#f97316", // Orange for pending
          supervisor: "#3b82f6", // Blue for supervisor theme
        };

  // Theme toggle button style
  const themeToggleStyle = {
    backgroundColor: theme === "dark" ? "#0a0a0a" : "#f5f5f5",
    borderColor: theme === "dark" ? "#1a1a1a" : "#e5e5e5",
    color: theme === "dark" ? "#ffffff" : "#000000",
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
      // Simple validation (you can implement proper validation if needed)
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
      case "CREATED":
        return colors.info;
      case "ASSIGNED":
        return colors.warning;
      case "IN_PROGRESS":
        return colors.primary;
      case "PENDING_VERIFICATION":
        return colors.pending;
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
        return <Target size={16} />;
      case "PENDING_VERIFICATION":
        return <AlertOctagon size={16} />;
      case "RESOLVED":
        return <CheckCircle size={16} />;
      case "REJECTED":
        return <XCircle size={16} />;
      default:
        return <AlertCircle size={16} />;
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
      className="p-6 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
      style={{
        backgroundColor: colors.card,
        border: `1px solid ${colors.border}`,
      }}
    >
      <div className="flex justify-between items-start mb-4">
        <div
          className="p-3 rounded-lg"
          style={{ backgroundColor: `${color}20` }}
        >
          <div style={{ color }}>{icon}</div>
        </div>
      </div>
      <h3 className="text-3xl font-bold mb-2" style={{ color: colors.text }}>
        {value}
      </h3>
      <p className="font-medium text-lg" style={{ color: colors.text }}>
        {title}
      </p>
      {subtitle && (
        <p className="text-sm mt-2 opacity-75" style={{ color: colors.text }}>
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
            className="animate-spin w-12 h-12 mx-auto mb-4"
            style={{ color: colors.primary }}
          />
          <p>Loading Supervisor Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-50 border-b px-6 py-4"
        style={{
          backgroundColor: colors.bg,
          borderColor: colors.border,
          backdropFilter: "blur(10px)",
        }}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <img
              src={currentLogo}
              alt="CivicFix Logo"
              className="h-14 w-auto object-contain"
            />
            <div>
              <h1
                className="text-xl font-bold"
                style={{ color: colors.primary }}
              >
                Supervisor Dashboard
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors duration-200"
              style={themeToggleStyle}
            >
              {theme === "dark" ? (
                <>
                  <svg
                    className="w-5 h-5"
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
                  <span className="text-sm font-medium">Light</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
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
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>

            <div className="relative">
              <button className="p-2">
                <Bell size={20} />
                {pendingVerification.length > 0 && (
                  <span
                    className="absolute top-1 right-1 w-2 h-2 rounded-full"
                    style={{ backgroundColor: colors.pending }}
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
                    backgroundColor: colors.primary,
                    color: "white",
                  }}
                >
                  <span>{getUserInitials(user?.name)}</span>
                </div>
                <span className="font-medium hidden md:inline">
                  {user?.name || "Supervisor"}
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

        {/* Tabs */}
        <div className="flex mt-4 overflow-x-auto">
          {[
            "overview",
            "assigned-complaints",
            "pending-verification",
            "officers",
          ].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                toast.info(`Switched to ${tab.replace("-", " ")} tab`, {
                  position: "top-right",
                  duration: 2000,
                });
              }}
              className="flex-1 min-w-28 py-3 text-sm font-medium relative group"
              style={{
                color: activeTab === tab ? colors.primary : colors.text,
                opacity: activeTab === tab ? 1 : 0.7,
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1).replace("-", " ")}
              {tab === "pending-verification" &&
                pendingVerification.length > 0 && (
                  <span
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center"
                    style={{ backgroundColor: colors.pending, color: "white" }}
                  >
                    {pendingVerification.length}
                  </span>
                )}
              {activeTab === tab && (
                <div
                  className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full transition-all duration-300"
                  style={{ backgroundColor: colors.primary }}
                />
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 md:p-6">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <>
            <div className="mb-8">
              <h1
                className="text-2xl md:text-3xl font-bold mb-2"
                style={{ color: colors.primary }}
              >
                Welcome, Supervisor {user?.name?.split(" ")[0] || ""}
              </h1>
              <p className="opacity-75">
                Monitor and manage assigned complaints efficiently
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total Assigned"
                value={stats.totalAssigned || 0}
                color={colors.info}
                icon={<FileText size={28} />}
                subtitle="Complaints under supervision"
              />
              <StatCard
                title="Pending Review"
                value={stats.pendingReview || 0}
                color={colors.pending}
                icon={<AlertOctagon size={28} />}
                subtitle="Need verification"
              />
              <StatCard
                title="In Progress"
                value={stats.inProgress || 0}
                color={colors.primary}
                icon={<Target size={28} />}
                subtitle="Being handled"
              />
              <StatCard
                title="Resolved"
                value={stats.resolved || 0}
                color={colors.success}
                icon={<CheckCircle size={28} />}
                subtitle="Successfully closed"
              />
            </div>

            {/* Pending Verification Alert */}
            {pendingVerification.length > 0 && (
              <div
                className="mb-8 p-4 rounded-lg flex items-center justify-between"
                style={{
                  backgroundColor: `${colors.pending}20`,
                  border: `1px solid ${colors.pending}`,
                }}
              >
                <div className="flex items-center gap-3">
                  <AlertOctagon size={24} style={{ color: colors.pending }} />
                  <div>
                    <h3 className="font-bold">Pending Verification Required</h3>
                    <p className="text-sm opacity-75">
                      You have {pendingVerification.length} complaint
                      {pendingVerification.length > 1 ? "s" : ""} waiting for
                      your review.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("pending-verification")}
                  className="px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105"
                  style={{
                    backgroundColor: colors.pending,
                    color: "white",
                  }}
                >
                  Review Now
                </button>
              </div>
            )}

            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button
                  onClick={() => setActiveTab("assigned-complaints")}
                  className="p-6 rounded-xl text-left transition-all duration-300 hover:scale-[1.02]"
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
                      <Eye size={20} style={{ color: colors.primary }} />
                    </div>
                    <div className="font-medium">Review Complaints</div>
                  </div>
                  <p className="text-sm opacity-75">
                    View all assigned complaints
                  </p>
                </button>

                <button
                  onClick={() => setActiveTab("pending-verification")}
                  className="p-6 rounded-xl text-left transition-all duration-300 hover:scale-[1.02]"
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
                      <AlertOctagon
                        size={20}
                        style={{ color: colors.primary }}
                      />
                    </div>
                    <div className="font-medium">Verify Complaints</div>
                  </div>
                  <p className="text-sm opacity-75">
                    Review pending submissions ({pendingVerification.length})
                  </p>
                </button>

                <button
                  onClick={() => setActiveTab("officers")}
                  className="p-6 rounded-xl text-left transition-all duration-300 hover:scale-[1.02]"
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
                      <UserPlus size={20} style={{ color: colors.primary }} />
                    </div>
                    <div className="font-medium">Manage Officers</div>
                  </div>
                  <p className="text-sm opacity-75">
                    Assign and monitor officers
                  </p>
                </button>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  Recent Assigned Complaints
                </h2>
                <button
                  onClick={() => setActiveTab("assigned-complaints")}
                  className="text-sm opacity-75 hover:opacity-100"
                  style={{ color: colors.primary }}
                >
                  View All →
                </button>
              </div>

              {loading ? (
                <div className="text-center py-8 opacity-75">
                  <Loader
                    className="animate-spin w-6 h-6 mx-auto mb-2"
                    style={{ color: colors.primary }}
                  />
                  Loading complaints...
                </div>
              ) : complaints.length === 0 ? (
                <div className="text-center py-8 opacity-75">
                  No complaints assigned yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {complaints.slice(0, 5).map((complaint) => (
                    <div
                      key={complaint._id}
                      className="p-4 rounded-xl transition-all duration-300 hover:scale-[1.01]"
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
                            <span className="text-sm px-2 py-1 rounded bg-gray-100 dark:bg-gray-800">
                              {complaint.category}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {complaint.status === "PENDING_VERIFICATION" && (
                            <button
                              onClick={() => openVerifyModal(complaint)}
                              className="px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all duration-300 hover:scale-105"
                              style={{
                                backgroundColor: colors.pending,
                                color: "white",
                              }}
                            >
                              <CheckCircle size={16} />
                              Verify
                            </button>
                          )}
                          <button
                            onClick={() => openUpdateModal(complaint)}
                            className="px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all duration-300 hover:scale-105"
                            style={{
                              backgroundColor: colors.card,
                              border: `1px solid ${colors.border}`,
                            }}
                          >
                            <Edit size={16} />
                            Update
                          </button>
                          {!complaint.assignedToOfficer && (
                            <button
                              onClick={() => openAssignModal(complaint)}
                              className="px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all duration-300 hover:scale-105"
                              style={{
                                backgroundColor: colors.primary,
                                color: "white",
                              }}
                            >
                              <Send size={16} />
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
        {activeTab === "assigned-complaints" && (
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h1
                  className="text-2xl md:text-3xl font-bold mb-2"
                  style={{ color: colors.primary }}
                >
                  Assigned Complaints
                </h1>
                <p className="opacity-75">
                  Manage and monitor all complaints assigned to you
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2"
                    size={18}
                    style={{ color: colors.text, opacity: 0.5 }}
                  />
                  <input
                    type="text"
                    placeholder="Search complaints..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleSearch}
                    className="pl-10 pr-4 py-2 rounded-lg w-full"
                    style={{
                      backgroundColor: colors.card,
                      border: `1px solid ${colors.border}`,
                      color: colors.text,
                    }}
                  />
                </div>

                <div className="flex gap-2 overflow-x-auto">
                  <button
                    onClick={() => handleFilter("ALL")}
                    className="px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all duration-300 "
                    style={{
                      backgroundColor:
                        selectedStatusFilter === "ALL"
                          ? colors.primary
                          : colors.card,
                      color:
                        selectedStatusFilter === "ALL" ? "white" : colors.text,
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
                    "PENDING_VERIFICATION",
                    "RESOLVED",
                    "REJECTED",
                  ].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleFilter(status)}
                      className="px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all duration-300 "
                      style={{
                        backgroundColor:
                          selectedStatusFilter === status
                            ? getStatusColor(status)
                            : colors.card,
                        color:
                          selectedStatusFilter === status
                            ? "white"
                            : colors.text,
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
              <div className="text-center py-12 opacity-75">
                <Loader
                  className="animate-spin w-8 h-8 mx-auto mb-4"
                  style={{ color: colors.primary }}
                />
                Loading complaints...
              </div>
            ) : filteredComplaints.length === 0 ? (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <FileText size={48} className="mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-bold mb-2">
                    {searchQuery || selectedStatusFilter !== "ALL"
                      ? "No complaints match your criteria"
                      : "No complaints assigned"}
                  </h3>
                  <p className="opacity-75 mb-6">
                    {searchQuery || selectedStatusFilter !== "ALL"
                      ? "Try changing your search or filter criteria."
                      : "You don't have any complaints assigned to you yet."}
                  </p>
                </div>
              </div>
            ) : (
              <div
                className="overflow-x-auto rounded-xl"
                style={{ border: `1px solid ${colors.border}` }}
              >
                <table className="w-full">
                  <thead>
                    <tr style={{ backgroundColor: colors.card }}>
                      <th className="text-left p-4 font-medium">Title</th>
                      <th className="text-left p-4 font-medium">Category</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Date</th>
                      <th className="text-left p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredComplaints.map((complaint) => (
                      <tr
                        key={complaint._id}
                        style={{
                          borderBottom: `1px solid ${colors.border}`,
                          backgroundColor: colors.bg,
                        }}
                        className="hover:bg-opacity-50 transition-colors"
                      >
                        <td className="p-4">
                          <div className="font-medium">{complaint.title}</div>
                          <div className="text-sm opacity-75 mt-1 line-clamp-2">
                            {complaint.description?.substring(0, 100)}
                            {complaint.description?.length > 100 ? "..." : ""}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <MapPin size={12} />
                            <span className="text-xs opacity-75">
                              {complaint.area}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="px-3 py-1 rounded-full text-sm bg-gray-100 dark:bg-gray-800">
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
                            <span>{complaint.status.replace("_", " ")}</span>
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="text-sm">
                            {new Date(complaint.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            {complaint.status === "PENDING_VERIFICATION" && (
                              <button
                                onClick={() => openVerifyModal(complaint)}
                                className="px-3 py-1 rounded text-sm transition-all duration-300 hover:scale-105"
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
                              className="px-3 py-1 rounded text-sm transition-all duration-300 hover:scale-105"
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
                                className="px-3 py-1 rounded text-sm transition-all duration-300 hover:scale-105"
                                style={{
                                  backgroundColor: colors.primary,
                                  color: "white",
                                }}
                              >
                                Assign
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

        {/* Pending Verification Tab */}
        {activeTab === "pending-verification" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1
                  className="text-2xl md:text-3xl font-bold mb-2"
                  style={{ color: colors.primary }}
                >
                  Pending Verification
                </h1>
                <p className="opacity-75">
                  Review and verify complaints submitted by officers
                </p>
              </div>
              <button
                onClick={fetchPendingVerification}
                className="p-3 rounded-xl transition-all duration-300 hover:scale-110"
                style={{
                  backgroundColor: colors.card,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <RefreshCw size={18} />
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12 opacity-75">
                <Loader
                  className="animate-spin w-8 h-8 mx-auto mb-4"
                  style={{ color: colors.primary }}
                />
                Loading pending complaints...
              </div>
            ) : pendingVerification.length === 0 ? (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <CheckCircle size={48} className="mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-bold mb-2">All Caught Up!</h3>
                  <p className="opacity-75">
                    No complaints pending verification at the moment.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {pendingVerification.map((complaint) => (
                  <div
                    key={complaint._id}
                    className="p-6 rounded-xl"
                    style={{
                      backgroundColor: colors.card,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <div className="flex flex-col lg:flex-row gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <span
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium"
                            style={{
                              backgroundColor: `${colors.pending}20`,
                              color: colors.pending,
                            }}
                          >
                            <AlertOctagon size={16} />
                            <span>PENDING VERIFICATION</span>
                          </span>
                          <span className="text-sm opacity-75">
                            {new Date(complaint.updatedAt).toLocaleDateString()}
                          </span>
                        </div>

                        <h3 className="text-xl font-bold mb-3">
                          {complaint.title}
                        </h3>

                        <p className="opacity-90 mb-4">
                          {complaint.description}
                        </p>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm opacity-75">Category</p>
                            <p className="font-medium">{complaint.category}</p>
                          </div>
                          <div>
                            <p className="text-sm opacity-75">Area</p>
                            <p className="font-medium">{complaint.area}</p>
                          </div>
                          <div>
                            <p className="text-sm opacity-75">Reported By</p>
                            <p className="font-medium">
                              {complaint.user?.name || "Anonymous"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm opacity-75">
                              Assigned Officer
                            </p>
                            <p className="font-medium">
                              {complaint.assignedToOfficer?.name ||
                                "Not assigned"}
                            </p>
                          </div>
                        </div>

                        {/* Image Preview Section */}
                        <div className="flex gap-3 mb-4">
                          {complaint.images?.citizen?.length > 0 && (
                            <div className="flex-1">
                              <p className="text-sm font-medium mb-2">
                                Citizen Image:
                              </p>
                              <img
                                src={complaint.images.citizen[0]}
                                alt="Citizen"
                                className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-90"
                                onClick={() => openDetailsModal(complaint)}
                                onError={(e) => {
                                  e.target.src =
                                    "https://via.placeholder.com/150?text=No+Image";
                                }}
                              />
                            </div>
                          )}
                          {complaint.images?.officer && (
                            <div className="flex-1">
                              <p className="text-sm font-medium mb-2">
                                Officer Image:
                              </p>
                              <img
                                src={complaint.images.officer}
                                alt="Officer"
                                className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-90"
                                onClick={() => openDetailsModal(complaint)}
                                onError={(e) => {
                                  e.target.src =
                                    "https://via.placeholder.com/150?text=No+Image";
                                }}
                              />
                            </div>
                          )}
                        </div>

                        {complaint.remarks && (
                          <div
                            className="p-3 rounded-lg"
                            style={{ backgroundColor: `${colors.border}20` }}
                          >
                            <p className="text-sm font-medium mb-1">
                              Officer's Remarks:
                            </p>
                            <p className="text-sm opacity-75">
                              {complaint.remarks}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="lg:w-80 space-y-3">
                        <button
                          onClick={() => openVerifyModal(complaint)}
                          className="w-full px-6 py-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-300 hover:scale-105"
                          style={{
                            backgroundColor: colors.primary,
                            color: "white",
                          }}
                        >
                          <CheckCircle size={20} />
                          Review & Verify
                        </button>

                        <button
                          onClick={() => openDetailsModal(complaint)}
                          className="w-full px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-300 hover:scale-105"
                          style={{
                            backgroundColor: colors.card,
                            border: `1px solid ${colors.border}`,
                            color: colors.text,
                          }}
                        >
                          <Eye size={18} />
                          View Full Details
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
            <h1
              className="text-2xl md:text-3xl font-bold mb-6"
              style={{ color: colors.primary }}
            >
              Field Officers
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {officers.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <UserPlus size={48} className="mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-bold mb-2">No officers found</h3>
                  <p className="opacity-75">
                    There are no field officers available.
                  </p>
                </div>
              ) : (
                officers.map((officer) => (
                  <div
                    key={officer._id}
                    className="p-6 rounded-xl transition-all duration-300 hover:scale-[1.02]"
                    style={{
                      backgroundColor: colors.card,
                      border: `1px solid ${colors.border}`,
                      borderLeft: `4px solid ${colors.primary}`,
                    }}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: colors.primary,
                          color: "white",
                        }}
                      >
                        <User size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{officer.name}</h3>
                        <p className="text-sm opacity-75">{officer.email}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="opacity-75">Department:</span>
                        <span className="font-medium">
                          {officer.department || "Field Operations"}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="opacity-75">Role:</span>
                        <span className="font-medium">Field Officer</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="opacity-75">Status:</span>
                        <span className="font-medium text-green-600">
                          Active
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* Assign Complaint Modal */}
      {showAssignModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
            style={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
            }}
          >
            <h3 className="text-xl font-bold mb-4">Assign Complaint</h3>
            <div className="mb-4">
              <p className="font-medium mb-2">
                Complaint: {selectedComplaint.title}
              </p>
              <p className="text-sm opacity-75">
                {selectedComplaint.description?.substring(0, 100)}...
              </p>
            </div>

            <div className="mb-6">
              <label className="block mb-2 font-medium">Select Officer</label>
              <select
                value={assignOfficer}
                onChange={(e) => setAssignOfficer(e.target.value)}
                className="w-full p-3 rounded-lg"
                style={{
                  backgroundColor: colors.bg,
                  border: `1px solid ${colors.border}`,
                  color: colors.text,
                }}
              >
                <option value="">Select an officer</option>
                {officers.map((officer) => (
                  <option key={officer._id} value={officer._id}>
                    {officer.name} - {officer.department || "Field Officer"}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAssignModal(false)}
                className="flex-1 p-3 rounded-lg font-medium transition-all duration-300 hover:scale-105"
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
                className="flex-1 p-3 rounded-lg font-medium text-white transition-all duration-300 hover:scale-105 disabled:opacity-50"
                style={{ backgroundColor: colors.primary }}
              >
                {updating ? (
                  <span className="flex items-center justify-center">
                    <Loader className="animate-spin w-4 h-4 mr-2" />
                    Assigning...
                  </span>
                ) : (
                  "Assign Complaint"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Complaint Modal */}
      {showUpdateModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
            style={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
            }}
          >
            <h3 className="text-xl font-bold mb-4">Update Complaint</h3>
            <div className="mb-4">
              <p className="font-medium mb-2">
                Complaint: {selectedComplaint.title}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-medium">Status</label>
                <select
                  value={updateData.status}
                  onChange={(e) =>
                    setUpdateData({ ...updateData, status: e.target.value })
                  }
                  className="w-full p-3 rounded-lg"
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
              </div>

              <div>
                <label className="block mb-2 font-medium">Remarks</label>
                <textarea
                  value={updateData.remarks}
                  onChange={(e) =>
                    setUpdateData({ ...updateData, remarks: e.target.value })
                  }
                  placeholder="Add remarks or notes..."
                  rows="3"
                  className="w-full p-3 rounded-lg"
                  style={{
                    backgroundColor: colors.bg,
                    border: `1px solid ${colors.border}`,
                    color: colors.text,
                  }}
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">
                  Upload Image (Optional)
                </label>
                <div
                  className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors hover:border-solid"
                  style={{ borderColor: colors.border }}
                  onClick={() =>
                    document.getElementById("image-upload").click()
                  }
                >
                  <input
                    type="file"
                    id="image-upload"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <Upload className="mx-auto mb-2" size={24} />
                  <p className="text-sm">Click to upload image</p>
                  <p className="text-xs opacity-75 mt-1">Supports JPG, PNG</p>
                </div>
                {updateData.imagePreview && (
                  <div className="mt-3">
                    <p className="text-sm mb-2">Preview:</p>
                    <img
                      src={updateData.imagePreview}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowUpdateModal(false)}
                className="flex-1 p-3 rounded-lg font-medium transition-all duration-300 hover:scale-105"
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
                className="flex-1 p-3 rounded-lg font-medium text-white transition-all duration-300 hover:scale-105 disabled:opacity-50"
                style={{ backgroundColor: colors.primary }}
              >
                {updating ? (
                  <span className="flex items-center justify-center">
                    <Loader className="animate-spin w-4 h-4 mr-2" />
                    Updating...
                  </span>
                ) : (
                  "Update Complaint"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verify Complaint Modal */}
      {showVerifyModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
            style={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
            }}
          >
            <h3 className="text-xl font-bold mb-4">Verify Complaint</h3>
            <div className="mb-4">
              <p className="font-medium mb-2">
                Complaint: {selectedComplaint.title}
              </p>
              <p className="text-sm opacity-75 mb-2">
                Reported by: {selectedComplaint.user?.name || "Anonymous"}
              </p>
              <p className="text-sm opacity-75">
                Handled by:{" "}
                {selectedComplaint.assignedToOfficer?.name || "Unknown Officer"}
              </p>
            </div>

            {/* Image Comparison */}
            <div className="mb-6">
              <h4
                className="font-medium mb-3"
                style={{ color: colors.primary }}
              >
                Image Comparison
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedComplaint.images?.citizen?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Original Image:</p>
                    <img
                      src={selectedComplaint.images.citizen[0]}
                      alt="Original"
                      className="w-full h-40 object-cover rounded-lg border-2"
                      style={{ borderColor: colors.info }}
                      onError={(e) => {
                        e.target.src =
                          "https://via.placeholder.com/200x150?text=Original";
                      }}
                    />
                  </div>
                )}
                {selectedComplaint.images?.officer && (
                  <div>
                    <p className="text-sm font-medium mb-2">
                      Resolution Image:
                    </p>
                    <img
                      src={selectedComplaint.images.officer}
                      alt="Resolution"
                      className="w-full h-40 object-cover rounded-lg border-2"
                      style={{ borderColor: colors.warning }}
                      onError={(e) => {
                        e.target.src =
                          "https://via.placeholder.com/200x150?text=Resolution";
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {selectedComplaint.remarks && (
              <div
                className="mb-4 p-3 rounded-lg"
                style={{ backgroundColor: `${colors.border}20` }}
              >
                <p className="text-sm font-medium mb-1">Officer's Remarks:</p>
                <p className="text-sm opacity-75">
                  {selectedComplaint.remarks}
                </p>
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <label className="block mb-2 font-medium">Decision</label>
                <div className="flex gap-3">
                  <button
                    onClick={() =>
                      setVerifyData({ ...verifyData, action: "verify" })
                    }
                    className="flex-1 p-3 rounded-lg font-medium transition-all duration-300"
                    style={{
                      backgroundColor:
                        verifyData.action === "verify"
                          ? colors.success
                          : colors.card,
                      color:
                        verifyData.action === "verify" ? "white" : colors.text,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <CheckCircle size={16} className="inline mr-1" />
                    Verify
                  </button>
                  <button
                    onClick={() =>
                      setVerifyData({ ...verifyData, action: "reject" })
                    }
                    className="flex-1 p-3 rounded-lg font-medium transition-all duration-300"
                    style={{
                      backgroundColor:
                        verifyData.action === "reject"
                          ? colors.danger
                          : colors.card,
                      color:
                        verifyData.action === "reject" ? "white" : colors.text,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <XCircle size={16} className="inline mr-1" />
                    Reject
                  </button>
                </div>
              </div>

              <div>
                <label className="block mb-2 font-medium">
                  {verifyData.action === "verify"
                    ? "Verification Remarks (Optional)"
                    : "Rejection Reason (Required)"}
                </label>
                <textarea
                  value={verifyData.remarks}
                  onChange={(e) =>
                    setVerifyData({ ...verifyData, remarks: e.target.value })
                  }
                  placeholder={
                    verifyData.action === "verify"
                      ? "Add any verification notes..."
                      : "Please provide reason for rejection..."
                  }
                  rows="3"
                  className="w-full p-3 rounded-lg"
                  style={{
                    backgroundColor: colors.bg,
                    border: `1px solid ${colors.border}`,
                    color: colors.text,
                  }}
                  required={verifyData.action === "reject"}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowVerifyModal(false)}
                className="flex-1 p-3 rounded-lg font-medium transition-all duration-300 hover:scale-105"
                style={{
                  backgroundColor: colors.card,
                  border: `1px solid ${colors.border}`,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleVerifySubmit}
                disabled={
                  updating ||
                  (verifyData.action === "reject" && !verifyData.remarks.trim())
                }
                className="flex-1 p-3 rounded-lg font-medium text-white transition-all duration-300 hover:scale-105 disabled:opacity-50"
                style={{
                  backgroundColor:
                    verifyData.action === "verify"
                      ? colors.success
                      : colors.danger,
                }}
              >
                {updating ? (
                  <span className="flex items-center justify-center">
                    <Loader className="animate-spin w-4 h-4 mr-2" />
                    Processing...
                  </span>
                ) : verifyData.action === "verify" ? (
                  "Verify & Resolve"
                ) : (
                  "Reject & Send Back"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            style={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
            }}
          >
            <div className="flex justify-between items-center mb-6">
              <h3
                className="text-2xl font-bold"
                style={{ color: colors.primary }}
              >
                Complaint Details
              </h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 rounded-lg hover:bg-opacity-50"
                style={{ backgroundColor: `${colors.border}20` }}
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Status Badge */}
              <div className="flex items-center gap-3">
                <span
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium"
                  style={{
                    backgroundColor: `${getStatusColor(selectedComplaint.status)}20`,
                    color: getStatusColor(selectedComplaint.status),
                  }}
                >
                  {getStatusIcon(selectedComplaint.status)}
                  <span>{selectedComplaint.status}</span>
                </span>
                <span className="text-sm opacity-75">
                  Created:{" "}
                  {new Date(selectedComplaint.createdAt).toLocaleString()}
                </span>
              </div>

              {/* Title and Description */}
              <div>
                <h4 className="text-xl font-bold mb-2">
                  {selectedComplaint.title}
                </h4>
                <p className="opacity-90">{selectedComplaint.description}</p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm opacity-75">Category</p>
                  <p className="font-medium">{selectedComplaint.category}</p>
                </div>
                <div>
                  <p className="text-sm opacity-75">Area</p>
                  <p className="font-medium">{selectedComplaint.area}</p>
                </div>
                <div>
                  <p className="text-sm opacity-75">Priority</p>
                  <p className="font-medium">
                    {selectedComplaint.priority || "Normal"}
                  </p>
                </div>
                <div>
                  <p className="text-sm opacity-75">Reported By</p>
                  <p className="font-medium">
                    {selectedComplaint.user?.name || "Anonymous"}
                  </p>
                </div>
                <div>
                  <p className="text-sm opacity-75">Assigned Officer</p>
                  <p className="font-medium">
                    {selectedComplaint.assignedToOfficer?.name ||
                      "Not assigned"}
                  </p>
                </div>
                <div>
                  <p className="text-sm opacity-75">Last Updated</p>
                  <p className="font-medium">
                    {new Date(selectedComplaint.updatedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Image Gallery */}
              <div>
                <h4 className="font-bold mb-4 text-lg">Image Gallery</h4>

                {/* Citizen Images */}
                {selectedComplaint.images?.citizen?.length > 0 && (
                  <div className="mb-6">
                    <p className="font-medium mb-3 flex items-center gap-2">
                      <Camera size={18} style={{ color: colors.info }} />
                      Citizen Uploaded Images
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {selectedComplaint.images.citizen.map((img, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={img}
                            alt={`Citizen ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg cursor-pointer"
                            onClick={() => window.open(img, "_blank")}
                            onError={(e) => {
                              e.target.src =
                                "https://via.placeholder.com/150?text=Image+Error";
                            }}
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                            <button
                              onClick={() => window.open(img, "_blank")}
                              className="text-white text-sm"
                            >
                              View Full Size
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Officer Images */}
                {selectedComplaint.images?.officer && (
                  <div className="mb-6">
                    <p className="font-medium mb-3 flex items-center gap-2">
                      <Camera size={18} style={{ color: colors.warning }} />
                      Officer Uploaded Images
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="relative group">
                        <img
                          src={selectedComplaint.images.officer}
                          alt="Officer"
                          className="w-full h-32 object-cover rounded-lg cursor-pointer"
                          onClick={() =>
                            window.open(
                              selectedComplaint.images.officer,
                              "_blank",
                            )
                          }
                          onError={(e) => {
                            e.target.src =
                              "https://via.placeholder.com/150?text=Image+Error";
                          }}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <button
                            onClick={() =>
                              window.open(
                                selectedComplaint.images.officer,
                                "_blank",
                              )
                            }
                            className="text-white text-sm"
                          >
                            View Full Size
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Remarks */}
              {selectedComplaint.remarks && (
                <div
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: `${colors.border}20` }}
                >
                  <p className="font-medium mb-2">Remarks:</p>
                  <p className="opacity-75">{selectedComplaint.remarks}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                {selectedComplaint.status === "PENDING_VERIFICATION" && (
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      openVerifyModal(selectedComplaint);
                    }}
                    className="flex-1 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105"
                    style={{
                      backgroundColor: colors.primary,
                      color: "white",
                    }}
                  >
                    Verify This Complaint
                  </button>
                )}
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="flex-1 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105"
                  style={{
                    backgroundColor: colors.card,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer
        className="mt-12 py-8 px-6 border-t"
        style={{
          borderColor: colors.border,
          backgroundColor: colors.bg,
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center space-x-3">
                <img
                  src={currentLogo}
                  alt="CivicFix Logo"
                  className="h-14 w-auto object-contain"
                />
                <span
                  className="font-bold text-lg"
                  style={{ color: colors.primary }}
                >
                  CivicFix Supervisor
                </span>
              </div>
              <p className="text-sm opacity-75 mt-2">
                Supervisor Complaint Management System
              </p>
            </div>
            <div className="text-sm opacity-75">
              © {new Date().getFullYear()} CivicFix. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SupervisorDashboard;
