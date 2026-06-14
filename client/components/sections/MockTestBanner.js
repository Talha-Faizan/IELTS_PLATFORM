import Link from "next/link";
import Icon from "@/components/ui/Icon";

export default function MockTestBanner({ mockTests = [], progress, mockTestLimit }) {
  const nextTest = mockTests[0];
  const completed = progress?.recentSubmissions?.filter((item) => item.type === "mock").length || 0;
  const total = mockTests.length || completed;
  const percent = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
  const canTake = mockTestLimit?.canTake !== false;

  return (
    <div className="bento-card md:col-span-12 flex flex-col md:flex-row items-center justify-between gap-4 py-5">
      <div className="flex items-center gap-4">
        <div className="bg-surface-variant p-3 rounded-full text-primary">
          <Icon name="assignment" size={24} />
        </div>
        <div>
          <h4 className="font-montserrat text-headline-md text-on-surface">
            {nextTest ? nextTest.title : "No mock tests published yet"}
          </h4>
          <p className="font-montserrat text-body-md text-on-surface-variant">
            {nextTest
              ? "All four sections with simulated exam timing"
              : "Published tests will appear here when an admin adds them."}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6 w-full md:w-auto">
        <div className="flex-1 flex items-center gap-3 md:w-56">
          <div className="flex-1 h-3 rounded-full progress-bar-bg overflow-hidden">
            <div className="h-full progress-bar-fill rounded-full" style={{ width: `${percent}%` }} />
          </div>
          <span className="font-montserrat text-label-lg text-primary whitespace-nowrap font-semibold">
            {completed} / {total || 0} Done
          </span>
        </div>
        {nextTest && canTake ? (
          <Link
            href={`/mock-tests?testId=${nextTest.id}`}
            className="font-montserrat text-label-lg bg-primary-container text-on-primary rounded-xl px-6 py-3 hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            Start Test
          </Link>
        ) : (
          <Link
            href="/pricing"
            className="font-montserrat text-label-lg border border-primary text-primary rounded-xl px-6 py-3 hover:bg-surface-variant/30 transition-colors whitespace-nowrap"
          >
            View Plans
          </Link>
        )}
      </div>
    </div>
  );
}
