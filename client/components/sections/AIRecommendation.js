import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { SECTION_CONFIG, getSectionProgress, getWeakestSection } from "@/lib/dataTransforms";

export default function AIRecommendation({ progress }) {
  const section = getWeakestSection(progress);
  const config = SECTION_CONFIG[section];
  const sectionProgress = getSectionProgress(progress, section);
  const hasAttempts = sectionProgress.attempts > 0;

  return (
    <div className="bento-card md:col-span-4 !bg-primary-container !text-on-primary border-transparent shadow-md flex flex-col justify-between relative overflow-hidden group">
      <div className="absolute -right-8 -top-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
        <Icon name="psychology" size={140} className="!text-on-primary" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="psychology" size={20} className="!text-on-primary" />
          <span className="font-montserrat text-label-lg !text-on-primary/80 uppercase tracking-wider">
            AI Recommendation
          </span>
        </div>
        <h3 className="font-montserrat text-headline-md !text-on-primary mb-3">
          Focus on {config.label} next.
        </h3>
        <p className="font-montserrat text-body-md !text-on-primary/80">
          {hasAttempts
            ? `${config.label} is currently your lowest active section across ${sectionProgress.attempts} attempts.`
            : `Start with ${config.label} so the platform can build your personal performance baseline.`}
        </p>
      </div>

      <div className="relative z-10 mt-6">
        <Link
          href={config.href}
          className="font-montserrat text-label-lg bg-white/20 hover:bg-white/30 !text-on-primary rounded-xl px-5 py-3 w-full transition-colors flex items-center justify-center gap-2"
        >
          Start Recommended Practice
          <Icon name="arrow_forward" size={16} />
        </Link>
      </div>
    </div>
  );
}
