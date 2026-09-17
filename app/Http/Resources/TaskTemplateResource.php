<?php

namespace App\Http\Resources;

use App\Models\TaskTemplate;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin TaskTemplate */
class TaskTemplateResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'project_template_id' => $this->project_template_id,
            'title' => $this->title,
            'description' => $this->description,
            'type' => $this->type->value,
            'default_role' => $this->default_role,
            'priority' => $this->priority->value,
            'start_day_offset' => $this->start_day_offset,
            'due_day_offset' => $this->due_day_offset,
            'sort_order' => $this->sort_order,
        ];
    }
}
