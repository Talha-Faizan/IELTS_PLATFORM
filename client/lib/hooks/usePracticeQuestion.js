"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchPracticeQuestions, fetchQuestion } from "@/lib/slices/contentSlice";
import { getFirstPracticeId } from "@/lib/dataTransforms";

/**
 * Loads the active practice question for a section.
 *
 * Selection priority:
 *   1. `requestedId` argument (e.g. from `?id=` in the URL)
 *   2. First available practice ID for the section (legacy auto-pick fallback)
 *
 * @param {string} section
 * @param {{ disabled?: boolean, requestedId?: string | null }} options
 */
export function usePracticeQuestion(section, { disabled = false, requestedId = null } = {}) {
  const dispatch = useDispatch();
  const { currentQuestion, practiceBySection, loading, loadingQuestion, error } = useSelector(
    (state) => state.content
  );
  const practiceSets = practiceBySection[section] || [];
  const firstQuestionId = getFirstPracticeId(practiceSets);
  const targetId = requestedId || firstQuestionId;

  useEffect(() => {
    if (disabled) return;
    // Only need the practice-set summary if we don't have an explicit id
    if (!requestedId) {
      dispatch(fetchPracticeQuestions({ section, limit: 50 }));
    }
  }, [disabled, dispatch, section, requestedId]);

  useEffect(() => {
    if (disabled) return;
    if (targetId && currentQuestion?.id !== targetId) {
      dispatch(fetchQuestion({ section, id: targetId }));
    }
  }, [currentQuestion?.id, disabled, dispatch, targetId, section]);

  return {
    question: currentQuestion?.section === section ? currentQuestion : null,
    practiceSets,
    firstQuestionId,
    loading: loading || loadingQuestion,
    error,
  };
}
