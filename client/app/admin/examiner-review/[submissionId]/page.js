"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Icon from "@/components/ui/Icon";
import api from "@/lib/api";

const inputClass =
  "w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 font-montserrat text-body-md text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all";
const textareaClass =
  "w-full bg-surface-container-low border border-outline-variant/30 rounded-xl p-4 font-montserrat text-body-md text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none transition-all";

export default function ExaminerReviewPage() {
  const { submissionId } = useParams(); // Note: we're passing the review ID in the URL actually, wait, the URL says [submissionId] but the review has its own ID.
  // Actually, we need to fetch the review details. Wait, the route says `examiner-review/[submissionId]`. But our endpoint `GET /api/admin/expert-reviews/:id/details` expects the review ID.
  // I should rename the folder to `[reviewId]` to match the endpoint and logic. Let's assume the URL parameter is `reviewId` and I will name the folder `[reviewId]`. Wait, the prompt says `[submissionId]`.
  // I'll use the param as `reviewId` to call the endpoint.
  const reviewId = submissionId; // We map it directly.
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    reviewerNotes: "",
    revisedBandEstimate: "",
    detailedFeedback: "",
    scoresOverride: {
      taskAchievement: "",
      coherence: "",
      lexical: "",
      grammar: "",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/admin/expert-reviews/${reviewId}/details`);
        setData(res.data);
        if (res.data.review) {
          setForm((prev) => ({
            ...prev,
            reviewerNotes: res.data.review.reviewerNotes || "",
            revisedBandEstimate: res.data.review.revisedBandEstimate || "",
            detailedFeedback: res.data.review.detailedFeedback || "",
          }));
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load review details.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [reviewId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        reviewerNotes: form.reviewerNotes,
        revisedBandEstimate: Number(form.revisedBandEstimate),
        detailedFeedback: form.detailedFeedback,
        scoresOverride: {
          taskAchievement: Number(form.scoresOverride.taskAchievement) || null,
          coherence: Number(form.scoresOverride.coherence) || null,
          lexical: Number(form.scoresOverride.lexical) || null,
          grammar: Number(form.scoresOverride.grammar) || null,
        },
      };

      await api.put(`/admin/expert-reviews/${reviewId}/complete`, payload);
      router.push("/admin"); // Redirect back to admin panel
    } catch (err) {
      console.error(err);
      setError("Failed to submit review.");
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !data) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background p-8">
          <div className="bento-card border border-error/30 bg-error-container/30 text-error p-6">
            {error || "Review not found."}
          </div>
          <Link href="/admin" className="mt-4 text-primary hover:underline inline-block">
            &larr; Back to Admin Panel
          </Link>
        </div>
      </ProtectedRoute>
    );
  }

  const { review, submission } = data;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background text-on-background flex flex-col font-montserrat">
        {/* Top Navbar */}
        <nav className="bg-surface/80 backdrop-blur-md sticky top-0 z-50 h-navbar-height px-margin-desktop w-full border-b border-outline-variant/10 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-on-surface-variant hover:text-primary transition-colors">
              <Icon name="arrow_back" />
            </Link>
            <div className="font-bold text-headline-sm text-primary">
              Examiner Dashboard
            </div>
          </div>
          <div className="text-label-lg text-on-surface-variant">
            Reviewing: <span className="font-bold text-on-surface">{review.userId?.name}</span>
          </div>
        </nav>

        <main className="flex-1 max-w-container-max mx-auto w-full px-margin-desktop py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
            {/* LEFT PANE: Student Submission & Prompt */}
            <div className="flex flex-col gap-6">
              <div className="bento-card bg-surface-container-lowest border border-outline-variant/20">
                <h2 className="text-headline-md font-bold mb-4 text-primary flex items-center gap-2">
                  <Icon name="assignment" /> Student Submission
                </h2>
                <div className="space-y-6">
                  {submission.answers.map((answer, index) => {
                    const question = answer.questionId;
                    const contentBlock = question?.contentBlockId;

                    return (
                      <div key={index} className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/30">
                        <h3 className="font-bold text-label-lg text-on-surface mb-2">
                          Task {index + 1}
                        </h3>
                        
                        {contentBlock && (
                          <div className="mb-4 p-4 bg-surface-container rounded-lg">
                            <h4 className="font-bold text-label-sm text-on-surface-variant uppercase mb-2">Prompt / Passage</h4>
                            <div className="text-body-md text-on-surface whitespace-pre-wrap">
                              {contentBlock.contentBody || contentBlock.title}
                            </div>
                          </div>
                        )}

                        <div className="mb-4">
                          <h4 className="font-bold text-label-sm text-on-surface-variant uppercase mb-2">Question</h4>
                          <div className="text-body-md font-semibold text-on-surface">
                            {question?.content?.prompt || question?.content?.passage || "Question Prompt missing"}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-bold text-label-sm text-on-surface-variant uppercase mb-2">Student Answer</h4>
                          {answer.audioUrl ? (
                            <div className="space-y-2">
                              <audio controls src={answer.audioUrl} className="w-full" />
                              {answer.transcript && (
                                <div className="p-3 bg-surface rounded-lg border border-outline-variant/20 text-body-sm whitespace-pre-wrap text-on-surface-variant">
                                  {answer.transcript}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="p-4 bg-surface rounded-lg border border-outline-variant/20 text-body-md whitespace-pre-wrap">
                              {answer.userAnswer || "No answer provided"}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT PANE: Grading & Feedback */}
            <div className="flex flex-col gap-6">
              <form onSubmit={handleSubmit} className="bento-card bg-surface-container-lowest border border-outline-variant/20 sticky top-24">
                <h2 className="text-headline-md font-bold mb-6 text-secondary flex items-center gap-2">
                  <Icon name="grading" /> Grading & Feedback
                </h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold text-label-lg text-on-surface mb-3">AI Preliminary Scores</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {["Task Achievement", "Coherence", "Lexical", "Grammar"].map((crit) => {
                        const key = crit.toLowerCase().replace(" ", "");
                        return (
                          <div key={key} className="p-3 bg-surface-container-low rounded-lg border border-outline-variant/30 flex justify-between items-center">
                            <span className="text-label-sm text-on-surface-variant">{crit}</span>
                            <span className="font-bold text-on-surface">
                              {submission.expertFeedback?.scores?.[key] || "-"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border-t border-outline-variant/20 pt-6">
                    <h3 className="font-bold text-label-lg text-on-surface mb-3">Examiner Overrides</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-label-sm text-on-surface-variant">Task Achievement</label>
                        <input type="number" step="0.5" min="1" max="9" className={inputClass} value={form.scoresOverride.taskAchievement} onChange={e => setForm(p => ({...p, scoresOverride: {...p.scoresOverride, taskAchievement: e.target.value}}))} placeholder="Override" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-label-sm text-on-surface-variant">Coherence & Cohesion</label>
                        <input type="number" step="0.5" min="1" max="9" className={inputClass} value={form.scoresOverride.coherence} onChange={e => setForm(p => ({...p, scoresOverride: {...p.scoresOverride, coherence: e.target.value}}))} placeholder="Override" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-label-sm text-on-surface-variant">Lexical Resource</label>
                        <input type="number" step="0.5" min="1" max="9" className={inputClass} value={form.scoresOverride.lexical} onChange={e => setForm(p => ({...p, scoresOverride: {...p.scoresOverride, lexical: e.target.value}}))} placeholder="Override" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-label-sm text-on-surface-variant">Grammar</label>
                        <input type="number" step="0.5" min="1" max="9" className={inputClass} value={form.scoresOverride.grammar} onChange={e => setForm(p => ({...p, scoresOverride: {...p.scoresOverride, grammar: e.target.value}}))} placeholder="Override" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-label-lg font-bold text-on-surface">Final Overall Band Estimate *</label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      max="9"
                      required
                      className={inputClass}
                      value={form.revisedBandEstimate}
                      onChange={(e) => setForm((p) => ({ ...p, revisedBandEstimate: e.target.value }))}
                      placeholder="e.g. 7.5"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-label-lg font-bold text-on-surface">Reviewer Notes *</label>
                    <textarea
                      required
                      rows={3}
                      className={textareaClass}
                      value={form.reviewerNotes}
                      onChange={(e) => setForm((p) => ({ ...p, reviewerNotes: e.target.value }))}
                      placeholder="Internal notes for other examiners..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-label-lg font-bold text-on-surface">Detailed Feedback (to Student)</label>
                    <textarea
                      rows={4}
                      className={textareaClass}
                      value={form.detailedFeedback}
                      onChange={(e) => setForm((p) => ({ ...p, detailedFeedback: e.target.value }))}
                      placeholder="Constructive feedback to help the student improve..."
                    />
                  </div>
                </div>

                <div className="mt-8">
                  <button
                    type="submit"
                    className="w-full bg-primary text-on-primary text-label-lg font-bold py-4 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-md flex justify-center items-center gap-2"
                  >
                    <Icon name="check_circle" /> Submit Final Grade
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
