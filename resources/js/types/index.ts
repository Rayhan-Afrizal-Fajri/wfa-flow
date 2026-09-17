export type * from './auth';
export type * from './navigation';
export type * from './ui';

/* -------------------------------------------------------------------------- */
/*  Domain                                                                     */
/*                                                                             */
/*  These mirror the Laravel API resources in app/Http/Resources one-for-one.  */
/*  Ids are numeric (database keys) and all dates are ISO strings.             */
/* -------------------------------------------------------------------------- */

export type TeamRole = 'admin' | 'developer' | 'marketer';

export type TeamMember = {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
    job_title: string | null;
    is_active: boolean;
    /** Present when the backend eager-loaded roles. */
    role?: TeamRole | string | null;
    /** Present when the user came through a project membership pivot. */
    project_role?: ProjectRole | null;
};

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskType = 'feature' | 'setup' | 'revision' | 'maintenance';

export type TaskComment = {
    id: number;
    task_id: number;
    user_id: number;
    body: string;
    edited_at: string | null;
    created_at: string;
    user?: TeamMember;
    can_manage: boolean;
};

export type TaskChecklistItem = {
    id: number;
    task_id: number;
    title: string;
    is_done: boolean;
    sort_order: number;
    completed_at: string | null;
};

/**
 * The trimmed project shape embedded in task rows. Task listings eager-load
 * only `id` and `name`, so the full Project is not available there.
 */
export type ProjectSummary = {
    id: number;
    name: string;
    client?: Client | null;
};

export type Task = {
    id: number;
    project_id: number;
    parent_task_id: number | null;
    assignee_id: number | null;
    title: string;
    description: string | null;
    type: TaskType;
    status: TaskStatus;
    priority: TaskPriority;
    sort_order: number;
    start_date: string | null;
    due_date: string | null;
    completed_at: string | null;
    is_overdue: boolean;

    assignee?: TeamMember | null;
    project?: ProjectSummary | null;
    comments?: TaskComment[];
    checklist_items?: TaskChecklistItem[];
    children?: Task[];

    comments_count?: number;
    checklist_total?: number;
    checklist_done?: number;

    created_at: string;
    updated_at: string;
};

export type ProjectCategory = 'web_app' | 'ads_opt';

export type ProjectStatus =
    | 'onboarding'
    | 'in_progress'
    | 'review'
    | 'completed'
    | 'cancelled'
    | 'closed';

export type ProjectRole = 'manager' | 'member' | 'viewer';

export type Client = {
    id: number;
    company_name: string;
    contact_name: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    projects_count?: number;
    active_projects_count?: number;
    projects?: Project[];
    created_at?: string;
};

export type Project = {
    id: number;
    client_id: number | null;
    template_id: number | null;
    owner_id: number | null;
    name: string;
    description: string | null;
    category: ProjectCategory;
    status: ProjectStatus;
    start_date: string;
    deadline: string;
    archived_at: string | null;

    progress: number;
    tasks_count: number | null;
    done_tasks_count: number | null;
    overdue_tasks_count: number | null;

    client?: Client | null;
    template?: ProjectTemplate | null;
    owner?: TeamMember | null;
    members?: TeamMember[];
    tasks?: Task[];

    created_at?: string;
    updated_at?: string;
};

export type TaskTemplate = {
    id: number;
    project_template_id: number;
    title: string;
    description: string | null;
    type: TaskType;
    default_role: string | null;
    priority: TaskPriority;
    start_day_offset: number;
    due_day_offset: number;
    sort_order: number;
};

export type ProjectTemplate = {
    id: number;
    name: string;
    category: ProjectCategory;
    description: string | null;
    is_active: boolean;
    default_duration_days: number;
    task_count?: number;
    projects_count?: number;
    task_templates?: TaskTemplate[];
};

export type Activity = {
    id: number;
    project_id: number | null;
    event: string;
    description: string;
    properties: Record<string, unknown> | null;
    subject_type: string | null;
    subject_id: number | null;
    causer?: TeamMember | null;
    created_at: string;
};

export type AppNotification = {
    id: string;
    type: string;
    title: string;
    message: string;
    url?: string;
    task_id?: number;
    project_id?: number;
    read_at: string | null;
    created_at: string;
};
