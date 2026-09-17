<?php

namespace App\Http\Resources;

use App\Models\TaskChecklistItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin TaskChecklistItem */
class TaskChecklistItemResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'task_id' => $this->task_id,
            'title' => $this->title,
            'is_done' => (bool) $this->is_done,
            'sort_order' => $this->sort_order,
            'completed_at' => $this->completed_at?->toIso8601String(),
        ];
    }
}
