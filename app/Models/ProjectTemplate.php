<?php

namespace App\Models;

use App\Enums\ProjectCategory;
use Database\Factories\ProjectTemplateFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $name
 * @property ProjectCategory $category
 * @property string|null $description
 * @property bool $is_active
 * @property int $default_duration_days
 * @property-read Collection<int, TaskTemplate> $taskTemplates
 * @property-read int|null $task_templates_count
 * @property-read int|null $projects_count
 */
class ProjectTemplate extends Model
{
    /** @use HasFactory<ProjectTemplateFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'category',
        'description',
        'is_active',
        'default_duration_days',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'category' => ProjectCategory::class,
            'is_active' => 'boolean',
            'default_duration_days' => 'integer',
        ];
    }

    /** @return HasMany<TaskTemplate, $this> */
    public function taskTemplates(): HasMany
    {
        return $this->hasMany(TaskTemplate::class)->orderBy('sort_order')->orderBy('due_day_offset');
    }

    /** @return HasMany<Project, $this> */
    public function projects(): HasMany
    {
        return $this->hasMany(Project::class, 'template_id');
    }

    /** How many days out the last seed task lands, used to derive a deadline. */
    public function span(): int
    {
        return (int) max(
            $this->taskTemplates->max('due_day_offset') ?? 0,
            $this->default_duration_days,
        );
    }

    /**
     * @param  Builder<ProjectTemplate>  $query
     * @return Builder<ProjectTemplate>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }
}
