import { router, usePage } from '@inertiajs/react';
import { Bell, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatRelative } from '@/lib/domain';
import { cn } from '@/lib/utils';
import notifications from '@/routes/notifications';
import type { AppNotification } from '@/types';

type NotificationProps = {
    notifications?: {
        unread_count: number;
        items: AppNotification[];
    };
};

export function NotificationsMenu() {
    const bag = usePage<NotificationProps>().props.notifications;
    const items = bag?.items ?? [];
    const unread = bag?.unread_count ?? 0;

    function open(notification: AppNotification) {
        if (!notification.read_at) {
            router.put(
                notifications.read.url(notification.id),
                {},
                { preserveScroll: true, preserveState: true },
            );
        }

        if (notification.url) {
            router.visit(notification.url);
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label={
                        unread > 0
                            ? `Notifications, ${unread} unread`
                            : 'Notifications'
                    }
                    className="relative"
                >
                    <Bell className="h-4 w-4" />
                    {unread > 0 && (
                        <span className="absolute top-1 right-1 inline-flex min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] leading-4 font-semibold text-danger-foreground tabular-nums">
                            {unread > 9 ? '9+' : unread}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between gap-2">
                    Notifications
                    {unread > 0 && (
                        <button
                            type="button"
                            onClick={() =>
                                router.put(
                                    notifications.readAll.url(),
                                    {},
                                    {
                                        preserveScroll: true,
                                        preserveState: true,
                                    },
                                )
                            }
                            className="inline-flex items-center gap-1 text-xs font-normal text-muted-foreground hover:text-foreground"
                        >
                            <CheckCheck className="h-3.5 w-3.5" />
                            Mark all read
                        </button>
                    )}
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <div className="max-h-96 overflow-y-auto">
                    {items.map((notification) => (
                        <DropdownMenuItem
                            key={notification.id}
                            onSelect={() => open(notification)}
                            className={cn(
                                'flex cursor-pointer flex-col items-start gap-0.5 py-2',
                                !notification.read_at && 'bg-primary/5',
                            )}
                        >
                            <div className="flex w-full items-center gap-2">
                                {!notification.read_at && (
                                    <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                                )}
                                <span className="truncate text-xs font-semibold">
                                    {notification.title}
                                </span>
                                <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
                                    {formatRelative(notification.created_at)}
                                </span>
                            </div>
                            <p className="line-clamp-2 text-xs text-wrap text-muted-foreground">
                                {notification.message}
                            </p>
                        </DropdownMenuItem>
                    ))}

                    {items.length === 0 && (
                        <p className="px-2 py-8 text-center text-sm text-muted-foreground">
                            You&apos;re all caught up.
                        </p>
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
