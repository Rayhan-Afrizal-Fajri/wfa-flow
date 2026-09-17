<?php

namespace Database\Factories;

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Enums\TaskType;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

/**
 * @extends Factory<Task>
 */
class TaskFactory extends Factory
{
    protected $model = Task::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        $start = Carbon::today()->addDays(fake()->numberBetween(-10, 10));

        return [
            'project_id' => Project::factory(),
            'assignee_id' => null,
            'parent_task_id' => null,
            'title' => fake()->sentence(4),
            'description' => null,
            'type' => fake()->randomElement(TaskType::values()),
            'status' => TaskStatus::Todo->value,
            'priority' => fake()->randomElement(TaskPriority::values()),
            'sort_order' => 0,
            'start_date' => $start->toDateString(),
            'due_date' => $start->copy()->addDays(3)->toDateString(),
        ];
    }

    public function status(TaskStatus $status): static
    {
        return $this->state(fn () => [
            'status' => $status->value,
            'completed_at' => $status === TaskStatus::Done ? now() : null,
        ]);
    }

    public function overdue(): static
    {
        return $this->state(fn () => [
            'status' => TaskStatus::Todo->value,
            'due_date' => Carbon::today()->subDays(3)->toDateString(),
        ]);
    }
}
