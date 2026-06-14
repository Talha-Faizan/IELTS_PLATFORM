"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Sidebar from "@/components/layout/Sidebar";
import DashboardNav from "@/components/layout/DashboardNav";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { fetchUserProgress, fetchUserSubmissions, fetchUserUsage } from "@/lib/slices/userSlice";
import { fetchPracticeQuestions } from "@/lib/slices/contentSlice";
import {
  SECTION_CONFIG,
  SECTION_KEYS,
  formatBand,
  formatRelativeDate,
  getPracticeSetCount,
  getSectionProgress,
  getSubmissionIcon,
  getSubmissionScore,
  getSubmissionTitle,
} from "@/lib/dataTransforms";

export default function PracticeHubPage() {
  const dispatch = useDispatch();
  const { progress, submissions, usage, loadingProgress, loadingUsage } = useSelector((state) => state.user);
  const { practiceBySection, loading } = useSelector((state) => state.content);

  useEffect(() => {
    dispatch(fetchUserProgress());
    dispatch(fetchUserSubmissions({ type: "practice", limit: 10 }));
    dispatch(fetchUserUsage());
    SECTION_KEYS.forEach((section) => {
      dispatch(fetchPracticeQuestions({ section, limit: 50 }));
    });
  }, [dispatch]);

  const recentSubmissions = submissions.length > 0
    ? submissions
    : progress?.recentSubmissions?.filter((submission) => submission.type === "practice") || [];
  const weakestSection = SECTION_KEYS.reduce((selected, section) => {
    const current = getSectionProgress(progress, section);
    const selectedProgress = getSectionProgress(progress, selected);
    const currentBand = current.avgBand || current.avgScore / 10 || 0;
    const selectedBand = selectedProgress.avgBand || selectedProgress.avgScore / 10 || 0;
    if (current.attempts === 0) return section;
    if (selectedProgress.attempts === 0) return selected;
    return currentBand < selectedBand ? section : selected;
  }, "reading");

  return (
    <ProtectedRoute>
      <div className=" flex min-h-screen">
        <Sidebar />
        <div className="flex-1 md:ml-sidebar-width flex flex-col">
          <DashboardNav title="Practice Hub" breadcrumbs={["Practice"]} />

          <main className="flex-1 p-6 md:p-8 flex flex-col gap-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="font-montserrat font-bold text-headline-lg text-on-surface">
                  Practice Hub
                </h2>
                <p className="font-montserrat text-body-md text-on-surface-variant mt-1">
                  Choose a section based on your live practice history and daily limits.
                </p>
              </div>
              <Link
                href={`/practice/${weakestSection}/list`}
                className="self-start font-montserrat text-label-lg bg-primary-container text-on-primary rounded-xl px-5 py-2.5 hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <Icon name="play_arrow" size={18} />
                Quick Start
              </Link>
            </div>

            {loading || loadingProgress || loadingUsage ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                  {SECTION_KEYS.map((section) => {
                    const config = SECTION_CONFIG[section];
                    const sectionProgress = getSectionProgress(progress, section);
                    const available = getPracticeSetCount(practiceBySection[section] || []);
                    const limit = usage?.[section];
                    const band = sectionProgress.avgBand || (sectionProgress.avgScore ? sectionProgress.avgScore / 10 : 0);
                    const completion = Math.min(100, Math.round((sectionProgress.attempts / Math.max(sectionProgress.attempts + available, 1)) * 100));
                    const remaining = limit
                      ? limit.limit === "unlimited"
                        ? "Unlimited"
                        : Math.max(0, limit.limit - limit.used)
                      : available;

                    return (
                      <Link key={section} href={`/practice/${section}/list`} className="block group">
                        <div className={`bento-card h-full flex flex-col gap-5 ${section === weakestSection ? "ring-2 ring-primary-container/60" : ""}`}>
                          <div className="flex items-start justify-between">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${section === weakestSection ? "bg-primary-container" : "bg-surface-container-low group-hover:bg-primary-container/10"}`}>
                              <Icon name={config.icon} size={28} className={section === weakestSection ? "text-on-primary" : "text-primary"} />
                            </div>
                            <div className="flex gap-2">
                              <span className="inline-flex items-center px-3 py-1 rounded-full border border-outline-variant/30 bg-surface-container-low text-on-surface-variant font-montserrat text-label-sm">
                                {available} {config.unit}
                              </span>
                              <span className="inline-flex items-center px-3 py-1 rounded-full border border-primary/20 bg-primary-container/10 text-primary font-montserrat text-label-sm">
                                {remaining} left
                              </span>
                            </div>
                          </div>

                          <div>
                            <h3 className="font-montserrat font-bold text-headline-md text-on-surface">{config.label}</h3>
                            <p className="font-montserrat text-body-md text-on-surface-variant mt-1">{config.description}</p>
                          </div>

                          <div className="flex gap-6">
                            <div>
                              <p className="font-montserrat font-bold text-headline-md text-primary">{sectionProgress.attempts}</p>
                              <p className="font-montserrat text-label-sm text-on-surface-variant">Attempts</p>
                            </div>
                            <div>
                              <p className="font-montserrat font-bold text-headline-md text-primary">{formatBand(band, "-")}</p>
                              <p className="font-montserrat text-label-sm text-on-surface-variant">Avg Band</p>
                            </div>
                            <div>
                              <p className="font-montserrat font-bold text-headline-md text-primary">{sectionProgress.avgScore || 0}%</p>
                              <p className="font-montserrat text-label-sm text-on-surface-variant">Avg Score</p>
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between mb-2">
                              <span className="font-montserrat text-label-sm text-on-surface-variant">Completion</span>
                              <span className="font-montserrat text-label-sm text-primary font-semibold">{completion}%</span>
                            </div>
                            <div className="h-2 rounded-full progress-bar-bg overflow-hidden">
                              <div className="h-full progress-bar-fill rounded-full" style={{ width: `${completion}%` }} />
                            </div>
                          </div>

                          <div className="flex items-center justify-end text-primary font-montserrat text-label-lg font-semibold group-hover:gap-2 transition-all">
                            Start Practice
                            <Icon name="arrow_forward" size={18} className="ml-1 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                <div className="bento-card">
                  <h3 className="font-montserrat text-headline-md text-on-surface mb-5">Recent Practice Sessions</h3>
                  <div className="flex flex-col divide-y divide-outline-variant/20">
                    {recentSubmissions.length > 0 ? (
                      recentSubmissions.map((submission) => (
                        <div key={submission.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                          <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-primary flex-shrink-0">
                            <Icon name={getSubmissionIcon(submission.section, submission.type)} size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-montserrat text-body-md text-on-surface truncate">{getSubmissionTitle(submission)}</p>
                            <p className="font-montserrat text-label-sm text-on-surface-variant">{formatRelativeDate(submission.submittedAt)}</p>
                          </div>
                          <span className="font-montserrat font-bold text-headline-md text-primary">{getSubmissionScore(submission)}</span>
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center font-montserrat text-body-md text-on-surface-variant">
                        No practice sessions yet. Start any section above to create your first record.
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
