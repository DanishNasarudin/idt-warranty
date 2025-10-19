import { CaseStatus } from "@/lib/generated/prisma";

/**
 * Color mapping for IDT PC field
 */
export const getIdtPcColor = (value: boolean | null) => {
  if (value === null) return "secondary";
  return value ? "default" : "secondary";
};

export const getIdtPcClassName = (value: boolean | null) => {
  if (value === null) {
    return "bg-secondary/50 text-secondary-foreground/70 border-secondary/20";
  }
  if (value === true) {
    return "bg-primary text-white border-primary/20 hover:bg-primary/90";
  }
  // value === false
  return "bg-gray-500/10 text-gray-700 dark:text-gray-300 border-gray-500/20 hover:bg-gray-500/20";
};

/**
 * Color mapping for Case Status - transitions from red to green
 * IN_QUEUE (red) -> IN_PROGRESS (orange) -> WAITING_FOR (yellow) -> COMPLETED (green)
 */
export const getStatusColor = (status: CaseStatus) => {
  switch (status) {
    case CaseStatus.IN_QUEUE:
      return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20 hover:bg-red-500/20";
    case CaseStatus.IN_PROGRESS:
      return "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20 hover:bg-orange-500/20";
    case CaseStatus.WAITING_FOR:
      return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20";
    case CaseStatus.COMPLETED:
      return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 hover:bg-green-500/20";
    default:
      return "bg-secondary text-secondary-foreground border-secondary/20";
  }
};

export const getStatusLabel = (status: CaseStatus) => {
  switch (status) {
    case CaseStatus.IN_QUEUE:
      return "In Queue";
    case CaseStatus.IN_PROGRESS:
      return "In Progress";
    case CaseStatus.WAITING_FOR:
      return "Waiting For";
    case CaseStatus.COMPLETED:
      return "Completed";
    default:
      return status;
  }
};

/**
 * Staff badge color mapping
 * Uses Tailwind color classes with consistent opacity and contrast
 */
const staffColorClassMap: Record<string, string> = {
  slate:
    "bg-slate-100 dark:bg-slate-900/30 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700",
  gray: "bg-gray-100 dark:bg-gray-900/30 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700",
  zinc: "bg-zinc-100 dark:bg-zinc-900/30 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700",
  red: "bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-100 border-red-300 dark:border-red-700",
  orange:
    "bg-orange-100 dark:bg-orange-900/30 text-orange-900 dark:text-orange-100 border-orange-300 dark:border-orange-700",
  amber:
    "bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100 border-amber-300 dark:border-amber-700",
  yellow:
    "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-100 border-yellow-300 dark:border-yellow-700",
  lime: "bg-lime-100 dark:bg-lime-900/30 text-lime-900 dark:text-lime-100 border-lime-300 dark:border-lime-700",
  green:
    "bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100 border-green-300 dark:border-green-700",
  emerald:
    "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-100 border-emerald-300 dark:border-emerald-700",
  teal: "bg-teal-100 dark:bg-teal-900/30 text-teal-900 dark:text-teal-100 border-teal-300 dark:border-teal-700",
  cyan: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-900 dark:text-cyan-100 border-cyan-300 dark:border-cyan-700",
  sky: "bg-sky-100 dark:bg-sky-900/30 text-sky-900 dark:text-sky-100 border-sky-300 dark:border-sky-700",
  blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 border-blue-300 dark:border-blue-700",
  indigo:
    "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-100 border-indigo-300 dark:border-indigo-700",
  violet:
    "bg-violet-100 dark:bg-violet-900/30 text-violet-900 dark:text-violet-100 border-violet-300 dark:border-violet-700",
  purple:
    "bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-100 border-purple-300 dark:border-purple-700",
  fuchsia:
    "bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-900 dark:text-fuchsia-100 border-fuchsia-300 dark:border-fuchsia-700",
  pink: "bg-pink-100 dark:bg-pink-900/30 text-pink-900 dark:text-pink-100 border-pink-300 dark:border-pink-700",
  rose: "bg-rose-100 dark:bg-rose-900/30 text-rose-900 dark:text-rose-100 border-rose-300 dark:border-rose-700",
};

/**
 * Get badge className for staff based on their assigned color
 * Falls back to primary color if no color is assigned
 */
export const getStaffBadgeClassName = (color: string | null | undefined) => {
  if (color && staffColorClassMap[color]) {
    return staffColorClassMap[color];
  }
  // Default to primary color if no color assigned
  return "bg-primary text-primary-foreground border-primary/20";
};
