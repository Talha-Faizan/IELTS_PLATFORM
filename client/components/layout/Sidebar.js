"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import Icon from "@/components/ui/Icon";
import { logoutUser } from "@/lib/slices/authSlice";
import { getTargetBand, initialsFromName } from "@/lib/dataTransforms";

const NAV_ITEMS = [
  { label: "Dashboard", icon: "home", href: "/dashboard", filled: true },
  { label: "Practice Hub", icon: "book", href: "/practice" },
  { label: "Reading", icon: "menu_book", href: "/practice/reading" },
  { label: "Writing", icon: "edit_note", href: "/practice/writing" },
  { label: "Listening", icon: "headset", href: "/practice/listening" },
  { label: "Speaking", icon: "mic", href: "/practice/speaking" },
  { label: "Mock Tests", icon: "assignment", href: "/mock-tests" },
  { label: "Analytics", icon: "bar_chart", href: "/analytics" },
  { label: "Plans", icon: "star", href: "/pricing" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { profile } = useSelector((state) => state.user);
  const account = profile || user || {};
  const name = account.name || "Student";
  const initials = initialsFromName(name);
  const targetBand = getTargetBand(profile, user);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    router.push("/login");
  };

  return (
    <nav className="hidden md:flex flex-col p-6 gap-1 h-full border-r border-outline-variant/20 fixed left-0 top-0 w-sidebar-width bg-surface-container-low z-40 overflow-y-auto">
      <div className="mb-6">
        <Link href="/"><h1 className="font-montserrat text-headline-md font-bold text-on-surface tracking-tight">IELTS Scholar</h1></Link>
        <p className="font-montserrat text-label-sm text-on-surface-variant mt-1">Academic Preparation</p>
      </div>
      <Link href="/practice" className="w-full bg-primary-container text-on-primary font-montserrat text-label-lg py-3 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity mb-4">
        <Icon name="play_arrow" size={18} />
        Start Practice
      </Link>
      <div className="flex flex-col gap-0.5 flex-grow">
        {NAV_ITEMS.map(({ label, icon, href }) => {
          const isActive = pathname === href;
          return (
            <Link key={label} href={href} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-montserrat text-label-lg transition-all duration-200 ${isActive ? "bg-primary-container text-on-primary-container font-semibold" : "text-on-surface-variant hover:bg-surface-variant/50 hover:text-primary"}`}>
              <Icon name={icon} size={20} className={isActive ? "text-on-primary-container" : "text-on-surface-variant"} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
      <div className="border-t border-outline-variant/20 pt-3 mt-3">
        <Link href="/admin" className="flex items-center gap-3 px-4 py-2.5 rounded-xl font-montserrat text-label-lg text-on-surface-variant hover:bg-surface-variant/50 hover:text-primary transition-all">
          <Icon name="settings" size={20} />
          Admin Portal
        </Link>
      </div>
      <div className="border-t border-outline-variant/20 pt-4 mt-2">
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-primary font-bold text-sm font-montserrat flex-shrink-0">{initials}</div>
          <div className="flex-1 min-w-0">
            <p className="font-montserrat text-label-lg text-on-surface truncate">{name}</p>
            <p className="font-montserrat text-label-sm text-on-surface-variant truncate">Target: Band {targetBand.toFixed(1)}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="text-on-surface-variant hover:text-primary transition-colors"
            aria-label="Log out"
          >
            <Icon name="logout" size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
}
