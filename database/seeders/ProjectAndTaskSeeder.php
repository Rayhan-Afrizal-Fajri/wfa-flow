<?php

namespace Database\Seeders;

use App\Enums\ProjectRole;
use App\Enums\ProjectStatus;
use App\Enums\TaskStatus;
use App\Models\Client;
use App\Models\Project;
use App\Models\ProjectTemplate;
use App\Models\Task;
use App\Models\User;
use App\Services\ProjectScaffolder;
use App\Support\ActivityLogger;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class ProjectAndTaskSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::role('admin')->firstOrFail();
        $developer = User::role('developer')->firstOrFail();
        $marketer = User::role('marketer')->firstOrFail();

        $webTemplate = ProjectTemplate::where('category', 'web_app')->firstOrFail();
        $adsTemplate = ProjectTemplate::where('category', 'ads_opt')->firstOrFail();

        $scaffolder = app(ProjectScaffolder::class);

        $blueprints = [
            [
                'name' => 'Northwind Storefront',
                'client' => 'Northwind Coffee',
                'template' => $webTemplate,
                'status' => ProjectStatus::InProgress,
                'starts_days_ago' => 24,
                // Fraction of the checklist that is already finished / underway.
                'done_ratio' => 0.35,
                'progress_ratio' => 0.6,
            ],
            [
                'name' => 'Peak Fitness — Q3 Ads',
                'client' => 'Peak Fitness',
                'template' => $adsTemplate,
                'status' => ProjectStatus::InProgress,
                'starts_days_ago' => 38,
                'done_ratio' => 0.5,
                'progress_ratio' => 0.75,
            ],
            [
                'name' => 'Inventory System PT Maju Terus',
                'client' => 'PT Maju Terus',
                'template' => $webTemplate,
                'status' => ProjectStatus::Onboarding,
                'starts_days_ago' => 3,
                'done_ratio' => 0.08,
                'progress_ratio' => 0.2,
            ],
            [
                'name' => 'Karya Gemilang Brand Launch',
                'client' => 'CV Karya Gemilang',
                'template' => $adsTemplate,
                'status' => ProjectStatus::Review,
                'starts_days_ago' => 52,
                'done_ratio' => 0.85,
                'progress_ratio' => 1.0,
            ],
        ];

        foreach ($blueprints as $blueprint) {
            if (Project::where('name', $blueprint['name'])->exists()) {
                continue;
            }

            $project = $scaffolder->create([
                'name' => $blueprint['name'],
                'client_id' => Client::where('company_name', $blueprint['client'])->value('id'),
                'template_id' => $blueprint['template']->id,
                'status' => $blueprint['status']->value,
                'start_date' => Carbon::today()->subDays($blueprint['starts_days_ago'])->toDateString(),
                'member_ids' => [$developer->id, $marketer->id],
            ], $admin);

            $project->members()->syncWithoutDetaching([
                $developer->id => ['role' => ProjectRole::Member->value],
                $marketer->id => ['role' => ProjectRole::Member->value],
            ]);

            $this->advanceTasks($project, $blueprint['done_ratio'], $blueprint['progress_ratio'], $admin);
            $this->addCollaboration($project, [$admin, $developer, $marketer]);
        }
    }

    /**
     * Walks the generated checklist and pushes the earliest tasks through the
     * board, so the seeded data looks like a project genuinely in flight.
     */
    private function advanceTasks(Project $project, float $doneRatio, float $progressRatio, User $actor): void
    {
        $tasks = $project->tasks()->orderBy('sort_order')->get();
        $total = $tasks->count();

        if ($total === 0) {
            return;
        }

        $doneCount = (int) floor($total * $doneRatio);
        $movedCount = (int) floor($total * $progressRatio);

        foreach ($tasks as $index => $task) {
            $status = match (true) {
                $index < $doneCount => TaskStatus::Done,
                $index < $doneCount + 2 => TaskStatus::InProgress,
                $index < $movedCount => TaskStatus::Review,
                default => TaskStatus::Todo,
            };

            $task->applyStatus($status, $actor);

            if ($status === TaskStatus::Done) {
                $task->completed_at = Carbon::parse($task->due_date)->min(Carbon::now());
            }

            $task->save();
        }
    }

    /** @param array<int, User> $people */
    private function addCollaboration(Project $project, array $people): void
    {
        $tasks = $project->tasks()
            ->whereIn('status', [TaskStatus::InProgress->value, TaskStatus::Review->value])
            ->limit(3)
            ->get();

        $notes = [
            'Draft is up on staging — take a look when you get a minute.',
            'Client asked for one more revision on the hero section.',
            'Blocked on the API keys, following up with the client today.',
        ];

        foreach ($tasks as $index => $task) {
            $author = $people[$index % count($people)];

            $task->comments()->create([
                'user_id' => $author->id,
                'body' => $notes[$index % count($notes)],
            ]);

            ActivityLogger::log(
                event: 'task.commented',
                description: 'commented on "'.$task->title.'"',
                subject: $task,
                project: $project,
                causer: $author,
            );

            foreach (['Draft', 'Internal review', 'Client sign-off'] as $step => $title) {
                $task->checklistItems()->create([
                    'title' => $title,
                    'is_done' => $step === 0,
                    'completed_at' => $step === 0 ? now() : null,
                    'sort_order' => $step,
                ]);
            }
        }

        // A couple of overdue items so the dashboard warning states are visible.
        Task::where('project_id', $project->id)
            ->where('status', '!=', TaskStatus::Done->value)
            ->orderBy('sort_order')
            ->limit(1)
            ->update(['due_date' => Carbon::today()->subDays(3)->toDateString()]);
    }
}
