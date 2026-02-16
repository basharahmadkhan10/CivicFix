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
  const { theme } = useTheme();
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

  const categories = [
    "Road", "Water", "Electricity", "Sanitation", 
    "Public Lighting", "Traffic", "Illegal Construction", "Other"
  ];

  const colors =
    theme === "light"
      ? { 
          bg: "#ffffff", 
          text: "#000000", 
          card: "#f3f4f6", 
          border: "#e5e7eb",
          primary: "#3b82f6",
          danger: "#ef4444",
          success: "#10b981"
        }
      : { 
          bg: "#000000", 
          text: "#ffffff", 
          card: "#111111", 
          border: "#374151",
          primary: "#3b82f6",
          danger: "#ef4444",
          success: "#10b981"
        };

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
      
      existingImages.forEach((img) => {
        formDataToSend.append("existingImages", img);
      });
      
      newImages.forEach((file) => {
        formDataToSend.append("image", file);
      });

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

  if (loading || !pageLoaded) {
    return <Preloader />;
  }

  return (
    <div
      className="min-h-screen p-3 sm:p-4 md:p-6"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {/* Back Button - Mobile Optimized */}
      <button
        onClick={() => navigate(`/complaints/${id}`)}
        className="mb-4 flex items-center text-sm"
        style={{ color: colors.primary }}
      >
        <ArrowLeft size={18} className="mr-1" />
        Back to Complaint
      </button>

      {/* Header */}
      <header className="mb-6 text-center">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Edit Complaint</h1>
        <p className="text-xs sm:text-sm opacity-75 mt-1">
          Update your complaint details
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
            placeholder="Brief title of the issue"
            className="w-full p-3 rounded-lg text-sm focus:outline-none focus:ring-2"
            style={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
              focusRingColor: colors.primary,
            }}
            required
          />
        </div>

        {/* Category and Area */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
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
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">
              Area/Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="area"
              value={formData.area}
              onChange={handleInputChange}
              placeholder="e.g., Main Street"
              className="w-full p-3 rounded-lg text-sm focus:outline-none focus:ring-2"
              style={{
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
              }}
              required
            />
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
            placeholder="Detailed description of the issue..."
            rows="5"
            className="w-full p-3 rounded-lg text-sm focus:outline-none focus:ring-2"
            style={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
            }}
            required
          />
        </div>

        {/* Existing Images */}
        {originalImages.length > 0 && (
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium">Existing Images</label>
            
            {/* Removed Images */}
            {removedImages.length > 0 && (
              <div className="mb-3 p-3 rounded-lg border border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
                <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                  Images marked for removal:
                </p>
                <div className="flex flex-wrap gap-2">
                  {removedImages.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={getFullImageUrl(img)}
                        alt={`Removed ${index + 1}`}
                        className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded opacity-50 border-2 border-red-500"
                      />
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

            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {existingImages.map((img, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={getFullImageUrl(img)}
                      alt={`Existing ${index + 1}`}
                      className="w-full h-16 sm:h-20 object-cover rounded-lg"
                    />
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
          <label className="block mb-2 text-sm font-medium">
            Add More Images (Optional)
          </label>
          
          <div className="mb-3">
            <label
              className={`inline-flex items-center px-4 py-2 rounded-lg cursor-pointer transition-colors text-sm ${
                existingImages.length + newImages.length >= 5 ? "opacity-50 cursor-not-allowed" : "hover:opacity-80"
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
                onChange={handleNewImageUpload}
                className="hidden"
                disabled={existingImages.length + newImages.length >= 5}
              />
            </label>
            <p className="text-xs opacity-75 mt-1">
              {existingImages.length + newImages.length} / 5 images
            </p>
          </div>

          {/* New Images Preview */}
          {newImages.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {newImages.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`New ${index + 1}`}
                    className="w-full h-16 sm:h-20 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewImage(index)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                  >
                    <X size={14} />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-1 text-center">
                    New
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Image Summary */}
        <div
          className="mb-4 p-3 rounded-lg text-sm"
          style={{
            backgroundColor: `${colors.border}20`,
            border: `1px solid ${colors.border}`,
          }}
        >
          <h3 className="font-medium mb-2">Image Summary</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>Original images:</div>
            <div className="font-medium">{originalImages.length}</div>
            <div>Images to keep:</div>
            <div className="font-medium text-green-600">{existingImages.length}</div>
            <div>Images to remove:</div>
            <div className="font-medium text-red-600">{removedImages.length}</div>
            <div>New images to add:</div>
            <div className="font-medium text-blue-600">{newImages.length}</div>
            <div className="col-span-2 pt-2 border-t font-bold">
              Total after update: {existingImages.length + newImages.length} / 5
            </div>
          </div>
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
              <h3 className="font-medium mb-1">Important Information</h3>
              <ul className="text-xs space-y-1 opacity-75">
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
            className="flex-1 px-4 py-3 rounded-lg font-medium text-sm hover:opacity-80 transition-opacity"
            style={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={updating}
            className="flex-1 px-4 py-3 rounded-lg font-medium text-sm text-white disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center justify-center"
            style={{ backgroundColor: colors.primary }}
          >
            {updating ? (
              <>
                <Loader2 className="animate-spin mr-2" size={16} />
                Updating...
              </>
            ) : (
              "Update Complaint"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditComplaint;
