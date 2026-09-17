import { useMemo, useState } from "react"
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react"
import { router } from "@/lib/inertia"
import { cn } from "@/lib/utils"
import { Avatar } from "@/components/ui/avatar"
import { PriorityBadge, TypeBadge } from "@/components/domain/badges"
import { StatusSelect } from "./status-select"
import {
  daysUntil,
  dueMeta,
  priorityRank,
  statusMeta,
  STATUS_ORDER,
} from "@/lib/domain"
import type { Task, TaskStatus, User } from "@/types"

const columnHelper = createColumnHelper<Task>()

function SortHeader({
  label,
  sorted,
  onClick,
  align = "left",
}: {
  label: string
  sorted: false | "asc" | "desc"
  onClick: () => void
  align?: "left" | "center"
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground",
        align === "center" && "mx-auto",
      )}
    >
      {label}
      {sorted === "asc" ? (
        <ArrowUp className="h-3.5 w-3.5" />
      ) : sorted === "desc" ? (
        <ArrowDown className="h-3.5 w-3.5" />
      ) : (
        <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
      )}
    </button>
  )
}

export function TaskTable({ tasks, users }: { tasks: Task[]; users: User[] }) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "status", desc: false }])
  const [override, setOverride] = useState<Record<string, TaskStatus>>({})

  const data = useMemo(
    () => tasks.map((t) => (override[t.id] ? { ...t, status: override[t.id] } : t)),
    [tasks, override],
  )

  function updateStatus(id: string, status: TaskStatus) {
    setOverride((prev) => ({ ...prev, [id]: status }))
    router.put(
      `/tasks/${id}/status`,
      { status },
      {
        preserveScroll: true,
        preserveState: true,
        onError: () =>
          setOverride((prev) => {
            const next = { ...prev }
            delete next[id]
            return next
          }),
      },
    )
  }

  const columns = useMemo(
    () => [
      columnHelper.accessor("title", {
        header: ({ column }) => (
          <SortHeader
            label="Task"
            sorted={column.getIsSorted()}
            onClick={column.getToggleSortingHandler() as () => void}
          />
        ),
        cell: (info) => (
          <div className="flex items-center gap-2.5">
            <span className="font-medium text-pretty">{info.getValue()}</span>
            <TypeBadge type={info.row.original.type} />
          </div>
        ),
      }),
      columnHelper.accessor("status", {
        sortingFn: (a, b) =>
          STATUS_ORDER.indexOf(a.original.status) - STATUS_ORDER.indexOf(b.original.status),
        header: ({ column }) => (
          <SortHeader
            label="Status"
            sorted={column.getIsSorted()}
            onClick={column.getToggleSortingHandler() as () => void}
          />
        ),
        cell: (info) => (
          <StatusSelect
            value={info.getValue()}
            onChange={(s) => updateStatus(info.row.original.id, s)}
          />
        ),
      }),
      columnHelper.accessor("priority", {
        sortingFn: (a, b) => priorityRank[a.original.priority] - priorityRank[b.original.priority],
        header: ({ column }) => (
          <SortHeader
            label="Priority"
            sorted={column.getIsSorted()}
            onClick={column.getToggleSortingHandler() as () => void}
          />
        ),
        cell: (info) => <PriorityBadge priority={info.getValue()} />,
      }),
      columnHelper.accessor("assignee_id", {
        enableSorting: false,
        header: () => (
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Assignee
          </span>
        ),
        cell: (info) => {
          const user = users.find((u) => u.id === info.getValue())
          if (!user) return null
          return (
            <div className="flex items-center gap-2">
              <Avatar name={user.name} size="sm" />
              <span className="text-sm text-muted-foreground">{user.name}</span>
            </div>
          )
        },
      }),
      columnHelper.accessor("due_date", {
        sortingFn: (a, b) => daysUntil(a.original.due_date) - daysUntil(b.original.due_date),
        header: ({ column }) => (
          <SortHeader
            label="Due"
            sorted={column.getIsSorted()}
            onClick={column.getToggleSortingHandler() as () => void}
          />
        ),
        cell: (info) => {
          const due = dueMeta(info.getValue(), info.row.original.status === "done")
          const tone =
            due.tone === "danger"
              ? "text-danger"
              : due.tone === "warning"
                ? "text-warning"
                : "text-muted-foreground"
          return <span className={cn("text-sm font-medium", tone)}>{due.label}</span>
        },
      }),
    ],
    [users],
  )

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <table className="w-full border-collapse text-left">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="border-b border-border bg-muted/40">
              {hg.headers.map((header) => (
                <th key={header.id} className="px-4 py-3">
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/30"
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-2.5">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">No tasks yet.</p>
      )}
    </div>
  )
}

export { statusMeta }
