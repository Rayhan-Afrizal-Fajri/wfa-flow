import { useMemo, useState } from "react"
import { LayoutGrid, Table2, CalendarDays, Building2, ChevronLeft } from "lucide-react"
import { Head, Link, usePage } from "@/lib/inertia"
import { AppLayout } from "@/components/layout/app-layout"
import { Segmented } from "@/components/ui/segmented"
import { Progress } from "@/components/ui/progress"
import { Avatar } from "@/components/ui/avatar"
import { KanbanBoard } from "@/components/project/kanban-board"
import { TaskTable } from "@/components/project/task-table"
import { CreateProjectDialog } from "@/components/project/create-project-dialog"
import {
  formatFullDate,
  projectCategoryMeta,
  projectStatusMeta,
  daysUntil,
} from "@/lib/domain"
import { cn } from "@/lib/utils"
import type { Project } from "@/types"

type View = "board" | "table"

export function ProjectShow({ projectId }: { projectId: string }) {
  const { props } = usePage()
  const [view, setView] = useState<View>("board")

  const project = props.projects.find((p) => p.id === projectId) as Project | undefined
  const projectTasks = useMemo(
    () => props.tasks.filter((t) => t.project_id === projectId),
    [props.tasks, projectId],
  )

  if (!project) {
    return (
      <AppLayout title="Project not found">
        <div className="p-6">
          <p className="text-sm text-muted-foreground">This project no longer exists.</p>
          <Link href="/projects" className="mt-3 inline-block text-sm font-medium text-primary">
            Back to projects
          </Link>
        </div>
      </AppLayout>
    )
  }

  const done = projectTasks.filter((t) => t.status === "done").length
  const total = projectTasks.length
  const pct = total ? Math.round((done / total) * 100) : 0
  const deadlineIn = daysUntil(project.deadline)
  const statusInfo = projectStatusMeta[project.status]

  const assignees = Array.from(new Set(projectTasks.map((t) => t.assignee_id)))
    .map((id) => props.users.find((u) => u.id === id))
    .filter(Boolean)

  return (
    <AppLayout title={project.name}>
      <Head title={project.name} />

      <div className="border-b border-border bg-card/40">
        <div className="mx-auto max-w-7xl px-6 pb-5 pt-5">
          <Link
            href="/projects"
            className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            All projects
          </Link>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-2xl font-semibold tracking-tight text-balance">{project.name}</h2>
                <span
                  className={cn(
                    "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
                    statusInfo.badge,
                  )}
                >
                  {statusInfo.label}
                </span>
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="h-4 w-4" />
                  {project.client_name}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <LayoutGrid className="h-4 w-4" />
                  {projectCategoryMeta[project.category].label}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" />
                  {formatFullDate(project.start_date)} — {formatFullDate(project.deadline)}
                </span>
              </div>
            </div>

            {/* Progress card */}
            <div className="w-full shrink-0 rounded-xl border border-border bg-card p-4 lg:w-80">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Progress</p>
                  <p className="mt-0.5 text-2xl font-semibold tabular-nums">{pct}%</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {done} of {total} tasks
                  </p>
                  <p
                    className={cn(
                      "mt-0.5 text-xs font-medium",
                      deadlineIn < 0 ? "text-danger" : deadlineIn <= 7 ? "text-warning" : "text-muted-foreground",
                    )}
                  >
                    {deadlineIn < 0
                      ? `${Math.abs(deadlineIn)}d overdue`
                      : `${deadlineIn}d to deadline`}
                  </p>
                </div>
              </div>
              <Progress value={pct} className="mt-3" />
              <div className="mt-3 flex items-center justify-between">
                <div className="flex -space-x-2">
                  {assignees.map((u) => (
                    <Avatar key={u!.id} name={u!.name} size="sm" />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">{assignees.length} members</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mx-auto max-w-7xl px-6 py-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <Segmented<View>
            aria-label="Task view"
            value={view}
            onChange={setView}
            options={[
              { value: "board", label: "Board", icon: <LayoutGrid /> },
              { value: "table", label: "Table", icon: <Table2 /> },
            ]}
          />
          <CreateProjectDialog />
        </div>

        {view === "board" ? (
          <KanbanBoard tasks={projectTasks} users={props.users} />
        ) : (
          <TaskTable tasks={projectTasks} users={props.users} />
        )}
      </div>
    </AppLayout>
  )
}
