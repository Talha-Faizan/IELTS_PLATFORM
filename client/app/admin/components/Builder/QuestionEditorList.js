"use client";
import React from "react";
import Icon from "@/components/ui/Icon";

export default function QuestionEditorList({ questions, setQuestions }) {
  const addQuestion = () => {
    const newQ = {
      questionNumber: questions.length + 1,
      questionText: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      explanation: ""
    };
    setQuestions([...questions, newQ]);
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const updateOption = (qIndex, oIndex, value) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
  };

  const removeQuestion = (index) => {
    const updated = questions.filter((_, i) => i !== index);
    // Re-number
    updated.forEach((q, i) => q.questionNumber = i + 1);
    setQuestions(updated);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h4 className="font-montserrat text-label-lg font-semibold text-on-surface">Questions ({questions.length})</h4>
        <button
          type="button"
          onClick={addQuestion}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-container text-on-primary rounded-lg font-montserrat text-label-sm hover:opacity-90"
        >
          <Icon name="add" size={16} />
          Add Question
        </button>
      </div>

      <div className="flex flex-col gap-4 overflow-y-auto max-h-[600px] pr-2">
        {questions.length === 0 ? (
          <div className="text-center py-8 bg-surface-container-low rounded-xl border border-dashed border-outline-variant/50">
            <p className="font-montserrat text-body-md text-on-surface-variant">No questions added yet.</p>
          </div>
        ) : (
          questions.map((q, qIndex) => (
            <div key={qIndex} className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-montserrat text-label-sm font-bold">
                    {q.questionNumber}
                  </span>
                  <input
                    type="text"
                    value={q.questionText}
                    onChange={(e) => updateQuestion(qIndex, 'questionText', e.target.value)}
                    placeholder="Question Text"
                    className="bg-transparent border-b border-outline-variant/40 px-1 py-1 font-montserrat text-body-md focus:outline-none focus:border-primary flex-1 min-w-[200px]"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeQuestion(qIndex)}
                  className="text-error/70 hover:text-error p-1"
                >
                  <Icon name="delete" size={18} />
                </button>
              </div>

              <div className="pl-8 grid grid-cols-2 gap-2">
                {q.options.map((opt, oIndex) => (
                  <div key={oIndex} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${qIndex}`}
                      checked={Number(q.correctAnswer) === oIndex}
                      onChange={() => updateQuestion(qIndex, 'correctAnswer', oIndex)}
                      className="text-primary focus:ring-primary h-4 w-4"
                    />
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                      className="bg-surface-container border border-outline-variant/30 rounded px-2 py-1 flex-1 font-montserrat text-label-sm focus:outline-none focus:border-primary"
                    />
                  </div>
                ))}
              </div>

              <div className="pl-8">
                <input
                  type="text"
                  value={q.explanation || ''}
                  onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                  placeholder="Explanation (Optional)"
                  className="w-full bg-surface-container border border-outline-variant/30 rounded px-3 py-1.5 font-montserrat text-label-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
