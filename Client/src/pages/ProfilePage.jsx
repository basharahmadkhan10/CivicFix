import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit2,
  Save,
  X,
  Camera,
  Loader2,
  Shield,
  LogOut,
} from "lucide-react";
import api from "../utils/api";
import Preloader from "../components/Preloader";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [newProfileImageFile, setNewProfileImageFile] = useState(null);
  const [newProfileImagePreview, setNewProfileImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    dateOfBirth: "",
  });
  const [originalData, setOriginalData] = useState({});

  const colors =
    theme === "light"
      ? {
          bg: "#ffffff",
          text: "#000000",
          card: "#f8f9fa",
          border: "#e5e7eb",
          accent: "#3b82f6",
        }
      : {
          bg: "#000000",
          text: "#ffffff",
          card: "#111111",
          border: "#374151",
          accent: "#60a5fa",
        };

  // Helper function to get full image URL
  const getFullImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;
    if (imagePath.startsWith("/uploads")) {
      return `http://localhost:5000${imagePath}`;
    }
    return imagePath;
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get("/v1/user/me");
      const userData = response.data?.data || response.data;

      if (userData) {
        console.log("User data received:", userData);

        // Format dateOfBirth if it exists
        let formattedDate = "";
        if (userData.dateOfBirth) {
          const date = new Date(userData.dateOfBirth);
          formattedDate = date.toISOString().split("T")[0];
        }

        const formattedData = {
          name: userData.name || "",
          email: userData.email || "",
          phone: userData.phone || "",
          address: userData.address || "",
          dateOfBirth: formattedDate,
          role: userData.role || "Citizen",
          joinDate: userData.createdAt
            ? new Date(userData.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : "Unknown",
          profileImage: userData.profileImage || null,
        };

        setFormData(formattedData);
        setOriginalData(formattedData);
        setProfileImage(userData.profileImage);

        // Update localStorage with fresh data
        const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
        const updatedUser = { ...currentUser, ...userData };
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error("Error fetching profile:", error);

      // Fallback to localStorage data
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          setFormData({
            name: userData.name || "",
            email: userData.email || "",
            phone: userData.phone || "",
            address: userData.address || "",
            dateOfBirth: userData.dateOfBirth || "",
            role: userData.role || "Citizen",
            joinDate: "Unknown",
            profileImage: userData.profileImage || null,
          });
          setProfileImage(userData.profileImage || null);
        } catch (e) {
          console.error("Error parsing saved user:", e);
        }
      }

      toast.error("Failed to load profile from server, using cached data", {
        position: "top-right",
        duration: 5000,
      });
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

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file", {
        position: "top-right",
        duration: 4000,
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB", {
        position: "top-right",
        duration: 4000,
      });
      return;
    }

    setNewProfileImageFile(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewProfileImagePreview(reader.result);
    };
    reader.readAsDataURL(file);

    toast.info("New profile image selected", {
      position: "top-right",
      duration: 3000,
    });
  };

  const removeProfileImage = () => {
    setNewProfileImageFile(null);
    setNewProfileImagePreview(null);
    toast.info("Image selection cancelled", {
      position: "top-right",
      duration: 3000,
    });
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);

      // Validation
      if (!formData.name.trim()) {
        toast.error("Name is required", {
          position: "top-center",
          duration: 4000,
        });
        setSaving(false);
        return;
      }

      const updateData = new FormData();

      // Add text fields
      updateData.append("name", formData.name);
      if (formData.phone !== originalData.phone) {
        updateData.append("phone", formData.phone);
      }
      if (formData.address !== originalData.address) {
        updateData.append("address", formData.address);
      }
      if (formData.dateOfBirth !== originalData.dateOfBirth) {
        updateData.append("dateOfBirth", formData.dateOfBirth);
      }

      // Add profile image if changed
      if (newProfileImageFile) {
        updateData.append("profileImage", newProfileImageFile);
      }

      toast.info("Updating profile...", {
        position: "top-right",
        duration: 2000,
      });

      const response = await api.patch("/v1/user/me", updateData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        const updatedUser = response.data.data;

        // Update localStorage with new user data
        const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
        const newUserData = {
          ...currentUser,
          ...updatedUser,
        };

        localStorage.setItem("user", JSON.stringify(newUserData));

        // Update local state
        const updatedFormData = {
          ...formData,
          profileImage: updatedUser.profileImage,
        };

        setFormData(updatedFormData);
        setOriginalData(updatedFormData);
        setProfileImage(updatedUser.profileImage);
        setNewProfileImageFile(null);
        setNewProfileImagePreview(null);
        setIsEditing(false);

        toast.success("Profile updated successfully!", {
          position: "top-right",
          duration: 4000,
        });

        // Refresh the page to show updated image
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to update profile";
      toast.error(`Update failed: ${errorMessage}`, {
        position: "top-right",
        duration: 5000,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData(originalData);
    setNewProfileImageFile(null);
    setNewProfileImagePreview(null);
    setIsEditing(false);
    toast.info("Changes discarded", {
      position: "top-right",
      duration: 3000,
    });
  };

  const handleLogout = () => {
    const confirmToastId = toast.warning(
      <div className="flex flex-col gap-2">
        <div className="font-bold text-sm">Confirm Logout</div>
        <div className="text-xs opacity-90">
          Are you sure you want to logout?
        </div>
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => {
              toast.removeToast(confirmToastId);
              performLogout();
            }}
            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded transition-colors"
          >
            Yes, Logout
          </button>
          <button
            onClick={() => {
              toast.removeToast(confirmToastId);
              toast.info("Logout cancelled", {
                position: "top-right",
                duration: 3000,
              });
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

  const performLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully", {
      position: "top-right",
      duration: 3000,
    });
    navigate("/login");
  };

  // Show preloader while loading
  if (loading || !pageLoaded) {
    return <Preloader />;
  }

  // Determine which image to display
  const displayImage =
    newProfileImagePreview ||
    (profileImage ? getFullImageUrl(profileImage) : null);

  return (
    <div
      className="min-h-screen p-4 md:p-6"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      <button
        onClick={() => {
          toast.info("Returning to dashboard...");
          setTimeout(() => {
            navigate("/dashboard");
          }, 500);
        }}
        className="px-4 py-2 rounded-lg flex items-center hover:opacity-90 transition-opacity"
      >
        <ArrowLeft size={18} className="mr-2" />
      </button>
      {/* Header */}
      <header className="mb-6 md:mb-8 flex items-center justify-between flex-col">
        <h1 className="text-2xl md:text-3xl font-bold">My Profile</h1>
        <p className="opacity-75 mt-1">Manage your personal information</p>
      </header>

      <div className="max-w-4xl mx-auto">
        {/* Profile Card */}
        <div
          className="rounded-xl p-6 mb-6"
          style={{
            backgroundColor: colors.card,
            border: `1px solid ${colors.border}`,
          }}
        >
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Profile Image */}
            <div className="relative">
              <div
                className="w-32 h-32 rounded-full overflow-hidden border-4"
                style={{ borderColor: colors.accent }}
              >
                {displayImage ? (
                  <img
                    src={displayImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error("Failed to load image:", displayImage);
                      e.target.onerror = null;
                      e.target.style.display = "none";
                      e.target.parentElement.innerHTML = `
                        <div class="w-full h-full flex items-center justify-center" style="background-color: ${colors.border}">
                          <span style="color: ${colors.text}">${formData.name?.charAt(0) || "U"}</span>
                        </div>
                      `;
                    }}
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-2xl font-bold"
                    style={{
                      backgroundColor: colors.border,
                      color: colors.text,
                    }}
                  >
                    {formData.name?.charAt(0) || "U"}
                  </div>
                )}
              </div>

              {isEditing && (
                <div className="absolute bottom-0 right-0 flex gap-2">
                  <label className="cursor-pointer p-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-colors">
                    <Camera size={18} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  {newProfileImagePreview && (
                    <button
                      type="button"
                      onClick={removeProfileImage}
                      className="p-2 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold mb-1">
                    {formData.name}
                  </h2>
                  <div className="flex items-center justify-center md:justify-start gap-2 text-sm opacity-75">
                    <Shield size={14} />
                    <span>{formData.role}</span>
                  </div>
                </div>

                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="mt-4 md:mt-0 px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-80 transition-opacity"
                    style={{
                      backgroundColor: colors.accent,
                      color: "white",
                    }}
                  >
                    <Edit2 size={16} />
                    Edit Profile
                  </button>
                ) : (
                  <div className="mt-4 md:mt-0 flex gap-2">
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-80 transition-opacity"
                      style={{
                        backgroundColor: colors.card,
                        border: `1px solid ${colors.border}`,
                      }}
                    >
                      <X size={16} />
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-80 transition-opacity disabled:opacity-50"
                      style={{
                        backgroundColor: "#10b981",
                        color: "white",
                      }}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="animate-spin" size={16} />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={16} />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div
                  className="text-center p-3 rounded-lg"
                  style={{ backgroundColor: `${colors.border}30` }}
                >
                  <div className="text-2xl font-bold">24</div>
                  <div className="text-sm opacity-75">Complaints</div>
                </div>
                <div
                  className="text-center p-3 rounded-lg"
                  style={{ backgroundColor: `${colors.border}30` }}
                >
                  <div className="text-2xl font-bold">18</div>
                  <div className="text-sm opacity-75">Resolved</div>
                </div>
                <div
                  className="text-center p-3 rounded-lg"
                  style={{ backgroundColor: `${colors.border}30` }}
                >
                  <div className="text-2xl font-bold">4</div>
                  <div className="text-sm opacity-75">In Progress</div>
                </div>
                <div
                  className="text-center p-3 rounded-lg"
                  style={{ backgroundColor: `${colors.border}30` }}
                >
                  <div className="text-2xl font-bold">2</div>
                  <div className="text-sm opacity-75">Pending</div>
                </div>
              </div>

              {/* Member Since */}
              <div className="flex items-center justify-center md:justify-start gap-2 text-sm opacity-75">
                <Calendar size={14} />
                <span>Member since {formData.joinDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Personal Information Form */}
        <div
          className="rounded-xl p-6 mb-6"
          style={{
            backgroundColor: colors.card,
            border: `1px solid ${colors.border}`,
          }}
        >
          <h3 className="text-lg font-bold mb-6">Personal Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className="block mb-2 font-medium flex items-center gap-2">
                <User size={16} />
                Full Name <span className="text-red-500">*</span>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-lg focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: colors.bg,
                    border: `1px solid ${colors.border}`,
                  }}
                  required
                />
              ) : (
                <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: `${colors.border}20` }}
                >
                  {formData.name}
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block mb-2 font-medium flex items-center gap-2">
                <Mail size={16} />
                Email Address
              </label>
              <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: `${colors.border}20` }}
              >
                {formData.email}
              </div>
              <p className="text-xs opacity-75 mt-1">Email cannot be changed</p>
            </div>

            {/* Phone */}
            <div>
              <label className="block mb-2 font-medium flex items-center gap-2">
                <Phone size={16} />
                Phone Number
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                  className="w-full p-3 rounded-lg focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: colors.bg,
                    border: `1px solid ${colors.border}`,
                  }}
                />
              ) : (
                <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: `${colors.border}20` }}
                >
                  {formData.phone || "Not provided"}
                </div>
              )}
            </div>

            {/* Address */}
            <div>
              <label className="block mb-2 font-medium flex items-center gap-2">
                <MapPin size={16} />
                Address
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter your address"
                  className="w-full p-3 rounded-lg focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: colors.bg,
                    border: `1px solid ${colors.border}`,
                  }}
                />
              ) : (
                <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: `${colors.border}20` }}
                >
                  {formData.address || "Not provided"}
                </div>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block mb-2 font-medium flex items-center gap-2">
                <Calendar size={16} />
                Date of Birth
              </label>
              {isEditing ? (
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-lg focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: colors.bg,
                    border: `1px solid ${colors.border}`,
                  }}
                />
              ) : (
                <div
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: `${colors.border}20` }}
                >
                  {formData.dateOfBirth || "Not provided"}
                </div>
              )}
            </div>

            {/* Role */}
            <div>
              <label className="block mb-2 font-medium flex items-center gap-2">
                <Shield size={16} />
                Account Role
              </label>
              <div
                className="p-3 rounded-lg"
                style={{ backgroundColor: `${colors.border}20` }}
              >
                {formData.role}
              </div>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div
          className="rounded-xl p-6"
          style={{
            backgroundColor: colors.card,
            border: `1px solid ${colors.border}`,
          }}
        >
          <h3 className="text-lg font-bold mb-6">Account Actions</h3>

          <div className="space-y-4">
            <button
              onClick={handleLogout}
              className="w-full md:w-auto px-6 py-3 rounded-lg flex items-center justify-center gap-2 hover:opacity-80 transition-opacity"
              style={{
                backgroundColor: "#ef4444",
                color: "white",
              }}
            >
              <LogOut size={18} />
              Logout
            </button>

            <p className="text-sm opacity-75">
              Need help with your account? Contact support at
              support@citizenconnect.com
            </p>
          </div>
        </div>

        {/* Important Notes */}
        <div
          className="mt-6 p-4 rounded-lg"
          style={{
            backgroundColor: `${colors.border}20`,
            border: `1px solid ${colors.border}`,
          }}
        >
          <h4 className="font-medium mb-2">Important Information</h4>
          <ul className="text-sm space-y-1 opacity-75">
            <li>• Your email is used for login and cannot be changed</li>
            <li>• Profile image should be a clear photo of yourself</li>
            <li>
              • Keep your contact information up to date for better service
            </li>
            <li>• All your data is stored securely and privately</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
