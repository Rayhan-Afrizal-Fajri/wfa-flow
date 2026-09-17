import { useMemo, useState } from "react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useDroppable } from "@dnd-kit/core"
import { router } from "@/lib/inertia"
import { STATUS_ORDER, statusMeta } from "@/lib/domain"
import { cn } from "@/lib/utils"
import type { Task, TaskStatus, User } from "@/types"
import { TaskCard } from "./task-card"

interface KanbanBoardProps {
  tasks: Task[]
  users: User[]
}

/* ----------------------------- sortable card ----------------------------- */

function SortableTaskCard({ task, assignee }: { task: Task; assignee?: User }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "task", status: task.status },
  })

  return (
    <TaskCard
      ref={setNodeRef}
      task={task}
      assignee={assignee}
      dragging={isDragging}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      handleProps={{ ...attributes, ...listeners }}
    />
  )
}

/* ------------------------------- column ---------------------------------- */

function Column({
  status,
  tasks,
  users,
}: {
  status: TaskStatus
  tasks: Task[]
  users: User[]
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${status}`, data: { type: "column", status } })
  const meta = statusMeta[status]

  return (
    <div className="flex w-full min-w-0 flex-col">
      <div className="mb-3 flex items-center gap-2 px-1">
        <span className={cn("size-2 rounded-full", meta.dot)} />
        <h3 className="text-sm font-semibold">{meta.label}</h3>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {tasks.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-32 flex-1 flex-col gap-2 rounded-xl border border-dashed border-transparent p-1.5 transition-colors",
          isOver && "border-primary/40 bg-primary/5",
        )}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              assignee={users.find((u) => u.id === task.assignee_id)}
            />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground/70">Drop tasks here</p>
        )}
      </div>
    </div>
  )
}

/* ------------------------------- board ----------------------------------- */

export function KanbanBoard({ tasks, users }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  // Optimistic local ordering/status override, keyed by task id.
  const [override, setOverride] = useState<Record<string, TaskStatus>>({})

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const effectiveTasks = useMemo(
    () => tasks.map((t) => (override[t.id] ? { ...t, status: override[t.id] } : t)),
    [tasks, override],
  )

  const columns = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], review: [], done: [] }
    for (const t of effectiveTasks) map[t.status].push(t)
    return map
  }, [effectiveTasks])

  const activeTask = effectiveTasks.find((t) => t.id === activeId) ?? null

  function statusOf(id: string): TaskStatus | null {
    if (id.startsWith("col-")) return id.slice(4) as TaskStatus
    return effectiveTasks.find((t) => t.id === id)?.status ?? null
  }

  function handleDragStart(e: DragStartEvent) {
    setActiveId(e.active.id as string)
  }

  function handleDragOver(e: DragOverEvent) {
    const { active, over } = e
    if (!over) return
    const activeStatus = statusOf(active.id as string)
    const overStatus = statusOf(over.id as string)
    if (overStatus && activeStatus !== overStatus) {
      setOverride((prev) => ({ ...prev, [active.id as string]: overStatus }))
    }
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    setActiveId(null)
    if (!over) return
    const id = active.id as string
    const target = statusOf(over.id as string)
    const original = tasks.find((t) => t.id === id)?.status
    if (!target || target === original) return

    // Persist via the (mocked) Inertia backend.
    router.put(
      `/tasks/${id}/status`,
      { status: target },
      {
        preserveScroll: true,
        preserveState: true,
        onError: () =>
          setOverride((prev) => {
            const next = { ...prev }
            delete next[id]
            return next
          }),
        onSuccess: () =>
          // Clear override once the server-updated prop flows back in.
          setOverride((prev) => {
            const next = { ...prev }
            delete next[id]
            return next
          }),
      },
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATUS_ORDER.map((status) => (
          <Column key={status} status={status} tasks={columns[status]} users={users} />
        ))}
      </div>
      <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)" }}>
        {activeTask ? (
          <TaskCard
            task={activeTask}
            assignee={users.find((u) => u.id === activeTask.assignee_id)}
            overlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
