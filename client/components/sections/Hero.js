import Link from "next/link";
import Tag from "../ui/Tag";
import Icon from "@/components/ui/Icon";

export default function Hero() {
  return (
    <section className="flex flex-col items-center text-center max-w-4xl mx-auto pt-16 pb-12 px-4">
      {/* AI badge */}
      <div className="animate-fade-up inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-variant/50 border border-outline-variant/30 mb-8">
        <Icon name="lightbulb" size={16} className="text-primary" />
        <span className="font-montserrat text-label-sm text-primary">
          Now featuring AI-Powered Scoring
        </span>
      </div>

      {/* Headline */}
      <h1 className="animate-fade-up delay-100 font-montserrat font-bold text-on-surface mb-6 leading-tight text-4xl md:text-display-lg">
        Master the Academic IELTS
        <br />
        <span className="text-primary">with AI-Precision.</span>
      </h1>

      <p className="animate-fade-up delay-200 font-montserrat text-body-lg text-on-surface-variant max-w-2xl mx-auto mb-10">
        Structured practice, AI-powered scoring, and expert feedback in one
        place. Prepare with a platform designed for serious academic success.
      </p>

      {/* CTA Buttons */}
      <div className="animate-fade-up delay-300 flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto">
        <Link
          href="/login"
          className="font-montserrat text-label-lg bg-primary-container text-on-primary rounded-xl px-8 py-4 transition-all hover:opacity-90 ambient-shadow"
        >
          Get Started Free
        </Link>
        <Link
          href="#pricing"
          className="font-montserrat text-label-lg border border-primary text-primary rounded-xl px-8 py-4 transition-all hover:bg-surface-variant/30"
        >
          Explore Premium
        </Link>
      </div>

      {/* Social proof */}
      <div className="animate-fade-up delay-400 flex flex-wrap justify-center gap-6 mt-12 pt-8 border-t border-outline-variant/20 w-full">
        {[
          { label: "Students Enrolled", value: "50,000+" },
          { label: "Average Band Improvement", value: "+1.5" },
          { label: "Practice Questions", value: "10,000+" },
          { label: "AI Feedback Accuracy", value: "96%" },
        ].map(({ label, value }) => (
          <div key={label} className="text-center">
            <p className="font-montserrat font-bold text-headline-md text-primary">{value}</p>
            <p className="font-montserrat text-label-sm text-on-surface-variant mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
