<?php

namespace Database\Factories;

use App\Enums\TaskPriority;
use App\Enums\TaskType;
use App\Models\ProjectTemplate;
use App\Models\TaskTemplate;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TaskTemplate>
 */
class TaskTemplateFactory extends Factory
{
    protected $model = TaskTemplate::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        $start = fake()->numberBetween(0, 20);

        return [
            'project_template_id' => ProjectTemplate::factory(),
            'title' => fake()->sentence(3),
            'description' => null,
            'type' => fake()->randomElement(TaskType::values()),
            'default_role' => null,
            'priority' => fake()->randomElement(TaskPriority::values()),
            'start_day_offset' => $start,
            'due_day_offset' => $start + fake()->numberBetween(1, 5),
            'sort_order' => 0,
        ];
    }
}
