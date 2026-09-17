/**
 * Lightweight mock of the @inertiajs/react runtime.
 *
 * It mirrors the real Inertia client API surface (router, useForm, usePage,
 * Link, Head) so page/components read exactly like a genuine Inertia app,
 * while an in-memory store stands in for the Laravel/Rails backend. Requests
 * are dispatched asynchronously and resolved against a registered handler,
 * simulating a real server round-trip (with preserveScroll, onSuccess, etc.).
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import type { Project, Task, User } from "@/types"
import {
  projects as seedProjects,
  tasks as seedTasks,
  users as seedUsers,
  templates,
} from "@/data/mock"

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

type Method = "get" | "post" | "put" | "patch" | "delete"

export type VisitOptions = {
  preserveScroll?: boolean
  preserveState?: boolean
  onStart?: () => void
  onSuccess?: () => void
  onError?: (errors: Record<string, string>) => void
  onFinish?: () => void
}

type BackendResult = { errors?: Record<string, string> }
type BackendHandler = (req: { method: Method; url: string; data: unknown }) => BackendResult | void

/* -------------------------------------------------------------------------- */
/*  Module-level runtime wiring                                                */
/* -------------------------------------------------------------------------- */

let backendHandler: BackendHandler | null = null
let navigateFn: ((url: string) => void) | null = null

function __register(handler: BackendHandler, navigate: (url: string) => void) {
  backendHandler = handler
  navigateFn = navigate
}

function runRequest(method: Method, url: string, data: unknown, options?: VisitOptions) {
  options?.onStart?.()
  // Simulate network latency for a realistic optimistic-UI feel.
  window.setTimeout(() => {
    let result: BackendResult | void
    try {
      result = backendHandler?.({ method, url, data })
    } catch {
      result = { errors: { _: "Request failed" } }
    }
    if (result && result.errors && Object.keys(result.errors).length > 0) {
      options?.onError?.(result.errors)
    } else {
      options?.onSuccess?.()
    }
    options?.onFinish?.()
  }, 220)
}

export const router = {
  visit(url: string, options?: VisitOptions & { method?: Method; data?: unknown }) {
    options?.onStart?.()
    navigateFn?.(url)
    options?.onSuccess?.()
    options?.onFinish?.()
  },
  get(url: string, data?: unknown, options?: VisitOptions) {
    runRequest("get", url, data, options)
  },
  post(url: string, data?: unknown, options?: VisitOptions) {
    runRequest("post", url, data, options)
  },
  put(url: string, data?: unknown, options?: VisitOptions) {
    runRequest("put", url, data, options)
  },
  patch(url: string, data?: unknown, options?: VisitOptions) {
    runRequest("patch", url, data, options)
  },
  delete(url: string, options?: VisitOptions) {
    runRequest("delete", url, undefined, options)
  },
}

/* -------------------------------------------------------------------------- */
/*  Page context (shared props + navigation)                                   */
/* -------------------------------------------------------------------------- */

export type PageProps = {
  auth: { user: User }
  users: User[]
  projects: Project[]
  tasks: Task[]
}

type PageContextValue = {
  url: string
  props: PageProps
  navigate: (url: string) => void
}

const PageContext = createContext<PageContextValue | null>(null)

export function usePage() {
  const ctx = useContext(PageContext)
  if (!ctx) throw new Error("usePage must be used within <AgencyProvider>")
  return { url: ctx.url, props: ctx.props }
}

export function useNavigate() {
  const ctx = useContext(PageContext)
  if (!ctx) throw new Error("useNavigate must be used within <AgencyProvider>")
  return ctx.navigate
}

/* -------------------------------------------------------------------------- */
/*  Provider — the simulated backend & data store                             */
/* -------------------------------------------------------------------------- */

function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`
}

function addDays(iso: string, days: number) {
  const d = new Date(iso + "T00:00:00")
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function AgencyProvider({ children }: { children: ReactNode }) {
  const [users] = useState<User[]>(seedUsers)
  const [projects, setProjects] = useState<Project[]>(seedProjects)
  const [tasks, setTasks] = useState<Task[]>(seedTasks)
  const [url, setUrl] = useState<string>("/projects/p1")

  const navigate = useCallback((next: string) => {
    setUrl(next)
    window.scrollTo({ top: 0 })
  }, [])

  // The mock "server": interprets requests and mutates the store.
  const handleRequest = useCallback<BackendHandler>(({ method, url: reqUrl, data }) => {
    // PUT /tasks/:id/status  -> update a single task's status
    const statusMatch = reqUrl.match(/^\/tasks\/([^/]+)\/status$/)
    if (method === "put" && statusMatch) {
      const id = statusMatch[1]
      const status = (data as { status: Task["status"] }).status
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)))
      return
    }

    // PUT /tasks/:id  -> partial task update
    const taskMatch = reqUrl.match(/^\/tasks\/([^/]+)$/)
    if (method === "put" && taskMatch) {
      const id = taskMatch[1]
      const patch = data as Partial<Task>
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
      return
    }

    // POST /projects  -> create a project and auto-generate template tasks
    if (method === "post" && reqUrl === "/projects") {
      const payload = data as {
        name: string
        client_name: string
        template_id: string
        start_date: string
      }
      const errors: Record<string, string> = {}
      if (!payload.name?.trim()) errors.name = "Project name is required."
      if (!payload.client_name?.trim()) errors.client_name = "Client name is required."
      if (!payload.template_id) errors.template_id = "Select a template."
      if (!payload.start_date) errors.start_date = "Choose a start date."
      if (Object.keys(errors).length) return { errors }

      const template = templates.find((t) => t.id === payload.template_id)!
      const projectId = makeId("p")
      const lastOffset = Math.max(...template.tasks.map((t) => t.dayOffset))
      const newProject: Project = {
        id: projectId,
        name: payload.name.trim(),
        category: template.category,
        status: "planning",
        client_name: payload.client_name.trim(),
        start_date: payload.start_date,
        deadline: addDays(payload.start_date, lastOffset + 5),
      }
      const generated: Task[] = template.tasks.map((seed) => ({
        id: makeId("t"),
        project_id: projectId,
        title: seed.title,
        status: seed.status ?? "todo",
        priority: seed.priority,
        type: seed.type,
        assignee_id: seedUsers.find((u) => u.role === seed.role)?.id ?? seedUsers[0].id,
        due_date: addDays(payload.start_date, seed.dayOffset),
      }))
      setProjects((prev) => [newProject, ...prev])
      setTasks((prev) => [...prev, ...generated])
      // Navigate to the freshly created project, like an Inertia redirect.
      window.setTimeout(() => navigate(`/projects/${projectId}`), 60)
      return
    }
  }, [navigate])

  // Register the runtime wiring once (stable callbacks).
  const registered = useRef(false)
  if (!registered.current) {
    __register(handleRequest, navigate)
    registered.current = true
  }

  const props = useMemo<PageProps>(
    () => ({ auth: { user: users[0] }, users, projects, tasks }),
    [users, projects, tasks],
  )

  const value = useMemo<PageContextValue>(
    () => ({ url, props, navigate }),
    [url, props, navigate],
  )

  return <PageContext.Provider value={value}>{children}</PageContext.Provider>
}

/* -------------------------------------------------------------------------- */
/*  useForm — mirrors Inertia's form helper                                    */
/* -------------------------------------------------------------------------- */

export function useForm<TForm extends Record<string, unknown>>(initial: TForm) {
  const initialRef = useRef(initial)
  const [data, setDataState] = useState<TForm>(initial)
  const [errors, setErrors] = useState<Partial<Record<keyof TForm, string>>>({})
  const [processing, setProcessing] = useState(false)

  const setData = useCallback(
    (keyOrValues: keyof TForm | Partial<TForm>, value?: unknown) => {
      if (typeof keyOrValues === "object") {
        setDataState((prev) => ({ ...prev, ...keyOrValues }))
      } else {
        setDataState((prev) => ({ ...prev, [keyOrValues]: value }) as TForm)
      }
    },
    [],
  )

  const reset = useCallback(() => {
    setDataState(initialRef.current)
    setErrors({})
  }, [])

  const clearErrors = useCallback(() => setErrors({}), [])

  const submit = useCallback(
    (method: Method, submitUrl: string, options?: VisitOptions) => {
      setProcessing(true)
      setErrors({})
      runRequest(method, submitUrl, dataRef.current, {
        ...options,
        onError: (errs) => {
          setErrors(errs as Partial<Record<keyof TForm, string>>)
          options?.onError?.(errs)
        },
        onFinish: () => {
          setProcessing(false)
          options?.onFinish?.()
        },
      })
    },
    [],
  )

  // keep a ref to the latest data for the async submit
  const dataRef = useRef(data)
  dataRef.current = data

  return {
    data,
    setData,
    errors,
    clearErrors,
    processing,
    reset,
    post: (u: string, o?: VisitOptions) => submit("post", u, o),
    put: (u: string, o?: VisitOptions) => submit("put", u, o),
    patch: (u: string, o?: VisitOptions) => submit("patch", u, o),
    get: (u: string, o?: VisitOptions) => submit("get", u, o),
  }
}

/* -------------------------------------------------------------------------- */
/*  Link & Head                                                                */
/* -------------------------------------------------------------------------- */

export function Link({
  href,
  children,
  className,
  ...rest
}: { href: string; children: ReactNode; className?: string } & Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  "href"
>) {
  const navigate = useNavigate()
  return (
    <a
      href={href}
      className={className}
      onClick={(e) => {
        e.preventDefault()
        navigate(href)
      }}
      {...rest}
    >
      {children}
    </a>
  )
}

export function Head({ title }: { title?: string }) {
  if (typeof document !== "undefined" && title) {
    document.title = `${title} · AgencyFlow`
  }
  return null
}
