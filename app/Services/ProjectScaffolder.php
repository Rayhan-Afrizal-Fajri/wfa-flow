<?php

namespace App\Services;

use App\Enums\ProjectRole;
use App\Enums\ProjectStatus;
use App\Enums\TaskStatus;
use App\Models\Project;
use App\Models\ProjectTemplate;
use App\Models\Task;
use App\Models\TaskTemplate;
use App\Models\User;
use App\Notifications\TaskAssigned;
use App\Support\ActivityLogger;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Turns a project template into a real project: the project row, its seeded
 * task checklist with dates offset from the start date, and the initial
 * membership. This is the single place that knows how a template unfolds.
 */
class ProjectScaffolder
{
    /**
     * Validated project attributes. Recognised keys: name, client_id,
     * template_id, start_date, deadline, description, category, status and
     * member_ids.
     *
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, User $actor): Project
    {
        return DB::transaction(function () use ($data, $actor) {
            $template = isset($data['template_id'])
                ? ProjectTemplate::with('taskTemplates')->find((int) $data['template_id'])
                : null;

            $startDate = CarbonImmutable::parse($data['start_date'])->startOfDay();

            $project = Project::create([
                'client_id' => $data['client_id'] ?? null,
                'template_id' => $template?->id,
                'owner_id' => $actor->id,
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'category' => $data['category'] ?? $template?->category->value ?? 'web_app',
                'status' => $data['status'] ?? ProjectStatus::Onboarding->value,
                'start_date' => $startDate->toDateString(),
                'deadline' => $this->resolveDeadline($data, $template, $startDate),
            ]);

            $project->members()->syncWithoutDetaching([
                $actor->id => ['role' => ProjectRole::Manager->value],
            ]);

            foreach ($data['member_ids'] ?? [] as $memberId) {
                if ((int) $memberId !== $actor->id) {
                    $project->members()->syncWithoutDetaching([
                        (int) $memberId => ['role' => ProjectRole::Member->value],
                    ]);
                }
            }

            $created = $template
                ? $this->seedTasks($project, $template, $startDate)
                : collect();

            ActivityLogger::log(
                event: 'project.created',
                description: $template
                    ? "created this project from the \"{$template->name}\" template"
                    : 'created this project',
                subject: $project,
                project: $project,
                properties: ['generated_tasks' => $created->count()],
                causer: $actor,
            );

            foreach ($created as $task) {
                if ($task->assignee_id && $task->assignee_id !== $actor->id) {
                    $task->assignee?->notify(new TaskAssigned($task, $actor));
                }
            }

            return $project;
        });
    }

    /**
     * Applies a template's task list to an existing project. Used both at
     * creation time and when a template is attached to a project later on.
     *
     * @return Collection<int, Task>
     */
    public function seedTasks(Project $project, ProjectTemplate $template, ?CarbonImmutable $startDate = null): Collection
    {
        $startDate ??= CarbonImmutable::parse($project->start_date)->startOfDay();
        $assigneeCache = [];

        return $template->taskTemplates
            ->values()
            ->map(function (TaskTemplate $seed, int $index) use ($project, $startDate, &$assigneeCache) {
                $role = $seed->default_role;

                if ($role && ! array_key_exists($role, $assigneeCache)) {
                    $assigneeCache[$role] = User::role($role)->active()->value('id');
                }

                return Task::create([
                    'project_id' => $project->id,
                    'assignee_id' => $role ? ($assigneeCache[$role] ?? null) : null,
                    'title' => $seed->title,
                    'description' => $seed->description,
                    'type' => $seed->type->value,
                    'status' => TaskStatus::Todo->value,
                    'priority' => $seed->priority->value,
                    'sort_order' => $index,
                    'start_date' => $startDate->addDays($seed->start_day_offset)->toDateString(),
                    'due_date' => $startDate->addDays($seed->due_day_offset)->toDateString(),
                ]);
            });
    }

    /**
     * An explicit deadline always wins; otherwise the template's span decides,
     * with a small buffer so the last task is not due on the deadline itself.
     */
    /** @param  array<string, mixed>  $data */
    private function resolveDeadline(array $data, ?ProjectTemplate $template, CarbonImmutable $startDate): string
    {
        if (! empty($data['deadline'])) {
            return CarbonImmutable::parse($data['deadline'])->toDateString();
        }

        $span = $template?->span() ?? 30;

        return $startDate->addDays($span + 5)->toDateString();
    }
}
