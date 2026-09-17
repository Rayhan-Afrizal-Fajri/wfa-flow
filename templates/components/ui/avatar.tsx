import { cn } from "@/lib/utils"

const PALETTE = [
  "bg-[oklch(0.62_0.16_250)]",
  "bg-[oklch(0.62_0.15_155)]",
  "bg-[oklch(0.6_0.2_20)]",
  "bg-[oklch(0.6_0.17_300)]",
  "bg-[oklch(0.65_0.15_50)]",
]

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function colorFor(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

export function Avatar({
  name,
  src,
  size = "md",
  className,
  title,
}: {
  name: string
  src?: string
  size?: "xs" | "sm" | "md" | "lg"
  className?: string
  title?: string
}) {
  const sizes = {
    xs: "size-5 text-[9px]",
    sm: "size-6 text-[10px]",
    md: "size-8 text-xs",
    lg: "size-10 text-sm",
  }
  return (
    <span
      title={title ?? name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-2 ring-card",
        !src && colorFor(name),
        sizes[size],
        className,
      )}
    >
      {src ? (
        <img src={src || "/placeholder.svg"} alt={name} className="size-full rounded-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  )
}
