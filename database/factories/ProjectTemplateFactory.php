<?php

namespace Database\Factories;

use App\Enums\ProjectCategory;
use App\Models\ProjectTemplate;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProjectTemplate>
 */
class ProjectTemplateFactory extends Factory
{
    protected $model = ProjectTemplate::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->sentence(3),
            'category' => fake()->randomElement(ProjectCategory::values()),
            'description' => fake()->sentence(),
            'is_active' => true,
            'default_duration_days' => 30,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }
}
