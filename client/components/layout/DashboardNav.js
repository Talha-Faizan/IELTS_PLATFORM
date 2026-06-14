"use client";
import { useSelector } from "react-redux";
import Icon from "@/components/ui/Icon";
import { initialsFromName } from "@/lib/dataTransforms";

export default function DashboardNav({ title = "Dashboard", breadcrumbs = [] }) {
  const { user } = useSelector((state) => state.auth);
  const { profile, progress } = useSelector((state) => state.user);
  const account = profile || user || {};
  const initials = initialsFromName(account.name || "Student");
  const totalSubmissions = progress?.totalSubmissions || 0;

  return (
    <header className="sticky top-0 z-30 h-navbar-height bg-surface/80 backdrop-blur-md border-b border-outline-variant/20 flex items-center justify-between px-8">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 font-montserrat text-label-lg">
        <span className="text-on-surface-variant">IELTS Scholar</span>
        {breadcrumbs.map((crumb) => (
          <span key={crumb} className="flex items-center gap-2 text-on-surface-variant">
            <Icon name="chevron_right" size={14} />
            {crumb}
          </span>
        ))}
        <span className="flex items-center gap-2 text-on-surface font-semibold">
          <Icon name="chevron_right" size={14} />
          {title}
        </span>
      </div>

      {/* Right side: timer + actions */}
      <div className="flex items-center gap-4">
        {/* Streak */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/20">
          <Icon name="flame" size={16} className="text-primary" />
          <span className="font-montserrat text-label-sm text-on-surface font-semibold">{totalSubmissions} sessions</span>
        </div>

        <button
          className="text-on-surface-variant cursor-pointer hover:text-primary transition-colors p-1 hover:bg-surface-container rounded"
          aria-label="Notifications"
          onClick={() => {}}
        >
          <Icon name="bell" size={20} />
        </button>
        <button
          className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center font-montserrat font-bold text-xs text-primary cursor-pointer hover:opacity-90 transition-opacity"
          aria-label="User profile menu"
          onClick={() => {}}
        >
          {initials}
        </button>
      </div>
    </header>
  );
}
