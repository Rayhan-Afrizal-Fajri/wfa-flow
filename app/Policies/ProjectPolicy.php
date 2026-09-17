<?php

namespace App\Policies;

use App\Enums\ProjectRole;
use App\Models\Project;
use App\Models\User;

class ProjectPolicy
{
    /** Admins bypass every project check. */
    public function before(User $user, string $ability): ?bool
    {
        return $user->hasRole('admin') ? true : null;
    }

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Project $project): bool
    {
        return $project->roleFor($user) !== null
            || $project->tasks()->where('assignee_id', $user->id)->exists();
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'developer', 'marketer']);
    }

    public function update(User $user, Project $project): bool
    {
        return $project->roleFor($user)?->canEdit() ?? false;
    }

    public function delete(User $user, Project $project): bool
    {
        return $project->roleFor($user) === ProjectRole::Manager;
    }

    public function manageMembers(User $user, Project $project): bool
    {
        return $project->roleFor($user) === ProjectRole::Manager;
    }
}
