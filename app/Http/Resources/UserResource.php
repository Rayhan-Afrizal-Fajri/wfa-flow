<?php

namespace App\Http\Resources;

use App\Models\ProjectMember;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin User */
class UserResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'avatar' => $this->avatar,
            'job_title' => $this->job_title,
            'is_active' => (bool) $this->is_active,
            // Only present when roles were eager-loaded; avoids an N+1 on lists.
            'role' => $this->whenLoaded('roles', fn () => $this->getRoleNames()->first()),
            'project_role' => $this->whenPivotLoaded('project_members', fn () => $this->projectRole()),
        ];
    }

    /** The membership role carried on the project_members pivot, if any. */
    private function projectRole(): ?string
    {
        $pivot = $this->resource->getRelationValue('pivot');

        return $pivot instanceof ProjectMember ? $pivot->role->value : null;
    }
}
