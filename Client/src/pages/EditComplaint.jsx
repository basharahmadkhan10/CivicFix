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
    "Road",
    "Water",
    "Electricity",
    "Sanitation",
    "Public Lighting",
    "Traffic",
    "Illegal Construction",
    "Other",
  ];

  const colors =
    theme === "light"
      ? { bg: "#ffffff", text: "#000000", card: "#cad4f3", border: "#e5e7eb" }
      : { bg: "#000000", text: "#ffffff", card: "#111111", border: "#374151" };

  useEffect(() => {
    fetchComplaintDetails();
  }, [id]);

  const fetchComplaintDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/v1/complaints/${id}`);
      const complaint = response.data?.data;

      console.log("Fetched complaint:", complaint);

      if (complaint) {
        setFormData({
          title: complaint.title || "",
          description: complaint.description || "",
          category: complaint.category || "",
          area: complaint.area || "",
        });
        const citizenImages = complaint.images?.citizen || [];
        console.log("Citizen images:", citizenImages);

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
      setTimeout(() => {
        setPageLoaded(true);
      }, 500);
    }
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNewImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const totalImages = existingImages.length + newImages.length;
    const availableSlots = 5 - totalImages;
    const imagesToAdd = files.slice(0, availableSlots);

    if (files.length > availableSlots) {
      toast.warning(
        `You can only add ${availableSlots} more images (max 5 total)`,
        {
          position: "top-right",
          duration: 4000,
        },
      );
    }

    if (imagesToAdd.length > 0) {
      setNewImages((prev) => [...prev, ...imagesToAdd]);
      toast.info(`Added ${imagesToAdd.length} image(s)`, {
        position: "top-right",
        duration: 3000,
      });
    }
  };

  const removeNewImage = (index) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    toast.info("Image removed from upload queue", {
      position: "top-right",
      duration: 3000,
    });
  };

  const removeExistingImage = (index) => {
    const imageToRemove = existingImages[index];
    setRemovedImages((prev) => [...prev, imageToRemove]);
    setExistingImages((prev) => prev.filter((_, i) => i !== index));

    toast.warning("Image marked for removal. Click 'Restore' to undo.", {
      position: "top-right",
      duration: 4000,
    });
  };

  const restoreExistingImage = (imageUrl) => {
    setRemovedImages((prev) => prev.filter((img) => img !== imageUrl));
    setExistingImages((prev) => [...prev, imageUrl]);

    toast.success("Image restored successfully", {
      position: "top-right",
      duration: 3000,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.title ||
      !formData.description ||
      !formData.category ||
      !formData.area
    ) {
      toast.error("Please fill all required fields", {
        position: "top-center",
        duration: 4000,
      });
      return;
    }
    if (existingImages.length + newImages.length > 5) {
      toast.error("Maximum 5 images allowed. Please remove some images.", {
        position: "top-center",
        duration: 4000,
      });
      return;
    }

    proceedWithUpdate();
  };

  const proceedWithUpdate = async () => {
    try {
      setUpdating(true);

      toast.info("Updating complaint...", {
        position: "top-right",
        duration: 2000,
      });
      const formDataToSend = new FormData();s
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("category", formData.category);
      formDataToSend.append("area", formData.area);
      existingImages.forEach((img) => {
        formDataToSend.append("image", img);
      });
      newImages.forEach((file) => {
        formDataToSend.append("image", file);
      });
      console.log("Sending FormData:");
      for (let pair of formDataToSend.entries()) {
        if (pair[1] instanceof File) {
          console.log(pair[0] + ": File - " + pair[1].name);
        } else {
          console.log(pair[0] + ": " + pair[1]);
        }
      }
      const response = await api.patch(`/v1/complaints/${id}`, formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("Update response:", response.data);

      if (response.data?.success || response.status === 200) {
        toast.success("Complaint updated successfully!", {
          position: "top-right",
          duration: 4000,
        });

        setTimeout(() => {
          navigate(`/complaints/${id}`);
        }, 1500);
      }
    } catch (error) {
      console.error("Error updating complaint:", error);

      if (error.response) {
        console.error("Error status:", error.response.status);
        console.error("Error data:", error.response.data);

        const errorMessage =
          error.response.data?.message ||
          error.response.data?.error ||
          "Failed to update complaint";

        toast.error(errorMessage, {
          position: "top-right",
          duration: 5000,
        });
      } else {
        toast.error(`Failed to update: ${error.message}`, {
          position: "top-right",
          duration: 5000,
        });
      }
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
      className="min-h-screen p-4 md:p-6"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      
      <button
        onClick={() => {
          toast.info("Returning to dashboard...", {
            position: "top-right",
            duration: 2000,
          });
          setTimeout(() => {
            navigate(`/complaints/${id}`);
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
      <header className="mb-6 flex flex-col justify-center items-center">
        <h1 className="text-2xl md:text-3xl font-bold">Edit Complaint</h1>
        <p className="opacity-75 mt-1">Update your complaint details</p>
      </header>
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
        <div className="mb-6">
          <label className="block mb-2 font-medium">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Brief title of the issue"
            className="w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            style={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
            }}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
              placeholder="e.g., Main Street, Downtown"
              className="w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              style={{
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
              }}
            />
          </div>
        </div>
        <div className="mb-6">
          <label className="block mb-2 font-medium">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Detailed description of the issue..."
            rows="5"
            className="w-full p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            style={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
            }}
          />
        </div>
        {originalImages.length > 0 && (
          <div className="mb-6">
            <label className="block mb-2 font-medium">Existing Images</label>
            <p className="text-sm opacity-75 mb-2">
              {existingImages.length} of {originalImages.length} images will be
              kept.
              {removedImages.length > 0 &&
                ` ${removedImages.length} marked for removal.`}
            </p>
            {removedImages.length > 0 && (
              <div className="mb-4 p-3 rounded-lg border border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                  Images marked for removal:
                </p>
                <div className="flex flex-wrap gap-2">
                  {removedImages.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={getFullImageUrl(img)}
                        alt={`Removed ${index + 1}`}
                        className="w-16 h-16 object-cover rounded opacity-50 border-2 border-red-500"
                        onError={(e) => {
                          e.target.src =
                            "https://via.placeholder.com/64?text=Image";
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => restoreExistingImage(img)}
                        className="absolute inset-0 bg-green-500 bg-opacity-70 text-white rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Restore
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {existingImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {existingImages.map((img, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={getFullImageUrl(img)}
                      alt={`Existing ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                      onError={(e) => {
                        e.target.src =
                          "https://via.placeholder.com/150?text=Image";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <X size={16} />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-1 text-center rounded-b-lg">
                      Click X to remove
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="mb-6">
          <label className="block mb-2 font-medium">
            Add More Images (Optional)
          </label>
          <div className="mb-4">
            <label
              className={`inline-flex items-center px-4 py-3 rounded-lg cursor-pointer transition-colors ${
                existingImages.length + newImages.length >= 5
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:opacity-80"
              }`}
              style={{
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
              }}
            >
              <Upload size={20} className="mr-2" />
              Upload New Images
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleNewImageUpload}
                className="hidden"
                disabled={existingImages.length + newImages.length >= 5}
              />
            </label>
            <p className="text-sm opacity-75 mt-2">
              {existingImages.length + newImages.length} / 5 images used.
              {existingImages.length + newImages.length < 5
                ? ` You can add ${5 - (existingImages.length + newImages.length)} more.`
                : " Maximum limit reached."}
            </p>
          </div>
          {newImages.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mt-4">
              {newImages.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`New ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-1 text-center rounded-b-lg">
                    New image
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div
          className="mb-6 p-4 rounded-lg border"
          style={{
            backgroundColor: `${colors.border}15`,
            borderColor: colors.border,
          }}
        >
          <h3 className="font-medium mb-2">Image Summary</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between">
              <span>Original images:</span>
              <span className="font-medium">{originalImages.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Images to keep:</span>
              <span className="font-medium text-green-600">
                {existingImages.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Images to remove:</span>
              <span className="font-medium text-red-600">
                {removedImages.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span>New images to add:</span>
              <span className="font-medium text-blue-600">
                {newImages.length}
              </span>
            </div>
            <div
              className="col-span-2 flex justify-between pt-2 border-t"
              style={{ borderColor: colors.border }}
            >
              <span>Total after update:</span>
              <span className="font-bold">
                {existingImages.length + newImages.length} / 5
              </span>
            </div>
          </div>
        </div>
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
                  • You can only edit complaints that are in CREATED or ASSIGNED
                  status
                </li>
                <li>• Once an officer starts working on it, you cannot edit</li>
                <li>• Click X on existing images to mark them for removal</li>
                <li>• Click "Restore" on removed images to bring them back</li>
                <li>• Maximum 5 images allowed in total (existing + new)</li>
                <li>• Images marked for removal will be permanently deleted</li>
                <li className="text-blue-500 font-medium">
                  • Note: Priority cannot be changed by citizens
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => {
              toast.info("Cancelling changes...", {
                position: "top-right",
                duration: 2000,
              });
              setTimeout(() => {
                navigate(`/complaints/${id}`);
              }, 500);
            }}
            className="px-6 py-3 rounded-lg font-medium hover:opacity-80 transition-opacity flex-1"
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
            className="px-6 py-3 rounded-lg font-medium text-white flex-1 disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center justify-center"
            style={{
              backgroundColor: colors.bg === "#000000" ? "#3b82f6" : "#2563eb",
            }}
          >
            {updating ? (
              <>
                <Loader2 className="animate-spin mr-2" size={20} />
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
