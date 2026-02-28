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
    priority: "MEDIUM",
  });

  const categories = ["Road", "Water", "Electricity", "Sanitation", "Public Lighting", "Traffic", "Illegal Construction", "Other"];
  
  const priorities = [
    { value: "LOW", label: "Low Priority" },
    { value: "MEDIUM", label: "Medium Priority" },
    { value: "HIGH", label: "High Priority" },
    { value: "CRITICAL", label: "Critical Priority" },
  ];

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
        borderAccent: `2px solid ${accentColor}`,
        accent: accentColor,
        accentLight: "rgba(151, 171, 51, 0.1)",
        accentHover: "#8A9E2E",
        success: "#38A169",
        warning: "#F6AD55",
        danger: "#FC8181",
        info: "#4299E1",
        primary: accentColor,
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
      borderAccent: `2px solid ${accentColor}`,
      accent: accentColor,
      accentLight: "rgba(151, 171, 51, 0.15)",
      accentHover: "#A8C03E",
      success: "#68D391",
      warning: "#FBD38D",
      danger: "#FC8181",
      info: "#63B3ED",
      primary: accentColor,
      muted: "#A0AEC0",
      shadow: "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)",
    };
  };

  const colors = getThemeColors();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    
    const validFiles = files.filter((file) => {
      if (file.size > MAX_SIZE) {
        toast.error(`${file.name} exceeds 5MB limit`);
        return false;
      }
      return true;
    });

    const availableSlots = 5 - images.length;
    const imagesToAdd = validFiles.slice(0, availableSlots);

    if (files.length > availableSlots) {
      toast.warning(`You can only add ${availableSlots} more images`);
    }

    if (imagesToAdd.length > 0) {
      setImages((prev) => [...prev, ...imagesToAdd]);
      toast.success(`Added ${imagesToAdd.length} image(s)`);
    }
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    toast.info("Image removed");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title || !formData.description || !formData.category || !formData.area) {
      toast.error("Please fill all required fields");
      return;
    }

    if (formData.title.length < 10) {
      toast.warning("Title should be at least 10 characters");
      return;
    }

    if (formData.description.length < 50) {
      toast.warning("Description should be at least 50 characters");
      return;
    }

    // Confirm no images
    if (images.length === 0) {
      const confirmed = window.confirm(
        "No images added. Submitting without images may reduce resolution chances. Continue anyway?"
      );
      if (!confirmed) return;
    }

    try {
      setLoading(true);
      toast.info("Creating complaint...");

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
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        toast.success("Complaint created successfully!");
        setTimeout(() => navigate("/dashboard"), 1500);
      }
    } catch (error) {
      console.error("Error creating complaint:", error);
      toast.error(error.response?.data?.message || "Failed to create complaint");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen p-3 sm:p-4 md:p-6"
      style={{ 
        backgroundColor: colors.bg, 
        color: colors.text,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        * { font-family: 'Inter', sans-serif; }
      `}</style>

      {/* Back Button */}
      <button
        onClick={() => navigate("/dashboard")}
        className="mb-4 flex items-center text-sm px-3 py-2 rounded-lg transition-all hover:scale-105"
        style={{
          backgroundColor: colors.card,
          border: `2px solid ${colors.accent}`,
          color: colors.text,
        }}
      >
        <ArrowLeft size={18} className="mr-1" />
        Back to Dashboard
      </button>

      {/* Header */}
      <header className="mb-6 text-center">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold" style={{ color: colors.accent }}>
          Create New Complaint
        </h1>
        <p className="text-xs sm:text-sm mt-1" style={{ color: colors.muted }}>
          Report an issue in your area
        </p>
      </header>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
        {/* Title */}
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium" style={{ color: colors.text }}>
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Brief title (min. 10 characters)"
            className="w-full p-3 rounded-lg text-sm focus:outline-none focus:ring-2 transition-all"
            style={{
              backgroundColor: colors.card,
              border: `2px solid ${colors.accent}`,
              color: colors.text,
              outlineColor: colors.accent,
            }}
            required
          />
          <div className="text-xs mt-1" style={{ color: colors.muted }}>
            {formData.title.length}/10 characters
          </div>
        </div>

        {/* Category, Area, Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block mb-2 text-sm font-medium" style={{ color: colors.text }}>
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full p-3 rounded-lg text-sm focus:outline-none focus:ring-2 transition-all"
              style={{
                backgroundColor: colors.card,
                border: `2px solid ${colors.accent}`,
                color: colors.text,
                outlineColor: colors.accent,
              }}
              required
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium" style={{ color: colors.text }}>
              Area <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="area"
              value={formData.area}
              onChange={handleInputChange}
              placeholder="e.g., Main Street"
              className="w-full p-3 rounded-lg text-sm focus:outline-none focus:ring-2 transition-all"
              style={{
                backgroundColor: colors.card,
                border: `2px solid ${colors.accent}`,
                color: colors.text,
                outlineColor: colors.accent,
              }}
              required
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium" style={{ color: colors.text }}>
              Priority <span className="text-red-500">*</span>
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              className="w-full p-3 rounded-lg text-sm focus:outline-none focus:ring-2 transition-all"
              style={{
                backgroundColor: colors.card,
                border: `2px solid ${colors.accent}`,
                color: colors.text,
                outlineColor: colors.accent,
              }}
              required
            >
              {priorities.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium" style={{ color: colors.text }}>
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Detailed description (min. 50 characters)"
            rows="5"
            className="w-full p-3 rounded-lg text-sm focus:outline-none focus:ring-2 transition-all"
            style={{
              backgroundColor: colors.card,
              border: `2px solid ${colors.accent}`,
              color: colors.text,
              outlineColor: colors.accent,
            }}
            required
          />
          <div className="text-xs mt-1" style={{ color: colors.muted }}>
            {formData.description.length}/50 characters
          </div>
        </div>

        {/* Image Upload */}
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium" style={{ color: colors.text }}>
            Images (Optional - Max 5)
          </label>
          
          <div className="mb-3">
            <label
              className={`inline-flex items-center px-4 py-2 rounded-lg cursor-pointer text-sm transition-all ${
                images.length >= 5 ? "opacity-50 cursor-not-allowed" : "hover:scale-105 hover:shadow-lg"
              }`}
              style={{
                backgroundColor: colors.card,
                border: `2px solid ${colors.accent}`,
                color: colors.text,
              }}
            >
              <Upload size={16} className="mr-2" style={{ color: colors.accent }} />
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
            <p className="text-xs mt-1" style={{ color: colors.muted }}>
              {images.length} / 5 images • Max 5MB each
            </p>
          </div>

          {/* Image Preview */}
          {images.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {images.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-16 sm:h-20 object-cover rounded-lg border-2"
                    style={{ borderColor: colors.accent }}
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                  >
                    <X size={14} />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-1 text-center">
                    {Math.round(image.size / 1024)} KB
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Important Notes */}
        <div
          className="mb-4 p-4 rounded-lg"
          style={{
            backgroundColor: colors.card,
            border: `2px solid ${colors.accent}`,
          }}
        >
          <div className="flex items-start gap-2">
            <AlertCircle size={16} style={{ color: colors.accent }} className="flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium mb-1" style={{ color: colors.accent }}>Important</h3>
              <ul className="text-xs space-y-1" style={{ color: colors.muted }}>
                <li>• Review within 24-48 hours</li>
                <li>• Clear images help with faster resolution</li>
                <li>• Track your complaint progress in dashboard</li>
                <li>• You'll receive notifications on status updates</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 px-4 py-3 rounded-lg font-medium text-sm transition-all hover:scale-105"
            style={{
              backgroundColor: colors.card,
              border: `2px solid ${colors.accent}`,
              color: colors.text,
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-lg font-medium text-sm disabled:opacity-50 transition-all hover:scale-105 flex items-center justify-center"
            style={{
              backgroundColor: colors.accent,
              color: theme === "dark" ? "#000" : "#FFF",
              border: `2px solid ${colors.accent}`,
            }}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin mr-2" size={16} />
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
