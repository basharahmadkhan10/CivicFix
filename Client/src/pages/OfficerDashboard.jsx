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
          card: "#fff9e6", // Light yellow tint
          border: "#ffe5b4", // Light orange border
          accent: "#000000",
          success: "#10b981",
          warning: "#f59e0b",
          danger: "#ef4444",
          info: "#f97316", // Orange for info
          primary: "#f97316", // Orange primary
          pending: "#8b5cf6", // Purple for pending verification
          officer: "#f59e0b", // Yellow/orange for officer theme
        }
      : {
          bg: "#000000",
          text: "#ffffff",
          card: "#1a1500", // Dark yellow tint
          border: "#5c4a00", // Dark gold border
          accent: "#ffffff",
          success: "#10b981",
          warning: "#f59e0b",
          danger: "#ef4444",
          info: "#f97316", // Orange for info
          primary: "#f97316", // Orange primary
          pending: "#a78bfa", // Purple for pending verification
          officer: "#f59e0b", // Yellow/orange for officer theme
        };

  const currentLogo = theme === "dark" ? darkLogo : lightLogo;

  useEffect(() => {
    fetchDashboardData();
    fetchUserProfile();
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

      // Fetch officer dashboard stats
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

      // Fetch assigned complaints
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

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(imageFile.type)) {
      toast.error("Please upload a valid image (JPEG, PNG, WEBP)", {
        position: "top-right",
        duration: 3000,
      });
      return;
    }

    // Validate file size (5MB max)
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

      // Log what we're sending
      console.log(
        "Uploading file:",
        imageFile.name,
        imageFile.type,
        imageFile.size,
      );

      // Make sure the field name matches what backend expects
      formData.append("image", imageFile);

      if (verificationRemarks.trim()) {
        formData.append("remarks", verificationRemarks.trim());
      }

      // Log FormData contents (for debugging)
      for (let pair of formData.entries()) {
        console.log(
          pair[0] + ": " + (pair[0] === "image" ? pair[1].name : pair[1]),
        );
      }

      const response = await api.patch(
        `/v1/officer/complaints/${complaintId}/resolve`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          // Add timeout
          timeout: 30000, // 30 seconds
        },
      );

      console.log("Response:", response.data);

      if (response.data.success) {
        toast.success("Complaint submitted for verification successfully!", {
          position: "top-right",
          duration: 4000,
        });

        // Clear the form
        setImageFile(null);
        setVerificationRemarks("");
        setSelectedComplaint(null);

        // Reset file input
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = "";

        // Refresh data
        await fetchDashboardData();
      }
    } catch (error) {
      console.error("Error resolving complaint:", error);

      // Better error handling
      if (error.code === "ECONNABORTED") {
        toast.error("Request timeout. Please try again.", {
          position: "top-right",
          duration: 5000,
        });
      } else if (error.response) {
        // The request was made and the server responded with a status code
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);

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
        // The request was made but no response was received
        console.error("No response received:", error.request);
        toast.error("No response from server. Please check your connection.", {
          position: "top-right",
          duration: 5000,
        });
      } else {
        // Something happened in setting up the request
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
      case "IN_PROGRESS":
        return colors.warning;
      case "PENDING_VERIFICATION":
        return colors.pending;
      case "RESOLVED":
        return colors.success;
      case "REJECTED":
        return colors.danger;
      default:
        return colors.info;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "IN_PROGRESS":
        return <Clock size={16} />;
      case "PENDING_VERIFICATION":
        return <AlertOctagon size={16} />;
      case "RESOLVED":
        return <CheckCircle size={16} />;
      default:
        return <AlertCircle size={16} />;
    }
  };

  const getButtonText = (status) => {
    switch (status) {
      case "IN_PROGRESS":
        return "Submit for Verification";
      case "PENDING_VERIFICATION":
        return "Re-submit Resolution";
      default:
        return "Submit Resolution";
    }
  };
  const navigateToProfile = () => {
    toast.info("Loading profile...", {
      position: "top-right",
      duration: 1500,
    });
    navigate("/profile");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

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
            <div className="flex items-center space-x-4">
              <img
                src={currentLogo}
                alt="CivicFix Logo"
                className="h-14 w-auto object-contain"
              />
            </div>
            <div>
              <h1
                className="text-xl font-bold"
                style={{ color: colors.primary }}
              >
                Officer Dashboard
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors duration-200 hover:scale-105"
              style={{
                backgroundColor: theme === "dark" ? "#0a0a0a" : "#f5f5f5",
                borderColor: theme === "dark" ? "#1a1a1a" : "#e5e5e5",
                color: theme === "dark" ? "#ffffff" : "#000000",
              }}
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
              onClick={() => fetchDashboardData()}
              className="p-3 rounded-xl transition-all duration-300 hover:scale-110"
              style={{
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
              }}
              title="Refresh"
            >
              <RefreshCw
                size={18}
                className="hover:rotate-180 transition-transform duration-500"
              />
            </button>

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
                className="absolute right-0 mt-2 w-44 rounded-xl hidden transition-all duration-1000 z-50"
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
                    className="flex items-center space-x-2 w-full px-4 py-3 text-left transition-colors"
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
          {["dashboard", "assigned"].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                toast.info(`Switched to ${tab} tab`, {
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
        {activeTab === "assigned" && (
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h1
                  className="text-2xl md:text-3xl font-bold mb-2"
                  style={{ color: colors.primary }}
                >
                  Assigned Complaints
                </h1>
                <p className="opacity-75">Manage complaints assigned to you</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
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
                    className="pl-10 pr-4 py-2 rounded-lg w-full"
                    style={{
                      backgroundColor: colors.card,
                      border: `1px solid ${colors.border}`,
                      color: colors.text,
                    }}
                  />
                </div>

                {/* Filters */}
                <div className="flex gap-2 overflow-x-auto">
                  <button
                    onClick={() => setSearchQuery("")}
                    className="px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all duration-300 "
                    style={{
                      backgroundColor:
                        searchQuery === "" ? colors.primary : colors.card,
                      color: searchQuery === "" ? "white" : colors.text,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <Filter size={14} className="inline mr-1" />
                    All
                  </button>
                  {["IN_PROGRESS", "PENDING_VERIFICATION", "RESOLVED"].map(
                    (status) => (
                      <button
                        key={status}
                        onClick={() => setSearchQuery(status)}
                        className="px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all duration-300"
                        style={{
                          backgroundColor:
                            searchQuery === status
                              ? getStatusColor(status)
                              : colors.card,
                          color: searchQuery === status ? "white" : colors.text,
                          border: `1px solid ${colors.border}`,
                        }}
                      >
                        {status.replace("_", " ")}
                      </button>
                    ),
                  )}
                </div>
              </div>
            </div>

            {/* Image Upload Section */}
            <div
              className="mb-6 p-6 rounded-xl"
              style={{
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
                borderLeft: `4px solid ${colors.primary}`,
              }}
            >
              <h2 className="font-bold mb-4 flex items-center text-lg">
                <Camera
                  size={20}
                  className="mr-2"
                  style={{ color: colors.primary }}
                />
                Resolution Image Upload
              </h2>
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error("File size must be less than 5MB", {
                            position: "top-right",
                            duration: 3000,
                          });
                          return;
                        }
                        setImageFile(file);
                        toast.info(`Selected: ${file.name}`, {
                          position: "top-right",
                          duration: 2000,
                        });
                      }
                    }}
                    className="w-full p-3 rounded-lg"
                    style={{
                      backgroundColor: colors.bg,
                      border: `1px solid ${colors.border}`,
                      color: colors.text,
                    }}
                  />
                </div>
                <div className="text-sm">
                  {imageFile ? (
                    <span style={{ color: colors.primary }}>
                      ✓ {imageFile.name}
                    </span>
                  ) : (
                    <span className="opacity-75">No file selected</span>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <label className="block mb-2 font-medium text-sm">
                  Resolution Remarks (Optional)
                </label>
                <textarea
                  value={verificationRemarks}
                  onChange={(e) => setVerificationRemarks(e.target.value)}
                  placeholder="Add any remarks about the resolution..."
                  rows="2"
                  className="w-full p-3 rounded-lg text-sm"
                  style={{
                    backgroundColor: colors.bg,
                    border: `1px solid ${colors.border}`,
                    color: colors.text,
                  }}
                />
              </div>
              <p className="text-xs opacity-75 mt-3">
                Upload an image before submitting any complaint. Maximum file
                size: 5MB
              </p>
            </div>

            {/* Complaints List */}
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
                    {searchQuery
                      ? "No complaints match your search"
                      : "No complaints assigned"}
                  </h3>
                  <p className="opacity-75">
                    {searchQuery
                      ? "Try changing your search criteria."
                      : "You don't have any complaints assigned to you yet."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredComplaints.map((complaint) => (
                  <div
                    key={complaint._id}
                    className="p-6 rounded-xl"
                    style={{
                      backgroundColor: colors.card,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
                      {/* Complaint Details */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <span
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium"
                            style={{
                              backgroundColor: `${getStatusColor(
                                complaint.status,
                              )}20`,
                              color: getStatusColor(complaint.status),
                            }}
                          >
                            {getStatusIcon(complaint.status)}
                            <span>{complaint.status.replace("_", " ")}</span>
                          </span>
                          <span className="text-sm opacity-75">
                            {formatDate(complaint.createdAt)}
                          </span>
                        </div>

                        <h3 className="text-xl font-bold mb-3">
                          {complaint.title}
                        </h3>

                        <p className="opacity-90 mb-6">
                          {complaint.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 mb-6">
                          <span className="px-3 py-1 rounded-full text-sm bg-gray-100 dark:bg-gray-800">
                            {complaint.category}
                          </span>
                          <span className="text-sm opacity-75 flex items-center">
                            <MapPin size={14} className="mr-1" />
                            {complaint.area}
                          </span>
                          {complaint.priority && (
                            <span
                              className="px-3 py-1 rounded-full text-sm"
                              style={{
                                backgroundColor:
                                  complaint.priority === "HIGH" ||
                                  complaint.priority === "CRITICAL"
                                    ? `${colors.danger}20`
                                    : `${colors.warning}20`,
                                color:
                                  complaint.priority === "HIGH" ||
                                  complaint.priority === "CRITICAL"
                                    ? colors.danger
                                    : colors.warning,
                              }}
                            >
                              {complaint.priority}
                            </span>
                          )}
                        </div>

                        {/* Additional Info */}
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium">Reported by:</span>{" "}
                            {complaint.user?.name || "Anonymous"}
                            {complaint.user?.email &&
                              ` (${complaint.user.email})`}
                          </div>
                          <div>
                            <span className="font-medium">Supervisor:</span>{" "}
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
                              <span className="font-medium">Due Date:</span>{" "}
                              {formatDate(complaint.sla.dueBy)}
                              {new Date(complaint.sla.dueBy) < new Date() &&
                                " (OVERDUE)"}
                            </div>
                          )}
                        </div>

                        {/* Citizen Images */}
                        {complaint.images?.citizen?.length > 0 && (
                          <div
                            className="mt-6 pt-6 border-t"
                            style={{ borderColor: colors.border }}
                          >
                            <h4 className="font-medium mb-3">
                              Citizen Uploaded Images:
                            </h4>
                            <div className="flex gap-3 overflow-x-auto pb-2">
                              {complaint.images.citizen.map((img, index) => (
                                <img
                                  key={index}
                                  src={img}
                                  alt={`Evidence ${index + 1}`}
                                  className="w-32 h-32 object-cover rounded-lg"
                                  onError={(e) => {
                                    e.target.src =
                                      "https://via.placeholder.com/128?text=Image+Error";
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Officer Image if previously submitted */}
                        {complaint.images?.officer &&
                          complaint.status === "PENDING_VERIFICATION" && (
                            <div
                              className="mt-6 pt-6 border-t"
                              style={{ borderColor: colors.border }}
                            >
                              <h4 className="font-medium mb-3">
                                Previously Submitted Resolution:
                              </h4>
                              <div className="flex gap-3">
                                <img
                                  src={complaint.images.officer}
                                  alt="Previous resolution"
                                  className="w-32 h-32 object-cover rounded-lg border-2"
                                  style={{ borderColor: colors.warning }}
                                  onError={(e) => {
                                    e.target.src =
                                      "https://via.placeholder.com/128?text=Resolution";
                                  }}
                                />
                              </div>
                              <p className="text-sm opacity-75 mt-2">
                                This resolution is pending supervisor review.
                                You can submit a new one if needed.
                              </p>
                            </div>
                          )}
                      </div>

                      {/* Action Section */}
                      <div className="lg:w-80 space-y-6">
                        {/* Show resolution button for both IN_PROGRESS and PENDING_VERIFICATION */}
                        {complaint.status === "IN_PROGRESS" ||
                        complaint.status === "PENDING_VERIFICATION" ? (
                          <>
                            <div className="font-medium">
                              {complaint.status === "PENDING_VERIFICATION"
                                ? "Resubmission Required"
                                : "Resolution Actions"}
                            </div>

                            <button
                              onClick={() => {
                                setSelectedComplaint(complaint._id);
                                if (!imageFile) {
                                  toast.error(
                                    "Please select an image first from the upload section above",
                                    {
                                      position: "top-right",
                                      duration: 3000,
                                    },
                                  );
                                }
                              }}
                              disabled={
                                !imageFile ||
                                uploading ||
                                selectedComplaint === complaint._id
                              }
                              className="w-full px-6 py-4 rounded-xl font-medium flex items-center justify-center disabled:opacity-50 transition-all duration-300 hover:scale-105"
                              style={{
                                backgroundColor:
                                  complaint.status === "PENDING_VERIFICATION"
                                    ? colors.warning
                                    : colors.primary,
                                color: "white",
                              }}
                            >
                              {uploading &&
                              selectedComplaint === complaint._id ? (
                                <Loader className="animate-spin w-5 h-5 mr-2" />
                              ) : (
                                <CheckCircle size={20} className="mr-2" />
                              )}
                              {uploading && selectedComplaint === complaint._id
                                ? "Processing..."
                                : getButtonText(complaint.status)}
                            </button>

                            {selectedComplaint === complaint._id &&
                              imageFile && (
                                <button
                                  onClick={() =>
                                    handleResolveComplaint(complaint._id)
                                  }
                                  disabled={uploading}
                                  className="w-full px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105"
                                  style={{
                                    backgroundColor:
                                      complaint.status ===
                                      "PENDING_VERIFICATION"
                                        ? `${colors.warning}20`
                                        : `${colors.success}20`,
                                    color:
                                      complaint.status ===
                                      "PENDING_VERIFICATION"
                                        ? colors.warning
                                        : colors.success,
                                  }}
                                >
                                  {uploading
                                    ? "Uploading..."
                                    : complaint.status ===
                                        "PENDING_VERIFICATION"
                                      ? "Confirm Resubmission"
                                      : "Confirm Submission"}
                                </button>
                              )}
                          </>
                        ) : complaint.status === "RESOLVED" ? (
                          <div
                            className="text-center p-4 rounded-xl"
                            style={{
                              backgroundColor: `${colors.success}20`,
                              color: colors.success,
                            }}
                          >
                            <CheckCircle size={32} className="mx-auto mb-3" />
                            <div className="font-bold text-lg">Verified</div>
                            <div className="text-sm mt-2">
                              {complaint.updatedAt
                                ? `Verified on ${formatDate(
                                    complaint.updatedAt,
                                  )}`
                                : ""}
                            </div>
                            {complaint.remarks && (
                              <p className="text-xs mt-2 opacity-75">
                                {complaint.remarks}
                              </p>
                            )}
                          </div>
                        ) : null}

                        {/* Officer Image if resolved */}
                        {complaint.status === "RESOLVED" &&
                          complaint.images?.officer && (
                            <div className="mt-4">
                              <h4 className="font-medium mb-2">
                                Verified Resolution Image:
                              </h4>
                              <img
                                src={complaint.images.officer}
                                alt="Verified resolution"
                                className="w-full h-48 object-cover rounded-lg"
                                onError={(e) => {
                                  e.target.src =
                                    "https://via.placeholder.com/384?text=Resolution+Image";
                                }}
                              />
                            </div>
                          )}
                      </div>
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
            <div className="mb-8">
              <h1
                className="text-2xl md:text-3xl font-bold mb-2"
                style={{ color: colors.primary }}
              >
                Welcome, Officer {user?.name?.split(" ")[0] || ""}
              </h1>
              <p className="opacity-75">
                Manage and resolve assigned complaints
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total Assigned"
                value={stats.total || 0}
                color={colors.info}
                icon={<FileText size={28} />}
                subtitle="Complaints assigned to you"
              />
              <StatCard
                title="In Progress"
                value={stats.inProgress || 0}
                color={colors.warning}
                icon={<Clock size={28} />}
                subtitle="Currently working on"
              />
              <StatCard
                title="Pending Verification"
                value={stats.pendingVerification || 0}
                color={colors.pending}
                icon={<AlertOctagon size={28} />}
                subtitle="Awaiting supervisor approval"
              />
              <StatCard
                title="Verified"
                value={stats.resolved || 0}
                color={colors.success}
                icon={<CheckCircle size={28} />}
                subtitle="Successfully verified"
              />
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <StatCard
                title="Overdue"
                value={stats.overdue || 0}
                color={colors.danger}
                icon={<AlertTriangle size={28} />}
                subtitle="Past due date"
              />
              <StatCard
                title="Success Rate"
                value={`${Math.round(stats.resolutionRate || 0)}%`}
                color={colors.primary}
                icon={<Target size={28} />}
                subtitle="Verified complaints"
              />
            </div>

            {/* Performance */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Performance</h2>
              <div
                className="p-6 rounded-xl"
                style={{
                  backgroundColor: colors.card,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold">Verification Rate</h3>
                    <p className="opacity-75">
                      Percentage of submissions approved by supervisor
                    </p>
                  </div>
                  <div
                    className="text-3xl font-bold"
                    style={{ color: colors.primary }}
                  >
                    {Math.round(stats.resolutionRate || 0)}%
                  </div>
                </div>
                <div
                  className="h-4 rounded-full"
                  style={{ backgroundColor: `${colors.border}50` }}
                >
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
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  onClick={() => setActiveTab("assigned")}
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
                    <div className="font-medium">View Assigned Complaints</div>
                  </div>
                  <p className="text-sm opacity-75">
                    Check all complaints assigned to you
                  </p>
                </button>

                <button
                  onClick={() => {
                    toast.info("Reports feature coming soon", {
                      position: "top-right",
                      duration: 2000,
                    });
                  }}
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
                      <BarChart3 size={20} style={{ color: colors.primary }} />
                    </div>
                    <div className="font-medium">View Reports</div>
                  </div>
                  <p className="text-sm opacity-75">Your performance reports</p>
                </button>
              </div>
            </div>
          </>
        )}
      </main>

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
                <div className="flex items-center space-x-4">
                  <img
                    src={currentLogo}
                    alt="CivicFix Logo"
                    className="h-14 w-auto object-contain"
                  />
                </div>
                <span
                  className="font-bold text-lg"
                  style={{ color: colors.primary }}
                >
                  CivicFix Officer
                </span>
              </div>
              <p className="text-sm opacity-75 mt-2">
                Field Officer Complaint Management System
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

export default OfficerDashboard;
