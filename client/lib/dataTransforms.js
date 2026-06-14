export const SECTION_KEYS = ["reading", "writing", "listening", "speaking"];

export const SECTION_CONFIG = {
  reading: {
    label: "Reading",
    icon: "menu_book",
    href: "/practice/reading",
    description: "Academic passages with all question types.",
    unit: "sets",
  },
  writing: {
    label: "Writing",
    icon: "edit_note",
    href: "/practice/writing",
    description: "Task 1 and Task 2 responses with AI scoring.",
    unit: "tasks",
  },
  listening: {
    label: "Listening",
    icon: "headset",
    href: "/practice/listening",
    description: "Lectures and conversations across four sections.",
    unit: "sets",
  },
  speaking: {
    label: "Speaking",
    icon: "mic",
    href: "/practice/speaking",
    description: "AI examiner simulations for all speaking parts.",
    unit: "prompts",
  },
};

export function toTitleCase(value = "") {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatBand(value, fallback = "No attempts") {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric.toFixed(1) : fallback;
}

export function initialsFromName(name = "Student") {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "ST";
}

export function formatDate(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatRelativeDate(value) {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return formatDate(value);
}

export function getSectionProgress(progress, section) {
  return progress?.sections?.[section] || { attempts: 0, avgScore: 0, avgBand: 0 };
}

export function getTargetBand(profile, authUser) {
  return Number(profile?.targetBand || authUser?.targetBand || 7) || 7;
}

export function getPracticeSetCount(practiceSets = []) {
  return practiceSets.reduce((total, set) => total + (Number(set.count) || 0), 0);
}

export function getFirstPracticeId(practiceSets = []) {
  return practiceSets.find((set) => Array.isArray(set.ids) && set.ids.length > 0)?.ids?.[0] || null;
}

export function getQuestionItems(question) {
  return question?.content?.questions || [];
}

export function getQuestionTitle(question, section) {
  if (!question) return `${SECTION_CONFIG[section]?.label || toTitleCase(section)} Practice`;
  if (question.content?.taskType) return `${SECTION_CONFIG[section]?.label} ${question.content.taskType.toUpperCase()}`;
  return `${SECTION_CONFIG[section]?.label} ${question.type?.replaceAll("_", " ") || "Practice"}`;
}

export function getSubmissionIcon(section, type) {
  if (type === "mock") return "assignment";
  return SECTION_CONFIG[section]?.icon || "assignment";
}

export function getSubmissionTitle(submission) {
  if (!submission) return "Practice session";
  const section = toTitleCase(submission.section || "practice");
  const type = submission.type === "mock" ? "Mock Test" : "Practice";
  return submission.mockTestTitle || `${section} ${type}`;
}

export function getSubmissionScore(submission) {
  if (!submission) return "Pending";
  if (submission.bandEstimate) return formatBand(submission.bandEstimate, "Pending");
  if (submission.score?.percentage !== undefined) return `${submission.score.percentage}%`;
  if (submission.feedbackStatus === "pending") return "Pending";
  return "Review";
}

export function getWeakestSection(progress) {
  const attempted = SECTION_KEYS
    .map((section) => ({ section, ...getSectionProgress(progress, section) }))
    .filter((item) => item.attempts > 0);

  if (attempted.length === 0) return "writing";

  return attempted.reduce((lowest, item) => {
    const itemBand = item.avgBand || item.avgScore / 10 || 0;
    const lowestBand = lowest.avgBand || lowest.avgScore / 10 || 0;
    return itemBand < lowestBand ? item : lowest;
  }).section;
}
