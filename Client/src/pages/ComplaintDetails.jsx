import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
  Edit,
  Trash2,
} from "lucide-react";
import api from "../utils/api";
import Preloader from "../components/Preloader";

const ComplaintDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [complaint, setComplaint] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [imageErrors, setImageErrors] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);

  const colors =
    theme === "light"
      ? { 
          bg: "#ffffff", 
          text: "#000000", 
          card: "#f3f4f6", 
          border: "#e5e7eb",
          primary: "#3b82f6",
          success: "#10b981",
          warning: "#f59e0b",
          danger: "#ef4444"
        }
      : { 
          bg: "#000000", 
          text: "#ffffff", 
          card: "#111111", 
          border: "#374151",
          primary: "#3b82f6",
          success: "#10b981",
          warning: "#f59e0b",
          danger: "#ef4444"
        };

  const getFullImageUrl = (imagePath) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;
    const baseURL = api.defaults.baseURL || "http://localhost:5000";
    if (imagePath.startsWith("/uploads/")) {
      return `${baseURL}${imagePath}`;
    }
    return `${baseURL}/uploads/${imagePath}`;
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchComplaintDetails(), fetchTimeline()]);
      setTimeout(() => {
        setPageLoaded(true);
      }, 500);
    };
    loadData();
  }, [id]);

  const fetchComplaintDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/v1/complaints/${id}`);
      setComplaint(response.data?.data || null);
    } catch (error) {
      console.error("Error fetching complaint details:", error);
      toast.error("Failed to load complaint details");
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeline = async () => {
    try {
      const response = await api.get(`/v1/complaints/${id}/timeline`);
      setTimeline(response.data?.data || []);
    } catch (error) {
      console.error("Error fetching timeline:", error);
    }
  };

  const handleWithdrawComplaint = async () => {
    const confirmWithdraw = window.confirm(
      "Are you sure you want to withdraw this complaint? This action cannot be undone."
    );
    
    if (!confirmWithdraw) return;

    try {
      toast.info("Withdrawing complaint...");
      await api.patch(`/v1/complaints/${id}/withdraw`, {});
      toast.success("Complaint withdrawn successfully!");
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (error) {
      console.error("Error withdrawing complaint:", error);
      toast.error(`Failed to withdraw: ${error.response?.data?.message || error.message}`);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "CREATED": return <AlertCircle size={20} className="text-blue-500" />;
      case "ASSIGNED": return <Clock size={20} className="text-yellow-500" />;
      case "IN_PROGRESS": return <Clock size={20} className="text-purple-500" />;
      case "RESOLVED": return <CheckCircle size={20} className="text-green-500" />;
      case "REJECTED":
      case "WITHDRAWN": return <XCircle size={20} className="text-red-500" />;
      default: return <AlertCircle size={20} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "CREATED": return "blue";
      case "ASSIGNED": return "yellow";
      case "IN_PROGRESS": return "purple";
      case "RESOLVED": return "green";
      case "REJECTED":
      case "WITHDRAWN": return "red";
      default: return "gray";
    }
  };

  const handleImageError = (imagePath, index) => {
    setImageErrors((prev) => ({ ...prev, [index]: true }));
  };

  const openImageModal = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  if (loading || !pageLoaded) {
    return <Preloader />;
  }

  if (!complaint) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-4"
        style={{ backgroundColor: colors.bg, color: colors.text }}
      >
        <AlertCircle size={48} className="mb-4 opacity-50" />
        <h1 className="text-xl font-bold mb-2">Complaint Not Found</h1>
        <p className="text-sm opacity-75 mb-4 text-center">
          The requested complaint does not exist or you don't have access to it.
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          className="px-6 py-3 rounded-lg flex items-center"
          style={{ backgroundColor: colors.primary, color: "white" }}
        >
          <ArrowLeft size={18} className="mr-2" />
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-3 sm:p-4 md:p-6"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center text-sm sm:text-base w-fit"
          style={{ color: colors.primary }}
        >
          <ArrowLeft size={18} className="mr-1" />
          Back to Dashboard
        </button>

        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm w-fit"
          style={{
            backgroundColor: theme === "dark" ? "#0a0a0a" : "#f5f5f5",
            borderColor: colors.border,
          }}
        >
          {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
        </button>
      </div>

      {/* Title and Status - Mobile Optimized */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">
          {complaint.title}
        </h1>
        
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium`}
            style={{
              backgroundColor: `${colors[getStatusColor(complaint.status)]}20`,
              color: colors[getStatusColor(complaint.status)],
            }}
          >
            {getStatusIcon(complaint.status)}
            {complaint.status}
          </span>
          
          <span className="text-xs sm:text-sm px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
            {complaint.category}
          </span>
          
          {complaint.priority && (
            <span
              className={`text-xs sm:text-sm px-3 py-1.5 rounded-full ${
                complaint.priority === "CRITICAL"
                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  : complaint.priority === "HIGH"
                  ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                  : complaint.priority === "MEDIUM"
                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                  : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              }`}
            >
              {complaint.priority} Priority
            </span>
          )}
        </div>

        {/* Action Buttons */}
        {["CREATED", "ASSIGNED"].includes(complaint.status) && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => navigate(`/complaints/${id}/edit`)}
              className="flex-1 sm:flex-none px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm"
              style={{
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
              }}
            >
              <Edit size={16} />
              Edit
            </button>
            <button
              onClick={handleWithdrawComplaint}
              className="flex-1 sm:flex-none px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm"
              style={{ backgroundColor: colors.danger, color: "white" }}
            >
              <Trash2 size={16} />
              Withdraw
            </button>
          </div>
        )}
      </div>

      {/* Main Content - Mobile Optimized */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column - Description and Images */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Description */}
          <div
            className="p-4 sm:p-6 rounded-lg"
            style={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
            }}
          >
            <h2 className="text-base sm:text-lg font-bold mb-3">Description</h2>
            <p className="text-sm sm:text-base whitespace-pre-wrap opacity-90">
              {complaint.description}
            </p>
          </div>

          {/* Images */}
          {complaint.images?.citizen && complaint.images.citizen.length > 0 && (
            <div
              className="p-4 sm:p-6 rounded-lg"
              style={{
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
              }}
            >
              <h2 className="text-base sm:text-lg font-bold mb-3 flex items-center">
                <ImageIcon size={18} className="mr-2" />
                Complaint Images ({complaint.images.citizen.length})
              </h2>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {complaint.images.citizen.map((imagePath, index) => {
                  const fullImageUrl = getFullImageUrl(imagePath);
                  return (
                    <div
                      key={index}
                      className="relative group cursor-pointer"
                      onClick={() => openImageModal(fullImageUrl)}
                    >
                      {!imageErrors[index] ? (
                        <img
                          src={fullImageUrl}
                          alt={`Evidence ${index + 1}`}
                          className="w-full h-24 sm:h-32 object-cover rounded-lg border-2 border-transparent hover:border-blue-500 transition-all"
                          onError={() => handleImageError(fullImageUrl, index)}
                        />
                      ) : (
                        <div
                          className="w-full h-24 sm:h-32 rounded-lg flex items-center justify-center border-2"
                          style={{ backgroundColor: colors.bg }}
                        >
                          <AlertCircle size={24} className="opacity-50" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Info and Timeline */}
        <div className="space-y-4 sm:space-y-6">
          {/* Complaint Information */}
          <div
            className="p-4 sm:p-6 rounded-lg"
            style={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
            }}
          >
            <h2 className="text-base sm:text-lg font-bold mb-3">Information</h2>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <MapPin size={16} className="flex-shrink-0 mt-0.5 opacity-75" />
                <span className="font-medium">{complaint.area}</span>
              </div>
              
              <div className="flex items-start gap-2">
                <Calendar size={16} className="flex-shrink-0 mt-0.5 opacity-75" />
                <div>
                  <div>Created: {new Date(complaint.createdAt).toLocaleDateString()}</div>
                  {complaint.updatedAt && (
                    <div className="text-xs opacity-75 mt-1">
                      Updated: {new Date(complaint.updatedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              {complaint.assignedTo && (
                <div className="pt-2 border-t" style={{ borderColor: colors.border }}>
                  <div className="font-medium mb-1">Assigned To:</div>
                  <div>{complaint.assignedTo.name}</div>
                  <div className="text-xs opacity-75">{complaint.assignedTo.role}</div>
                </div>
              )}

              {complaint.remarks && (
                <div className="pt-2 border-t" style={{ borderColor: colors.border }}>
                  <div className="font-medium mb-1">Remarks:</div>
                  <div className="text-sm opacity-90">{complaint.remarks}</div>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          {timeline.length > 0 && (
            <div
              className="p-4 sm:p-6 rounded-lg"
              style={{
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
              }}
            >
              <h2 className="text-base sm:text-lg font-bold mb-3">Timeline</h2>
              
              <div className="space-y-4">
                {timeline.map((event, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{
                          backgroundColor:
                            event.type === "status_change"
                              ? colors.primary
                              : event.type === "comment"
                              ? colors.success
                              : event.type === "escalation"
                              ? colors.danger
                              : "#6b7280",
                        }}
                      />
                      {index < timeline.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-300 dark:bg-gray-700 mt-1" />
                      )}
                    </div>
                    
                    <div className="pb-4 flex-1">
                      <div className="font-medium text-sm">{event.event}</div>
                      <div className="text-xs opacity-75 mb-1">{event.description}</div>
                      <div className="text-xs opacity-50">
                        {new Date(event.date).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={closeImageModal}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={closeImageModal}
              className="absolute -top-10 right-0 text-white text-sm px-4 py-2"
            >
              Close ✕
            </button>
            <img
              src={selectedImage}
              alt="Full size"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintDetails;
