<?php

namespace App\Models;

use App\Enums\ProjectCategory;
use App\Enums\ProjectRole;
use App\Enums\ProjectStatus;
use App\Enums\TaskStatus;
use Carbon\CarbonInterface;
use Database\Factories\ProjectFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int|null $client_id
 * @property int|null $template_id
 * @property int|null $owner_id
 * @property string $name
 * @property string|null $description
 * @property ProjectCategory $category
 * @property ProjectStatus $status
 * @property CarbonInterface $start_date
 * @property CarbonInterface $deadline
 * @property CarbonInterface|null $archived_at
 * @property CarbonInterface|null $created_at
 * @property CarbonInterface|null $updated_at
 * @property-read Client|null $client
 * @property-read ProjectTemplate|null $template
 * @property-read User|null $owner
 * @property-read Collection<int, Task> $tasks
 * @property-read Collection<int, User> $members
 * @property-read int|null $tasks_count
 * @property-read int|null $done_tasks_count
 * @property-read int|null $overdue_tasks_count
 */
class Project extends Model
{
    /** @use HasFactory<ProjectFactory> */
    use HasFactory;

    protected $fillable = [
        'client_id',
        'template_id',
        'owner_id',
        'name',
        'description',
        'category',
        'status',
        'start_date',
        'deadline',
        'archived_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'category' => ProjectCategory::class,
            'status' => ProjectStatus::class,
            'start_date' => 'date',
            'deadline' => 'date',
            'archived_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<ProjectTemplate, $this> */
    public function template(): BelongsTo
    {
        return $this->belongsTo(ProjectTemplate::class, 'template_id');
    }

    /** @return BelongsTo<Client, $this> */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    /** @return BelongsTo<User, $this> */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /** @return HasMany<Task, $this> */
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    /** @return HasMany<Activity, $this> */
    public function activities(): HasMany
    {
        return $this->hasMany(Activity::class);
    }

    /** @return BelongsToMany<User, $this, ProjectMember> */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'project_members')
            ->using(ProjectMember::class)
            ->withPivot('role')
            ->withTimestamps();
    }

    /** @return HasMany<ProjectMember, $this> */
    public function projectMembers(): HasMany
    {
        return $this->hasMany(ProjectMember::class);
    }

    /* ----------------------------- derived data ---------------------------- */

    /**
     * Completion percentage. Uses the withTaskStats() aggregates when they were
     * eager-loaded, so rendering a project list never costs a query per row.
     */
    public function progress(): int
    {
        $total = $this->tasks_count ?? $this->tasks()->count();

        if ($total === 0) {
            return 0;
        }

        $done = $this->done_tasks_count
            ?? $this->tasks()->where('status', TaskStatus::Done->value)->count();

        return (int) round($done / $total * 100);
    }

    /**
     * The caller's role on this project. The owner is always a manager;
     * everyone else gets whatever their membership row says.
     */
    public function roleFor(User $user): ?ProjectRole
    {
        if ($this->owner_id === $user->id) {
            return ProjectRole::Manager;
        }

        $member = $this->relationLoaded('members')
            ? $this->members->firstWhere('id', $user->id)
            : $this->members()->where('users.id', $user->id)->first();

        $pivot = $member?->getRelationValue('pivot');

        return $pivot instanceof ProjectMember ? $pivot->role : null;
    }

    /* -------------------------------- scopes ------------------------------- */

    /**
     * @param  Builder<Project>  $query
     * @return Builder<Project>
     */
    public function scopeOpen(Builder $query): Builder
    {
        return $query->whereIn('status', ProjectStatus::openValues())
            ->whereNull('archived_at');
    }

    /**
     * @param  Builder<Project>  $query
     * @return Builder<Project>
     */
    public function scopeNotArchived(Builder $query): Builder
    {
        return $query->whereNull('archived_at');
    }

    /**
     * Everything for admins, memberships / ownership / assignments otherwise.
     *
     * @param  Builder<Project>  $query
     * @return Builder<Project>
     */
    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        if ($user->hasRole('admin')) {
            return $query;
        }

        return $query->where(function (Builder $q) use ($user) {
            $q->where('owner_id', $user->id)
                ->orWhereHas('members', fn (Builder $m) => $m->where('users.id', $user->id))
                ->orWhereHas('tasks', fn (Builder $t) => $t->where('assignee_id', $user->id));
        });
    }

    /**
     * Eager-load the aggregates progress() relies on.
     *
     * @param  Builder<Project>  $query
     * @return Builder<Project>
     */
    public function scopeWithTaskStats(Builder $query): Builder
    {
        return $query->withCount([
            'tasks',
            'tasks as done_tasks_count' => fn (Builder $q) => $q->where('status', TaskStatus::Done->value),
            'tasks as overdue_tasks_count' => fn (Builder $q) => $q
                ->where('status', '!=', TaskStatus::Done->value)
                ->whereNotNull('due_date')
                ->whereDate('due_date', '<', now()->toDateString()),
        ]);
    }
}
