"use client";
import React, { useState } from "react";
import Icon from "@/components/ui/Icon";
import { useDispatch } from "react-redux";
import api from "@/lib/api";

export default function SpeakingBuilder() {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [difficulty, setDifficulty] = useState("medium");
  const [title, setTitle] = useState("Speaking Full Test");
  
  const [cueCardTopic, setCueCardTopic] = useState("");
  const [bulletPoints, setBulletPoints] = useState(["", "", ""]);
  
  const [questionsPart1, setQuestionsPart1] = useState([{ questionNumber: 1, questionText: "", part: "Part 1" }]);
  const [questionsPart3, setQuestionsPart3] = useState([{ questionNumber: 1, questionText: "", part: "Part 3" }]);

  const updateBullet = (index, val) => {
    const updated = [...bulletPoints];
    updated[index] = val;
    setBulletPoints(updated);
  };

  const addQuestion = (partSetter, partQuestions, partName) => {
    partSetter([...partQuestions, { questionNumber: partQuestions.length + 1, questionText: "", part: partName }]);
  };

  const updateQuestion = (partSetter, partQuestions, index, val) => {
    const updated = [...partQuestions];
    updated[index].questionText = val;
    partSetter(updated);
  };

  const handleSave = async () => {
    if (!cueCardTopic) {
      window.alert("Cue card topic is required.");
      return;
    }

    setLoading(true);
    try {
      // We combine Part 1 and Part 3 questions into the main questions array
      const combinedQuestions = [...questionsPart1, ...questionsPart3].filter(q => q.questionText.trim() !== "");

      const res = await api.post("/admin/builder/section", {
        section: "speaking",
        title,
        type: "parts",
        difficulty,
        questions: combinedQuestions,
        cueCard: {
          topic: cueCardTopic,
          bulletPoints: bulletPoints.filter(b => b.trim() !== "")
        }
      });

      const data = res.data;
      if (data.success) {
        window.alert("Speaking set saved!");
        setCueCardTopic("");
        setBulletPoints(["", "", ""]);
        setQuestionsPart1([{ questionNumber: 1, questionText: "", part: "Part 1" }]);
        setQuestionsPart3([{ questionNumber: 1, questionText: "", part: "Part 3" }]);
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
    <div className="bento-card max-w-4xl mx-auto flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h3 className="font-montserrat text-headline-md text-on-surface flex items-center gap-2">
          <Icon name="mic" size={24} className="text-primary" />
          Speaking Set Builder
        </h3>
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

      <div className="flex flex-col gap-6">
        {/* Part 1 */}
        <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/30">
          <h4 className="font-montserrat text-label-lg font-bold text-on-surface mb-4">Part 1: Introduction & Interview</h4>
          <div className="flex flex-col gap-3">
            {questionsPart1.map((q, i) => (
              <div key={i} className="flex gap-2 items-center">
                <span className="w-6 text-center font-montserrat text-label-md text-on-surface-variant">{i + 1}.</span>
                <input
                  type="text"
                  value={q.questionText}
                  onChange={(e) => updateQuestion(setQuestionsPart1, questionsPart1, i, e.target.value)}
                  placeholder="e.g. Do you work or are you a student?"
                  className="flex-1 bg-surface-container border border-outline-variant/30 rounded px-3 py-2 font-montserrat text-body-md focus:border-primary"
                />
              </div>
            ))}
            <button onClick={() => addQuestion(setQuestionsPart1, questionsPart1, "Part 1")} className="self-start text-primary font-montserrat text-label-sm font-semibold hover:underline mt-2">
              + Add Part 1 Question
            </button>
          </div>
        </div>

        {/* Part 2 */}
        <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/30">
          <h4 className="font-montserrat text-label-lg font-bold text-on-surface mb-4">Part 2: Long Turn (Cue Card)</h4>
          <div className="flex flex-col gap-4">
            <input
              type="text"
              value={cueCardTopic}
              onChange={(e) => setCueCardTopic(e.target.value)}
              placeholder="Topic (e.g. Describe a beautiful place you visited)"
              className="w-full bg-surface-container border border-outline-variant/30 rounded px-4 py-2 font-montserrat text-body-md font-bold focus:border-primary"
            />
            <div className="flex flex-col gap-2 pl-4">
              <p className="font-montserrat text-label-sm text-on-surface-variant">You should say:</p>
              {bulletPoints.map((b, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/50"></div>
                  <input
                    type="text"
                    value={b}
                    onChange={(e) => updateBullet(i, e.target.value)}
                    placeholder="e.g. where it was"
                    className="flex-1 bg-surface-container border border-outline-variant/30 rounded px-3 py-1.5 font-montserrat text-body-md focus:border-primary"
                  />
                </div>
              ))}
              <button onClick={() => setBulletPoints([...bulletPoints, ""])} className="self-start text-primary font-montserrat text-label-sm font-semibold hover:underline mt-2">
                + Add Bullet Point
              </button>
            </div>
          </div>
        </div>

        {/* Part 3 */}
        <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/30">
          <h4 className="font-montserrat text-label-lg font-bold text-on-surface mb-4">Part 3: Two-Way Discussion</h4>
          <div className="flex flex-col gap-3">
            {questionsPart3.map((q, i) => (
              <div key={i} className="flex gap-2 items-center">
                <span className="w-6 text-center font-montserrat text-label-md text-on-surface-variant">{i + 1}.</span>
                <input
                  type="text"
                  value={q.questionText}
                  onChange={(e) => updateQuestion(setQuestionsPart3, questionsPart3, i, e.target.value)}
                  placeholder="e.g. How has tourism changed in your country?"
                  className="flex-1 bg-surface-container border border-outline-variant/30 rounded px-3 py-2 font-montserrat text-body-md focus:border-primary"
                />
              </div>
            ))}
            <button onClick={() => addQuestion(setQuestionsPart3, questionsPart3, "Part 3")} className="self-start text-primary font-montserrat text-label-sm font-semibold hover:underline mt-2">
              + Add Part 3 Question
            </button>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-outline-variant/20 flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 bg-primary text-on-primary px-6 py-2.5 rounded-xl font-montserrat text-label-lg font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Icon name="save" size={20} />}
          {loading ? "Saving..." : "Save Speaking Set"}
        </button>
      </div>
    </div>
  );
}
