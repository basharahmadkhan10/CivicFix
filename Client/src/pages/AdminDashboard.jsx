import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import lightLogo from "../assets/images/img01.png";
import darkLogo from "../assets/images/img02.png";
import {
  TrendingUp,
  BarChart as BarChartIcon,
  PieChart,
  Activity,
  Target,
  Zap,
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  Bell,
  User,
  MapPin,
  Filter,
  Home,
  Calendar,
  TrendingUp as TrendingUpIcon,
  Users,
  MessageSquare,
  Eye,
  RefreshCw,
  LogOut,
  Plus,
  Shield,
  UserPlus,
  FileText,
  XCircle,
  Send,
  Download,
  ChevronRight,
  MoreVertical,
  AlertTriangle,
  UserCheck,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  DownloadCloud,
  MoreHorizontal,
  ChevronLeft,
  Menu,
  X,
} from "lucide-react";
import api from "../utils/api";
import Preloader from "../components/Preloader";

const AdminDashboard = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [complaints, setComplaints] = useState([]);
  const [users, setUsers] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [stats, setStats] = useState({
    totalComplaints: 0,
    pendingComplaints: 0,
    resolvedComplaints: 0,
    activeUsers: 0,
    totalUsers: 0,
    supervisors: 0,
    officers: 0,
    citizens: 0,
    slaCompliance: 0,
    avgResolutionTime: 0,
    systemUptime: 99.9,
  });
  const [auditTrail, setAuditTrail] = useState([]);
  const [user, setUser] = useState(null);
  const [analyticsData, setAnalyticsData] = useState({
    categories: [],
    trends: [],
    responseTimes: [],
  });

  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);

  // Selected items
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form states
  const [newUserData, setNewUserData] = useState({
    name: "",
    email: "",
    password: "",
    role: "CITIZEN",
    department: "",
  });

  const [assignData, setAssignData] = useState({
    supervisorId: "",
    officerId: "",
    type: "supervisor",
  });

  const [updateData, setUpdateData] = useState({
    status: "",
    remarks: "",
    priority: "",
  });

  const [reassignData, setReassignData] = useState({
    newSupervisorId: "",
    reason: "",
  });

  const [escalateData, setEscalateData] = useState({
    level: "HIGH",
    reason: "",
    deadline: "",
  });

  const [overrideData, setOverrideData] = useState({
    action: "",
    reason: "",
    notes: "",
  });

  // Filter states
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("ALL");

  // Modern theme with #97AB33
  const getThemeColors = () => {
    const accentColor = "#97AB33";
    
    if (theme === "light") {
      return {
        bg: "#FFFFFF",
        text: "#1A202C",
        card: "#FFFFFF",
        cardHover: "#F7FAFC",
        border: "#E2E8F0",
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
  const isDark = theme === "dark";
  const currentLogo = theme === "dark" ? darkLogo : lightLogo;

  const getUserInitials = (name) => {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchDashboardData(),
          fetchUserProfile(),
          fetchAnalyticsData(),
        ]);
        setPageLoaded(true);
      } catch (error) {
        console.error("Failed to load data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (user?.name && pageLoaded) {
      toast.success(`Welcome back, ${user.name}!`);
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
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const tokenData = JSON.parse(atob(token.split(".")[1]));
          setUser({
            _id: tokenData.id,
            name: tokenData.name || "Admin User",
            email: tokenData.email || "admin@example.com",
            role: tokenData.role || "ADMIN",
          });
        } catch (decodeError) {
          setUser({
            name: "Admin User",
            email: "admin@example.com",
            role: "ADMIN",
          });
        }
      }
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const statsRes = await api.get("/v1/admin/dashboard");
      const backendStats = statsRes.data?.data || {};

      const transformedStats = transformBackendStats(backendStats);
      setStats(transformedStats);

      const complaintsRes = await api.get("/v1/admin/complaints");
      setComplaints(complaintsRes.data?.data || []);

      const usersRes = await api.get("/v1/admin/users");
      setUsers(usersRes.data?.data || []);

      const auditRes = await api.get("/v1/admin/audit-trail");
      setAuditTrail(auditRes.data?.data || []);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data. Please try again.");
      setLoading(false);
    }
  };

  const transformBackendStats = (backendStats) => {
    const counts = backendStats.counts || {};
    const rates = backendStats.rates || {};
    const userStats = backendStats.users || [];
    const performance = backendStats.performance || {};

    const userRoleCounts = {
      supervisors: 0,
      officers: 0,
      citizens: 0,
      admins: 0,
    };

    userStats.forEach((stat) => {
      switch (stat._id) {
        case "SUPERVISOR":
          userRoleCounts.supervisors = stat.count || 0;
          break;
        case "OFFICER":
          userRoleCounts.officers = stat.count || 0;
          break;
        case "CITIZEN":
          userRoleCounts.citizens = stat.count || 0;
          break;
        case "ADMIN":
          userRoleCounts.admins = stat.count || 0;
          break;
        default:
          break;
      }
    });

    const activeUsers = userStats.reduce(
      (sum, stat) => sum + (stat.active || 0),
      0,
    );

    const pendingComplaints =
      (counts.created || 0) + (counts.assigned || 0) + (counts.inProgress || 0);

    const avgResolutionTime = performance.resolutionTime
      ? parseFloat(performance.resolutionTime.avgHours || 0).toFixed(1)
      : 0;

    const slaCompliance = rates.resolutionRate || 0;

    return {
      totalComplaints: counts.total || 0,
      pendingComplaints,
      resolvedComplaints: counts.resolved || 0,
      activeUsers,
      totalUsers: userStats.reduce((sum, stat) => sum + (stat.count || 0), 0),
      supervisors: userRoleCounts.supervisors,
      officers: userRoleCounts.officers,
      citizens: userRoleCounts.citizens,
      slaCompliance: parseFloat(slaCompliance) || 0,
      avgResolutionTime: parseFloat(avgResolutionTime) || 0,
      systemUptime: 99.9,
    };
  };

  const fetchAnalyticsData = async () => {
    try {
      const complaintsRes = await api.get("/v1/admin/complaints");
      const allComplaints = complaintsRes.data?.data || [];

      const categoryCount = {};
      allComplaints.forEach((complaint) => {
        const category = complaint.category || "Other";
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      });

      const categoriesData = Object.entries(categoryCount).map(
        ([category, count], index) => {
          const colors = [
            colors.accent,
            colors.success,
            colors.warning,
            colors.info,
            colors.primary,
            colors.muted,
          ];
          return {
            category,
            count,
            color: colors[index % colors.length],
          };
        },
      );

      const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ];

      const now = new Date();
      const trendsData = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(now.getMonth() - i);
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();

        const monthStart = new Date(year, date.getMonth(), 1);
        const monthEnd = new Date(year, date.getMonth() + 1, 0);

        const createdInMonth = allComplaints.filter((c) => {
          const created = new Date(c.createdAt);
          return created >= monthStart && created <= monthEnd;
        }).length;

        const resolvedInMonth = allComplaints.filter((c) => {
          if (c.status !== "RESOLVED") return false;
          const resolved = new Date(c.updatedAt);
          return resolved >= monthStart && resolved <= monthEnd;
        }).length;

        trendsData.push({
          month,
          created: createdInMonth,
          resolved: resolvedInMonth,
        });
      }

      setAnalyticsData({
        categories: categoriesData,
        trends: trendsData,
        responseTimes: [],
      });
    } catch (error) {
      console.error("Error fetching analytics data:", error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.warning("Please enter a search query");
      return;
    }

    try {
      toast.info("Searching...");

      const filteredComplaints = complaints.filter(
        (complaint) =>
          complaint.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          complaint.description
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          complaint.area?.toLowerCase().includes(searchQuery.toLowerCase()),
      );

      if (filteredComplaints.length === 0) {
        toast.warning("No results found");
      } else {
        toast.success(`Found ${filteredComplaints.length} result(s)`);
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Search failed");
    }
  };

  const handleFilter = async (status) => {
    setSelectedStatusFilter(status);
    try {
      toast.info(
        `Filtering ${status === "ALL" ? "all" : status.toLowerCase()} complaints...`,
      );

      if (status === "ALL") {
        await fetchDashboardData();
        toast.success("Showing all complaints");
        return;
      }

      const filteredComplaints = complaints.filter(
        (complaint) => complaint.status === status,
      );

      if (filteredComplaints.length === 0) {
        toast.warning(`No ${status.toLowerCase()} complaints found`);
      } else {
        toast.success(
          `Showing ${filteredComplaints.length} ${status.toLowerCase()} complaint(s)`,
        );
      }
    } catch (error) {
      console.error("Filter error:", error);
      toast.error("Filter failed");
    }
  };

  const handleRefresh = () => {
    toast.info("Refreshing data...");
    fetchDashboardData();
  };

  const handleCreateUser = async () => {
    try {
      const response = await api.post("/v1/admin/users", newUserData);
      if (response.data.success) {
        toast.success("User created successfully!");
        setShowUserModal(false);
        setNewUserData({
          name: "",
          email: "",
          password: "",
          role: "CITIZEN",
          department: "",
        });
        fetchDashboardData();
      }
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error(
        `Failed to create user: ${error.response?.data?.message || error.message}`,
      );
    }
  };

  const handleManageUser = async (userId, action) => {
    try {
      const response = await api.patch(`/v1/admin/users/${userId}/manage`, {
        action,
      });

      if (response.data.success) {
        toast.success(`User ${action}d successfully!`);
        fetchDashboardData();
      }
    } catch (error) {
      console.error(`Error ${action} user:`, error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        `Failed to ${action} user`;

      toast.error(`Failed to ${action} user: ${errorMessage}`);
    }
  };

  const handleAssignComplaint = async () => {
    if (!selectedComplaint) return;

    try {
      let response;
      if (assignData.type === "supervisor") {
        response = await api.patch(
          `/v1/admin/complaints/${selectedComplaint._id}/assign`,
          { supervisorId: assignData.supervisorId },
        );
      } else {
        response = await api.patch(
          `/v1/admin/complaints/${selectedComplaint._id}/assign-officer`,
          { officerId: assignData.officerId },
        );
      }

      if (response.data.success) {
        toast.success("Complaint assigned successfully!");
        setShowAssignModal(false);
        setAssignData({ supervisorId: "", officerId: "", type: "supervisor" });
        fetchDashboardData();
      }
    } catch (error) {
      console.error("Error assigning complaint:", error);
      toast.error(
        `Failed to assign complaint: ${error.response?.data?.message || error.message || "Unknown error"}`,
      );
    }
  };

  const handleUpdateComplaint = async () => {
    if (!selectedComplaint) return;

    try {
      const response = await api.patch(
        `/v1/admin/complaints/${selectedComplaint._id}`,
        updateData,
      );
      if (response.data.success) {
        toast.success("Complaint updated successfully!");
        setShowUpdateModal(false);
        setUpdateData({ status: "", remarks: "", priority: "" });
        fetchDashboardData();
      }
    } catch (error) {
      console.error("Error updating complaint:", error);
      toast.error(
        `Failed to update complaint: ${error.response?.data?.message || error.message}`,
      );
    }
  };

  const handleOverrideComplaint = async () => {
    if (!selectedComplaint) return;

    try {
      if (
        overrideData.action === "REOPEN" &&
        selectedComplaint.status !== "RESOLVED"
      ) {
        toast.error("Only resolved complaints can be reopened");
        return;
      }

      const payload = {
        action: overrideData.action.toUpperCase(),
        reason: overrideData.reason || "",
        notes: overrideData.notes || "",
      };

      const response = await api.patch(
        `/v1/admin/complaints/${selectedComplaint._id}/override`,
        payload,
      );

      if (response.data.success) {
        toast.success(
          `Complaint ${overrideData.action.toLowerCase()}d successfully!`,
        );
        setShowOverrideModal(false);
        setOverrideData({ action: "", reason: "", notes: "" });
        fetchDashboardData();
      }
    } catch (error) {
      console.error("Error overriding complaint:", error);
      let errorMsg = "Failed to override complaint";
      if (error.response?.status === 404) {
        errorMsg = "Endpoint not found. Please check the backend.";
      } else if (error.response?.status === 400) {
        errorMsg = error.response?.data?.message || "Invalid request";
      } else if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      }

      toast.error(`Override failed: ${errorMsg}`);
    }
  };

  const handleExportReport = async () => {
    try {
      const response = await api.get(`/v1/admin/reports/sla-compliance`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `sla-report-${new Date().toISOString().split("T")[0]}.pdf`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Report exported successfully!");
    } catch (error) {
      console.error("Error exporting report:", error);
      toast.error("Failed to export report");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully!");
    navigate("/login");
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
      case "REJECTED": return colors.danger;
      case "ESCALATED": return colors.warning;
      default: return colors.muted;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "ADMIN": return colors.accent;
      case "SUPERVISOR": return colors.info;
      case "OFFICER": return colors.warning;
      case "CITIZEN": return colors.success;
      default: return colors.muted;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "CREATED": return <AlertCircle size={16} />;
      case "ASSIGNED": return <Clock size={16} />;
      case "IN_PROGRESS": return <Target size={16} />;
      case "RESOLVED": return <CheckCircle size={16} />;
      case "REJECTED": return <XCircle size={16} />;
      case "ESCALATED": return <AlertTriangle size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "ADMIN": return <Shield size={16} />;
      case "SUPERVISOR": return <UserCheck size={16} />;
      case "OFFICER": return <User size={16} />;
      case "CITIZEN": return <Users size={16} />;
      default: return <User size={16} />;
    }
  };

  const getSupervisors = () => {
    return users.filter(
      (user) => user.role === "SUPERVISOR" && user.isActive !== false,
    );
  };

  const getOfficers = () => {
    return users.filter((user) => user.role === "OFFICER" && user.isActive);
  };

  const filteredComplaints = useMemo(() => {
    return complaints.filter((complaint) => {
      const matchesStatus =
        selectedStatusFilter === "ALL" ||
        complaint.status === selectedStatusFilter;
      const matchesSearch =
        searchQuery === "" ||
        complaint.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        complaint.description
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        complaint.area?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [complaints, selectedStatusFilter, searchQuery]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesRole =
        selectedRoleFilter === "ALL" || user.role === selectedRoleFilter;
      const matchesSearch =
        searchQuery === "" ||
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.department &&
          user.department.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesRole && matchesSearch;
    });
  }, [users, selectedRoleFilter, searchQuery]);

  if (loading || !pageLoaded) {
    return <Preloader />;
  }

  const StatCard = ({ title, value, color, icon, subtitle, onClick }) => (
    <div
      onClick={onClick}
      className="p-4 sm:p-6 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer"
      style={{
        backgroundColor: colors.card,
        border: `1px solid ${color}30`,
        boxShadow: colors.shadow,
      }}
    >
      <div className="flex justify-between items-start mb-3 sm:mb-4">
        <div
          className="p-1.5 sm:p-2 rounded-lg"
          style={{ backgroundColor: `${color}20` }}
        >
          <div style={{ color }}>{icon}</div>
        </div>
        <ChevronRight size={18} style={{ color: colors.muted }} />
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

      {/* Header */}
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
            className="flex items-center gap-2 cursor-pointer"
          >
            <img
              src={currentLogo}
              alt="CivicFix"
              style={{ height: "32px", width: "auto", objectFit: "contain" }}
            />
            <span className="text-lg sm:text-xl font-bold">
              CIVIC<span style={{ color: colors.accent }}>FIX</span>
              <span className="ml-2 text-xs font-normal" style={{ color: colors.muted }}>Admin</span>
            </span>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={(e) => { e.stopPropagation(); setMobileMenuOpen(!mobileMenuOpen); }}
            className="md:hidden p-2 rounded-lg"
            style={{
              backgroundColor: colors.cardHover,
            }}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
              style={{ backgroundColor: colors.cardHover, color: colors.text }}
            >
              {isDark ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            <button
              onClick={handleRefresh}
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
              style={{ backgroundColor: colors.cardHover }}
            >
              <RefreshCw size={18} />
            </button>

            <button
              onClick={() => setShowUserModal(true)}
              className="h-9 px-3 rounded-lg font-medium flex items-center space-x-2 transition-all hover:opacity-90"
              style={{
                backgroundColor: colors.accent,
                color: isDark ? "#000" : "#FFF",
              }}
            >
              <UserPlus size={16} />
              <span className="hidden lg:inline">New User</span>
            </button>

            <button
              onClick={handleExportReport}
              className="h-9 px-3 rounded-lg font-medium flex items-center space-x-2 transition-all hover:opacity-90"
              style={{
                backgroundColor: colors.success,
                color: "#FFF",
              }}
            >
              <DownloadCloud size={16} />
              <span className="hidden lg:inline">Export</span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                className="flex items-center space-x-2 p-1.5 rounded-lg"
                onClick={(e) => { e.stopPropagation(); setProfileDropdownOpen(!profileDropdownOpen); }}
                style={{ backgroundColor: colors.cardHover }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: colors.accent }}
                >
                  <span style={{ color: isDark ? "#000" : "#FFF", fontSize: "12px", fontWeight: "600" }}>
                    {getUserInitials(user?.name)}
                  </span>
                </div>
                <span className="font-medium hidden lg:inline text-sm">{user?.name?.split(" ")[0] || "Admin"}</span>
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
                style={{ backgroundColor: colors.cardHover, color: colors.text }}
              >
                {isDark ? "☀️ Light Mode" : "🌙 Dark Mode"}
              </button>
              <button 
                onClick={() => { handleRefresh(); setMobileMenuOpen(false); }}
                className="w-full text-left py-3 px-4 rounded-lg"
                style={{ backgroundColor: colors.cardHover, color: colors.text }}
              >
                <span>🔄 Refresh</span>
              </button>
              <button 
                onClick={() => { setShowUserModal(true); setMobileMenuOpen(false); }}
                className="w-full text-left py-3 px-4 rounded-lg"
                style={{ backgroundColor: colors.accent, color: isDark ? "#000" : "#FFF" }}
              >
                <span>➕ New User</span>
              </button>
              <button 
                onClick={() => { handleExportReport(); setMobileMenuOpen(false); }}
                className="w-full text-left py-3 px-4 rounded-lg"
                style={{ backgroundColor: colors.success, color: "#FFF" }}
              >
                <span>📥 Export Report</span>
              </button>
              <button 
                onClick={navigateToProfile}
                className="w-full text-left py-3 px-4 rounded-lg"
                style={{ backgroundColor: colors.cardHover, color: colors.text }}
              >
                <span>👤 Profile</span>
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

        {/* Tabs */}
        <div className="flex mt-4 space-x-1">
          {["dashboard", "complaints", "users"].map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setMobileMenuOpen(false); }}
              className="flex-1 py-2.5 text-sm font-medium rounded-lg transition-all"
              style={{
                backgroundColor: activeTab === tab ? colors.accent : "transparent",
                color: activeTab === tab ? (isDark ? "#000" : "#FFF") : colors.muted,
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
        {activeTab === "dashboard" && (
          <>
            {/* Welcome Section */}
            <div className="mb-6 sm:mb-8 mt-4">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2">
                Welcome Back{" "}
                <span className="block sm:inline" style={{ color: colors.accent }}>
                  {user?.name?.split(" ")[0] || "Admin"}
                </span>
              </h1>
              <p className="text-sm sm:text-base" style={{ color: colors.muted }}>
                Here's what's happening with your system today.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <StatCard
                title="Total Complaints"
                value={stats.totalComplaints || 0}
                color={colors.info}
                icon={<FileText size={20} />}
                onClick={() => setActiveTab("complaints")}
              />
              <StatCard
                title="Active Users"
                value={stats.activeUsers || 0}
                color={colors.success}
                icon={<Users size={20} />}
                subtitle={`Total: ${stats.totalUsers || 0}`}
                onClick={() => setActiveTab("users")}
              />
              <StatCard
                title="SLA Compliance"
                value={`${stats.slaCompliance || 0}%`}
                color={colors.warning}
                icon={<CheckCircle size={20} />}
              />
              <StatCard
                title="System Uptime"
                value={`${stats.systemUptime || 99.9}%`}
                color={colors.accent}
                icon={<Home size={20} />}
              />
            </div>

            {/* Role Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="p-4 rounded-lg text-center" style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
                <div className="text-xl font-bold mb-1" style={{ color: colors.info }}>{stats.supervisors || 0}</div>
                <div className="text-xs" style={{ color: colors.muted }}>Supervisors</div>
              </div>
              <div className="p-4 rounded-lg text-center" style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
                <div className="text-xl font-bold mb-1" style={{ color: colors.warning }}>{stats.officers || 0}</div>
                <div className="text-xs" style={{ color: colors.muted }}>Officers</div>
              </div>
              <div className="p-4 rounded-lg text-center" style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
                <div className="text-xl font-bold mb-1" style={{ color: colors.success }}>{stats.citizens || 0}</div>
                <div className="text-xs" style={{ color: colors.muted }}>Citizens</div>
              </div>
              <div className="p-4 rounded-lg text-center" style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
                <div className="text-xl font-bold mb-1" style={{ color: colors.accent }}>{stats.avgResolutionTime || 0}</div>
                <div className="text-xs" style={{ color: colors.muted }}>Avg Resolution (days)</div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="p-4 sm:p-6 rounded-lg" style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold" style={{ color: colors.text }}>Recent Activity</h2>
                <button onClick={() => setActiveTab("complaints")} className="text-sm" style={{ color: colors.accent }}>
                  View All →
                </button>
              </div>
              <div className="space-y-3">
                {auditTrail.slice(0, 5).map((audit, index) => (
                  <div key={index} className="flex items-start gap-2 p-2 rounded-lg" style={{ backgroundColor: colors.cardHover }}>
                    <div className="p-1.5 rounded" style={{ backgroundColor: `${getRoleColor(audit.role)}20` }}>
                      {getRoleIcon(audit.role)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate" style={{ color: colors.text }}>{audit.action}</div>
                      <div className="text-xs" style={{ color: colors.muted }}>by {audit.actor?.name || "System"}</div>
                      <div className="text-2xs mt-0.5" style={{ color: colors.muted }}>{new Date(audit.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === "complaints" && (
          <div>
            <div className="flex flex-col gap-3 mb-4">
              <h1 className="text-xl sm:text-2xl font-bold" style={{ color: colors.text }}>All Complaints</h1>
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
                  <button onClick={handleSearch} className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Search size={14} style={{ color: colors.muted }} />
                  </button>
                </div>

                {/* Filter Buttons */}
                <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                  <button 
                    onClick={() => handleFilter("ALL")} 
                    className="px-3 py-2 rounded-lg text-xs whitespace-nowrap flex-shrink-0"
                    style={{ 
                      backgroundColor: selectedStatusFilter === "ALL" ? colors.accent : colors.cardHover, 
                      color: selectedStatusFilter === "ALL" ? (isDark ? "#000" : "#FFF") : colors.text, 
                    }}
                  >
                    All
                  </button>
                  {["CREATED", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "REJECTED"].map((status) => (
                    <button 
                      key={status} 
                      onClick={() => handleFilter(status)} 
                      className="px-3 py-2 rounded-lg text-xs whitespace-nowrap flex-shrink-0"
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

            {filteredComplaints.length === 0 ? (
              <div className="text-center py-8 rounded-lg" style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
                <AlertCircle size={40} className="mx-auto mb-4" style={{ color: colors.muted }} />
                <h3 className="text-base font-bold mb-2" style={{ color: colors.text }}>No complaints found</h3>
                <p className="text-sm" style={{ color: colors.muted }}>
                  {searchQuery ? "No complaints match your search criteria." : "No complaints in the system yet."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredComplaints.map((complaint) => (
                  <div key={complaint._id} className="p-4 rounded-lg" style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                          style={{ backgroundColor: `${getStatusColor(complaint.status)}20`, color: getStatusColor(complaint.status) }}>
                          {getStatusIcon(complaint.status)} {complaint.status}
                        </span>
                        <span className="text-xs" style={{ color: colors.muted }}>{new Date(complaint.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h3 className="font-bold text-sm" style={{ color: colors.text }}>{complaint.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="flex items-center" style={{ color: colors.muted }}>
                          <MapPin size={10} className="mr-1" /> {complaint.area || "N/A"}
                        </span>
                        <span>•</span>
                        <span style={{ color: colors.muted }}>{complaint.user?.name || "N/A"}</span>
                      </div>
                      <div className="flex gap-2 mt-1">
                        <button onClick={() => { setSelectedComplaint(complaint); setShowUpdateModal(true); }}
                          className="flex-1 px-3 py-2 rounded text-xs font-medium"
                          style={{ backgroundColor: colors.cardHover, color: colors.text }}>
                          Update
                        </button>
                        {complaint.status !== "RESOLVED" ? (
                          <button onClick={() => { setSelectedComplaint(complaint); setShowAssignModal(true); }}
                            className="flex-1 px-3 py-2 rounded text-xs font-medium"
                            style={{ backgroundColor: colors.info, color: "#FFF" }}>
                            Assign
                          </button>
                        ) : (
                          <button onClick={() => { setSelectedComplaint(complaint); setOverrideData({ action: "REOPEN", reason: "", notes: "" }); setShowOverrideModal(true); }}
                            className="flex-1 px-3 py-2 rounded text-xs font-medium"
                            style={{ backgroundColor: colors.warning, color: "#FFF" }}>
                            Reopen
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

        {activeTab === "users" && (
          <div>
            <div className="flex flex-col gap-3 mb-4">
              <h1 className="text-xl sm:text-2xl font-bold" style={{ color: colors.text }}>User Management</h1>
              <div className="flex flex-col gap-3">
                {/* Search Bar */}
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" size={16} style={{ color: colors.muted }} />
                  <input 
                    type="text" 
                    placeholder="Search users..." 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-10 py-3 text-sm rounded-lg focus:outline-none focus:ring-1"
                    style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}`, color: colors.text }} 
                  />
                </div>

                {/* Filter Buttons */}
                <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                  <button 
                    onClick={() => setSelectedRoleFilter("ALL")} 
                    className="px-3 py-2 rounded-lg text-xs whitespace-nowrap flex-shrink-0"
                    style={{ 
                      backgroundColor: selectedRoleFilter === "ALL" ? colors.accent : colors.cardHover, 
                      color: selectedRoleFilter === "ALL" ? (isDark ? "#000" : "#FFF") : colors.text, 
                    }}
                  >
                    All
                  </button>
                  {["ADMIN", "SUPERVISOR", "OFFICER", "CITIZEN"].map((role) => (
                    <button 
                      key={role} 
                      onClick={() => setSelectedRoleFilter(role)} 
                      className="px-3 py-2 rounded-lg text-xs whitespace-nowrap flex-shrink-0"
                      style={{ 
                        backgroundColor: selectedRoleFilter === role ? getRoleColor(role) : colors.cardHover, 
                        color: selectedRoleFilter === role ? "#FFF" : colors.text, 
                      }}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 rounded-lg" style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
                <Users size={40} className="mx-auto mb-4" style={{ color: colors.muted }} />
                <h3 className="text-base font-bold mb-2" style={{ color: colors.text }}>No users found</h3>
                <p className="text-sm mb-4" style={{ color: colors.muted }}>
                  {searchQuery ? "No users match your search." : "No users in the system yet."}
                </p>
                <button onClick={() => setShowUserModal(true)} className="px-6 py-3 rounded-lg font-medium text-sm"
                  style={{ backgroundColor: colors.accent, color: isDark ? "#000" : "#FFF" }}>
                  Create First User
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredUsers.map((user) => (
                  <div key={user._id} className="p-4 rounded-lg" style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: getRoleColor(user.role), color: "#FFF" }}>
                          {getRoleIcon(user.role)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-sm truncate" style={{ color: colors.text }}>{user.name}</h3>
                          <p className="text-xs truncate" style={{ color: colors.muted }}>{user.email}</p>
                        </div>
                      </div>
                      <div className="relative group flex-shrink-0">
                        <button className="p-1.5 rounded-lg" style={{ backgroundColor: colors.cardHover }}>
                          <MoreVertical size={14} style={{ color: colors.muted }} />
                        </button>
                        <div className="absolute right-0 mt-1 w-36 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10"
                          style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}`, boxShadow: colors.shadow }}>
                          <div className="py-1">
                            {user.isActive === false ? (
                              <button onClick={() => handleManageUser(user._id, "activate")}
                                className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-opacity-80 text-left text-xs"
                                style={{ color: colors.text }}>
                                <Play size={12} /> Activate
                              </button>
                            ) : (
                              <button onClick={() => handleManageUser(user._id, "deactivate")}
                                className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-opacity-80 text-left text-xs"
                                style={{ color: colors.text }}>
                                <Pause size={12} /> Deactivate
                              </button>
                            )}
                            <button onClick={() => handleManageUser(user._id, "reset_password")}
                              className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-opacity-80 text-left text-xs"
                              style={{ color: colors.text }}>
                              <RotateCcw size={12} /> Reset Password
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                      <div><span style={{ color: colors.muted }}>Role:</span> <span className="font-medium" style={{ color: colors.text }}>{user.role}</span></div>
                      <div><span style={{ color: colors.muted }}>Status:</span> 
                        <span className={`ml-1 font-medium ${user.isActive ? "text-green-600" : "text-red-600"}`}>
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl p-6 max-w-md w-full" style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: colors.accent }}>Create New User</h3>
            <div className="space-y-3">
              <input type="text" placeholder="Full Name" value={newUserData.name}
                onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                className="w-full p-3 text-sm rounded-lg" style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}`, color: colors.text }} />
              <input type="email" placeholder="Email" value={newUserData.email}
                onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                className="w-full p-3 text-sm rounded-lg" style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}`, color: colors.text }} />
              <input type="password" placeholder="Password" value={newUserData.password}
                onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                className="w-full p-3 text-sm rounded-lg" style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}`, color: colors.text }} />
              <select value={newUserData.role} onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                className="w-full p-3 text-sm rounded-lg" style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}`, color: colors.text }}>
                <option value="CITIZEN">Citizen</option>
                <option value="OFFICER">Officer</option>
                <option value="SUPERVISOR">Supervisor</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowUserModal(false)} className="flex-1 p-3 rounded-lg font-medium text-sm"
                style={{ backgroundColor: colors.cardHover, color: colors.text }}>
                Cancel
              </button>
              <button onClick={handleCreateUser} disabled={!newUserData.name || !newUserData.email || !newUserData.password}
                className="flex-1 p-3 rounded-lg font-medium text-sm disabled:opacity-50"
                style={{ backgroundColor: colors.accent, color: isDark ? "#000" : "#FFF" }}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {showAssignModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl p-6 max-w-md w-full" style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: colors.accent }}>Assign Complaint</h3>
            <div className="space-y-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: colors.cardHover }}>
                <p className="text-xs" style={{ color: colors.muted }}>Complaint:</p>
                <p className="text-sm font-medium" style={{ color: colors.text }}>{selectedComplaint.title}</p>
              </div>
              <select value={assignData.type} onChange={(e) => setAssignData({ ...assignData, type: e.target.value })}
                className="w-full p-3 text-sm rounded-lg" style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}`, color: colors.text }}>
                <option value="supervisor">Assign to Supervisor</option>
                <option value="officer">Assign to Officer</option>
              </select>
              {assignData.type === "supervisor" ? (
                <select value={assignData.supervisorId} onChange={(e) => setAssignData({ ...assignData, supervisorId: e.target.value })}
                  className="w-full p-3 text-sm rounded-lg" style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}`, color: colors.text }}>
                  <option value="">Select Supervisor</option>
                  {getSupervisors().map((supervisor) => (
                    <option key={supervisor._id} value={supervisor._id}>{supervisor.name}</option>
                  ))}
                </select>
              ) : (
                <select value={assignData.officerId} onChange={(e) => setAssignData({ ...assignData, officerId: e.target.value })}
                  className="w-full p-3 text-sm rounded-lg" style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}`, color: colors.text }}>
                  <option value="">Select Officer</option>
                  {getOfficers().map((officer) => (
                    <option key={officer._id} value={officer._id}>{officer.name}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowAssignModal(false)} className="flex-1 p-3 rounded-lg font-medium text-sm"
                style={{ backgroundColor: colors.cardHover, color: colors.text }}>
                Cancel
              </button>
              <button onClick={handleAssignComplaint} disabled={(assignData.type === "supervisor" && !assignData.supervisorId) || (assignData.type === "officer" && !assignData.officerId)}
                className="flex-1 p-3 rounded-lg font-medium text-sm disabled:opacity-50"
                style={{ backgroundColor: colors.accent, color: isDark ? "#000" : "#FFF" }}>
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {showUpdateModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl p-6 max-w-md w-full" style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: colors.accent }}>Update Complaint</h3>
            <div className="space-y-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: colors.cardHover }}>
                <p className="text-xs" style={{ color: colors.muted }}>Complaint:</p>
                <p className="text-sm font-medium" style={{ color: colors.text }}>{selectedComplaint.title}</p>
              </div>
              <select value={updateData.status} onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })}
                className="w-full p-3 text-sm rounded-lg" style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}`, color: colors.text }}>
                <option value="">Select Status</option>
                <option value="CREATED">Created</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="REJECTED">Rejected</option>
              </select>
              <select value={updateData.priority} onChange={(e) => setUpdateData({ ...updateData, priority: e.target.value })}
                className="w-full p-3 text-sm rounded-lg" style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}`, color: colors.text }}>
                <option value="">Select Priority</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
              <textarea placeholder="Remarks" value={updateData.remarks} onChange={(e) => setUpdateData({ ...updateData, remarks: e.target.value })}
                className="w-full p-3 text-sm rounded-lg" rows="3"
                style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}`, color: colors.text }} />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowUpdateModal(false)} className="flex-1 p-3 rounded-lg font-medium text-sm"
                style={{ backgroundColor: colors.cardHover, color: colors.text }}>
                Cancel
              </button>
              <button onClick={handleUpdateComplaint} disabled={!updateData.status && !updateData.remarks && !updateData.priority}
                className="flex-1 p-3 rounded-lg font-medium text-sm disabled:opacity-50"
                style={{ backgroundColor: colors.accent, color: isDark ? "#000" : "#FFF" }}>
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {showOverrideModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="rounded-xl p-6 max-w-md w-full" style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: colors.accent }}>Admin Override</h3>
            <div className="space-y-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: colors.cardHover }}>
                <p className="text-xs" style={{ color: colors.muted }}>Complaint:</p>
                <p className="text-sm font-medium" style={{ color: colors.text }}>{selectedComplaint.title}</p>
                <p className="text-2xs mt-1" style={{ color: colors.muted }}>Status: <span className="font-medium" style={{ color: getStatusColor(selectedComplaint.status) }}>{selectedComplaint.status}</span></p>
              </div>
              <select value={overrideData.action} onChange={(e) => setOverrideData({ ...overrideData, action: e.target.value })}
                className="w-full p-3 text-sm rounded-lg" style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}`, color: colors.text }}>
                <option value="">Select Action</option>
                <option value="REOPEN">Reopen Complaint</option>
                <option value="FORCE_RESOLVE">Force Resolve</option>
                <option value="FORCE_CLOSE">Force Close</option>
              </select>
              <textarea placeholder="Reason" value={overrideData.reason} onChange={(e) => setOverrideData({ ...overrideData, reason: e.target.value })}
                className="w-full p-3 text-sm rounded-lg" rows="2"
                style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}`, color: colors.text }} />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => { setShowOverrideModal(false); setOverrideData({ action: "", reason: "", notes: "" }); }}
                className="flex-1 p-3 rounded-lg font-medium text-sm" style={{ backgroundColor: colors.cardHover, color: colors.text }}>
                Cancel
              </button>
              <button onClick={handleOverrideComplaint} disabled={!overrideData.action || !overrideData.reason.trim()}
                className="flex-1 p-3 rounded-lg font-medium text-sm disabled:opacity-50"
                style={{ backgroundColor: overrideData.action === "REOPEN" ? colors.warning : colors.accent, color: "#FFF" }}>
                {overrideData.action || "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-8 py-6 px-3 sm:px-4 border-t" style={{ borderColor: colors.border, backgroundColor: colors.bg }}>
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-xs" style={{ color: colors.muted }}>
            © {new Date().getFullYear()} CivicFix Admin Panel. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AdminDashboard;
