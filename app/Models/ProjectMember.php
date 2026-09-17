<?php

namespace App\Models;

use App\Enums\ProjectRole;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\Pivot;

/**
 * @property int $id
 * @property int $project_id
 * @property int $user_id
 * @property ProjectRole $role
 */
class ProjectMember extends Pivot
{
    protected $table = 'project_members';

    public $incrementing = true;

    protected $fillable = [
        'project_id',
        'user_id',
        'role',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'role' => ProjectRole::class,
        ];
    }

    /** @return BelongsTo<Project, $this> */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
