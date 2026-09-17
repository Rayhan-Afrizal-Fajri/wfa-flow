import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import {
    PRIORITY_ORDER,
    priorityMeta,
    STATUS_ORDER,
    statusMeta,
    TYPE_ORDER,
    typeMeta,
} from '@/lib/domain';
import tasksRoute from '@/routes/tasks';
import type { TaskStatus, TeamMember } from '@/types';

export function CreateTaskDialog({
    projectId,
    users,
    open,
    defaultStatus = 'todo',
    defaultDueDate,
    onOpenChange,
}: {
    projectId: number;
    users: TeamMember[];
    open: boolean;
    defaultStatus?: TaskStatus;
    defaultDueDate?: string | null;
    onOpenChange: (open: boolean) => void;
}) {
    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            project_id: projectId,
            title: '',
            description: '',
            status: defaultStatus as TaskStatus,
            priority: 'medium',
            type: 'feature',
            assignee_id: '' as number | '',
            start_date: '',
            due_date: '',
        });

    // The board's per-column "+" button decides which column we land in.
    useEffect(() => {
        if (open) {
            setData('status', defaultStatus);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, defaultStatus]);

    function close() {
        onOpenChange(false);
        reset();
        clearErrors();
    }

    function submit(event: React.FormEvent) {
        event.preventDefault();

        post(tasksRoute.store.url(), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onOpenChange(false);
            },
        });
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => (next ? onOpenChange(true) : close())}
        >
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <form onSubmit={submit}>
                    <DialogHeader>
                        <DialogTitle>New task</DialogTitle>
                        <DialogDescription>
                            Add a one-off task to this project.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-5 sm:grid-cols-2">
                        <div className="space-y-1.5 sm:col-span-2">
                            <Label htmlFor="task-title">Title</Label>
                            <Input
                                id="task-title"
                                value={data.title}
                                onChange={(e) =>
                                    setData('title', e.target.value)
                                }
                                placeholder="Cart & checkout flow"
                                aria-invalid={!!errors.title}
                                autoFocus
                            />
                            <InputError message={errors.title} />
                        </div>

                        <div className="space-y-1.5 sm:col-span-2">
                            <Label htmlFor="task-description">
                                Description{' '}
                                <span className="font-normal text-muted-foreground">
                                    (optional)
                                </span>
                            </Label>
                            <Textarea
                                id="task-description"
                                rows={3}
                                value={data.description}
                                onChange={(e) =>
                                    setData('description', e.target.value)
                                }
                            />
                            <InputError message={errors.description} />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="task-status">Status</Label>
                            <NativeSelect
                                id="task-status"
                                value={data.status}
                                onChange={(e) =>
                                    setData(
                                        'status',
                                        e.target.value as TaskStatus,
                                    )
                                }
                            >
                                {STATUS_ORDER.map((status) => (
                                    <option key={status} value={status}>
                                        {statusMeta[status].label}
                                    </option>
                                ))}
                            </NativeSelect>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="task-assignee">Assignee</Label>
                            <NativeSelect
                                id="task-assignee"
                                value={data.assignee_id}
                                onChange={(e) =>
                                    setData(
                                        'assignee_id',
                                        e.target.value
                                            ? Number(e.target.value)
                                            : '',
                                    )
                                }
                            >
                                <option value="">Unassigned</option>
                                {users.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.name}
                                    </option>
                                ))}
                            </NativeSelect>
                            <InputError message={errors.assignee_id} />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="task-priority">Priority</Label>
                            <NativeSelect
                                id="task-priority"
                                value={data.priority}
                                onChange={(e) =>
                                    setData('priority', e.target.value)
                                }
                            >
                                {PRIORITY_ORDER.map((priority) => (
                                    <option key={priority} value={priority}>
                                        {priorityMeta[priority].label}
                                    </option>
                                ))}
                            </NativeSelect>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="task-type">Type</Label>
                            <NativeSelect
                                id="task-type"
                                value={data.type}
                                onChange={(e) =>
                                    setData('type', e.target.value)
                                }
                            >
                                {TYPE_ORDER.map((type) => (
                                    <option key={type} value={type}>
                                        {typeMeta[type].label}
                                    </option>
                                ))}
                            </NativeSelect>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="task-start">Start date</Label>
                            <Input
                                id="task-start"
                                type="date"
                                value={data.start_date}
                                onChange={(e) =>
                                    setData('start_date', e.target.value)
                                }
                            />
                            <InputError message={errors.start_date} />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="task-due">Due date</Label>
                            <Input
                                id="task-due"
                                type="date"
                                min={data.start_date || undefined}
                                max={defaultDueDate ?? undefined}
                                value={data.due_date}
                                onChange={(e) =>
                                    setData('due_date', e.target.value)
                                }
                                aria-invalid={!!errors.due_date}
                            />
                            <InputError message={errors.due_date} />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={close}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Adding…' : 'Add task'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
