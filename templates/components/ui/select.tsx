import * as React from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useClickOutside } from "@/lib/use-click-outside"

export type SelectOption = {
  value: string
  label: string
  description?: string
  icon?: React.ReactNode
}

type SelectProps = {
  value?: string
  onValueChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
  align?: "start" | "end"
  /** Optional custom trigger; receives the currently selected option. */
  renderTrigger?: (selected: SelectOption | undefined, open: boolean) => React.ReactNode
  "aria-label"?: string
}

export function Select({
  value,
  onValueChange,
  options,
  placeholder = "Select…",
  className,
  align = "start",
  renderTrigger,
  ...aria
}: SelectProps) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  useClickOutside(ref, () => setOpen(false), open)

  const selected = options.find((o) => o.value === value)

  return (
    <div ref={ref} className="relative inline-block">
      {renderTrigger ? (
        <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open} {...aria}>
          {renderTrigger(selected, open)}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={cn(
            "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-1 text-sm shadow-xs transition-colors",
            "hover:bg-muted/60 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none",
            className,
          )}
          {...aria}
        >
          <span className={cn("flex items-center gap-2 truncate", !selected && "text-muted-foreground")}>
            {selected?.icon}
            {selected?.label ?? placeholder}
          </span>
          <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
        </button>
      )}

      {open && (
        <div
          role="listbox"
          className={cn(
            "absolute z-50 mt-1.5 min-w-[12rem] overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-lg",
            align === "end" ? "right-0" : "left-0",
          )}
          style={{ animation: "select-pop 120ms ease-out" }}
        >
          {options.map((opt) => {
            const active = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onValueChange(opt.value)
                  setOpen(false)
                }}
                className={cn(
                  "flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                  "hover:bg-muted focus-visible:bg-muted focus-visible:outline-none",
                  active && "bg-muted",
                )}
              >
                <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center">
                  {active ? <Check className="size-4 text-primary" /> : opt.icon}
                </span>
                <span className="flex flex-col">
                  <span className="font-medium leading-tight">{opt.label}</span>
                  {opt.description && (
                    <span className="text-xs text-muted-foreground">{opt.description}</span>
                  )}
                </span>
              </button>
            )
          })}
          <style>{`@keyframes select-pop { from { opacity: 0; transform: translateY(-4px) } to { opacity: 1; transform: none } }`}</style>
        </div>
      )}
    </div>
  )
}
