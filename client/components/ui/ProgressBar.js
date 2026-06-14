export default function ProgressBar({ value = 0, label, score, color }) {
  // Use CSS variable fallback or provided color
  // CSS variable --color-primary-container is #ab3600 (brown accent)
  const progressColor = color || "var(--color-primary-container, #ab3600)";

  return (
    <div>
      {(label || score) && (
        <div className="flex justify-between items-end mb-2">
          {label && (
            <span className="font-montserrat text-label-lg text-on-surface">{label}</span>
          )}
          {score && (
            <span className="font-montserrat text-label-sm text-on-surface-variant">{score}</span>
          )}
        </div>
      )}
      <div className="h-3 w-full rounded-full progress-bar-bg overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${value}%`,
            backgroundColor: progressColor,
          }}
        />
      </div>
    </div>
  );
}
