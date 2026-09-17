export type UserRole = "developer" | "marketer"

export type User = {
  id: string
  name: string
  role: UserRole
  avatar: string
}

export type TaskStatus = "todo" | "in_progress" | "review" | "done"
export type TaskPriority = "low" | "medium" | "high" | "urgent"
export type TaskType = "feature" | "setup" | "revision"

export type Task = {
  id: string
  project_id: string
  title: string
  status: TaskStatus
  priority: TaskPriority
  assignee_id: string
  due_date: string
  type: TaskType
}

export type ProjectCategory = "web_app" | "ads_opt"
export type ProjectStatus = "planning" | "active" | "on_hold" | "completed"

export type Project = {
  id: string
  name: string
  category: ProjectCategory
  status: ProjectStatus
  client_name: string
  start_date: string
  deadline: string
}

export type ProjectTemplate = {
  id: string
  label: string
  category: ProjectCategory
  description: string
  taskCount: number
  /** offsets in days from the project start date, paired with the seed tasks */
  tasks: Array<{
    title: string
    type: TaskType
    priority: TaskPriority
    role: UserRole
    dayOffset: number
    status?: TaskStatus
  }>
}
