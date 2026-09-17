<?php

namespace App\Http\Resources;

use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Task */
class TaskResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'project_id' => $this->project_id,
            'parent_task_id' => $this->parent_task_id,
            'assignee_id' => $this->assignee_id,
            'title' => $this->title,
            'description' => $this->description,
            'type' => $this->type->value,
            'status' => $this->status->value,
            'priority' => $this->priority->value,
            'sort_order' => $this->sort_order,
            'start_date' => $this->start_date?->toDateString(),
            'due_date' => $this->due_date?->toDateString(),
            'completed_at' => $this->completed_at?->toIso8601String(),
            'is_overdue' => $this->isOverdue(),

            'assignee' => new UserResource($this->whenLoaded('assignee')),
            'project' => new ProjectSummaryResource($this->whenLoaded('project')),
            'comments' => TaskCommentResource::collection($this->whenLoaded('comments')),
            'checklist_items' => TaskChecklistItemResource::collection($this->whenLoaded('checklistItems')),
            'children' => TaskResource::collection($this->whenLoaded('children')),

            'comments_count' => $this->whenCounted('comments'),
            'checklist_total' => $this->whenCounted('checklistItems', fn () => $this->checklist_items_count),
            'checklist_done' => $this->when(
                isset($this->checklist_done_count),
                fn () => $this->checklist_done_count,
            ),

            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
