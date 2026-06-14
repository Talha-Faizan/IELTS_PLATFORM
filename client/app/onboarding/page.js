"use client";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { updateUserProfile } from "@/lib/slices/userSlice";

const BAND_SCORES = ["5.0", "5.5", "6.0", "6.5", "7.0", "7.5", "8.0", "8.5", "9.0"];

const FOCUS_AREAS = [
  { id: "reading", label: "Reading", icon: "menu_book" },
  { id: "writing", label: "Writing", icon: "edit_note" },
  { id: "listening", label: "Listening", icon: "headset" },
  { id: "speaking", label: "Speaking", icon: "mic" },
];

export default function OnboardingPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { loading, error } = useSelector((state) => state.user);
  const [selectedBand, setSelectedBand] = useState("7.0");
  const [focusAreas, setFocusAreas] = useState(["writing", "speaking"]);
  const [testDate, setTestDate] = useState("");

  const toggleFocus = (id) => {
    setFocusAreas((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    const result = await dispatch(updateUserProfile({
      targetBand: Number(selectedBand),
      examDate: testDate || undefined,
      sectionPreferences: focusAreas,
    }));

    if (updateUserProfile.fulfilled.match(result)) {
      router.push("/dashboard");
    }
  };

  return (
    <ProtectedRoute>
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-[600px]">
        {/* Card */}
        <article className="bento-card relative overflow-hidden">
          {/* Step progress */}
          <div className="flex justify-center items-center gap-3 mb-10">
            <div className="w-12 h-1.5 rounded-full bg-primary-container" />
            <div className="w-12 h-1.5 rounded-full bg-surface-variant" />
            <div className="w-12 h-1.5 rounded-full bg-surface-variant" />
          </div>

          {/* Header */}
          <header className="mb-10 text-center">
            <h1 className="font-montserrat text-headline-md font-bold text-on-surface mb-2">
              Personalize Your Plan
            </h1>
            <p className="font-montserrat text-body-md text-on-surface-variant">
              Tell us about your goals to customize your study path.
            </p>
          </header>

          {error && (
            <div className="p-4 rounded-xl bg-error/10 border border-error text-error font-montserrat text-body-sm mb-6">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-10">
            {/* Step 1 — Target Band Score */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <label className="font-montserrat text-label-lg text-on-surface font-semibold">
                  Target Band Score
                </label>
                <span className="font-montserrat text-label-sm text-on-surface-variant">Academic</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {BAND_SCORES.map((score) => (
                  <button
                    key={score}
                    onClick={() => setSelectedBand(score)}
                    className={`px-5 py-2.5 rounded-full border font-montserrat text-label-lg transition-colors ${
                      selectedBand === score
                        ? "bg-primary-container text-on-primary border-primary-container"
                        : "border-outline-variant/50 text-on-surface-variant hover:border-primary"
                    }`}
                  >
                    {score}
                  </button>
                ))}
              </div>
            </section>

            {/* Step 2 — Test Date */}
            <section>
              <label className="block font-montserrat text-label-lg text-on-surface font-semibold mb-4">
                Planned Test Date
              </label>
              <div className="relative">
                <Icon name="calendar_today" size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
                <input
                  type="date"
                  value={testDate}
                  onChange={(e) => setTestDate(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/50 text-on-surface font-montserrat text-body-md rounded-xl pl-12 pr-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-colors"
                />
              </div>
            </section>

            {/* Step 3 — Focus Areas */}
            <section>
              <div className="mb-4">
                <label className="font-montserrat text-label-lg text-on-surface font-semibold">
                  Focus Areas
                </label>
                <p className="font-montserrat text-label-sm text-on-surface-variant mt-1">
                  Select the sections you find most challenging.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {FOCUS_AREAS.map(({ id, label, icon }) => {
                  const checked = focusAreas.includes(id);
                  return (
                    <button
                      key={id}
                      onClick={() => toggleFocus(id)}
                      className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                        checked
                          ? "border-primary bg-surface-container-low"
                          : "border-outline-variant/50 hover:bg-surface-variant/20"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                          checked
                            ? "bg-primary-container border-primary-container"
                            : "border-outline-variant"
                        }`}
                      >
                        {checked && (
                          <Icon name="check" size={14} className="text-on-primary" />
                        )}
                      </div>
                      <Icon name={icon} size={20} className="text-on-surface-variant" />
                      <span className="font-montserrat text-body-md text-on-surface">{label}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* CTA */}
            <div className="pt-6 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || focusAreas.length === 0}
                className="w-full bg-primary-container text-on-primary font-montserrat text-label-lg py-4 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                {loading ? "Saving..." : "Save Plan"}
                <Icon name="arrow_forward" size={20} />
              </button>
            </div>
          </div>
        </article>

        <footer className="mt-8 text-center">
          <p className="font-montserrat text-label-sm text-on-surface-variant">
            Need help?{" "}
            <Link href="#" className="text-primary hover:underline">
              Contact Support
            </Link>
          </p>
        </footer>
      </div>
    </div>
    </ProtectedRoute>
  );
}
