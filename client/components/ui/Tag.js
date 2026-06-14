export default function Tag({ children, variant = "default", className = "" }) {
  const variants = {
    default: "bg-surface-container-low text-on-surface-variant border-outline-variant/30",
    primary: "bg-primary-container/20 text-primary border-primary/20",
    success: "bg-green-50 text-green-700 border-green-200",
    info: "bg-tertiary-container/10 text-tertiary border-tertiary/20",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border font-montserrat text-label-sm ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
