import { useForm } from '@inertiajs/react';
import { Check, ListChecks, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
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
import { formatDate, projectCategoryMeta, todayISO } from '@/lib/domain';
import { cn } from '@/lib/utils';
import projects from '@/routes/projects';
import type { Client, ProjectTemplate, TeamMember } from '@/types';

export function CreateProjectDialog({
    templates,
    clients,
    users = [],
    triggerLabel = 'New Project',
    className,
}: {
    templates: ProjectTemplate[];
    clients: Client[];
    users?: TeamMember[];
    triggerLabel?: string;
    className?: string;
}) {
    const [open, setOpen] = useState(false);

    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            name: '',
            client_id: '' as number | '',
            template_id: (templates[0]?.id ?? '') as number | '',
            start_date: todayISO(),
            deadline: '',
            member_ids: [] as number[],
        });

    const selected = useMemo(
        () => templates.find((t) => t.id === data.template_id),
        [templates, data.template_id],
    );

    function close() {
        setOpen(false);
        reset();
        clearErrors();
    }

    function submit(event: React.FormEvent) {
        event.preventDefault();

        post(projects.store.url(), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setOpen(false);
            },
        });
    }

    function toggleMember(id: number) {
        setData(
            'member_ids',
            data.member_ids.includes(id)
                ? data.member_ids.filter((m) => m !== id)
                : [...data.member_ids, id],
        );
    }

    return (
        <>
            <Button className={className} onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4" />
                {triggerLabel}
            </Button>

            <Dialog
                open={open}
                onOpenChange={(next) => (next ? setOpen(true) : close())}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                    <form onSubmit={submit}>
                        <DialogHeader>
                            <DialogTitle>Create a new project</DialogTitle>
                            <DialogDescription>
                                Pick a template and we&apos;ll scaffold the
                                standard task checklist automatically.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-5 py-5 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label htmlFor="project-name">
                                    Project name
                                </Label>
                                <Input
                                    id="project-name"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                    placeholder="Northwind Storefront"
                                    aria-invalid={!!errors.name}
                                    autoFocus
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="project-client">Client</Label>
                                <NativeSelect
                                    id="project-client"
                                    value={data.client_id}
                                    onChange={(e) =>
                                        setData(
                                            'client_id',
                                            e.target.value
                                                ? Number(e.target.value)
                                                : '',
                                        )
                                    }
                                    aria-invalid={!!errors.client_id}
                                >
                                    <option value="">
                                        Internal (no client)
                                    </option>
                                    {clients.map((client) => (
                                        <option
                                            key={client.id}
                                            value={client.id}
                                        >
                                            {client.company_name}
                                        </option>
                                    ))}
                                </NativeSelect>
                                <InputError message={errors.client_id} />
                            </div>

                            <div className="space-y-1.5 sm:col-span-2">
                                <Label>Project template</Label>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {templates.map((template) => {
                                        const active =
                                            template.id === data.template_id;

                                        return (
                                            <button
                                                key={template.id}
                                                type="button"
                                                onClick={() =>
                                                    setData(
                                                        'template_id',
                                                        template.id,
                                                    )
                                                }
                                                className={cn(
                                                    'relative rounded-lg border p-3 text-left transition-colors',
                                                    active
                                                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                                        : 'border-border hover:border-muted-foreground/40',
                                                )}
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-sm font-semibold">
                                                        {template.name}
                                                    </span>
                                                    {active && (
                                                        <Check className="h-4 w-4 shrink-0 text-primary" />
                                                    )}
                                                </div>
                                                {template.description && (
                                                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                                        {template.description}
                                                    </p>
                                                )}
                                                <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                                                    <ListChecks className="h-3.5 w-3.5" />
                                                    {template.task_count ?? 0}{' '}
                                                    tasks ·{' '}
                                                    {
                                                        projectCategoryMeta[
                                                            template.category
                                                        ].label
                                                    }
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                                {templates.length === 0 && (
                                    <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
                                        No active templates yet. The project
                                        will be created empty.
                                    </p>
                                )}
                                <InputError message={errors.template_id} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="project-start">
                                    Start date
                                </Label>
                                <Input
                                    id="project-start"
                                    type="date"
                                    value={data.start_date}
                                    onChange={(e) =>
                                        setData('start_date', e.target.value)
                                    }
                                    aria-invalid={!!errors.start_date}
                                />
                                <InputError message={errors.start_date} />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="project-deadline">
                                    Deadline{' '}
                                    <span className="font-normal text-muted-foreground">
                                        (optional)
                                    </span>
                                </Label>
                                <Input
                                    id="project-deadline"
                                    type="date"
                                    value={data.deadline}
                                    min={data.start_date}
                                    onChange={(e) =>
                                        setData('deadline', e.target.value)
                                    }
                                    aria-invalid={!!errors.deadline}
                                />
                                <InputError message={errors.deadline} />
                            </div>

                            {users.length > 0 && (
                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label>Team</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {users.map((user) => {
                                            const active =
                                                data.member_ids.includes(
                                                    user.id,
                                                );

                                            return (
                                                <button
                                                    key={user.id}
                                                    type="button"
                                                    onClick={() =>
                                                        toggleMember(user.id)
                                                    }
                                                    className={cn(
                                                        'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                                                        active
                                                            ? 'border-primary bg-primary/10 text-primary'
                                                            : 'border-border text-muted-foreground hover:border-muted-foreground/40',
                                                    )}
                                                >
                                                    {user.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {selected && (
                                <div className="rounded-lg border border-border bg-muted/40 p-3 sm:col-span-2">
                                    <p className="text-xs text-muted-foreground">
                                        Creating this project will generate{' '}
                                        <span className="font-semibold text-foreground">
                                            {selected.task_count ?? 0} tasks
                                        </span>{' '}
                                        starting {formatDate(data.start_date)}
                                        {data.deadline
                                            ? `, due ${formatDate(data.deadline)}`
                                            : `, with a deadline derived from the template (~${selected.default_duration_days} days)`}
                                        .
                                    </p>
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={close}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Creating…' : 'Create project'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
