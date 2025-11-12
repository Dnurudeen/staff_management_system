export default function Button({
    type = "button",
    className = "",
    disabled,
    variant = "primary",
    size = "md",
    children,
    ...props
}) {
    const baseClasses =
        "inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary:
            "bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500",
        secondary:
            "bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500",
        success:
            "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500",
        danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
        warning:
            "bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500",
        outline:
            "border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 focus:ring-indigo-500",
        ghost: "text-gray-700 hover:bg-gray-100 focus:ring-gray-500",
    };

    const sizes = {
        xs: "px-2 py-1 text-xs",
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base",
        xl: "px-8 py-4 text-lg",
    };

    return (
        <button
            type={type}
            className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    );
}
