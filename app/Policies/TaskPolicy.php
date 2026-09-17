<?php

namespace App\Policies;

use App\Models\Task;
use App\Models\User;

class TaskPolicy
{
    public function before(User $user, string $ability): ?bool
    {
        return $user->hasRole('admin') ? true : null;
    }

    public function view(User $user, Task $task): bool
    {
        return $task->assignee_id === $user->id
            || $user->can('view', $task->project);
    }

    /**
     * Assignees can always move their own work forward, even when they are only
     * a viewer on the project itself.
     */
    public function update(User $user, Task $task): bool
    {
        return $task->assignee_id === $user->id
            || $user->can('update', $task->project);
    }

    public function delete(User $user, Task $task): bool
    {
        return $user->can('update', $task->project);
    }

    public function comment(User $user, Task $task): bool
    {
        return $this->view($user, $task);
    }
}
