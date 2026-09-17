import { useMemo } from "react"
import { FolderKanban, CheckCircle2, Clock, AlertTriangle, ArrowRight } from "lucide-react"
import { Head, Link, usePage } from "@/lib/inertia"
import { AppLayout } from "@/components/layout/app-layout"
import { CreateProjectDialog } from "@/components/project/create-project-dialog"
import { Avatar } from "@/components/ui/avatar"
import { PriorityBadge } from "@/components/domain/badges"
import { Progress } from "@/components/ui/progress"
import { daysUntil, dueMeta, priorityRank } from "@/lib/domain"
import { cn } from "@/lib/utils"

export function Dashboard() {
  const { props } = usePage()
  const { projects, tasks, users } = props

  const stats = useMemo(() => {
    const active = projects.filter((p) => p.status === "active").length
    const done = tasks.filter((t) => t.status === "done").length
    const inProgress = tasks.filter((t) => t.status === "in_progress").length
    const overdue = tasks.filter((t) => t.status !== "done" && daysUntil(t.due_date) < 0).length
    return { active, done, inProgress, overdue }
  }, [projects, tasks])

  const upcoming = useMemo(
    () =>
      [...tasks]
        .filter((t) => t.status !== "done")
        .sort(
          (a, b) =>
            daysUntil(a.due_date) - daysUntil(b.due_date) ||
            priorityRank[b.priority] - priorityRank[a.priority],
        )
        .slice(0, 6),
    [tasks],
  )

  const statCards = [
    { label: "Active projects", value: stats.active, icon: FolderKanban, tone: "text-primary" },
    { label: "In progress", value: stats.inProgress, icon: Clock, tone: "text-info" },
    { label: "Completed tasks", value: stats.done, icon: CheckCircle2, tone: "text-success" },
    { label: "Overdue", value: stats.overdue, icon: AlertTriangle, tone: "text-danger" },
  ]

  return (
    <AppLayout title="Dashboard">
      <Head title="Dashboard" />
      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Good morning, {users[0].name.split(" ")[0]}</h2>
            <p className="mt-1 text-sm text-muted-foreground">Here&apos;s what&apos;s happening across your projects.</p>
          </div>
          <CreateProjectDialog />
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statCards.map((s) => {
            const Icon = s.icon
            return (
              <div key={s.label} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{s.label}</span>
                  <Icon className={cn("h-4 w-4", s.tone)} />
                </div>
                <p className="mt-2 text-3xl font-semibold tabular-nums">{s.value}</p>
              </div>
            )
          })}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-5">
          {/* Active projects */}
          <div className="lg:col-span-3">
            <h3 className="mb-3 text-sm font-semibold">Active projects</h3>
            <div className="space-y-3">
              {projects
                .filter((p) => p.status === "active" || p.status === "planning")
                .map((project) => {
                  const pt = tasks.filter((t) => t.project_id === project.id)
                  const done = pt.filter((t) => t.status === "done").length
                  const pct = pt.length ? Math.round((done / pt.length) * 100) : 0
                  return (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-muted-foreground/30"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate font-medium">{project.name}</p>
                          <span className="shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">
                            {pct}%
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{project.client_name}</p>
                        <Progress value={pct} className="mt-2.5" />
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </Link>
                  )
                })}
            </div>
          </div>

          {/* Upcoming deadlines */}
          <div className="lg:col-span-2">
            <h3 className="mb-3 text-sm font-semibold">Upcoming deadlines</h3>
            <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
              {upcoming.map((task) => {
                const user = users.find((u) => u.id === task.assignee_id)
                const due = dueMeta(task.due_date, false)
                const tone =
                  due.tone === "danger" ? "text-danger" : due.tone === "warning" ? "text-warning" : "text-muted-foreground"
                return (
                  <div key={task.id} className="flex items-center gap-3 p-3">
                    {user && <Avatar name={user.name} size="sm" />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{task.title}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <PriorityBadge priority={task.priority} />
                        <span className={cn("text-xs font-medium", tone)}>{due.label}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
