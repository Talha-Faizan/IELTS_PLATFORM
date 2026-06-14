"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Sidebar from "@/components/layout/Sidebar";
import DashboardNav from "@/components/layout/DashboardNav";
import BandTracker from "@/components/sections/BandTracker";
import AIRecommendation from "@/components/sections/AIRecommendation";
import MockTestBanner from "@/components/sections/MockTestBanner";
import PracticeCards from "@/components/sections/PracticeCards";
import StudyCalendar from "@/components/sections/StudyCalendar";
import Icon from "@/components/ui/Icon";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { fetchUserProfile, fetchUserProgress, fetchUserSubmissions, fetchUserUsage, fetchStudyPlan } from "@/lib/slices/userSlice";
import { fetchMockTests, fetchPracticeQuestions } from "@/lib/slices/contentSlice";
import {
  SECTION_KEYS,
  formatRelativeDate,
  getSubmissionIcon,
  getSubmissionScore,
  getSubmissionTitle,
} from "@/lib/dataTransforms";

export default function DashboardPage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { profile, progress, submissions, usage, studyPlan, loading, loadingProgress } = useSelector((state) => state.user);
  const { mockTests, mockTestLimit, practiceBySection } = useSelector((state) => state.content);

  useEffect(() => {
    dispatch(fetchUserProfile());
    dispatch(fetchStudyPlan());
    dispatch(fetchUserProgress());
    dispatch(fetchUserSubmissions({ limit: 10 }));
    dispatch(fetchUserUsage());
    dispatch(fetchMockTests({ limit: 5 }));
    SECTION_KEYS.forEach((section) => {
      dispatch(fetchPracticeQuestions({ section, limit: 50 }));
    });
  }, [dispatch]);

  const recentSubmissions = submissions.length > 0 ? submissions : progress?.recentSubmissions || [];
  const nextSection = SECTION_KEYS.find((section) => (progress?.sections?.[section]?.attempts || 0) === 0) || "reading";

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 md:ml-sidebar-width flex flex-col min-h-screen">
          <DashboardNav title="Dashboard" />

          <main className="flex-1 p-6 md:p-8 flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="font-montserrat font-bold text-headline-lg text-on-surface">
                  Welcome, {profile?.name || user?.name || "Student"}
                </h2>
                <p className="font-montserrat text-body-md text-on-surface-variant mt-1">
                  {progress?.totalSubmissions
                    ? `${progress.totalSubmissions} attempts logged. Keep building your band profile.`
                    : "Start your first practice attempt to build a personal band profile."}
                </p>
              </div>
              <a
                href={`/practice/${nextSection}/list`}
                className="self-start md:self-auto font-montserrat text-label-lg bg-primary-container text-on-primary rounded-xl px-5 py-2.5 hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <Icon name="play_arrow" size={18} />
                Continue Practice
              </a>
            </div>

            {loading || loadingProgress ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                {studyPlan && studyPlan.length > 0 && (
                  <div className="mb-2">
                    <StudyCalendar studyPlan={studyPlan} />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
                  <BandTracker progress={progress} profile={profile} user={user} />
                  <AIRecommendation progress={progress} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
                  <MockTestBanner mockTests={mockTests} progress={progress} mockTestLimit={mockTestLimit} />
                </div>

                <PracticeCards progress={progress} usage={usage} practiceBySection={practiceBySection} />

                <div className="bento-card">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-montserrat text-headline-md text-on-surface">Recent Activity</h3>
                    <a href="/practice" className="font-montserrat text-label-lg text-primary hover:underline flex items-center gap-1">
                      View All
                      <Icon name="arrow_forward" size={16} />
                    </a>
                  </div>
                  <div className="flex flex-col divide-y divide-outline-variant/20">
                    {recentSubmissions.length > 0 ? (
                      recentSubmissions.map((submission) => (
                        <div key={submission.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                          <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-primary flex-shrink-0">
                            <Icon name={getSubmissionIcon(submission.section, submission.type)} size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-montserrat text-body-md text-on-surface font-medium truncate">{getSubmissionTitle(submission)}</p>
                            <p className="font-montserrat text-label-sm text-on-surface-variant">{formatRelativeDate(submission.submittedAt)}</p>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="hidden md:inline-flex items-center px-2.5 py-1 rounded-full bg-surface-container-low border border-outline-variant/20 font-montserrat text-label-sm text-on-surface-variant">
                              {submission.section}
                            </span>
                            <span className="font-montserrat font-bold text-headline-md text-primary">{getSubmissionScore(submission)}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center font-montserrat text-body-md text-on-surface-variant">
                        No activity yet. Your completed practice attempts will show up here.
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
