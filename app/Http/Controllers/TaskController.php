<?php

namespace App\Http\Controllers;

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Http\Resources\ProjectSummaryResource;
use App\Http\Resources\TaskResource;
use App\Http\Resources\UserResource;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use App\Notifications\TaskAssigned;
use App\Support\ActivityLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class TaskController extends Controller
{
    /** "My Tasks": every task the caller can see, filtered by assignee. */
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'assignee_id' => ['nullable', 'integer', 'exists:users,id'],
            'status' => ['nullable', Rule::in(TaskStatus::values())],
            'priority' => ['nullable', Rule::in(TaskPriority::values())],
            'project_id' => ['nullable', 'integer', 'exists:projects,id'],
            'search' => ['nullable', 'string', 'max:100'],
        ]);

        $assigneeId = (int) ($filters['assignee_id'] ?? $request->user()->id);

        $visibleProjectIds = Project::query()
            ->visibleTo($request->user())
            ->notArchived()
            ->pluck('id');

        $tasks = Task::query()
            ->whereIn('project_id', $visibleProjectIds)
            ->where('assignee_id', $assigneeId)
            ->when($filters['status'] ?? null, fn ($q, $status) => $q->where('status', $status))
            ->when($filters['priority'] ?? null, fn ($q, $priority) => $q->where('priority', $priority))
            ->when($filters['project_id'] ?? null, fn ($q, $projectId) => $q->where('project_id', $projectId))
            ->when($filters['search'] ?? null, fn ($q, $search) => $q->where('title', 'like', "%{$search}%"))
            ->with([
                'assignee.roles',
                'project:id,name,client_id',
                'project.client:id,company_name',
                'checklistItems',
                'comments.user',
            ])
            ->withCount([
                'comments',
                'checklistItems',
                'checklistItems as checklist_done_count' => fn ($q) => $q->where('is_done', true),
            ])
            ->orderByRaw('due_date is null, due_date')
            ->get();

        return Inertia::render('tasks/index', [
            'tasks' => TaskResource::collection($tasks),
            'users' => UserResource::collection(User::active()->with('roles')->orderBy('name')->get()),
            'projects' => ProjectSummaryResource::collection(
                Project::whereIn('id', $visibleProjectIds)->orderBy('name')->get(['id', 'name'])
            ),
            'filters' => [...$filters, 'assignee_id' => $assigneeId],
        ]);
    }

    public function store(StoreTaskRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $status = $data['status'] ?? TaskStatus::Todo->value;

        $task = new Task([
            ...$data,
            'status' => $status,
            'type' => $data['type'] ?? 'feature',
            'priority' => $data['priority'] ?? 'medium',
            'sort_order' => $this->nextSortOrder((int) $data['project_id'], $status),
        ]);

        $task->applyStatus(TaskStatus::from($status), $request->user());
        $task->save();

        ActivityLogger::log(
            event: 'task.created',
            description: "added the task \"{$task->title}\"",
            subject: $task,
            project: $task->project_id,
        );

        $this->notifyAssignee($task, $request->user());

        $this->toast('Task created.');

        return back();
    }

    public function update(UpdateTaskRequest $request, Task $task): RedirectResponse
    {
        $data = $request->validated();
        $before = $task->only(['title', 'status', 'priority', 'type', 'assignee_id', 'due_date', 'start_date']);
        $previousAssignee = $task->assignee_id;

        if (array_key_exists('status', $data)) {
            $task->applyStatus(TaskStatus::from($data['status']), $request->user());
            unset($data['status']);
        }

        $task->fill($data)->save();

        $changes = ActivityLogger::diff($before, $task->only(array_keys($before)));

        if ($changes !== []) {
            ActivityLogger::log(
                event: 'task.updated',
                description: $this->describeChanges($task, $changes),
                subject: $task,
                project: $task->project_id,
                properties: ['changes' => $changes],
            );
        }

        if ($task->assignee_id && $task->assignee_id !== $previousAssignee) {
            $this->notifyAssignee($task, $request->user());
        }

        $this->toast('Task updated.');

        return back();
    }

    public function destroy(Task $task): RedirectResponse
    {
        $this->authorize('delete', $task);

        // Promote subtasks rather than cascading the delete silently.
        $task->children()->update(['parent_task_id' => $task->parent_task_id]);

        ActivityLogger::log(
            event: 'task.deleted',
            description: "deleted the task \"{$task->title}\"",
            project: $task->project_id,
        );

        $task->delete();

        $this->toast('Task deleted.');

        return back();
    }

    /** Appends to the end of the destination column. */
    private function nextSortOrder(int $projectId, string $status): int
    {
        return (int) Task::where('project_id', $projectId)
            ->where('status', $status)
            ->max('sort_order') + 1;
    }

    private function notifyAssignee(Task $task, User $actor): void
    {
        if ($task->assignee_id && $task->assignee_id !== $actor->id) {
            $task->assignee?->notify(new TaskAssigned($task, $actor));
        }
    }

    /** @param array<string, array{from: mixed, to: mixed}> $changes */
    private function describeChanges(Task $task, array $changes): string
    {
        if (isset($changes['status'])) {
            $to = TaskStatus::tryFrom((string) $changes['status']['to'])?->label() ?? $changes['status']['to'];

            return "moved \"{$task->title}\" to {$to}";
        }

        if (isset($changes['assignee_id'])) {
            $name = $task->assignee->name ?? 'nobody';

            return "assigned \"{$task->title}\" to {$name}";
        }

        return "updated \"{$task->title}\"";
    }
}
