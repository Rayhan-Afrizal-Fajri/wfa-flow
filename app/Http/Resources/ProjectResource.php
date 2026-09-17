<?php

namespace App\Http\Resources;

use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Project */
class ProjectResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'client_id' => $this->client_id,
            'template_id' => $this->template_id,
            'owner_id' => $this->owner_id,
            'name' => $this->name,
            'description' => $this->description,
            'category' => $this->category->value,
            'status' => $this->status->value,
            'start_date' => $this->start_date->toDateString(),
            'deadline' => $this->deadline->toDateString(),
            'archived_at' => $this->archived_at?->toIso8601String(),

            // Denormalised so cards can render without walking relations.
            'progress' => $this->progress(),
            'tasks_count' => $this->tasks_count ?? null,
            'done_tasks_count' => $this->done_tasks_count ?? null,
            'overdue_tasks_count' => $this->overdue_tasks_count ?? null,

            'client' => new ClientResource($this->whenLoaded('client')),
            'template' => new ProjectTemplateResource($this->whenLoaded('template')),
            'owner' => new UserResource($this->whenLoaded('owner')),
            'members' => UserResource::collection($this->whenLoaded('members')),
            'tasks' => TaskResource::collection($this->whenLoaded('tasks')),

            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
