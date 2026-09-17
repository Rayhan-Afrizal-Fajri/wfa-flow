<?php

namespace App\Policies;

use App\Models\ProjectTemplate;
use App\Models\User;

class ProjectTemplatePolicy
{
    public function before(User $user, string $ability): ?bool
    {
        return $user->hasRole('admin') ? true : null;
    }

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, ProjectTemplate $template): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'developer', 'marketer']);
    }

    public function update(User $user, ProjectTemplate $template): bool
    {
        return $this->create($user);
    }

    /** Templates already used by a project are archived (is_active), not deleted. */
    public function delete(User $user, ProjectTemplate $template): bool
    {
        return $user->hasRole('admin') && $template->projects()->doesntExist();
    }
}
