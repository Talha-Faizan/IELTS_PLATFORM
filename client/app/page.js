import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/sections/Hero";
import Modules from "@/components/sections/Modules";
import Features from "@/components/sections/Features";
import Testimonials from "@/components/sections/Testimonials";
import Pricing from "@/components/sections/Pricing";
import Link from "next/link";

export const metadata = {
  title: "IELTS Scholar - Master the Academic IELTS",
  description:
    "Structured practice, AI-powered scoring, and expert feedback in one place.",
};

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />

      <main className="flex-grow max-w-container-max mx-auto px-margin-desktop py-8 flex flex-col gap-24 w-full">
        <Hero />
        <Modules />
        <Features />
        <Testimonials />
        <Pricing />

        {/* CTA Banner */}
        <section className="bento-card bg-primary-container border-transparent text-center py-16 relative overflow-hidden">
          <div className="absolute -left-16 -top-16 w-64 h-64 rounded-full bg-white/5" />
          <div className="absolute -right-8 -bottom-8 w-48 h-48 rounded-full bg-white/5" />
          <div className="relative z-10">
            <h2 className="font-montserrat font-bold text-headline-lg text-on-primary mb-4">
              Ready to achieve your target band score?
            </h2>
            <p className="font-montserrat text-body-lg text-on-primary/80 max-w-xl mx-auto mb-8">
              Join 50,000+ students who have already improved their IELTS scores with IELTS Scholar.
            </p>
            <Link
              href="/login"
              className="inline-block font-montserrat text-label-lg bg-white text-primary rounded-xl px-8 py-4 hover:bg-surface-container-low transition-colors font-semibold"
            >
              Start For Free Today
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
