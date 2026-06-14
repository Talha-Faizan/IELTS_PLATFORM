"use client";
import React, { useState, useEffect } from "react";
import Icon from "@/components/ui/Icon";
import { useDispatch, useSelector } from "react-redux";
import api from "@/lib/api";

export default function MockTestAssembler() {
  const dispatch = useDispatch();
  const { contentBlocks = [], questions = [] } = useSelector((state) => state.admin);
  
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [timeLimit, setTimeLimit] = useState(165); // Standard 2 hours 45 mins

  const [selections, setSelections] = useState({
    reading: ["", "", ""], // 3 passages
    listening: ["", "", "", ""], // 4 parts
    writing: ["", ""], // task 1, task 2
    speaking: [""] // 1 full set
  });

  const [validation, setValidation] = useState({
    readingCount: 0,
    listeningCount: 0,
  });

  // Filter content blocks for dropdowns
  const readingBlocks = contentBlocks.filter(cb => cb.section === 'reading');
  const listeningBlocks = contentBlocks.filter(cb => cb.section === 'listening');
  const writingQuestions = questions.filter(q => q.section === 'writing');
  const speakingQuestions = questions.filter(q => q.section === 'speaking');

  // Calculate questions total from selections
  useEffect(() => {
    let rCount = 0;
    let lCount = 0;

    selections.reading.forEach(id => {
      if (id) {
        // Find the question document associated with this contentBlockId
        const qDoc = questions.find(q => q.contentBlockId === id);
        if (qDoc && qDoc.content && qDoc.content.questions) {
          rCount += qDoc.content.questions.length;
        }
      }
    });

    selections.listening.forEach(id => {
      if (id) {
        const qDoc = questions.find(q => q.contentBlockId === id);
        if (qDoc && qDoc.content && qDoc.content.questions) {
          lCount += qDoc.content.questions.length;
        }
      }
    });

    setValidation({ readingCount: rCount, listeningCount: lCount });
  }, [selections, questions]);

  const handleSelect = (section, index, value) => {
    const updated = { ...selections };
    updated[section][index] = value;
    setSelections(updated);
  };

  const handleSave = async () => {
    if (!title) {
      window.alert("Mock Test Title is required.");
      return;
    }
    
    if (validation.readingCount !== 40 || validation.listeningCount !== 40) {
      window.alert("Both Reading and Listening must have exactly 40 questions.");
      return;
    }

    setLoading(true);
    try {
      // Filter out empty strings
      const cleanedSelections = {
        reading: selections.reading.filter(Boolean),
        listening: selections.listening.filter(Boolean),
        writing: selections.writing.filter(Boolean),
        speaking: selections.speaking.filter(Boolean),
      };

      const res = await api.post("/admin/builder/mock-test", {
        title,
        description,
        difficulty,
        isPremium,
        timeLimit: parseInt(timeLimit),
        readingSectionIds: selections.reading.filter(id => id !== ""),
        listeningSectionIds: selections.listening.filter(id => id !== ""),
        writingSectionIds: selections.writing.filter(id => id !== ""),
        speakingSectionIds: selections.speaking.filter(id => id !== "")
      });

      const data = res.data;
      if (data.success) {
        window.alert("Mock Test assembled successfully!");
        // Reset
        setTitle("");
        setDescription("");
        setSelections({
          reading: ["", "", ""],
          listening: ["", "", "", ""],
          writing: ["", ""],
          speaking: [""]
        });
      } else {
        window.alert(data.message || "Failed to save mock test.");
      }
    } catch (err) {
      window.alert("Server error during assembly.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-8 flex flex-col gap-6">
        <div className="bento-card">
          <h3 className="font-montserrat text-headline-md text-on-surface mb-4">Mock Test Details</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Test Title (e.g. Official Mock Test 1)"
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
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Test Description"
            className="w-full h-24 bg-surface-container border border-outline-variant/30 rounded-lg p-4 font-montserrat text-body-md focus:border-primary resize-none"
          />
        </div>

        <div className="bento-card grid grid-cols-2 gap-6">
          <div className="flex flex-col gap-3">
            <h4 className="font-montserrat text-label-lg font-bold text-on-surface flex items-center gap-2">
              <Icon name="menu_book" size={20} className="text-primary" /> Reading Passages
            </h4>
            {[0, 1, 2].map((i) => (
              <select
                key={`r-${i}`}
                value={selections.reading[i]}
                onChange={(e) => handleSelect('reading', i, e.target.value)}
                className="bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 font-montserrat text-body-md focus:border-primary"
              >
                <option value="">Select Passage {i + 1}</option>
                {readingBlocks.map(b => (
                  <option key={b.id} value={b.id}>{b.title}</option>
                ))}
              </select>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="font-montserrat text-label-lg font-bold text-on-surface flex items-center gap-2">
              <Icon name="headset" size={20} className="text-primary" /> Listening Parts
            </h4>
            {[0, 1, 2, 3].map((i) => (
              <select
                key={`l-${i}`}
                value={selections.listening[i]}
                onChange={(e) => handleSelect('listening', i, e.target.value)}
                className="bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 font-montserrat text-body-md focus:border-primary"
              >
                <option value="">Select Part {i + 1}</option>
                {listeningBlocks.map(b => (
                  <option key={b.id} value={b.id}>{b.title}</option>
                ))}
              </select>
            ))}
          </div>
          
          <div className="flex flex-col gap-3 mt-2">
            <h4 className="font-montserrat text-label-lg font-bold text-on-surface flex items-center gap-2">
              <Icon name="edit_note" size={20} className="text-primary" /> Writing Tasks
            </h4>
            <select
              value={selections.writing[0]}
              onChange={(e) => handleSelect('writing', 0, e.target.value)}
              className="bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 font-montserrat text-body-md focus:border-primary"
            >
              <option value="">Select Task 1</option>
              {writingQuestions.filter(q => q.type === 'task1').map(q => (
                <option key={q.id} value={q.id}>Task 1: {q.difficulty}</option>
              ))}
            </select>
            <select
              value={selections.writing[1]}
              onChange={(e) => handleSelect('writing', 1, e.target.value)}
              className="bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 font-montserrat text-body-md focus:border-primary"
            >
              <option value="">Select Task 2</option>
              {writingQuestions.filter(q => q.type === 'task2').map(q => (
                <option key={q.id} value={q.id}>Task 2: {q.difficulty}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-3 mt-2">
            <h4 className="font-montserrat text-label-lg font-bold text-on-surface flex items-center gap-2">
              <Icon name="mic" size={20} className="text-primary" /> Speaking Set
            </h4>
            <select
              value={selections.speaking[0]}
              onChange={(e) => handleSelect('speaking', 0, e.target.value)}
              className="bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 font-montserrat text-body-md focus:border-primary"
            >
              <option value="">Select Speaking Set</option>
              {speakingQuestions.map(q => (
                <option key={q.id} value={q.id}>Speaking Set: {q.difficulty}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="lg:col-span-4 flex flex-col gap-4">
        <div className="bento-card sticky top-24">
          <h3 className="font-montserrat text-headline-md text-on-surface mb-6">Validation Summary</h3>
          
          <div className="flex flex-col gap-4">
            <div className={`p-4 rounded-xl border ${validation.readingCount === 40 ? 'bg-green-50 border-green-200' : 'bg-error-container/20 border-error/30'}`}>
              <div className="flex justify-between items-center">
                <span className="font-montserrat text-body-md font-medium text-on-surface">Reading Questions</span>
                <span className={`font-montserrat font-bold text-label-lg ${validation.readingCount === 40 ? 'text-green-700' : 'text-error'}`}>
                  {validation.readingCount} / 40
                </span>
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${validation.listeningCount === 40 ? 'bg-green-50 border-green-200' : 'bg-error-container/20 border-error/30'}`}>
              <div className="flex justify-between items-center">
                <span className="font-montserrat text-body-md font-medium text-on-surface">Listening Questions</span>
                <span className={`font-montserrat font-bold text-label-lg ${validation.listeningCount === 40 ? 'text-green-700' : 'text-error'}`}>
                  {validation.listeningCount} / 40
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-outline-variant/20">
              <button
                onClick={handleSave}
                disabled={loading || validation.readingCount !== 40 || validation.listeningCount !== 40}
                className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-xl font-montserrat text-label-lg font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Icon name="build" size={20} />}
                {loading ? "Assembling..." : "Assemble Mock Test"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
