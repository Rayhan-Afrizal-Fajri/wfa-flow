import { AgencyProvider, usePage } from "@/lib/inertia"
import { Dashboard } from "@/pages/dashboard"
import { ProjectsIndex } from "@/pages/projects-index"
import { ProjectShow } from "@/pages/project-show"
import { TasksIndex } from "@/pages/tasks-index"

/**
 * Client-side page resolver. In a real Inertia app the server decides which
 * page component to render; here we map the current URL to a page, mirroring
 * Inertia's `resolve` step.
 */
function Router() {
  const { url } = usePage()

  const projectMatch = url.match(/^\/projects\/([^/]+)$/)
  if (projectMatch) return <ProjectShow projectId={projectMatch[1]} />
  if (url.startsWith("/projects")) return <ProjectsIndex />
  if (url.startsWith("/tasks")) return <TasksIndex />
  return <Dashboard />
}

export default function App() {
  return (
    <AgencyProvider>
      <Router />
    </AgencyProvider>
  )
}
