"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Icon from "@/components/ui/Icon";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { fetchAudioUrl } from "@/lib/slices/contentSlice";
import { createSubmission } from "@/lib/slices/submissionSlice";
import { usePracticeQuestion } from "@/lib/hooks/usePracticeQuestion";
import { getQuestionItems, getQuestionTitle } from "@/lib/dataTransforms";

function ListeningPracticeContent() {
  const router = useRouter();
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const requestedId = searchParams.get("id");
  const { question, loading, error } = usePracticeQuestion("listening", { requestedId });
  const { audioUrlsByKey } = useSelector((state) => state.content);
  const { loading: submitting, error: submissionError } = useSelector((state) => state.submission);
  const [playing, setPlaying] = useState(false);
  const [answers, setAnswers] = useState({});
  const [flags, setFlags] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(1800);

  const items = useMemo(() => getQuestionItems(question), [question]);
  const timeLimit = question?.timeLimit || 30;
  const rawAudioUrl = question?.content?.audioUrl;
  const audioUrl = rawAudioUrl?.startsWith("http") ? rawAudioUrl : audioUrlsByKey[rawAudioUrl] || "";

  useEffect(() => {
    setAnswers({});
    setTimeRemaining(timeLimit * 60);
  }, [question?.id, timeLimit]);

  useEffect(() => {
    if (rawAudioUrl && !rawAudioUrl.startsWith("http") && !audioUrlsByKey[rawAudioUrl]) {
      dispatch(fetchAudioUrl(rawAudioUrl));
    }
  }, [audioUrlsByKey, dispatch, rawAudioUrl]);

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
      section: "listening",
      type: "practice",
      questionId: question.id,
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
    <div className="text-on-background flex flex-col min-h-screen" style={{fontFamily: "Montserrat, sans-serif" }}>
      <header className="sticky top-0 z-50 backdrop-blur-md border-b border-outline-variant/20 w-full" style={{ backgroundColor: "rgba(251,250,237,0.9)", boxShadow: "0 2px 8px rgba(27,28,21,0.04)" }}>
        <div className="max-w-container-max mx-auto px-margin-desktop h-navbar-height flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Link href="/practice" className="text-on-surface-variant hover:text-primary transition-colors">
              <Icon name="arrow_back" size={20} />
            </Link>
            <button
              type="button"
              onClick={() => setPlaying(!playing)}
              className="w-10 h-10 rounded-full bg-primary text-on-primary hover:opacity-90 transition-opacity flex items-center justify-center"
              disabled={!audioUrl}
              aria-label={playing ? "Pause audio" : "Play audio"}
            >
              <Icon name={playing ? "pause" : "play_arrow"} size={20} className="text-on-primary" />
            </button>
            <div>
              <p className="font-montserrat text-label-sm text-on-surface-variant">{question ? getQuestionTitle(question, "listening") : "Loading published set"}</p>
              <p className="font-montserrat text-label-sm text-on-surface-variant">{audioUrl ? "Audio ready" : "Audio unavailable"}</p>
            </div>
          </div>

          <div className="flex-grow flex items-center max-w-2xl">
            {audioUrl ? (
              <audio
                src={audioUrl}
                controls
                className="w-full"
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
              />
            ) : (
              <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden" />
            )}
          </div>

          <div className="flex items-center gap-6">
            <span className="font-montserrat text-label-sm text-on-surface-variant">{formatTime(timeRemaining)}</span>
            <div className="bg-error-container text-on-error-container px-3 py-1.5 rounded-xl border border-error/20 flex items-center gap-2">
              <Icon name="warning" size={16} />
              <span className="font-montserrat text-label-sm font-bold tracking-wider">PLAY ONCE ONLY</span>
            </div>
          </div>
        </div>
      </header>

      {loading ? (
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </main>
      ) : !question ? (
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="bento-card max-w-lg text-center">
            <h2 className="font-montserrat text-headline-md text-on-surface mb-2">No listening set available</h2>
            <p className="font-montserrat text-body-md text-on-surface-variant">
              {error || "Ask an admin to publish listening practice content."}
            </p>
          </div>
        </main>
      ) : (
        <main className="flex-1 max-w-container-max mx-auto px-margin-desktop py-8 flex flex-col gap-gutter w-full">
          {(submissionError || error) && (
            <div className="bento-card border-error text-error font-montserrat text-body-md">
              {submissionError || error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
            <div className="bento-card flex flex-col gap-5">
              <div>
                <h3 className="font-montserrat text-label-lg text-on-surface font-semibold uppercase tracking-wider">Questions</h3>
                <p className="font-montserrat text-label-sm text-on-surface-variant mt-1">Write or choose your answers from the published question set.</p>
              </div>

              {items.map((item) => (
                <div key={item.questionNumber} id={`question-${item.questionNumber}`} className="flex flex-col gap-2 scroll-mt-24">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary-container text-on-primary font-montserrat text-label-sm font-bold flex items-center justify-center flex-shrink-0">
                        {item.questionNumber}
                      </span>
                      <span className="font-montserrat text-body-md text-on-surface">{item.questionText}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleFlag(item.questionNumber)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-colors ${
                        flags[item.questionNumber]
                          ? "bg-error-container/20 border-error text-error"
                          : "bg-surface-container-low border-outline-variant/40 text-on-surface-variant hover:border-primary hover:text-primary"
                      }`}
                      aria-label="Flag for review"
                    >
                      <Icon name={flags[item.questionNumber] ? "flag" : "outlined_flag"} size={14} />
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
                              : "border-outline-variant/30 text-on-surface-variant hover:border-primary hover:text-on-surface"
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
                      className="w-full border border-outline-variant/40 rounded-xl px-4 py-2.5 font-montserrat text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all bg-white"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="bento-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-montserrat text-label-lg text-on-surface-variant uppercase tracking-wider">Transcript</h3>
                <span className="font-montserrat text-label-sm text-on-surface-variant bg-surface-container-low px-3 py-1 rounded-full border border-outline-variant/20">
                  {question.content?.transcript ? "Available" : "Hidden"}
                </span>
              </div>
              <div className="font-montserrat text-body-md text-on-surface-variant leading-loose whitespace-pre-line">
                {question.content?.transcript || "Transcript is not available for this set."}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || items.length === 0}
              className="bg-primary-container text-on-primary font-montserrat text-label-lg px-8 py-3.5 rounded-xl hover:opacity-90 disabled:opacity-60 transition-opacity"
            >
              {submitting ? "Submitting..." : "Submit Section"}
            </button>
          </div>
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

export default function ListeningPage() {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        }
      >
        <ListeningPracticeContent />
      </Suspense>
    </ProtectedRoute>
  );
}
