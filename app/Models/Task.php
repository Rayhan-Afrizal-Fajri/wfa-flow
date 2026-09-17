<?php

namespace App\Models;

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Enums\TaskType;
use Carbon\CarbonInterface;
use Database\Factories\TaskFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

/**
 * @property int $id
 * @property int $project_id
 * @property int|null $assignee_id
 * @property int|null $parent_task_id
 * @property string $title
 * @property string|null $description
 * @property TaskType $type
 * @property TaskStatus $status
 * @property TaskPriority $priority
 * @property int $sort_order
 * @property CarbonInterface|null $start_date
 * @property CarbonInterface|null $due_date
 * @property CarbonInterface|null $completed_at
 * @property int|null $completed_by
 * @property CarbonInterface|null $created_at
 * @property CarbonInterface|null $updated_at
 * @property-read Project $project
 * @property-read User|null $assignee
 * @property-read User|null $completer
 * @property-read Collection<int, TaskComment> $comments
 * @property-read Collection<int, TaskChecklistItem> $checklistItems
 * @property-read int|null $comments_count
 * @property-read int|null $checklist_items_count
 * @property-read int|null $checklist_done_count
 */
class Task extends Model
{
    /** @use HasFactory<TaskFactory> */
    use HasFactory;

    protected $fillable = [
        'project_id',
        'assignee_id',
        'parent_task_id',
        'title',
        'description',
        'type',
        'status',
        'priority',
        'sort_order',
        'start_date',
        'due_date',
        'completed_at',
        'completed_by',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'type' => TaskType::class,
            'status' => TaskStatus::class,
            'priority' => TaskPriority::class,
            'start_date' => 'date',
            'due_date' => 'date',
            'completed_at' => 'datetime',
            'sort_order' => 'integer',
        ];
    }

    /** @return BelongsTo<Project, $this> */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /** @return BelongsTo<User, $this> */
    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }

    /** @return BelongsTo<User, $this> */
    public function completer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'completed_by');
    }

    /** @return HasMany<TaskComment, $this> */
    public function comments(): HasMany
    {
        return $this->hasMany(TaskComment::class)->oldest();
    }

    /** @return HasMany<TaskChecklistItem, $this> */
    public function checklistItems(): HasMany
    {
        return $this->hasMany(TaskChecklistItem::class)->orderBy('sort_order');
    }

    /** @return MorphMany<Activity, $this> */
    public function activities(): MorphMany
    {
        return $this->morphMany(Activity::class, 'subject');
    }

    /* --------------------------- self reference ---------------------------- */

    /** @return BelongsTo<Task, $this> */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Task::class, 'parent_task_id');
    }

    /** @return HasMany<Task, $this> */
    public function children(): HasMany
    {
        return $this->hasMany(Task::class, 'parent_task_id');
    }

    /** @return HasMany<Task, $this> */
    public function allChildren(): HasMany
    {
        return $this->children()->with('allChildren');
    }

    /* -------------------------------- state -------------------------------- */

    public function isOverdue(): bool
    {
        return $this->due_date !== null
            && $this->status !== TaskStatus::Done
            && $this->due_date->isBefore(now()->startOfDay());
    }

    /** Keeps completed_at / completed_by in sync with a status change. */
    public function applyStatus(TaskStatus $status, ?User $actor = null): void
    {
        $this->status = $status;

        if ($status === TaskStatus::Done) {
            $this->completed_at ??= now();
            $this->completed_by ??= $actor?->id;
        } else {
            $this->completed_at = null;
            $this->completed_by = null;
        }
    }

    /* -------------------------------- scopes ------------------------------- */

    /**
     * @param  Builder<Task>  $query
     * @return Builder<Task>
     */
    public function scopeOpen(Builder $query): Builder
    {
        return $query->where('status', '!=', TaskStatus::Done->value);
    }

    /**
     * @param  Builder<Task>  $query
     * @return Builder<Task>
     */
    public function scopeOverdue(Builder $query): Builder
    {
        return $this->scopeOpen($query)
            ->whereNotNull('due_date')
            ->whereDate('due_date', '<', now()->toDateString());
    }

    /**
     * @param  Builder<Task>  $query
     * @return Builder<Task>
     */
    public function scopeDueWithin(Builder $query, int $days): Builder
    {
        return $this->scopeOpen($query)
            ->whereNotNull('due_date')
            ->whereDate('due_date', '>=', now()->toDateString())
            ->whereDate('due_date', '<=', now()->addDays($days)->toDateString());
    }

    /**
     * @param  Builder<Task>  $query
     * @return Builder<Task>
     */
    public function scopeAssignedTo(Builder $query, int $userId): Builder
    {
        return $query->where('assignee_id', $userId);
    }
}
