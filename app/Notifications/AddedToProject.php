<?php

namespace App\Notifications;

use App\Models\Project;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class AddedToProject extends Notification
{
    use Queueable;

    public function __construct(
        public Project $project,
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
            'type' => 'project.member_added',
            'title' => 'Added to a project',
            'message' => sprintf(
                '%s added you to "%s"',
                $this->actor->name ?? 'Someone',
                $this->project->name,
            ),
            'project_id' => $this->project->id,
            'url' => "/projects/{$this->project->id}",
        ];
    }
}
