import { CheckSquare, GripVertical, MessageSquare } from 'lucide-react';
import { forwardRef } from 'react';
import type { CSSProperties, HTMLAttributes } from 'react';
import { PriorityBadge, TypeBadge } from '@/components/domain/badges';
import { Assignee } from '@/components/ui/avatar';
import { dueMeta, dueToneClass } from '@/lib/domain';
import { cn } from '@/lib/utils';
import type { Task, TeamMember } from '@/types';

interface TaskCardProps extends HTMLAttributes<HTMLDivElement> {
    task: Task;
    assignee?: TeamMember | null;
    dragging?: boolean;
    overlay?: boolean;
    onOpen?: (task: Task) => void;
    handleProps?: HTMLAttributes<HTMLButtonElement>;
    style?: CSSProperties;
}

export const TaskCard = forwardRef<HTMLDivElement, TaskCardProps>(
    function TaskCard(
        {
            task,
            assignee,
            dragging,
            overlay,
            onOpen,
            handleProps,
            className,
            style,
            ...rest
        },
        ref,
    ) {
        const due = dueMeta(task.due_date, task.status === 'done');
        const checklistTotal = task.checklist_total ?? 0;
        const checklistDone = task.checklist_done ?? 0;
        const commentCount = task.comments_count ?? 0;

        return (
            <div
                ref={ref}
                style={style}
                className={cn(
                    'group relative rounded-lg border border-border bg-card p-3 shadow-sm transition-shadow',
                    overlay
                        ? 'cursor-grabbing shadow-lg ring-1 ring-primary/30'
                        : 'hover:shadow-md',
                    dragging && 'opacity-40',
                    className,
                )}
                {...rest}
            >
                <div className="flex items-start gap-2">
                    <button
                        type="button"
                        aria-label={`Drag ${task.title}`}
                        className="mt-0.5 -ml-1 cursor-grab touch-none rounded p-0.5 text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100 hover:text-muted-foreground focus-visible:opacity-100 active:cursor-grabbing"
                        {...handleProps}
                    >
                        <GripVertical className="h-4 w-4" />
                    </button>

                    <button
                        type="button"
                        onClick={() => onOpen?.(task)}
                        className="flex-1 text-left text-sm leading-snug font-medium text-pretty hover:text-primary"
                    >
                        {task.title}
                    </button>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-1.5 pl-4">
                    <PriorityBadge priority={task.priority} />
                    <TypeBadge type={task.type} />
                </div>

                <div className="mt-3 flex items-center justify-between gap-2 pl-4">
                    <div className="flex min-w-0 items-center gap-2.5">
                        <span
                            className={cn(
                                'text-xs font-medium',
                                dueToneClass[due.tone],
                            )}
                        >
                            {due.label}
                        </span>

                        {checklistTotal > 0 && (
                            <span
                                title={`${checklistDone} of ${checklistTotal} subtasks done`}
                                className="inline-flex items-center gap-1 text-xs text-muted-foreground tabular-nums"
                            >
                                <CheckSquare className="h-3.5 w-3.5" />
                                {checklistDone}/{checklistTotal}
                            </span>
                        )}

                        {commentCount > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
                                <MessageSquare className="h-3.5 w-3.5" />
                                {commentCount}
                            </span>
                        )}
                    </div>

                    {assignee ? (
                        <Assignee
                            name={assignee.name}
                            src={assignee.avatar}
                            size="sm"
                        />
                    ) : null}
                </div>
            </div>
        );
    },
);
