<?php

namespace Tests\Feature;

use App\Enums\ProjectRole;
use App\Enums\ProjectStatus;
use App\Enums\TaskStatus;
use App\Models\Client;
use App\Models\Project;
use App\Models\ProjectTemplate;
use App\Models\Task;
use App\Models\TaskTemplate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ProjectManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        foreach (['admin', 'developer', 'marketer'] as $role) {
            Role::findOrCreate($role, 'web');
        }
    }

    private function developer(): User
    {
        $user = User::factory()->create();
        $user->assignRole('developer');

        return $user;
    }

    private function templateWithTasks(string $category = 'web_app'): ProjectTemplate
    {
        $template = ProjectTemplate::factory()->create([
            'category' => $category,
            'default_duration_days' => 20,
        ]);

        TaskTemplate::factory()->for($template, 'projectTemplate')->create([
            'title' => 'Kickoff',
            'default_role' => 'developer',
            'start_day_offset' => 0,
            'due_day_offset' => 2,
            'sort_order' => 0,
        ]);

        TaskTemplate::factory()->for($template, 'projectTemplate')->create([
            'title' => 'Build',
            'default_role' => null,
            'start_day_offset' => 2,
            'due_day_offset' => 10,
            'sort_order' => 1,
        ]);

        return $template;
    }

    /* ------------------------------ creation ------------------------------ */

    public function test_creating_a_project_from_a_template_generates_its_task_checklist(): void
    {
        $user = $this->developer();
        $client = Client::factory()->create();
        $template = $this->templateWithTasks();

        $this->actingAs($user)
            ->post(route('projects.store'), [
                'name' => 'Northwind Storefront',
                'client_id' => $client->id,
                'template_id' => $template->id,
                'start_date' => '2026-09-01',
            ])
            ->assertRedirect();

        $project = Project::firstWhere('name', 'Northwind Storefront');

        $this->assertNotNull($project);
        $this->assertSame($client->id, $project->client_id);
        $this->assertSame($user->id, $project->owner_id);
        $this->assertSame(ProjectStatus::Onboarding, $project->status);
        $this->assertCount(2, $project->tasks);

        $kickoff = $project->tasks()->firstWhere('title', 'Kickoff');

        // Offsets are applied from the project start date...
        $this->assertSame('2026-09-01', $kickoff->start_date->toDateString());
        $this->assertSame('2026-09-03', $kickoff->due_date->toDateString());
        // ...and the seed task is auto-assigned to someone with its role.
        $this->assertSame($user->id, $kickoff->assignee_id);

        // The creator becomes the project manager.
        $this->assertSame(
            ProjectRole::Manager,
            $project->fresh()->roleFor($user),
        );
    }

    public function test_deadline_is_derived_from_the_template_when_not_supplied(): void
    {
        $user = $this->developer();
        $template = $this->templateWithTasks();

        $this->actingAs($user)->post(route('projects.store'), [
            'name' => 'Derived Deadline',
            'template_id' => $template->id,
            'start_date' => '2026-09-01',
        ]);

        $project = Project::firstWhere('name', 'Derived Deadline');

        // default_duration_days (20) wins over the last due offset (10), + 5 buffer.
        $this->assertSame('2026-09-26', $project->deadline->toDateString());
    }

    public function test_an_explicit_deadline_wins_over_the_template_span(): void
    {
        $user = $this->developer();
        $template = $this->templateWithTasks();

        $this->actingAs($user)->post(route('projects.store'), [
            'name' => 'Explicit Deadline',
            'template_id' => $template->id,
            'start_date' => '2026-09-01',
            'deadline' => '2026-10-15',
        ]);

        $this->assertSame(
            '2026-10-15',
            Project::firstWhere('name', 'Explicit Deadline')->deadline->toDateString(),
        );
    }

    public function test_project_creation_validates_its_input(): void
    {
        $this->actingAs($this->developer())
            ->post(route('projects.store'), ['name' => '', 'start_date' => ''])
            ->assertSessionHasErrors(['name', 'start_date']);
    }

    public function test_a_deadline_before_the_start_date_is_rejected(): void
    {
        $this->actingAs($this->developer())
            ->post(route('projects.store'), [
                'name' => 'Backwards',
                'start_date' => '2026-09-10',
                'deadline' => '2026-09-01',
            ])
            ->assertSessionHasErrors('deadline');
    }

    /* ------------------------------- listing ------------------------------ */

    public function test_the_project_list_only_shows_projects_the_user_can_see(): void
    {
        $user = $this->developer();
        $stranger = $this->developer();

        $mine = Project::factory()->create(['owner_id' => $user->id]);
        $theirs = Project::factory()->create(['owner_id' => $stranger->id]);

        $this->actingAs($user)
            ->get(route('projects.index'))
            ->assertOk()
            ->assertInertia(
                fn ($page) => $page
                    ->component('projects/index')
                    ->where('projects.0.id', $mine->id)
                    ->count('projects', 1)
            );

        $this->assertDatabaseHas('projects', ['id' => $theirs->id]);
    }

    public function test_archived_projects_are_hidden_unless_asked_for(): void
    {
        $user = $this->developer();
        Project::factory()->archived()->create(['owner_id' => $user->id]);

        $this->actingAs($user)
            ->get(route('projects.index'))
            ->assertInertia(fn ($page) => $page->count('projects', 0));

        $this->actingAs($user)
            ->get(route('projects.index', ['archived' => 1]))
            ->assertInertia(fn ($page) => $page->count('projects', 1));
    }

    public function test_progress_is_reported_from_completed_tasks(): void
    {
        $user = $this->developer();
        $project = Project::factory()->create(['owner_id' => $user->id]);

        Task::factory()->count(3)->for($project)->create();
        Task::factory()->for($project)->status(TaskStatus::Done)->create();

        $this->actingAs($user)
            ->get(route('projects.show', $project))
            ->assertOk()
            ->assertInertia(
                fn ($page) => $page
                    ->component('projects/show')
                    ->where('project.progress', 25)
                    ->where('project.tasks_count', 4)
                    ->where('project.done_tasks_count', 1)
            );
    }

    /* ------------------------------ authorisation ------------------------- */

    public function test_a_stranger_cannot_view_a_project(): void
    {
        $project = Project::factory()->create();

        $this->actingAs($this->developer())
            ->get(route('projects.show', $project))
            ->assertForbidden();
    }

    public function test_a_viewer_cannot_edit_a_project(): void
    {
        $viewer = $this->developer();
        $project = Project::factory()->create();
        $project->members()->attach($viewer->id, ['role' => ProjectRole::Viewer->value]);

        $this->actingAs($viewer)
            ->get(route('projects.show', $project))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('can.update', false));

        $this->actingAs($viewer)
            ->put(route('projects.update', $project), ['name' => 'Renamed'])
            ->assertForbidden();
    }

    public function test_only_a_manager_can_delete_a_project(): void
    {
        $member = $this->developer();
        $project = Project::factory()->create();
        $project->members()->attach($member->id, ['role' => ProjectRole::Member->value]);

        $this->actingAs($member)
            ->delete(route('projects.destroy', $project))
            ->assertForbidden();

        $this->actingAs(User::find($project->owner_id))
            ->delete(route('projects.destroy', $project))
            ->assertRedirect(route('projects.index'));

        $this->assertDatabaseMissing('projects', ['id' => $project->id]);
    }

    public function test_an_admin_can_see_every_project(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        Project::factory()->count(3)->create();

        $this->actingAs($admin)
            ->get(route('projects.index'))
            ->assertInertia(fn ($page) => $page->count('projects', 3));
    }

    /* -------------------------------- members ----------------------------- */

    public function test_a_manager_can_add_and_remove_members(): void
    {
        $owner = $this->developer();
        $teammate = $this->developer();
        $project = Project::factory()->create(['owner_id' => $owner->id]);

        $this->actingAs($owner)
            ->post(route('projects.members.store', $project), [
                'user_id' => $teammate->id,
                'role' => ProjectRole::Member->value,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('project_members', [
            'project_id' => $project->id,
            'user_id' => $teammate->id,
            'role' => ProjectRole::Member->value,
        ]);

        $this->actingAs($owner)
            ->delete(route('projects.members.destroy', [$project, $teammate]))
            ->assertRedirect();

        $this->assertDatabaseMissing('project_members', [
            'project_id' => $project->id,
            'user_id' => $teammate->id,
        ]);
    }

    public function test_members_are_sent_to_the_page_with_their_project_role(): void
    {
        $owner = $this->developer();
        $viewer = $this->developer();
        $project = Project::factory()->create(['owner_id' => $owner->id]);

        $project->members()->attach($owner->id, ['role' => ProjectRole::Manager->value]);
        $project->members()->attach($viewer->id, ['role' => ProjectRole::Viewer->value]);

        $this->actingAs($owner)
            ->get(route('projects.show', $project))
            ->assertOk()
            ->assertInertia(
                fn ($page) => $page
                    ->count('project.members', 2)
                    ->where('can.manageMembers', true)
            );

        $members = collect(
            $this->actingAs($owner)
                ->get(route('projects.show', $project))
                ->viewData('page')['props']['project']['members']
        )->keyBy('id');

        $this->assertSame(ProjectRole::Manager->value, $members[$owner->id]['project_role']);
        $this->assertSame(ProjectRole::Viewer->value, $members[$viewer->id]['project_role']);
        $this->assertSame('developer', $members[$viewer->id]['role']);
    }

    public function test_the_owner_cannot_be_removed_from_their_own_project(): void
    {
        $owner = $this->developer();
        $project = Project::factory()->create(['owner_id' => $owner->id]);
        $project->members()->attach($owner->id, ['role' => ProjectRole::Manager->value]);

        $this->actingAs($owner)
            ->delete(route('projects.members.destroy', [$project, $owner]))
            ->assertSessionHasErrors('user_id');

        $this->assertDatabaseHas('project_members', [
            'project_id' => $project->id,
            'user_id' => $owner->id,
        ]);
    }

    /* ------------------------------- dashboard ---------------------------- */

    public function test_the_dashboard_counts_only_visible_work(): void
    {
        $user = $this->developer();
        $project = Project::factory()->create(['owner_id' => $user->id]);

        Task::factory()->for($project)->overdue()->create(['assignee_id' => $user->id]);
        Task::factory()->for($project)->status(TaskStatus::Done)->create();
        Task::factory()->for($project)->status(TaskStatus::InProgress)->create([
            'due_date' => Carbon::today()->addDays(2)->toDateString(),
        ]);

        // Another team's work must not leak into the totals.
        Task::factory()->count(4)->create();

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(
                fn ($page) => $page
                    ->component('dashboard')
                    ->where('stats.active_projects', 1)
                    ->where('stats.overdue_tasks', 1)
                    ->where('stats.completed_tasks', 1)
                    ->where('stats.in_progress_tasks', 1)
                    ->where('stats.my_open_tasks', 1)
            );
    }
}
