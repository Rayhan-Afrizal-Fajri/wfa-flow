import { router } from '@inertiajs/react';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { Assignee } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/native-select';
import { projectRoleMeta } from '@/lib/domain';
import membersRoute from '@/routes/projects/members';
import type { Project, ProjectRole, TeamMember } from '@/types';

export function ProjectMembers({
    project,
    users,
    canManage,
}: {
    project: Project;
    users: TeamMember[];
    canManage: boolean;
}) {
    const members = project.members ?? [];
    const [adding, setAdding] = useState(false);
    const [pending, setPending] = useState<{
        user_id: number | '';
        role: ProjectRole;
    }>({ user_id: '', role: 'member' });

    const assignable = users.filter(
        (user) => !members.some((member) => member.id === user.id),
    );

    function addMember(event: React.FormEvent) {
        event.preventDefault();

        if (!pending.user_id) {
            return;
        }

        router.post(
            membersRoute.store.url(project.id),
            { user_id: pending.user_id, role: pending.role },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setPending({ user_id: '', role: 'member' });
                    setAdding(false);
                },
            },
        );
    }

    function changeRole(userId: number, role: ProjectRole) {
        router.post(
            membersRoute.store.url(project.id),
            { user_id: userId, role },
            { preserveScroll: true },
        );
    }

    function removeMember(userId: number) {
        router.delete(membersRoute.destroy.url([project.id, userId]), {
            preserveScroll: true,
        });
    }

    return (
        <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <h3 className="text-sm font-semibold">
                    Team{' '}
                    <span className="font-normal text-muted-foreground tabular-nums">
                        ({members.length})
                    </span>
                </h3>
                {canManage && assignable.length > 0 && (
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setAdding((a) => !a)}
                    >
                        <Plus className="h-4 w-4" />
                        Add
                    </Button>
                )}
            </div>

            {adding && (
                <form
                    onSubmit={addMember}
                    className="flex flex-wrap items-end gap-2 border-b border-border px-4 py-3"
                >
                    <div className="min-w-40 flex-1">
                        <NativeSelect
                            value={pending.user_id}
                            onChange={(e) =>
                                setPending((p) => ({
                                    ...p,
                                    user_id: e.target.value
                                        ? Number(e.target.value)
                                        : '',
                                }))
                            }
                        >
                            <option value="">Select a teammate…</option>
                            {assignable.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.name}
                                </option>
                            ))}
                        </NativeSelect>
                    </div>
                    <div className="w-32">
                        <NativeSelect
                            value={pending.role}
                            onChange={(e) =>
                                setPending((p) => ({
                                    ...p,
                                    role: e.target.value as ProjectRole,
                                }))
                            }
                        >
                            {(
                                Object.keys(projectRoleMeta) as ProjectRole[]
                            ).map((role) => (
                                <option key={role} value={role}>
                                    {projectRoleMeta[role].label}
                                </option>
                            ))}
                        </NativeSelect>
                    </div>
                    <Button type="submit" size="sm" disabled={!pending.user_id}>
                        Add
                    </Button>
                </form>
            )}

            <ul className="divide-y divide-border">
                {members.map((member) => {
                    const isOwner = member.id === project.owner_id;
                    const role = (member.project_role ??
                        'member') as ProjectRole;

                    return (
                        <li
                            key={member.id}
                            className="flex items-center gap-3 px-4 py-2.5"
                        >
                            <Assignee
                                name={member.name}
                                src={member.avatar}
                                size="sm"
                                ring={false}
                            />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">
                                    {member.name}
                                    {isOwner && (
                                        <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                                            owner
                                        </span>
                                    )}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                    {member.job_title ?? member.role ?? '—'}
                                </p>
                            </div>

                            {canManage && !isOwner ? (
                                <>
                                    <NativeSelect
                                        value={role}
                                        className="h-8 w-28 text-xs"
                                        onChange={(e) =>
                                            changeRole(
                                                member.id,
                                                e.target.value as ProjectRole,
                                            )
                                        }
                                    >
                                        {(
                                            Object.keys(
                                                projectRoleMeta,
                                            ) as ProjectRole[]
                                        ).map((r) => (
                                            <option key={r} value={r}>
                                                {projectRoleMeta[r].label}
                                            </option>
                                        ))}
                                    </NativeSelect>
                                    <button
                                        type="button"
                                        aria-label={`Remove ${member.name}`}
                                        onClick={() => removeMember(member.id)}
                                        className="rounded p-1 text-muted-foreground/60 transition-colors hover:text-danger-strong"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </>
                            ) : (
                                <span className="text-xs text-muted-foreground">
                                    {projectRoleMeta[role].label}
                                </span>
                            )}
                        </li>
                    );
                })}
            </ul>

            {members.length === 0 && (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                    No one on this project yet.
                </p>
            )}
        </div>
    );
}
