"use client";

import Icon from "@/components/ui/Icon";
import Link from "next/link";

export default function StudyCalendar({ studyPlan }) {
  if (!studyPlan || studyPlan.length === 0) return null;

  const todayPlan = studyPlan[0];

  return (
    <div className="bento-card bg-primary-container text-on-primary border-primary-container">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-montserrat text-headline-md text-on-primary flex items-center gap-2">
          <Icon name="event" size={24} />
          Today's Study Plan
        </h3>
        <span className="font-montserrat text-label-sm text-on-primary/80 uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full border border-white/10">
          Day {todayPlan.dayNumber}
        </span>
      </div>
      <p className="font-montserrat text-body-md text-on-primary/90 mb-5">
        Here are your recommended tasks for today leading up to your exam.
      </p>

      <div className="flex flex-col gap-3">
        {todayPlan.tasks.map((task, index) => (
          <Link
            key={index}
            href={task.link}
            className="flex items-center justify-between bg-white/10 hover:bg-white/20 transition-colors p-4 rounded-xl border border-white/20 group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shadow-inner shadow-white/10">
                <Icon
                  name={
                    task.section === "reading" ? "menu_book" :
                    task.section === "listening" ? "headphones" :
                    task.section === "writing" ? "edit" :
                    task.section === "speaking" ? "mic" : "assignment"
                  }
                  size={20}
                  className="text-white"
                />
              </div>
              <div>
                <p className="font-montserrat font-bold text-label-lg text-white group-hover:text-white/90">{task.title}</p>
                <p className="font-montserrat text-label-sm text-white/70">{task.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-montserrat text-label-sm text-white/80 hidden sm:inline-block border border-white/20 px-2 py-0.5 rounded text-xs bg-black/10">
                ~{task.duration} min
              </span>
              <div className="w-8 h-8 rounded-full bg-white text-primary flex items-center justify-center shadow-md transform group-hover:scale-105 transition-transform">
                <Icon name="play_arrow" size={16} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
