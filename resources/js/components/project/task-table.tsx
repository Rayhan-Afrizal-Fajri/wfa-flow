import { router } from '@inertiajs/react';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { Fragment, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { PriorityBadge, TypeBadge } from '@/components/domain/badges';
import { Assignee } from '@/components/ui/avatar';
import {
    daysUntil,
    dueMeta,
    dueToneClass,
    priorityRank,
    STATUS_ORDER,
} from '@/lib/domain';
import { cn } from '@/lib/utils';
import taskStatus from '@/routes/tasks/status';
import type { Task, TaskStatus, TeamMember } from '@/types';
import { StatusSelect } from './status-select';

type SortDirection = 'asc' | 'desc';

type Column = {
    id: string;
    header: string;
    /** Sort key; omitted for columns that cannot be ordered (e.g. assignee). */
    sortValue?: (task: Task) => number | string;
    cell: (task: Task) => ReactNode;
    headerClassName?: string;
};

export function TaskTable({
    tasks,
    users,
    canEdit = true,
    showProject = false,
    onOpenTask,
    emptyMessage = 'No tasks yet.',
}: {
    tasks: Task[];
    users: TeamMember[];
    canEdit?: boolean;
    showProject?: boolean;
    onOpenTask?: (task: Task) => void;
    emptyMessage?: string;
}) {
    const [sort, setSort] = useState<{ id: string; dir: SortDirection }>({
        id: 'status',
        dir: 'asc',
    });

    /**
     * Optimistic status overrides, keyed by task id. They are dropped as soon
     * as the request finishes and the server props take over.
     */
    const [override, setOverride] = useState<Record<number, TaskStatus>>({});

    function clearOverride(id: number) {
        setOverride((prev) => {
            const next = { ...prev };
            delete next[id];

            return next;
        });
    }

    function updateStatus(id: number, status: TaskStatus) {
        setOverride((prev) => ({ ...prev, [id]: status }));

        router.put(
            taskStatus.update.url(id),
            { status },
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => clearOverride(id),
            },
        );
    }

    const columns = useMemo<Column[]>(() => {
        const base: Column[] = [
            {
                id: 'title',
                header: 'Task',
                sortValue: (task) => task.title.toLowerCase(),
                cell: (task) => (
                    <div className="flex min-w-0 items-center gap-2.5">
                        <button
                            type="button"
                            onClick={() => onOpenTask?.(task)}
                            className="truncate text-left font-medium text-pretty hover:text-primary"
                        >
                            {task.title}
                        </button>
                        <TypeBadge type={task.type} />
                    </div>
                ),
            },
        ];

        if (showProject) {
            base.push({
                id: 'project',
                header: 'Project',
                sortValue: (task) => task.project?.name?.toLowerCase() ?? '',
                cell: (task) => (
                    <span className="text-sm whitespace-nowrap text-muted-foreground">
                        {task.project?.name ?? '—'}
                    </span>
                ),
            });
        }

        base.push(
            {
                id: 'status',
                header: 'Status',
                sortValue: (task) => STATUS_ORDER.indexOf(task.status),
                cell: (task) => (
                    <StatusSelect
                        value={task.status}
                        disabled={!canEdit}
                        onChange={(status) => updateStatus(task.id, status)}
                    />
                ),
            },
            {
                id: 'priority',
                header: 'Priority',
                sortValue: (task) => priorityRank[task.priority],
                cell: (task) => <PriorityBadge priority={task.priority} />,
            },
            {
                id: 'assignee',
                header: 'Assignee',
                cell: (task) => {
                    const user =
                        task.assignee ??
                        users.find((u) => u.id === task.assignee_id);

                    if (!user) {
                        return (
                            <span className="text-sm text-muted-foreground/70">
                                Unassigned
                            </span>
                        );
                    }

                    return (
                        <div className="flex items-center gap-2">
                            <Assignee
                                name={user.name}
                                src={user.avatar}
                                size="sm"
                            />
                            <span className="text-sm whitespace-nowrap text-muted-foreground">
                                {user.name}
                            </span>
                        </div>
                    );
                },
            },
            {
                id: 'due_date',
                header: 'Due',
                sortValue: (task) => daysUntil(task.due_date),
                cell: (task) => {
                    const due = dueMeta(task.due_date, task.status === 'done');

                    return (
                        <span
                            className={cn(
                                'text-sm font-medium whitespace-nowrap',
                                dueToneClass[due.tone],
                            )}
                        >
                            {due.label}
                        </span>
                    );
                },
            },
        );

        return base;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [users, canEdit, showProject, onOpenTask]);

    const rows = useMemo(() => {
        const withOverrides = tasks.map((task) =>
            override[task.id] ? { ...task, status: override[task.id] } : task,
        );

        const column = columns.find((c) => c.id === sort.id);

        if (!column?.sortValue) {
            return withOverrides;
        }

        const { sortValue } = column;
        const direction = sort.dir === 'asc' ? 1 : -1;

        return [...withOverrides].sort((a, b) => {
            const left = sortValue(a);
            const right = sortValue(b);

            if (left === right) {
                return a.id - b.id;
            }

            return (left > right ? 1 : -1) * direction;
        });
    }, [tasks, override, columns, sort]);

    function toggleSort(id: string) {
        setSort((current) =>
            current.id === id
                ? { id, dir: current.dir === 'asc' ? 'desc' : 'asc' }
                : { id, dir: 'asc' },
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                    <thead>
                        <tr className="border-b border-border bg-muted/40">
                            {columns.map((column) => (
                                <th
                                    key={column.id}
                                    className={cn(
                                        'px-4 py-3',
                                        column.headerClassName,
                                    )}
                                    aria-sort={
                                        sort.id === column.id
                                            ? sort.dir === 'asc'
                                                ? 'ascending'
                                                : 'descending'
                                            : undefined
                                    }
                                >
                                    {column.sortValue ? (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                toggleSort(column.id)
                                            }
                                            className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase transition-colors hover:text-foreground"
                                        >
                                            {column.header}
                                            {sort.id !== column.id ? (
                                                <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
                                            ) : sort.dir === 'asc' ? (
                                                <ArrowUp className="h-3.5 w-3.5" />
                                            ) : (
                                                <ArrowDown className="h-3.5 w-3.5" />
                                            )}
                                        </button>
                                    ) : (
                                        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                            {column.header}
                                        </span>
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {rows.map((task) => (
                            <tr
                                key={task.id}
                                className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/30"
                            >
                                {columns.map((column) => (
                                    <td key={column.id} className="px-4 py-2.5">
                                        <Fragment>{column.cell(task)}</Fragment>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {rows.length === 0 && (
                <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                    {emptyMessage}
                </p>
            )}
        </div>
    );
}
