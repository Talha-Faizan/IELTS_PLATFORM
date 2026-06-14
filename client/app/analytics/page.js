"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Sidebar from "@/components/layout/Sidebar";
import DashboardNav from "@/components/layout/DashboardNav";
import Icon from "@/components/ui/Icon";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { fetchUserProfile, fetchUserProgress } from "@/lib/slices/userSlice";
import {
  SECTION_CONFIG,
  SECTION_KEYS,
  formatBand,
  getSectionProgress,
  getTargetBand,
  getWeakestSection,
} from "@/lib/dataTransforms";

const MAX_BAND = 9;

function buildTrendData(submissions = []) {
  const ordered = [...submissions]
    .filter((submission) => submission.bandEstimate || submission.score?.percentage !== undefined)
    .reverse()
    .slice(-6);

  return ordered.map((submission, index) => ({
    label: `A${index + 1}`,
    section: submission.section,
    value: submission.bandEstimate || Math.round((submission.score.percentage / 100) * 9 * 10) / 10,
  }));
}

export default function AnalyticsPage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { profile, progress, loadingProgress } = useSelector((state) => state.user);

  useEffect(() => {
    dispatch(fetchUserProfile());
    dispatch(fetchUserProgress());
  }, [dispatch]);

  const targetBand = getTargetBand(profile, user);
  const overallBand = progress?.overallBand || 0;
  const readiness = Math.min(100, Math.round((overallBand / targetBand) * 100)) || 0;
  const trendData = buildTrendData(progress?.recentSubmissions || []);
  const weakest = getWeakestSection(progress);
  const strongest = SECTION_KEYS.reduce((selected, section) => {
    const current = getSectionProgress(progress, section);
    const selectedProgress = getSectionProgress(progress, selected);
    const currentBand = current.avgBand || current.avgScore / 10 || 0;
    const selectedBand = selectedProgress.avgBand || selectedProgress.avgScore / 10 || 0;
    return currentBand > selectedBand ? section : selected;
  }, "reading");

  return (
    <ProtectedRoute>
      <div className=" flex min-h-screen" style={{ fontFamily: "Montserrat, sans-serif" }}>
        <Sidebar />
        <div className="flex-1 md:ml-sidebar-width flex flex-col">
          <DashboardNav title="Analytics" breadcrumbs={["Performance"]} />

          <main className="flex-1 p-6 md:p-8 flex flex-col gap-6">
            <div>
              <h2 className="font-montserrat font-bold text-headline-lg text-on-surface">Performance Analytics</h2>
              <p className="font-montserrat text-body-md text-on-surface-variant mt-1">
                Live progress based on your submitted practice and mock-test attempts.
              </p>
            </div>

            {loadingProgress ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
                  <div className="bento-card md:col-span-3 flex flex-col justify-between">
                    <p className="font-montserrat text-label-lg text-on-surface-variant uppercase tracking-wider">Current Overall</p>
                    <div className="text-center py-4">
                      <p className="font-montserrat font-bold text-primary" style={{ fontSize: "64px", lineHeight: "1" }}>
                        {formatBand(overallBand, "-")}
                      </p>
                      <p className="font-montserrat text-label-sm text-on-surface-variant mt-2">Average Band Score</p>
                    </div>
                    <div className="flex items-center justify-between border-t border-outline-variant/20 pt-4">
                      <span className="font-montserrat text-label-sm text-on-surface-variant">Target</span>
                      <span className="font-montserrat font-bold text-headline-md text-primary">{targetBand.toFixed(1)}</span>
                    </div>
                    <div className="mt-3 h-2 rounded-full progress-bar-bg overflow-hidden">
                      <div className="h-full progress-bar-fill rounded-full" style={{ width: `${readiness}%` }} />
                    </div>
                  </div>

                  <div className="bento-card md:col-span-9">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-montserrat text-headline-md text-on-surface">Recent Score Trend</h3>
                      <span className="font-montserrat text-label-sm text-on-surface-variant">{trendData.length} attempts</span>
                    </div>
                    {trendData.length > 0 ? (
                      <div className="relative">
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-7">
                          {[9, 8, 7, 6, 5].map((val) => (
                            <div key={val} className="flex items-center gap-2">
                              <span className="font-montserrat text-label-sm text-on-surface-variant/50 w-4">{val}</span>
                              <div className="flex-1 border-t border-outline-variant/20" />
                            </div>
                          ))}
                        </div>
                        <div className="ml-6">
                          <div className="flex items-end gap-3 h-40">
                            {trendData.map((item) => (
                              <div key={`${item.label}-${item.section}`} className="flex-1 flex flex-col items-center gap-1">
                                <span className="font-montserrat text-label-sm text-primary">{item.value.toFixed(1)}</span>
                                <div
                                  className="w-full rounded-t progress-bar-fill"
                                  style={{ height: `${(item.value / MAX_BAND) * 100}%` }}
                                />
                                <span className="font-montserrat text-on-surface-variant" style={{ fontSize: "10px" }}>
                                  {SECTION_CONFIG[item.section]?.label?.slice(0, 1) || item.label}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-40 flex items-center justify-center font-montserrat text-body-md text-on-surface-variant">
                        Submit practice attempts to populate your score trend.
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
                  {SECTION_KEYS.map((section) => {
                    const config = SECTION_CONFIG[section];
                    const sectionProgress = getSectionProgress(progress, section);
                    const current = sectionProgress.avgBand || (sectionProgress.avgScore ? sectionProgress.avgScore / 10 : 0);
                    const achieved = current >= targetBand && sectionProgress.attempts > 0;

                    return (
                      <div key={section} className={`bento-card flex flex-col gap-4 ${achieved ? "ring-2 ring-green-600/30" : ""}`}>
                        <div className="flex items-start justify-between">
                          <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-primary">
                            <Icon name={config.icon} size={20} />
                          </div>
                          <span className={`font-montserrat text-label-sm px-2.5 py-1 rounded-full border ${achieved ? "bg-green-50 text-green-700 border-green-200" : "bg-surface-container-low text-on-surface-variant border-outline-variant/30"}`}>
                            {achieved ? "Target met" : `Target ${targetBand.toFixed(1)}`}
                          </span>
                        </div>
                        <div>
                          <p className="font-montserrat text-label-lg text-on-surface-variant">{config.label}</p>
                          <p className="font-montserrat font-bold text-primary" style={{ fontSize: "40px", lineHeight: "1.1" }}>
                            {formatBand(current, "-")}
                          </p>
                        </div>
                        <div className="h-2 rounded-full progress-bar-bg overflow-hidden">
                          <div className="h-full progress-bar-fill rounded-full" style={{ width: `${Math.min(100, (current / MAX_BAND) * 100)}%`, backgroundColor: achieved ? "#155d27" : undefined }} />
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-outline-variant/20">
                          <div className="text-center">
                            <p className="font-montserrat font-bold text-body-md text-on-surface">{sectionProgress.attempts}</p>
                            <p className="font-montserrat text-label-sm text-on-surface-variant">Attempts</p>
                          </div>
                          <div className="text-center">
                            <p className="font-montserrat font-bold text-body-md text-on-surface">{sectionProgress.avgScore || 0}%</p>
                            <p className="font-montserrat text-label-sm text-on-surface-variant">Avg Score</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="bento-card">
                  <h3 className="font-montserrat text-headline-md text-on-surface mb-5 flex items-center gap-2">
                    <Icon name="psychology" size={20} className="text-primary" />
                    Insights
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
                    {[
                      {
                        icon: "trending_up",
                        title: "Strongest Area",
                        body: `${SECTION_CONFIG[strongest].label} is currently your highest section based on submitted attempts.`,
                      },
                      {
                        icon: "priority_high",
                        title: "Priority Focus",
                        body: `${SECTION_CONFIG[weakest].label} should get the next focused practice block.`,
                      },
                      {
                        icon: "event",
                        title: "Exam Target",
                        body: `You are ${readiness}% of the way to your Band ${targetBand.toFixed(1)} target based on current averages.`,
                      },
                    ].map(({ icon, title, body }) => (
                      <div key={title} className="flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary-container/10 flex items-center justify-center text-primary flex-shrink-0">
                          <Icon name={icon} size={20} />
                        </div>
                        <div>
                          <p className="font-montserrat text-label-lg text-on-surface font-semibold mb-1">{title}</p>
                          <p className="font-montserrat text-body-md text-on-surface-variant">{body}</p>
                        </div>
                      </div>
                    ))}
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
