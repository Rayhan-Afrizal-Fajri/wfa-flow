<?php

namespace App\Notifications;

use App\Models\Task;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class TaskAssigned extends Notification
{
    use Queueable;

    public function __construct(
        public Task $task,
        public ?User $actor = null,
    ) {}

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'task.assigned',
            'title' => 'New task assigned',
            'message' => sprintf(
                '%s assigned you "%s"',
                $this->actor->name ?? 'Someone',
                $this->task->title,
            ),
            'task_id' => $this->task->id,
            'project_id' => $this->task->project_id,
            'url' => "/projects/{$this->task->project_id}?task={$this->task->id}",
        ];
    }
}
