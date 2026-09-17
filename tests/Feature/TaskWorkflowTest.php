<?php

namespace Tests\Feature;

use App\Enums\ProjectRole;
use App\Enums\TaskStatus;
use App\Models\Project;
use App\Models\Task;
use App\Models\TaskChecklistItem;
use App\Models\TaskComment;
use App\Models\User;
use App\Notifications\TaskAssigned;
use App\Notifications\TaskCommented;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class TaskWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    private Project $project;

    protected function setUp(): void
    {
        parent::setUp();

        foreach (['admin', 'developer', 'marketer'] as $role) {
            Role::findOrCreate($role, 'web');
        }

        $this->owner = User::factory()->create();
        $this->owner->assignRole('developer');

        $this->project = Project::factory()->create(['owner_id' => $this->owner->id]);
    }

    /* -------------------------------- create ------------------------------ */

    public function test_a_task_can_be_added_to_a_project(): void
    {
        $this->actingAs($this->owner)
            ->post(route('tasks.store'), [
                'project_id' => $this->project->id,
                'title' => 'Cart & checkout flow',
                'priority' => 'urgent',
                'type' => 'feature',
                'status' => TaskStatus::Todo->value,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('tasks', [
            'project_id' => $this->project->id,
            'title' => 'Cart & checkout flow',
            'priority' => 'urgent',
            'status' => TaskStatus::Todo->value,
        ]);

        $this->assertDatabaseHas('activities', [
            'project_id' => $this->project->id,
            'event' => 'task.created',
        ]);
    }

    public function test_new_tasks_are_appended_to_the_end_of_their_column(): void
    {
        Task::factory()->for($this->project)->create([
            'status' => TaskStatus::Todo->value,
            'sort_order' => 7,
        ]);

        $this->actingAs($this->owner)->post(route('tasks.store'), [
            'project_id' => $this->project->id,
            'title' => 'Appended',
            'status' => TaskStatus::Todo->value,
        ]);

        $this->assertSame(8, Task::firstWhere('title', 'Appended')->sort_order);
    }

    public function test_a_task_title_is_required(): void
    {
        $this->actingAs($this->owner)
            ->post(route('tasks.store'), [
                'project_id' => $this->project->id,
                'title' => '',
            ])
            ->assertSessionHasErrors('title');
    }

    public function test_a_stranger_cannot_add_tasks_to_a_project(): void
    {
        $stranger = User::factory()->create();
        $stranger->assignRole('developer');

        $this->actingAs($stranger)
            ->post(route('tasks.store'), [
                'project_id' => $this->project->id,
                'title' => 'Sneaky',
            ])
            ->assertForbidden();
    }

    /* -------------------------------- status ------------------------------ */

    public function test_moving_a_task_to_done_stamps_its_completion(): void
    {
        $task = Task::factory()->for($this->project)->create();

        $this->actingAs($this->owner)
            ->put(route('tasks.status.update', $task), ['status' => TaskStatus::Done->value])
            ->assertRedirect();

        $task->refresh();

        $this->assertSame(TaskStatus::Done, $task->status);
        $this->assertNotNull($task->completed_at);
        $this->assertSame($this->owner->id, $task->completed_by);

        $this->assertDatabaseHas('activities', [
            'subject_id' => $task->id,
            'event' => 'task.status_changed',
        ]);
    }

    public function test_moving_a_task_back_out_of_done_clears_its_completion(): void
    {
        $task = Task::factory()->for($this->project)->status(TaskStatus::Done)->create([
            'completed_by' => $this->owner->id,
        ]);

        $this->actingAs($this->owner)
            ->put(route('tasks.status.update', $task), ['status' => TaskStatus::InProgress->value]);

        $task->refresh();

        $this->assertNull($task->completed_at);
        $this->assertNull($task->completed_by);
    }

    public function test_an_unknown_status_is_rejected(): void
    {
        $task = Task::factory()->for($this->project)->create();

        $this->actingAs($this->owner)
            ->put(route('tasks.status.update', $task), ['status' => 'shipped'])
            ->assertSessionHasErrors('status');
    }

    public function test_an_assignee_can_move_their_own_task_even_as_a_viewer(): void
    {
        $viewer = User::factory()->create();
        $viewer->assignRole('developer');
        $this->project->members()->attach($viewer->id, ['role' => ProjectRole::Viewer->value]);

        $task = Task::factory()->for($this->project)->create(['assignee_id' => $viewer->id]);

        $this->actingAs($viewer)
            ->put(route('tasks.status.update', $task), ['status' => TaskStatus::Review->value])
            ->assertRedirect();

        $this->assertSame(TaskStatus::Review, $task->refresh()->status);
    }

    /* ------------------------------- reorder ------------------------------ */

    public function test_the_board_layout_is_persisted_in_one_request(): void
    {
        $a = Task::factory()->for($this->project)->create([
            'status' => TaskStatus::Todo->value, 'sort_order' => 0,
        ]);
        $b = Task::factory()->for($this->project)->create([
            'status' => TaskStatus::Todo->value, 'sort_order' => 1,
        ]);

        $this->actingAs($this->owner)
            ->put(route('projects.tasks.reorder', $this->project), [
                'tasks' => [
                    ['id' => $b->id, 'status' => TaskStatus::Todo->value, 'sort_order' => 0],
                    ['id' => $a->id, 'status' => TaskStatus::InProgress->value, 'sort_order' => 0],
                ],
            ])
            ->assertRedirect();

        $this->assertSame(0, $b->refresh()->sort_order);
        $this->assertSame(TaskStatus::InProgress, $a->refresh()->status);
    }

    public function test_reordering_rejects_tasks_from_another_project(): void
    {
        $foreign = Task::factory()->create();

        $this->actingAs($this->owner)
            ->put(route('projects.tasks.reorder', $this->project), [
                'tasks' => [
                    ['id' => $foreign->id, 'status' => TaskStatus::Todo->value, 'sort_order' => 0],
                ],
            ])
            ->assertSessionHasErrors('tasks.0.id');
    }

    /* ------------------------------ assignment ---------------------------- */

    public function test_assigning_a_task_notifies_the_new_assignee(): void
    {
        Notification::fake();

        $teammate = User::factory()->create();
        $teammate->assignRole('developer');
        $task = Task::factory()->for($this->project)->create();

        $this->actingAs($this->owner)
            ->put(route('tasks.update', $task), ['assignee_id' => $teammate->id]);

        Notification::assertSentTo($teammate, TaskAssigned::class);
    }

    public function test_assigning_a_task_to_yourself_sends_no_notification(): void
    {
        Notification::fake();

        $task = Task::factory()->for($this->project)->create();

        $this->actingAs($this->owner)
            ->put(route('tasks.update', $task), ['assignee_id' => $this->owner->id]);

        Notification::assertNothingSent();
    }

    /* ------------------------------- comments ----------------------------- */

    public function test_commenting_notifies_the_assignee_but_not_the_author(): void
    {
        Notification::fake();

        $assignee = User::factory()->create();
        $assignee->assignRole('developer');
        $task = Task::factory()->for($this->project)->create(['assignee_id' => $assignee->id]);

        $this->actingAs($this->owner)
            ->post(route('tasks.comments.store', $task), ['body' => 'Staged for review.'])
            ->assertRedirect();

        $this->assertDatabaseHas('task_comments', [
            'task_id' => $task->id,
            'user_id' => $this->owner->id,
            'body' => 'Staged for review.',
        ]);

        Notification::assertSentTo($assignee, TaskCommented::class);
        Notification::assertNotSentTo($this->owner, TaskCommented::class);
    }

    public function test_an_empty_comment_is_rejected(): void
    {
        $task = Task::factory()->for($this->project)->create();

        $this->actingAs($this->owner)
            ->post(route('tasks.comments.store', $task), ['body' => ''])
            ->assertSessionHasErrors('body');
    }

    public function test_only_the_author_or_a_manager_can_delete_a_comment(): void
    {
        $member = User::factory()->create();
        $member->assignRole('developer');
        $this->project->members()->attach($member->id, ['role' => ProjectRole::Member->value]);

        $task = Task::factory()->for($this->project)->create();
        $comment = TaskComment::create([
            'task_id' => $task->id,
            'user_id' => $this->owner->id,
            'body' => 'Owner note',
        ]);

        $this->actingAs($member)
            ->delete(route('tasks.comments.destroy', [$task, $comment]))
            ->assertForbidden();

        $this->actingAs($this->owner)
            ->delete(route('tasks.comments.destroy', [$task, $comment]))
            ->assertRedirect();

        $this->assertDatabaseMissing('task_comments', ['id' => $comment->id]);
    }

    /* ------------------------------- checklist ---------------------------- */

    public function test_checklist_items_can_be_added_and_ticked_off(): void
    {
        $task = Task::factory()->for($this->project)->create();

        $this->actingAs($this->owner)
            ->post(route('tasks.checklist.store', $task), ['title' => 'Client sign-off'])
            ->assertRedirect();

        $item = TaskChecklistItem::firstWhere('title', 'Client sign-off');
        $this->assertFalse($item->is_done);

        $this->actingAs($this->owner)
            ->put(route('tasks.checklist.update', [$task, $item]), ['is_done' => true]);

        $item->refresh();
        $this->assertTrue($item->is_done);
        $this->assertNotNull($item->completed_at);

        $this->actingAs($this->owner)
            ->put(route('tasks.checklist.update', [$task, $item]), ['is_done' => false]);

        $this->assertNull($item->refresh()->completed_at);
    }

    public function test_a_checklist_item_cannot_be_reached_through_the_wrong_task(): void
    {
        $task = Task::factory()->for($this->project)->create();
        $other = Task::factory()->for($this->project)->create();

        $item = TaskChecklistItem::create(['task_id' => $task->id, 'title' => 'Step']);

        $this->actingAs($this->owner)
            ->put(route('tasks.checklist.update', [$other, $item]), ['is_done' => true])
            ->assertNotFound();
    }

    /* -------------------------------- delete ------------------------------ */

    public function test_deleting_a_task_promotes_its_subtasks(): void
    {
        $parent = Task::factory()->for($this->project)->create();
        $child = Task::factory()->for($this->project)->create([
            'parent_task_id' => $parent->id,
        ]);

        $this->actingAs($this->owner)
            ->delete(route('tasks.destroy', $parent))
            ->assertRedirect();

        $this->assertDatabaseMissing('tasks', ['id' => $parent->id]);
        $this->assertNull($child->refresh()->parent_task_id);
    }

    /* ------------------------------- my tasks ----------------------------- */

    public function test_my_tasks_lists_only_the_selected_assignees_work(): void
    {
        $teammate = User::factory()->create();
        $teammate->assignRole('developer');

        $mine = Task::factory()->for($this->project)->create([
            'assignee_id' => $this->owner->id,
        ]);
        Task::factory()->for($this->project)->create(['assignee_id' => null]);
        Task::factory()->for($this->project)->create(['assignee_id' => $teammate->id]);

        $this->actingAs($this->owner)
            ->get(route('tasks.index'))
            ->assertOk()
            ->assertInertia(
                fn ($page) => $page
                    ->component('tasks/index')
                    ->count('tasks', 1)
                    ->where('tasks.0.id', $mine->id)
            );
    }

    /** Being assigned work is itself grounds to see the project it belongs to. */
    public function test_my_tasks_reaches_across_every_project_the_user_works_on(): void
    {
        $mine = Task::factory()->for($this->project)->create([
            'assignee_id' => $this->owner->id,
        ]);
        $elsewhere = Task::factory()->create(['assignee_id' => $this->owner->id]);

        $response = $this->actingAs($this->owner)
            ->get(route('tasks.index'))
            ->assertOk();

        // The list is ordered by due date, so compare the set, not positions.
        $projectIds = collect($response->viewData('page')['props']['tasks'])
            ->pluck('project_id')
            ->sort()
            ->values()
            ->all();

        $this->assertSame(
            collect([$mine->project_id, $elsewhere->project_id])->sort()->values()->all(),
            $projectIds,
        );
    }

    public function test_my_tasks_cannot_show_work_from_an_unrelated_project(): void
    {
        $teammate = User::factory()->create();
        $teammate->assignRole('developer');

        Task::factory()->create(['assignee_id' => $teammate->id]); // unrelated project

        $this->actingAs($this->owner)
            ->get(route('tasks.index', ['assignee_id' => $teammate->id]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->count('tasks', 0));
    }
}
