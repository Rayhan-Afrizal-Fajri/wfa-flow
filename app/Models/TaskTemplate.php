<?php

namespace App\Models;

use App\Enums\TaskPriority;
use App\Enums\TaskType;
use Database\Factories\TaskTemplateFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $project_template_id
 * @property string $title
 * @property string|null $description
 * @property TaskType $type
 * @property string|null $default_role
 * @property TaskPriority $priority
 * @property int $start_day_offset
 * @property int $due_day_offset
 * @property int $sort_order
 * @property-read ProjectTemplate $projectTemplate
 */
class TaskTemplate extends Model
{
    /** @use HasFactory<TaskTemplateFactory> */
    use HasFactory;

    protected $fillable = [
        'project_template_id',
        'title',
        'description',
        'type',
        'default_role',
        'priority',
        'start_day_offset',
        'due_day_offset',
        'sort_order',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'type' => TaskType::class,
            'priority' => TaskPriority::class,
            'start_day_offset' => 'integer',
            'due_day_offset' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    /** @return BelongsTo<ProjectTemplate, $this> */
    public function projectTemplate(): BelongsTo
    {
        return $this->belongsTo(ProjectTemplate::class);
    }
}
