"use client";
import React, { useState } from "react";
import QuestionEditorList from "./QuestionEditorList";
import Icon from "@/components/ui/Icon";
import { useDispatch } from "react-redux";
import api from "@/lib/api";

export default function ListeningBuilder() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [contentBody, setContentBody] = useState(""); // URL for audio
  const [difficulty, setDifficulty] = useState("medium");
  const [type, setType] = useState("mcq");
  const [questions, setQuestions] = useState([]);

  const handleSave = async () => {
    if (!title || !contentBody || questions.length === 0) {
      window.alert("Title, Audio URL, and at least 1 question are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/admin/builder/section", {
        section: "listening",
        title,
        type: "audio",
        difficulty,
        contentBody,
        questions
      });

      const data = res.data;
      if (data.success) {
        window.alert("Listening section saved!");
        setTitle("");
        setContentBody("");
        setQuestions([]);
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
    <div className="flex flex-col gap-6 h-full">
      {/* Top Pane: Audio Info */}
      <div className="bento-card flex flex-col gap-4">
        <h3 className="font-montserrat text-headline-md text-on-surface flex items-center gap-2">
          <Icon name="headset" size={24} className="text-primary" />
          Listening Audio
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Audio Title (e.g. Part 1: Hotel Booking)"
            className="bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-2 font-montserrat text-body-md focus:border-primary"
          />
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

        <input
          type="text"
          value={contentBody}
          onChange={(e) => setContentBody(e.target.value)}
          placeholder="Audio File URL (e.g., https://storage.googleapis.com/...)"
          className="bg-surface-container border border-outline-variant/30 rounded-lg px-4 py-2 font-montserrat text-body-md focus:border-primary"
        />
      </div>

      {/* Bottom Pane: Question Builder */}
      <div className="bento-card flex-1 flex flex-col justify-between">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-montserrat text-headline-md text-on-surface flex items-center gap-2">
              <Icon name="quiz" size={24} className="text-primary" />
              Question Set
            </h3>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-1.5 font-montserrat text-label-sm focus:border-primary"
            >
              <option value="mcq">Multiple Choice</option>
              <option value="fill_blank">Fill in the Blank</option>
              <option value="matching">Matching</option>
              <option value="map_label">Map Labeling</option>
            </select>
          </div>

          <QuestionEditorList questions={questions} setQuestions={setQuestions} />
        </div>

        <div className="mt-6 pt-4 border-t border-outline-variant/20 flex justify-end">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 bg-primary text-on-primary px-6 py-2.5 rounded-xl font-montserrat text-label-lg font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Icon name="save" size={20} />}
            {loading ? "Saving..." : "Save All"}
          </button>
        </div>
      </div>
    </div>
  );
}
