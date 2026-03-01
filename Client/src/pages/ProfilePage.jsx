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
  const { theme, toggleTheme } = useTheme();
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
        warning: "#F6AD55",
        danger: "#FC8181",
        info: "#4299E1",
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
      accent: accentColor,
      accentLight: "rgba(151, 171, 51, 0.15)",
      success: "#68D391",
      warning: "#FBD38D",
      danger: "#FC8181",
      info: "#63B3ED",
      muted: "#A0AEC0",
      shadow: "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)",
    };
  };

  const colors = getThemeColors();
  const isDark = theme === "dark";

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

      toast.error("Failed to load profile from server, using cached data");
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
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    setNewProfileImageFile(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewProfileImagePreview(reader.result);
    };
    reader.readAsDataURL(file);

    toast.info("New profile image selected");
  };

  const removeProfileImage = () => {
    setNewProfileImageFile(null);
    setNewProfileImagePreview(null);
    toast.info("Image selection cancelled");
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);

      // Validation
      if (!formData.name.trim()) {
        toast.error("Name is required");
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

      toast.info("Updating profile...");

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

        toast.success("Profile updated successfully!");

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
      toast.error(`Update failed: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData(originalData);
    setNewProfileImageFile(null);
    setNewProfileImagePreview(null);
    setIsEditing(false);
    toast.info("Changes discarded");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
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

      {/* Header with back button and theme toggle */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => {
            toast.info("Returning to dashboard...");
            setTimeout(() => {
              navigate("/dashboard");
            }, 500);
          }}
          className="flex items-center text-sm px-3 py-2 rounded-lg transition-all hover:opacity-80"
          style={{ backgroundColor: colors.cardHover, color: colors.text }}
        >
          <ArrowLeft size={18} className="mr-1" />
          Back to Dashboard
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
      <header className="mb-8 text-center">
        <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: colors.accent }}>
          My Profile
        </h1>
        <p className="text-sm" style={{ color: colors.muted }}>
          Manage your personal information
        </p>
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
                className="w-32 h-32 rounded-full overflow-hidden border-2"
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
                        <div class="w-full h-full flex items-center justify-center" style="background-color: ${colors.cardHover}">
                          <span style="color: ${colors.text}; font-size: 32px; font-weight: 600;">${formData.name?.charAt(0) || "U"}</span>
                        </div>
                      `;
                    }}
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-3xl font-bold"
                    style={{
                      backgroundColor: colors.cardHover,
                      color: colors.text,
                    }}
                  >
                    {formData.name?.charAt(0) || "U"}
                  </div>
                )}
              </div>

              {isEditing && (
                <div className="absolute bottom-0 right-0 flex gap-2">
                  <label className="cursor-pointer p-2 rounded-full transition-colors"
                    style={{ backgroundColor: colors.accent, color: isDark ? "#000" : "#FFF" }}>
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
                      className="p-2 rounded-full transition-colors"
                      style={{ backgroundColor: colors.danger, color: "#FFF" }}
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
                  <h2 className="text-xl md:text-2xl font-bold mb-1" style={{ color: colors.text }}>
                    {formData.name}
                  </h2>
                  <div className="flex items-center justify-center md:justify-start gap-2 text-sm" style={{ color: colors.muted }}>
                    <Shield size={14} style={{ color: colors.accent }} />
                    <span>{formData.role}</span>
                  </div>
                </div>

                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="mt-4 md:mt-0 px-4 py-2 rounded-lg flex items-center gap-2 transition-all hover:opacity-80"
                    style={{
                      backgroundColor: colors.accent,
                      color: isDark ? "#000" : "#FFF",
                    }}
                  >
                    <Edit2 size={16} />
                    Edit Profile
                  </button>
                ) : (
                  <div className="mt-4 md:mt-0 flex gap-2">
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 rounded-lg flex items-center gap-2 transition-all hover:opacity-80"
                      style={{
                        backgroundColor: colors.cardHover,
                        color: colors.text,
                      }}
                    >
                      <X size={16} />
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="px-4 py-2 rounded-lg flex items-center gap-2 transition-all hover:opacity-80 disabled:opacity-50"
                      style={{
                        backgroundColor: colors.accent,
                        color: isDark ? "#000" : "#FFF",
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div
                  className="text-center p-3 rounded-lg"
                  style={{ backgroundColor: colors.cardHover }}
                >
                  <div className="text-xl font-bold" style={{ color: colors.accent }}>24</div>
                  <div className="text-xs" style={{ color: colors.muted }}>Complaints</div>
                </div>
                <div
                  className="text-center p-3 rounded-lg"
                  style={{ backgroundColor: colors.cardHover }}
                >
                  <div className="text-xl font-bold" style={{ color: colors.success }}>18</div>
                  <div className="text-xs" style={{ color: colors.muted }}>Resolved</div>
                </div>
                <div
                  className="text-center p-3 rounded-lg"
                  style={{ backgroundColor: colors.cardHover }}
                >
                  <div className="text-xl font-bold" style={{ color: colors.warning }}>4</div>
                  <div className="text-xs" style={{ color: colors.muted }}>In Progress</div>
                </div>
                <div
                  className="text-center p-3 rounded-lg"
                  style={{ backgroundColor: colors.cardHover }}
                >
                  <div className="text-xl font-bold" style={{ color: colors.info }}>2</div>
                  <div className="text-xs" style={{ color: colors.muted }}>Pending</div>
                </div>
              </div>

              {/* Member Since */}
              <div className="flex items-center justify-center md:justify-start gap-2 text-sm" style={{ color: colors.muted }}>
                <Calendar size={14} style={{ color: colors.accent }} />
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
          <h3 className="text-lg font-bold mb-6" style={{ color: colors.accent }}>
            Personal Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className="block mb-2 text-sm font-medium flex items-center gap-2" style={{ color: colors.text }}>
                <User size={16} style={{ color: colors.accent }} />
                Full Name <span className="text-red-500">*</span>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-lg focus:outline-none focus:ring-1 text-sm"
                  style={{
                    backgroundColor: colors.cardHover,
                    border: `1px solid ${colors.border}`,
                    color: colors.text,
                  }}
                  required
                />
              ) : (
                <div
                  className="p-3 rounded-lg text-sm"
                  style={{ backgroundColor: colors.cardHover, color: colors.text }}
                >
                  {formData.name}
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block mb-2 text-sm font-medium flex items-center gap-2" style={{ color: colors.text }}>
                <Mail size={16} style={{ color: colors.accent }} />
                Email Address
              </label>
              <div
                className="p-3 rounded-lg text-sm"
                style={{ backgroundColor: colors.cardHover, color: colors.muted }}
              >
                {formData.email}
              </div>
              <p className="text-xs mt-1" style={{ color: colors.muted }}>Email cannot be changed</p>
            </div>  

            {/* Role */}
            <div>
              <label className="block mb-2 text-sm font-medium flex items-center gap-2" style={{ color: colors.text }}>
                <Shield size={16} style={{ color: colors.accent }} />
                Account Role
              </label>
              <div
                className="p-3 rounded-lg text-sm"
                style={{ backgroundColor: colors.cardHover, color: colors.text }}
              >
                {formData.role}
              </div>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div
          className="rounded-xl p-6 mb-6"
          style={{
            backgroundColor: colors.card,
            border: `1px solid ${colors.border}`,
          }}
        >
          <h3 className="text-lg font-bold mb-6" style={{ color: colors.accent }}>
            Account Actions
          </h3>

          <div className="space-y-4">
            <button
              onClick={handleLogout}
              className="w-full md:w-auto px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-all hover:opacity-80"
              style={{
                backgroundColor: colors.danger,
                color: "#FFF",
              }}
            >
              <LogOut size={18} />
              Logout
            </button>

            <p className="text-sm" style={{ color: colors.muted }}>
              Need help with your account? Contact support at
              support@civicfix.com
            </p>
          </div>
        </div>

        {/* Important Notes */}
        <div
          className="p-4 rounded-lg"
          style={{
            backgroundColor: colors.cardHover,
          }}
        >
          <h4 className="font-medium mb-2" style={{ color: colors.accent }}>
            Important Information
          </h4>
          <ul className="text-xs space-y-1" style={{ color: colors.muted }}>
            <li>• Your email is used for login and cannot be changed</li>
            <li>• Profile image should be a clear photo of yourself</li>
            <li>• Keep your contact information up to date for better service</li>
            <li>• All your data is stored securely and privately</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
