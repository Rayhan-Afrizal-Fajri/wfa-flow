import { router, useForm, usePage } from '@inertiajs/react';
import {
    CalendarDays,
    Loader2,
    Plus,
    Send,
    Trash2,
    UserRound,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Assignee } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Progress } from '@/components/ui/progress';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import {
    formatRelative,
    PRIORITY_ORDER,
    priorityMeta,
    TYPE_ORDER,
    typeMeta,
} from '@/lib/domain';
import { cn } from '@/lib/utils';
import tasksRoute from '@/routes/tasks';
import checklistRoute from '@/routes/tasks/checklist';
import commentsRoute from '@/routes/tasks/comments';
import type { Task, TaskStatus, TeamMember } from '@/types';
import { StatusSelect } from './status-select';

type PageProps = {
    tasks?: Task[];
    auth?: { user?: { id: number } | null };
};

export function TaskDetailSheet({
    task,
    users,
    canEdit,
    onClose,
}: {
    task: Task | null;
    users: TeamMember[];
    canEdit: boolean;
    onClose: () => void;
}) {
    const page = usePage<PageProps>();
    const currentUserId = page.props.auth?.user?.id;

    /**
     * The sheet always renders the freshest copy of the task from page props,
     * so a comment or checklist tick reflects immediately after the partial
     * reload without having to thread state back up to the page.
     */
    const live = useMemo(() => {
        if (!task) {
            return null;
        }

        return page.props.tasks?.find((t) => t.id === task.id) ?? task;
    }, [task, page.props.tasks]);

    if (!live) {
        return null;
    }

    return (
        <Sheet open onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-xl">
                <TaskDetailBody
                    key={live.id}
                    task={live}
                    users={users}
                    canEdit={canEdit}
                    currentUserId={currentUserId}
                    onClose={onClose}
                />
            </SheetContent>
        </Sheet>
    );
}

function TaskDetailBody({
    task,
    users,
    canEdit,
    currentUserId,
    onClose,
}: {
    task: Task;
    users: TeamMember[];
    canEdit: boolean;
    currentUserId?: number;
    onClose: () => void;
}) {
    /* -------------------------------------------------------------------- */
    /*  Details                                                              */
    /*                                                                       */
    /*  Keyed by task id from the parent, so opening a different task mounts  */
    /*  a fresh draft rather than syncing one through an effect.              */
    /* -------------------------------------------------------------------- */

    const [details, setDetails] = useState({
        title: task.title,
        description: task.description ?? '',
    });
    const [savingDetails, setSavingDetails] = useState(false);

    const detailsDirty =
        details.title !== task.title ||
        details.description !== (task.description ?? '');

    function patch(
        payload: Record<string, string | number | boolean | null>,
        onDone?: () => void,
    ) {
        router.put(tasksRoute.update.url(task.id), payload, {
            preserveScroll: true,
            preserveState: true,
            onFinish: onDone,
        });
    }

    function saveDetails() {
        if (!details.title.trim()) {
            return;
        }

        setSavingDetails(true);
        patch(
            { title: details.title.trim(), description: details.description },
            () => setSavingDetails(false),
        );
    }

    function remove() {
        if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) {
            return;
        }

        router.delete(tasksRoute.destroy.url(task.id), {
            preserveScroll: true,
            onSuccess: onClose,
        });
    }

    /* ------------------------------ checklist ----------------------------- */

    const checklist = task.checklist_items ?? [];
    const checklistDone = checklist.filter((item) => item.is_done).length;
    const [newItem, setNewItem] = useState('');

    function addChecklistItem(event: React.FormEvent) {
        event.preventDefault();
        const title = newItem.trim();

        if (!title) {
            return;
        }

        router.post(
            checklistRoute.store.url(task.id),
            { title },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => setNewItem(''),
            },
        );
    }

    /* ------------------------------- comments ----------------------------- */

    const comments = task.comments ?? [];
    const commentForm = useForm({ body: '' });

    function postComment(event: React.FormEvent) {
        event.preventDefault();

        if (!commentForm.data.body.trim()) {
            return;
        }

        commentForm.post(commentsRoute.store.url(task.id), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => commentForm.reset('body'),
        });
    }

    /* -------------------------------------------------------------------- */

    return (
        <>
            <SheetHeader className="gap-1 border-b border-border px-6 py-5">
                <SheetTitle className="pr-8 text-base leading-snug text-pretty">
                    {task.title}
                </SheetTitle>
                <SheetDescription>
                    {task.project?.name ? `${task.project.name} · ` : ''}
                    Created {formatRelative(task.created_at)}
                </SheetDescription>
            </SheetHeader>

            <div className="flex-1 space-y-6 px-6 py-5">
                {/* ------------------------------ meta ------------------------------ */}
                <section className="grid gap-4 sm:grid-cols-2">
                    <Field label="Status">
                        <StatusSelect
                            value={task.status}
                            disabled={!canEdit}
                            onChange={(status: TaskStatus) => patch({ status })}
                        />
                    </Field>

                    <Field label="Assignee">
                        <NativeSelect
                            value={task.assignee_id ?? ''}
                            disabled={!canEdit}
                            onChange={(e) =>
                                patch({
                                    assignee_id: e.target.value
                                        ? Number(e.target.value)
                                        : null,
                                })
                            }
                        >
                            <option value="">Unassigned</option>
                            {users.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.name}
                                </option>
                            ))}
                        </NativeSelect>
                    </Field>

                    <Field label="Priority">
                        <NativeSelect
                            value={task.priority}
                            disabled={!canEdit}
                            onChange={(e) =>
                                patch({ priority: e.target.value })
                            }
                        >
                            {PRIORITY_ORDER.map((priority) => (
                                <option key={priority} value={priority}>
                                    {priorityMeta[priority].label}
                                </option>
                            ))}
                        </NativeSelect>
                    </Field>

                    <Field label="Type">
                        <NativeSelect
                            value={task.type}
                            disabled={!canEdit}
                            onChange={(e) => patch({ type: e.target.value })}
                        >
                            {TYPE_ORDER.map((type) => (
                                <option key={type} value={type}>
                                    {typeMeta[type].label}
                                </option>
                            ))}
                        </NativeSelect>
                    </Field>

                    <Field label="Start date">
                        <Input
                            type="date"
                            value={task.start_date ?? ''}
                            disabled={!canEdit}
                            onChange={(e) =>
                                patch({ start_date: e.target.value || null })
                            }
                        />
                    </Field>

                    <Field label="Due date">
                        <Input
                            type="date"
                            value={task.due_date ?? ''}
                            disabled={!canEdit}
                            onChange={(e) =>
                                patch({ due_date: e.target.value || null })
                            }
                        />
                    </Field>
                </section>

                {/* --------------------------- title & notes -------------------------- */}
                <section className="space-y-3">
                    <Field label="Title">
                        <Input
                            value={details.title}
                            disabled={!canEdit}
                            onChange={(e) =>
                                setDetails((d) => ({
                                    ...d,
                                    title: e.target.value,
                                }))
                            }
                        />
                    </Field>

                    <Field label="Description">
                        <Textarea
                            rows={4}
                            value={details.description}
                            disabled={!canEdit}
                            placeholder="Add context, acceptance criteria, links…"
                            onChange={(e) =>
                                setDetails((d) => ({
                                    ...d,
                                    description: e.target.value,
                                }))
                            }
                        />
                    </Field>

                    {canEdit && detailsDirty && (
                        <div className="flex items-center gap-2">
                            <Button
                                size="sm"
                                onClick={saveDetails}
                                disabled={savingDetails}
                            >
                                {savingDetails && (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                )}
                                Save changes
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                    setDetails({
                                        title: task.title,
                                        description: task.description ?? '',
                                    })
                                }
                            >
                                Discard
                            </Button>
                        </div>
                    )}
                </section>

                {/* ----------------------------- checklist ---------------------------- */}
                <section className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold">Subtasks</h3>
                        {checklist.length > 0 && (
                            <span className="text-xs text-muted-foreground tabular-nums">
                                {checklistDone}/{checklist.length}
                            </span>
                        )}
                    </div>

                    {checklist.length > 0 && (
                        <Progress
                            value={(checklistDone / checklist.length) * 100}
                        />
                    )}

                    <ul className="space-y-1">
                        {checklist.map((item) => (
                            <li
                                key={item.id}
                                className="group flex items-center gap-2.5 rounded-md px-1 py-1.5 hover:bg-muted/50"
                            >
                                <Checkbox
                                    checked={item.is_done}
                                    disabled={!canEdit}
                                    onCheckedChange={(checked) =>
                                        router.put(
                                            checklistRoute.update.url([
                                                task.id,
                                                item.id,
                                            ]),
                                            { is_done: checked === true },
                                            {
                                                preserveScroll: true,
                                                preserveState: true,
                                            },
                                        )
                                    }
                                />
                                <span
                                    className={cn(
                                        'flex-1 text-sm',
                                        item.is_done &&
                                            'text-muted-foreground line-through',
                                    )}
                                >
                                    {item.title}
                                </span>
                                {canEdit && (
                                    <button
                                        type="button"
                                        aria-label={`Delete ${item.title}`}
                                        onClick={() =>
                                            router.delete(
                                                checklistRoute.destroy.url([
                                                    task.id,
                                                    item.id,
                                                ]),
                                                {
                                                    preserveScroll: true,
                                                    preserveState: true,
                                                },
                                            )
                                        }
                                        className="rounded p-1 text-muted-foreground/60 opacity-0 transition group-hover:opacity-100 hover:text-danger-strong"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>

                    {canEdit && (
                        <form
                            onSubmit={addChecklistItem}
                            className="flex items-center gap-2"
                        >
                            <Input
                                value={newItem}
                                onChange={(e) => setNewItem(e.target.value)}
                                placeholder="Add a subtask"
                                className="h-8"
                            />
                            <Button
                                type="submit"
                                size="sm"
                                variant="outline"
                                disabled={!newItem.trim()}
                            >
                                <Plus className="h-4 w-4" />
                                Add
                            </Button>
                        </form>
                    )}

                    {checklist.length === 0 && !canEdit && (
                        <p className="text-xs text-muted-foreground">
                            No subtasks.
                        </p>
                    )}
                </section>

                {/* ------------------------------ comments ---------------------------- */}
                <section className="space-y-3">
                    <h3 className="text-sm font-semibold">
                        Comments{' '}
                        {comments.length > 0 && (
                            <span className="font-normal text-muted-foreground tabular-nums">
                                ({comments.length})
                            </span>
                        )}
                    </h3>

                    <ul className="space-y-4">
                        {comments.map((comment) => (
                            <li key={comment.id} className="flex gap-3">
                                <Assignee
                                    name={comment.user?.name ?? '?'}
                                    src={comment.user?.avatar}
                                    size="sm"
                                    ring={false}
                                />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-sm font-medium">
                                            {comment.user?.name ?? 'Unknown'}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {formatRelative(comment.created_at)}
                                            {comment.edited_at && ' · edited'}
                                        </span>
                                        {(comment.can_manage ||
                                            comment.user_id ===
                                                currentUserId) && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    router.delete(
                                                        commentsRoute.destroy.url(
                                                            [
                                                                task.id,
                                                                comment.id,
                                                            ],
                                                        ),
                                                        {
                                                            preserveScroll: true,
                                                            preserveState: true,
                                                        },
                                                    )
                                                }
                                                className="ml-auto text-xs text-muted-foreground hover:text-danger-strong"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                    <p className="mt-0.5 text-sm text-pretty whitespace-pre-wrap">
                                        {comment.body}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>

                    {comments.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                            No comments yet. Start the thread.
                        </p>
                    )}

                    <form onSubmit={postComment} className="space-y-2">
                        <Textarea
                            rows={3}
                            value={commentForm.data.body}
                            onChange={(e) =>
                                commentForm.setData('body', e.target.value)
                            }
                            placeholder="Write a comment…"
                            aria-invalid={!!commentForm.errors.body}
                        />
                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                size="sm"
                                disabled={
                                    commentForm.processing ||
                                    !commentForm.data.body.trim()
                                }
                            >
                                <Send className="h-4 w-4" />
                                Comment
                            </Button>
                        </div>
                    </form>
                </section>

                {/* ------------------------------- footer ----------------------------- */}
                <section className="space-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
                    <p className="flex items-center gap-1.5">
                        <UserRound className="h-3.5 w-3.5" />
                        {task.assignee?.name ?? 'Unassigned'}
                    </p>
                    <p className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5" />
                        Updated {formatRelative(task.updated_at)}
                    </p>

                    {canEdit && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={remove}
                            className="mt-2 text-danger-strong hover:bg-danger/10 hover:text-danger-strong"
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete task
                        </Button>
                    )}
                </section>
            </div>
        </>
    );
}

function Field({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{label}</Label>
            {children}
        </div>
    );
}
