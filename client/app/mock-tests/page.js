"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Sidebar from "@/components/layout/Sidebar";
import DashboardNav from "@/components/layout/DashboardNav";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { fetchMockTests } from "@/lib/slices/contentSlice";
import { fetchUserProgress, fetchUserSubmissions } from "@/lib/slices/userSlice";
import { formatBand, formatDate } from "@/lib/dataTransforms";

export default function MockTestsPage() {
  const dispatch = useDispatch();
  const { mockTests, mockTestLimit, loading } = useSelector((state) => state.content);
  const { progress, submissions, loadingProgress } = useSelector((state) => state.user);

  useEffect(() => {
    dispatch(fetchMockTests({ limit: 20 }));
    dispatch(fetchUserProgress());
    dispatch(fetchUserSubmissions({ type: "mock", limit: 20 }));
  }, [dispatch]);

  const mockSubmissions = submissions.length > 0
    ? submissions
    : progress?.recentSubmissions?.filter((submission) => submission.type === "mock") || [];
  const completed = mockSubmissions.length;
  const avgScore = completed
    ? mockSubmissions.reduce((sum, submission) => sum + (Number(submission.bandEstimate) || 0), 0) / completed
    : 0;
  const total = mockTests.length;
  const percent = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
  const canTake = mockTestLimit?.canTake !== false;

  return (
    <ProtectedRoute>
      <div className=" flex min-h-screen" style={{ fontFamily: "Montserrat, sans-serif" }}>
        <Sidebar />
        <div className="flex-1 md:ml-sidebar-width flex flex-col">
          <DashboardNav title="Mock Tests" breadcrumbs={["Tests"]} />

          <main className="flex-1 p-6 md:p-8 flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="font-montserrat font-bold text-headline-lg text-on-surface">Mock Test Centre</h2>
                <p className="font-montserrat text-body-md text-on-surface-variant mt-1">
                  Full simulations pulled from published backend mock tests.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bento-card py-3 px-5 flex items-center gap-2">
                  <span className="font-montserrat text-label-sm text-on-surface-variant">Completed</span>
                  <span className="font-montserrat font-bold text-headline-md text-primary">{completed} / {total}</span>
                </div>
                <div className="bento-card py-3 px-5 flex items-center gap-2">
                  <span className="font-montserrat text-label-sm text-on-surface-variant">Avg Band</span>
                  <span className="font-montserrat font-bold text-headline-md text-primary">{formatBand(avgScore, "-")}</span>
                </div>
              </div>
            </div>

            <div className="bento-card flex flex-col md:flex-row items-center justify-between gap-4 py-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-surface-variant flex items-center justify-center text-primary">
                  <Icon name="assignment" size={24} />
                </div>
                <div>
                  <p className="font-montserrat font-semibold text-body-md text-on-surface">Mock Test Progress</p>
                  <p className="font-montserrat text-label-sm text-on-surface-variant">
                    {mockTestLimit
                      ? `${mockTestLimit.used} used, ${mockTestLimit.limit === "unlimited" ? "unlimited available" : `${Math.max(0, mockTestLimit.limit - mockTestLimit.used)} left`}`
                      : "Usage limits load with the mock-test list."}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 w-full md:w-80">
                <div className="flex-1 h-3 rounded-full progress-bar-bg overflow-hidden">
                  <div className="h-full progress-bar-fill rounded-full" style={{ width: `${percent}%` }} />
                </div>
                <span className="font-montserrat font-semibold text-label-lg text-primary whitespace-nowrap">{percent}%</span>
              </div>
            </div>

            {loading || loadingProgress ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {mockTests.length > 0 ? (
                  mockTests.map((test, index) => {
                    const completedSubmission = mockSubmissions.find((submission) => submission.mockTestTitle === test.title);
                    const locked = !completedSubmission && !canTake && index > 0;

                    return (
                      <div key={test.id} className={`bento-card flex flex-col md:flex-row items-start md:items-center gap-6 ${locked ? "opacity-60" : ""}`}>
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-montserrat font-bold text-headline-md flex-shrink-0 ${completedSubmission
                            ? "bg-green-100 text-green-700"
                            : locked
                              ? "bg-surface-container-low text-on-surface-variant"
                              : "bg-primary-container text-on-primary"
                          }`}>
                          {completedSubmission ? <Icon name="check_circle" size={24} /> : locked ? <Icon name="lock" size={24} /> : <Icon name="assignment" size={24} />}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-montserrat font-bold text-headline-md text-on-surface">{test.title}</h3>
                            <span className={`font-montserrat text-label-sm px-3 py-1 rounded-full border ${completedSubmission
                                ? "bg-green-50 text-green-700 border-green-200"
                                : locked
                                  ? "bg-surface-container-low text-on-surface-variant border-outline-variant/30"
                                  : "bg-primary-container/20 text-primary border-primary/20"
                              }`}>
                              {completedSubmission ? "Completed" : locked ? "Locked" : "Available"}
                            </span>
                          </div>
                          <p className="font-montserrat text-label-sm text-on-surface-variant">
                            {test.description || "Cambridge-style full test"} | Reading {test.timeLimits?.reading || 60}m, Listening {test.timeLimits?.listening || 30}m, Writing {test.timeLimits?.writing || 60}m, Speaking {test.timeLimits?.speaking || 15}m
                          </p>
                          {completedSubmission && (
                            <p className="font-montserrat text-label-sm text-on-surface-variant">
                              Completed {formatDate(completedSubmission.submittedAt)}
                            </p>
                          )}
                        </div>

                        <div className="flex-shrink-0">
                          {completedSubmission ? (
                            <Link href={`/practice/feedback?submissionId=${completedSubmission.id}`} className="font-montserrat text-label-lg text-primary border border-primary rounded-xl px-5 py-2.5 hover:bg-surface-variant/30 transition-colors flex items-center gap-2">
                              View Feedback
                              <Icon name="arrow_forward" size={16} />
                            </Link>
                          ) : locked ? (
                            <Link href="/pricing" className="font-montserrat text-label-lg text-on-surface-variant border border-outline-variant/30 rounded-xl px-5 py-2.5 inline-flex">
                              Upgrade
                            </Link>
                          ) : (
                            <Link href={`/practice/reading?mockTestId=${test.id}`} className="font-montserrat text-label-lg bg-primary-container text-on-primary rounded-xl px-5 py-2.5 hover:opacity-90 transition-opacity inline-flex">
                              Start Test
                            </Link>
                          )}
                          {completedSubmission?.bandEstimate && (
                            <div className="text-center mt-2">
                              <span className="font-montserrat font-bold text-headline-md text-primary">{formatBand(completedSubmission.bandEstimate)}</span>
                              <p className="font-montserrat text-label-sm text-on-surface-variant">Band</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="bento-card text-center py-10">
                    <p className="font-montserrat text-body-md text-on-surface-variant">
                      No published mock tests are available yet.
                    </p>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
