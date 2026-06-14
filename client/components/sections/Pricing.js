import Link from "next/link";
import Icon from "@/components/ui/Icon";

const PLANS = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    description: "Get started with core practice tools.",
    features: [
      "5 practice tests per month",
      "Basic AI scoring (Writing & Speaking)",
      "Reading & Listening archives",
      "Performance dashboard",
    ],
    cta: "Get Started Free",
    href: "/login",
    primary: false,
  },
  {
    name: "Scholar",
    price: "₹999",
    period: "per month",
    description: "Full access for serious exam preparation.",
    features: [
      "Unlimited practice tests",
      "Advanced AI scoring + detailed feedback",
      "Full mock test simulations",
      "Personal performance analytics",
      "Adaptive study plan",
      "Priority support",
    ],
    cta: "Start Free Trial",
    href: "/login",
    primary: true,
    badge: "Most Popular",
  },
  {
    name: "Scholar Pro",
    price: "₹1,999",
    period: "per month",
    description: "For those targeting Band 8+ with expert mentorship.",
    features: [
      "Everything in Scholar",
      "1-on-1 expert feedback sessions",
      "Custom study curriculum",
      "Exam strategy consultations",
      "Essay review by certified examiners",
    ],
    cta: "Contact Us",
    href: "#",
    primary: false,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="w-full">
      <div className="text-center mb-12">
        <h2 className="font-montserrat text-headline-lg text-on-surface mb-3">
          Investment in Excellence
        </h2>
        <p className="font-montserrat text-body-lg text-on-surface-variant max-w-xl mx-auto">
          Choose the plan that fits your preparation timeline. Cancel anytime.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter items-start">
        {PLANS.map(({ name, price, period, description, features, cta, href, primary, badge }) => (
          <div
            key={name}
            className={`bento-card flex flex-col ${
              primary
                ? "ring-2 ring-primary-container scale-[1.02] shadow-md"
                : ""
            }`}
          >
            {badge && (
              <span className="inline-flex self-start items-center gap-1 px-3 py-1 rounded-full bg-primary-container text-on-primary font-montserrat text-label-sm mb-4">
                <Icon name="star" size={14} />
                {badge}
              </span>
            )}

            <h3 className="font-montserrat text-headline-md text-on-surface">{name}</h3>
            <div className="mt-3 mb-1 flex items-end gap-1">
              <span className="font-montserrat font-bold text-display-lg text-on-surface leading-none">
                {price}
              </span>
              <span className="font-montserrat text-label-lg text-on-surface-variant mb-1">
                / {period}
              </span>
            </div>
            <p className="font-montserrat text-body-md text-on-surface-variant mb-6 pb-6 border-b border-outline-variant/20">
              {description}
            </p>

            <ul className="flex flex-col gap-3 mb-8 flex-grow">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <Icon name="check_circle" size={18} className="text-primary flex-shrink-0 mt-0.5" />
                  <span className="font-montserrat text-body-md text-on-surface-variant">{f}</span>
                </li>
              ))}
            </ul>

            <Link
              href={href}
              className={`block text-center font-montserrat text-label-lg rounded-xl px-6 py-3.5 transition-all ${
                primary
                  ? "bg-primary-container text-on-primary hover:opacity-90"
                  : "border border-primary text-primary hover:bg-surface-variant/30"
              }`}
            >
              {cta}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
