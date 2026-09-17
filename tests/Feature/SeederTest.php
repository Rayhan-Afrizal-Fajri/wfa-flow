<?php

namespace Tests\Feature;

use App\Enums\TaskStatus;
use App\Models\Activity;
use App\Models\Client;
use App\Models\Project;
use App\Models\ProjectTemplate;
use App\Models\Task;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Exercises the full seeder chain, which doubles as a migration smoke test:
 * every table, foreign key and enum has to line up for this to pass.
 */
class SeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_database_seeder_produces_a_usable_workspace(): void
    {
        $this->seed(DatabaseSeeder::class);

        $this->assertSame(4, User::count());
        $this->assertSame(4, Client::count());
        $this->assertSame(3, ProjectTemplate::count());
        $this->assertSame(4, Project::count());

        $this->assertTrue(User::role('admin')->exists());
        $this->assertTrue(User::role('developer')->exists());
        $this->assertTrue(User::role('marketer')->exists());

        // Every project got its template checklist, and work is spread across
        // the board rather than sitting entirely in one column.
        foreach (Project::with('tasks')->get() as $project) {
            $this->assertNotEmpty($project->tasks, "{$project->name} has no tasks");
        }

        $this->assertGreaterThan(0, Task::where('status', TaskStatus::Done->value)->count());
        $this->assertGreaterThan(0, Task::where('status', TaskStatus::InProgress->value)->count());
        $this->assertGreaterThan(0, Task::overdue()->count());

        // Every project opens its timeline with a creation entry.
        $this->assertSame(
            Project::count(),
            Activity::where('event', 'project.created')->count(),
        );

        $this->assertGreaterThan(0, Activity::where('event', 'task.commented')->count());
    }

    public function test_seeding_twice_does_not_duplicate_data(): void
    {
        $this->seed(DatabaseSeeder::class);
        $this->seed(DatabaseSeeder::class);

        $this->assertSame(4, User::count());
        $this->assertSame(4, Client::count());
        $this->assertSame(3, ProjectTemplate::count());
        $this->assertSame(4, Project::count());
    }

    public function test_completed_tasks_carry_a_completion_timestamp(): void
    {
        $this->seed(DatabaseSeeder::class);

        $this->assertSame(
            0,
            Task::where('status', TaskStatus::Done->value)
                ->whereNull('completed_at')
                ->count(),
        );
    }
}
