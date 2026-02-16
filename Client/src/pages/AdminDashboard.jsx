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

  // Admin theme colors - Purple theme
  const colors =
    theme === "light"
      ? {
          bg: "#ffffff",
          text: "#000000",
          card: "#f3e8ff",
          border: "#d8b4fe",
          accent: "#000000",
          success: "#10b981",
          warning: "#f59e0b",
          danger: "#ef4444",
          info: "#8b5cf6",
          primary: "#8b5cf6",
          pending: "#f97316",
          categoryBg: "#e2e8f0",
          categoryText: "#1e293b",
        }
      : {
          bg: "#000000",
          text: "#ffffff",
          card: "#1a0f2e",
          border: "#4c1d95",
          accent: "#ffffff",
          success: "#10b981",
          warning: "#f59e0b",
          danger: "#ef4444",
          info: "#a78bfa",
          primary: "#8b5cf6",
          pending: "#f97316",
          categoryBg: "#4b5563",
          categoryText: "#f3f4f6",
        };

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
        toast.error("Failed to load dashboard data", {
          position: "top-right",
          duration: 5000,
        });
      } finally {
        setLoading(false);
      }
    };
    loadData();
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
      toast.error("Failed to load dashboard data. Please try again.", {
        position: "top-right",
        duration: 5000,
      });
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
            "#8b5cf6",
            "#10b981",
            "#f59e0b",
            "#ef4444",
            "#3b82f6",
            "#06b6d4",
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
      toast.warning("Please enter a search query", {
        position: "top-right",
        duration: 3000,
      });
      return;
    }

    try {
      toast.info("Searching...", {
        position: "top-right",
        duration: 2000,
      });

      const filteredComplaints = complaints.filter(
        (complaint) =>
          complaint.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          complaint.description
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          complaint.area?.toLowerCase().includes(searchQuery.toLowerCase()),
      );

      if (filteredComplaints.length === 0) {
        toast.warning("No results found", {
          position: "top-right",
          duration: 4000,
        });
      } else {
        toast.success(`Found ${filteredComplaints.length} result(s)`, {
          position: "top-right",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Search failed", {
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

      const filteredComplaints = complaints.filter(
        (complaint) => complaint.status === status,
      );

      if (filteredComplaints.length === 0) {
        toast.warning(`No ${status.toLowerCase()} complaints found`, {
          position: "top-right",
          duration: 4000,
        });
      } else {
        toast.success(
          `Showing ${filteredComplaints.length} ${status.toLowerCase()} complaint(s)`,
          {
            position: "top-right",
            duration: 3000,
          },
        );
      }
    } catch (error) {
      console.error("Filter error:", error);
      toast.error("Filter failed", {
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
        {
          position: "top-right",
          duration: 5000,
        },
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

      toast.error(`Failed to ${action} user: ${errorMessage}`, {
        position: "top-right",
        duration: 5000,
      });
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
        {
          position: "top-right",
          duration: 5000,
        },
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
        {
          position: "top-right",
          duration: 5000,
        },
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
        toast.error("Only resolved complaints can be reopened", {
          position: "top-right",
          duration: 5000,
        });
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
          {
            position: "top-right",
            duration: 5000,
          },
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

      toast.error(`Override failed: ${errorMsg}`, {
        position: "top-right",
        duration: 5000,
      });
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
      toast.error("Failed to export report", {
        position: "top-right",
        duration: 5000,
      });
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
      case "CREATED": return colors.info;
      case "ASSIGNED": return colors.warning;
      case "IN_PROGRESS": return colors.primary;
      case "RESOLVED": return colors.success;
      case "REJECTED": return colors.danger;
      case "ESCALATED": return "#f97316";
      default: return "#6b7280";
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "ADMIN": return colors.primary;
      case "SUPERVISOR": return colors.info;
      case "OFFICER": return colors.warning;
      case "CITIZEN": return colors.success;
      default: return "#6b7280";
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
        border: `1px solid ${colors.border}`,
      }}
    >
      <div className="flex justify-between items-start mb-3 sm:mb-4">
        <div
          className="p-1.5 sm:p-2 rounded-lg"
          style={{ backgroundColor: `${color}20` }}
        >
          <div style={{ color }}>{icon}</div>
        </div>
        <ChevronRight size={18} className="opacity-50" />
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
          <div className="flex items-center space-x-2 sm:space-x-4">
            <img
              src={currentLogo}
              alt="CivicFix Logo"
              className="h-8 sm:h-10 md:h-12 lg:h-14 w-auto object-contain"
            />
            <div className="hidden xs:block">
              <h1
                className="text-base sm:text-lg md:text-xl font-bold"
                style={{ color: colors.primary }}
              >
                Admin
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
              onClick={handleRefresh}
              className="p-2 lg:p-2.5 rounded-xl transition-all duration-300 hover:scale-110"
              style={{
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
              }}
              title="Refresh Dashboard"
            >
              <RefreshCw size={16} className="lg:w-[18px] lg:h-[18px]" />
            </button>

            <button
              onClick={() => setShowUserModal(true)}
              className="px-2 lg:px-3 py-1.5 lg:py-2 rounded-xl font-medium flex items-center space-x-1 lg:space-x-2 transition-all duration-300 hover:scale-105"
              style={{
                backgroundColor: colors.primary,
                color: "white",
              }}
            >
              <UserPlus size={16} className="lg:w-[18px] lg:h-[18px]" />
              <span className="text-xs lg:text-sm">New User</span>
            </button>

            <button
              onClick={handleExportReport}
              className="px-2 lg:px-3 py-1.5 lg:py-2 rounded-xl font-medium flex items-center space-x-1 lg:space-x-2 transition-all duration-300 hover:scale-105"
              style={{
                backgroundColor: colors.success,
                color: "white",
              }}
            >
              <DownloadCloud size={16} className="lg:w-[18px] lg:h-[18px]" />
              <span className="text-xs lg:text-sm hidden lg:inline">Export</span>
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
                    backgroundColor: colors.primary,
                    color: "white",
                  }}
                >
                  <span>{getUserInitials(user?.name)}</span>
                </div>
                <span className="font-medium text-xs lg:text-sm hidden lg:inline">
                  {user?.name || "Admin"}
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
                onClick={() => {
                  setShowUserModal(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2.5 px-3 rounded-lg flex items-center justify-between text-sm"
                style={{ backgroundColor: colors.primary, color: "white" }}
              >
                <span>➕ New User</span>
              </button>
              
              <button
                onClick={() => {
                  handleExportReport();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2.5 px-3 rounded-lg flex items-center justify-between text-sm"
                style={{ backgroundColor: colors.success, color: "white" }}
              >
                <span>📥 Export</span>
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
          {["dashboard", "complaints", "users"].map((tab) => (
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
        {activeTab === "dashboard" && (
          <>
            {/* Welcome Section */}
            <div className="mb-6 sm:mb-8 md:mb-12 mt-4">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2">
                Welcome Back{" "}
                <span className="font-bold block sm:inline text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl italic">
                  {user?.name?.split(" ")[0] || "Admin"}
                </span>
              </h1>
              <p className="text-xs sm:text-sm md:text-base opacity-75">
                Here's what's happening with your system today.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-6">
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
                color={colors.primary}
                icon={<Home size={20} />}
              />
            </div>

            {/* Role Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-6">
              <div
                className="p-3 sm:p-4 rounded-xl text-center"
                style={{
                  backgroundColor: colors.card,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <div className="text-lg sm:text-xl md:text-2xl font-bold mb-1" style={{ color: colors.info }}>
                  {stats.supervisors || 0}
                </div>
                <div className="text-xs sm:text-sm opacity-75">Supervisors</div>
              </div>
              <div
                className="p-3 sm:p-4 rounded-xl text-center"
                style={{
                  backgroundColor: colors.card,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <div className="text-lg sm:text-xl md:text-2xl font-bold mb-1" style={{ color: colors.warning }}>
                  {stats.officers || 0}
                </div>
                <div className="text-xs sm:text-sm opacity-75">Officers</div>
              </div>
              <div
                className="p-3 sm:p-4 rounded-xl text-center"
                style={{
                  backgroundColor: colors.card,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <div className="text-lg sm:text-xl md:text-2xl font-bold mb-1" style={{ color: colors.success }}>
                  {stats.citizens || 0}
                </div>
                <div className="text-xs sm:text-sm opacity-75">Citizens</div>
              </div>
              <div
                className="p-3 sm:p-4 rounded-xl text-center"
                style={{
                  backgroundColor: colors.card,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <div className="text-lg sm:text-xl md:text-2xl font-bold mb-1" style={{ color: colors.primary }}>
                  {stats.avgResolutionTime || 0}
                </div>
                <div className="text-xs sm:text-sm opacity-75">Avg. Resolution (days)</div>
              </div>
            </div>

            {/* Recent Activity */}
            <div
              className="p-4 sm:p-6 rounded-xl"
              style={{
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
              }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base sm:text-lg md:text-xl font-bold">Recent Activity</h2>
                <button
                  onClick={() => setActiveTab("complaints")}
                  className="text-xs sm:text-sm opacity-75 hover:opacity-100"
                  style={{ color: colors.primary }}
                >
                  View All →
                </button>
              </div>
              <div className="space-y-3">
                {auditTrail.slice(0, 5).map((audit, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-2 rounded-lg"
                    style={{ backgroundColor: `${colors.border}20` }}
                  >
                    <div
                      className="p-1.5 rounded flex-shrink-0"
                      style={{ backgroundColor: getRoleColor(audit.role) + "20" }}
                    >
                      {getRoleIcon(audit.role)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-xs sm:text-sm truncate">{audit.action}</div>
                      <div className="text-xs opacity-75">
                        by {audit.actor?.name || "System"}
                      </div>
                      <div className="text-2xs opacity-50 mt-0.5">
                        {new Date(audit.createdAt).toLocaleString()}
                      </div>
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
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1">
                  All Complaints
                </h1>
                <p className="text-xs sm:text-sm opacity-75">
                  Manage all complaints in the system
                </p>
              </div>
              <div className="flex flex-col gap-3">
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
                    className="w-full pl-9 pr-4 py-2 text-sm rounded-lg focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: colors.card,
                      border: `1px solid ${colors.border}`,
                      focusRingColor: colors.primary,
                    }}
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                  <button
                    onClick={() => handleFilter("ALL")}
                    className="px-3 py-1.5 rounded-lg text-xs whitespace-nowrap flex-shrink-0"
                    style={{
                      backgroundColor: selectedStatusFilter === "ALL" ? colors.primary : colors.card,
                      color: selectedStatusFilter === "ALL" ? "white" : colors.text,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    All
                  </button>
                  {["CREATED", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "REJECTED"].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleFilter(status)}
                      className="px-3 py-1.5 rounded-lg text-xs whitespace-nowrap flex-shrink-0"
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

            {filteredComplaints.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle size={40} className="mx-auto mb-3 opacity-50" />
                <h3 className="text-base font-bold mb-1">No complaints found</h3>
                <p className="text-xs opacity-75">
                  {searchQuery ? "No complaints match your search criteria." : "No complaints in the system yet."}
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

                      <h3 className="font-bold text-sm">{complaint.title}</h3>
                      
                      <div className="text-xs opacity-75 line-clamp-2">
                        {complaint.description?.substring(0, 100)}
                        {complaint.description?.length > 100 ? "..." : ""}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="flex items-center">
                          <MapPin size={10} className="mr-1" />
                          {complaint.area || "N/A"}
                        </span>
                        <span>•</span>
                        <span>{complaint.user?.name || "N/A"}</span>
                      </div>

                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={() => {
                            setSelectedComplaint(complaint);
                            setShowUpdateModal(true);
                          }}
                          className="flex-1 px-2 py-1.5 rounded text-xs font-medium"
                          style={{
                            backgroundColor: colors.card,
                            border: `1px solid ${colors.border}`,
                          }}
                        >
                          Update
                        </button>

                        {complaint.status !== "RESOLVED" ? (
                          <button
                            onClick={() => {
                              setSelectedComplaint(complaint);
                              setShowAssignModal(true);
                            }}
                            className="flex-1 px-2 py-1.5 rounded text-xs font-medium text-white"
                            style={{ backgroundColor: colors.info }}
                          >
                            Assign
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedComplaint(complaint);
                              setOverrideData({ action: "REOPEN", reason: "", notes: "" });
                              setShowOverrideModal(true);
                            }}
                            className="flex-1 px-2 py-1.5 rounded text-xs font-medium text-white"
                            style={{ backgroundColor: colors.warning }}
                          >
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
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1">
                  User Management
                </h1>
                <p className="text-xs sm:text-sm opacity-75">Manage all system users</p>
              </div>
              <div className="flex flex-col gap-3">
                <div className="relative w-full">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm rounded-lg focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: colors.card,
                      border: `1px solid ${colors.border}`,
                    }}
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                  <button
                    onClick={() => setSelectedRoleFilter("ALL")}
                    className="px-3 py-1.5 rounded-lg text-xs whitespace-nowrap flex-shrink-0"
                    style={{
                      backgroundColor: selectedRoleFilter === "ALL" ? colors.primary : colors.card,
                      color: selectedRoleFilter === "ALL" ? "white" : colors.text,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    All
                  </button>
                  {["ADMIN", "SUPERVISOR", "OFFICER", "CITIZEN"].map((role) => (
                    <button
                      key={role}
                      onClick={() => setSelectedRoleFilter(role)}
                      className="px-3 py-1.5 rounded-lg text-xs whitespace-nowrap flex-shrink-0"
                      style={{
                        backgroundColor: selectedRoleFilter === role ? getRoleColor(role) : colors.card,
                        color: selectedRoleFilter === role ? "white" : colors.text,
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <Users size={40} className="mx-auto mb-3 opacity-50" />
                <h3 className="text-base font-bold mb-1">No users found</h3>
                <p className="text-xs opacity-75 mb-3">
                  {searchQuery ? "No users match your search." : "No users in the system yet."}
                </p>
                <button
                  onClick={() => setShowUserModal(true)}
                  className="px-4 py-2 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: colors.primary, color: "white" }}
                >
                  Create First User
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredUsers.map((user) => (
                  <div
                    key={user._id}
                    className="p-3 rounded-lg"
                    style={{
                      backgroundColor: colors.card,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: getRoleColor(user.role), color: "white" }}
                        >
                          {getRoleIcon(user.role)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-sm truncate">{user.name}</h3>
                          <p className="text-xs opacity-75 truncate">{user.email}</p>
                        </div>
                      </div>
                      <div className="relative group flex-shrink-0">
                        <button
                          className="p-1.5 rounded-lg"
                          style={{ backgroundColor: `${colors.border}50` }}
                        >
                          <MoreVertical size={14} />
                        </button>
                        <div
                          className="absolute right-0 mt-1 w-36 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10"
                          style={{
                            backgroundColor: colors.card,
                            border: `1px solid ${colors.border}`,
                          }}
                        >
                          <div className="py-1">
                            {user.isActive === false ? (
                              <button
                                onClick={() => handleManageUser(user._id, "activate")}
                                className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-opacity-80 text-left text-xs"
                              >
                                <Play size={12} />
                                Activate
                              </button>
                            ) : (
                              <button
                                onClick={() => handleManageUser(user._id, "deactivate")}
                                className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-opacity-80 text-left text-xs"
                              >
                                <Pause size={12} />
                                Deactivate
                              </button>
                            )}
                            <button
                              onClick={() => handleManageUser(user._id, "reset_password")}
                              className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-opacity-80 text-left text-xs"
                            >
                              <RotateCcw size={12} />
                              Reset Password
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                      <div>
                        <span className="opacity-75">Role:</span>
                        <span className="ml-1 font-medium">{user.role}</span>
                      </div>
                      <div>
                        <span className="opacity-75">Status:</span>
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

      {/* Modals - Mobile Optimized */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-xl p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
            style={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
            }}
          >
            <h3 className="text-lg sm:text-xl font-bold mb-3">Create New User</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Full Name"
                value={newUserData.name}
                onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                className="w-full p-2.5 text-sm rounded-lg"
                style={{
                  backgroundColor: colors.bg,
                  border: `1px solid ${colors.border}`,
                  color: colors.text,
                }}
              />
              <input
                type="email"
                placeholder="Email"
                value={newUserData.email}
                onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                className="w-full p-2.5 text-sm rounded-lg"
                style={{
                  backgroundColor: colors.bg,
                  border: `1px solid ${colors.border}`,
                  color: colors.text,
                }}
              />
              <input
                type="password"
                placeholder="Password"
                value={newUserData.password}
                onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                className="w-full p-2.5 text-sm rounded-lg"
                style={{
                  backgroundColor: colors.bg,
                  border: `1px solid ${colors.border}`,
                  color: colors.text,
                }}
              />
              <select
                value={newUserData.role}
                onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                className="w-full p-2.5 text-sm rounded-lg"
                style={{
                  backgroundColor: colors.bg,
                  border: `1px solid ${colors.border}`,
                  color: colors.text,
                }}
              >
                <option value="CITIZEN">Citizen</option>
                <option value="OFFICER">Officer</option>
                <option value="SUPERVISOR">Supervisor</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowUserModal(false)}
                className="flex-1 p-2.5 rounded-lg font-medium text-sm"
                style={{
                  backgroundColor: colors.card,
                  border: `1px solid ${colors.border}`,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                disabled={!newUserData.name || !newUserData.email || !newUserData.password}
                className="flex-1 p-2.5 rounded-lg font-medium text-sm text-white disabled:opacity-50"
                style={{ backgroundColor: colors.primary }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {showAssignModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-xl p-4 sm:p-6 max-w-md w-full"
            style={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
            }}
          >
            <h3 className="text-lg sm:text-xl font-bold mb-3">Assign Complaint</h3>
            <div className="space-y-3">
              <div className="mb-3">
                <p className="font-medium text-sm">Complaint:</p>
                <p className="text-xs opacity-75">{selectedComplaint.title}</p>
              </div>
              <select
                value={assignData.type}
                onChange={(e) => setAssignData({ ...assignData, type: e.target.value })}
                className="w-full p-2.5 text-sm rounded-lg"
                style={{
                  backgroundColor: colors.bg,
                  border: `1px solid ${colors.border}`,
                  color: colors.text,
                }}
              >
                <option value="supervisor">Assign to Supervisor</option>
                <option value="officer">Assign to Officer</option>
              </select>
              {assignData.type === "supervisor" ? (
                <select
                  value={assignData.supervisorId}
                  onChange={(e) => setAssignData({ ...assignData, supervisorId: e.target.value })}
                  className="w-full p-2.5 text-sm rounded-lg"
                  style={{
                    backgroundColor: colors.bg,
                    border: `1px solid ${colors.border}`,
                    color: colors.text,
                  }}
                >
                  <option value="">Select Supervisor</option>
                  {getSupervisors().map((supervisor) => (
                    <option key={supervisor._id} value={supervisor._id}>
                      {supervisor.name}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  value={assignData.officerId}
                  onChange={(e) => setAssignData({ ...assignData, officerId: e.target.value })}
                  className="w-full p-2.5 text-sm rounded-lg"
                  style={{
                    backgroundColor: colors.bg,
                    border: `1px solid ${colors.border}`,
                    color: colors.text,
                  }}
                >
                  <option value="">Select Officer</option>
                  {getOfficers().map((officer) => (
                    <option key={officer._id} value={officer._id}>
                      {officer.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex gap-2 mt-4">
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
                onClick={handleAssignComplaint}
                disabled={
                  (assignData.type === "supervisor" && !assignData.supervisorId) ||
                  (assignData.type === "officer" && !assignData.officerId)
                }
                className="flex-1 p-2.5 rounded-lg font-medium text-sm text-white disabled:opacity-50"
                style={{ backgroundColor: colors.primary }}
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {showUpdateModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-xl p-4 sm:p-6 max-w-md w-full"
            style={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
            }}
          >
            <h3 className="text-lg sm:text-xl font-bold mb-3">Update Complaint</h3>
            <div className="space-y-3">
              <div className="mb-3">
                <p className="font-medium text-sm">Complaint:</p>
                <p className="text-xs opacity-75">{selectedComplaint.title}</p>
              </div>
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
                <option value="">Select Status</option>
                <option value="CREATED">Created</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="REJECTED">Rejected</option>
              </select>
              <select
                value={updateData.priority}
                onChange={(e) => setUpdateData({ ...updateData, priority: e.target.value })}
                className="w-full p-2.5 text-sm rounded-lg"
                style={{
                  backgroundColor: colors.bg,
                  border: `1px solid ${colors.border}`,
                  color: colors.text,
                }}
              >
                <option value="">Select Priority</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
              <textarea
                placeholder="Remarks"
                value={updateData.remarks}
                onChange={(e) => setUpdateData({ ...updateData, remarks: e.target.value })}
                className="w-full p-2.5 text-sm rounded-lg"
                rows="3"
                style={{
                  backgroundColor: colors.bg,
                  border: `1px solid ${colors.border}`,
                  color: colors.text,
                }}
              />
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
                onClick={handleUpdateComplaint}
                disabled={!updateData.status && !updateData.remarks && !updateData.priority}
                className="flex-1 p-2.5 rounded-lg font-medium text-sm text-white disabled:opacity-50"
                style={{ backgroundColor: colors.primary }}
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {showOverrideModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-xl p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
            style={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
            }}
          >
            <h3 className="text-lg sm:text-xl font-bold mb-3">
              {overrideData.action === "REOPEN" ? "Reopen Complaint" : "Admin Override"}
            </h3>

            <div className="space-y-3">
              <div
                className="mb-3 p-2 rounded-lg text-sm"
                style={{ backgroundColor: `${colors.border}20` }}
              >
                <p className="font-medium text-xs">Complaint:</p>
                <p className="text-xs opacity-90">{selectedComplaint.title}</p>
                <p className="text-2xs mt-1">
                  Status: <span className="font-medium">{selectedComplaint.status}</span>
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Action *</label>
                <select
                  value={overrideData.action}
                  onChange={(e) => setOverrideData({ ...overrideData, action: e.target.value })}
                  className="w-full p-2.5 text-sm rounded-lg"
                  style={{
                    backgroundColor: colors.bg,
                    borderColor: colors.border,
                    color: colors.text,
                  }}
                >
                  <option value="">-- Select action --</option>
                  <option value="REOPEN">Reopen Complaint</option>
                  <option value="FORCE_RESOLVE">Force Resolve</option>
                  <option value="FORCE_CLOSE">Force Close</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Reason *</label>
                <textarea
                  placeholder="Explain why..."
                  value={overrideData.reason}
                  onChange={(e) => setOverrideData({ ...overrideData, reason: e.target.value })}
                  className="w-full p-2.5 text-sm rounded-lg"
                  rows="2"
                  style={{
                    backgroundColor: colors.bg,
                    borderColor: colors.border,
                    color: colors.text,
                  }}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  setShowOverrideModal(false);
                  setOverrideData({ action: "", reason: "", notes: "" });
                }}
                className="flex-1 p-2.5 rounded-lg font-medium text-sm"
                style={{
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleOverrideComplaint}
                disabled={!overrideData.action || !overrideData.reason.trim()}
                className="flex-1 p-2.5 rounded-lg font-medium text-sm text-white disabled:opacity-50"
                style={{
                  backgroundColor:
                    overrideData.action === "REOPEN"
                      ? colors.warning
                      : overrideData.action === "FORCE_RESOLVE"
                      ? colors.success
                      : colors.primary,
                }}
              >
                {overrideData.action || "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer - Mobile Optimized */}
      <footer
        className="mt-8 py-4 sm:py-6 px-3 sm:px-4 border-t"
        style={{
          borderColor: colors.border,
          backgroundColor: colors.card,
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
                <span className="text-sm sm:text-base font-bold" style={{ color: colors.primary }}>
                  CivicFix Admin
                </span>
              </div>
              <p className="text-xs opacity-75 mt-1">
                Complaint Management System - Admin Panel
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

export default AdminDashboard;
