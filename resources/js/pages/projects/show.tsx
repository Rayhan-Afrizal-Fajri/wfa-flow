import { Head, Link, router } from '@inertiajs/react';
import {
    Activity as ActivityIcon,
    Building2,
    CalendarDays,
    ChevronLeft,
    LayoutGrid,
    Plus,
    Table2,
    Users,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { ProjectStatusBadge } from '@/components/domain/badges';
import { ActivityFeed } from '@/components/project/activity-feed';
import { CreateTaskDialog } from '@/components/project/create-task-dialog';
import { KanbanBoard } from '@/components/project/kanban-board';
import { ProjectMembers } from '@/components/project/project-members';
import { TaskDetailSheet } from '@/components/project/task-detail-sheet';
import { TaskTable } from '@/components/project/task-table';
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/native-select';
import { Progress } from '@/components/ui/progress';
import { Segmented } from '@/components/ui/segmented';
import {
    deadlineMeta,
    dueToneClass,
    formatFullDate,
    projectCategoryMeta,
    PROJECT_STATUS_ORDER,
    projectStatusMeta,
} from '@/lib/domain';
import { cn } from '@/lib/utils';
import projectsRoute from '@/routes/projects';
import type {
    Activity,
    Project,
    ProjectStatus,
    Task,
    TaskStatus,
    TeamMember,
} from '@/types';

type View = 'board' | 'table' | 'activity';

type Props = {
    project: Project;
    tasks: Task[];
    users: TeamMember[];
    activities: Activity[];
    can: { update: boolean; delete: boolean; manageMembers: boolean };
};

export default function ProjectShow({
    project,
    tasks,
    users,
    activities,
    can,
}: Props) {
    const [view, setView] = useState<View>('board');
    const [creatingIn, setCreatingIn] = useState<TaskStatus | null>(null);

    /**
     * `?task=` deep-links a task, which is how notifications and the dashboard
     * lists jump straight into a card. Read once at mount, so closing the sheet
     * does not fight the URL.
     */
    const [openTaskId, setOpenTaskId] = useState<number | null>(() => {
        if (typeof window === 'undefined') {
            return null;
        }

        const param = new URLSearchParams(window.location.search).get('task');

        return param ? Number(param) : null;
    });

    const openTask = useMemo(
        () => tasks.find((task) => task.id === openTaskId) ?? null,
        [tasks, openTaskId],
    );

    const closeTask = useCallback(() => {
        setOpenTaskId(null);

        // Drop the deep-link so a refresh doesn't reopen the sheet.
        const url = new URL(window.location.href);

        if (url.searchParams.has('task')) {
            url.searchParams.delete('task');
            window.history.replaceState({}, '', url.toString());
        }
    }, []);

    const deadline = deadlineMeta(project.deadline, project.status);
    const total = project.tasks_count ?? tasks.length;
    const done = project.done_tasks_count ?? 0;

    return (
        <>
            <Head title={project.name} />

            {/* ------------------------------ header ------------------------------ */}
            <div className="border-b border-border bg-card/40">
                <div className="mx-auto max-w-7xl px-6 pt-5 pb-5">
                    <Link
                        href={projectsRoute.index()}
                        className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        All projects
                    </Link>

                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2.5">
                                <h2 className="text-2xl font-semibold tracking-tight text-balance">
                                    {project.name}
                                </h2>

                                {can.update ? (
                                    <NativeSelect
                                        value={project.status}
                                        className="h-8 w-40 text-xs"
                                        onChange={(e) =>
                                            router.put(
                                                projectsRoute.update.url(
                                                    project.id,
                                                ),
                                                {
                                                    status: e.target
                                                        .value as ProjectStatus,
                                                },
                                                { preserveScroll: true },
                                            )
                                        }
                                    >
                                        {PROJECT_STATUS_ORDER.map((status) => (
                                            <option key={status} value={status}>
                                                {
                                                    projectStatusMeta[status]
                                                        .label
                                                }
                                            </option>
                                        ))}
                                    </NativeSelect>
                                ) : (
                                    <ProjectStatusBadge
                                        status={project.status}
                                    />
                                )}
                            </div>

                            {project.description && (
                                <p className="mt-2 max-w-2xl text-sm text-pretty text-muted-foreground">
                                    {project.description}
                                </p>
                            )}

                            <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
                                <span className="inline-flex items-center gap-1.5">
                                    <Building2 className="h-4 w-4" />
                                    {project.client?.company_name ??
                                        'Internal project'}
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <LayoutGrid className="h-4 w-4" />
                                    {
                                        projectCategoryMeta[project.category]
                                            .label
                                    }
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <CalendarDays className="h-4 w-4" />
                                    {formatFullDate(project.start_date)} —{' '}
                                    {formatFullDate(project.deadline)}
                                </span>
                            </div>
                        </div>

                        {/* progress card */}
                        <div className="w-full shrink-0 rounded-xl border border-border bg-card p-4 lg:w-80">
                            <div className="flex items-end justify-between gap-2">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Progress
                                    </p>
                                    <p className="mt-0.5 text-2xl font-semibold tabular-nums">
                                        {project.progress}%
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-muted-foreground tabular-nums">
                                        {done} of {total} tasks
                                    </p>
                                    <p
                                        className={cn(
                                            'mt-0.5 text-xs font-medium',
                                            dueToneClass[deadline.tone],
                                        )}
                                    >
                                        {deadline.label}
                                    </p>
                                </div>
                            </div>

                            <Progress
                                value={project.progress}
                                className="mt-3"
                            />

                            {(project.overdue_tasks_count ?? 0) > 0 && (
                                <p className="mt-2 text-xs font-medium text-danger-strong">
                                    {project.overdue_tasks_count} task
                                    {project.overdue_tasks_count === 1
                                        ? ''
                                        : 's'}{' '}
                                    overdue
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ------------------------------ content ----------------------------- */}
            <div className="mx-auto max-w-7xl px-6 py-5">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <Segmented<View>
                        aria-label="Project view"
                        value={view}
                        onChange={setView}
                        options={[
                            {
                                value: 'board',
                                label: 'Board',
                                icon: <LayoutGrid />,
                            },
                            {
                                value: 'table',
                                label: 'Table',
                                icon: <Table2 />,
                                count: tasks.length,
                            },
                            {
                                value: 'activity',
                                label: 'Activity',
                                icon: <ActivityIcon />,
                            },
                        ]}
                    />

                    {can.update && (
                        <Button onClick={() => setCreatingIn('todo')}>
                            <Plus className="h-4 w-4" />
                            New task
                        </Button>
                    )}
                </div>

                {view === 'board' && (
                    <KanbanBoard
                        projectId={project.id}
                        tasks={tasks}
                        users={users}
                        canEdit={can.update}
                        onOpenTask={(task) => setOpenTaskId(task.id)}
                        onAddTask={(status) => setCreatingIn(status)}
                    />
                )}

                {view === 'table' && (
                    <TaskTable
                        tasks={tasks}
                        users={users}
                        canEdit={can.update}
                        onOpenTask={(task) => setOpenTaskId(task.id)}
                        emptyMessage="No tasks in this project yet."
                    />
                )}

                {view === 'activity' && (
                    <div className="grid gap-6 lg:grid-cols-3">
                        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
                            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
                                <ActivityIcon className="h-4 w-4" />
                                Project timeline
                            </h3>
                            <ActivityFeed
                                activities={activities}
                                emptyMessage="No activity recorded yet."
                            />
                        </div>

                        <div className="space-y-4">
                            <ProjectMembers
                                project={project}
                                users={users}
                                canManage={can.manageMembers}
                            />
                        </div>
                    </div>
                )}

                {view !== 'activity' && (
                    <div className="mt-6 grid gap-6 lg:grid-cols-3">
                        <div className="lg:col-span-2">
                            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                                <ActivityIcon className="h-4 w-4" />
                                Recent activity
                            </h3>
                            <div className="rounded-xl border border-border bg-card p-4">
                                <ActivityFeed
                                    activities={activities}
                                    limit={6}
                                    emptyMessage="No activity recorded yet."
                                />
                            </div>
                        </div>

                        <div>
                            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                                <Users className="h-4 w-4" />
                                Team
                            </h3>
                            <ProjectMembers
                                project={project}
                                users={users}
                                canManage={can.manageMembers}
                            />
                        </div>
                    </div>
                )}
            </div>

            <TaskDetailSheet
                task={openTask}
                users={users}
                canEdit={can.update}
                onClose={closeTask}
            />

            <CreateTaskDialog
                projectId={project.id}
                users={users}
                open={creatingIn !== null}
                defaultStatus={creatingIn ?? 'todo'}
                defaultDueDate={project.deadline}
                onOpenChange={(open) => !open && setCreatingIn(null)}
            />
        </>
    );
}
