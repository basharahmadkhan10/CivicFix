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

  const categories = ["Road", "Water", "Electricity", "Sanitation", "Other"];
  
  const priorities = [
    { value: "LOW", label: "Low Priority", color: "green" },
    { value: "MEDIUM", label: "Medium Priority", color: "yellow" },
    { value: "HIGH", label: "High Priority", color: "orange" },
    { value: "CRITICAL", label: "Critical Priority", color: "red" },
  ];

  const colors =
    theme === "light"
      ? { 
          bg: "#ffffff", 
          text: "#000000", 
          card: "#f3f4f6", 
          border: "#e5e7eb",
          primary: "#10b981",
          danger: "#ef4444"
        }
      : { 
          bg: "#000000", 
          text: "#ffffff", 
          card: "#111111", 
          border: "#374151",
          primary: "#10b981",
          danger: "#ef4444"
        };

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
      className="min-h-screen p-3 sm:p-4"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {/* Back Button */}
      <button
        onClick={() => navigate("/dashboard")}
        className="mb-4 flex items-center text-sm"
        style={{ color: colors.primary }}
      >
        <ArrowLeft size={18} className="mr-1" />
        Back to Dashboard
      </button>

      {/* Header */}
      <header className="mb-4 text-center">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Create New Complaint</h1>
        <p className="text-xs sm:text-sm opacity-75 mt-1">
          Report an issue in your area
        </p>
      </header>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
        {/* Title */}
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Brief title (min. 10 characters)"
            className="w-full p-3 rounded-lg text-sm focus:outline-none focus:ring-2"
            style={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
            }}
            required
          />
          <div className="text-xs opacity-75 mt-1">
            {formData.title.length}/10
          </div>
        </div>

        {/* Category, Area, Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="block mb-2 text-sm font-medium">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full p-3 rounded-lg text-sm focus:outline-none focus:ring-2"
              style={{
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
              }}
              required
            >
              <option value="">Select</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">
              Area <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="area"
              value={formData.area}
              onChange={handleInputChange}
              placeholder="e.g., Main St"
              className="w-full p-3 rounded-lg text-sm focus:outline-none focus:ring-2"
              style={{
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
              }}
              required
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">
              Priority <span className="text-red-500">*</span>
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              className="w-full p-3 rounded-lg text-sm focus:outline-none focus:ring-2"
              style={{
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
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
          <label className="block mb-2 text-sm font-medium">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Detailed description (min. 50 characters)"
            rows="5"
            className="w-full p-3 rounded-lg text-sm focus:outline-none focus:ring-2"
            style={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
            }}
            required
          />
          <div className="text-xs opacity-75 mt-1">
            {formData.description.length}/50
          </div>
        </div>

        {/* Image Upload */}
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium">
            Images (Optional)
          </label>
          
          <div className="mb-3">
            <label
              className={`inline-flex items-center px-4 py-2 rounded-lg cursor-pointer text-sm ${
                images.length >= 5 ? "opacity-50 cursor-not-allowed" : "hover:opacity-80"
              }`}
              style={{
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
              }}
            >
              <Upload size={16} className="mr-2" />
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
            <p className="text-xs opacity-75 mt-1">
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
                    className="w-full h-16 sm:h-20 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
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
          className="mb-4 p-3 rounded-lg text-sm"
          style={{
            backgroundColor: `${colors.border}20`,
            border: `1px solid ${colors.border}`,
          }}
        >
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium mb-1">Important</h3>
              <ul className="text-xs space-y-1 opacity-75">
                <li>• Review within 24-48 hours</li>
                <li>• Clear images help resolution</li>
                <li>• Track progress in dashboard</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 px-4 py-3 rounded-lg font-medium text-sm hover:opacity-80"
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
            className="flex-1 px-4 py-3 rounded-lg font-medium text-sm text-white disabled:opacity-50 hover:opacity-90 flex items-center justify-center"
            style={{ backgroundColor: colors.primary }}
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
