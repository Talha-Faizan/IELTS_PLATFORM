"use client";

import { Suspense, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import DashboardNav from "@/components/layout/DashboardNav";
import Icon from "@/components/ui/Icon";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { fetchSubmission, rateFeedback, requestExpertReview } from "@/lib/slices/submissionSlice";
import { formatBand, getSubmissionScore, toTitleCase } from "@/lib/dataTransforms";

const FEEDBACK_LABELS = {
  taskAchievement: "Task Achievement",
  coherenceCohesion: "Coherence & Cohesion",
  lexicalResource: "Lexical Resource",
  grammaticalRange: "Grammatical Range",
  fluency: "Fluency",
  coherence: "Coherence",
  pronunciationProxy: "Pronunciation",
};

function FeedbackContent() {
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const submissionId = searchParams.get("submissionId");
  const { currentSubmission, loading, error, successMessage } = useSelector((state) => state.submission);

  useEffect(() => {
    if (submissionId) {
      dispatch(fetchSubmission(submissionId));
    }
  }, [dispatch, submissionId]);

  const submission = currentSubmission;
  const feedbackResult = submission?.feedbackResult;
  const criteria = feedbackResult
    ? Object.entries(FEEDBACK_LABELS)
        .map(([key, label]) => ({ key, label, ...feedbackResult[key] }))
        .filter((item) => item.bandScore !== undefined)
    : [];
  const overall = feedbackResult?.overallBand || submission?.bandEstimate || 0;

  const handleRate = (rating) => {
    if (submission?.id) {
      dispatch(rateFeedback({ submissionId: submission.id, rating }));
    }
  };

  const handleExpertReview = () => {
    if (submission?.id) {
      dispatch(requestExpertReview(submission.id));
    }
  };

  return (
    <div className="dashboard-bg flex min-h-screen" style={{ fontFamily: "Montserrat, sans-serif" }}>
      <Sidebar />
      <div className="flex-1 md:ml-sidebar-width flex flex-col">
        <DashboardNav title="AI Feedback" breadcrumbs={[submission?.section ? toTitleCase(submission.section) : "Practice"]} />

        <main className="flex-1 p-6 md:p-8 flex flex-col gap-6">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : !submission ? (
            <div className="bento-card text-center py-10">
              <h2 className="font-montserrat text-headline-md text-on-surface mb-2">No submission selected</h2>
              <p className="font-montserrat text-body-md text-on-surface-variant">
                {error || "Submit a practice attempt to view feedback here."}
              </p>
            </div>
          ) : (
            <>
              {(error || successMessage) && (
                <div className={`bento-card ${error ? "text-error border-error" : "text-green-700"}`}>
                  <p className="font-montserrat text-body-md">{error || successMessage}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
                <div className="bento-card md:col-span-3 flex flex-col items-center justify-center py-8 text-center !bg-primary-container border-transparent text-on-primary">
                  <p className="font-montserrat text-label-lg text-on-primary/70 uppercase tracking-wider mb-2">Result</p>
                  <p className="font-montserrat font-bold text-on-primary" style={{ fontSize: "72px", lineHeight: "1" }}>
                    {overall ? formatBand(overall) : getSubmissionScore(submission)}
                  </p>
                  <p className="font-montserrat text-label-sm text-on-primary/70 mt-2">
                    {toTitleCase(submission.section)} {submission.type}
                  </p>
                </div>

                <div className="bento-card md:col-span-9">
                  <h3 className="font-montserrat text-headline-md text-on-surface mb-5">Submission Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="font-montserrat text-label-sm text-on-surface-variant">Status</p>
                      <p className="font-montserrat text-body-md text-on-surface font-semibold">
                        {submission.feedbackStatus === "not_required" ? "Auto-Scored" : 
                         submission.feedbackStatus === "pending" ? "Pending Review" : 
                         submission.feedbackStatus === "complete" ? "Completed" : 
                         submission.feedbackStatus}
                      </p>
                    </div>
                    <div>
                      <p className="font-montserrat text-label-sm text-on-surface-variant">Time Spent</p>
                      <p className="font-montserrat text-body-md text-on-surface font-semibold">{submission.timeSpent || 0}s</p>
                    </div>
                    <div>
                      <p className="font-montserrat text-label-sm text-on-surface-variant">Raw Score</p>
                      <p className="font-montserrat text-body-md text-on-surface font-semibold">
                        {submission.score ? `${submission.score.correct}/${submission.score.total} (${submission.score.percentage}%)` : "Pending"}
                      </p>
                    </div>
                    <div>
                      <p className="font-montserrat text-label-sm text-on-surface-variant">Access</p>
                      <p className="font-montserrat text-body-md text-on-surface font-semibold">{submission.isPremium ? "Premium" : "Free"}</p>
                    </div>
                  </div>

                  {submission.feedbackStatus === "pending" && (
                    <p className="font-montserrat text-body-md text-on-surface-variant mt-5">
                      AI feedback is queued. Refresh this page after the worker completes scoring.
                    </p>
                  )}
                </div>
              </div>

              {criteria.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
                  <div className="bento-card md:col-span-7">
                    <h3 className="font-montserrat text-headline-md text-on-surface mb-5">Criterion Scores</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {criteria.map(({ key, label, bandScore }) => (
                        <div key={key}>
                          <div className="flex justify-between mb-1.5">
                            <span className="font-montserrat text-label-lg text-on-surface">{label}</span>
                            <span className="font-montserrat text-label-lg text-primary font-bold">{formatBand(bandScore)}</span>
                          </div>
                          <div className="h-2.5 rounded-full progress-bar-bg overflow-hidden">
                            <div className="h-full progress-bar-fill rounded-full" style={{ width: `${(bandScore / 9) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-5 flex flex-col gap-gutter">
                    {criteria.map(({ key, label, bandScore, commentary, suggestions }) => (
                      <div key={key} className="bento-card">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-montserrat text-label-lg text-on-surface font-semibold">{label}</h4>
                          <span className="font-montserrat font-bold text-headline-md text-primary">{formatBand(bandScore)}</span>
                        </div>
                        <p className="font-montserrat text-body-md text-on-surface-variant leading-relaxed">{commentary || "No commentary provided."}</p>
                        
                        {key === "pronunciationProxy" && (
                          <div className="mt-3 bg-error-container/10 border border-error/20 rounded-xl p-3 flex items-start gap-2">
                            <Icon name="info" size={18} className="text-error flex-shrink-0 mt-0.5" />
                            <p className="font-montserrat text-label-sm text-on-surface-variant leading-relaxed">
                              <span className="font-semibold text-error">Note:</span> Pronunciation scores are AI-estimated based on transcript patterns. For a highly accurate pronunciation assessment, please submit this recording for Expert Human Review.
                            </p>
                          </div>
                        )}

                        {suggestions?.length > 0 && (
                          <ul className="mt-3 flex flex-col gap-2">
                            {suggestions.map((suggestion) => (
                              <li key={suggestion} className="font-montserrat text-label-sm text-on-surface-variant flex gap-2">
                                <Icon name="check_circle" size={14} className="text-primary mt-0.5 flex-shrink-0" />
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
                <div className="bento-card md:col-span-7">
                  <h3 className="font-montserrat text-headline-md text-on-surface mb-5">Submitted Work</h3>
                  {submission.text ? (
                    <p className="font-montserrat text-body-lg text-on-surface leading-relaxed whitespace-pre-line">{submission.text}</p>
                  ) : submission.answers?.length > 0 ? (
                    <div className="flex flex-col divide-y divide-outline-variant/20">
                      {submission.answers.map((answer) => (
                        <div key={answer.questionId} className="flex flex-col py-4">
                          <div className="flex items-center justify-between">
                            <span className="font-montserrat text-body-md text-on-surface font-medium">Question {answer.questionId}</span>
                            <div className="flex items-center gap-3">
                              <span className={`font-montserrat text-body-md ${answer.isCorrect ? "text-green-700 font-bold" : "text-error line-through"}`}>
                                {String(answer.answer || "Blank")}
                              </span>
                              {!answer.isCorrect && answer.correctAnswer && (
                                <span className="font-montserrat text-body-md text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded">
                                  {String(answer.correctAnswer)}
                                </span>
                              )}
                            </div>
                          </div>
                          {!answer.isCorrect && answer.explanation && (
                            <div className="mt-3 bg-surface-variant/30 p-3 rounded-lg border border-outline-variant/30">
                              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Explanation</span>
                              <p className="font-montserrat text-label-sm text-on-surface-variant leading-relaxed">
                                {answer.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : submission.transcript?.length > 0 ? (
                    <div className="font-montserrat text-body-md text-on-surface-variant">
                      {submission.transcript.map((item) => (
                        <p key={`${item.part}-${item.text}`}><span className="font-semibold">{item.part}:</span> {item.text || "Audio submitted"}</p>
                      ))}
                    </div>
                  ) : (
                    <p className="font-montserrat text-body-md text-on-surface-variant">No submitted text or answers were returned for this attempt.</p>
                  )}
                </div>

                <div className="bento-card md:col-span-5 !bg-surface-container-low">
                  <h4 className="font-montserrat text-label-lg text-on-surface font-semibold mb-3 flex items-center gap-2">
                    <Icon name="psychology" size={18} className="text-primary" />
                    Actions
                  </h4>
                  <div className="flex gap-3 mb-4">
                    <button
                      type="button"
                      onClick={() => handleRate("up")}
                      className={`flex-1 border rounded-xl py-3 font-montserrat text-label-lg ${submission.feedbackRating === "up" ? "bg-primary-container text-on-primary border-primary-container" : "border-outline-variant/40 text-on-surface-variant"}`}
                    >
                      Helpful
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRate("down")}
                      className={`flex-1 border rounded-xl py-3 font-montserrat text-label-lg ${submission.feedbackRating === "down" ? "bg-primary-container text-on-primary border-primary-container" : "border-outline-variant/40 text-on-surface-variant"}`}
                    >
                      Needs Work
                    </button>
                  </div>
                  {["writing", "speaking"].includes(submission.section) && (
                    <button
                      type="button"
                      onClick={handleExpertReview}
                      className="w-full bg-primary-container text-on-primary font-montserrat text-label-lg py-3 rounded-xl hover:opacity-90 transition-opacity"
                    >
                      Request Expert Review
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default function FeedbackPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading feedback...</div>}>
        <FeedbackContent />
      </Suspense>
    </ProtectedRoute>
  );
}
