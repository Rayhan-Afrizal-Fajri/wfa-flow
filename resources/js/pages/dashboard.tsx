import { Head, Link, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowRight,
    CheckCircle2,
    Clock,
    FolderKanban,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PriorityBadge } from '@/components/domain/badges';
import { ActivityFeed } from '@/components/project/activity-feed';
import { Assignee } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { deadlineMeta, dueMeta, dueToneClass } from '@/lib/domain';
import { cn } from '@/lib/utils';
import projects from '@/routes/projects';
import tasksRoute from '@/routes/tasks';
import type { Activity, Project, Task } from '@/types';

type DashboardStats = {
    active_projects: number;
    in_progress_tasks: number;
    completed_tasks: number;
    overdue_tasks: number;
    due_this_week: number;
    my_open_tasks: number;
};

type Props = {
    stats: DashboardStats;
    projects: Project[];
    upcoming: Task[];
    myTasks: Task[];
    activities: Activity[];
};

export default function Dashboard({
    stats,
    projects: activeProjects,
    upcoming,
    myTasks,
    activities,
}: Props) {
    const page = usePage<{ auth: { user: { name: string } } }>();

    const firstName = page.props.auth.user.name.split(' ')[0];

    const statCards: Array<{
        label: string;
        value: number;
        icon: LucideIcon;
        tone: string;
    }> = [
        {
            label: 'Active projects',
            value: stats.active_projects,
            icon: FolderKanban,
            tone: 'text-primary',
        },
        {
            label: 'In progress',
            value: stats.in_progress_tasks,
            icon: Clock,
            tone: 'text-info',
        },
        {
            label: 'Completed tasks',
            value: stats.completed_tasks,
            icon: CheckCircle2,
            tone: 'text-success',
        },
        {
            label: 'Overdue',
            value: stats.overdue_tasks,
            icon: AlertTriangle,
            tone: 'text-danger',
        },
    ];

    return (
        <>
            <Head title="Dashboard" />

            <div className="px-6 py-6">
                <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-semibold tracking-tight">
                            {greeting()}, {firstName}
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {stats.my_open_tasks} open task
                            {stats.my_open_tasks === 1 ? '' : 's'} assigned to
                            you · {stats.due_this_week} due this week.
                        </p>
                    </div>

                    <Link
                        href={projects.index()}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                        All projects
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>

                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {statCards.map((card) => {
                        const Icon = card.icon;

                        return (
                            <div
                                key={card.label}
                                className="rounded-xl border border-border bg-card p-4"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm text-muted-foreground">
                                        {card.label}
                                    </span>
                                    <Icon
                                        className={cn('h-4 w-4', card.tone)}
                                    />
                                </div>
                                <p className="mt-2 text-3xl font-semibold tabular-nums">
                                    {card.value}
                                </p>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-5">
                    {/* ------------------------- active projects ------------------------ */}
                    <div className="lg:col-span-3">
                        <h3 className="mb-3 text-sm font-semibold">
                            Active projects
                        </h3>

                        <div className="space-y-3">
                            {activeProjects.map((project) => {
                                const deadline = deadlineMeta(
                                    project.deadline,
                                    project.status,
                                );

                                return (
                                    <Link
                                        key={project.id}
                                        href={projects.show(project.id)}
                                        className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-muted-foreground/30"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="truncate font-medium">
                                                    {project.name}
                                                </p>
                                                <span className="shrink-0 text-xs font-semibold text-muted-foreground tabular-nums">
                                                    {project.progress}%
                                                </span>
                                            </div>

                                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                                                <p className="truncate text-xs text-muted-foreground">
                                                    {project.client
                                                        ?.company_name ??
                                                        'Internal'}
                                                </p>
                                                <span
                                                    className={cn(
                                                        'text-xs font-medium',
                                                        dueToneClass[
                                                            deadline.tone
                                                        ],
                                                    )}
                                                >
                                                    {deadline.label}
                                                </span>
                                                {(project.overdue_tasks_count ??
                                                    0) > 0 && (
                                                    <span className="text-xs font-medium text-danger-strong">
                                                        {
                                                            project.overdue_tasks_count
                                                        }{' '}
                                                        overdue
                                                    </span>
                                                )}
                                            </div>

                                            <Progress
                                                value={project.progress}
                                                className="mt-2.5"
                                            />
                                        </div>

                                        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    </Link>
                                );
                            })}

                            {activeProjects.length === 0 && (
                                <EmptyCard
                                    title="No active projects"
                                    body="Create one from a template to get the standard checklist automatically."
                                />
                            )}
                        </div>

                        <h3 className="mt-6 mb-3 text-sm font-semibold">
                            Recent activity
                        </h3>
                        <div className="rounded-xl border border-border bg-card p-4">
                            <ActivityFeed
                                activities={activities}
                                limit={8}
                                emptyMessage="No activity yet."
                            />
                        </div>
                    </div>

                    {/* ------------------------ deadlines & my work --------------------- */}
                    <div className="space-y-6 lg:col-span-2">
                        <div>
                            <h3 className="mb-3 text-sm font-semibold">
                                Upcoming deadlines
                            </h3>
                            <TaskList
                                tasks={upcoming}
                                empty="Nothing due — nice."
                                showAssignee
                            />
                        </div>

                        <div>
                            <div className="mb-3 flex items-center justify-between">
                                <h3 className="text-sm font-semibold">
                                    My tasks
                                </h3>
                                <Link
                                    href={tasksRoute.index()}
                                    className="text-xs font-medium text-primary hover:underline"
                                >
                                    View all
                                </Link>
                            </div>
                            <TaskList
                                tasks={myTasks}
                                empty="You're all caught up."
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

function TaskList({
    tasks,
    empty,
    showAssignee = false,
}: {
    tasks: Task[];
    empty: string;
    showAssignee?: boolean;
}) {
    if (tasks.length === 0) {
        return (
            <div className="rounded-xl border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
                {empty}
            </div>
        );
    }

    return (
        <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {tasks.map((task) => {
                const due = dueMeta(task.due_date, task.status === 'done');

                return (
                    <Link
                        key={task.id}
                        href={projects.show(task.project_id, {
                            query: { task: task.id },
                        })}
                        className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/40"
                    >
                        {showAssignee && (
                            <Assignee
                                name={task.assignee?.name ?? '?'}
                                src={task.assignee?.avatar}
                                size="sm"
                                ring={false}
                            />
                        )}

                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                                {task.title}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                <PriorityBadge priority={task.priority} />
                                <span
                                    className={cn(
                                        'text-xs font-medium',
                                        dueToneClass[due.tone],
                                    )}
                                >
                                    {due.label}
                                </span>
                                {task.project?.name && (
                                    <span className="truncate text-xs text-muted-foreground">
                                        {task.project.name}
                                    </span>
                                )}
                            </div>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}

function EmptyCard({ title, body }: { title: string; body: string }) {
    return (
        <div className="rounded-xl border border-dashed border-border bg-card/50 px-4 py-10 text-center">
            <p className="text-sm font-medium">{title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{body}</p>
        </div>
    );
}

function greeting(): string {
    const hour = new Date().getHours();

    if (hour < 12) {
        return 'Good morning';
    }

    if (hour < 18) {
        return 'Good afternoon';
    }

    return 'Good evening';
}
