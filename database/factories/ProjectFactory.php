<?php

namespace Database\Factories;

use App\Enums\ProjectCategory;
use App\Enums\ProjectStatus;
use App\Models\Client;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

/**
 * @extends Factory<Project>
 */
class ProjectFactory extends Factory
{
    protected $model = Project::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        $start = Carbon::today()->subDays(fake()->numberBetween(0, 30));

        return [
            'client_id' => Client::factory(),
            'template_id' => null,
            'owner_id' => User::factory(),
            'name' => fake()->unique()->sentence(3),
            'description' => fake()->sentence(),
            'category' => fake()->randomElement(ProjectCategory::values()),
            'status' => ProjectStatus::InProgress->value,
            'start_date' => $start->toDateString(),
            'deadline' => $start->copy()->addDays(45)->toDateString(),
        ];
    }

    public function archived(): static
    {
        return $this->state(fn () => ['archived_at' => now()]);
    }

    public function status(ProjectStatus $status): static
    {
        return $this->state(fn () => ['status' => $status->value]);
    }
}
