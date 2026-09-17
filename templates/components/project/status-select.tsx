import { useRef, useState } from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useClickOutside } from "@/lib/use-click-outside"
import { STATUS_ORDER, statusMeta } from "@/lib/domain"
import type { TaskStatus } from "@/types"

export function StatusSelect({
  value,
  onChange,
}: {
  value: TaskStatus
  onChange: (status: TaskStatus) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, () => setOpen(false))
  const meta = statusMeta[value]

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition-opacity hover:opacity-80",
          meta.badge,
        )}
      >
        <span className={cn("size-1.5 rounded-full", meta.dot)} />
        {meta.label}
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-40 overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-lg">
          {STATUS_ORDER.map((status) => {
            const m = statusMeta[status]
            return (
              <button
                key={status}
                type="button"
                onClick={() => {
                  onChange(status)
                  setOpen(false)
                }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent"
              >
                <span className={cn("size-1.5 rounded-full", m.dot)} />
                <span className="flex-1 text-left">{m.label}</span>
                {status === value && <Check className="h-3.5 w-3.5 text-primary" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
