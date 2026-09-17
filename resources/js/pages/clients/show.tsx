import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    ChevronLeft,
    Mail,
    MapPin,
    Phone,
    UserRound,
} from 'lucide-react';
import { CategoryBadge, ProjectStatusBadge } from '@/components/domain/badges';
import { Progress } from '@/components/ui/progress';
import { deadlineMeta, dueToneClass } from '@/lib/domain';
import { cn } from '@/lib/utils';
import clientsRoute from '@/routes/clients';
import projectsRoute from '@/routes/projects';
import type { Client, Project } from '@/types';

type Props = {
    client: Client;
    projects: Project[];
    can: { update: boolean; delete: boolean };
};

export default function ClientShow({ client, projects }: Props) {
    return (
        <>
            <Head title={client.company_name} />

            <div className="mx-auto max-w-7xl px-6 py-6">
                <Link
                    href={clientsRoute.index()}
                    className="mb-4 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    All clients
                </Link>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* ---------------------------- profile ---------------------------- */}
                    <div className="lg:col-span-1">
                        <div className="rounded-xl border border-border bg-card p-5">
                            <h2 className="text-lg font-semibold text-balance">
                                {client.company_name}
                            </h2>

                            <dl className="mt-4 space-y-2 text-sm text-muted-foreground">
                                {client.contact_name && (
                                    <div className="flex items-center gap-2">
                                        <UserRound className="h-4 w-4 shrink-0" />
                                        {client.contact_name}
                                    </div>
                                )}
                                {client.email && (
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 shrink-0" />
                                        <a
                                            href={`mailto:${client.email}`}
                                            className="truncate hover:text-foreground"
                                        >
                                            {client.email}
                                        </a>
                                    </div>
                                )}
                                {client.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 shrink-0" />
                                        <a
                                            href={`tel:${client.phone}`}
                                            className="hover:text-foreground"
                                        >
                                            {client.phone}
                                        </a>
                                    </div>
                                )}
                                {client.address && (
                                    <div className="flex items-start gap-2">
                                        <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                                        <span className="text-pretty">
                                            {client.address}
                                        </span>
                                    </div>
                                )}
                            </dl>

                            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4">
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        Projects
                                    </p>
                                    <p className="mt-0.5 text-2xl font-semibold tabular-nums">
                                        {client.projects_count ?? 0}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        Active
                                    </p>
                                    <p className="mt-0.5 text-2xl font-semibold tabular-nums">
                                        {client.active_projects_count ?? 0}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ---------------------------- projects --------------------------- */}
                    <div className="lg:col-span-2">
                        <h3 className="mb-3 text-sm font-semibold">
                            Projects for this client
                        </h3>

                        <div className="space-y-3">
                            {projects.map((project) => {
                                const deadline = deadlineMeta(
                                    project.deadline,
                                    project.status,
                                );

                                return (
                                    <Link
                                        key={project.id}
                                        href={projectsRoute.show(project.id)}
                                        className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-muted-foreground/30"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <CategoryBadge
                                                    category={project.category}
                                                />
                                                <ProjectStatusBadge
                                                    status={project.status}
                                                />
                                            </div>

                                            <p className="mt-1 truncate font-medium">
                                                {project.name}
                                            </p>

                                            <div className="mt-1 flex items-center gap-3 text-xs">
                                                <span className="text-muted-foreground tabular-nums">
                                                    {project.done_tasks_count ??
                                                        0}
                                                    /{project.tasks_count ?? 0}{' '}
                                                    tasks
                                                </span>
                                                <span
                                                    className={cn(
                                                        'font-medium',
                                                        dueToneClass[
                                                            deadline.tone
                                                        ],
                                                    )}
                                                >
                                                    {deadline.label}
                                                </span>
                                            </div>

                                            <Progress
                                                value={project.progress}
                                                className="mt-2.5"
                                            />
                                        </div>

                                        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    </Link>
                                );
                            })}

                            {projects.length === 0 && (
                                <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
                                    <p className="text-sm font-medium">
                                        No projects yet
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Create one and pick this client to see
                                        it here.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
