"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Icon from "@/components/ui/Icon";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { fetchMockTest, fetchQuestion } from "@/lib/slices/contentSlice";
import { createSubmission } from "@/lib/slices/submissionSlice";
import { usePracticeQuestion } from "@/lib/hooks/usePracticeQuestion";
import { getQuestionItems, getQuestionTitle } from "@/lib/dataTransforms";

function ReadingPracticeContent() {
  const router = useRouter();
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const mockTestId = searchParams.get("mockTestId");
  const requestedId = searchParams.get("id");
  const practiceState = usePracticeQuestion("reading", {
    disabled: !!mockTestId,
    requestedId,
  });
  const { currentMockTest, currentQuestion, loadingQuestion } = useSelector((state) => state.content);
  const { loading: submitting, error: submissionError } = useSelector((state) => state.submission);
  const [answers, setAnswers] = useState({});
  const [flags, setFlags] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(3600);
  const mockReadingId = currentMockTest?.sections?.reading?.[0]?.id;
  const question = mockTestId ? (currentQuestion?.section === "reading" ? currentQuestion : null) : practiceState.question;
  const loading = mockTestId ? loadingQuestion : practiceState.loading;
  const error = practiceState.error;

  const items = useMemo(() => getQuestionItems(question), [question]);
  const timeLimit = question?.timeLimit || 60;

  useEffect(() => {
    if (mockTestId) {
      dispatch(fetchMockTest(mockTestId));
    }
  }, [dispatch, mockTestId]);

  useEffect(() => {
    if (mockTestId && mockReadingId && currentQuestion?.id !== mockReadingId) {
      dispatch(fetchQuestion({ section: "reading", id: mockReadingId }));
    }
  }, [currentQuestion?.id, dispatch, mockReadingId, mockTestId]);

  useEffect(() => {
    setAnswers({});
    setTimeRemaining(timeLimit * 60);
  }, [question?.id, timeLimit]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleAnswer = (questionNumber, value) => {
    setAnswers((prev) => ({ ...prev, [questionNumber]: value }));
  };

  const toggleFlag = (questionNumber) => {
    setFlags((prev) => ({ ...prev, [questionNumber]: !prev[questionNumber] }));
  };

  const handleSubmit = async () => {
    if (!question?.id) return;

    const result = await dispatch(createSubmission({
      section: "reading",
      type: mockTestId ? "mock" : "practice",
      questionId: question.id,
      mockTestId: mockTestId || undefined,
      content: {
        answers: items.map((item) => ({
          questionNumber: item.questionNumber,
          answer: answers[item.questionNumber] || null,
        })),
      },
      timeSpent: timeLimit * 60 - timeRemaining,
    }));

    if (createSubmission.fulfilled.match(result)) {
      router.push(`/practice/feedback?submissionId=${result.payload.id}`);
    }
  };

  return (
    <div className="text-on-surface h-screen flex flex-col overflow-hidden" style={{ fontFamily: "Montserrat, sans-serif" }}>
      <header className="bg-surface-container-lowest sticky top-0 z-50 flex justify-between items-center h-navbar-height px-margin-desktop w-full border-b border-outline-variant/20" style={{ backgroundColor: "#ffffff" }}>
        <div className="flex items-center gap-4">
          <Link href="/practice" className="text-on-surface-variant hover:text-primary transition-colors">
            <Icon name="arrow_back" size={20} />
          </Link>
          <div>
            <h1 className="font-montserrat text-headline-md font-bold text-on-surface">Academic Reading Practice</h1>
            <p className="font-montserrat text-label-sm text-on-surface-variant">{question ? getQuestionTitle(question, "reading") : "Loading published question"}</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-primary font-bold bg-error-container/20 px-4 py-2 rounded-xl border border-primary/20">
            <Icon name="timer" size={20} />
            <span className="font-mono text-lg font-bold">{formatTime(timeRemaining)}</span>
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting || !question || items.length === 0}
            className="bg-primary-container text-on-primary font-montserrat text-label-lg px-6 py-2 rounded-xl hover:opacity-90 disabled:opacity-60 transition-opacity"
          >
            {submitting ? "Submitting..." : "Submit Test"}
          </button>
        </div>
      </header>

      {loading ? (
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </main>
      ) : !question ? (
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="bento-card max-w-lg text-center">
            <h2 className="font-montserrat text-headline-md text-on-surface mb-2">No reading question available</h2>
            <p className="font-montserrat text-body-md text-on-surface-variant">
              {error || "Ask an admin to publish reading practice content."}
            </p>
          </div>
        </main>
      ) : (
        <main className="flex-1 flex overflow-hidden">
          <section className="w-[60%] flex flex-col h-full border-r border-outline-variant/20 bg-surface-container-low">
            <div className="flex border-b border-outline-variant/20 bg-white">
              <div className="px-6 py-4 font-montserrat text-label-lg text-primary border-b-2 border-primary font-bold bg-surface">
                Passage
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 pb-24">
              <div className="max-w-[80ch] mx-auto">
                <div className="space-y-6 font-montserrat text-body-lg text-on-surface-variant leading-relaxed whitespace-pre-line">
                  {question.content?.passage || "This question does not include a passage."}
                </div>
              </div>
            </div>
          </section>

          <section className="w-[40%] flex flex-col h-full bg-white overflow-y-auto">
            <div className="p-6 border-b border-outline-variant/20 bg-surface-container-low sticky top-0 z-10">
              <p className="font-montserrat text-label-lg text-on-surface-variant uppercase tracking-wider">Questions</p>
              <p className="font-montserrat text-body-md text-on-surface mt-1">
                Answer every item before submitting.
              </p>
              {(submissionError || error) && (
                <p className="font-montserrat text-label-sm text-error mt-2">{submissionError || error}</p>
              )}
            </div>

            <div className="p-6 flex flex-col gap-6 pb-24">
              {items.map((item) => (
                <div key={item.questionNumber} id={`question-${item.questionNumber}`} className="bento-card scroll-mt-24">
                  <div className="flex gap-3 mb-4 justify-between items-start">
                    <div className="flex gap-3">
                      <span className="w-7 h-7 rounded-full bg-primary-container text-on-primary font-montserrat text-label-sm font-bold flex items-center justify-center flex-shrink-0">
                        {item.questionNumber}
                      </span>
                      <p className="font-montserrat text-body-md text-on-surface">{item.questionText}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleFlag(item.questionNumber)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors ${
                        flags[item.questionNumber]
                          ? "bg-error-container/20 border-error text-error"
                          : "bg-surface-container-low border-outline-variant/40 text-on-surface-variant hover:border-primary hover:text-primary"
                      }`}
                      aria-label="Flag for review"
                    >
                      <Icon name={flags[item.questionNumber] ? "flag" : "outlined_flag"} size={16} />
                      <span className="font-montserrat text-label-sm whitespace-nowrap">Review</span>
                    </button>
                  </div>
                  {item.options?.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {item.options.map((option) => (
                        <button
                          key={option}
                          onClick={() => handleAnswer(item.questionNumber, option)}
                          className={`text-left px-4 py-2.5 rounded-xl border font-montserrat text-body-md transition-colors ${
                            answers[item.questionNumber] === option
                              ? "bg-primary-container text-on-primary border-primary-container"
                              : "border-outline-variant/40 text-on-surface-variant hover:border-primary hover:text-primary"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={answers[item.questionNumber] || ""}
                      onChange={(event) => handleAnswer(item.questionNumber, event.target.value)}
                      placeholder="Write your answer"
                      className="w-full border border-outline-variant/40 rounded-xl px-4 py-3 font-montserrat text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        </main>
      )}

      {/* Bottom Navigation Grid */}
      {!loading && question && items.length > 0 && (
        <footer className="bg-surface-container-lowest border-t border-outline-variant/20 py-3 px-margin-desktop sticky bottom-0 z-50">
          <div className="flex items-center justify-center gap-2 overflow-x-auto pb-1 max-w-container-max mx-auto">
            {items.map((item) => {
              const isAnswered = answers[item.questionNumber] && answers[item.questionNumber].trim() !== "";
              const isFlagged = flags[item.questionNumber];
              return (
                <button
                  key={`nav-${item.questionNumber}`}
                  onClick={() => {
                    const el = document.getElementById(`question-${item.questionNumber}`);
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className={`flex-shrink-0 w-10 h-10 rounded-xl font-montserrat text-label-md font-semibold flex flex-col items-center justify-center relative transition-colors ${
                    isFlagged && !isAnswered
                      ? "bg-error-container text-on-error-container border border-error/20"
                      : isFlagged && isAnswered
                      ? "bg-primary-container text-on-primary border border-error"
                      : isAnswered
                      ? "bg-primary-container text-on-primary border border-primary-container"
                      : "bg-surface-container-low text-on-surface-variant border border-outline-variant/40 hover:border-primary hover:text-primary"
                  }`}
                  title={`Question ${item.questionNumber}`}
                >
                  {isFlagged && !isAnswered ? <Icon name="flag" size={16} /> : item.questionNumber}
                  {isFlagged && isAnswered && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-error rounded-full border border-white" />
                  )}
                </button>
              );
            })}
          </div>
        </footer>
      )}
    </div>
  );
}

export default function ReadingPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<PracticeLoading />}>
        <ReadingPracticeContent />
      </Suspense>
    </ProtectedRoute>
  );
}

function PracticeLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
    </div>
  );
}
