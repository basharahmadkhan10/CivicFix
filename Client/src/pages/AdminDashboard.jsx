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
          card: "#f3e8ff", // Light purple tint
          border: "#d8b4fe", // Light purple border
          accent: "#000000",
          success: "#10b981",
          warning: "#f59e0b",
          danger: "#ef4444",
          info: "#8b5cf6", // Purple for info
          primary: "#8b5cf6", // Purple primary
          pending: "#f97316", // Orange for pending
          categoryBg: "#e2e8f0",
          categoryText: "#1e293b",
        }
      : {
          bg: "#000000",
          text: "#ffffff",
          card: "#1a0f2e", // Dark purple tint
          border: "#4c1d95", // Dark purple border
          accent: "#ffffff",
          success: "#10b981",
          warning: "#f59e0b",
          danger: "#ef4444",
          info: "#a78bfa", // Light purple for info
          primary: "#8b5cf6", // Purple primary
          pending: "#f97316", // Orange for pending
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
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
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

      const responseTimesData = categoriesData.slice(0, 5).map((cat) => {
        const categoryComplaints = allComplaints.filter(
          (c) => c.category === cat.category && c.status === "RESOLVED",
        );

        let avgTime = 0;
        if (categoryComplaints.length > 0) {
          const totalTime = categoryComplaints.reduce((sum, complaint) => {
            const created = new Date(complaint.createdAt);
            const resolved = new Date(complaint.updatedAt);
            return sum + (resolved - created) / (1000 * 60 * 60 * 24);
          }, 0);
          avgTime = totalTime / categoryComplaints.length;
        }

        return {
          category: cat.category,
          avgTime: avgTime.toFixed(1),
        };
      });

      setAnalyticsData({
        categories: categoriesData,
        trends: trendsData,
        responseTimes: responseTimesData,
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
      console.log(`Attempting to ${action} user: ${userId}`);

      const response = await api.patch(`/v1/admin/users/${userId}/manage`, {
        action,
      });

      if (response.data.success) {
        toast.success(`User ${action}d successfully!`);
        fetchDashboardData();
      }
    } catch (error) {
      console.error(`Error ${action} user:`, error);
      console.error("Full error object:", error.response);

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
        console.log("Assigning to supervisor:", assignData.supervisorId);
        console.log("Complaint ID:", selectedComplaint._id);

        response = await api.patch(
          `/v1/admin/complaints/${selectedComplaint._id}/assign`,
          {
            supervisorId: assignData.supervisorId,
          },
        );
      } else {
        console.log("Assigning to officer:", assignData.officerId);
        response = await api.patch(
          `/v1/admin/complaints/${selectedComplaint._id}/assign-officer`,
          {
            officerId: assignData.officerId,
          },
        );
      }

      console.log("Response:", response.data);

      if (response.data.success) {
        toast.success("Complaint assigned successfully!");
        setShowAssignModal(false);
        setAssignData({ supervisorId: "", officerId: "", type: "supervisor" });
        fetchDashboardData();
      }
    } catch (error) {
      console.error("Error assigning complaint:", error);
      console.error("Error response:", error.response?.data);

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

  const handleReassignComplaint = async () => {
    if (!selectedComplaint) return;

    try {
      const response = await api.patch(
        `/v1/admin/complaints/${selectedComplaint._id}/reassign`,
        {
          assigneeId: reassignData.newSupervisorId,
          assigneeRole: "SUPERVISOR",
          reason: reassignData.reason,
        },
      );
      if (response.data.success) {
        toast.success("Complaint reassigned successfully!");
        setShowReassignModal(false);
        setReassignData({ newSupervisorId: "", reason: "" });
        fetchDashboardData();
      }
    } catch (error) {
      console.error("Error reassigning complaint:", error);
      toast.error(
        `Failed to reassign complaint: ${error.response?.data?.message || error.message}`,
        {
          position: "top-right",
          duration: 5000,
        },
      );
    }
  };

  const handleEscalateComplaint = async () => {
    if (!selectedComplaint) return;

    try {
      const response = await api.patch(
        `/v1/admin/complaints/${selectedComplaint._id}/escalate`,
        escalateData,
      );
      if (response.data.success) {
        toast.success("Complaint escalated successfully!");
        setShowEscalateModal(false);
        setEscalateData({ level: "HIGH", reason: "", deadline: "" });
        fetchDashboardData();
      }
    } catch (error) {
      console.error("Error escalating complaint:", error);
      toast.error(
        `Failed to escalate complaint: ${error.response?.data?.message || error.message}`,
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
      console.log("DEBUG - Override request details:", {
        complaintId: selectedComplaint._id,
        currentStatus: selectedComplaint.status,
        overrideData: overrideData,
      });

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

      console.log("DEBUG - Sending payload:", payload);

      const response = await api.patch(
        `/v1/admin/complaints/${selectedComplaint._id}/override`,
        payload,
      );

      console.log("DEBUG - Response:", response.data);

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
      console.error("FULL ERROR DETAILS:", {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
        message: error.message,
        config: error.config,
      });

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
        return colors.danger;
      case "ESCALATED":
        return "#f97316";
      default:
        return "#6b7280";
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "ADMIN":
        return colors.primary;
      case "SUPERVISOR":
        return colors.info;
      case "OFFICER":
        return colors.warning;
      case "CITIZEN":
        return colors.success;
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
      case "RESOLVED":
        return <CheckCircle size={16} />;
      case "REJECTED":
        return <XCircle size={16} />;
      case "ESCALATED":
        return <AlertTriangle size={16} />;
      default:
        return <AlertCircle size={16} />;
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "ADMIN":
        return <Shield size={16} />;
      case "SUPERVISOR":
        return <UserCheck size={16} />;
      case "OFFICER":
        return <User size={16} />;
      case "CITIZEN":
        return <Users size={16} />;
      default:
        return <User size={16} />;
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
      className="p-6 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer"
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
        <ChevronRight size={20} className="opacity-50" />
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
                Admin Dashboard
              </h1>
            </div>
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
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
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
              title="Refresh Dashboard"
            >
              <RefreshCw
                size={18}
                className="hover:rotate-180 transition-transform duration-500"
              />
            </button>

            <button
              onClick={() => setShowUserModal(true)}
              className="px-4 py-2 rounded-xl font-medium flex items-center space-x-2 transition-all duration-300 hover:scale-105"
              style={{
                backgroundColor: colors.primary,
                color: "white",
              }}
            >
              <UserPlus size={18} />
              <span>New User</span>
            </button>

            <button
              onClick={handleExportReport}
              className="px-4 py-2 rounded-xl font-medium flex items-center space-x-2 transition-all duration-300 hover:scale-105"
              style={{
                backgroundColor: colors.success,
                color: "white",
              }}
            >
              <DownloadCloud size={18} />
              <span>Export</span>
            </button>

            <div className="relative">
              <button
                className="flex items-center space-x-2 p-2"
                onClick={(e) => {
                  e.stopPropagation();
                  const dropdown = document.getElementById("profile-dropdown");
                  if (dropdown) dropdown.classList.toggle("hidden");
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: colors.primary,
                    color: "white",
                  }}
                >
                  <span>{getUserInitials(user?.name)}</span>
                </div>
                <span className="font-medium hidden md:inline">
                  {user?.name || "Admin"}
                </span>
              </button>

              <div
                id="profile-dropdown"
                className="absolute right-0 mt-2 w-48 rounded-xl hidden transition-all duration-300 z-50"
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
                    style={{ backgroundColor: `${colors.border}10` }}
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
          {["dashboard", "complaints", "users"].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                toast.info(`Switched to ${tab} tab`, {
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
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
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

      {/* Main Content */}
      <main className="p-4 md:p-6">
        {activeTab === "dashboard" && (
        <>
            <div className="mb-12 mt-12">
              <h1 className="text-2xl md:text-5xl font-bold m-2 mb-2">
                Welcome Back{" "}
                <span className="font-bolder text-2xl md:text-5xl font-sans italic">
                  {user?.name || "Admin"}
                </span>{" "}
                !
              </h1>
              <p className="opacity-75 m-2">
                Here's what's happening with your system today.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                title="Total Complaints"
                value={stats.totalComplaints || 0}
                color={colors.info}
                icon={<FileText size={24} />}
                onClick={() => setActiveTab("complaints")}
              />
              <StatCard
                title="Active Users"
                value={stats.activeUsers || 0}
                color={colors.success}
                icon={<Users size={24} />}
                subtitle={`Total: ${stats.totalUsers || 0}`}
                onClick={() => setActiveTab("users")}
              />
              <StatCard
                title="SLA Compliance"
                value={`${stats.slaCompliance || 0}%`}
                color={colors.warning}
                icon={<CheckCircle size={24} />}
              />
              <StatCard
                title="System Uptime"
                value={`${stats.systemUptime || 99.9}%`}
                color={colors.primary}
                icon={<Home size={24} />}
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div
                className="p-4 rounded-xl text-center"
                style={{
                  backgroundColor: colors.card,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <div
                  className="text-2xl font-bold mb-1"
                  style={{ color: colors.info }}
                >
                  {stats.supervisors || 0}
                </div>
                <div className="text-sm opacity-75">Supervisors</div>
              </div>
              <div
                className="p-4 rounded-xl text-center"
                style={{
                  backgroundColor: colors.card,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <div
                  className="text-2xl font-bold mb-1"
                  style={{ color: colors.warning }}
                >
                  {stats.officers || 0}
                </div>
                <div className="text-sm opacity-75">Officers</div>
              </div>
              <div
                className="p-4 rounded-xl text-center"
                style={{
                  backgroundColor: colors.card,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <div
                  className="text-2xl font-bold mb-1"
                  style={{ color: colors.success }}
                >
                  {stats.citizens || 0}
                </div>
                <div className="text-sm opacity-75">Citizens</div>
              </div>
              <div
                className="p-4 rounded-xl text-center"
                style={{
                  backgroundColor: colors.card,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <div
                  className="text-2xl font-bold mb-1"
                  style={{ color: colors.primary }}
                >
                  {stats.avgResolutionTime || 0}
                </div>
                <div className="text-sm opacity-75">Avg. Resolution (days)</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
              <div
                className="p-6 rounded-xl"
                style={{
                  backgroundColor: colors.card,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Recent Activity</h2>
                  <button
                    onClick={() => setActiveTab("complaints")}
                    className="text-sm opacity-75 hover:opacity-100"
                    style={{ color: colors.primary }}
                  >
                    View All →
                  </button>
                </div>
                <div className="space-y-4">
                  {auditTrail.slice(0, 5).map((audit, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg"
                      style={{ backgroundColor: `${colors.border}20` }}
                    >
                      <div
                        className="p-2 rounded"
                        style={{
                          backgroundColor: getRoleColor(audit.role) + "20",
                        }}
                      >
                        {getRoleIcon(audit.role)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{audit.action}</div>
                        <div className="text-sm opacity-75">
                          by {audit.actor?.name || "System"}
                        </div>
                        <div className="text-xs opacity-50 mt-1">
                          {new Date(audit.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "complaints" && (
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">
                  All Complaints
                </h1>
                <p className="opacity-75">
                  Manage all complaints in the system
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
                    className="pl-10 pr-4 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-purple-500"
                    style={{
                      backgroundColor: colors.card,
                      border: `1px solid ${colors.border}`,
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
                    className="px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all duration-300 "
                    style={{
                      backgroundColor: colors.card,
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
                      className="px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all duration-300 "
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

            {filteredComplaints.length === 0 ? (
              <div className="text-center py-8 opacity-75">
                <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-bold mb-2">No complaints found</h3>
                <p className="opacity-75 mb-6">
                  {searchQuery
                    ? "No complaints match your search criteria."
                    : "There are no complaints in the system yet."}
                </p>
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
                      <th className="text-left p-4 font-medium">Citizen</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Assigned To</th>
                      <th className="text-left p-4 font-medium">Date</th>
                      <th className="text-left p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredComplaints.map((complaint) => (
                      <tr
                        key={complaint._id}
                        style={{ borderBottom: `1px solid ${colors.border}` }}
                        className="hover:bg-opacity-50 transition-colors"
                      >
                        <td className="p-4">
                          <div className="font-medium">{complaint.title}</div>
                          <div className="text-sm opacity-75 mt-1 line-clamp-2">
                            {complaint.description?.substring(0, 100) || ""}
                            {complaint.description?.length > 100 ? "..." : ""}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <MapPin size={12} />
                            <span className="text-xs opacity-75">
                              {complaint.area || "N/A"}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm">
                            {complaint.user?.name || "N/A"}
                          </div>
                          <div className="text-xs opacity-75">
                            {complaint.user?.email || ""}
                          </div>
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
                            {complaint.assignedTo?.name ||
                              complaint.assignedToOfficer?.name ||
                              "Not assigned"}
                          </div>
                          <div className="text-xs opacity-75">
                            {complaint.assignedTo?.role ||
                              complaint.assignedToOfficer?.role ||
                              ""}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm">
                            {new Date(complaint.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedComplaint(complaint);
                                setShowUpdateModal(true);
                              }}
                              className="px-3 py-1 rounded text-sm transition-all duration-300 hover:scale-105"
                              style={{
                                backgroundColor: colors.card,
                                border: `1px solid ${colors.border}`,
                              }}
                            >
                              Update
                            </button>

                            {complaint.status !== "RESOLVED" && (
                              <button
                                onClick={() => {
                                  setSelectedComplaint(complaint);
                                  setShowAssignModal(true);
                                }}
                                className="px-3 py-1 rounded text-sm transition-all duration-300 hover:scale-105"
                                style={{
                                  backgroundColor: colors.info,
                                  color: "white",
                                }}
                              >
                                Assign
                              </button>
                            )}

                            {complaint.status === "RESOLVED" ? (
                              <button
                                onClick={() => {
                                  setSelectedComplaint(complaint);
                                  setOverrideData({
                                    action: "REOPEN",
                                    reason: "",
                                    notes: "",
                                  });
                                  setShowOverrideModal(true);
                                }}
                                className="px-3 py-1 rounded text-sm transition-all duration-300 hover:scale-105"
                                style={{
                                  backgroundColor: colors.warning,
                                  color: "white",
                                }}
                              >
                                Reopen
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedComplaint(complaint);
                                  setShowOverrideModal(true);
                                }}
                                className="px-3 py-1 rounded text-sm transition-all duration-300 hover:scale-105"
                                style={{
                                  backgroundColor: colors.primary,
                                  color: "white",
                                }}
                              >
                                Override
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
        {activeTab === "users" && (
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">
                  User Management
                </h1>
                <p className="opacity-75">Manage all system users</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-10 pr-4 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-purple-500"
                    style={{
                      backgroundColor: colors.card,
                      border: `1px solid ${colors.border}`,
                    }}
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto">
                  <button
                    onClick={() => setSelectedRoleFilter("ALL")}
                    className="px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all duration-300 "
                    style={{
                      backgroundColor:
                        selectedRoleFilter === "ALL"
                          ? colors.primary
                          : colors.card,
                      color:
                        selectedRoleFilter === "ALL" ? "white" : colors.text,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    All
                  </button>
                  {["ADMIN", "SUPERVISOR", "OFFICER", "CITIZEN"].map((role) => (
                    <button
                      key={role}
                      onClick={() => setSelectedRoleFilter(role)}
                      className="px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all duration-300 "
                      style={{
                        backgroundColor:
                          selectedRoleFilter === role
                            ? getRoleColor(role)
                            : colors.card,
                        color:
                          selectedRoleFilter === role ? "white" : colors.text,
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
              <div className="text-center py-8 opacity-75">
                <Users size={48} className="mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-bold mb-2">No users found</h3>
                <p className="opacity-75 mb-6">
                  {searchQuery
                    ? "No users match your search criteria."
                    : "There are no users in the system yet."}
                </p>
                <button
                  onClick={() => setShowUserModal(true)}
                  className="px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:scale-105"
                  style={{
                    backgroundColor: colors.primary,
                    color: "white",
                  }}
                >
                  Create First User
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers.map((user) => (
                  <div
                    key={user._id}
                    className="p-6 rounded-xl transition-all duration-300 hover:scale-[1.02]"
                    style={{
                      backgroundColor: colors.card,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center"
                          style={{
                            backgroundColor: getRoleColor(user.role),
                            color: "white",
                          }}
                        >
                          {getRoleIcon(user.role)}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{user.name}</h3>
                          <p className="text-sm opacity-75">{user.email}</p>
                        </div>
                      </div>
                      <div className="relative group">
                        <button
                          className="p-2 rounded-lg hover:bg-opacity-50"
                          style={{ backgroundColor: `${colors.border}50` }}
                        >
                          <MoreVertical size={16} />
                        </button>
                        <div
                          className="absolute right-0 mt-1 w-48 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10"
                          style={{
                            backgroundColor: colors.card,
                            border: `1px solid ${colors.border}`,
                            backdropFilter: "blur(10px)",
                          }}
                        >
                          <div className="py-1">
                            {user.isActive === false && (
                              <button
                                onClick={() =>
                                  handleManageUser(user._id, "activate")
                                }
                                className="flex items-center gap-2 w-full px-4 py-2 hover:bg-opacity-80 text-left text-sm"
                              >
                                <Play size={14} />
                                Activate
                              </button>
                            )}
                            {user.isActive !== false && (
                              <button
                                onClick={() =>
                                  handleManageUser(user._id, "deactivate")
                                }
                                className="flex items-center gap-2 w-full px-4 py-2 hover:bg-opacity-80 text-left text-sm"
                              >
                                <Pause size={14} />
                                Deactivate
                              </button>
                            )}
                            <button
                              onClick={() =>
                                handleManageUser(user._id, "reset_password")
                              }
                              className="flex items-center gap-2 w-full px-4 py-2 hover:bg-opacity-80 text-left text-sm"
                            >
                              <RotateCcw size={14} />
                              Reset Password
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="opacity-75">Role:</span>
                        <span
                          className="font-medium px-2 py-1 rounded"
                          style={{
                            backgroundColor: `${getRoleColor(user.role)}20`,
                            color: getRoleColor(user.role),
                          }}
                        >
                          {user.role}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="opacity-75">Status:</span>
                        <span
                          className={`font-medium ${user.isActive ? "text-green-600" : "text-red-600"}`}
                        >
                          {user.isActive ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="opacity-75">Joined:</span>
                        <span className="font-medium">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {user.department && (
                        <div className="flex justify-between text-sm">
                          <span className="opacity-75">Department:</span>
                          <span className="font-medium">{user.department}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-2xl p-6 max-w-md w-full"
            style={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
            }}
          >
            <h3 className="text-xl font-bold mb-4">Create New User</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                value={newUserData.name}
                onChange={(e) =>
                  setNewUserData({ ...newUserData, name: e.target.value })
                }
                className="w-full p-3 rounded-lg"
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
                onChange={(e) =>
                  setNewUserData({ ...newUserData, email: e.target.value })
                }
                className="w-full p-3 rounded-lg"
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
                onChange={(e) =>
                  setNewUserData({ ...newUserData, password: e.target.value })
                }
                className="w-full p-3 rounded-lg"
                style={{
                  backgroundColor: colors.bg,
                  border: `1px solid ${colors.border}`,
                  color: colors.text,
                }}
              />
              <select
                value={newUserData.role}
                onChange={(e) =>
                  setNewUserData({ ...newUserData, role: e.target.value })
                }
                className="w-full p-3 rounded-lg"
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
              <input
                type="text"
                placeholder="Department (optional)"
                value={newUserData.department}
                onChange={(e) =>
                  setNewUserData({ ...newUserData, department: e.target.value })
                }
                className="w-full p-3 rounded-lg"
                style={{
                  backgroundColor: colors.bg,
                  border: `1px solid ${colors.border}`,
                  color: colors.text,
                }}
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowUserModal(false)}
                className="flex-1 p-3 rounded-lg font-medium"
                style={{
                  backgroundColor: colors.card,
                  border: `1px solid ${colors.border}`,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                disabled={
                  !newUserData.name ||
                  !newUserData.email ||
                  !newUserData.password
                }
                className="flex-1 p-3 rounded-lg font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: colors.primary }}
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      )}
      {showAssignModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-2xl p-6 max-w-md w-full"
            style={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
            }}
          >
            <h3 className="text-xl font-bold mb-4">Assign Complaint</h3>
            <div className="space-y-4">
              <div className="mb-4">
                <p className="font-medium">Complaint:</p>
                <p className="text-sm opacity-75">{selectedComplaint.title}</p>
              </div>
              <select
                value={assignData.type}
                onChange={(e) =>
                  setAssignData({ ...assignData, type: e.target.value })
                }
                className="w-full p-3 rounded-lg"
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
                  onChange={(e) =>
                    setAssignData({
                      ...assignData,
                      supervisorId: e.target.value,
                    })
                  }
                  className="w-full p-3 rounded-lg"
                  style={{
                    backgroundColor: colors.bg,
                    border: `1px solid ${colors.border}`,
                    color: colors.text,
                  }}
                >
                  <option value="">Select Supervisor</option>
                  {getSupervisors().map((supervisor) => (
                    <option key={supervisor._id} value={supervisor._id}>
                      {supervisor.name} ({supervisor.email})
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  value={assignData.officerId}
                  onChange={(e) =>
                    setAssignData({ ...assignData, officerId: e.target.value })
                  }
                  className="w-full p-3 rounded-lg"
                  style={{
                    backgroundColor: colors.bg,
                    border: `1px solid ${colors.border}`,
                    color: colors.text,
                  }}
                >
                  <option value="">Select Officer</option>
                  {getOfficers().map((officer) => (
                    <option key={officer._id} value={officer._id}>
                      {officer.name} ({officer.email})
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAssignModal(false)}
                className="flex-1 p-3 rounded-lg font-medium"
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
                  (assignData.type === "supervisor" &&
                    !assignData.supervisorId) ||
                  (assignData.type === "officer" && !assignData.officerId)
                }
                className="flex-1 p-3 rounded-lg font-medium text-white disabled:opacity-50"
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
            className="rounded-2xl p-6 max-w-md w-full"
            style={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
            }}
          >
            <h3 className="text-xl font-bold mb-4">Update Complaint</h3>
            <div className="space-y-4">
              <div className="mb-4">
                <p className="font-medium">Complaint:</p>
                <p className="text-sm opacity-75">{selectedComplaint.title}</p>
              </div>
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
                <option value="">Select Status</option>
                <option value="CREATED">Created</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="REJECTED">Rejected</option>
              </select>
              <select
                value={updateData.priority}
                onChange={(e) =>
                  setUpdateData({ ...updateData, priority: e.target.value })
                }
                className="w-full p-3 rounded-lg"
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
                onChange={(e) =>
                  setUpdateData({ ...updateData, remarks: e.target.value })
                }
                className="w-full p-3 rounded-lg"
                rows="3"
                style={{
                  backgroundColor: colors.bg,
                  border: `1px solid ${colors.border}`,
                  color: colors.text,
                }}
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowUpdateModal(false)}
                className="flex-1 p-3 rounded-lg font-medium"
                style={{
                  backgroundColor: colors.card,
                  border: `1px solid ${colors.border}`,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateComplaint}
                disabled={
                  !updateData.status &&
                  !updateData.remarks &&
                  !updateData.priority
                }
                className="flex-1 p-3 rounded-lg font-medium text-white disabled:opacity-50"
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
            className="rounded-2xl p-6 max-w-md w-full"
            style={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
            }}
          >
            <h3 className="text-xl font-bold mb-4">
              {overrideData.action === "REOPEN"
                ? "Reopen Complaint"
                : "Admin Override"}
            </h3>

            <div className="space-y-4">
              <div
                className="mb-4 p-3 rounded-lg"
                style={{ backgroundColor: `${colors.border}20` }}
              >
                <p className="font-medium text-sm">Complaint Details:</p>
                <p className="text-sm opacity-90">{selectedComplaint.title}</p>
                <p className="text-xs opacity-70 mt-1">
                  ID: {selectedComplaint._id?.substring(0, 8)}...
                </p>
                <p className="text-xs mt-1">
                  Status:{" "}
                  <span className="font-medium">
                    {selectedComplaint.status}
                  </span>
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Action *</label>
                <select
                  value={overrideData.action}
                  onChange={(e) =>
                    setOverrideData({ ...overrideData, action: e.target.value })
                  }
                  className="w-full p-3 rounded-lg border"
                  style={{
                    backgroundColor: colors.bg,
                    borderColor: colors.border,
                    color: colors.text,
                  }}
                >
                  <option value="">-- Select an action --</option>
                  <option value="REOPEN">Reopen Complaint</option>
                  <option value="FORCE_RESOLVE">Force Resolve</option>
                  <option value="FORCE_CLOSE">Force Close</option>
                  <option value="REASSIGN">
                    Reassign to Different Officer
                  </option>
                  <option value="ESCALATE">Escalate to Higher Authority</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Reason for override *
                </label>
                <textarea
                  placeholder="Explain why you are overriding this complaint..."
                  value={overrideData.reason}
                  onChange={(e) =>
                    setOverrideData({ ...overrideData, reason: e.target.value })
                  }
                  className="w-full p-3 rounded-lg border"
                  rows="3"
                  style={{
                    backgroundColor: colors.bg,
                    borderColor: colors.border,
                    color: colors.text,
                  }}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Additional Notes (Optional)
                </label>
                <textarea
                  placeholder="Any additional information..."
                  value={overrideData.notes}
                  onChange={(e) =>
                    setOverrideData({ ...overrideData, notes: e.target.value })
                  }
                  className="w-full p-3 rounded-lg border"
                  rows="2"
                  style={{
                    backgroundColor: colors.bg,
                    borderColor: colors.border,
                    color: colors.text,
                  }}
                />
              </div>

              {overrideData.action === "REOPEN" && (
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                  <div className="flex items-start gap-2">
                    <AlertTriangle
                      size={16}
                      className="text-yellow-600 mt-0.5"
                    />
                    <div className="text-sm text-yellow-700 dark:text-yellow-400">
                      <strong>Warning:</strong> This will change the complaint
                      status from RESOLVED back to IN_PROGRESS.
                    </div>
                  </div>
                </div>
              )}

              {overrideData.action === "FORCE_RESOLVE" && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                  <div className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-600 mt-0.5" />
                    <div className="text-sm text-green-700 dark:text-green-400">
                      <strong>Note:</strong> This will mark the complaint as
                      RESOLVED regardless of its current state.
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowOverrideModal(false);
                  setOverrideData({ action: "", reason: "", notes: "" });
                }}
                className="flex-1 p-3 rounded-lg font-medium border transition-colors"
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
                className="flex-1 p-3 rounded-lg font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor:
                    overrideData.action === "REOPEN"
                      ? colors.warning
                      : overrideData.action === "FORCE_RESOLVE"
                        ? colors.success
                        : overrideData.action === "REJECT"
                          ? colors.danger
                          : colors.primary,
                }}
              >
                {overrideData.action === "REOPEN" && "Reopen Complaint"}
                {overrideData.action === "FORCE_RESOLVE" && "Force Resolve"}
                {overrideData.action === "FORCE_CLOSE" && "Force Close"}
                {overrideData.action === "REASSIGN" && "Reassign"}
                {overrideData.action === "ESCALATE" && "Escalate"}
                {!overrideData.action && "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
      <footer
        className="mt-12 py-6 px-4 border-t"
        style={{
          borderColor: colors.border,
          backgroundColor: colors.card,
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center space-x-2">
                <img
                  src={currentLogo}
                  alt="CivicFix Logo"
                  className="h-14 w-auto object-contain"
                />
                <span
                  className="font-bold text-lg"
                  style={{ color: colors.primary }}
                >
                  CivicFix Admin
                </span>
              </div>
              <p className="text-sm opacity-75 mt-1">
                Complaint Management System - Admin Panel
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

export default AdminDashboard;
