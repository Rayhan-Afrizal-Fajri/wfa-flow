import type {
    ProjectCategory,
    ProjectRole,
    ProjectStatus,
    TaskPriority,
    TaskStatus,
    TaskType,
} from '@/types';

/* -------------------------------------------------------------------------- */
/*  Task status                                                                */
/* -------------------------------------------------------------------------- */

/** Board column order, left to right. Mirrors App\Enums\TaskStatus::board(). */
export const STATUS_ORDER: TaskStatus[] = [
    'backlog',
    'todo',
    'in_progress',
    'review',
    'done',
];

export const statusMeta: Record<
    TaskStatus,
    { label: string; dot: string; badge: string }
> = {
    backlog: {
        label: 'Backlog',
        dot: 'bg-muted-foreground/50',
        badge: 'bg-muted/70 text-muted-foreground border-transparent',
    },
    todo: {
        label: 'To Do',
        dot: 'bg-muted-foreground',
        badge: 'bg-muted text-muted-foreground border-transparent',
    },
    in_progress: {
        label: 'In Progress',
        dot: 'bg-info',
        badge: 'bg-info/10 text-info-strong border-transparent',
    },
    review: {
        label: 'Review',
        dot: 'bg-warning',
        badge: 'bg-warning/15 text-warning-strong border-transparent',
    },
    done: {
        label: 'Done',
        dot: 'bg-success',
        badge: 'bg-success/10 text-success-strong border-transparent',
    },
};

/* -------------------------------------------------------------------------- */
/*  Task priority                                                              */
/* -------------------------------------------------------------------------- */

export const PRIORITY_ORDER: TaskPriority[] = [
    'low',
    'medium',
    'high',
    'urgent',
];

export const priorityRank: Record<TaskPriority, number> = {
    low: 0,
    medium: 1,
    high: 2,
    urgent: 3,
};

export const priorityMeta: Record<
    TaskPriority,
    { label: string; badge: string; bar: string }
> = {
    low: {
        label: 'Low',
        badge: 'bg-muted text-muted-foreground border-transparent',
        bar: 'bg-muted-foreground/40',
    },
    medium: {
        label: 'Medium',
        badge: 'bg-info/10 text-info-strong border-transparent',
        bar: 'bg-info',
    },
    high: {
        label: 'High',
        badge: 'bg-warning/15 text-warning-strong border-transparent',
        bar: 'bg-warning',
    },
    urgent: {
        label: 'Urgent',
        badge: 'bg-danger/10 text-danger-strong border-transparent',
        bar: 'bg-danger',
    },
};

/* -------------------------------------------------------------------------- */
/*  Task type                                                                  */
/* -------------------------------------------------------------------------- */

export const TYPE_ORDER: TaskType[] = [
    'feature',
    'setup',
    'revision',
    'maintenance',
];

export const typeMeta: Record<TaskType, { label: string }> = {
    feature: { label: 'Feature' },
    setup: { label: 'Setup' },
    revision: { label: 'Revision' },
    maintenance: { label: 'Maintenance' },
};

/* -------------------------------------------------------------------------- */
/*  Project                                                                    */
/* -------------------------------------------------------------------------- */

export const CATEGORY_ORDER: ProjectCategory[] = ['web_app', 'ads_opt'];

export const projectCategoryMeta: Record<ProjectCategory, { label: string }> = {
    web_app: { label: 'Web App' },
    ads_opt: { label: 'Ads Optimization' },
};

export const PROJECT_STATUS_ORDER: ProjectStatus[] = [
    'onboarding',
    'in_progress',
    'review',
    'completed',
    'closed',
    'cancelled',
];

export const projectStatusMeta: Record<
    ProjectStatus,
    { label: string; badge: string; dot: string }
> = {
    onboarding: {
        label: 'Onboarding',
        badge: 'bg-info/10 text-info-strong border-transparent',
        dot: 'bg-info',
    },
    in_progress: {
        label: 'In Progress',
        badge: 'bg-success/10 text-success-strong border-transparent',
        dot: 'bg-success',
    },
    review: {
        label: 'Review',
        badge: 'bg-warning/15 text-warning-strong border-transparent',
        dot: 'bg-warning',
    },
    completed: {
        label: 'Completed',
        badge: 'bg-muted text-muted-foreground border-transparent',
        dot: 'bg-muted-foreground',
    },
    cancelled: {
        label: 'Cancelled',
        badge: 'bg-danger/10 text-danger-strong border-transparent',
        dot: 'bg-danger',
    },
    closed: {
        label: 'Closed',
        badge: 'bg-muted text-muted-foreground border-transparent',
        dot: 'bg-muted-foreground',
    },
};

/** Statuses that still consume team capacity. */
export const OPEN_PROJECT_STATUSES: ProjectStatus[] = [
    'onboarding',
    'in_progress',
    'review',
];

export const projectRoleMeta: Record<
    ProjectRole,
    { label: string; hint: string }
> = {
    manager: { label: 'Manager', hint: 'Full control, including members' },
    member: { label: 'Member', hint: 'Can create and edit tasks' },
    viewer: { label: 'Viewer', hint: 'Read-only access' },
};

/* -------------------------------------------------------------------------- */
/*  Dates                                                                      */
/*                                                                             */
/*  All dates come from the backend as plain `YYYY-MM-DD` strings. Parsing      */
/*  them with an explicit midnight keeps them in the viewer's local timezone    */
/*  instead of shifting a day at UTC boundaries.                               */
/* -------------------------------------------------------------------------- */

export function parseDate(iso: string): Date {
    return new Date(`${iso.slice(0, 10)}T00:00:00`);
}

function today(): Date {
    const now = new Date();

    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function formatDate(iso: string | null | undefined): string {
    if (!iso) {
        return '—';
    }

    return parseDate(iso).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
    });
}

export function formatFullDate(iso: string | null | undefined): string {
    if (!iso) {
        return '—';
    }

    return parseDate(iso).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

export function formatDateTime(iso: string | null | undefined): string {
    if (!iso) {
        return '—';
    }

    return new Date(iso).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

/** Compact "2h ago" / "3d ago" label for activity feeds and comments. */
export function formatRelative(iso: string | null | undefined): string {
    if (!iso) {
        return '';
    }

    const diffMs = Date.now() - new Date(iso).getTime();
    const minutes = Math.round(diffMs / 60_000);

    if (minutes < 1) {
        return 'just now';
    }

    if (minutes < 60) {
        return `${minutes}m ago`;
    }

    const hours = Math.round(minutes / 60);

    if (hours < 24) {
        return `${hours}h ago`;
    }

    const days = Math.round(hours / 24);

    if (days < 30) {
        return `${days}d ago`;
    }

    return formatDate(iso);
}

/** Days from today to the given date (negative = overdue). */
export function daysUntil(iso: string | null | undefined): number {
    if (!iso) {
        return Number.POSITIVE_INFINITY;
    }

    return Math.round(
        (parseDate(iso).getTime() - today().getTime()) / 86_400_000,
    );
}

export type DueTone = 'muted' | 'warning' | 'danger';

export function dueMeta(
    iso: string | null | undefined,
    done: boolean,
): { tone: DueTone; label: string } {
    if (!iso) {
        return { tone: 'muted', label: 'No due date' };
    }

    if (done) {
        return { tone: 'muted', label: formatDate(iso) };
    }

    const diff = daysUntil(iso);

    if (diff < 0) {
        return { tone: 'danger', label: `${Math.abs(diff)}d overdue` };
    }

    if (diff === 0) {
        return { tone: 'warning', label: 'Due today' };
    }

    if (diff === 1) {
        return { tone: 'warning', label: 'Due tomorrow' };
    }

    if (diff <= 3) {
        return { tone: 'warning', label: formatDate(iso) };
    }

    return { tone: 'muted', label: formatDate(iso) };
}

export const dueToneClass: Record<DueTone, string> = {
    muted: 'text-muted-foreground',
    warning: 'text-warning-strong',
    danger: 'text-danger-strong',
};

/** Deadline label for a whole project, which has no "done" flag of its own. */
export function deadlineMeta(iso: string, status: ProjectStatus) {
    const closed = !OPEN_PROJECT_STATUSES.includes(status);
    const diff = daysUntil(iso);

    if (closed) {
        return { tone: 'muted' as DueTone, label: formatDate(iso) };
    }

    if (diff < 0) {
        return {
            tone: 'danger' as DueTone,
            label: `${Math.abs(diff)}d overdue`,
        };
    }

    if (diff === 0) {
        return { tone: 'warning' as DueTone, label: 'Due today' };
    }

    if (diff <= 7) {
        return { tone: 'warning' as DueTone, label: `${diff}d left` };
    }

    return { tone: 'muted' as DueTone, label: `Due ${formatDate(iso)}` };
}

/** Today as `YYYY-MM-DD`, for date inputs. */
export function todayISO(): string {
    const now = today();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${now.getFullYear()}-${month}-${day}`;
}
