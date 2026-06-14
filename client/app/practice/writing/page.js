"use client";

import { Suspense, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Icon from "@/components/ui/Icon";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { createSubmission } from "@/lib/slices/submissionSlice";
import { usePracticeQuestion } from "@/lib/hooks/usePracticeQuestion";
import { getQuestionTitle } from "@/lib/dataTransforms";

function WritingPracticeContent() {
  const router = useRouter();
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const requestedId = searchParams.get("id");
  const { question, loading, error } = usePracticeQuestion("writing", { requestedId });
  const { loading: submitting, error: submissionError } = useSelector((state) => state.submission);
  const [text, setText] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(2400);

  const minimumWords = question?.content?.minimumWords || (question?.content?.taskType === "task1" ? 150 : 250);
  const timeLimit = question?.timeLimit || (question?.content?.taskType === "task1" ? 20 : 40);
  const wordCount = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;

  useEffect(() => {
    setText("");
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

  const handleSubmit = async () => {
    if (!question?.id || !text.trim()) return;

    const result = await dispatch(createSubmission({
      section: "writing",
      type: "practice",
      questionId: question.id,
      content: { text },
      timeSpent: timeLimit * 60 - timeRemaining,
    }));

    if (createSubmission.fulfilled.match(result)) {
      router.push(`/practice/feedback?submissionId=${result.payload.id}`);
    }
  };

  return (
    <div className="bg-surface text-on-surface flex flex-col min-h-screen" style={{ fontFamily: "Montserrat, sans-serif" }}>
      <header className="bg-surface-container-lowest/90 backdrop-blur-md sticky top-0 z-50 flex justify-between items-center h-navbar-height px-margin-desktop w-full border-b border-outline-variant/20" style={{ boxShadow: "0 4px 20px -2px rgba(27,28,21,0.04)" }}>
        <div className="flex items-center gap-4">
          <Link href="/practice" className="text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-variant/50">
            <Icon name="arrow_back" size={20} />
          </Link>
          <div>
            <h1 className="font-montserrat text-headline-md font-bold text-primary">Writing Practice</h1>
            <p className="font-montserrat text-label-sm text-on-surface-variant">{question ? getQuestionTitle(question, "writing") : "Loading published task"}</p>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 bg-surface-container py-1.5 px-3 rounded-xl border border-outline-variant/20">
            <Icon name="timer" size={20} className="text-primary" />
            <span className="font-montserrat text-headline-md font-mono tracking-wider text-on-surface">{formatTime(timeRemaining)}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="font-montserrat text-label-lg text-on-surface-variant">Word Count</span>
            <div className="flex items-baseline gap-1">
              <span className={`font-montserrat text-headline-md font-bold ${wordCount >= minimumWords ? "text-green-700" : "text-on-surface"}`}>
                {wordCount}
              </span>
              <span className="font-montserrat text-body-md text-on-surface-variant">/ {minimumWords} min</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !question || !text.trim()}
            className="bg-primary-container text-on-primary font-montserrat text-label-lg px-6 py-2.5 rounded-full hover:opacity-90 disabled:opacity-60 transition-opacity flex items-center gap-2"
          >
            {submitting ? "Submitting..." : "Submit for AI Evaluation"}
            <Icon name="send" size={18} />
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
            <h2 className="font-montserrat text-headline-md text-on-surface mb-2">No writing task available</h2>
            <p className="font-montserrat text-body-md text-on-surface-variant">
              {error || "Ask an admin to publish writing practice content."}
            </p>
          </div>
        </main>
      ) : (
        <main className="flex-1 max-w-container-max mx-auto px-margin-desktop py-8 w-full">
          <div className="grid grid-cols-12 gap-gutter h-full">
            <aside className="col-span-4 flex flex-col gap-gutter overflow-y-auto pb-8">
              <div className="bento-card">
                <h2 className="font-montserrat text-label-lg text-on-surface-variant uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Icon name="description" size={18} />
                  Task Prompt
                </h2>
                <blockquote className="font-montserrat text-body-lg text-on-surface italic leading-relaxed border-l-4 border-primary pl-4 py-1 bg-surface-container/30 rounded-r-lg whitespace-pre-line">
                  {question.content?.prompt || "This writing task does not include a prompt."}
                </blockquote>
                {question.content?.imageUrl && (
                  <img src={question.content.imageUrl} alt="Writing task visual" className="mt-4 rounded-xl border border-outline-variant/20 w-full" />
                )}
              </div>

              <div className="bento-card">
                <h2 className="font-montserrat text-label-lg text-on-surface-variant uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Icon name="bar_chart" size={18} />
                  Submission Status
                </h2>
                <p className="font-montserrat text-body-md text-on-surface-variant">
                  Your response will be sent to the backend AI feedback queue. The feedback page will show pending status until scoring is complete.
                </p>
                {(submissionError || error) && (
                  <p className="font-montserrat text-body-md text-error mt-4">{submissionError || error}</p>
                )}
              </div>
            </aside>

            <div className="col-span-8 flex flex-col gap-gutter">
              <div className="bento-card flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-outline-variant/20">
                  <h2 className="font-montserrat text-label-lg text-on-surface-variant uppercase tracking-wider">Your Response</h2>
                  <div className="flex gap-2">
                    <button type="button" className="p-2 rounded-lg hover:bg-surface-container-low transition-colors text-on-surface-variant hover:text-on-surface" aria-label="Bold">
                      <Icon name="format_bold" size={18} />
                    </button>
                    <button type="button" className="p-2 rounded-lg hover:bg-surface-container-low transition-colors text-on-surface-variant hover:text-on-surface" aria-label="Italic">
                      <Icon name="format_italic" size={18} />
                    </button>
                    <button type="button" onClick={() => setText("")} className="p-2 rounded-lg hover:bg-surface-container-low transition-colors text-on-surface-variant hover:text-on-surface" aria-label="Clear">
                      <Icon name="undo" size={18} />
                    </button>
                  </div>
                </div>
                <textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder="Begin your response here."
                  spellCheck={false}
                  autoComplete="off"
                  autoCorrect="off"
                  className="flex-1 resize-none outline-none font-montserrat text-body-lg text-on-surface leading-relaxed placeholder:text-on-surface-variant/40 bg-transparent min-h-[500px]"
                />
                <div className="flex items-center justify-between pt-4 border-t border-outline-variant/20 mt-4">
                  <span className={`font-montserrat text-label-sm ${wordCount >= minimumWords ? "text-green-700 font-semibold" : "text-on-surface-variant"}`}>
                    {wordCount >= minimumWords ? "Minimum word count reached" : `${Math.max(0, minimumWords - wordCount)} more words to reach minimum`}
                  </span>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting || !text.trim()}
                    className="bg-primary-container text-on-primary font-montserrat text-label-lg px-6 py-2.5 rounded-xl hover:opacity-90 disabled:opacity-60 transition-opacity"
                  >
                    {submitting ? "Submitting..." : "Get AI Feedback"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}

export default function WritingPage() {
  return (
    <ProtectedRoute>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        }
      >
        <WritingPracticeContent />
      </Suspense>
    </ProtectedRoute>
  );
}
