<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Project;
use App\Models\ProjectTemplate;
use App\Models\TaskTemplate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ClientAndTemplateTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        foreach (['admin', 'developer', 'marketer'] as $role) {
            Role::findOrCreate($role, 'web');
        }

        $this->user = User::factory()->create();
        $this->user->assignRole('admin');
    }

    /* -------------------------------- clients ----------------------------- */

    public function test_clients_are_listed_with_their_project_counts(): void
    {
        $client = Client::factory()->create();
        Project::factory()->count(2)->create(['client_id' => $client->id]);
        Project::factory()->create([
            'client_id' => $client->id,
            'status' => 'completed',
        ]);

        $this->actingAs($this->user)
            ->get(route('clients.index'))
            ->assertOk()
            ->assertInertia(
                fn ($page) => $page
                    ->component('clients/index')
                    ->where('clients.0.projects_count', 3)
                    ->where('clients.0.active_projects_count', 2)
            );
    }

    public function test_a_client_can_be_created_and_updated(): void
    {
        $this->actingAs($this->user)
            ->post(route('clients.store'), [
                'company_name' => 'Northwind Coffee',
                'contact_name' => 'Elena Ruiz',
                'email' => 'elena@northwind.test',
            ])
            ->assertRedirect();

        $client = Client::firstWhere('company_name', 'Northwind Coffee');
        $this->assertNotNull($client);

        $this->actingAs($this->user)
            ->put(route('clients.update', $client), [
                'company_name' => 'Northwind Coffee Co.',
                'phone' => '08123456789',
            ])
            ->assertRedirect();

        $this->assertSame('Northwind Coffee Co.', $client->refresh()->company_name);
    }

    public function test_client_company_names_must_be_unique(): void
    {
        Client::factory()->create(['company_name' => 'Duplicate Ltd']);

        $this->actingAs($this->user)
            ->post(route('clients.store'), ['company_name' => 'Duplicate Ltd'])
            ->assertSessionHasErrors('company_name');
    }

    public function test_a_client_with_projects_cannot_be_deleted(): void
    {
        $client = Client::factory()->create();
        Project::factory()->create(['client_id' => $client->id]);

        // Admins reach the controller, which explains why rather than 403-ing.
        $this->actingAs($this->user)
            ->delete(route('clients.destroy', $client))
            ->assertSessionHasErrors('client');

        $this->assertDatabaseHas('clients', ['id' => $client->id]);
    }

    public function test_non_admins_cannot_delete_clients_at_all(): void
    {
        $developer = User::factory()->create();
        $developer->assignRole('developer');
        $client = Client::factory()->create();

        $this->actingAs($developer)
            ->delete(route('clients.destroy', $client))
            ->assertForbidden();

        $this->assertDatabaseHas('clients', ['id' => $client->id]);
    }

    public function test_a_client_without_projects_can_be_deleted(): void
    {
        $client = Client::factory()->create();

        $this->actingAs($this->user)
            ->delete(route('clients.destroy', $client))
            ->assertRedirect(route('clients.index'));

        $this->assertDatabaseMissing('clients', ['id' => $client->id]);
    }

    public function test_the_search_filter_narrows_the_client_list(): void
    {
        Client::factory()->create(['company_name' => 'Northwind Coffee']);
        Client::factory()->create(['company_name' => 'Peak Fitness']);

        $this->actingAs($this->user)
            ->get(route('clients.index', ['search' => 'Northwind']))
            ->assertInertia(fn ($page) => $page->count('clients', 1));
    }

    /* ------------------------------- templates ---------------------------- */

    public function test_a_template_is_created_together_with_its_checklist(): void
    {
        $this->actingAs($this->user)
            ->post(route('project-templates.store'), [
                'name' => 'Custom Web App',
                'category' => 'web_app',
                'description' => 'Standard build.',
                'default_duration_days' => 45,
                'task_templates' => [
                    [
                        'title' => 'Discovery',
                        'type' => 'setup',
                        'priority' => 'high',
                        'default_role' => 'developer',
                        'start_day_offset' => 0,
                        'due_day_offset' => 2,
                    ],
                    [
                        'title' => 'Launch',
                        'type' => 'feature',
                        'priority' => 'urgent',
                        'default_role' => null,
                        'start_day_offset' => 30,
                        'due_day_offset' => 40,
                    ],
                ],
            ])
            ->assertRedirect();

        $template = ProjectTemplate::firstWhere('name', 'Custom Web App');

        $this->assertNotNull($template);
        $this->assertCount(2, $template->taskTemplates);
        $this->assertSame(
            ['Discovery', 'Launch'],
            $template->taskTemplates->pluck('title')->all(),
        );
    }

    public function test_updating_a_template_syncs_its_checklist(): void
    {
        $template = ProjectTemplate::factory()->create(['default_duration_days' => 30]);
        $kept = TaskTemplate::factory()->for($template, 'projectTemplate')->create([
            'title' => 'Kept', 'sort_order' => 0,
        ]);
        $dropped = TaskTemplate::factory()->for($template, 'projectTemplate')->create([
            'title' => 'Dropped', 'sort_order' => 1,
        ]);

        $this->actingAs($this->user)
            ->put(route('project-templates.update', $template), [
                'name' => $template->name,
                'category' => $template->category->value,
                'default_duration_days' => 30,
                'task_templates' => [
                    [
                        'id' => $kept->id,
                        'title' => 'Kept & renamed',
                        'type' => 'setup',
                        'priority' => 'low',
                        'start_day_offset' => 0,
                        'due_day_offset' => 1,
                    ],
                    [
                        'title' => 'Brand new',
                        'type' => 'feature',
                        'priority' => 'medium',
                        'start_day_offset' => 2,
                        'due_day_offset' => 4,
                    ],
                ],
            ])
            ->assertRedirect();

        $titles = $template->refresh()->taskTemplates->pluck('title')->all();

        $this->assertSame(['Kept & renamed', 'Brand new'], $titles);
        $this->assertDatabaseMissing('task_templates', ['id' => $dropped->id]);
    }

    public function test_a_template_task_cannot_be_due_before_it_starts(): void
    {
        $this->actingAs($this->user)
            ->post(route('project-templates.store'), [
                'name' => 'Backwards',
                'category' => 'web_app',
                'default_duration_days' => 10,
                'task_templates' => [
                    [
                        'title' => 'Impossible',
                        'type' => 'setup',
                        'priority' => 'low',
                        'start_day_offset' => 5,
                        'due_day_offset' => 2,
                    ],
                ],
            ])
            ->assertSessionHasErrors('task_templates.0.due_day_offset');
    }

    public function test_a_template_in_use_cannot_be_deleted(): void
    {
        $template = ProjectTemplate::factory()->create();
        Project::factory()->create(['template_id' => $template->id]);

        $this->actingAs($this->user)
            ->delete(route('project-templates.destroy', $template))
            ->assertSessionHasErrors('template');

        $this->assertDatabaseHas('project_templates', ['id' => $template->id]);
    }

    public function test_only_active_templates_are_offered_when_creating_a_project(): void
    {
        ProjectTemplate::factory()->create(['name' => 'Live']);
        ProjectTemplate::factory()->inactive()->create(['name' => 'Retired']);

        $this->actingAs($this->user)
            ->get(route('projects.index'))
            ->assertInertia(
                fn ($page) => $page
                    ->count('templates', 1)
                    ->where('templates.0.name', 'Live')
            );
    }
}
