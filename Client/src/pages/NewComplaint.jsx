import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import { ArrowLeft, Upload, X, AlertCircle, Loader2 } from "lucide-react";
import api from "../utils/api";

const NewComplaint = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    area: "",
    priority: "MEDIUM", // Default priority
  });

  const categories = ["Road", "Water", "Electricity", "Sanitation", "Other"];

  const priorities = [
    {
      value: "LOW",
      label: "Low Priority",
      color: "green",
      description: "Non-urgent issues",
    },
    {
      value: "MEDIUM",
      label: "Medium Priority",
      color: "yellow",
      description: "Standard issues",
    },
    {
      value: "HIGH",
      label: "High Priority",
      color: "orange",
      description: "Urgent attention needed",
    },
    {
      value: "CRITICAL",
      label: "Critical Priority",
      color: "red",
      description: "Emergency - Immediate action",
    },
  ];

  const colors =
    theme === "light"
      ? { bg: "#ffffff", text: "#000000", card: "#cad4f3", border: "#e5e7eb" }
      : { bg: "#000000", text: "#ffffff", card: "#111111", border: "#374151" };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);

    // Validate file sizes (limit to 5MB per file)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const validFiles = files.filter((file) => {
      if (file.size > MAX_SIZE) {
        toast.error(`${file.name} exceeds 5MB limit`, {
          position: "top-right",
          duration: 4000,
        });
        return false;
      }
      return true;
    });

    const availableSlots = 5 - images.length;
    const imagesToAdd = validFiles.slice(0, availableSlots);

    if (files.length > availableSlots) {
      toast.warning(`You can only add ${availableSlots} more images`, {
        position: "top-right",
        duration: 4000,
      });
    }

    if (imagesToAdd.length > 0) {
      setImages((prev) => [...prev, ...imagesToAdd]);
      toast.success(`Added ${imagesToAdd.length} image(s)`, {
        position: "top-right",
        duration: 3000,
      });
    }
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    toast.info("Image removed", {
      position: "top-right",
      duration: 3000,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (
      !formData.title ||
      !formData.description ||
      !formData.category ||
      !formData.area ||
      !formData.priority
    ) {
      toast.error("Please fill all required fields", {
        position: "top-center",
        duration: 4000,
      });
      return;
    }

    // Validate title length
    if (formData.title.length < 10) {
      toast.warning("Title should be at least 10 characters long", {
        position: "top-right",
        duration: 4000,
      });
      return;
    }

    // Validate description length
    if (formData.description.length < 50) {
      toast.warning(
        "Description should be at least 50 characters for better understanding",
        {
          position: "top-right",
          duration: 5000,
        },
      );
      return;
    }

    // Show image count warning
    if (images.length === 0) {
      const confirmToastId = toast.warning(
        <div className="flex flex-col gap-2">
          <div className="font-bold text-sm">No Images Added</div>
          <div className="text-xs opacity-90">
            Submitting without images may reduce chances of quick resolution.
            Are you sure?
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => {
                toast.removeToast(confirmToastId);
                proceedWithSubmission();
              }}
              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded transition-colors"
            >
              Yes, Submit Anyway
            </button>
            <button
              onClick={() => {
                toast.removeToast(confirmToastId);
                toast.info("Please add images for better documentation", {
                  position: "top-right",
                  duration: 4000,
                });
              }}
              className="px-3 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-xs rounded transition-colors"
            >
              Add Images
            </button>
          </div>
        </div>,
        {
          position: "top-center",
          duration: 0,
        },
      );
      return;
    }

    proceedWithSubmission();
  };

  const proceedWithSubmission = async () => {
    try {
      setLoading(true);

      toast.info("Creating complaint...", {
        position: "top-right",
        duration: 3000,
      });

      const submitFormData = new FormData();
      submitFormData.append("title", formData.title);
      submitFormData.append("description", formData.description);
      submitFormData.append("category", formData.category);
      submitFormData.append("area", formData.area);
      submitFormData.append("priority", formData.priority);

      images.forEach((image) => {
        submitFormData.append("image", image);
      });

      const response = await api.post("/v1/complaints", submitFormData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        toast.success("Complaint created successfully!", {
          position: "top-right",
          duration: 4000,
        });

        // Show tracking ID if available
        if (response.data.data?.trackingId) {
          toast.info(
            <div>
              <div className="font-bold mb-1">
                Tracking ID: {response.data.data.trackingId}
              </div>
              <div className="text-xs opacity-90">
                You can use this to track your complaint
              </div>
            </div>,
            {
              position: "top-center",
              duration: 6000,
            },
          );
        }

        // Navigate after a short delay
        setTimeout(() => {
          navigate("/dashboard");
        }, 1000);
      }
    } catch (error) {
      console.error("Error creating complaint:", error);

      // Show specific error messages
      let errorMessage = "Failed to create complaint";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage, {
        position: "top-right",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "LOW":
        return "green";
      case "MEDIUM":
        return "yellow";
      case "HIGH":
        return "orange";
      case "CRITICAL":
        return "red";
      default:
        return "gray";
    }
  };

  return (
    <div
      className="min-h-screen p-4"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
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

      {/* Header */}
      <header className="mb-4 flex flex-col justify-center items-center">
        <h1 className="text-2xl md:text-3xl font-bold">Create New Complaint</h1>
        <p className="opacity-75 mt-1">
          Report an issue in your area with details and images
        </p>
      </header>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
        {/* Title */}
        <div className="mb-6">
          <label className="block mb-2 font-medium">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Brief title of the issue (minimum 10 characters)"
            className="w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            minLength="10"
            style={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
            }}
          />
          <div className="text-xs opacity-75 mt-1">
            {formData.title.length}/10 characters
          </div>
        </div>

        {/* Category, Area & Priority - Updated to 3 columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block mb-2 font-medium">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              style={{
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
              }}
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Area/Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="area"
              value={formData.area}
              onChange={handleInputChange}
              placeholder="e.g., Main Street"
              className="w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              style={{
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
              }}
            />
          </div>

          {/* Priority Field */}
          <div>
            <label className="block mb-2 font-medium">
              Priority <span className="text-red-500">*</span>
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              className="w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              style={{
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
              }}
            >
              {priorities.map((priority) => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>

            {/* Priority Description */}
            {formData.priority && (
              <div className="mt-2 text-xs">
                <span
                  className={`inline-block px-2 py-1 rounded-full font-medium`}
                  style={{
                    backgroundColor: `${
                      formData.priority === "CRITICAL"
                        ? "#ef4444"
                        : formData.priority === "HIGH"
                          ? "#f97316"
                          : formData.priority === "MEDIUM"
                            ? "#eab308"
                            : "#10b981"
                    }20`,
                    color: `${
                      formData.priority === "CRITICAL"
                        ? "#ef4444"
                        : formData.priority === "HIGH"
                          ? "#f97316"
                          : formData.priority === "MEDIUM"
                            ? "#eab308"
                            : "#10b981"
                    }`,
                  }}
                >
                  {
                    priorities.find((p) => p.value === formData.priority)
                      ?.description
                  }
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="block mb-2 font-medium">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Detailed description of the issue... (minimum 50 characters)"
            rows="5"
            className="w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            minLength="50"
            style={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
            }}
          />
          <div className="text-xs opacity-75 mt-1">
            {formData.description.length}/50 characters
          </div>
        </div>

        {/* Image Upload */}
        <div className="mb-6">
          <label className="block mb-2 font-medium">
            Images (Optional but recommended)
          </label>
          <div className="mb-4">
            <label
              className={`inline-flex items-center px-4 py-3 rounded-lg cursor-pointer transition-colors hover:opacity-80 ${
                images.length >= 5 ? "opacity-50 cursor-not-allowed" : ""
              }`}
              style={{
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
              }}
            >
              <Upload size={20} className="mr-2" />
              Upload Images
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                disabled={images.length >= 5}
              />
            </label>
            <div className="flex justify-between items-center mt-2">
              <p className="text-sm opacity-75">
                {images.length} / 5 images • Max 5MB each • Supported: JPG, PNG
              </p>
              {images.length === 0 && (
                <span className="text-xs text-yellow-600 dark:text-yellow-400">
                  ⚠️ Images improve resolution chances
                </span>
              )}
            </div>
          </div>

          {/* Preview Images */}
          {images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mt-4">
              {images.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-1 text-center rounded-b-lg">
                    {Math.round(image.size / 1024)} KB
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Important Notes */}
        <div
          className="mb-6 p-4 rounded-lg"
          style={{
            backgroundColor: `${colors.border}20`,
            border: `1px solid ${colors.border}`,
          }}
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              size={20}
              className="text-blue-500 flex-shrink-0 mt-1"
            />
            <div>
              <h3 className="font-medium mb-1">Important Information</h3>
              <ul className="text-sm space-y-1 opacity-75">
                <li>
                  • Your complaint will be reviewed by authorities within 24-48
                  hours
                </li>
                <li>
                  • Clear images significantly improve understanding and
                  resolution speed
                </li>
                <li>• Provide accurate location details for field officers</li>
                <li>• You will receive updates on your complaint status</li>
                <li>
                  • Critical priority complaints are flagged for immediate
                  attention
                </li>
                <li className="text-green-600 font-medium">
                  • Once submitted, you can track progress in your dashboard
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => {
              toast.info("Cancelling complaint creation...", {
                position: "top-right",
                duration: 2000,
              });
              setTimeout(() => {
                navigate(-1);
              }, 500);
            }}
            className="px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity flex-1"
            style={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-lg font-medium text-white flex-1 disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center justify-center"
            style={{
              backgroundColor: colors.bg === "#000000" ? "#10b981" : "#069468",
            }}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin mr-2" size={20} />
                Submitting...
              </>
            ) : (
              "Submit Complaint"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewComplaint;
