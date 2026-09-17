import { Head, Link, router } from '@inertiajs/react';
import { ArrowRight, Building2, CalendarDays, Search } from 'lucide-react';
import { useState } from 'react';
import { CategoryBadge, ProjectStatusBadge } from '@/components/domain/badges';
import { CreateProjectDialog } from '@/components/project/create-project-dialog';
import { AssigneeStack } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Progress } from '@/components/ui/progress';
import {
    CATEGORY_ORDER,
    deadlineMeta,
    dueToneClass,
    projectCategoryMeta,
    PROJECT_STATUS_ORDER,
    projectStatusMeta,
} from '@/lib/domain';
import { cn } from '@/lib/utils';
import projectsRoute from '@/routes/projects';
import type {
    Client,
    Project,
    ProjectCategory,
    ProjectStatus,
    ProjectTemplate,
    TeamMember,
} from '@/types';

type Filters = {
    search?: string | null;
    status?: ProjectStatus | null;
    category?: ProjectCategory | null;
    client_id?: number | null;
    archived?: boolean | null;
};

type Props = {
    projects: Project[];
    clients: Client[];
    templates: ProjectTemplate[];
    users: TeamMember[];
    filters: Filters;
    can: { create: boolean };
};

export default function ProjectsIndex({
    projects,
    clients,
    templates,
    users,
    filters,
    can,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    /** Filters live in the query string so a view is shareable and bookmarkable. */
    function applyFilter(patch: Partial<Filters>) {
        const next = { ...filters, search, ...patch };

        router.get(
            projectsRoute.index.url(),
            Object.fromEntries(
                Object.entries(next).filter(
                    ([, value]) =>
                        value !== null && value !== undefined && value !== '',
                ),
            ),
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    return (
        <>
            <Head title="Projects" />

            <div className="px-6 py-6">
                <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                    <div>
                    <h2 className="text-xl font-semibold tracking-tight">
                            All projects
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {projects.length} project
                            {projects.length === 1 ? '' : 's'}
                            {filters.archived
                                ? ' archived'
                                : ' across the agency'}
                        </p>
                    </div>

                    {can.create && (
                        <CreateProjectDialog
                            templates={templates}
                            clients={clients}
                            users={users}
                        />
                    )}
                </div>

                {/* --------------------------- filter bar --------------------------- */}
                <div className="mb-5 flex flex-wrap items-center gap-2">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            applyFilter({});
                        }}
                        className="relative min-w-56 flex-1 sm:max-w-xs"
                    >
                        <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search projects or clients"
                            className="pl-8"
                        />
                    </form>

                    <NativeSelect
                        value={filters.status ?? ''}
                        onChange={(e) =>
                            applyFilter({
                                status: (e.target.value ||
                                    null) as ProjectStatus | null,
                            })
                        }
                        className="w-40"
                    >
                        <option value="">All statuses</option>
                        {PROJECT_STATUS_ORDER.map((status) => (
                            <option key={status} value={status}>
                                {projectStatusMeta[status].label}
                            </option>
                        ))}
                    </NativeSelect>

                    <NativeSelect
                        value={filters.category ?? ''}
                        onChange={(e) =>
                            applyFilter({
                                category: (e.target.value ||
                                    null) as ProjectCategory | null,
                            })
                        }
                        className="w-44"
                    >
                        <option value="">All categories</option>
                        {CATEGORY_ORDER.map((category) => (
                            <option key={category} value={category}>
                                {projectCategoryMeta[category].label}
                            </option>
                        ))}
                    </NativeSelect>

                    <NativeSelect
                        value={filters.client_id ?? ''}
                        onChange={(e) =>
                            applyFilter({
                                client_id: e.target.value
                                    ? Number(e.target.value)
                                    : null,
                            })
                        }
                        className="w-48"
                    >
                        <option value="">All clients</option>
                        {clients.map((client) => (
                            <option key={client.id} value={client.id}>
                                {client.company_name}
                            </option>
                        ))}
                    </NativeSelect>

                    <button
                        type="button"
                        onClick={() =>
                            applyFilter({ archived: !filters.archived })
                        }
                        className={cn(
                            'rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
                            filters.archived
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border text-muted-foreground hover:text-foreground',
                        )}
                    >
                        Archived
                    </button>
                </div>

                {/* ----------------------------- cards ------------------------------ */}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {projects.map((project) => {
                        const deadline = deadlineMeta(
                            project.deadline,
                            project.status,
                        );

                        return (
                            <Link
                                key={project.id}
                                href={projectsRoute.show(project.id)}
                                className="group flex flex-col rounded-xl border border-border bg-card p-5 transition-all hover:border-muted-foreground/30 hover:shadow-md"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <CategoryBadge
                                            category={project.category}
                                        />
                                        <h3 className="mt-1 truncate text-base font-semibold">
                                            {project.name}
                                        </h3>
                                    </div>
                                    <ProjectStatusBadge
                                        status={project.status}
                                        className="shrink-0"
                                    />
                                </div>

                                <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                                    <Building2 className="h-3.5 w-3.5 shrink-0" />
                                    <span className="truncate">
                                        {project.client?.company_name ??
                                            'Internal project'}
                                    </span>
                                </div>

                                <div className="mt-5">
                                    <div className="mb-1.5 flex items-center justify-between text-xs">
                                        <span className="font-medium text-muted-foreground tabular-nums">
                                            {project.done_tasks_count ?? 0}/
                                            {project.tasks_count ?? 0} tasks
                                        </span>
                                        <span className="font-semibold tabular-nums">
                                            {project.progress}%
                                        </span>
                                    </div>
                                    <Progress value={project.progress} />
                                </div>

                                <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-4">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <AssigneeStack
                                            people={project.members ?? []}
                                        />
                                        <span
                                            className={cn(
                                                'inline-flex items-center gap-1 text-xs font-medium',
                                                dueToneClass[deadline.tone],
                                            )}
                                        >
                                            <CalendarDays className="h-3.5 w-3.5" />
                                            {deadline.label}
                                        </span>
                                    </div>

                                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {projects.length === 0 && (
                    <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
                        <p className="text-sm font-medium">
                            No projects match these filters
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Try clearing the filters, or create a project from a
                            template.
                        </p>
                    </div>
                )}
            </div>
        </>
    );
}
