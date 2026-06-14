const Question = require('../models/Question');
const Submission = require('../models/Submission');

// Map database task types to human-readable titles and frontend paths
const getTaskInfo = (section, type) => {
  const info = {
    reading: { title: "Reading Practice", link: "/practice/reading/list", duration: 20 },
    listening: { title: "Listening Practice", link: "/practice/listening/list", duration: 30 },
    writing: { title: type === "task1" ? "Writing Task 1" : "Writing Task 2", link: "/practice/writing/list", duration: type === "task1" ? 20 : 40 },
    speaking: { title: "Speaking Simulator", link: "/practice/speaking/list", duration: 15 },
  };
  return info[section] || { title: `${section} Practice`, link: `/practice/${section}/list`, duration: 20 };
};

const generateStudyPlan = async (user) => {
  if (!user.examDate) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const examDate = new Date(user.examDate);
  examDate.setHours(0, 0, 0, 0);

  const diffTime = Math.abs(examDate - today);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 0) return []; // Exam is today or past

  const daysToGenerate = Math.min(diffDays, 30); // Max 30 days plan

  // 1. Analyze User Progress to find weaknesses
  const submissions = await Submission.find({ userId: user._id });
  const sectionScores = {
    reading: { score: 0, count: 0 },
    listening: { score: 0, count: 0 },
    writing: { score: 0, count: 0 },
    speaking: { score: 0, count: 0 }
  };

  const attemptedQuestionIds = [];

  submissions.forEach(sub => {
    if (sub.questionId) attemptedQuestionIds.push(sub.questionId.toString());
    if (sectionScores[sub.section]) {
      sectionScores[sub.section].count++;
      if (sub.bandEstimate) sectionScores[sub.section].score += sub.bandEstimate;
    }
  });

  // Sort sections by average score (ascending) so weakest comes first
  const sortedSections = Object.keys(sectionScores).sort((a, b) => {
    const avgA = sectionScores[a].count > 0 ? sectionScores[a].score / sectionScores[a].count : 0;
    const avgB = sectionScores[b].count > 0 ? sectionScores[b].score / sectionScores[b].count : 0;
    
    // If neither has attempts, randomize or prioritize reading/writing
    if (sectionScores[a].count === 0 && sectionScores[b].count === 0) return 0;
    // Un-attempted sections get high priority (treat as score 0)
    return avgA - avgB;
  });

  // 2. Query available, un-attempted questions from DB for these sections
  const plan = [];
  let availableQuestions = [];
  
  try {
    availableQuestions = await Question.find({
      _id: { $nin: attemptedQuestionIds },
      isPublished: true
    }).select('_id section type difficulty tags timeLimit content').lean();
  } catch (error) {
    console.error("Error fetching questions for study plan:", error);
  }

  // Group by section for easy pulling
  const questionsBySection = {
    reading: availableQuestions.filter(q => q.section === 'reading'),
    listening: availableQuestions.filter(q => q.section === 'listening'),
    writing: availableQuestions.filter(q => q.section === 'writing'),
    speaking: availableQuestions.filter(q => q.section === 'speaking')
  };

  // Keep track of what we assign so we don't assign same question twice
  const assignedIds = new Set();

  for (let i = 0; i < daysToGenerate; i++) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() + i);
    
    const isMockTestDay = (daysToGenerate - i === 1) || (i > 0 && i % 7 === 0);
    
    let dailyTasks = [];
    if (isMockTestDay) {
      dailyTasks.push({
        title: "Full Mock Test",
        link: "/mock-tests",
        section: "mockTest",
        duration: 165,
        description: "Simulate the real exam conditions"
      });
    } else {
      // Pick 2 tasks based on weaknesses. First task is weakest section, second is second weakest.
      // If we run out of un-attempted questions for weakest, fallback to next weakest.
      const taskSectionsToPick = [sortedSections[0], sortedSections[1]];
      
      taskSectionsToPick.forEach(sec => {
        let qIndex = questionsBySection[sec].findIndex(q => !assignedIds.has(q._id.toString()));
        let qToAssign = null;

        if (qIndex !== -1) {
          qToAssign = questionsBySection[sec][qIndex];
        } else {
          // Fallback to ANY available section if preferred is empty
          for (const fallbackSec of sortedSections) {
            let fbIndex = questionsBySection[fallbackSec].findIndex(q => !assignedIds.has(q._id.toString()));
            if (fbIndex !== -1) {
              qToAssign = questionsBySection[fallbackSec][fbIndex];
              break;
            }
          }
        }

        if (qToAssign) {
          assignedIds.add(qToAssign._id.toString());
          const info = getTaskInfo(qToAssign.section, qToAssign.type);
          
          let description = `Target Band: ${user.targetBand || 7.0}`;
          if (qToAssign.tags && qToAssign.tags.length > 0) {
            description += ` • Skills: ${qToAssign.tags.slice(0, 2).join(', ')}`;
          }

          dailyTasks.push({
            id: qToAssign._id.toString(),
            title: info.title,
            link: `/practice/${qToAssign.section}?id=${qToAssign._id.toString()}`,
            section: qToAssign.section,
            duration: qToAssign.timeLimit || info.duration,
            description
          });
        }
      });
      
      // If DB is completely empty or user did everything, fallback to generic tasks so calendar isn't broken
      if (dailyTasks.length === 0) {
        const info = getTaskInfo(sortedSections[i % 4], null);
        dailyTasks.push({
          title: info.title,
          link: info.link,
          section: sortedSections[i % 4],
          duration: info.duration,
          description: `Target Band: ${user.targetBand || 7.0} (General Practice)`
        });
      }
    }

    plan.push({
      dayNumber: i + 1,
      date: currentDate.toISOString(),
      tasks: dailyTasks
    });
  }

  return plan;
};

module.exports = { generateStudyPlan };
