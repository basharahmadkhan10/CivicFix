import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import { Upload, X, ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import api from "../utils/api";
import Preloader from "../components/Preloader";

const EditComplaint = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [existingImages, setExistingImages] = useState([]);
  const [removedImages, setRemovedImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [originalImages, setOriginalImages] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    area: "",
  });

  const categories = ["Road", "Water", "Electricity", "Sanitation", "Public Lighting", "Traffic", "Illegal Construction", "Other"];

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
        danger: "#FC8181",
        success: "#38A169",
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
      danger: "#FC8181",
      success: "#68D391",
      muted: "#A0AEC0",
    };
  };

  const colors = getThemeColors();
  const isDark = theme === "dark";

  useEffect(() => {
    fetchComplaintDetails();
  }, [id]);

  const fetchComplaintDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/v1/complaints/${id}`);
      const complaint = response.data?.data;
      if (complaint) {
        setFormData({
          title: complaint.title || "",
          description: complaint.description || "",
          category: complaint.category || "",
          area: complaint.area || "",
        });
        const citizenImages = complaint.images?.citizen || [];
        setExistingImages([...citizenImages]);
        setOriginalImages([...citizenImages]);
        setRemovedImages([]);
        setNewImages([]);
        toast.success("Complaint loaded successfully!");
      }
    } catch (error) {
      console.error("Error fetching complaint:", error);
      toast.error("Failed to load complaint details");
      navigate(`/complaints/${id}`);
    } finally {
      setLoading(false);
      setTimeout(() => setPageLoaded(true), 500);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNewImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const totalImages = existingImages.length + newImages.length;
    const availableSlots = 5 - totalImages;
    const imagesToAdd = files.slice(0, availableSlots);

    if (files.length > availableSlots) {
      toast.warning(`You can only add ${availableSlots} more images (max 5 total)`);
    }
    if (imagesToAdd.length > 0) {
      setNewImages((prev) => [...prev, ...imagesToAdd]);
      toast.success(`Added ${imagesToAdd.length} image(s)`);
    }
  };

  const removeNewImage = (index) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    toast.info("Image removed from upload queue");
  };

  const removeExistingImage = (index) => {
    const imageToRemove = existingImages[index];
    setRemovedImages((prev) => [...prev, imageToRemove]);
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
    toast.warning("Image marked for removal");
  };

  const restoreExistingImage = (imageUrl) => {
    setRemovedImages((prev) => prev.filter((img) => img !== imageUrl));
    setExistingImages((prev) => [...prev, imageUrl]);
    toast.success("Image restored");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.category || !formData.area) {
      toast.error("Please fill all required fields");
      return;
    }
    if (existingImages.length + newImages.length > 5) {
      toast.error("Maximum 5 images allowed. Please remove some images.");
      return;
    }

    try {
      setUpdating(true);
      toast.info("Updating complaint...");
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("category", formData.category);
      formDataToSend.append("area", formData.area);
      existingImages.forEach((img) => formDataToSend.append("existingImages", img));
      newImages.forEach((file) => formDataToSend.append("image", file));

      const response = await api.patch(`/v1/complaints/${id}`, formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data?.success || response.status === 200) {
        toast.success("Complaint updated successfully!");
        setTimeout(() => navigate(`/complaints/${id}`), 1500);
      }
    } catch (error) {
      console.error("Error updating complaint:", error);
      toast.error(error.response?.data?.message || "Failed to update complaint");
    } finally {
      setUpdating(false);
    }
  };

  const getFullImageUrl = (imagePath) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;
    return `http://localhost:5000/uploads/${imagePath}`;
  };

  if (loading || !pageLoaded) return <Preloader />;

  return (
    <div className="min-h-screen p-3 sm:p-4 md:p-6" style={{ backgroundColor: colors.bg, color: colors.text, fontFamily: "'Inter', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap'); * { font-family: 'Inter', sans-serif; }`}</style>

      {/* Header with theme toggle */}
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={() => navigate(`/complaints/${id}`)} 
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

      {/* Header */}
      <header className="mb-6 text-center">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold" style={{ color: colors.accent }}>Edit Complaint</h1>
        <p className="text-xs sm:text-sm mt-1" style={{ color: colors.muted }}>Update your complaint details</p>
      </header>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
        {/* Title */}
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium" style={{ color: colors.text }}>Title <span className="text-red-500">*</span></label>
          <input 
            type="text" 
            name="title" 
            value={formData.title} 
            onChange={handleInputChange} 
            placeholder="Brief title of the issue"
            className="w-full p-3 rounded-lg text-sm focus:outline-none focus:ring-1 transition-all"
            style={{ backgroundColor: colors.cardHover, border: `1px solid ${colors.border}`, color: colors.text }} 
            required 
          />
        </div>

        {/* Category and Area */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-2 text-sm font-medium" style={{ color: colors.text }}>Category <span className="text-red-500">*</span></label>
            <select 
              name="category" 
              value={formData.category} 
              onChange={handleInputChange}
              className="w-full p-3 rounded-lg text-sm focus:outline-none focus:ring-1 transition-all"
              style={{ backgroundColor: colors.cardHover, border: `1px solid ${colors.border}`, color: colors.text }} 
              required
            >
              <option value="">Select Category</option>
              {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium" style={{ color: colors.text }}>Area <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              name="area" 
              value={formData.area} 
              onChange={handleInputChange} 
              placeholder="e.g., Main Street"
              className="w-full p-3 rounded-lg text-sm focus:outline-none focus:ring-1 transition-all"
              style={{ backgroundColor: colors.cardHover, border: `1px solid ${colors.border}`, color: colors.text }} 
              required 
            />
          </div>
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium" style={{ color: colors.text }}>Description <span className="text-red-500">*</span></label>
          <textarea 
            name="description" 
            value={formData.description} 
            onChange={handleInputChange} 
            placeholder="Detailed description of the issue..." 
            rows="5"
            className="w-full p-3 rounded-lg text-sm focus:outline-none focus:ring-1 transition-all"
            style={{ backgroundColor: colors.cardHover, border: `1px solid ${colors.border}`, color: colors.text }} 
            required 
          />
        </div>

        {/* Existing Images */}
        {originalImages.length > 0 && (
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium" style={{ color: colors.text }}>Existing Images</label>
            {removedImages.length > 0 && (
              <div className="mb-3 p-3 rounded-lg" style={{ backgroundColor: `${colors.danger}20` }}>
                <p className="text-xs font-medium mb-2" style={{ color: colors.danger }}>Images marked for removal:</p>
                <div className="flex flex-wrap gap-2">
                  {removedImages.map((img, index) => (
                    <div key={index} className="relative group">
                      <img src={getFullImageUrl(img)} alt={`Removed ${index + 1}`} className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded opacity-50" />
                      <button 
                        type="button" 
                        onClick={() => restoreExistingImage(img)} 
                        className="absolute inset-0 bg-green-500 bg-opacity-70 text-white rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                      >
                        Restore
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {existingImages.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {existingImages.map((img, index) => (
                  <div key={index} className="relative group">
                    <img src={getFullImageUrl(img)} alt={`Existing ${index + 1}`} className="w-full h-16 sm:h-20 object-cover rounded-lg" />
                    <button 
                      type="button" 
                      onClick={() => removeExistingImage(index)} 
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add New Images */}
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium" style={{ color: colors.text }}>Add More Images (Optional)</label>
          <div className="mb-3">
            <label 
              className={`inline-flex items-center px-4 py-2 rounded-lg cursor-pointer text-sm transition-all ${
                existingImages.length + newImages.length >= 5 ? "opacity-50 cursor-not-allowed" : "hover:opacity-80"
              }`}
              style={{ backgroundColor: colors.cardHover }}
            >
              <Upload size={16} className="mr-2" style={{ color: colors.accent }} />
              Upload Images
              <input 
                type="file" 
                accept="image/*" 
                multiple 
                onChange={handleNewImageUpload} 
                className="hidden" 
                disabled={existingImages.length + newImages.length >= 5} 
              />
            </label>
            <p className="text-xs mt-1" style={{ color: colors.muted }}>{existingImages.length + newImages.length} / 5 images</p>
          </div>

          {/* New Images Preview */}
          {newImages.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {newImages.map((image, index) => (
                <div key={index} className="relative group">
                  <img src={URL.createObjectURL(image)} alt={`New ${index + 1}`} className="w-full h-16 sm:h-20 object-cover rounded-lg" />
                  <button 
                    type="button" 
                    onClick={() => removeNewImage(index)} 
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                  >
                    <X size={14} />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-1 text-center">New</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Image Summary */}
        <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: colors.cardHover }}>
          <h3 className="font-medium mb-2" style={{ color: colors.accent }}>Image Summary</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div style={{ color: colors.muted }}>Original images:</div><div className="font-medium" style={{ color: colors.text }}>{originalImages.length}</div>
            <div style={{ color: colors.muted }}>Images to keep:</div><div className="font-medium" style={{ color: colors.success }}>{existingImages.length}</div>
            <div style={{ color: colors.muted }}>Images to remove:</div><div className="font-medium" style={{ color: colors.danger }}>{removedImages.length}</div>
            <div style={{ color: colors.muted }}>New images to add:</div><div className="font-medium" style={{ color: colors.accent }}>{newImages.length}</div>
            <div className="col-span-2 pt-2 border-t font-bold" style={{ borderColor: colors.border, color: colors.text }}>
              Total after update: {existingImages.length + newImages.length} / 5
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: colors.cardHover }}>
          <div className="flex items-start gap-2">
            <AlertCircle size={16} style={{ color: colors.accent }} />
            <div>
              <h3 className="font-medium mb-1" style={{ color: colors.accent }}>Important Information</h3>
              <ul className="text-xs space-y-1" style={{ color: colors.muted }}>
                <li>• Only CREATED or ASSIGNED complaints can be edited</li>
                <li>• Maximum 5 images allowed in total</li>
                <li>• Click X on images to mark them for removal</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button 
            type="button" 
            onClick={() => navigate(`/complaints/${id}`)} 
            className="flex-1 px-4 py-3 rounded-lg font-medium text-sm transition-all hover:opacity-80"
            style={{ backgroundColor: colors.cardHover, color: colors.text }}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={updating} 
            className="flex-1 px-4 py-3 rounded-lg font-medium text-sm disabled:opacity-50 transition-all hover:opacity-90 flex items-center justify-center"
            style={{ backgroundColor: colors.accent, color: isDark ? "#000" : "#FFF" }}
          >
            {updating ? <><Loader2 className="animate-spin mr-2" size={16} /> Updating...</> : "Update Complaint"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditComplaint;
