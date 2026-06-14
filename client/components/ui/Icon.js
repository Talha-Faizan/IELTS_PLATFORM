"use client";

import React from 'react';
import {
  Book,
  FileText,
  Headphones,
  Mic,
  Play,
  ArrowRight,
  Brain,
  TrendingUp,
  Clock,
  Lightbulb,
  CheckCircle,
  Lock,
  Edit,
  Star,
  BarChart3,
  Eye,
  EyeOff,
  Menu,
  X,
  ChevronDown,
  Search,
  Home,
  BarChart2,
  Settings,
  LogOut,
  User,
  Bell,
  MessageSquare,
  Share2,
  Download,
  Upload,
  UploadCloud,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  Plus,
  PlusCircle,
  Minus,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  Info,
  AlertCircle,
  CheckSquare,
  Square,
  ZoomIn,
  Volume2,
  Pause,
  Send,
  ArrowLeft,
  Calendar,
  Zap,
  Target,
  Flame,
  Bold,
  Italic,
  RotateCcw,
  Users,
  StopCircle,
  Award,
  LayoutDashboard,
  ClipboardList,
  UserCircle,
  MoreVertical,
  Save,
  FileAudio,
  Image as ImageIcon,
  GraduationCap,
  SlidersHorizontal,
  PenSquare,
  List,
  Link as LinkIcon,
  Type,
  Inbox,
  Hash,
  ShieldCheck,
} from 'lucide-react';

/**
 * Icon Component - Lucide React wrapper
 * Provides consistent sizing, accessibility, and styling for Lucide icons
 * 
 * @component
 * @param {string} name - Lucide icon name (e.g., "book", "edit", "mic")
 * @param {number} [size=24] - Icon size in pixels
 * @param {string} [className=""] - Additional Tailwind classes
 * @param {string} [ariaLabel=""] - Accessibility label for interactive icons
 * @param {function} [onClick=null] - Click handler (converts to button if provided)
 * @param {number} [strokeWidth=2] - Icon stroke width
 * 
 * @example
 * // Standalone icon
 * <Icon name="book" size={24} />
 * 
 * // Interactive icon button
 * <Icon name="bell" size={20} ariaLabel="Notifications" onClick={handleClick} />
 * 
 * // Custom styling
 * <Icon name="star" size={20} className="text-yellow-500" />
 */

// Map of icon names to Lucide components
const iconMap = {
  // Practice & Learning
  menu_book: Book,
  book: Book,
  edit_note: FileText,
  file_text: FileText,
  note: FileText,
  headset: Headphones,
  headphones: Headphones,
  mic: Mic,
  microphone: Mic,
  play_arrow: Play,
  play: Play,
  arrow_forward: ArrowRight,
  arrow_right: ArrowRight,
  
  // Features & Stats
  psychology: Brain,
  brain: Brain,
  timeline: TrendingUp,
  trending_up: TrendingUp,
  timer: Clock,
  clock: Clock,
  insights: Lightbulb,
  lightbulb: Lightbulb,
  eye: Eye,
  
  // Status & Actions
  assignment: FileText,
  check_circle: CheckCircle,
  check_circle_filled: CheckCircle,
  pending: Clock,
  lock: Lock,
  edit: Edit,
  star: Star,
  
  // Navigation
  menu: Menu,
  close: X,
  x: X,
  chevron_down: ChevronDown,
  chevron_right: ChevronRight,
  chevron_left: ChevronLeft,
  search: Search,
  home: Home,
  external_link: ExternalLink,
  
  // Dashboard
  bar_chart: BarChart2,
  bar_chart_3: BarChart3,
  settings: Settings,
  logout: LogOut,
  user: User,
  bell: Bell,
  message: MessageSquare,
  share: Share2,
  download: Download,
  upload: Upload,
  delete: Trash2,
  trash: Trash2,
  copy: Copy,
  check: Check,
  alert: AlertTriangle,
  info: Info,
  alert_circle: AlertCircle,
  
  // Additional
  plus: Plus,
  minus: Minus,
  check_square: CheckSquare,
  square: Square,
  circle: CheckCircle, // gray circle for unchecked
  zoom_in: ZoomIn,
  volume: Volume2,
  volume_up: Volume2,
  pause: Pause,
  send: Send,
  arrow_back: ArrowLeft,
  visibility: Eye,
  visibility_off: EyeOff,
  calendar_today: Calendar,
  trending_up: TrendingUp,
  trending_down: TrendingUp, // Using up for both (no down in lucide for simple use)
  priority_high: AlertTriangle,
  event: Calendar,
  format_bold: Bold,
  format_italic: Italic,
  undo: RotateCcw,
  auto_awesome: Zap,
  local_fire_department: Flame,
  flame: Flame,
  workspace_premium: Star,
  description: FileText,
  warning: AlertTriangle,
  school: Brain,
  record_voice_over: Mic,
  person: User,
  videocam: Mic,
  add: Plus,
  stop: StopCircle,
  group: Users,
  grade: Award,
  assignment_turned_in: CheckSquare,

  // ─── Admin panel additions ──────────────────────────────────
  dashboard: LayoutDashboard,
  rate_review: ClipboardList,
  notifications: Bell,
  account_circle: UserCircle,
  more_vert: MoreVertical,
  save: Save,
  audio_file: FileAudio,
  cloud_upload: UploadCloud,
  upload_file: Upload,
  image: ImageIcon,
  history_edu: GraduationCap,
  tune: SlidersHorizontal,
  edit_note: PenSquare,
  format_list_bulleted: List,
  link: LinkIcon,
  text_fields: Type,
  add_circle: PlusCircle,
  publish: Eye,
  unpublished: EyeOff,
  error: AlertCircle,
  inbox: Inbox,
  pending_actions: Clock,
  verified: ShieldCheck,
  looks_one: Hash,
  looks_two: Hash,
  looks_3: Hash,
  trash2: Trash2,
  thumbs_up: CheckCircle,
  help: Info,
  people: Users,
  star_filled: Star,
  clipboardList: ClipboardList,
  article: FileText,
};

export default function Icon({
  name,
  size = 24,
  className = "",
  ariaLabel = "",
  onClick = null,
  strokeWidth = 2,
}) {
  const IconComponent = iconMap[name];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in icon map. Available icons:`, Object.keys(iconMap));
    return null;
  }

  const iconProps = {
    size,
    strokeWidth,
    className: `inline-block ${className}`,
  };

  // If it's interactive (has onClick), render as button
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className={`cursor-pointer hover:opacity-70 transition-opacity p-1 rounded hover:bg-surface-container/50 ${className}`}
      >
        <IconComponent {...iconProps} />
      </button>
    );
  }

  // Otherwise render as a span wrapper
  return <IconComponent {...iconProps} />;
}
