import {
    CheckCircle2,
    FolderPlus,
    MessageSquare,
    Pencil,
    Trash2,
    UserPlus,
    UserMinus,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Assignee } from '@/components/ui/avatar';
import { formatRelative } from '@/lib/domain';
import { cn } from '@/lib/utils';
import type { Activity } from '@/types';

const EVENT_ICONS: Record<string, { icon: LucideIcon; tone: string }> = {
    'project.created': { icon: FolderPlus, tone: 'text-primary' },
    'project.updated': { icon: Pencil, tone: 'text-muted-foreground' },
    'project.member_added': { icon: UserPlus, tone: 'text-info' },
    'project.member_removed': {
        icon: UserMinus,
        tone: 'text-muted-foreground',
    },
    'task.created': { icon: FolderPlus, tone: 'text-info' },
    'task.updated': { icon: Pencil, tone: 'text-muted-foreground' },
    'task.status_changed': { icon: CheckCircle2, tone: 'text-success' },
    'task.commented': { icon: MessageSquare, tone: 'text-muted-foreground' },
    'task.deleted': { icon: Trash2, tone: 'text-danger' },
};

export function ActivityFeed({
    activities,
    limit,
    className,
    emptyMessage = 'Nothing has happened yet.',
}: {
    activities: Activity[];
    limit?: number;
    className?: string;
    emptyMessage?: string;
}) {
    const items = limit ? activities.slice(0, limit) : activities;

    if (items.length === 0) {
        return (
            <p className={cn('text-sm text-muted-foreground', className)}>
                {emptyMessage}
            </p>
        );
    }

    return (
        <ul className={cn('space-y-3', className)}>
            {items.map((activity) => {
                const meta = EVENT_ICONS[activity.event] ?? {
                    icon: Pencil,
                    tone: 'text-muted-foreground',
                };
                const Icon = meta.icon;

                return (
                    <li key={activity.id} className="flex gap-3">
                        <div className="relative mt-0.5">
                            {activity.causer ? (
                                <Assignee
                                    name={activity.causer.name}
                                    src={activity.causer.avatar}
                                    size="sm"
                                    ring={false}
                                />
                            ) : (
                                <span className="inline-flex size-6 items-center justify-center rounded-full bg-muted">
                                    <Icon className="h-3 w-3 text-muted-foreground" />
                                </span>
                            )}
                            <span className="absolute -right-1 -bottom-1 inline-flex size-3.5 items-center justify-center rounded-full bg-card">
                                <Icon className={cn('h-3 w-3', meta.tone)} />
                            </span>
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="text-sm text-pretty">
                                <span className="font-medium">
                                    {activity.causer?.name ?? 'System'}
                                </span>{' '}
                                <span className="text-muted-foreground">
                                    {activity.description}
                                </span>
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                {formatRelative(activity.created_at)}
                            </p>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}
