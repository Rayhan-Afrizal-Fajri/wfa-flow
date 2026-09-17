<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProjectTemplateRequest;
use App\Http\Resources\ProjectTemplateResource;
use App\Models\ProjectTemplate;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class ProjectTemplateController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', ProjectTemplate::class);

        $templates = ProjectTemplate::query()
            ->with('taskTemplates')
            ->withCount('projects')
            ->orderBy('name')
            ->get();

        return Inertia::render('templates/index', [
            'templates' => ProjectTemplateResource::collection($templates),
            'roles' => Role::orderBy('name')->pluck('name'),
            'can' => [
                'create' => $request->user()->can('create', ProjectTemplate::class),
            ],
        ]);
    }

    public function store(ProjectTemplateRequest $request): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($data) {
            $template = ProjectTemplate::create($this->templateAttributes($data));
            $this->syncTaskTemplates($template, $data['task_templates']);
        });

        $this->toast('Template created.');

        return back();
    }

    public function update(ProjectTemplateRequest $request, ProjectTemplate $projectTemplate): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($data, $projectTemplate) {
            $projectTemplate->update($this->templateAttributes($data));
            $this->syncTaskTemplates($projectTemplate, $data['task_templates']);
        });

        $this->toast('Template updated.');

        return back();
    }

    public function destroy(ProjectTemplate $projectTemplate): RedirectResponse
    {
        $this->authorize('delete', $projectTemplate);

        if ($projectTemplate->projects()->exists()) {
            throw ValidationException::withMessages([
                'template' => 'This template is in use by existing projects. Deactivate it instead.',
            ]);
        }

        $projectTemplate->delete();

        $this->toast('Template deleted.');

        return back();
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function templateAttributes(array $data): array
    {
        return [
            'name' => $data['name'],
            'category' => $data['category'],
            'description' => $data['description'] ?? null,
            'is_active' => $data['is_active'] ?? true,
            'default_duration_days' => $data['default_duration_days'],
        ];
    }

    /**
     * Replaces the template's checklist with exactly what the builder sent:
     * rows carrying an id are updated in place, missing ones are removed.
     *
     * @param  array<int, array<string, mixed>>  $rows
     */
    private function syncTaskTemplates(ProjectTemplate $template, array $rows): void
    {
        $keptIds = [];

        foreach (array_values($rows) as $index => $row) {
            $attributes = [
                'title' => $row['title'],
                'description' => $row['description'] ?? null,
                'type' => $row['type'],
                'default_role' => $row['default_role'] ?? null,
                'priority' => $row['priority'],
                'start_day_offset' => $row['start_day_offset'],
                'due_day_offset' => $row['due_day_offset'],
                'sort_order' => $index,
            ];

            $task = isset($row['id'])
                ? $template->taskTemplates()->whereKey($row['id'])->first()
                : null;

            if ($task) {
                $task->update($attributes);
            } else {
                $task = $template->taskTemplates()->create($attributes);
            }

            $keptIds[] = $task->id;
        }

        $template->taskTemplates()->whereKeyNot($keptIds)->delete();
    }
}
