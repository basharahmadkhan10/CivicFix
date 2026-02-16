const PrimaryButton = ({
  as: Component = "button",
  children,
  type,
  loading = false,
  fullWidth = false,
  disabled,
  className = "",
  theme = "light",
  ...props
}) => {
  const baseClasses =
    "px-4 py-2.5 lg:px-6 lg:py-3.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-center text-sm lg:text-base";

  const widthClass = fullWidth ? "w-full" : "";
  const disabledClass =
    disabled || loading
      ? "opacity-60 cursor-not-allowed pointer-events-none"
      : "hover:shadow-xl active:scale-[0.98]";

  const themeClasses =
    theme === "dark"
      ? "bg-white text-black hover:bg-gray-100"
      : "bg-black text-white hover:bg-gray-900";

  // Only pass type when it's a real button
  const componentProps =
    Component === "button"
      ? { type: type || "button", disabled: disabled || loading, ...props }
      : { ...props };

  return (
    <Component
      {...componentProps}
      className={`${baseClasses} ${widthClass} ${disabledClass} ${themeClasses} ${className}`}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin h-4 w-4 mr-2"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
            />
          </svg>
          Processing...
        </>
      ) : (
        children
      )}
    </Component>
  );
};

export default PrimaryButton;
