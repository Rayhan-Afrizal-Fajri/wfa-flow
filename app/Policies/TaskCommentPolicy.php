<?php

namespace App\Policies;

use App\Models\TaskComment;
use App\Models\User;

class TaskCommentPolicy
{
    public function before(User $user, string $ability): ?bool
    {
        return $user->hasRole('admin') ? true : null;
    }

    public function update(User $user, TaskComment $comment): bool
    {
        return $comment->user_id === $user->id;
    }

    /** Authors delete their own; project managers can moderate. */
    public function delete(User $user, TaskComment $comment): bool
    {
        return $comment->user_id === $user->id
            || $user->can('manageMembers', $comment->task->project);
    }
}
