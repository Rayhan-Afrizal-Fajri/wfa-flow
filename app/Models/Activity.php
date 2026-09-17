<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * @property int $id
 * @property int|null $project_id
 * @property int|null $causer_id
 * @property string|null $subject_type
 * @property int|null $subject_id
 * @property string $event
 * @property string $description
 * @property array<string, mixed>|null $properties
 * @property CarbonInterface|null $created_at
 * @property-read Project|null $project
 * @property-read User|null $causer
 */
class Activity extends Model
{
    protected $fillable = [
        'project_id',
        'causer_id',
        'subject_type',
        'subject_id',
        'event',
        'description',
        'properties',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'properties' => 'array',
        ];
    }

    /** @return BelongsTo<Project, $this> */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /** @return BelongsTo<User, $this> */
    public function causer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'causer_id');
    }

    /** @return MorphTo<Model, $this> */
    public function subject(): MorphTo
    {
        return $this->morphTo();
    }
}
