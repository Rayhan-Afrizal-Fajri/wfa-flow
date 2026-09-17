import { TODAY } from "@/data/mock"
import type {
  ProjectCategory,
  ProjectStatus,
  TaskPriority,
  TaskStatus,
  TaskType,
} from "@/types"

export const STATUS_ORDER: TaskStatus[] = ["todo", "in_progress", "review", "done"]

export const statusMeta: Record<
  TaskStatus,
  { label: string; dot: string; badge: string }
> = {
  todo: {
    label: "To Do",
    dot: "bg-muted-foreground",
    badge: "bg-muted text-muted-foreground border-transparent",
  },
  in_progress: {
    label: "In Progress",
    dot: "bg-info",
    badge: "bg-info/10 text-info border-transparent",
  },
  review: {
    label: "Review",
    dot: "bg-warning",
    badge: "bg-warning/15 text-[oklch(0.48_0.12_70)] border-transparent",
  },
  done: {
    label: "Done",
    dot: "bg-success",
    badge: "bg-success/10 text-success border-transparent",
  },
}

export const PRIORITY_ORDER: TaskPriority[] = ["low", "medium", "high", "urgent"]
export const priorityRank: Record<TaskPriority, number> = {
  low: 0,
  medium: 1,
  high: 2,
  urgent: 3,
}

export const priorityMeta: Record<
  TaskPriority,
  { label: string; badge: string; bar: string }
> = {
  low: { label: "Low", badge: "bg-muted text-muted-foreground border-transparent", bar: "bg-muted-foreground/40" },
  medium: { label: "Medium", badge: "bg-info/10 text-info border-transparent", bar: "bg-info" },
  high: { label: "High", badge: "bg-warning/15 text-[oklch(0.48_0.12_70)] border-transparent", bar: "bg-warning" },
  urgent: { label: "Urgent", badge: "bg-danger/10 text-danger border-transparent", bar: "bg-danger" },
}

export const typeMeta: Record<TaskType, { label: string }> = {
  feature: { label: "Feature" },
  setup: { label: "Setup" },
  revision: { label: "Revision" },
}

export const projectCategoryMeta: Record<ProjectCategory, { label: string }> = {
  web_app: { label: "Web App" },
  ads_opt: { label: "Ads Optimization" },
}

export const projectStatusMeta: Record<ProjectStatus, { label: string; badge: string }> = {
  planning: { label: "Planning", badge: "bg-info/10 text-info border-transparent" },
  active: { label: "Active", badge: "bg-success/10 text-success border-transparent" },
  on_hold: { label: "On Hold", badge: "bg-warning/15 text-[oklch(0.48_0.12_70)] border-transparent" },
  completed: { label: "Completed", badge: "bg-muted text-muted-foreground border-transparent" },
}

export function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

export function formatFullDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

/** Days from TODAY to the given date (negative = overdue). */
export function daysUntil(iso: string) {
  const target = new Date(iso + "T00:00:00")
  return Math.round((target.getTime() - TODAY.getTime()) / 86_400_000)
}

export function dueMeta(iso: string, done: boolean) {
  const diff = daysUntil(iso)
  if (done) return { tone: "muted" as const, label: formatDate(iso) }
  if (diff < 0) return { tone: "danger" as const, label: `${Math.abs(diff)}d overdue` }
  if (diff === 0) return { tone: "warning" as const, label: "Due today" }
  if (diff <= 3) return { tone: "warning" as const, label: `${formatDate(iso)}` }
  return { tone: "muted" as const, label: formatDate(iso) }
}
