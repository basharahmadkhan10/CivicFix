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
  MessageSquare,
  Edit,
  Trash2,
  Image as ImageIcon,
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
  const [comment, setComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [imageErrors, setImageErrors] = useState({});

  const colors =
    theme === "light"
      ? { bg: "#ffffff", text: "#000000", card: "#cad4f3", border: "#e5e7eb" }
      : { bg: "#000000", text: "#ffffff", card: "#111111", border: "#374151" };

  const getFullImageUrl = (imagePath) => {
    if (!imagePath) return "";

    if (imagePath.startsWith("http")) {
      return imagePath;
    }
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
      console.log("Complaint data:", response.data?.data);
      if (response.data?.data?.images?.citizen) {
        console.log("Image paths:", response.data.data.images.citizen);
      }

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
    const confirmToastId = toast.warning(
      <div className="flex flex-col gap-2">
        <div className="font-bold text-sm">Withdraw Complaint?</div>
        <div className="text-xs opacity-90">
          Are you sure you want to withdraw this complaint? This action cannot
          be undone.
        </div>
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => {
              toast.removeToast(confirmToastId);
              proceedWithWithdraw();
            }}
            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded transition-colors"
          >
            Yes, Withdraw
          </button>
          <button
            onClick={() => {
              toast.removeToast(confirmToastId);
              toast.info("Withdrawal cancelled");
            }}
            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-xs rounded transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>,
      {
        position: "top-center",
        duration: 0,
      },
    );
  };

  const proceedWithWithdraw = async () => {
    try {
      toast.info("Withdrawing complaint...");
      await api.patch(`/v1/complaints/${id}/withdraw`, {});
      toast.success("Complaint withdrawn successfully!");
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (error) {
      console.error("Error withdrawing complaint:", error);
      toast.error(
        `Failed to withdraw: ${error.response?.data?.message || error.message}`,
      );
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "CREATED":
        return <AlertCircle className="text-blue-500" />;
      case "ASSIGNED":
        return <Clock className="text-yellow-500" />;
      case "IN_PROGRESS":
        return <Clock className="text-purple-500" />;
      case "RESOLVED":
        return <CheckCircle className="text-green-500" />;
      case "REJECTED":
      case "WITHDRAWN":
        return <XCircle className="text-red-500" />;
      default:
        return <AlertCircle />;
    }
  };

  const handleImageError = (imagePath, index) => {
    console.error(`Failed to load image: ${imagePath}`);
    setImageErrors((prev) => ({ ...prev, [index]: true }));
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
        <p className="opacity-75 mb-4">
          The requested complaint does not exist or you don't have access to it.
        </p>
        <button
          onClick={() => {
            toast.info("Returning to dashboard...", {
              position: "top-right",
              duration: 2000,
            });
            setTimeout(() => {
              navigate(`/dashboard`);
            }, 500);
          }}
          className="mb-4 mt-3 px-4 py-2 rounded-lg flex items-center hover:opacity-90 transition-opacity font-bolder"
        >
          <ArrowLeft
            size={18}
            className="mr-2 h-7 w-10"
            style={{ color: theme === "dark" ? "#ffffff" : "#000000" }}
          />
        </button>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-4"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      <header className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => {
              toast.info("Returning to dashboard...", {
                position: "top-right",
                duration: 2000,
              });
              setTimeout(() => {
                navigate(`/dashboard`);
              }, 500);
            }}
            className="mb-4 mt-3 px-4 py-2 rounded-lg flex items-center hover:opacity-90 transition-opacity font-bolder"
          >
            <ArrowLeft
              size={18}
              className="mr-2 h-7 w-10"
              style={{ color: theme === "dark" ? "#ffffff" : "#000000" }}
            />
          </button>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3 py-1.5 lg:px-4 lg:py-2 rounded-lg border transition-colors duration-200 hover:scale-105"
            style={{
              backgroundColor: theme === "dark" ? "#0a0a0a" : "#f5f5f5",
              borderColor: theme === "dark" ? "#1a1a1a" : "#e5e5e5",
              color: theme === "dark" ? "#ffffff" : "#000000",
            }}
          >
            {theme === "dark" ? (
              <>
                <svg
                  className="w-4 h-4 lg:w-5 lg:h-5"
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
                <span className="text-xs lg:text-sm font-medium">
                  Light Mode
                </span>
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 lg:w-5 lg:h-5"
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
                <span className="text-xs lg:text-sm font-medium">
                  Dark Mode
                </span>
              </>
            )}
          </button>
        </div>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold m-5">
              Title: <em>{complaint.title}</em>
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <div className="flex items-center gap-2">
                {getStatusIcon(complaint.status)}
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    complaint.status === "CREATED"
                      ? "bg-blue-100 text-blue-800"
                      : complaint.status === "ASSIGNED"
                        ? "bg-yellow-100 text-yellow-600"
                        : complaint.status === "IN_PROGRESS"
                          ? "bg-purple-100 text-purple-800"
                          : complaint.status === "RESOLVED"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                  }`}
                >
                  {complaint.status}
                </span>
              </div>
              <span className="px-3 py-1 rounded-full text-sm bg-gray-100 dark:bg-gray-500 dark:text-gray-200">
                {complaint.category}
              </span>
              {complaint.priority && (
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    complaint.priority === "CRITICAL"
                      ? "bg-red-100 text-red-800"
                      : complaint.priority === "HIGH"
                        ? "bg-orange-100 text-orange-800"
                        : complaint.priority === "MEDIUM"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                  }`}
                >
                  {complaint.priority} Priority
                </span>
              )}
            </div>
          </div>
          {["CREATED", "ASSIGNED"].includes(complaint.status) && (
            <div className="flex gap-5">
              <button
                onClick={() => {
                  toast.info("Opening edit page...");
                  setTimeout(() => {
                    navigate(`/complaints/${id}/edit`);
                  }, 500);
                }}
                className="px-4 py-2 rounded-lg flex items-center hover:opacity-90 transition-opacity"
                style={{
                  backgroundColor: colors.card,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <Edit size={16} className="mr-2" />
                Edit
              </button>
              <button
                onClick={handleWithdrawComplaint}
                className="px-4 py-2 rounded-lg flex items-center bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                <Trash2 size={16} className="mr-2" />
                Withdraw
              </button>
            </div>
          )}
        </div>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
        
        <div className="lg:col-span-2 space-y-15 mt-6">

          <div
            className="p-6 rounded-lg"
            style={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
            }}
          >
            <h2 className="text-lg font-bold mb-4">Description</h2>
            <p className="whitespace-pre-wrap opacity-90">
              {complaint.description}
            </p>
          </div>
          {complaint.images?.citizen && complaint.images.citizen.length > 0 && (
            <div
              className="p-6 rounded-lg"
              style={{
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
              }}
            >
              <h2 className="text-lg font-bold mb-4 flex items-center">
                <ImageIcon size={20} className="mr-2" />
                Complaint Images ({complaint.images.citizen.length})
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {complaint.images.citizen.map((imagePath, index) => {
                  const fullImageUrl = getFullImageUrl(imagePath);
                  console.log(`Image ${index + 1} URL:`, fullImageUrl); // Debug log

                  return (
                    <div key={index} className="relative group">
                      {!imageErrors[index] ? (
                        <img
                          src={fullImageUrl}
                          alt={`Complaint evidence ${index + 1}`}
                          className="w-full h-48 object-cover rounded-lg cursor-pointer border-2 border-transparent hover:border-blue-500 transition-all duration-300"
                          onClick={() => window.open(fullImageUrl, "_blank")}
                          onError={() => handleImageError(fullImageUrl, index)}
                          crossOrigin="anonymous"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div
                          className="w-full h-48 rounded-lg flex items-center justify-center cursor-pointer border-2 border-gray-300"
                          style={{ backgroundColor: colors.card }}
                          onClick={() => window.open(fullImageUrl, "_blank")}
                        >
                          <div className="text-center">
                            <AlertCircle
                              size={32}
                              className="mx-auto mb-2 opacity-50"
                            />
                            <p className="text-sm opacity-75">
                              Click to view original
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div className="space-y-6">
        
          <div
            className="p-6 rounded-lg"
            style={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
            }}
          >
            <h2 className="text-lg font-bold mb-4">Complaint Information</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin size={18} className="opacity-75" />
                <span className="font-medium">{complaint.area}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={18} className="opacity-75" />
                <span>
                  Created: {new Date(complaint.createdAt).toLocaleDateString()}
                </span>
              </div>
              {complaint.updatedAt && (
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="opacity-75" />
                  <span>
                    Updated:{" "}
                    {new Date(complaint.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              {complaint.assignedTo && (
                <div>
                  <div className="font-medium mb-1">Assigned To:</div>
                  <div className="opacity-90">{complaint.assignedTo.name}</div>
                  <div className="text-sm opacity-75">
                    {complaint.assignedTo.role}
                  </div>
                </div>
              )}
              {complaint.remarks && (
                <div>
                  <div className="font-medium mb-1">Remarks:</div>
                  <div className="opacity-90">{complaint.remarks}</div>
                </div>
              )}
            </div>
          </div>

       
          {timeline.length > 0 && (
            <div
              className="p-6 rounded-lg"
              style={{
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
              }}
            >
              <h2 className="text-lg font-bold mb-4">
                Timeline ({timeline.length} events)
              </h2>
              <div className="space-y-4">
                {timeline.map((event, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor:
                            event.type === "status_change"
                              ? "#3b82f6"
                              : event.type === "comment"
                                ? "#10b981"
                                : event.type === "escalation"
                                  ? "#ef4444"
                                  : "#6b7280",
                        }}
                      />
                      {index < timeline.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-300 dark:bg-gray-700 mt-1" />
                      )}
                    </div>
                    <div className="pb-4 flex-1">
                      <div className="font-medium">{event.event}</div>
                      <div className="text-sm opacity-75 mb-1">
                        {event.description}
                      </div>
                      <div className="text-xs opacity-60">
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
    </div>
  );
};

export default ComplaintDetails;
