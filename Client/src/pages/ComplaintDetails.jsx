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
        success: "#38A169",
        warning: "#bb1b11",
        danger: "#FC8181",
        info: "#97AB33",
        muted: "#718096",
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
      success: "#68D391",
      warning: "#bb1b11",
      danger: "#FC8181",
      info: "#97AB33",
      muted: "#A0AEC0",
    };
  };

  const colors = getThemeColors();
  const isDark = theme === "dark";

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
      setTimeout(() => setPageLoaded(true), 500);
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
      setTimeout(() => navigate("/dashboard"), 1000);
    } catch (error) {
      toast.error(`Failed to withdraw: ${error.response?.data?.message || error.message}`);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "CREATED": return <AlertCircle size={20} style={{ color: colors.info }} />;
      case "ASSIGNED": return <Clock size={20} style={{ color: colors.warning }} />;
      case "IN_PROGRESS": return <Clock size={20} style={{ color: colors.accent }} />;
      case "RESOLVED": return <CheckCircle size={20} style={{ color: colors.success }} />;
      case "REJECTED":
      case "WITHDRAWN": return <XCircle size={20} style={{ color: colors.danger }} />;
      default: return <AlertCircle size={20} />;
    }
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

  const handleImageError = (imagePath, index) => {
    setImageErrors((prev) => ({ ...prev, [index]: true }));
  };

  const openImageModal = (imageUrl) => setSelectedImage(imageUrl);
  const closeImageModal = () => setSelectedImage(null);

  if (loading || !pageLoaded) return <Preloader />;
  if (!complaint) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: colors.bg, color: colors.text }}>
        <AlertCircle size={48} className="mb-4" style={{ color: colors.muted }} />
        <h1 className="text-xl font-bold mb-2">Complaint Not Found</h1>
        <p className="text-sm mb-4 text-center" style={{ color: colors.muted }}>The requested complaint does not exist or you don't have access to it.</p>
        <button onClick={() => navigate("/dashboard")} className="px-6 py-3 rounded-lg flex items-center"
          style={{ backgroundColor: colors.accent, color: isDark ? "#000" : "#FFF" }}>
          <ArrowLeft size={18} className="mr-2" /> Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-6" style={{ backgroundColor: colors.bg, color: colors.text, fontFamily: "'Inter', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap'); * { font-family: 'Inter', sans-serif; }`}</style>

      {/* Header with theme toggle like dashboard */}
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={() => navigate("/dashboard")} 
          className="flex items-center text-sm px-3 py-2 rounded-lg transition-all hover:opacity-80"
          style={{ backgroundColor: colors.cardHover, color: colors.text }}
        >
          <ArrowLeft size={18} className="mr-1" /> Back
        </button>
        
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
      </div>

      {/* Title and Status */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3">{complaint.title}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <span 
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium"
            style={{ backgroundColor: `${getStatusColor(complaint.status)}20`, color: getStatusColor(complaint.status) }}
          >
            {getStatusIcon(complaint.status)} {complaint.status}
          </span>
          <span 
            className="text-xs sm:text-sm px-3 py-1.5 rounded-full" 
            style={{ backgroundColor: colors.cardHover, color: colors.text }}
          >
            {complaint.category}
          </span>
        </div>

        {/* Action Buttons */}
        {["CREATED", "ASSIGNED"].includes(complaint.status) && (
          <div className="flex gap-2 mt-4">
            <button 
              onClick={() => navigate(`/complaints/${id}/edit`)} 
              className="flex-1 sm:flex-none px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm transition-all hover:opacity-80"
              style={{ backgroundColor: colors.cardHover, color: colors.text }}
            >
              <Edit size={16} /> Edit
            </button>
            <button 
              onClick={handleWithdrawComplaint} 
              className="flex-1 sm:flex-none px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm transition-all hover:opacity-80"
              style={{ backgroundColor: colors.danger, color: "#FFF" }}
            >
              <Trash2 size={16} /> Withdraw
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="p-6 rounded-lg" style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
            <h2 className="text-base sm:text-lg font-bold mb-3" style={{ color: colors.accent }}>Description</h2>
            <p className="text-sm sm:text-base whitespace-pre-wrap" style={{ color: colors.muted }}>{complaint.description}</p>
          </div>

          {/* Images */}
          {complaint.images?.citizen && complaint.images.citizen.length > 0 && (
            <div className="p-6 rounded-lg" style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
              <h2 className="text-base sm:text-lg font-bold mb-3 flex items-center" style={{ color: colors.accent }}>
                <ImageIcon size={18} className="mr-2" /> Complaint Images ({complaint.images.citizen.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {complaint.images.citizen.map((imagePath, index) => {
                  const fullImageUrl = getFullImageUrl(imagePath);
                  return (
                    <div key={index} className="relative group cursor-pointer" onClick={() => openImageModal(fullImageUrl)}>
                      {!imageErrors[index] ? (
                        <img 
                          src={fullImageUrl} 
                          alt={`Evidence ${index + 1}`} 
                          className="w-full h-24 sm:h-32 object-cover rounded-lg transition-all group-hover:opacity-90"
                          onError={() => handleImageError(fullImageUrl, index)} 
                        />
                      ) : (
                        <div className="w-full h-24 sm:h-32 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.cardHover }}>
                          <AlertCircle size={24} style={{ color: colors.muted }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Information */}
          <div className="p-6 rounded-lg" style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
            <h2 className="text-base sm:text-lg font-bold mb-3" style={{ color: colors.accent }}>Information</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <MapPin size={16} className="flex-shrink-0 mt-0.5" style={{ color: colors.accent }} />
                <span style={{ color: colors.text }}>{complaint.area}</span>
              </div>
              <div className="flex items-start gap-2">
                <Calendar size={16} className="flex-shrink-0 mt-0.5" style={{ color: colors.accent }} />
                <div>
                  <div style={{ color: colors.text }}>Created: {new Date(complaint.createdAt).toLocaleDateString()}</div>
                  {complaint.updatedAt && (
                    <div className="text-xs mt-1" style={{ color: colors.muted }}>Updated: {new Date(complaint.updatedAt).toLocaleDateString()}</div>
                  )}
                </div>
              </div>
              {complaint.assignedTo && (
                <div className="pt-2 border-t" style={{ borderColor: colors.border }}>
                  <div className="font-medium mb-1" style={{ color: colors.accent }}>Assigned To:</div>
                  <div style={{ color: colors.text }}>{complaint.assignedTo.name}</div>
                  <div className="text-xs" style={{ color: colors.muted }}>{complaint.assignedTo.role}</div>
                </div>
              )}
              {complaint.remarks && (
                <div className="pt-2 border-t" style={{ borderColor: colors.border }}>
                  <div className="font-medium mb-1" style={{ color: colors.accent }}>Remarks:</div>
                  <div className="text-sm" style={{ color: colors.muted }}>{complaint.remarks}</div>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          {timeline.length > 0 && (
            <div className="p-6 rounded-lg" style={{ backgroundColor: colors.card, border: `1px solid ${colors.border}` }}>
              <h2 className="text-base sm:text-lg font-bold mb-3" style={{ color: colors.accent }}>Timeline</h2>
              <div className="space-y-4">
                {timeline.map((event, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.accent }} />
                      {index < timeline.length - 1 && <div className="w-0.5 h-full mt-1" style={{ backgroundColor: colors.border }} />}
                    </div>
                    <div className="pb-4 flex-1">
                      <div className="font-medium text-sm" style={{ color: colors.text }}>{event.event}</div>
                      <div className="text-xs mb-1" style={{ color: colors.muted }}>{event.description}</div>
                      <div className="text-xs" style={{ color: colors.muted }}>{new Date(event.date).toLocaleString()}</div>
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
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4" onClick={closeImageModal}>
          <div className="relative max-w-4xl max-h-full">
            <button onClick={closeImageModal} className="absolute -top-10 right-0 text-white text-sm px-4 py-2">Close ✕</button>
            <img src={selectedImage} alt="Full size" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintDetails;

