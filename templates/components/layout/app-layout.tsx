import { type ReactNode } from "react"
import { Link, usePage } from "@/lib/inertia"
import { cn } from "@/lib/utils"
import { Avatar } from "@/components/ui/avatar"
import { LayoutGrid, FolderKanban, CheckSquare, Search } from "lucide-react"

interface AppLayoutProps {
  title?: string
  children: ReactNode
}

const nav = [
  { label: "Dashboard", href: "/", icon: LayoutGrid, match: (u: string) => u === "/" },
  {
    label: "Projects",
    href: "/projects",
    icon: FolderKanban,
    match: (u: string) => u.startsWith("/projects"),
  },
  { label: "My Tasks", href: "/tasks", icon: CheckSquare, match: (u: string) => u.startsWith("/tasks") },
]

export function AppLayout({ title, children }: AppLayoutProps) {
  const { url, props } = usePage()
  const user = props.auth?.user

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-sidebar md:flex">
        <div className="flex h-16 items-center gap-2.5 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FolderKanban className="h-[18px] w-[18px]" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight">AgencyFlow</span>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 px-3 py-2">
          <p className="px-3 pb-1.5 pt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Workspace
          </p>
          {nav.map((item) => {
            const active = item.match(url)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2.5 rounded-md px-2 py-1.5">
            <Avatar name={user?.name ?? "User"} size="md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user?.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.role}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col md:pl-60">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-6 backdrop-blur">
          <h1 className="text-[15px] font-semibold tracking-tight text-balance">{title}</h1>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground sm:flex">
              <Search className="h-4 w-4" />
              <span className="pr-8">Search</span>
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
            </div>
            <Avatar name={user?.name ?? "User"} size="md" className="md:hidden" />
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
