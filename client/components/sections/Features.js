import BentoCard from "../ui/BentoCard";
import Icon from "@/components/ui/Icon";

const FEATURES = [
  {
    icon: "psychology",
    title: "AI-Powered Scoring",
    description:
      "Our model is trained on thousands of examiner-graded scripts. Get band scores and criterion-level feedback within seconds of submission.",
    accent: false,
  },
  {
    icon: "timeline",
    title: "Adaptive Learning Path",
    description:
      "The system identifies your weak areas and automatically adjusts your practice schedule to maximize improvement per hour studied.",
    accent: false,
  },
  {
    icon: "timer",
    title: "Exam-Simulation Mode",
    description:
      "Practice under real exam conditions with timed sections, strict word counts, and no external assistance—so test day feels familiar.",
    accent: false,
  },
  {
    icon: "insights",
    title: "Performance Analytics",
    description:
      "Track your band score trajectory across all four skills with granular weekly breakdowns, best/worst session analysis, and exam readiness indicators.",
    accent: false,
  },
];

export default function Features() {
  return (
    <section className="w-full">
      <div className="mb-8">
        <h2 className="font-montserrat text-headline-lg text-on-surface mb-3">
          Built for Serious Preparation
        </h2>
        <p className="font-montserrat text-body-lg text-on-surface-variant max-w-2xl">
          Every feature is designed around one goal: helping you achieve your target band score.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
        {FEATURES.map(({ icon, title, description, accent }) => (
          <BentoCard
            key={title}
            className={`group flex gap-6 ${
              accent
                ? "bg-primary-container text-on-primary border-transparent shadow-md"
                : ""
            }`}
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                accent
                  ? "bg-white/20"
                  : "bg-surface-container-low group-hover:bg-primary-container/10"
              }`}
            >
              <Icon
                name={icon}
                size={24}
                className={accent ? "text-on-primary" : "text-primary"}
              />
            </div>
            <div>
              <h3
                className={`font-montserrat text-headline-md mb-2 ${
                  accent ? "text-on-primary" : "text-on-surface"
                }`}
              >
                {title}
              </h3>
              <p
                className={`font-montserrat text-body-md ${
                  accent ? "text-on-primary/80" : "text-on-surface-variant"
                }`}
              >
                {description}
              </p>
            </div>
          </BentoCard>
        ))}
      </div>
    </section>
  );
}
