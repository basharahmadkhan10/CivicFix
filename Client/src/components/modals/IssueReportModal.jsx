import { useState, useRef } from "react";
import {
  X,
  Camera,
  MapPin,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  Hash,
  MessageSquare,
  Calendar,
  User,
} from "lucide-react";
import PrimaryButton from "../ui/PrimaryButton";
const IssueReportModal = ({ isOpen, onClose, theme }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    location: "",
    priority: "medium",
    images: [],
    anonymous: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const colors =
    theme === "light"
      ? {
          background: "#ffffff",
          text: "#000000",
          mutedText: "#666666",
          accent: "#000000",
          cardBg: "#f8f8f8",
          border: "rgba(0,0,0,0.1)",
          buttonBg: "#000000",
          buttonText: "#ffffff",
        }
      : {
          background: "#000000",
          text: "#ffffff",
          mutedText: "#cccccc",
          accent: "#ffffff",
          cardBg: "#111111",
          border: "rgba(255,255,255,0.1)",
          buttonBg: "#ffffff",
          buttonText: "#000000",
        };

  const categories = [
    "Road Damage",
    "Public Lighting",
    "Sanitation",
    "Traffic Issues",
    "Illegal Construction",
    "Water Supply",
    "Parks & Recreation",
    "Noise Pollution",
    "Other",
  ];

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.slice(0, 5 - formData.images.length);

    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...newImages],
    }));
  };

  const removeImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    console.log("Issue submitted:", formData);
    setIsSubmitting(false);
    onClose();
    setFormData({
      title: "",
      category: "",
      description: "",
      location: "",
      priority: "medium",
      images: [],
      anonymous: false,
    });
    setStep(1);
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-2xl rounded-2xl"
        style={{
          backgroundColor: colors.background,
          border: `1px solid ${colors.border}`,
          boxShadow: `0 20px 60px rgba(0,0,0,0.3)`,
        }}
      >
        <div
          className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: colors.border }}
        >
          <h2 className="text-2xl font-bold">Report New Issue</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:scale-110 transition-transform"
            style={{ color: colors.mutedText }}
          >
            <X size={24} />
          </button>
        </div>
        <div className="px-6 pt-6">
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${step === stepNum ? "scale-110" : ""}`}
                  style={{
                    backgroundColor:
                      step >= stepNum ? colors.accent : colors.cardBg,
                    color:
                      step >= stepNum ? colors.buttonText : colors.mutedText,
                    border:
                      step < stepNum ? `2px solid ${colors.border}` : "none",
                  }}
                >
                  {stepNum}
                </div>
                {stepNum < 3 && (
                  <div
                    className="w-12 h-0.5 mx-2"
                    style={{
                      backgroundColor:
                        step > stepNum ? colors.accent : colors.border,
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block mb-2 font-medium">Issue Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Brief description of the issue"
                  className="w-full p-3 rounded-lg"
                  style={{
                    backgroundColor: colors.cardBg,
                    border: `1px solid ${colors.border}`,
                    color: colors.text,
                  }}
                />
              </div>
              <div>
                <label className="block mb-2 font-medium">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full p-3 rounded-lg"
                  style={{
                    backgroundColor: colors.cardBg,
                    border: `1px solid ${colors.border}`,
                    color: colors.text,
                  }}
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2 font-medium">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Provide detailed information about the issue..."
                  rows={4}
                  className="w-full p-3 rounded-lg resize-none"
                  style={{
                    backgroundColor: colors.cardBg,
                    border: `1px solid ${colors.border}`,
                    color: colors.text,
                  }}
                />
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block mb-2 font-medium">Location *</label>
                <div className="relative">
                  <MapPin
                    className="absolute left-3 top-1/2 transform -translate-y-1/2"
                    size={20}
                    style={{ color: colors.mutedText }}
                  />
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    placeholder="Address or landmark"
                    className="w-full pl-10 pr-3 py-3 rounded-lg"
                    style={{
                      backgroundColor: colors.cardBg,
                      border: `1px solid ${colors.border}`,
                      color: colors.text,
                    }}
                  />
                </div>
                <div
                  className="mt-2 text-sm"
                  style={{ color: colors.mutedText }}
                >
                  Use exact address or drop a pin on the map
                </div>
              </div>

              <div>
                <label className="block mb-2 font-medium">Priority</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: "low", label: "Low", color: "#10b981" },
                    { value: "medium", label: "Medium", color: "#f59e0b" },
                    { value: "high", label: "High", color: "#ef4444" },
                  ].map((priority) => (
                    <button
                      key={priority.value}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, priority: priority.value })
                      }
                      className={`p-3 rounded-lg border text-center ${formData.priority === priority.value ? "ring-2" : ""}`}
                      style={{
                        backgroundColor:
                          formData.priority === priority.value
                            ? `${priority.color}20`
                            : colors.cardBg,
                        borderColor:
                          formData.priority === priority.value
                            ? priority.color
                            : colors.border,
                        color: colors.text,
                      }}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <AlertCircle
                          size={16}
                          style={{ color: priority.color }}
                        />
                        <span>{priority.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block mb-2 font-medium">Upload Images</label>
                <div
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-opacity-50 transition-colors"
                  style={{
                    borderColor: colors.border,
                    backgroundColor: colors.cardBg,
                  }}
                  onClick={() => fileInputRef.current.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    multiple
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="flex flex-col items-center">
                    <Upload
                      size={48}
                      style={{ color: colors.mutedText, marginBottom: "16px" }}
                    />
                    <div className="font-medium mb-2">
                      Click to upload images
                    </div>
                    <div
                      className="text-sm"
                      style={{ color: colors.mutedText }}
                    >
                      Upload up to 5 images (Max 5MB each)
                    </div>
                  </div>
                </div>

                {formData.images.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div
                className="p-4 rounded-lg"
                style={{ backgroundColor: `${colors.accent}10` }}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle size={20} style={{ color: colors.accent }} />
                  <h3 className="font-semibold">Review Your Report</h3>
                </div>
                <p className="text-sm" style={{ color: colors.mutedText }}>
                  Please review all details before submitting. This report will
                  be sent to municipal authorities.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Hash size={20} style={{ color: colors.mutedText }} />
                  <div>
                    <div
                      className="text-sm"
                      style={{ color: colors.mutedText }}
                    >
                      Title
                    </div>
                    <div className="font-medium">{formData.title}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <AlertCircle size={20} style={{ color: colors.mutedText }} />
                  <div>
                    <div
                      className="text-sm"
                      style={{ color: colors.mutedText }}
                    >
                      Category
                    </div>
                    <div className="font-medium">{formData.category}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <MessageSquare
                    size={20}
                    style={{ color: colors.mutedText }}
                  />
                  <div>
                    <div
                      className="text-sm"
                      style={{ color: colors.mutedText }}
                    >
                      Description
                    </div>
                    <div className="font-medium">{formData.description}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <MapPin size={20} style={{ color: colors.mutedText }} />
                  <div>
                    <div
                      className="text-sm"
                      style={{ color: colors.mutedText }}
                    >
                      Location
                    </div>
                    <div className="font-medium">{formData.location}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <AlertCircle size={20} style={{ color: colors.mutedText }} />
                  <div>
                    <div
                      className="text-sm"
                      style={{ color: colors.mutedText }}
                    >
                      Priority
                    </div>
                    <div
                      className="font-medium"
                      style={{ textTransform: "capitalize" }}
                    >
                      {formData.priority}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={formData.anonymous}
                  onChange={(e) =>
                    setFormData({ ...formData, anonymous: e.target.checked })
                  }
                  className="rounded"
                />
                <label
                  htmlFor="anonymous"
                  className="text-sm"
                  style={{ color: colors.mutedText }}
                >
                  Submit anonymously
                </label>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="px-6 py-3 rounded-lg font-medium"
                style={{
                  backgroundColor: colors.cardBg,
                  color: colors.text,
                  border: `1px solid ${colors.border}`,
                }}
              >
                Back
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <PrimaryButton
                onClick={() => setStep(step + 1)}
                theme={theme}
                disabled={
                  !formData.title || !formData.category || !formData.description
                }
              >
                Continue
              </PrimaryButton>
            ) : (
              <PrimaryButton
                onClick={handleSubmit}
                theme={theme}
                disabled={isSubmitting || !formData.location}
              >
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </PrimaryButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueReportModal;
