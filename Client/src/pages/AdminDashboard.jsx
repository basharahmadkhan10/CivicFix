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

// Font injection
const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap";

function injectFont() {
  if (!document.querySelector(`link[href="${FONT_HREF}"]`)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = FONT_HREF;
    document.head.appendChild(link);
  }
}

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

  // Modern theme with #97AB33 (matching HomePage)
  const getThemeColors = () => {
    const accentColor = "#97AB33";
    const isDark = theme === "dark";
    
    if (!isDark) {
      return {
        bg: "#FFFFFF",
        text: "#000000",
        textMuted: "#666666",
        card: "#FFFFFF",
        cardHover: "#F5F5F5",
        border: "rgba(0,0,0,0.1)",
        accent: accentColor,
        accentLight: "rgba(151, 171, 51, 0.1)",
        success: "#38A169",
        warning: "#F6AD55",
        danger: "#FC8181",
        info: "#4299E1",
        primary: accentColor,
        categoryBg: "#F0F0F0",
        categoryText: "#333333",
        muted: "#666666",
        navBg: "rgba(255,255,255,0.95)",
        buttonPrimaryText: "#FFFFFF",
        shadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      };
    }
    return {
      bg: "#0A0A0A",
      text: "#FFFFFF",
      textMuted: "#A0A0A0",
      card: "#1A1A1A",
      cardHover: "#222222",
      border: "rgba(255,255,255,0.1)",
      accent: accentColor,
      accentLight: "rgba(151, 171, 51, 0.15)",
      success: "#68D391",
      warning: "#FBD38D",
      danger: "#FC8181",
      info: "#63B3ED",
      primary: accentColor,
      categoryBg: "#2D3748",
      categoryText: "#E2E8F0",
      muted: "#A0A0A0",
      navBg: "rgba(10,10,10,0.95)",
      buttonPrimaryText: "#000000",
      shadow: "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)",
    };
  };

  const colors = getThemeColors();
  const isDark = theme === "dark";
  const currentLogo = theme === "dark" ? darkLogo : lightLogo;

  // Inject font on mount
  useEffect(() => {
    injectFont();
  }, []);

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
            colors.accent,
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
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slideDown { animation: slideDown 0.3s ease-out; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Header - Matching HomePage style */}
      <header
        className="sticky top-0 z-50 px-3 sm:px-4 md:px-6 py-2 sm:py-3"
        style={{
          backgroundColor: colors.navBg,
          backdropFilter: "blur(12px)",
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <div className="flex justify-between items-center">
          {/* Logo - Matching HomePage exactly */}
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
              border: `1px solid ${colors.border}`,
            }}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Desktop Actions - Matching HomePage style */}
          <div className="hidden md:flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "6px",
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.card,
                color: colors.text,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
              }}
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
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "6px",
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.card,
                color: colors.text,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
              }}
            >
              <RefreshCw size={18} />
            </button>

            <button
              onClick={() => setShowUserModal(true)}
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                fontWeight: "600",
                backgroundColor: colors.accent,
                color: colors.buttonPrimaryText,
                textDecoration: "none",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <UserPlus size={16} />
              <span className="hidden lg:inline">New User</span>
            </button>

            <button
              onClick={handleExportReport}
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                fontWeight: "600",
                backgroundColor: colors.success,
                color: "#FFF",
                textDecoration: "none",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <DownloadCloud size={16} />
              <span className="hidden lg:inline">Export</span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                style={{
                  padding: "8px 12px",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: colors.text,
                  textDecoration: "none",
                  border: `1px solid ${colors.border}`,
                  borderRadius: "6px",
                  backgroundColor: colors.card,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 0.2s ease",
                }}
                onClick={(e) => { e.stopPropagation(); setProfileDropdownOpen(!profileDropdownOpen); }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = colors.accentLight)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = colors.card)}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: colors.accent }}
                >
                  <span style={{ color: isDark ? "#000" : "#FFF", fontSize: "12px", fontWeight: "600" }}>
                    {getUserInitials(user?.name)}
                  </span>
                </div>
                <span className="hidden lg:inline">{user?.name?.split(" ")[0] || "Admin"}</span>
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

      {/* Main Content - Rest remains the same but with updated colors */}
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

        {/* Complaints and Users sections remain the same but with updated color references */}
        {activeTab === "complaints" && (
          <div>
            {/* ... existing complaints code ... */}
          </div>
        )}

        {activeTab === "users" && (
          <div>
            {/* ... existing users code ... */}
          </div>
        )}
      </main>

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
