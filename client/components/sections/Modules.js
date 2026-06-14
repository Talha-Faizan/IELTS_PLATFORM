import BentoCard from "../ui/BentoCard";
import Link from "next/link";
import Icon from "@/components/ui/Icon";

const MODULES = [
  {
    icon: "menu_book",
    title: "Reading",
    description:
      "Analyze complex academic texts, improve scanning speed, and master all question types with precision timed practice.",
    visual: "reading",
    offset: false,
  },
  {
    icon: "edit_note",
    title: "Writing",
    description:
      "Get instant AI feedback on Task 1 data interpretation and Task 2 essays. Focus on coherence, cohesion, and vocabulary.",
    visual: "writing",
    offset: true,
  },
  {
    icon: "headset",
    title: "Listening",
    description:
      "Train your ear with authentic academic lectures and conversations. Interactive transcripts highlight key information.",
    visual: "listening",
    offset: false,
  },
  {
    icon: "mic",
    title: "Speaking",
    description:
      "Simulate realistic examiner interviews. Our speech-to-text AI evaluates fluency, lexical resource, and pronunciation.",
    visual: "speaking",
    offset: true,
  },
];

function ModuleVisual({ type }) {
  if (type === "reading") {
    return (
      <div className="h-[110px] w-full rounded-xl bg-surface-container-low border border-outline-variant/10 flex flex-col gap-2 p-4 justify-center">
        {[100, 80, 90, 65].map((w, i) => (
          <div key={i} className="h-2 rounded-full bg-surface-variant overflow-hidden">
            <div className="h-full progress-bar-fill rounded-full" style={{ width: `${w}%`, opacity: 0.4 + i * 0.15 }} />
          </div>
        ))}
      </div>
    );
  }
  if (type === "writing") {
    return (
      <div className="h-[110px] w-full rounded-xl bg-surface-container-low border border-outline-variant/10 p-4 flex flex-col gap-2 justify-center">
        <div className="flex items-center gap-2">
          <Icon name="edit" size={16} className="text-primary" />
          <div className="flex-1 h-2 bg-surface-variant rounded-full" />
        </div>
        {[85, 70, 55].map((w, i) => (
          <div key={i} className="h-1.5 rounded-full bg-surface-variant overflow-hidden ml-6">
            <div className="h-full bg-outline/30 rounded-full" style={{ width: `${w}%` }} />
          </div>
        ))}
        <div className="flex items-center gap-1 ml-6 mt-1">
          <div className="w-2 h-2 rounded-full bg-primary-container" />
          <span className="font-montserrat text-label-sm text-on-surface-variant">AI Grading active</span>
        </div>
      </div>
    );
  }
  if (type === "listening") {
    return (
      <div className="h-[110px] w-full rounded-xl bg-surface-container-low border border-outline-variant/10 flex items-center gap-1 p-4 pl-0">
        {[10, 20, 14, 24, 8, 18, 12, 22, 16].map((h, i) => (
          <div
            key={i}
            className="waveform-bar"
            style={{ height: `${h}px`, animationDelay: `${i * 0.08}s` }}
          />
        ))}
        <div className="ml-4 flex flex-col gap-1">
          <div className="w-24 h-1.5 bg-surface-variant rounded-full overflow-hidden">
            <div className="w-1/3 h-full progress-bar-fill rounded-full" />
          </div>
          <span className="font-montserrat text-label-sm text-on-surface-variant">Section 2 • 02:14</span>
        </div>
      </div>
    );
  }
  // speaking
  return (
    <div className="h-[110px] w-full rounded-xl bg-surface-container-low border border-outline-variant/10 flex items-center gap-4 p-4 pl-0">
      <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center">
        <Icon name="mic" size={20} className="text-on-primary" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="font-montserrat text-label-sm text-primary font-semibold">Recording...</span>
        <div className="flex items-end gap-0.5 h-6">
          {[4, 8, 12, 6, 16, 10, 8, 14, 6].map((h, i) => (
            <div
              key={i}
              className="w-1 rounded-full bg-primary-container"
              style={{ height: `${h}px` }}
            />
          ))}
        </div>
        <span className="font-montserrat text-label-sm text-on-surface-variant">Fluency: 7.5 • Vocab: 7.0</span>
      </div>
    </div>
  );
}

export default function Modules() {
  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-montserrat text-headline-lg text-on-surface">
          Comprehensive Modules
        </h2>
        <Link
          href="#"
          className="font-montserrat text-label-lg text-primary hover:underline flex items-center gap-1"
        >
          View Syllabus
          <Icon name="arrow_forward" size={18} />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter items-start">
        {MODULES.map(({ icon, title, description, visual, offset }) => (
          <BentoCard
            key={title}
            className={`group ${offset ? "lg:translate-y-4" : ""}`}
          >
            <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center mb-6 group-hover:bg-primary-container/10 transition-colors">
              <Icon name={icon} size={24} className="text-primary" />
            </div>
            <h3 className="font-montserrat text-headline-md text-on-surface mb-3">{title}</h3>
            <p className="font-montserrat text-body-md text-on-surface-variant mb-6">
              {description}
            </p>
            <ModuleVisual type={visual} />
          </BentoCard>
        ))}
      </div>
    </section>
  );
}
