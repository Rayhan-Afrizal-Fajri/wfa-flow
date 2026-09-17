<?php

namespace App\Http\Resources;

use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * The handful of project fields a task row needs to label itself.
 *
 * Task listings eager-load `project:id,name`, so the full ProjectResource —
 * which reads dates and enum casts — cannot be used there.
 *
 * @mixin Project
 */
class ProjectSummaryResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'client' => new ClientResource($this->whenLoaded('client')),
        ];
    }
}
