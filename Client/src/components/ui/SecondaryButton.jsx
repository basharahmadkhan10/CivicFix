const SecondaryButton = ({
  children,
  type = "button",
  loading = false,
  fullWidth = false,
  onClick,
  disabled,
  className = "",
}) => {
  const baseClasses =
    "px-4 py-2.5 lg:px-6 lg:py-3.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-center text-sm lg:text-base";
  const widthClass = fullWidth ? "w-full" : "";
  const disabledClass =
    disabled || loading
      ? "opacity-60 cursor-not-allowed"
      : "hover:shadow-xl active:scale-[0.98]";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} bg-[#0a0a0a] text-white border border-[#1a1a1a] hover:bg-[#1a1a1a] hover:border-[#333333] ${widthClass} ${disabledClass} ${className}`}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin h-4 w-4 lg:h-5 lg:w-5 mr-2 text-current"
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
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
            ></path>
          </svg>
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default SecondaryButton;
