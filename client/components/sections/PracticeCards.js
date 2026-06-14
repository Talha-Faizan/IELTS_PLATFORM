import Link from "next/link";
import Icon from "@/components/ui/Icon";
import {
  SECTION_CONFIG,
  SECTION_KEYS,
  formatBand,
  getPracticeSetCount,
  getSectionProgress,
} from "@/lib/dataTransforms";

export default function PracticeCards({ progress, usage, practiceBySection = {} }) {
  return (
    <section>
      <h3 className="font-montserrat text-headline-md text-on-surface mb-4">Practice Sections</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
        {SECTION_KEYS.map((section) => {
          const config = SECTION_CONFIG[section];
          const sectionProgress = getSectionProgress(progress, section);
          const available = getPracticeSetCount(practiceBySection[section] || []);
          const limit = usage?.[section];
          const limitText = limit
            ? `${limit.limit === "unlimited" ? "Unlimited" : Math.max(0, limit.limit - limit.used)} left`
            : `${available} ${config.unit}`;

          return (
            <Link
              key={section}
              href={`/practice/${section}/list`}
              className="bento-card group flex flex-col h-full cursor-pointer no-underline"
            >
              <div className="flex justify-between items-start mb-auto">
                <div className="p-3 bg-surface-variant rounded-xl text-primary group-hover:bg-primary-container group-hover:text-on-primary transition-colors">
                  <Icon name={config.icon} size={20} />
                </div>
                <Icon name="arrow_forward" size={18} className="text-on-surface-variant/40 group-hover:text-primary transition-colors" />
              </div>
              <div className="mt-auto">
                <p className="font-montserrat font-bold text-headline-md text-on-surface">{config.label}</p>
                <p className="font-montserrat text-label-sm text-on-surface-variant mt-0.5">{limitText}</p>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-outline-variant/20">
                  <span className="font-montserrat font-bold text-headline-md text-primary">
                    {formatBand(sectionProgress.avgBand || (sectionProgress.avgScore ? sectionProgress.avgScore / 10 : 0), "-")}
                  </span>
                  <span className="font-montserrat text-label-sm text-on-surface-variant">
                    {sectionProgress.attempts} attempts
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
