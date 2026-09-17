import {
    priorityMeta,
    projectCategoryMeta,
    projectStatusMeta,
    statusMeta,
    typeMeta,
} from '@/lib/domain';
import { cn } from '@/lib/utils';
import type {
    ProjectCategory,
    ProjectStatus,
    TaskPriority,
    TaskStatus,
    TaskType,
} from '@/types';

const base =
    'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap';

export function StatusBadge({
    status,
    className,
}: {
    status: TaskStatus;
    className?: string;
}) {
    const meta = statusMeta[status];

    return (
        <span className={cn(base, meta.badge, className)}>
            <span className={cn('size-1.5 rounded-full', meta.dot)} />
            {meta.label}
        </span>
    );
}

export function PriorityBadge({
    priority,
    className,
}: {
    priority: TaskPriority;
    className?: string;
}) {
    const meta = priorityMeta[priority];

    return (
        <span className={cn(base, meta.badge, className)}>
            <span className={cn('h-2.5 w-1 rounded-full', meta.bar)} />
            {meta.label}
        </span>
    );
}

export function TypeBadge({
    type,
    className,
}: {
    type: TaskType;
    className?: string;
}) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-md border border-border bg-transparent px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap text-muted-foreground',
                className,
            )}
        >
            {typeMeta[type].label}
        </span>
    );
}

export function ProjectStatusBadge({
    status,
    className,
}: {
    status: ProjectStatus;
    className?: string;
}) {
    const meta = projectStatusMeta[status];

    return (
        <span className={cn(base, meta.badge, className)}>{meta.label}</span>
    );
}

export function CategoryBadge({
    category,
    className,
}: {
    category: ProjectCategory;
    className?: string;
}) {
    return (
        <span
            className={cn(
                'text-[11px] font-medium tracking-wider whitespace-nowrap text-muted-foreground uppercase',
                className,
            )}
        >
            {projectCategoryMeta[category].label}
        </span>
    );
}
