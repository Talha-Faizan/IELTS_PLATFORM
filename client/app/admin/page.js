"use client";

import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Icon from "@/components/ui/Icon";
import api from "@/lib/api";
import {
  fetchAdminMetrics,
  fetchAdminMockTests,
  fetchAdminQuestions,
  fetchAdminUsers,
  createAdminMockTest,
  createAdminQuestion,
  updateAdminMockTest,
  updateAdminQuestion,
  deleteAdminMockTest,
  deleteAdminQuestion,
  updateAdminUser,
  fetchExpertReviews,
  completeExpertReview,
  fetchAdminContentBlocks,
  createAdminContentBlock,
  deleteAdminContentBlock,
  uploadBulkContent,
  fetchQuestionAnalytics,
  clearAdminError,
  clearAdminSuccess,
} from "@/lib/slices/adminSlice";
import { fetchUserProfile } from "@/lib/slices/userSlice";
import { formatDate, formatRelativeDate, initialsFromName } from "@/lib/dataTransforms";
import SectionBuilder from "./components/Builder/SectionBuilder";
import MockTestAssembler from "./components/Builder/MockTestAssembler";

/* ─── Shared input class strings (used by every form field) ─────────────── */
const inputClass =
  "w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 font-montserrat text-body-md text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all";
const selectClass =
  "w-full bg-surface-container-low border border-outline-variant/30 rounded-lg px-4 py-3 font-montserrat text-label-lg text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none";
const textareaClass =
  "w-full bg-surface-container-low border border-outline-variant/30 rounded-xl p-4 font-montserrat text-body-md text-on-surface focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none transition-all";

/* ─── Section / type maps ──────────────────────────────────────────────── */
const TYPE_OPTIONS_BY_SECTION = {
  reading: [
    { value: "multiple_choice", label: "Multiple Choice" },
    { value: "match_headings", label: "Match Headings" },
    { value: "match_information", label: "Match Information" },
    { value: "fill_blank", label: "Fill in the Blank" },
    { value: "true_false_ng", label: "True / False / Not Given" },
    { value: "yes_no_ng", label: "Yes / No / Not Given" },
  ],
  listening: [
    { value: "mcq", label: "Multiple Choice" },
    { value: "fill_blank", label: "Fill in the Blank" },
    { value: "matching", label: "Matching" },
    { value: "map_label", label: "Map / Plan Labelling" },
  ],
  writing: [
    { value: "task1", label: "Task 1 — Chart / Graph Description" },
    { value: "task2", label: "Task 2 — Academic Essay" },
  ],
  speaking: [{ value: "parts", label: "Speaking Parts" }],
};

const blankQuestionItem = () => ({
  questionText: "",
  options: ["", "", "", ""],
  correctAnswer: "",
  explanation: "",
  part: "",
  sampleAnswer: "",
});

const defaultFormForSection = (section) => {
  const base = {
    section,
    type: TYPE_OPTIONS_BY_SECTION[section][0].value,
    difficulty: "medium",
    tags: "",
    timeLimit: "",
    content: {
      passage: "",
      paragraphLabels: [],
      audioUrl: null,
      transcript: "",
      prompt: "",
      taskType: section === "writing" ? "task1" : null,
      imageUrl: "",
      minimumWords: section === "writing" ? 150 : null,
      cueCard: { topic: "", bulletPoints: [""], preparationTime: 60, speakingTime: 120 },
      questions: [blankQuestionItem()],
    },
  };
  return base;
};

/* ─── Sub-components ───────────────────────────────────────────────────── */
function StatCard({ label, value, icon, helper, helperIcon, variant }) {
  const isAccent = variant === "accent";
  return (
    <div
      className={`bento-card flex flex-col justify-between ${isAccent ? "bg-surface-container-low" : ""}`}
    >
      <div className="flex items-center justify-between mb-4">
        <span
          className={`font-montserrat text-label-lg uppercase tracking-wider ${isAccent ? "text-primary" : "text-on-surface-variant"}`}
        >
          {label}
        </span>
        <Icon
          name={icon}
          className={isAccent ? "text-primary" : "text-primary opacity-80"}
        />
      </div>
      <div
        className={`font-montserrat font-bold ${isAccent ? "text-primary" : "text-on-surface"}`}
        style={{ fontSize: "48px", lineHeight: "1" }}
      >
        {value}
      </div>
      {helper && (
        <div
          className={`font-montserrat text-label-sm mt-2 flex items-center gap-1 ${isAccent ? "text-primary font-bold" : "text-on-surface-variant"}`}
        >
          {helperIcon && (
            <Icon name={helperIcon} size={14} />
          )}
          {helper}
        </div>
      )}
    </div>
  );
}

function TabBar({ activeTab, onChange }) {
  const tabs = [
    { key: "overview", icon: "dashboard", label: "Overview" },
    { key: "builder", icon: "construction", label: "Content Builder" },
    { key: "assembler", icon: "build_circle", label: "Mock Test Assembler" },
    { key: "questions", icon: "menu_book", label: "Question Bank" },
    { key: "contentblocks", icon: "view_carousel", label: "Content Blocks" },
    { key: "mocktests", icon: "assignment", label: "Mock Tests" },
    { key: "users", icon: "group", label: "Users" },
    { key: "reviews", icon: "rate_review", label: "Expert Reviews" },
  ];
  return (
    <div className="border-b border-outline-variant/20 bg-surface/80 backdrop-blur-sm sticky top-16 z-40">
      <div className="max-w-container-max mx-auto px-margin-desktop flex gap-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`flex items-center gap-2 px-4 py-4 font-montserrat text-label-lg whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <Icon name={tab.icon} size={18} />
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ icon = "inbox", message }) {
  return (
    <div className="py-16 text-center space-y-3">
      <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mx-auto">
        <Icon name={icon} className="text-on-surface-variant/40" size={28} />
      </div>
      <p className="font-montserrat text-label-lg text-on-surface-variant">{message}</p>
    </div>
  );
}

function SkeletonRows({ count = 3, height = "h-14" }) {
  return (
    <div className="p-6 space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`${height} bg-surface-container rounded-xl animate-pulse`} />
      ))}
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────────────── */
export default function AdminPage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const {
    metrics,
    users = [],
    questions = [],
    questionAnalytics = [],
    contentBlocks = [],
    mockTests = [],
    expertReviews = [],
    loading,
    error,
    successMessage,
  } = useSelector((state) => state.admin);

  const [activeTab, setActiveTab] = useState("overview");
  const [userSearch, setUserSearch] = useState("");
  const [questionFilters, setQuestionFilters] = useState({
    section: "",
    type: "",
    difficulty: "",
  });

  /* Question editor overlay */
  const [showQuestionEditor, setShowQuestionEditor] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formData, setFormData] = useState(defaultFormForSection("reading"));
  const [audioFile, setAudioFile] = useState(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);
  const [speakingPart, setSpeakingPart] = useState("Part 1");
  const audioInputRef = useRef(null);
  const cueCardImageRef = useRef(null);

  /* Mock test form state */
  const [mockTestForm, setMockTestForm] = useState({
    title: "",
    description: "",
    difficulty: "medium",
  });
  const [mockActiveSection, setMockActiveSection] = useState("reading");

  /* Expert reviews */
  const [expandedReview, setExpandedReview] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    reviewerNotes: "",
    revisedBandEstimate: "",
    detailedFeedback: "",
  });

  /* ─── Initial data load ─────────────────────────────────────────────── */
  useEffect(() => {
    dispatch(fetchAdminMetrics());
    dispatch(fetchAdminUsers({ limit: 100 }));
    dispatch(fetchAdminQuestions({ limit: 50 }));
    dispatch(fetchAdminContentBlocks({ limit: 50 }));
    dispatch(fetchQuestionAnalytics());
    dispatch(fetchAdminMockTests({ limit: 20 }));
    dispatch(fetchExpertReviews({ limit: 20 }));
  }, [dispatch]);

  /* ─── Auto-clear messages ───────────────────────────────────────────── */
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => dispatch(clearAdminSuccess()), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, dispatch]);
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => dispatch(clearAdminError()), 4000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  /* ─── Debounced user search ─────────────────────────────────────────── */
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(fetchAdminUsers({ limit: 100, search: userSearch }));
    }, 400);
    return () => clearTimeout(timer);
  }, [userSearch, dispatch]);

  /* ─── Question filters ──────────────────────────────────────────────── */
  useEffect(() => {
    dispatch(
      fetchAdminQuestions({
        limit: 50,
        section: questionFilters.section || undefined,
        type: questionFilters.type || undefined,
        difficulty: questionFilters.difficulty || undefined,
      })
    );
  }, [questionFilters, dispatch]);

  /* ─── Cleanup audio object URL on unmount ───────────────────────────── */
  useEffect(() => {
    return () => {
      if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    };
  }, [audioPreviewUrl]);

  /* Block non-admins (ProtectedRoute already gates auth) */
  if (user && user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-montserrat font-bold text-headline-md text-on-surface mb-2">
            Access Denied
          </h1>
          <p className="font-montserrat text-body-md text-on-surface-variant mb-4">
            You don&apos;t have permission to access this page.
          </p>
          <Link href="/dashboard" className="text-primary hover:underline">
            Return to dashboard
          </Link>
        </div>
      </div>
    );
  }

  /* ─── Question editor helpers ───────────────────────────────────────── */
  const resetQuestionForm = (section = "reading") => {
    setFormData(defaultFormForSection(section));
    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    setAudioFile(null);
    setAudioPreviewUrl(null);
    setSpeakingPart("Part 1");
  };

  const openQuestionEditor = () => {
    resetQuestionForm("reading");
    setShowQuestionEditor(true);
  };

  const closeQuestionEditor = () => {
    setShowQuestionEditor(false);
  };

  const handleSectionChange = (e) => {
    const newSection = e.target.value;
    setFormData(defaultFormForSection(newSection));
    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    setAudioFile(null);
    setAudioPreviewUrl(null);
  };

  const handleWritingTypeChange = (e) => {
    const t = e.target.value;
    setFormData((p) => ({
      ...p,
      type: t,
      content: {
        ...p.content,
        taskType: t,
        minimumWords: t === "task1" ? 150 : 250,
      },
    }));
  };

  const updateQuestion = (index, field, value) => {
    setFormData((p) => {
      const next = [...p.content.questions];
      next[index] = { ...next[index], [field]: value };
      return { ...p, content: { ...p.content, questions: next } };
    });
  };

  const updateQuestionOption = (qIdx, oIdx, value) => {
    setFormData((p) => {
      const next = [...p.content.questions];
      const opts = [...(next[qIdx].options || ["", "", "", ""])];
      opts[oIdx] = value;
      next[qIdx] = { ...next[qIdx], options: opts };
      return { ...p, content: { ...p.content, questions: next } };
    });
  };

  const addQuestion = () =>
    setFormData((p) => ({
      ...p,
      content: { ...p.content, questions: [...p.content.questions, blankQuestionItem()] },
    }));

  const removeQuestion = (index) =>
    setFormData((p) => ({
      ...p,
      content: {
        ...p.content,
        questions: p.content.questions.filter((_, i) => i !== index),
      },
    }));

  const addParagraphLabel = () =>
    setFormData((p) => ({
      ...p,
      content: { ...p.content, paragraphLabels: [...p.content.paragraphLabels, ""] },
    }));

  const updateParagraphLabel = (index, value) =>
    setFormData((p) => {
      const next = [...p.content.paragraphLabels];
      next[index] = value;
      return { ...p, content: { ...p.content, paragraphLabels: next } };
    });

  const removeParagraphLabel = (index) =>
    setFormData((p) => ({
      ...p,
      content: {
        ...p.content,
        paragraphLabels: p.content.paragraphLabels.filter((_, i) => i !== index),
      },
    }));

  const setCueCardField = (field, value) =>
    setFormData((p) => ({
      ...p,
      content: { ...p.content, cueCard: { ...p.content.cueCard, [field]: value } },
    }));

  const addBulletPoint = () =>
    setFormData((p) => ({
      ...p,
      content: {
        ...p.content,
        cueCard: {
          ...p.content.cueCard,
          bulletPoints: [...(p.content.cueCard?.bulletPoints || []), ""],
        },
      },
    }));

  const updateBulletPoint = (index, value) =>
    setFormData((p) => {
      const arr = [...(p.content.cueCard?.bulletPoints || [])];
      arr[index] = value;
      return {
        ...p,
        content: { ...p.content, cueCard: { ...p.content.cueCard, bulletPoints: arr } },
      };
    });

  const removeBulletPoint = (index) =>
    setFormData((p) => ({
      ...p,
      content: {
        ...p.content,
        cueCard: {
          ...p.content.cueCard,
          bulletPoints: (p.content.cueCard?.bulletPoints || []).filter((_, i) => i !== index),
        },
      },
    }));

  const handleAudioFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    setAudioFile(file);
    setAudioPreviewUrl(URL.createObjectURL(file));
  };

  const clearAudioFile = () => {
    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    setAudioFile(null);
    setAudioPreviewUrl(null);
    if (audioInputRef.current) audioInputRef.current.value = "";
  };

  /* ─── Handlers — submit / delete / toggle ───────────────────────────── */
  const handleCreateQuestion = async () => {
    setSubmitLoading(true);
    try {
      let audioUrl = formData.content.audioUrl || null;

      if (formData.section === "listening" && audioFile) {
        try {
          const fd = new FormData();
          fd.append("audio", audioFile);
          const uploadRes = await api.post("/admin/upload-audio", fd, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          audioUrl = uploadRes.data?.audioUrl || null;
        } catch (err) {
          console.warn("Audio upload failed — saving question without audio", err);
        }
      }

      const payload = {
        section: formData.section,
        type: formData.type,
        difficulty: formData.difficulty,
        contentBlockId: formData.contentBlockId || null,
        tags: (formData.tags || "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        timeLimit: formData.timeLimit ? Number(formData.timeLimit) : null,
        isPublished: false,
        content: {
          paragraphLabels:
            formData.section === "reading" ? formData.content.paragraphLabels || [] : [],
          prompt: formData.section === "writing" ? formData.content.prompt || null : null,
          taskType: formData.section === "writing" ? formData.type : null,
          imageUrl: formData.section === "writing" ? formData.content.imageUrl || null : null,
          minimumWords:
            formData.section === "writing" ? Number(formData.content.minimumWords) || null : null,
          cueCard:
            formData.section === "speaking" && speakingPart === "Part 2"
              ? formData.content.cueCard
              : undefined,
          questions: (formData.content.questions || []).map((q, i) => ({
            questionNumber: i + 1,
            questionText: q.questionText || "",
            options: Array.isArray(q.options) ? q.options.filter(Boolean) : [],
            correctAnswer:
              q.correctAnswer === undefined || q.correctAnswer === "" ? null : q.correctAnswer,
            explanation: q.explanation || null,
            part: formData.section === "speaking" ? speakingPart : q.part || null,
            sampleAnswer: q.sampleAnswer || null,
          })),
        },
      };

      await dispatch(createAdminQuestion(payload)).unwrap();
      resetQuestionForm(formData.section);
      setShowQuestionEditor(false);
    } catch (err) {
      console.error("Failed to create question:", err);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCreateMockTest = async (e) => {
    e?.preventDefault?.();
    if (!mockTestForm.title.trim()) return;
    try {
      await dispatch(
        createAdminMockTest({
          title: mockTestForm.title,
          description: mockTestForm.description,
          difficulty: mockTestForm.difficulty,
          sections: { reading: [], listening: [], writing: [], speaking: [] },
        })
      ).unwrap();
      setMockTestForm({ title: "", description: "", difficulty: "medium" });
    } catch (err) {
      console.error("Failed to create mock test:", err);
    }
  };

  const handleDeleteMockTest = (id) => {
    if (window.confirm("Delete this mock test? This cannot be undone.")) {
      dispatch(deleteAdminMockTest(id));
    }
  };

  const handleDeleteQuestion = (id) => {
    if (window.confirm("Delete this question? This cannot be undone.")) {
      dispatch(deleteAdminQuestion(id));
    }
  };

  const handleToggleMockTestPublish = (id, isPublished) =>
    dispatch(updateAdminMockTest({ id, updates: { isPublished: !isPublished } }));

  const handleToggleQuestionPublish = (id, isPublished) =>
    dispatch(updateAdminQuestion({ id, updates: { isPublished: !isPublished } }));

  const handleToggleUserActive = (id, isActive) =>
    dispatch(updateAdminUser({ id, updates: { isActive: !isActive } }));

  const handleCompleteReview = async (id) => {
    if (!reviewForm.reviewerNotes || !reviewForm.revisedBandEstimate) {
      window.alert("Please fill in reviewer notes and band estimate.");
      return;
    }
    try {
      await dispatch(
        completeExpertReview({
          id,
          reviewerNotes: reviewForm.reviewerNotes,
          revisedBandEstimate: Number(reviewForm.revisedBandEstimate),
          detailedFeedback: reviewForm.detailedFeedback,
        })
      ).unwrap();
      setExpandedReview(null);
      setReviewForm({ reviewerNotes: "", revisedBandEstimate: "", detailedFeedback: "" });
    } catch (err) {
      console.error("Failed to complete review:", err);
    }
  };

  const filteredQuestions = questions; // already filtered server-side

  return (
    <ProtectedRoute>
      <div
        className="bg-background text-on-background min-h-screen flex flex-col"
        style={{ fontFamily: "Montserrat, sans-serif" }}
      >
        {/* ─── Top Navbar ─────────────────────────────────────────────── */}
        <nav className="bg-surface/80 backdrop-blur-md sticky top-0 z-50 h-navbar-height px-margin-desktop w-full border-b border-outline-variant/10 flex justify-between items-center shadow-sm">
          <div className="font-montserrat text-headline-md font-black text-primary">
            IELTS Scholar{" "}
            <span className="font-montserrat text-label-lg text-on-surface-variant font-normal ml-2">
              Admin Panel
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Icon name="notifications" className="text-primary cursor-pointer transition-transform active:scale-95" />
            <Icon name="account_circle" className="text-primary cursor-pointer transition-transform active:scale-95" />
          </div>
        </nav>

        {/* ─── Tab Bar ────────────────────────────────────────────────── */}
        <TabBar activeTab={activeTab} onChange={setActiveTab} />

        {/* ─── Global error / success banners ────────────────────────── */}
        {(error || successMessage) && (
          <div className="max-w-container-max mx-auto px-margin-desktop pt-4 w-full">
            {error && (
              <div className="bento-card border border-error/30 bg-error-container/30 flex items-start gap-3 p-4">
                <Icon name="error" className="text-error mt-0.5" />
                <p className="font-montserrat text-body-md text-error">
                  {typeof error === "string" ? error : "An error occurred"}
                </p>
              </div>
            )}
            {successMessage && (
              <div className="bento-card border border-primary/30 bg-primary-fixed/30 flex items-start gap-3 p-4">
                <Icon name="check_circle" className="text-primary mt-0.5" />
                <p className="font-montserrat text-body-md text-primary">{successMessage}</p>
              </div>
            )}
          </div>
        )}

        {/* ─── Tab content ────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <OverviewTab
            metrics={metrics}
            users={users}
            expertReviews={expertReviews}
            userSearch={userSearch}
            setUserSearch={setUserSearch}
            setActiveTab={setActiveTab}
            loading={loading}
          />
        )}

        {activeTab === "builder" && (
          <div className="max-w-container-max mx-auto px-margin-desktop py-8 w-full">
            <SectionBuilder />
          </div>
        )}

        {activeTab === "assembler" && (
          <div className="max-w-container-max mx-auto px-margin-desktop py-8 w-full">
            <MockTestAssembler />
          </div>
        )}

        {activeTab === "questions" && (
          <QuestionsTab
            questions={filteredQuestions}
            questionAnalytics={questionAnalytics}
            loading={loading}
            filters={questionFilters}
            setFilters={setQuestionFilters}
            onAddNew={openQuestionEditor}
            onBulkImport={() => setShowBulkImport(true)}
            onTogglePublish={handleToggleQuestionPublish}
            onDelete={handleDeleteQuestion}
          />
        )}

        {activeTab === "contentblocks" && (
          <ContentBlocksTab
            contentBlocks={contentBlocks}
            loading={loading}
            onDelete={(id) => {
              if (window.confirm("Delete this content block? This may leave orphaned questions.")) {
                dispatch(deleteAdminContentBlock(id));
              }
            }}
          />
        )}

        {activeTab === "mocktests" && (
          <MockTestsTab
            mockTests={mockTests}
            loading={loading}
            mockTestForm={mockTestForm}
            setMockTestForm={setMockTestForm}
            mockActiveSection={mockActiveSection}
            setMockActiveSection={setMockActiveSection}
            onCreate={handleCreateMockTest}
            onTogglePublish={handleToggleMockTestPublish}
            onDelete={handleDeleteMockTest}
          />
        )}

        {activeTab === "users" && (
          <UsersTab
            users={users}
            loading={loading}
            search={userSearch}
            setSearch={setUserSearch}
            onToggleActive={handleToggleUserActive}
            onUpdateRole={(id, role) => dispatch(updateAdminUser({ id, updates: { role } }))}
          />
        )}

        {activeTab === "reviews" && (
          <ReviewsTab
            metrics={metrics}
            expertReviews={expertReviews}
            loading={loading}
            expandedReview={expandedReview}
            setExpandedReview={setExpandedReview}
            reviewForm={reviewForm}
            setReviewForm={setReviewForm}
            onComplete={handleCompleteReview}
          />
        )}

        {/* ─── Question Editor Overlay ────────────────────────────────── */}
        {showQuestionEditor && (
          <QuestionEditorOverlay
            contentBlocks={contentBlocks}
            formData={formData}
            setFormData={setFormData}
            onSectionChange={handleSectionChange}
            onWritingTypeChange={handleWritingTypeChange}
            audioFile={audioFile}
            audioPreviewUrl={audioPreviewUrl}
            audioInputRef={audioInputRef}
            cueCardImageRef={cueCardImageRef}
            onAudioFileSelect={handleAudioFileSelect}
            onClearAudioFile={clearAudioFile}
            speakingPart={speakingPart}
            setSpeakingPart={setSpeakingPart}
            updateQuestion={updateQuestion}
            updateQuestionOption={updateQuestionOption}
            addQuestion={addQuestion}
            removeQuestion={removeQuestion}
            addParagraphLabel={addParagraphLabel}
            updateParagraphLabel={updateParagraphLabel}
            removeParagraphLabel={removeParagraphLabel}
            setCueCardField={setCueCardField}
            addBulletPoint={addBulletPoint}
            updateBulletPoint={updateBulletPoint}
            removeBulletPoint={removeBulletPoint}
            onSave={handleCreateQuestion}
            onClose={closeQuestionEditor}
            submitLoading={submitLoading}
          />
        )}
        {showBulkImport && (
          <BulkImportModal
            onClose={() => setShowBulkImport(false)}
            onUpload={async (jsonData) => {
              try {
                await dispatch(uploadBulkContent(jsonData)).unwrap();
                setShowBulkImport(false);
                dispatch(fetchAdminQuestions({ limit: 50 }));
                dispatch(fetchAdminContentBlocks({ limit: 50 }));
              } catch (e) {
                console.error("Upload failed", e);
              }
            }}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}

/* ─── Overview Tab ────────────────────────────────────────────────────── */
function OverviewTab({
  metrics,
  users,
  expertReviews,
  userSearch,
  setUserSearch,
  setActiveTab,
  loading,
}) {
  return (
    <main className="max-w-container-max mx-auto px-margin-desktop py-8 flex flex-col gap-gutter w-full">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-2">
        <div>
          <h1 className="font-montserrat font-bold text-headline-lg text-on-surface">
            Dashboard Overview
          </h1>
          <p className="font-montserrat text-body-md text-on-surface-variant mt-1">
            System status and key metrics.
          </p>
        </div>
        <button
          onClick={() => setActiveTab("mocktests")}
          className="bg-primary text-on-primary font-montserrat text-label-lg font-semibold px-6 py-3 rounded hover:opacity-90 transition-colors flex items-center gap-2 self-start"
        >
          <Icon name="add" />
          Add New Test
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
        <StatCard
          label="Total Users"
          icon="group"
          value={metrics?.users?.total ?? 0}
          helper={`+${metrics?.users?.newToday ?? 0} today`}
          helperIcon="trending_up"
        />
        <StatCard
          label="Premium Users"
          icon="verified"
          value={metrics?.users?.premium ?? 0}
          helper={`${metrics?.subscriptions?.active ?? 0} active subs`}
          helperIcon="trending_up"
        />
        <StatCard
          label="Tests Today"
          icon="assignment_turned_in"
          value={metrics?.submissions?.today ?? 0}
          helper="Active sessions"
        />
        <StatCard
          label="Pending Reviews"
          icon="pending_actions"
          value={metrics?.expertReviews?.pending ?? 0}
          helper="View Queue →"
          variant="accent"
        />
      </div>

      {/* Lower section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter mt-4">
        {/* Recent users table */}
        <div className="lg:col-span-2 bento-card overflow-hidden p-0">
          <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center bg-surface-bright">
            <h2 className="font-montserrat text-headline-md font-bold text-on-surface">
              Recent Users
            </h2>
            <div className="relative">
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search users..."
                className="pl-10 pr-4 py-2 bg-surface border border-outline-variant/40 rounded focus:border-primary focus:ring-1 focus:ring-primary outline-none font-montserrat text-body-md text-on-surface w-64"
              />
              <Icon name="search" className="absolute left-3 top-2.5 text-on-surface-variant" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low font-montserrat text-label-sm text-on-surface-variant uppercase tracking-wider">
                  {["User", "Plan", "Status", "Last Active", "Actions"].map((h) => (
                    <th
                      key={h}
                      className="p-4 border-b border-outline-variant/20 font-semibold"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="font-montserrat text-body-md text-on-surface divide-y divide-outline-variant/10">
                {users.slice(0, 5).map((u) => (
                  <tr key={u.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed font-bold font-montserrat text-label-sm">
                          {initialsFromName(u.name)}
                        </div>
                        <div>
                          <div className="font-semibold">{u.name}</div>
                          <div className="font-montserrat text-label-sm text-on-surface-variant">
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded font-montserrat text-label-sm ${
                          u.subscriptionStatus === "premium"
                            ? "bg-tertiary-fixed text-on-tertiary-fixed"
                            : "bg-surface-variant text-on-surface-variant"
                        }`}
                      >
                        {u.subscriptionStatus === "premium" ? "Premium" : "Free"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`font-medium flex items-center ${
                          u.isActive ? "text-secondary" : "text-on-surface-variant"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full mr-2 ${
                            u.isActive ? "bg-secondary" : "bg-outline"
                          }`}
                        />
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-4 text-on-surface-variant">
                      {formatRelativeDate(u.lastActive || u.createdAt)}
                    </td>
                    <td className="p-4 text-right">
                      <button className="text-on-surface-variant hover:text-primary transition-colors">
                        <Icon name="more_vert" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && users.length === 0 && (
              <EmptyState icon="group" message="No users yet." />
            )}
          </div>
        </div>

        {/* Expert review queue */}
        <div className="bento-card p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-montserrat text-headline-md font-bold text-on-surface">
              Expert Review Queue
            </h2>
            <span className="bg-error-container text-on-error-container px-2 py-1 rounded font-montserrat text-label-sm font-bold">
              {metrics?.expertReviews?.pending ?? 0} Pending
            </span>
          </div>
          <div className="space-y-4">
            {expertReviews.slice(0, 3).map((review) => (
              <div
                key={review.id}
                className="p-4 border border-outline-variant/30 rounded bg-surface-bright hover:border-primary/50 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-montserrat text-label-sm bg-surface-variant text-on-surface-variant px-2 py-0.5 rounded uppercase">
                    {review.submissionType || "Submission"}
                  </span>
                  <span className="font-montserrat text-label-sm text-error flex items-center">
                    <Icon name="timer" className="mr-1" size={14} />
                    {review.status || "Pending"}
                  </span>
                </div>
                <div className="font-montserrat text-label-lg text-on-surface mb-1 font-semibold">
                  {review.user || "User"}
                </div>
                <div className="font-montserrat text-body-md text-on-surface-variant truncate mb-4">
                  {review.userEmail}
                </div>
                <button
                  onClick={() => setActiveTab("reviews")}
                  className="w-full border border-primary text-primary font-montserrat text-label-lg font-semibold py-2 rounded hover:bg-primary hover:text-on-primary transition-colors"
                >
                  Start Review
                </button>
              </div>
            ))}
            {!loading && expertReviews.length === 0 && (
              <p className="font-montserrat text-label-md text-on-surface-variant text-center py-6">
                No pending reviews
              </p>
            )}
          </div>
          <button
            onClick={() => setActiveTab("reviews")}
            className="w-full mt-4 text-primary font-montserrat text-label-sm py-2 text-center hover:underline"
          >
            View All Pending Submissions
          </button>
        </div>
      </div>
    </main>
  );
}

/* ─── Questions Tab ──────────────────────────────────────────────────── */
function QuestionsTab({
  questions,
  questionAnalytics,
  loading,
  filters,
  setFilters,
  onAddNew,
  onBulkImport,
  onTogglePublish,
  onDelete,
}) {
  const sectionTypeOptions = filters.section ? TYPE_OPTIONS_BY_SECTION[filters.section] || [] : [];

  return (
    <main className="max-w-container-max mx-auto px-margin-desktop py-8 flex flex-col gap-gutter w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-montserrat font-bold text-headline-lg text-on-surface">
            Question Bank
          </h1>
          <p className="font-montserrat text-body-md text-on-surface-variant mt-1">
            Manage the global database of academic assessment materials.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onBulkImport}
            className="bg-surface-variant text-on-surface flex items-center gap-2 px-6 py-3 rounded-lg font-montserrat text-label-lg font-semibold shadow-sm hover:opacity-90 active:scale-95 transition-all"
          >
            <Icon name="upload_file" /> Bulk Import
          </button>
          <button
            onClick={onAddNew}
            className="bg-primary text-on-primary flex items-center gap-2 px-6 py-3 rounded-lg font-montserrat text-label-lg font-semibold shadow-sm hover:opacity-90 active:scale-95 transition-all"
          >
            <Icon name="add" /> Add Question
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bento-card grid grid-cols-1 md:grid-cols-4 gap-4 p-6">
        <div>
          <label className="block font-montserrat text-label-sm font-semibold text-on-surface-variant mb-2">
            Search
          </label>
          <div className="relative">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant" />
            <input
              className="w-full pl-10 pr-4 py-2 border border-outline-variant/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-montserrat text-body-md bg-surface-container-lowest"
              placeholder="Search ID or keyword..."
            />
          </div>
        </div>
        <div>
          <label className="block font-montserrat text-label-sm font-semibold text-on-surface-variant mb-2">
            Section
          </label>
          <select
            value={filters.section}
            onChange={(e) =>
              setFilters({ section: e.target.value, type: "", difficulty: filters.difficulty })
            }
            className="w-full px-4 py-2 border border-outline-variant/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-montserrat text-body-md bg-surface-container-lowest"
          >
            <option value="">All Sections</option>
            <option value="reading">Reading</option>
            <option value="listening">Listening</option>
            <option value="writing">Writing</option>
            <option value="speaking">Speaking</option>
          </select>
        </div>
        <div>
          <label className="block font-montserrat text-label-sm font-semibold text-on-surface-variant mb-2">
            Type
          </label>
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            disabled={!filters.section}
            className="w-full px-4 py-2 border border-outline-variant/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-montserrat text-body-md bg-surface-container-lowest disabled:opacity-50"
          >
            <option value="">All Types</option>
            {sectionTypeOptions.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-montserrat text-label-sm font-semibold text-on-surface-variant mb-2">
            Difficulty
          </label>
          <select
            value={filters.difficulty}
            onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
            className="w-full px-4 py-2 border border-outline-variant/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-montserrat text-body-md bg-surface-container-lowest"
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bento-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-low border-b border-outline-variant/20">
              <tr>
                {["Section", "Type", "Difficulty", "Status", "Tags", "Pass/Fail Rate", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-4 font-montserrat text-label-lg text-on-surface-variant font-semibold"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {questions.map((q) => (
                <tr key={q.id} className="hover:bg-primary/5 transition-colors">
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full font-montserrat text-label-sm uppercase tracking-wide ${
                        q.section === "reading"
                          ? "bg-tertiary-fixed text-on-tertiary-fixed"
                          : q.section === "listening"
                            ? "bg-primary-fixed text-on-primary-fixed"
                            : q.section === "writing"
                              ? "bg-secondary-fixed text-on-secondary-fixed"
                              : "bg-surface-variant text-on-surface-variant"
                      }`}
                    >
                      {q.section}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-montserrat text-label-sm text-on-surface-variant uppercase">
                    {q.type?.replace(/_/g, " ")}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`font-montserrat text-label-sm font-semibold ${
                        q.difficulty === "hard"
                          ? "text-error"
                          : q.difficulty === "medium"
                            ? "text-secondary"
                            : "text-tertiary"
                      }`}
                    >
                      {q.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-2 font-montserrat text-label-sm">
                      <span
                        className={`w-2 h-2 rounded-full ${q.isPublished ? "bg-secondary" : "bg-outline"}`}
                      />
                      <span className="text-on-surface-variant">
                        {q.isPublished ? "Published" : "Draft"}
                      </span>
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1 flex-wrap">
                      {(q.tags || []).slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="bg-surface-container text-on-surface-variant px-2 py-0.5 rounded font-montserrat text-label-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {(() => {
                      const stats = questionAnalytics?.find(a => a.questionId === q.id);
                      if (!stats) return <span className="font-montserrat text-label-sm text-on-surface-variant">-</span>;
                      const failRate = stats.failureRate || 0;
                      const isHigh = failRate > 0.85;
                      return (
                        <span className={`font-montserrat font-bold text-label-md ${isHigh ? 'text-error' : 'text-on-surface-variant'}`}>
                          {(failRate * 100).toFixed(1)}%
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onTogglePublish(q.id, q.isPublished)}
                        className="text-on-surface-variant hover:text-primary transition-colors"
                        title={q.isPublished ? "Unpublish" : "Publish"}
                      >
                        <Icon name={q.isPublished ? "unpublished" : "publish"} />
                      </button>
                      <button
                        onClick={() => onDelete(q.id)}
                        className="text-on-surface-variant hover:text-error transition-colors"
                      >
                        <Icon name="delete" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && questions.length === 0 && <SkeletonRows />}
          {!loading && questions.length === 0 && (
            <EmptyState icon="quiz" message="No questions yet. Add one!" />
          )}
        </div>
      </div>
    </main>
  );
}

/* ─── Mock Tests Tab ─────────────────────────────────────────────────── */
function MockTestsTab({
  mockTests,
  loading,
  mockTestForm,
  setMockTestForm,
  mockActiveSection,
  setMockActiveSection,
  onCreate,
  onTogglePublish,
  onDelete,
}) {
  const sections = [
    { key: "reading", icon: "menu_book", label: "Reading" },
    { key: "listening", icon: "headset", label: "Listening" },
    { key: "writing", icon: "edit_note", label: "Writing" },
    { key: "speaking", icon: "record_voice_over", label: "Speaking" },
  ];

  return (
    <main className="max-w-container-max mx-auto px-margin-desktop py-8 flex gap-gutter w-full">
      {/* Sidebar */}
      <aside className="w-sidebar-width shrink-0 hidden lg:block">
        <div className="sticky top-32 space-y-6">
          <div className="bento-card rounded-xl p-4">
            <h3 className="font-montserrat text-label-lg text-on-surface-variant mb-4 px-2 uppercase tracking-wider font-semibold">
              Test Sections
            </h3>
            <ul className="space-y-1">
              {sections.map((s) => (
                <li key={s.key}>
                  <button
                    onClick={() => setMockActiveSection(s.key)}
                    className={`w-full flex items-center gap-3 rounded-lg px-4 py-3 transition-all font-montserrat text-label-lg ${
                      mockActiveSection === s.key
                        ? "bg-primary-container text-on-primary-container"
                        : "text-on-surface-variant hover:bg-surface-variant/50"
                    }`}
                  >
                    <Icon name={s.icon} />
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="bento-card rounded-xl p-6">
            <h3 className="font-montserrat text-label-lg text-on-surface mb-4 font-semibold">
              Test Summary
            </h3>
            <div className="space-y-4">
              {[
                ["Reading", "40 Qs"],
                ["Listening", "40 Qs"],
                ["Writing", "2 Tasks"],
                ["Speaking", "3 Parts"],
              ].map(([label, quota]) => (
                <div
                  key={label}
                  className="flex justify-between items-center text-on-surface-variant"
                >
                  <span className="font-montserrat text-body-md">{label}</span>
                  <span className="font-montserrat text-label-lg text-primary">0 / {quota}</span>
                </div>
              ))}
              <div className="pt-4 border-t border-outline-variant/20 flex justify-between items-center font-semibold">
                <span className="font-montserrat text-body-md text-on-surface">Estimated Band</span>
                <span className="font-montserrat text-label-lg text-on-surface">6.5 - 7.5</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="grow space-y-gutter min-w-0">
        <div>
          <h1 className="font-montserrat font-bold text-headline-lg text-on-surface">
            Mock Tests
          </h1>
          <p className="font-montserrat text-body-md text-on-surface-variant mt-1">
            Build full-length practice tests by combining questions from each section.
          </p>
        </div>

        {/* Create form */}
        <form onSubmit={onCreate} className="bento-card rounded-xl p-8">
          <h2 className="font-montserrat text-headline-md font-bold text-on-surface mb-6">
            General Configuration
          </h2>
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 md:col-span-6">
              <label className="block font-montserrat text-label-lg text-on-surface-variant mb-2">
                Mock Test Title
              </label>
              <input
                value={mockTestForm.title}
                onChange={(e) => setMockTestForm((p) => ({ ...p, title: e.target.value }))}
                className={inputClass}
                placeholder="Full Academic Mock #04"
                required
              />
            </div>
            <div className="col-span-12 md:col-span-3">
              <label className="block font-montserrat text-label-lg text-on-surface-variant mb-2">
                Difficulty
              </label>
              <select
                value={mockTestForm.difficulty}
                onChange={(e) => setMockTestForm((p) => ({ ...p, difficulty: e.target.value }))}
                className={selectClass}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div className="col-span-12 md:col-span-3">
              <label className="block font-montserrat text-label-lg text-on-surface-variant mb-2">
                Description
              </label>
              <input
                value={mockTestForm.description}
                onChange={(e) => setMockTestForm((p) => ({ ...p, description: e.target.value }))}
                className={inputClass}
                placeholder="Optional..."
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-6 bg-primary text-on-primary font-montserrat text-label-lg font-semibold px-6 py-3 rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            <Icon name="add" />
            {loading ? "Creating..." : "Create Mock Test"}
          </button>
        </form>

        {/* List */}
        <div className="space-y-4">
          {loading && mockTests.length === 0 ? (
            <SkeletonRows count={3} height="h-24" />
          ) : mockTests.length > 0 ? (
            mockTests.map((test) => (
              <div key={test.id} className="bento-card p-6 flex items-start gap-4">
                <div className="p-3 bg-primary-container rounded-lg text-on-primary-container shrink-0">
                  <Icon name="article" />
                </div>
                <div className="grow min-w-0">
                  <h3 className="font-montserrat text-label-lg font-semibold text-on-surface">
                    {test.title}
                  </h3>
                  <p className="font-montserrat text-body-md text-on-surface-variant truncate">
                    {test.description || "No description"}
                  </p>
                  <div className="flex gap-4 mt-2 font-montserrat text-label-sm text-on-surface-variant">
                    <span>R: {test.sections?.reading ?? 0}</span>
                    <span>L: {test.sections?.listening ?? 0}</span>
                    <span>W: {test.sections?.writing ?? 0}</span>
                    <span>S: {test.sections?.speaking ?? 0}</span>
                    <span>· {formatDate(test.createdAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onTogglePublish(test.id, test.isPublished)}
                    className={`px-3 py-1 rounded-full font-montserrat text-label-sm border transition-colors ${
                      test.isPublished
                        ? "border-secondary text-secondary hover:bg-secondary/5"
                        : "border-primary text-primary hover:bg-primary/5"
                    }`}
                  >
                    {test.isPublished ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    onClick={() => onDelete(test.id)}
                    className="text-on-surface-variant hover:text-error transition-colors"
                  >
                    <Icon name="delete" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bento-card">
              <EmptyState icon="assignment" message="No mock tests yet. Create one above!" />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

/* ─── Users Tab ──────────────────────────────────────────────────────── */
function UsersTab({ users, loading, search, setSearch, onToggleActive, onUpdateRole }) {
  return (
    <main className="max-w-container-max mx-auto px-margin-desktop py-8 flex flex-col gap-gutter w-full">
      <div>
        <h1 className="font-montserrat font-bold text-headline-lg text-on-surface">Users</h1>
        <p className="font-montserrat text-body-md text-on-surface-variant mt-1">
          Search registered users and manage roles or active status.
        </p>
      </div>

      <div className="bento-card p-6">
        <div className="relative max-w-md mb-6">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-montserrat text-body-md"
          />
        </div>

        {loading && users.length === 0 ? (
          <SkeletonRows count={5} height="h-16" />
        ) : users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low font-montserrat text-label-sm text-on-surface-variant uppercase tracking-wider">
                  {["User", "Role", "Plan", "Status", "Joined", "Actions"].map((h) => (
                    <th
                      key={h}
                      className="p-4 border-b border-outline-variant/20 font-semibold"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed font-bold font-montserrat text-label-sm">
                          {initialsFromName(u.name)}
                        </div>
                        <div>
                          <div className="font-montserrat font-semibold text-on-surface">
                            {u.name}
                          </div>
                          <div className="font-montserrat text-label-sm text-on-surface-variant">
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <select
                        value={u.role || "user"}
                        onChange={(e) => onUpdateRole(u.id, e.target.value)}
                        className="bg-surface-container-low border border-outline-variant/30 rounded px-2 py-1 font-montserrat text-label-sm text-on-surface focus:outline-none focus:border-primary"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded font-montserrat text-label-sm ${
                          u.subscriptionStatus === "premium"
                            ? "bg-tertiary-fixed text-on-tertiary-fixed"
                            : "bg-surface-variant text-on-surface-variant"
                        }`}
                      >
                        {u.subscriptionStatus === "premium" ? "Premium" : "Free"}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`flex items-center font-montserrat text-label-sm ${
                          u.isActive ? "text-secondary" : "text-on-surface-variant"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full mr-2 ${
                            u.isActive ? "bg-secondary" : "bg-outline"
                          }`}
                        />
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-4 font-montserrat text-label-sm text-on-surface-variant">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => onToggleActive(u.id, u.isActive)}
                        className="px-3 py-1 rounded-full border border-primary text-primary font-montserrat text-label-sm hover:bg-primary/5 transition-colors"
                      >
                        {u.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon="group" message="No users found." />
        )}
      </div>
    </main>
  );
}

/* ─── Reviews Tab ────────────────────────────────────────────────────── */
function ReviewsTab({
  metrics,
  expertReviews,
  loading,
  expandedReview,
  setExpandedReview,
  reviewForm,
  setReviewForm,
  onComplete,
}) {
  return (
    <main className="max-w-container-max mx-auto px-margin-desktop py-8 flex flex-col gap-gutter w-full">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h1 className="font-montserrat font-bold text-headline-lg text-on-surface">
            Expert Review Queue
          </h1>
          <p className="font-montserrat text-body-md text-on-surface-variant mt-1">
            Manage and complete pending student submission reviews.
          </p>
        </div>
        <span className="bg-error-container text-on-error-container px-4 py-2 rounded-full font-montserrat text-label-lg font-bold">
          {metrics?.expertReviews?.pending ?? 0} Pending
        </span>
      </div>

      <div className="space-y-4">
        {loading && expertReviews.length === 0 ? (
          <SkeletonRows count={3} height="h-32" />
        ) : expertReviews.length > 0 ? (
          expertReviews.map((review) => (
            <div key={review.id} className="bento-card p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed font-bold font-montserrat text-label-sm shrink-0">
                    {initialsFromName(review.user || "User")}
                  </div>
                  <div>
                    <div className="font-montserrat text-label-lg text-on-surface font-semibold">
                      {review.user || "User"}
                    </div>
                    <div className="font-montserrat text-label-sm text-on-surface-variant">
                      {review.userEmail}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-1 rounded font-montserrat text-label-sm uppercase ${
                      review.status === "complete"
                        ? "bg-tertiary-fixed text-on-tertiary-fixed"
                        : review.status === "assigned"
                          ? "bg-primary-fixed text-on-primary-fixed"
                          : "bg-error-container text-on-error-container"
                    }`}
                  >
                    {review.status || "queued"}
                  </span>
                  <span className="font-montserrat text-label-sm text-on-surface-variant">
                    {formatRelativeDate(review.createdAt)}
                  </span>
                </div>
              </div>

              {expandedReview === review.id ? (
                <div className="space-y-4 pt-4 border-t border-outline-variant/20">
                  <div>
                    <label className="block font-montserrat text-label-lg text-on-surface-variant mb-2">
                      Reviewer Notes
                    </label>
                    <textarea
                      rows={4}
                      value={reviewForm.reviewerNotes}
                      onChange={(e) =>
                        setReviewForm((p) => ({ ...p, reviewerNotes: e.target.value }))
                      }
                      className={textareaClass}
                      placeholder="Add your expert feedback and observations..."
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-montserrat text-label-lg text-on-surface-variant mb-2">
                        Revised Band Estimate
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={9}
                        step={0.5}
                        value={reviewForm.revisedBandEstimate}
                        onChange={(e) =>
                          setReviewForm((p) => ({
                            ...p,
                            revisedBandEstimate: e.target.value,
                          }))
                        }
                        className={inputClass}
                        placeholder="6.5"
                      />
                    </div>
                    <div>
                      <label className="block font-montserrat text-label-lg text-on-surface-variant mb-2">
                        Detailed Feedback
                      </label>
                      <textarea
                        rows={2}
                        value={reviewForm.detailedFeedback}
                        onChange={(e) =>
                          setReviewForm((p) => ({
                            ...p,
                            detailedFeedback: e.target.value,
                          }))
                        }
                        className={textareaClass}
                        placeholder="Key points..."
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setExpandedReview(null)}
                      className="border border-primary text-primary font-montserrat text-label-lg font-semibold px-6 py-2 rounded-lg hover:bg-primary/5 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => onComplete(review.id)}
                      className="bg-primary text-on-primary font-montserrat text-label-lg font-semibold px-6 py-2 rounded-lg hover:opacity-90 transition-all shadow-sm"
                    >
                      Submit Review
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  href={`/admin/examiner-review/${review.id}`}
                  className={`w-full text-center border border-primary text-primary font-montserrat text-label-lg font-semibold py-2 rounded hover:bg-primary hover:text-on-primary transition-colors ${review.status === "complete" ? "opacity-50 pointer-events-none" : ""}`}
                >
                  {review.status === "complete" ? "Review Completed" : "Start Review"}
                </Link>
              )}
            </div>
          ))
        ) : (
          <div className="bento-card">
            <EmptyState icon="rate_review" message="No pending expert reviews." />
          </div>
        )}
      </div>
    </main>
  );
}

/* ─── Question Editor Overlay ────────────────────────────────────────── */
function QuestionEditorOverlay({
  contentBlocks,
  formData,
  setFormData,
  onSectionChange,
  onWritingTypeChange,
  audioFile,
  audioPreviewUrl,
  audioInputRef,
  cueCardImageRef,
  onAudioFileSelect,
  onClearAudioFile,
  speakingPart,
  setSpeakingPart,
  updateQuestion,
  updateQuestionOption,
  addQuestion,
  removeQuestion,
  addParagraphLabel,
  updateParagraphLabel,
  removeParagraphLabel,
  setCueCardField,
  addBulletPoint,
  updateBulletPoint,
  removeBulletPoint,
  onSave,
  onClose,
  submitLoading,
}) {
  const typeOptions = TYPE_OPTIONS_BY_SECTION[formData.section] || [];

  return (
    <div
      className="fixed inset-0 z-50 bg-background overflow-y-auto"
      style={{ fontFamily: "Montserrat, sans-serif" }}
    >
      {/* Sticky editor header */}
      <header className="sticky top-0 z-50 h-navbar-height bg-surface/80 backdrop-blur-md px-margin-desktop flex items-center justify-between border-b border-outline-variant/20 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors"
          >
            <Icon name="arrow_back" />
            <span className="font-montserrat text-label-lg">Question Bank</span>
          </button>
          <Icon name="chevron_right" className="text-on-surface-variant" />
          <span className="font-montserrat text-label-lg font-bold text-primary">New Question</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-full border border-primary text-primary font-montserrat text-label-lg font-semibold hover:bg-primary-fixed transition-colors"
          >
            Discard
          </button>
          <button
            onClick={onSave}
            disabled={submitLoading}
            className="px-6 py-2 rounded-full bg-primary text-on-primary font-montserrat text-label-lg font-semibold hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Icon name="save" size={20} />
            {submitLoading ? "Saving..." : "Save Question"}
          </button>
        </div>
      </header>

      <div className="max-w-container-max mx-auto p-8">
        {/* Top metadata row */}
        <div className="bento-card grid grid-cols-2 md:grid-cols-4 gap-4 p-6 mb-6">
          <div>
            <label className="block font-montserrat text-label-lg text-on-surface-variant mb-2">
              Section
            </label>
            <select value={formData.section} onChange={onSectionChange} className={selectClass}>
              <option value="reading">Reading</option>
              <option value="listening">Listening</option>
              <option value="writing">Writing</option>
              <option value="speaking">Speaking</option>
            </select>
          </div>
          <div>
            <label className="block font-montserrat text-label-lg text-on-surface-variant mb-2">
              Question Type
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                formData.section === "writing"
                  ? onWritingTypeChange(e)
                  : setFormData((p) => ({ ...p, type: e.target.value }))
              }
              className={selectClass}
            >
              {typeOptions.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-montserrat text-label-lg text-on-surface-variant mb-2">
              Difficulty
            </label>
            <select
              value={formData.difficulty}
              onChange={(e) =>
                setFormData((p) => ({ ...p, difficulty: e.target.value }))
              }
              className={selectClass}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div>
            <label className="block font-montserrat text-label-lg text-on-surface-variant mb-2">
              Time Limit (mins)
            </label>
            <input
              type="number"
              value={formData.timeLimit || ""}
              onChange={(e) =>
                setFormData((p) => ({ ...p, timeLimit: e.target.value }))
              }
              className={inputClass}
              placeholder="20"
            />
          </div>
        </div>

        {/* Main editor grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* LEFT — section-specific content */}
          <div className="lg:col-span-7 space-y-gutter">
            {formData.section === "reading" && (
              <ReadingPanel
                formData={formData}
                setFormData={setFormData}
                contentBlocks={contentBlocks}
                addParagraphLabel={addParagraphLabel}
                updateParagraphLabel={updateParagraphLabel}
                removeParagraphLabel={removeParagraphLabel}
              />
            )}
            {formData.section === "listening" && (
              <ListeningPanel
                formData={formData}
                setFormData={setFormData}
                contentBlocks={contentBlocks}
                audioFile={audioFile}
                audioPreviewUrl={audioPreviewUrl}
                audioInputRef={audioInputRef}
                onAudioFileSelect={onAudioFileSelect}
                onClearAudioFile={onClearAudioFile}
              />
            )}
            {formData.section === "writing" && (
              <WritingPanel formData={formData} setFormData={setFormData} />
            )}
            {formData.section === "speaking" && (
              <SpeakingPanel
                formData={formData}
                speakingPart={speakingPart}
                setSpeakingPart={setSpeakingPart}
                setCueCardField={setCueCardField}
                addBulletPoint={addBulletPoint}
                updateBulletPoint={updateBulletPoint}
                removeBulletPoint={removeBulletPoint}
                updateQuestion={updateQuestion}
                addQuestion={addQuestion}
                removeQuestion={removeQuestion}
              />
            )}
          </div>

          {/* RIGHT — metadata + question blocks */}
          <div className="lg:col-span-5 space-y-gutter">
            <MetadataPanel
              formData={formData}
              setFormData={setFormData}
              speakingPart={speakingPart}
              cueCardImageRef={cueCardImageRef}
            />

            {(formData.section === "reading" || formData.section === "listening") && (
              <QuestionBlocksPanel
                formData={formData}
                updateQuestion={updateQuestion}
                updateQuestionOption={updateQuestionOption}
                addQuestion={addQuestion}
                removeQuestion={removeQuestion}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── READING panel ──────────────────────────────────────────────────── */
function ReadingPanel({
  formData,
  setFormData,
  contentBlocks,
  addParagraphLabel,
  updateParagraphLabel,
  removeParagraphLabel,
}) {
  const showLabels =
    formData.type === "match_headings" || formData.type === "match_information";
  const readingBlocks = contentBlocks.filter(cb => cb.section === "reading");

  return (
    <div className="bento-card flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="font-montserrat text-headline-md font-bold text-on-surface">
          Reading Content
        </h3>
      </div>

      <div className="space-y-2">
        <label className="font-montserrat text-label-lg text-on-surface-variant">
          Select Content Block
        </label>
        <select
          value={formData.contentBlockId || ""}
          onChange={(e) => setFormData(p => ({ ...p, contentBlockId: e.target.value }))}
          className={selectClass}
        >
          <option value="">-- Select a Reading Passage --</option>
          {readingBlocks.map(cb => (
            <option key={cb.id} value={cb.id}>{cb.title}</option>
          ))}
        </select>
        <p className="font-montserrat text-label-sm text-on-surface-variant mt-1">
          Reading passages are managed in the Content Blocks tab.
        </p>
      </div>

      {showLabels && (
        <div className="space-y-3">
          <label className="font-montserrat text-label-lg text-on-surface-variant">
            Paragraph Labels
          </label>
          {formData.content.paragraphLabels.map((lbl, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl border border-outline-variant/10"
            >
              <span className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold font-montserrat text-label-sm shrink-0">
                {String.fromCharCode(65 + i)}
              </span>
              <input
                value={lbl}
                onChange={(e) => updateParagraphLabel(i, e.target.value)}
                className="flex-1 bg-transparent border-none outline-none font-montserrat text-body-md text-on-surface"
                placeholder={`Label ${String.fromCharCode(65 + i)}...`}
              />
              <button
                type="button"
                onClick={() => removeParagraphLabel(i)}
                className="text-on-surface-variant hover:text-error transition-colors"
              >
                <Icon name="close" size={18} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addParagraphLabel}
            className="flex items-center gap-1 text-primary font-montserrat text-label-lg font-semibold hover:underline"
          >
            <Icon name="add_circle" /> Add Label
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── LISTENING panel ────────────────────────────────────────────────── */
function ListeningPanel({
  formData,
  setFormData,
  contentBlocks,
  audioFile,
  audioPreviewUrl,
  audioInputRef,
  onAudioFileSelect,
  onClearAudioFile,
}) {
  const listeningBlocks = contentBlocks.filter(cb => cb.section === "listening");

  return (
    <div className="bento-card flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="font-montserrat text-headline-md font-bold text-on-surface flex items-center gap-2">
          <Icon name="audio_file" className="text-primary" />
          Listening Content
        </h3>
        <span className="bg-secondary-fixed text-on-secondary-fixed px-3 py-1 rounded-full font-montserrat text-label-sm">
          {(formData.type || "MCQ").toUpperCase()}
        </span>
      </div>

      <div className="space-y-2">
        <label className="font-montserrat text-label-lg text-on-surface-variant">
          Select Content Block
        </label>
        <select
          value={formData.contentBlockId || ""}
          onChange={(e) => setFormData(p => ({ ...p, contentBlockId: e.target.value }))}
          className={selectClass}
        >
          <option value="">-- Select a Listening Audio --</option>
          {listeningBlocks.map(cb => (
            <option key={cb.id} value={cb.id}>{cb.title}</option>
          ))}
        </select>
        <p className="font-montserrat text-label-sm text-on-surface-variant mt-1">
          Listening audios are managed in the Content Blocks tab.
        </p>
      </div>
    </div>
  );
}

/* ─── WRITING panel ──────────────────────────────────────────────────── */
function WritingPanel({ formData, setFormData }) {
  return (
    <>
      <div className="bento-card">
        <h2 className="font-montserrat text-headline-md font-bold mb-6 flex items-center gap-2 text-on-surface">
          <Icon name="tune" className="text-primary" /> Task Configuration
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block font-montserrat text-label-lg text-on-surface-variant mb-2">
              Minimum Word Count
            </label>
            <div className="relative">
              <input
                type="number"
                value={formData.content.minimumWords || ""}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    content: { ...p.content, minimumWords: Number(e.target.value) || 0 },
                  }))
                }
                className={inputClass}
              />
              <span className="absolute right-4 top-3 text-on-surface-variant font-montserrat text-label-sm">
                Words
              </span>
            </div>
          </div>
          <div>
            <label className="block font-montserrat text-label-lg text-on-surface-variant mb-2">
              Task Type
            </label>
            <div className="px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-lg font-montserrat text-label-lg text-on-surface">
              {formData.type === "task1" ? "Task 1 — Chart Description" : "Task 2 — Academic Essay"}
            </div>
          </div>
        </div>
      </div>

      <div className="bento-card">
        <h2 className="font-montserrat text-headline-md font-bold mb-6 flex items-center gap-2 text-on-surface">
          <Icon name="history_edu" className="text-primary" /> Prompt Editor
        </h2>
        <div className="bg-surface-container-low p-6 rounded-lg border-l-4 border-primary">
          <textarea
            value={formData.content.prompt || ""}
            onChange={(e) =>
              setFormData((p) => ({
                ...p,
                content: { ...p.content, prompt: e.target.value },
              }))
            }
            className="w-full bg-transparent italic font-montserrat text-body-lg text-on-surface-variant border-none focus:ring-0 resize-none min-h-[120px] outline-none"
            placeholder="Type your academic prompt here... e.g. Some people think that..."
          />
        </div>
      </div>

      {formData.type === "task1" && (
        <div className="bento-card space-y-4">
          <h2 className="font-montserrat text-headline-md font-bold flex items-center gap-2 text-on-surface">
            <Icon name="image" className="text-primary" /> Chart / Graph Image
          </h2>
          <input
            type="url"
            value={formData.content.imageUrl || ""}
            onChange={(e) =>
              setFormData((p) => ({
                ...p,
                content: { ...p.content, imageUrl: e.target.value },
              }))
            }
            className={inputClass}
            placeholder="https://... paste S3 URL of the chart image"
          />
          {formData.content.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={formData.content.imageUrl}
              alt="Task 1 chart preview"
              className="max-h-48 rounded-xl border border-outline-variant/20"
            />
          )}
        </div>
      )}
    </>
  );
}

/* ─── SPEAKING panel ─────────────────────────────────────────────────── */
function SpeakingPanel({
  formData,
  speakingPart,
  setSpeakingPart,
  setCueCardField,
  addBulletPoint,
  updateBulletPoint,
  removeBulletPoint,
  updateQuestion,
  addQuestion,
  removeQuestion,
}) {
  const parts = [
    { part: "Part 1", icon: "looks_one", sub: "Intro" },
    { part: "Part 2", icon: "looks_two", sub: "Long Turn" },
    { part: "Part 3", icon: "looks_3", sub: "Discussion" },
  ];

  return (
    <>
      <div className="bento-card rounded-2xl">
        <h3 className="font-montserrat text-label-lg text-primary uppercase tracking-widest font-bold mb-6">
          Simulation Phase
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {parts.map(({ part, icon, sub }) => (
            <button
              key={part}
              type="button"
              onClick={() => setSpeakingPart(part)}
              className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
                speakingPart === part
                  ? "border-primary bg-primary-fixed/20 text-on-primary-fixed"
                  : "border-outline-variant/30 text-on-surface-variant hover:border-primary/50"
              }`}
            >
              <Icon name={icon} className="mb-2" size={32} />
              <span className="font-montserrat text-label-lg font-semibold">{part}</span>
              <span className="font-montserrat text-label-sm text-on-surface-variant opacity-70">
                {sub}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="bento-card rounded-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-montserrat text-label-lg text-primary uppercase tracking-widest font-bold">
            Examiner Instruction
          </h3>
          <span className="font-montserrat text-label-sm text-on-surface-variant opacity-60">
            Audio will be auto-generated
          </span>
        </div>
        <textarea
          value={formData.content.questions?.[0]?.questionText || ""}
          onChange={(e) => updateQuestion(0, "questionText", e.target.value)}
          className={`${textareaClass} min-h-[120px]`}
          placeholder="e.g., Now, in this first part, I'd like to ask you some questions about yourself..."
        />
      </div>

      {speakingPart === "Part 2" && (
        <div className="bento-card rounded-2xl space-y-4">
          <h3 className="font-montserrat text-label-lg text-primary uppercase tracking-widest font-bold">
            Cue Card Details
          </h3>
          <div>
            <label className="block font-montserrat text-label-sm text-on-surface-variant mb-2">
              Topic
            </label>
            <input
              value={formData.content.cueCard?.topic || ""}
              onChange={(e) => setCueCardField("topic", e.target.value)}
              className={inputClass}
              placeholder="Describe a place you have visited that impressed you..."
            />
          </div>
          <div>
            <label className="block font-montserrat text-label-sm text-on-surface-variant mb-2">
              Bullet Points
            </label>
            {(formData.content.cueCard?.bulletPoints || []).map((bp, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 bg-surface-container-lowest border border-outline-variant/20 rounded-xl mb-2"
              >
                <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold font-montserrat text-label-sm shrink-0">
                  {i + 1}
                </span>
                <input
                  value={bp}
                  onChange={(e) => updateBulletPoint(i, e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none font-montserrat text-body-md text-on-surface"
                  placeholder={`Bullet ${i + 1}...`}
                />
                <button
                  type="button"
                  onClick={() => removeBulletPoint(i)}
                  className="text-on-surface-variant/40 hover:text-error transition-colors"
                >
                  <Icon name="delete" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addBulletPoint}
              className="flex items-center gap-1 text-primary font-montserrat text-label-lg font-semibold hover:underline"
            >
              <Icon name="add_circle" /> Add bullet point
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-montserrat text-label-sm text-on-surface-variant mb-2">
                Prep Time (seconds)
              </label>
              <input
                type="number"
                value={formData.content.cueCard?.preparationTime ?? 60}
                onChange={(e) =>
                  setCueCardField("preparationTime", Number(e.target.value) || 0)
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className="block font-montserrat text-label-sm text-on-surface-variant mb-2">
                Speaking Time (seconds)
              </label>
              <input
                type="number"
                value={formData.content.cueCard?.speakingTime ?? 120}
                onChange={(e) =>
                  setCueCardField("speakingTime", Number(e.target.value) || 0)
                }
                className={inputClass}
              />
            </div>
          </div>
        </div>
      )}

      {(speakingPart === "Part 1" || speakingPart === "Part 3") && (
        <div className="bento-card rounded-2xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-montserrat text-label-lg text-primary uppercase tracking-widest font-bold">
              Follow-up Sequence
            </h3>
            <button
              type="button"
              onClick={addQuestion}
              className="flex items-center gap-1 text-primary hover:underline font-montserrat text-label-lg font-semibold"
            >
              <Icon name="add_circle" /> Add
            </button>
          </div>
          <div className="space-y-4">
            {formData.content.questions.map((q, i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-4 bg-surface-container-lowest border border-outline-variant/20 rounded-xl"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold font-montserrat text-label-sm shrink-0">
                  {i + 1}
                </div>
                <input
                  value={q.questionText}
                  onChange={(e) => updateQuestion(i, "questionText", e.target.value)}
                  className="w-full bg-transparent border-none focus:ring-0 p-0 text-on-surface outline-none font-montserrat text-body-md"
                  placeholder="Type follow-up question here..."
                />
                <button
                  type="button"
                  onClick={() => removeQuestion(i)}
                  className="text-on-surface-variant/40 hover:text-error transition-colors shrink-0"
                >
                  <Icon name="delete" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/* ─── METADATA panel (right column, shared) ──────────────────────────── */
function MetadataPanel({ formData, setFormData, speakingPart, cueCardImageRef }) {
  return (
    <div className="bento-card">
      <h3 className="font-montserrat text-headline-md font-bold text-on-surface mb-6">
        Metadata &amp; Settings
      </h3>
      <div className="space-y-4">
        <div>
          <label className="font-montserrat text-label-lg text-on-surface-variant">Tags</label>
          <input
            value={formData.tags}
            onChange={(e) => setFormData((p) => ({ ...p, tags: e.target.value }))}
            className={`mt-2 ${inputClass}`}
            placeholder="academic, environment, task2..."
          />
          <p className="font-montserrat text-label-sm text-on-surface-variant mt-1">
            Comma-separated
          </p>
        </div>

        {formData.section === "writing" && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-montserrat text-label-lg text-primary uppercase tracking-widest font-bold">
                Assessment Criteria
              </h3>
            </div>
            {[
              "Task Achievement",
              "Coherence & Cohesion",
              "Lexical Resource",
              "Grammar Range & Accuracy",
            ].map((c) => (
              <div
                key={c}
                className="flex justify-between items-center py-2 border-b border-outline-variant/10"
              >
                <span className="font-montserrat text-body-md text-on-surface">{c}</span>
                <span className="font-montserrat text-label-lg text-primary font-semibold">
                  25%
                </span>
              </div>
            ))}
          </div>
        )}

        {formData.section === "speaking" && speakingPart === "Part 2" && (
          <div>
            <label className="font-montserrat text-label-lg text-primary uppercase tracking-widest font-bold block mb-3">
              Visual Assets
            </label>
            <div
              onClick={() => cueCardImageRef.current?.click()}
              className="border-2 border-dashed border-outline-variant/30 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-surface-container-low transition-colors cursor-pointer group"
            >
              <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Icon name="upload_file" className="text-primary" size={32} />
              </div>
              <span className="font-montserrat text-label-lg text-on-surface block mb-1">
                Upload Cue Card Image
              </span>
              <span className="font-montserrat text-label-sm text-on-surface-variant opacity-60">
                JPG, PNG or PDF up to 5MB
              </span>
            </div>
            <input ref={cueCardImageRef} type="file" accept="image/*,.pdf" className="hidden" />
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── QUESTION BLOCKS panel (Reading + Listening only) ───────────────── */
function QuestionBlocksPanel({
  formData,
  updateQuestion,
  updateQuestionOption,
  addQuestion,
  removeQuestion,
}) {
  const isMcq = formData.type === "multiple_choice" || formData.type === "mcq";

  return (
    <div className="bento-card flex flex-col flex-1 gap-6">
      <div className="flex items-center justify-between">
        <h3 className="font-montserrat text-headline-md font-bold text-on-surface">
          Question Blocks
        </h3>
        <span className="bg-primary-container text-on-primary-container px-3 py-1 rounded-full font-montserrat text-label-sm font-bold">
          {formData.content.questions.length} Items
        </span>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto pr-2 max-h-[900px]">
        {formData.content.questions.map((q, i) => (
          <div
            key={i}
            className="group relative p-6 bg-surface-container-low rounded-2xl border border-transparent hover:border-primary/20 transition-all"
          >
            <div className="absolute -left-3 top-6 w-8 h-8 bg-primary text-on-primary rounded-full flex items-center justify-center font-bold font-montserrat shadow-lg">
              {i + 1}
            </div>
            <div className="flex justify-between items-start mb-4">
              <span className="font-montserrat text-label-sm font-bold text-primary tracking-widest uppercase">
                {(formData.type || "Question").replace(/_/g, " ")}
              </span>
              <button
                type="button"
                onClick={() => removeQuestion(i)}
                className="text-on-surface-variant hover:text-error transition-colors"
              >
                <Icon name="delete" />
              </button>
            </div>
            <textarea
              value={q.questionText}
              onChange={(e) => updateQuestion(i, "questionText", e.target.value)}
              className="w-full bg-transparent border-none p-0 focus:ring-0 font-montserrat text-body-md mb-4 resize-none outline-none text-on-surface"
              rows={2}
              placeholder="Enter question text here..."
            />

            {isMcq && (
              <div className="space-y-3">
                {(q.options?.length ? q.options : ["", "", "", ""]).map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-3">
                    <div
                      onClick={() => updateQuestion(i, "correctAnswer", oi)}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer ${
                        q.correctAnswer === oi
                          ? "border-primary"
                          : "border-outline-variant/50"
                      }`}
                    >
                      {q.correctAnswer === oi && (
                        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                      )}
                    </div>
                    <input
                      value={opt}
                      onChange={(e) => updateQuestionOption(i, oi, e.target.value)}
                      className="flex-1 bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-3 py-2 font-montserrat text-label-lg text-on-surface outline-none focus:border-primary"
                      placeholder={`Option ${oi + 1}`}
                    />
                  </div>
                ))}
              </div>
            )}

            {!isMcq && (
              <input
                value={q.correctAnswer || ""}
                onChange={(e) => updateQuestion(i, "correctAnswer", e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg px-3 py-2 font-montserrat text-label-lg text-on-surface outline-none focus:border-primary"
                placeholder="Correct answer..."
              />
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addQuestion}
        className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-outline-variant/30 rounded-xl text-primary font-montserrat text-label-lg font-semibold hover:border-primary/50 hover:bg-primary/5 transition-all"
      >
        <Icon name="add" /> Add Question Block
      </button>
    </div>
  );
}
/* ─── Bulk Import Modal ──────────────────────────────────────────────── */
function BulkImportModal({ onClose, onUpload }) {
  const [fileContent, setFileContent] = useState("");
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => setFileContent(evt.target.result);
    reader.readAsText(file);
  };

  const handleUpload = () => {
    try {
      const parsed = JSON.parse(fileContent);
      if (!Array.isArray(parsed)) throw new Error("Root must be a JSON array");
      setError(null);
      onUpload(parsed);
    } catch (e) {
      setError(e.message);
    }
  };

  const templateStr = `[
  {
    "contentBlock": {
      "section": "reading",
      "title": "Passage Title",
      "contentBody": "Full passage text...",
      "order": 1
    },
    "questions": [
      {
        "section": "reading",
        "type": "multiple_choice",
        "difficulty": "medium",
        "content": {
          "questions": [
            {
              "questionText": "Question 1?",
              "options": ["A", "B", "C", "D"],
              "correctAnswer": "A",
              "explanation": "Because..."
            }
          ]
        }
      }
    ]
  }
]`;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-surface rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-outline-variant/20 sticky top-0 bg-surface">
          <h2 className="font-montserrat text-headline-sm font-bold text-on-surface">
            Bulk Import
          </h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <Icon name="close" />
          </button>
        </div>
        <div className="p-6 space-y-6 flex-1">
          <div>
            <label className="block font-montserrat text-label-lg font-semibold text-on-surface-variant mb-2">
              Upload JSON File
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="w-full text-on-surface-variant font-montserrat file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-container file:text-primary hover:file:bg-primary-container/80 cursor-pointer"
            />
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-outline-variant/30"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-surface px-2 text-on-surface-variant font-montserrat tracking-wider">or paste JSON</span>
            </div>
          </div>
          <div>
            <textarea
              value={fileContent}
              onChange={(e) => setFileContent(e.target.value)}
              className={`${textareaClass} font-mono text-sm h-48`}
              placeholder="Paste JSON array here..."
            />
            {error && <p className="text-error font-montserrat text-label-sm mt-2">{error}</p>}
          </div>
          <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-montserrat text-label-lg font-bold text-on-surface">Template</h3>
              <button
                onClick={() => {
                  const blob = new Blob([templateStr], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "ielts_template.json";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="text-primary font-montserrat text-label-sm font-semibold hover:underline"
              >
                Download Template
              </button>
            </div>
            <pre className="font-mono text-xs text-on-surface-variant overflow-x-auto p-2 bg-surface-container-low rounded">
              {templateStr}
            </pre>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 p-6 border-t border-outline-variant/20 sticky bottom-0 bg-surface">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-full border border-primary text-primary font-montserrat text-label-lg font-semibold hover:bg-primary/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!fileContent.trim()}
            className="px-6 py-2 rounded-full bg-primary text-on-primary font-montserrat text-label-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50"
          >
            Import Data
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Content Blocks Tab ─────────────────────────────────────────────── */
function ContentBlocksTab({ contentBlocks, loading, onDelete }) {
  return (
    <main className="max-w-container-max mx-auto px-margin-desktop py-8 flex flex-col gap-gutter w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-montserrat font-bold text-headline-lg text-on-surface">
            Content Blocks
          </h1>
          <p className="font-montserrat text-body-md text-on-surface-variant mt-1">
            Manage shared passages and audio resources.
          </p>
        </div>
      </div>

      <div className="bento-card overflow-hidden p-0 mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container-low border-b border-outline-variant/20">
              <tr>
                {["Section", "Title", "Created By", "Date", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-4 font-montserrat text-label-lg text-on-surface-variant font-semibold"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {contentBlocks.map((cb) => (
                <tr key={cb.id} className="hover:bg-primary/5 transition-colors">
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full font-montserrat text-label-sm uppercase tracking-wide ${
                        cb.section === "reading"
                          ? "bg-tertiary-fixed text-on-tertiary-fixed"
                          : cb.section === "listening"
                            ? "bg-primary-fixed text-on-primary-fixed"
                            : cb.section === "writing"
                              ? "bg-secondary-fixed text-on-secondary-fixed"
                              : "bg-surface-variant text-on-surface-variant"
                      }`}
                    >
                      {cb.section}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-montserrat text-label-sm text-on-surface font-bold">
                    {cb.title}
                  </td>
                  <td className="px-6 py-4 font-montserrat text-label-sm text-on-surface-variant">
                    {cb.createdBy}
                  </td>
                  <td className="px-6 py-4 font-montserrat text-label-sm text-on-surface-variant">
                    {new Date(cb.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onDelete(cb.id)}
                      className="text-on-surface-variant hover:text-error transition-colors"
                    >
                      <Icon name="delete" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && contentBlocks.length === 0 && <SkeletonRows />}
          {!loading && contentBlocks.length === 0 && (
            <EmptyState icon="view_carousel" message="No content blocks yet." />
          )}
        </div>
      </div>
    </main>
  );
}
