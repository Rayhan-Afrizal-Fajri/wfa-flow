import { Head, router, useForm } from '@inertiajs/react';
import {
    ChevronDown,
    ChevronRight,
    GripVertical,
    ListChecks,
    Plus,
    Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { PriorityBadge, TypeBadge } from '@/components/domain/badges';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import {
    CATEGORY_ORDER,
    PRIORITY_ORDER,
    priorityMeta,
    projectCategoryMeta,
    TYPE_ORDER,
    typeMeta,
} from '@/lib/domain';
import { cn } from '@/lib/utils';
import templatesRoute from '@/routes/project-templates';
import type {
    ProjectCategory,
    ProjectTemplate,
    TaskPriority,
    TaskTemplate,
    TaskType,
} from '@/types';

type Draft = {
    id?: number;
    title: string;
    description: string;
    type: TaskType;
    default_role: string;
    priority: TaskPriority;
    start_day_offset: number;
    due_day_offset: number;
};

type Props = {
    templates: ProjectTemplate[];
    roles: string[];
    can: { create: boolean };
};

export default function TemplatesIndex({ templates, roles, can }: Props) {
    const [editingId, setEditingId] = useState<number | 'new' | null>(null);

    const editing = useMemo(
        () =>
            editingId === 'new'
                ? null
                : (templates.find((t) => t.id === editingId) ?? null),
        [templates, editingId],
    );

    return (
        <>
            <Head title="Project templates" />

            <div className="px-6 py-6">
                <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-semibold tracking-tight">
                            Project templates
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            The checklists new projects are scaffolded from. Day
                            offsets are counted from each project&apos;s start
                            date.
                        </p>
                    </div>

                    {can.create && (
                        <Button onClick={() => setEditingId('new')}>
                            <Plus className="h-4 w-4" />
                            New template
                        </Button>
                    )}
                </div>

                {editingId !== null && (
                    <TemplateEditor
                        key={editingId}
                        template={editing}
                        roles={roles}
                        onDone={() => setEditingId(null)}
                    />
                )}

                <div className="space-y-3">
                    {templates.map((template) => (
                        <TemplateRow
                            key={template.id}
                            template={template}
                            canEdit={can.create}
                            onEdit={() => setEditingId(template.id)}
                        />
                    ))}
                </div>

                {templates.length === 0 && editingId === null && (
                    <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
                        <p className="text-sm font-medium">No templates yet</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Create one so new projects come with their standard
                            task list.
                        </p>
                    </div>
                )}
            </div>
        </>
    );
}

/* -------------------------------------------------------------------------- */
/*  Row                                                                        */
/* -------------------------------------------------------------------------- */

function TemplateRow({
    template,
    canEdit,
    onEdit,
}: {
    template: ProjectTemplate;
    canEdit: boolean;
    onEdit: () => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const tasks = template.task_templates ?? [];
    const inUse = (template.projects_count ?? 0) > 0;

    return (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex flex-wrap items-center gap-3 px-5 py-4">
                <button
                    type="button"
                    onClick={() => setExpanded((e) => !e)}
                    className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={expanded ? 'Collapse' : 'Expand'}
                >
                    {expanded ? (
                        <ChevronDown className="h-4 w-4" />
                    ) : (
                        <ChevronRight className="h-4 w-4" />
                    )}
                </button>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-semibold">
                            {template.name}
                        </h3>
                        {!template.is_active && (
                            <span className="rounded-md border border-transparent bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                Inactive
                            </span>
                        )}
                    </div>
                    {template.description && (
                        <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                            {template.description}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                        <ListChecks className="h-3.5 w-3.5" />
                        <span className="tabular-nums">{tasks.length}</span>{' '}
                        tasks
                    </span>
                    <span>
                        {projectCategoryMeta[template.category].label}
                    </span>
                    <span className="tabular-nums">
                        {template.projects_count ?? 0} projects
                    </span>
                </div>

                {canEdit && (
                    <div className="flex items-center gap-1">
                        <Button size="sm" variant="outline" onClick={onEdit}>
                            Edit
                        </Button>
                        {!inUse && (
                            <Button
                                size="sm"
                                variant="ghost"
                                aria-label={`Delete ${template.name}`}
                                onClick={() => {
                                    if (
                                        window.confirm(
                                            `Delete the "${template.name}" template?`,
                                        )
                                    ) {
                                        router.delete(
                                            templatesRoute.destroy.url(
                                                template.id,
                                            ),
                                            { preserveScroll: true },
                                        );
                                    }
                                }}
                                className="text-muted-foreground hover:text-danger-strong"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {expanded && (
                <ol className="divide-y divide-border border-t border-border">
                    {tasks.map((task: TaskTemplate, index: number) => (
                        <li
                            key={task.id}
                            className="flex flex-wrap items-center gap-3 px-5 py-2.5"
                        >
                            <span className="w-6 text-xs text-muted-foreground tabular-nums">
                                {index + 1}.
                            </span>
                            <span className="min-w-0 flex-1 truncate text-sm font-medium">
                                {task.title}
                            </span>
                            <PriorityBadge priority={task.priority} />
                            <TypeBadge type={task.type} />
                            {task.default_role && (
                                <span className="text-xs text-muted-foreground capitalize">
                                    {task.default_role}
                                </span>
                            )}
                            <span className="text-xs text-muted-foreground tabular-nums">
                                day {task.start_day_offset}–
                                {task.due_day_offset}
                            </span>
                        </li>
                    ))}

                    {tasks.length === 0 && (
                        <li className="px-5 py-6 text-center text-sm text-muted-foreground">
                            This template has no tasks yet.
                        </li>
                    )}
                </ol>
            )}
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/*  Editor                                                                     */
/* -------------------------------------------------------------------------- */

function blankTask(afterDay = 0): Draft {
    return {
        title: '',
        description: '',
        type: 'feature',
        default_role: '',
        priority: 'medium',
        start_day_offset: afterDay,
        due_day_offset: afterDay + 2,
    };
}

function TemplateEditor({
    template,
    roles,
    onDone,
}: {
    template: ProjectTemplate | null;
    roles: string[];
    onDone: () => void;
}) {
    const { data, setData, post, put, processing, errors } = useForm({
        name: template?.name ?? '',
        category: (template?.category ?? 'web_app') as ProjectCategory,
        description: template?.description ?? '',
        is_active: template?.is_active ?? true,
        default_duration_days: template?.default_duration_days ?? 30,
        task_templates: (template?.task_templates ?? []).map(
            (task): Draft => ({
                id: task.id,
                title: task.title,
                description: task.description ?? '',
                type: task.type,
                default_role: task.default_role ?? '',
                priority: task.priority,
                start_day_offset: task.start_day_offset,
                due_day_offset: task.due_day_offset,
            }),
        ) as Draft[],
    });

    function updateTask(index: number, patch: Partial<Draft>) {
        setData(
            'task_templates',
            data.task_templates.map((task, i) =>
                i === index ? { ...task, ...patch } : task,
            ),
        );
    }

    function addTask() {
        const last = data.task_templates.at(-1);
        setData('task_templates', [
            ...data.task_templates,
            blankTask(last ? last.due_day_offset : 0),
        ]);
    }

    function removeTask(index: number) {
        setData(
            'task_templates',
            data.task_templates.filter((_, i) => i !== index),
        );
    }

    /** Reorder by swapping with the neighbour; sort_order follows array order. */
    function move(index: number, delta: number) {
        const target = index + delta;

        if (target < 0 || target >= data.task_templates.length) {
return;
}

        const next = [...data.task_templates];
        [next[index], next[target]] = [next[target], next[index]];
        setData('task_templates', next);
    }

    function submit(event: React.FormEvent) {
        event.preventDefault();

        const options = { preserveScroll: true, onSuccess: onDone };

        if (template) {
            put(templatesRoute.update.url(template.id), options);
        } else {
            post(templatesRoute.store.url(), options);
        }
    }

    return (
        <form
            onSubmit={submit}
            className="mb-6 rounded-xl border border-primary/30 bg-card p-5 ring-1 ring-primary/10"
        >
            <h3 className="mb-4 text-sm font-semibold">
                {template ? `Edit "${template.name}"` : 'New template'}
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                    <Label htmlFor="tpl-name">Name</Label>
                    <Input
                        id="tpl-name"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        aria-invalid={!!errors.name}
                        autoFocus
                    />
                    <InputError message={errors.name} />
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="tpl-category">Category</Label>
                    <NativeSelect
                        id="tpl-category"
                        value={data.category}
                        onChange={(e) =>
                            setData(
                                'category',
                                e.target.value as ProjectCategory,
                            )
                        }
                    >
                        {CATEGORY_ORDER.map((category) => (
                            <option key={category} value={category}>
                                {projectCategoryMeta[category].label}
                            </option>
                        ))}
                    </NativeSelect>
                    <InputError message={errors.category} />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="tpl-description">Description</Label>
                    <Textarea
                        id="tpl-description"
                        rows={2}
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                    />
                    <InputError message={errors.description} />
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="tpl-duration">
                        Default duration (days)
                    </Label>
                    <Input
                        id="tpl-duration"
                        type="number"
                        min={1}
                        max={365}
                        value={data.default_duration_days}
                        onChange={(e) =>
                            setData(
                                'default_duration_days',
                                Number(e.target.value),
                            )
                        }
                        aria-invalid={!!errors.default_duration_days}
                    />
                    <InputError message={errors.default_duration_days} />
                </div>

                <div className="flex items-center gap-2 self-end pb-2">
                    <Checkbox
                        id="tpl-active"
                        checked={data.is_active}
                        onCheckedChange={(checked) =>
                            setData('is_active', checked === true)
                        }
                    />
                    <Label htmlFor="tpl-active" className="text-sm font-normal">
                        Available when creating projects
                    </Label>
                </div>
            </div>

            {/* ------------------------------ tasks ------------------------------ */}
            <div className="mt-6">
                <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-sm font-semibold">
                        Task checklist{' '}
                        <span className="font-normal text-muted-foreground tabular-nums">
                            ({data.task_templates.length})
                        </span>
                    </h4>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={addTask}
                    >
                        <Plus className="h-4 w-4" />
                        Add task
                    </Button>
                </div>

                <InputError message={errors.task_templates as string} />

                <div className="space-y-2">
                    {data.task_templates.map((task, index) => {
                        const fieldError = (field: string) =>
                            (
                                errors as unknown as Record<
                                    string,
                                    string | undefined
                                >
                            )[`task_templates.${index}.${field}`];

                        return (
                            <div
                                key={index}
                                className="rounded-lg border border-border bg-background p-3"
                            >
                                <div className="flex items-start gap-2">
                                    <div className="flex flex-col items-center pt-1.5">
                                        <button
                                            type="button"
                                            aria-label="Move up"
                                            onClick={() => move(index, -1)}
                                            disabled={index === 0}
                                            className="text-muted-foreground/60 hover:text-foreground disabled:opacity-30"
                                        >
                                            <ChevronDown className="h-3.5 w-3.5 rotate-180" />
                                        </button>
                                        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/30" />
                                        <button
                                            type="button"
                                            aria-label="Move down"
                                            onClick={() => move(index, 1)}
                                            disabled={
                                                index ===
                                                data.task_templates.length - 1
                                            }
                                            className="text-muted-foreground/60 hover:text-foreground disabled:opacity-30"
                                        >
                                            <ChevronDown className="h-3.5 w-3.5" />
                                        </button>
                                    </div>

                                    <div className="grid flex-1 gap-2 sm:grid-cols-12">
                                        <div className="space-y-1 sm:col-span-12">
                                            <Input
                                                value={task.title}
                                                placeholder="Task title"
                                                onChange={(e) =>
                                                    updateTask(index, {
                                                        title: e.target.value,
                                                    })
                                                }
                                                aria-invalid={
                                                    !!fieldError('title')
                                                }
                                                className="h-8"
                                            />
                                            <InputError
                                                message={fieldError('title')}
                                            />
                                        </div>

                                        <NativeSelect
                                            value={task.type}
                                            onChange={(e) =>
                                                updateTask(index, {
                                                    type: e.target
                                                        .value as TaskType,
                                                })
                                            }
                                            className="h-8 text-xs sm:col-span-3"
                                        >
                                            {TYPE_ORDER.map((type) => (
                                                <option key={type} value={type}>
                                                    {typeMeta[type].label}
                                                </option>
                                            ))}
                                        </NativeSelect>

                                        <NativeSelect
                                            value={task.priority}
                                            onChange={(e) =>
                                                updateTask(index, {
                                                    priority: e.target
                                                        .value as TaskPriority,
                                                })
                                            }
                                            className="h-8 text-xs sm:col-span-3"
                                        >
                                            {PRIORITY_ORDER.map((priority) => (
                                                <option
                                                    key={priority}
                                                    value={priority}
                                                >
                                                    {
                                                        priorityMeta[priority]
                                                            .label
                                                    }
                                                </option>
                                            ))}
                                        </NativeSelect>

                                        <NativeSelect
                                            value={task.default_role}
                                            onChange={(e) =>
                                                updateTask(index, {
                                                    default_role:
                                                        e.target.value,
                                                })
                                            }
                                            className="h-8 text-xs sm:col-span-3"
                                        >
                                            <option value="">
                                                No auto-assign
                                            </option>
                                            {roles.map((role) => (
                                                <option key={role} value={role}>
                                                    {role}
                                                </option>
                                            ))}
                                        </NativeSelect>

                                        <div className="flex items-center gap-1 sm:col-span-3">
                                            <Input
                                                type="number"
                                                min={0}
                                                max={365}
                                                value={task.start_day_offset}
                                                onChange={(e) =>
                                                    updateTask(index, {
                                                        start_day_offset:
                                                            Number(
                                                                e.target.value,
                                                            ),
                                                    })
                                                }
                                                aria-label="Start day offset"
                                                className="h-8"
                                            />
                                            <span className="text-xs text-muted-foreground">
                                                →
                                            </span>
                                            <Input
                                                type="number"
                                                min={0}
                                                max={365}
                                                value={task.due_day_offset}
                                                onChange={(e) =>
                                                    updateTask(index, {
                                                        due_day_offset: Number(
                                                            e.target.value,
                                                        ),
                                                    })
                                                }
                                                aria-label="Due day offset"
                                                aria-invalid={
                                                    !!fieldError(
                                                        'due_day_offset',
                                                    )
                                                }
                                                className="h-8"
                                            />
                                        </div>

                                        <InputError
                                            className="sm:col-span-12"
                                            message={fieldError(
                                                'due_day_offset',
                                            )}
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        aria-label="Remove task"
                                        onClick={() => removeTask(index)}
                                        className="mt-1 rounded p-1 text-muted-foreground/60 transition-colors hover:text-danger-strong"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {data.task_templates.length === 0 && (
                    <p
                        className={cn(
                            'rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground',
                        )}
                    >
                        No tasks yet. Projects from this template will start
                        empty.
                    </p>
                )}
            </div>

            <div className="mt-5 flex justify-end gap-2 border-t border-border pt-4">
                <Button type="button" variant="ghost" onClick={onDone}>
                    Cancel
                </Button>
                <Button type="submit" disabled={processing}>
                    {processing ? 'Saving…' : 'Save template'}
                </Button>
            </div>
        </form>
    );
}
