<?php

namespace App\Http\Resources;

use App\Models\ProjectTemplate;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ProjectTemplate */
class ProjectTemplateResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'category' => $this->category->value,
            'description' => $this->description,
            'is_active' => (bool) $this->is_active,
            'default_duration_days' => $this->default_duration_days,
            'task_count' => $this->task_templates_count ?? $this->whenLoaded('taskTemplates', fn () => $this->taskTemplates->count()),
            'projects_count' => $this->whenCounted('projects'),
            'task_templates' => TaskTemplateResource::collection($this->whenLoaded('taskTemplates')),
        ];
    }
}
