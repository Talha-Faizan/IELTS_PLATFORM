"use client";
import React, { useState } from "react";
import Icon from "@/components/ui/Icon";
import { useDispatch } from "react-redux";
import api from "@/lib/api";

export default function WritingBuilder() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [taskType, setTaskType] = useState("task1");
  const [difficulty, setDifficulty] = useState("medium");
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState(""); // For Task 1 graphs
  const [minimumWords, setMinimumWords] = useState(150);

  // We reuse the section builder endpoint, but send the prompt directly in content
  const handleSave = async () => {
    if (!prompt) {
      window.alert("Writing prompt is required.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/admin/builder/section", {
        section: "writing",
        title: `Writing ${taskType.toUpperCase()}`,
        type: taskType,
        difficulty,
        questions: [{
          questionNumber: 1,
          questionText: prompt,
          part: taskType === "task1" ? "Task 1" : "Task 2"
        }],
        cueCard: null,
        minimumWords,
        imageUrl: taskType === "task1" ? imageUrl : null
      });

      const data = res.data;
      if (data.success) {
        window.alert("Writing task saved!");
        setPrompt("");
        setImageUrl("");
      } else {
        window.alert(data.message || "Failed to save.");
      }
    } catch (err) {
      window.alert("Server error during save.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bento-card max-w-3xl mx-auto flex flex-col gap-6">
      <h3 className="font-montserrat text-headline-md text-on-surface flex items-center gap-2">
        <Icon name="edit_note" size={24} className="text-primary" />
        Writing Task Builder
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        <select
          value={taskType}
          onChange={(e) => {
            setTaskType(e.target.value);
            setMinimumWords(e.target.value === "task1" ? 150 : 250);
          }}
          className="bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-2 font-montserrat text-body-md focus:border-primary"
        >
          <option value="task1">Task 1 (Graph/Chart)</option>
          <option value="task2">Task 2 (Essay)</option>
        </select>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-2 font-montserrat text-body-md focus:border-primary"
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="font-montserrat text-label-sm font-semibold text-on-surface">Writing Prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter the writing prompt here..."
          className="w-full min-h-[200px] resize-y bg-surface-container border border-outline-variant/30 rounded-lg p-4 font-montserrat text-body-md focus:border-primary"
        />
      </div>

      {taskType === "task1" && (
        <div className="flex flex-col gap-2">
          <label className="font-montserrat text-label-sm font-semibold text-on-surface">Graph/Chart Image URL</label>
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/chart.png"
            className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-2 font-montserrat text-body-md focus:border-primary"
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label className="font-montserrat text-label-sm font-semibold text-on-surface">Minimum Words Limit</label>
        <input
          type="number"
          value={minimumWords}
          onChange={(e) => setMinimumWords(parseInt(e.target.value))}
          className="w-full bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-2 font-montserrat text-body-md focus:border-primary"
        />
      </div>

      <div className="mt-4 pt-4 border-t border-outline-variant/20 flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 bg-primary text-on-primary px-6 py-2.5 rounded-xl font-montserrat text-label-lg font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Icon name="save" size={20} />}
          {loading ? "Saving..." : "Save Writing Task"}
        </button>
      </div>
    </div>
  );
}
