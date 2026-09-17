import { useState } from "react"
import { Plus, Check, ListChecks } from "lucide-react"
import { useForm } from "@/lib/inertia"
import { templates, TODAY } from "@/data/mock"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { projectCategoryMeta } from "@/lib/domain"

const todayISO = TODAY.toISOString().slice(0, 10)

export function CreateProjectDialog() {
  const [open, setOpen] = useState(false)
  const { data, setData, post, processing, errors, reset } = useForm({
    name: "",
    client_name: "",
    template_id: "tpl_web",
    start_date: todayISO,
  })

  const selected = templates.find((t) => t.id === data.template_id)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    post("/projects", {
      onSuccess: () => {
        reset()
        setOpen(false)
      },
    })
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        New Project
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <form onSubmit={submit}>
            <DialogHeader>
              <DialogTitle>Create a new project</DialogTitle>
              <DialogDescription>
                Pick a template and we&apos;ll scaffold the standard task checklist automatically.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-5 px-6 py-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Project name</Label>
                <Input
                  id="name"
                  value={data.name}
                  onChange={(e) => setData("name", e.target.value)}
                  placeholder="Northwind Storefront"
                  aria-invalid={!!errors.name}
                />
                {errors.name && <p className="text-xs text-danger">{errors.name}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="client">Client</Label>
                <Input
                  id="client"
                  value={data.client_name}
                  onChange={(e) => setData("client_name", e.target.value)}
                  placeholder="Northwind Coffee"
                  aria-invalid={!!errors.client_name}
                />
                {errors.client_name && <p className="text-xs text-danger">{errors.client_name}</p>}
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label>Project template</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {templates.map((tpl) => {
                    const active = tpl.id === data.template_id
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => setData("template_id", tpl.id)}
                        className={cn(
                          "relative rounded-lg border p-3 text-left transition-colors",
                          active
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-border hover:border-muted-foreground/40",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">{tpl.label}</span>
                          {active && <Check className="h-4 w-4 text-primary" />}
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {tpl.description}
                        </p>
                        <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                          <ListChecks className="h-3.5 w-3.5" />
                          {tpl.taskCount} tasks · {projectCategoryMeta[tpl.category].label}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="start">Start date</Label>
                <Input
                  id="start"
                  type="date"
                  value={data.start_date}
                  onChange={(e) => setData("start_date", e.target.value)}
                  aria-invalid={!!errors.start_date}
                />
                {errors.start_date && <p className="text-xs text-danger">{errors.start_date}</p>}
              </div>

              {selected && (
                <div className="rounded-lg border border-border bg-muted/40 p-3 sm:self-end">
                  <p className="text-xs text-muted-foreground">
                    Creating this project will generate{" "}
                    <span className="font-semibold text-foreground">{selected.taskCount} tasks</span>{" "}
                    starting {new Date(data.start_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}.
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={processing}>
                {processing ? "Creating…" : "Create project"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
