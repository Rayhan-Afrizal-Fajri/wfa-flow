import {
    closestCorners,
    DndContext,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
    useDroppable,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type {
    DragEndEvent,
    DragOverEvent,
    DragStartEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { STATUS_ORDER, statusMeta } from '@/lib/domain';
import { cn } from '@/lib/utils';
import reorderRoute from '@/routes/projects/tasks';
import type { Task, TaskStatus, TeamMember } from '@/types';
import { TaskCard } from './task-card';

interface KanbanBoardProps {
    projectId: number;
    tasks: Task[];
    users: TeamMember[];
    canEdit?: boolean;
    onOpenTask?: (task: Task) => void;
    onAddTask?: (status: TaskStatus) => void;
}

type Columns = Record<TaskStatus, Task[]>;

function emptyColumns(): Columns {
    return { backlog: [], todo: [], in_progress: [], review: [], done: [] };
}

/** Groups tasks into board columns, preserving each column's sort_order. */
function groupByStatus(tasks: Task[]): Columns {
    const columns = emptyColumns();

    for (const task of tasks) {
        columns[task.status].push(task);
    }

    for (const status of STATUS_ORDER) {
        columns[status].sort(
            (a, b) => a.sort_order - b.sort_order || a.id - b.id,
        );
    }

    return columns;
}

/* ----------------------------- sortable card ----------------------------- */

function SortableTaskCard({
    task,
    assignee,
    canEdit,
    onOpen,
}: {
    task: Task;
    assignee?: TeamMember | null;
    canEdit: boolean;
    onOpen?: (task: Task) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: task.id,
        disabled: !canEdit,
        data: { type: 'task', status: task.status },
    });

    return (
        <TaskCard
            ref={setNodeRef}
            task={task}
            assignee={assignee}
            dragging={isDragging}
            onOpen={onOpen}
            style={{
                transform: CSS.Translate.toString(transform),
                transition,
            }}
            handleProps={canEdit ? { ...attributes, ...listeners } : undefined}
        />
    );
}

/* ------------------------------- column ---------------------------------- */

function Column({
    status,
    tasks,
    users,
    canEdit,
    onOpenTask,
    onAddTask,
}: {
    status: TaskStatus;
    tasks: Task[];
    users: TeamMember[];
    canEdit: boolean;
    onOpenTask?: (task: Task) => void;
    onAddTask?: (status: TaskStatus) => void;
}) {
    const { setNodeRef, isOver } = useDroppable({
        id: `col-${status}`,
        data: { type: 'column', status },
    });

    const meta = statusMeta[status];

    return (
        <div className="flex w-full min-w-0 flex-col">
            <div className="mb-3 flex items-center gap-2 px-1">
                <span className={cn('size-2 rounded-full', meta.dot)} />
                <h3 className="text-sm font-semibold">{meta.label}</h3>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
                    {tasks.length}
                </span>
                {canEdit && onAddTask && (
                    <button
                        type="button"
                        onClick={() => onAddTask(status)}
                        aria-label={`Add task to ${meta.label}`}
                        className="ml-auto rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                )}
            </div>

            <div
                ref={setNodeRef}
                className={cn(
                    'flex min-h-32 flex-1 flex-col gap-2 rounded-xl border border-dashed border-transparent p-1.5 transition-colors',
                    isOver && 'border-primary/40 bg-primary/5',
                )}
            >
                <SortableContext
                    items={tasks.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {tasks.map((task) => (
                        <SortableTaskCard
                            key={task.id}
                            task={task}
                            canEdit={canEdit}
                            onOpen={onOpenTask}
                            assignee={users.find(
                                (u) => u.id === task.assignee_id,
                            )}
                        />
                    ))}
                </SortableContext>

                {tasks.length === 0 && (
                    <p className="px-2 py-6 text-center text-xs text-muted-foreground/70">
                        {canEdit ? 'Drop tasks here' : 'Nothing here'}
                    </p>
                )}
            </div>
        </div>
    );
}

/* ------------------------------- board ----------------------------------- */

export function KanbanBoard({
    projectId,
    tasks,
    users,
    canEdit = true,
    onOpenTask,
    onAddTask,
}: KanbanBoardProps) {
    const [activeId, setActiveId] = useState<number | null>(null);

    /**
     * While a drag is in flight the board renders from this local snapshot so
     * cards follow the cursor without waiting for a round trip. It is cleared
     * once the server prop catches up.
     */
    const [draft, setDraft] = useState<Columns | null>(null);

    const serverColumns = useMemo(() => groupByStatus(tasks), [tasks]);
    const columns = draft ?? serverColumns;

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    const activeTask = useMemo(
        () =>
            activeId === null
                ? null
                : (STATUS_ORDER.flatMap((s) => columns[s]).find(
                      (t) => t.id === activeId,
                  ) ?? null),
        [activeId, columns],
    );

    /** Resolves a drag id (card or empty column) to the column it belongs to. */
    const columnOf = useCallback(
        (id: string | number, source: Columns): TaskStatus | null => {
            if (typeof id === 'string' && id.startsWith('col-')) {
                return id.slice(4) as TaskStatus;
            }

            return (
                STATUS_ORDER.find((status) =>
                    source[status].some((task) => task.id === Number(id)),
                ) ?? null
            );
        },
        [],
    );

    function handleDragStart(event: DragStartEvent) {
        setActiveId(Number(event.active.id));
        setDraft(serverColumns);
    }

    function handleDragOver(event: DragOverEvent) {
        const { active, over } = event;

        if (!over) {
            return;
        }

        setDraft((current) => {
            const source = current ?? serverColumns;
            const from = columnOf(active.id, source);
            const to = columnOf(over.id, source);

            if (!from || !to || from === to) {
                return source;
            }

            const moving = source[from].find((t) => t.id === Number(active.id));

            if (!moving) {
                return source;
            }

            const overIndex = source[to].findIndex(
                (t) => t.id === Number(over.id),
            );

            const next = { ...source };
            next[from] = source[from].filter((t) => t.id !== moving.id);
            next[to] = [...source[to]];
            next[to].splice(overIndex >= 0 ? overIndex : next[to].length, 0, {
                ...moving,
                status: to,
            });

            return next;
        });
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setActiveId(null);

        if (!over) {
            setDraft(null);

            return;
        }

        const source = draft ?? serverColumns;
        const column = columnOf(over.id, source);
        const from = columnOf(active.id, source);

        if (!column || !from) {
            setDraft(null);

            return;
        }

        // Final in-column ordering after the pointer settles.
        let settled = source;

        if (from === column) {
            const oldIndex = source[column].findIndex(
                (t) => t.id === Number(active.id),
            );
            const newIndex = source[column].findIndex(
                (t) => t.id === Number(over.id),
            );

            if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                settled = {
                    ...source,
                    [column]: arrayMove(source[column], oldIndex, newIndex),
                };
                setDraft(settled);
            }
        }

        const payload = STATUS_ORDER.flatMap((status) =>
            settled[status].map((task, index) => ({
                id: task.id,
                status,
                sort_order: index,
            })),
        ).filter((row) => {
            const original = tasks.find((t) => t.id === row.id);

            return (
                original &&
                (original.status !== row.status ||
                    original.sort_order !== row.sort_order)
            );
        });

        if (payload.length === 0) {
            setDraft(null);

            return;
        }

        router.put(
            reorderRoute.reorder.url(projectId),
            { tasks: payload },
            {
                preserveScroll: true,
                preserveState: true,
                // Hold the optimistic layout until the refreshed props land,
                // then hand rendering back to the server data.
                onFinish: () => setDraft(null),
            },
        );
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={() => {
                setActiveId(null);
                setDraft(null);
            }}
        >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                {STATUS_ORDER.map((status) => (
                    <Column
                        key={status}
                        status={status}
                        tasks={columns[status]}
                        users={users}
                        canEdit={canEdit}
                        onOpenTask={onOpenTask}
                        onAddTask={onAddTask}
                    />
                ))}
            </div>

            <DragOverlay
                dropAnimation={{
                    duration: 180,
                    easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
                }}
            >
                {activeTask ? (
                    <TaskCard
                        task={activeTask}
                        assignee={users.find(
                            (u) => u.id === activeTask.assignee_id,
                        )}
                        overlay
                    />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
