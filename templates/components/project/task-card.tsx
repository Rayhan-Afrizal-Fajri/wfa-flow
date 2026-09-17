import { forwardRef, type CSSProperties, type HTMLAttributes } from "react"
import { GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar } from "@/components/ui/avatar"
import { PriorityBadge, TypeBadge } from "@/components/domain/badges"
import { dueMeta } from "@/lib/domain"
import type { Task, User } from "@/types"

interface TaskCardProps extends HTMLAttributes<HTMLDivElement> {
  task: Task
  assignee?: User
  dragging?: boolean
  overlay?: boolean
  handleProps?: HTMLAttributes<HTMLButtonElement>
  style?: CSSProperties
}

export const TaskCard = forwardRef<HTMLDivElement, TaskCardProps>(function TaskCard(
  { task, assignee, dragging, overlay, handleProps, className, style, ...rest },
  ref,
) {
  const due = dueMeta(task.due_date, task.status === "done")
  const dueTone =
    due.tone === "danger"
      ? "text-danger"
      : due.tone === "warning"
        ? "text-warning"
        : "text-muted-foreground"

  return (
    <div
      ref={ref}
      style={style}
      className={cn(
        "group relative rounded-lg border border-border bg-card p-3 shadow-sm transition-shadow",
        overlay ? "cursor-grabbing shadow-lg ring-1 ring-primary/30" : "hover:shadow-md",
        dragging && "opacity-40",
        className,
      )}
      {...rest}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          aria-label="Drag task"
          className="mt-0.5 -ml-1 cursor-grab touch-none rounded p-0.5 text-muted-foreground/50 opacity-0 transition-opacity hover:text-muted-foreground group-hover:opacity-100 active:cursor-grabbing"
          {...handleProps}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <p className="flex-1 text-sm font-medium leading-snug text-pretty">{task.title}</p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 pl-4">
        <PriorityBadge priority={task.priority} />
        <TypeBadge type={task.type} />
      </div>

      <div className="mt-3 flex items-center justify-between pl-4">
        <span className={cn("text-xs font-medium", dueTone)}>{due.label}</span>
        {assignee ? <Avatar name={assignee.name} size="sm" /> : null}
      </div>
    </div>
  )
})
