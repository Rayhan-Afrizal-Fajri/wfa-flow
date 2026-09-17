<?php

namespace App\Notifications;

use App\Models\TaskComment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Str;

class TaskCommented extends Notification
{
    use Queueable;

    public function __construct(public TaskComment $comment) {}

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        $task = $this->comment->task;

        return [
            'type' => 'task.commented',
            'title' => 'New comment',
            'message' => sprintf(
                '%s commented on "%s": %s',
                $this->comment->user->name,
                $task->title,
                Str::limit($this->comment->body, 80),
            ),
            'task_id' => $task->id,
            'project_id' => $task->project_id,
            'url' => "/projects/{$task->project_id}?task={$task->id}",
        ];
    }
}
