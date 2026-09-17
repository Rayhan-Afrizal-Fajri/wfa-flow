import { Head, router } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { TaskDetailSheet } from '@/components/project/task-detail-sheet';
import { TaskTable } from '@/components/project/task-table';
import { Assignee } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Segmented } from '@/components/ui/segmented';
import {
    PRIORITY_ORDER,
    priorityMeta,
    STATUS_ORDER,
    statusMeta,
} from '@/lib/domain';
import tasksRoute from '@/routes/tasks';
import type {
    ProjectSummary,
    Task,
    TaskPriority,
    TaskStatus,
    TeamMember,
} from '@/types';

type Filters = {
    assignee_id: number;
    status?: TaskStatus | null;
    priority?: TaskPriority | null;
    project_id?: number | null;
    search?: string | null;
};

type Props = {
    tasks: Task[];
    users: TeamMember[];
    projects: ProjectSummary[];
    filters: Filters;
};

type Bucket = 'open' | 'overdue' | 'done';

export default function TasksIndex({ tasks, users, projects, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [bucket, setBucket] = useState<Bucket>('open');
    const [openTaskId, setOpenTaskId] = useState<number | null>(null);

    const active = users.find((u) => u.id === filters.assignee_id);

    function applyFilter(patch: Partial<Filters>) {
        const next = { ...filters, search, ...patch };

        router.get(
            tasksRoute.index.url(),
            Object.fromEntries(
                Object.entries(next).filter(
                    ([, value]) =>
                        value !== null && value !== undefined && value !== '',
                ),
            ),
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    /** Client-side split so switching buckets doesn't cost a round trip. */
    const buckets = useMemo(() => {
        const open = tasks.filter((t) => t.status !== 'done');

        return {
            open,
            overdue: open.filter((t) => t.is_overdue),
            done: tasks.filter((t) => t.status === 'done'),
        };
    }, [tasks]);

    const visible = buckets[bucket];
    const openTask = useMemo(
        () => tasks.find((t) => t.id === openTaskId) ?? null,
        [tasks, openTaskId],
    );

    // Only the caller's own board is editable from here.
    const canEdit = true;

    return (
        <>
            <Head title="My Tasks" />

            <div className="px-6 py-6">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Assignee
                            name={active?.name ?? '?'}
                            src={active?.avatar}
                            size="lg"
                            ring={false}
                        />
                        <div>
                            <h2 className="text-xl font-semibold tracking-tight">
                                {active?.name ?? 'Tasks'}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {active?.job_title ?? active?.role ?? 'Team'} ·{' '}
                                {buckets.open.length} open
                                {buckets.overdue.length > 0 && (
                                    <span className="text-danger-strong">
                                        {' '}
                                        · {buckets.overdue.length} overdue
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>

                    <NativeSelect
                        value={filters.assignee_id}
                        onChange={(e) =>
                            applyFilter({ assignee_id: Number(e.target.value) })
                        }
                        className="w-52"
                    >
                        {users.map((user) => (
                            <option key={user.id} value={user.id}>
                                {user.name}
                            </option>
                        ))}
                    </NativeSelect>
                </div>

                <div className="mb-5 flex flex-wrap items-center gap-2">
                    <Segmented<Bucket>
                        aria-label="Task bucket"
                        value={bucket}
                        onChange={setBucket}
                        options={[
                            {
                                value: 'open',
                                label: 'Open',
                                count: buckets.open.length,
                            },
                            {
                                value: 'overdue',
                                label: 'Overdue',
                                count: buckets.overdue.length,
                            },
                            {
                                value: 'done',
                                label: 'Done',
                                count: buckets.done.length,
                            },
                        ]}
                    />

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            applyFilter({});
                        }}
                        className="relative min-w-48 flex-1 sm:max-w-xs"
                    >
                        <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search tasks"
                            className="pl-8"
                        />
                    </form>

                    <NativeSelect
                        value={filters.project_id ?? ''}
                        onChange={(e) =>
                            applyFilter({
                                project_id: e.target.value
                                    ? Number(e.target.value)
                                    : null,
                            })
                        }
                        className="w-48"
                    >
                        <option value="">All projects</option>
                        {projects.map((project) => (
                            <option key={project.id} value={project.id}>
                                {project.name}
                            </option>
                        ))}
                    </NativeSelect>

                    <NativeSelect
                        value={filters.priority ?? ''}
                        onChange={(e) =>
                            applyFilter({
                                priority: (e.target.value ||
                                    null) as TaskPriority | null,
                            })
                        }
                        className="w-36"
                    >
                        <option value="">Any priority</option>
                        {PRIORITY_ORDER.map((priority) => (
                            <option key={priority} value={priority}>
                                {priorityMeta[priority].label}
                            </option>
                        ))}
                    </NativeSelect>

                    <NativeSelect
                        value={filters.status ?? ''}
                        onChange={(e) =>
                            applyFilter({
                                status: (e.target.value ||
                                    null) as TaskStatus | null,
                            })
                        }
                        className="w-36"
                    >
                        <option value="">Any status</option>
                        {STATUS_ORDER.map((status) => (
                            <option key={status} value={status}>
                                {statusMeta[status].label}
                            </option>
                        ))}
                    </NativeSelect>
                </div>

                <TaskTable
                    tasks={visible}
                    users={users}
                    canEdit={canEdit}
                    showProject
                    onOpenTask={(task) => setOpenTaskId(task.id)}
                    emptyMessage={
                        bucket === 'overdue'
                            ? 'Nothing overdue. Nice.'
                            : bucket === 'done'
                              ? 'No completed tasks yet.'
                              : 'No open tasks here.'
                    }
                />
            </div>

            <TaskDetailSheet
                task={openTask}
                users={users}
                canEdit={canEdit}
                onClose={() => setOpenTaskId(null)}
            />
        </>
    );
}
