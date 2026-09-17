import { useMemo } from "react"
import { Building2, ArrowRight, CalendarDays } from "lucide-react"
import { Head, Link, usePage } from "@/lib/inertia"
import { AppLayout } from "@/components/layout/app-layout"
import { CreateProjectDialog } from "@/components/project/create-project-dialog"
import { Progress } from "@/components/ui/progress"
import { Avatar } from "@/components/ui/avatar"
import {
  projectCategoryMeta,
  projectStatusMeta,
  formatDate,
  daysUntil,
} from "@/lib/domain"
import { cn } from "@/lib/utils"

export function ProjectsIndex() {
  const { props } = usePage()

  const cards = useMemo(
    () =>
      props.projects.map((project) => {
        const tasks = props.tasks.filter((t) => t.project_id === project.id)
        const done = tasks.filter((t) => t.status === "done").length
        const assignees = Array.from(new Set(tasks.map((t) => t.assignee_id)))
          .map((id) => props.users.find((u) => u.id === id))
          .filter(Boolean)
        return {
          project,
          total: tasks.length,
          done,
          pct: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
          assignees,
        }
      }),
    [props.projects, props.tasks, props.users],
  )

  return (
    <AppLayout title="Projects">
      <Head title="Projects" />
      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">All projects</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {props.projects.length} projects across the agency
            </p>
          </div>
          <CreateProjectDialog />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map(({ project, total, done, pct, assignees }) => {
            const status = projectStatusMeta[project.status]
            const deadlineIn = daysUntil(project.deadline)
            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group flex flex-col rounded-xl border border-border bg-card p-5 transition-all hover:border-muted-foreground/30 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      {projectCategoryMeta[project.category].label}
                    </p>
                    <h3 className="mt-1 truncate text-base font-semibold">{project.name}</h3>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-md border px-2 py-0.5 text-xs font-medium",
                      status.badge,
                    )}
                  >
                    {status.label}
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" />
                  {project.client_name}
                </div>

                <div className="mt-5">
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="font-medium text-muted-foreground">
                      {done}/{total} tasks
                    </span>
                    <span className="font-semibold tabular-nums">{pct}%</span>
                  </div>
                  <Progress value={pct} />
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {assignees.map((u) => (
                        <Avatar key={u!.id} name={u!.name} size="sm" />
                      ))}
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {deadlineIn < 0 ? `${Math.abs(deadlineIn)}d overdue` : `Due ${formatDate(project.deadline)}`}
                    </span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </AppLayout>
  )
}
