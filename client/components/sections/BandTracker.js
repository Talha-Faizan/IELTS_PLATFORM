import Link from "next/link";
import ProgressBar from "../ui/ProgressBar";
import {
  SECTION_CONFIG,
  SECTION_KEYS,
  formatBand,
  getSectionProgress,
  getTargetBand,
} from "@/lib/dataTransforms";

export default function BandTracker({ progress, profile, user }) {
  const targetBand = getTargetBand(profile, user);
  const readiness = Math.min(100, Math.round(((progress?.overallBand || 0) / targetBand) * 100)) || 0;
  const skills = SECTION_KEYS.map((section) => {
    const sectionProgress = getSectionProgress(progress, section);
    const band = sectionProgress.avgBand || (sectionProgress.avgScore ? sectionProgress.avgScore / 10 : 0);
    const value = Math.min(100, Math.round((band / targetBand) * 100)) || 0;

    return {
      label: SECTION_CONFIG[section].label,
      score: sectionProgress.attempts > 0
        ? `${formatBand(band)} / Target ${targetBand.toFixed(1)}`
        : "No attempts yet",
      value,
      color: value >= 100 ? "#155d27" : "#ab3600",
    };
  });

  return (
    <div className="bento-card md:col-span-8 flex flex-col justify-between h-full">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-outline-variant/20">
        <h3 className="font-montserrat text-headline-md text-on-surface">Target Band Tracker</h3>
        {profile?.targetBand || user?.targetBand ? (
          <div className="bg-surface-container-high px-4 py-2 rounded-xl flex items-center gap-2">
            <span className="font-montserrat text-label-sm text-on-surface-variant">Overall Target:</span>
            <span className="font-montserrat text-headline-md text-primary font-bold">{targetBand.toFixed(1)}</span>
          </div>
        ) : (
          <Link
            href="/profile"
            className="bg-primary-container text-on-primary px-4 py-2 rounded-xl font-montserrat text-label-sm hover:opacity-90 transition-opacity"
          >
            Set Target
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-5">
        {skills.map((skill) => (
          <ProgressBar key={skill.label} {...skill} />
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-outline-variant/20 flex items-center justify-between">
        <span className="font-montserrat text-label-lg text-on-surface-variant">Exam Readiness</span>
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 rounded-full progress-bar-bg overflow-hidden">
            <div className="h-full progress-bar-fill rounded-full" style={{ width: `${readiness}%` }} />
          </div>
          <span className="font-montserrat text-label-lg text-primary font-semibold">{readiness}%</span>
        </div>
      </div>
    </div>
  );
}
