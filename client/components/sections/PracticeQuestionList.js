"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";
import DashboardNav from "@/components/layout/DashboardNav";
import Icon from "@/components/ui/Icon";
import { fetchPracticeQuestionList } from "@/lib/slices/contentSlice";
import { SECTION_CONFIG, formatRelativeDate, toTitleCase } from "@/lib/dataTransforms";

const DIFFICULTY_TONE = {
  easy: "text-tertiary bg-tertiary-fixed",
  medium: "text-secondary bg-secondary-fixed",
  hard: "text-error bg-error-container",
};

/**
 * Renders the list of published practice questions for a given section.
 * Each card links to /practice/{section}?id={questionId}
 */
export default function PracticeQuestionList({ section }) {
  const dispatch = useDispatch();
  const config = SECTION_CONFIG[section];
  const { questionListBySection, questionListMetaBySection, loadingList, error } = useSelector(
    (state) => state.content
  );
  const items = questionListBySection[section] || [];
  const meta = questionListMetaBySection[section];
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");

  useEffect(() => {
    dispatch(fetchPracticeQuestionList({ section, difficulty: difficulty || undefined, limit: 50 }));
  }, [dispatch, section, difficulty]);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.preview.toLowerCase().includes(q) ||
        (item.tags || []).some((t) => t.toLowerCase().includes(q))
    );
  }, [items, search]);

  return (
    <div className=" flex min-h-screen" style={{ fontFamily: "Montserrat, sans-serif" }}>
      <Sidebar />
      <div className="flex-1 md:ml-sidebar-width flex flex-col">
        <DashboardNav
          title={`${config?.label || toTitleCase(section)} Questions`}
          breadcrumbs={["Practice", config?.label || toTitleCase(section)]}
        />

        <main className="flex-1 p-6 md:p-8 flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-on-primary">
                  <Icon name={config?.icon || "menu_book"} size={22} />
                </div>
                <h2 className="font-montserrat font-bold text-headline-lg text-on-surface">
                  {config?.label || toTitleCase(section)} Practice
                </h2>
              </div>
              <p className="font-montserrat text-body-md text-on-surface-variant">
                {config?.description || "Pick a question to attempt. Each item is scored and saved to your dashboard."}
              </p>
              {meta?.access && !meta.access.isPremium && (
                <p className="font-montserrat text-label-sm text-on-surface-variant mt-2">
                  {meta.access.remaining} attempts remaining today (free tier).
                </p>
              )}
            </div>
            <Link
              href="/practice"
              className="self-start font-montserrat text-label-lg text-on-surface-variant hover:text-primary flex items-center gap-1"
            >
              <Icon name="arrow_back" size={16} /> Back to all sections
            </Link>
          </div>

          {/* Filters */}
          <div className="bento-card flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                <Icon name="search" size={18} />
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, preview text, or tag..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-low font-montserrat text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-low font-montserrat text-body-md text-on-surface focus:outline-none focus:border-primary"
            >
              <option value="">All difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          {/* List body */}
          {loadingList && items.length === 0 ? (
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 bg-surface-container rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : error && items.length === 0 ? (
            <div className="bento-card text-center py-12">
              <h3 className="font-montserrat font-semibold text-headline-md text-on-surface mb-2">
                Could not load questions
              </h3>
              <p className="font-montserrat text-body-md text-on-surface-variant">{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bento-card text-center py-12">
              <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-3">
                <Icon name="inbox" size={28} className="text-on-surface-variant/50" />
              </div>
              <h3 className="font-montserrat font-semibold text-headline-md text-on-surface mb-1">
                {search ? "No questions match your search" : "No published questions yet"}
              </h3>
              <p className="font-montserrat text-body-md text-on-surface-variant">
                {search
                  ? "Try a different keyword or clear the filters."
                  : "Ask an admin to publish content for this section."}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filtered.map((item) => {
                const tone = DIFFICULTY_TONE[item.difficulty] || "text-on-surface-variant bg-surface-variant";
                const minutes = item.timeLimit || (section === "writing" ? 40 : section === "listening" ? 30 : 60);
                return (
                  <Link
                    key={item.id}
                    href={`/practice/${section}?id=${item.id}`}
                    className="bento-card flex flex-col md:flex-row md:items-start gap-5 group hover:border-primary/30 transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span
                          className={`px-2.5 py-1 rounded-full font-montserrat text-label-sm uppercase tracking-wide ${tone}`}
                        >
                          {item.difficulty}
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-surface-container-low font-montserrat text-label-sm text-on-surface-variant">
                          {(item.type || "").replace(/_/g, " ")}
                        </span>
                        {item.taskType && (
                          <span className="px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-montserrat text-label-sm uppercase">
                            {item.taskType}
                          </span>
                        )}
                        {item.hasAudio && (
                          <span className="px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-montserrat text-label-sm flex items-center gap-1">
                            <Icon name="volume_up" size={14} /> Audio
                          </span>
                        )}
                      </div>
                      <h3 className="font-montserrat font-bold text-headline-md text-on-surface group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      {item.preview && (
                        <p className="font-montserrat text-body-md text-on-surface-variant mt-2 line-clamp-2">
                          {item.preview}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 mt-3 font-montserrat text-label-sm text-on-surface-variant">
                        <span className="flex items-center gap-1">
                          <Icon name="timer" size={14} /> {minutes} min
                        </span>
                        {item.itemCount > 0 && (
                          <span className="flex items-center gap-1">
                            <Icon name="check_square" size={14} /> {item.itemCount} questions
                          </span>
                        )}
                        {(item.tags || []).slice(0, 3).map((t) => (
                          <span key={t} className="flex items-center gap-1">
                            <Icon name="bookmark" size={12} /> #{t}
                          </span>
                        ))}
                        <span className="ml-auto">{formatRelativeDate(item.createdAt)}</span>
                      </div>
                    </div>
                    <div className="self-stretch md:self-center flex md:block items-center justify-end">
                      <span className="inline-flex items-center gap-2 bg-primary-container text-on-primary font-montserrat text-label-lg font-semibold px-5 py-2.5 rounded-xl group-hover:opacity-90 transition-opacity">
                        Start Practice
                        <Icon name="arrow_forward" size={16} />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
