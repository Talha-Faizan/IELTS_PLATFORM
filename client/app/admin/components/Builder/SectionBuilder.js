"use client";
import React, { useState } from "react";
import Icon from "@/components/ui/Icon";
import ReadingBuilder from "./ReadingBuilder";
import ListeningBuilder from "./ListeningBuilder";
import WritingBuilder from "./WritingBuilder";
import SpeakingBuilder from "./SpeakingBuilder";

export default function SectionBuilder() {
  const [activeTab, setActiveTab] = useState("reading");

  const tabs = [
    { id: "reading", label: "Reading", icon: "menu_book" },
    { id: "listening", label: "Listening", icon: "headset" },
    { id: "writing", label: "Writing", icon: "edit_note" },
    { id: "speaking", label: "Speaking", icon: "mic" },
  ];

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
        <h2 className="font-montserrat text-headline-md text-on-surface">Content Builder</h2>
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-montserrat text-label-lg transition-colors ${
                activeTab === tab.id
                  ? "bg-primary-container text-on-primary font-semibold"
                  : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant"
              }`}
            >
              <Icon name={tab.icon} size={18} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1">
        {activeTab === "reading" && <ReadingBuilder />}
        {activeTab === "listening" && <ListeningBuilder />}
        {activeTab === "writing" && <WritingBuilder />}
        {activeTab === "speaking" && <SpeakingBuilder />}
      </div>
    </div>
  );
}
