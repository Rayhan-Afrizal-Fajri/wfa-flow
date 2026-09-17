<?php

namespace App\Http\Controllers;

use App\Enums\ProjectCategory;
use App\Enums\ProjectStatus;
use App\Http\Requests\StoreProjectRequest;
use App\Http\Requests\UpdateProjectRequest;
use App\Http\Resources\ActivityResource;
use App\Http\Resources\ClientResource;
use App\Http\Resources\ProjectResource;
use App\Http\Resources\ProjectTemplateResource;
use App\Http\Resources\TaskResource;
use App\Http\Resources\UserResource;
use App\Models\Client;
use App\Models\Project;
use App\Models\ProjectTemplate;
use App\Models\User;
use App\Services\ProjectScaffolder;
use App\Support\ActivityLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
    public function __construct(private readonly ProjectScaffolder $scaffolder) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Project::class);

        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::in(ProjectStatus::values())],
            'category' => ['nullable', Rule::in(ProjectCategory::values())],
            'client_id' => ['nullable', 'integer'],
            'archived' => ['nullable', 'boolean'],
        ]);

        $projects = Project::query()
            ->visibleTo($request->user())
            ->when(
                filter_var($filters['archived'] ?? false, FILTER_VALIDATE_BOOL),
                fn ($q) => $q->whereNotNull('archived_at'),
                fn ($q) => $q->whereNull('archived_at'),
            )
            ->when($filters['search'] ?? null, fn ($q, $search) => $q->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhereHas('client', fn ($c) => $c->where('company_name', 'like', "%{$search}%"));
            }))
            ->when($filters['status'] ?? null, fn ($q, $status) => $q->where('status', $status))
            ->when($filters['category'] ?? null, fn ($q, $category) => $q->where('category', $category))
            ->when($filters['client_id'] ?? null, fn ($q, $clientId) => $q->where('client_id', $clientId))
            ->withTaskStats()
            ->with(['client:id,company_name', 'members.roles', 'owner'])
            ->orderByRaw(
                "case status when 'in_progress' then 0 when 'onboarding' then 1 when 'review' then 2 ".
                "when 'completed' then 3 when 'closed' then 4 else 5 end"
            )
            ->orderBy('deadline')
            ->get();

        return Inertia::render('projects/index', [
            'projects' => ProjectResource::collection($projects),
            'clients' => ClientResource::collection(Client::orderBy('company_name')->get(['id', 'company_name'])),
            'templates' => ProjectTemplateResource::collection(
                ProjectTemplate::active()->withCount('taskTemplates')->orderBy('name')->get()
            ),
            'users' => UserResource::collection(User::active()->with('roles')->orderBy('name')->get()),
            'filters' => $filters,
            'can' => [
                'create' => $request->user()->can('create', Project::class),
            ],
        ]);
    }

    public function show(Request $request, Project $project): Response
    {
        $this->authorize('view', $project);

        $project->load([
            'client',
            'template',
            'owner',
            'members.roles',
        ])->loadCount([
            'tasks',
            'tasks as done_tasks_count' => fn ($q) => $q->where('status', 'done'),
            'tasks as overdue_tasks_count' => fn ($q) => $q
                ->where('status', '!=', 'done')
                ->whereNotNull('due_date')
                ->whereDate('due_date', '<', now()->toDateString()),
        ]);

        // Comments and checklists ride along so the task detail sheet opens
        // instantly; a project's task count is small enough for this to be
        // cheaper than a round trip per card.
        $tasks = $project->tasks()
            ->with(['assignee.roles', 'checklistItems', 'comments.user'])
            ->withCount([
                'comments',
                'checklistItems',
                'checklistItems as checklist_done_count' => fn ($q) => $q->where('is_done', true),
            ])
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return Inertia::render('projects/show', [
            'project' => new ProjectResource($project),
            'tasks' => TaskResource::collection($tasks),
            'users' => UserResource::collection(User::active()->with('roles')->orderBy('name')->get()),
            'activities' => ActivityResource::collection(
                $project->activities()->with('causer')->latest()->limit(40)->get()
            ),
            'can' => [
                'update' => $request->user()->can('update', $project),
                'delete' => $request->user()->can('delete', $project),
                'manageMembers' => $request->user()->can('manageMembers', $project),
            ],
        ]);
    }

    public function store(StoreProjectRequest $request): RedirectResponse
    {
        $project = $this->scaffolder->create($request->validated(), $request->user());

        $this->toast("Project \"{$project->name}\" created.");

        return to_route('projects.show', $project);
    }

    public function update(UpdateProjectRequest $request, Project $project): RedirectResponse
    {
        $data = $request->validated();
        $before = $project->only(['name', 'status', 'category', 'client_id', 'start_date', 'deadline']);

        if (array_key_exists('archived', $data)) {
            $project->archived_at = $data['archived'] ? now() : null;
            unset($data['archived']);
        }

        $project->fill($data)->save();

        $changes = ActivityLogger::diff($before, $project->only(array_keys($before)));

        if ($changes !== []) {
            ActivityLogger::log(
                event: 'project.updated',
                description: 'updated the project details',
                subject: $project,
                project: $project,
                properties: ['changes' => $changes],
            );
        }

        $this->toast('Project updated.');

        return back();
    }

    public function destroy(Project $project): RedirectResponse
    {
        $this->authorize('delete', $project);

        $name = $project->name;
        $project->delete();

        $this->toast("Project \"{$name}\" deleted.");

        return to_route('projects.index');
    }
}
