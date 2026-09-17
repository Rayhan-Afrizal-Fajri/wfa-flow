import { useMemo, useState } from "react"
import { Head, usePage } from "@/lib/inertia"
import { AppLayout } from "@/components/layout/app-layout"
import { TaskTable } from "@/components/project/task-table"
import { Segmented } from "@/components/ui/segmented"
import { Avatar } from "@/components/ui/avatar"

export function TasksIndex() {
  const { props } = usePage()
  const { users, tasks } = props
  const [assignee, setAssignee] = useState<string>(users[0].id)

  const filtered = useMemo(
    () => tasks.filter((t) => t.assignee_id === assignee),
    [tasks, assignee],
  )

  const options = users.map((u) => ({ value: u.id, label: u.name.split(" ")[0] }))
  const active = users.find((u) => u.id === assignee)!
  const open = filtered.filter((t) => t.status !== "done").length

  return (
    <AppLayout title="My Tasks">
      <Head title="My Tasks" />
      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar name={active.name} size="lg" />
            <div>
              <h2 className="text-xl font-semibold tracking-tight">{active.name}</h2>
              <p className="text-sm capitalize text-muted-foreground">
                {active.role} · {open} open tasks
              </p>
            </div>
          </div>
          <Segmented aria-label="Filter by teammate" value={assignee} onChange={setAssignee} options={options} />
        </div>

        <TaskTable tasks={filtered} users={users} />
      </div>
    </AppLayout>
  )
}
