import * as React from "react"
import { cn } from "@/lib/utils"
import { useClickOutside } from "@/lib/use-click-outside"

type MenuItem = {
  label: string
  icon?: React.ReactNode
  onSelect?: () => void
  destructive?: boolean
}

export function DropdownMenu({
  trigger,
  items,
  align = "end",
  header,
}: {
  trigger: React.ReactNode
  items: MenuItem[]
  align?: "start" | "end"
  header?: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  useClickOutside(ref, () => setOpen(false), open)

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}>
        {trigger}
      </button>
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute z-50 mt-1.5 min-w-[13rem] overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-lg",
            align === "end" ? "right-0" : "left-0",
          )}
          style={{ animation: "menu-pop 120ms ease-out" }}
        >
          {header && <div className="px-2 py-1.5">{header}</div>}
          {items.map((item, i) => (
            <button
              key={i}
              role="menuitem"
              type="button"
              onClick={() => {
                item.onSelect?.()
                setOpen(false)
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors [&_svg]:size-4",
                item.destructive
                  ? "text-destructive hover:bg-destructive/10"
                  : "text-foreground hover:bg-muted",
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
          <style>{`@keyframes menu-pop { from { opacity: 0; transform: translateY(-4px) } to { opacity: 1; transform: none } }`}</style>
        </div>
      )}
    </div>
  )
}
