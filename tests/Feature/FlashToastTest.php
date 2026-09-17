<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * Toasts ride Inertia's flash channel, which lands on the page object rather
 * than in props. `<Toaster>` renders outside the Inertia page context, so it
 * can only read them through that channel.
 */
class FlashToastTest extends TestCase
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

    public function test_a_successful_action_flashes_a_toast_on_the_next_page(): void
    {
        $response = $this->actingAs($this->user)
            ->post(route('clients.store'), ['company_name' => 'Northwind Coffee'])
            ->assertRedirect();

        // The toast is queued for the response that follows the redirect.
        $page = $this->actingAs($this->user)
            ->get($response->headers->get('Location'))
            ->assertOk()
            ->viewData('page');

        $this->assertSame(
            ['type' => 'success', 'message' => 'Client "Northwind Coffee" created.'],
            $page['flash']['toast'] ?? null,
        );
    }

    public function test_the_flash_channel_is_empty_on_an_ordinary_visit(): void
    {
        $page = $this->actingAs($this->user)
            ->get(route('clients.index'))
            ->assertOk()
            ->viewData('page');

        $this->assertArrayNotHasKey('toast', $page['flash'] ?? []);
    }

    public function test_a_toast_is_delivered_only_once(): void
    {
        $client = Client::factory()->create();

        $this->actingAs($this->user)
            ->put(route('clients.update', $client), ['company_name' => 'Renamed Ltd'])
            ->assertRedirect();

        $first = $this->actingAs($this->user)
            ->get(route('clients.index'))
            ->viewData('page');

        $this->assertSame('Client updated.', $first['flash']['toast']['message']);

        $second = $this->actingAs($this->user)
            ->get(route('clients.index'))
            ->viewData('page');

        $this->assertArrayNotHasKey('toast', $second['flash'] ?? []);
    }

    public function test_project_deletion_flashes_the_project_name(): void
    {
        $project = Project::factory()->create(['name' => 'Northwind Storefront']);

        $this->actingAs($this->user)
            ->delete(route('projects.destroy', $project))
            ->assertRedirect(route('projects.index'));

        $page = $this->actingAs($this->user)
            ->get(route('projects.index'))
            ->viewData('page');

        $this->assertSame(
            'Project "Northwind Storefront" deleted.',
            $page['flash']['toast']['message'],
        );
    }
}
