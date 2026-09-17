<?php

namespace App\Http\Controllers;

use App\Enums\ProjectStatus;
use App\Enums\TaskStatus;
use App\Http\Resources\ActivityResource;
use App\Http\Resources\ProjectResource;
use App\Http\Resources\TaskResource;
use App\Models\Activity;
use App\Models\Project;
use App\Models\Task;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $visibleProjectIds = Project::query()
            ->visibleTo($user)
            ->notArchived()
            ->pluck('id');

        $taskQuery = fn () => Task::query()->whereIn('project_id', $visibleProjectIds);

        $projects = Project::query()
            ->whereIn('id', $visibleProjectIds)
            ->whereIn('status', ProjectStatus::openValues())
            ->withTaskStats()
            ->with(['client:id,company_name'])
            ->orderBy('deadline')
            ->limit(6)
            ->get();

        $upcoming = $taskQuery()
            ->open()
            ->whereNotNull('due_date')
            ->with(['assignee.roles', 'project:id,name'])
            ->orderBy('due_date')
            ->orderByRaw(
                "case priority when 'urgent' then 0 when 'high' then 1 when 'medium' then 2 else 3 end"
            )
            ->limit(8)
            ->get();

        $myTasks = $taskQuery()
            ->open()
            ->assignedTo($user->id)
            ->with(['project:id,name'])
            ->orderByRaw('due_date is null, due_date')
            ->limit(6)
            ->get();

        return Inertia::render('dashboard', [
            'stats' => [
                'active_projects' => Project::query()
                    ->whereIn('id', $visibleProjectIds)
                    ->whereIn('status', ProjectStatus::openValues())
                    ->count(),
                'in_progress_tasks' => $taskQuery()->where('status', TaskStatus::InProgress->value)->count(),
                'completed_tasks' => $taskQuery()->where('status', TaskStatus::Done->value)->count(),
                'overdue_tasks' => $taskQuery()->overdue()->count(),
                'due_this_week' => $taskQuery()->dueWithin(7)->count(),
                'my_open_tasks' => $taskQuery()->open()->assignedTo($user->id)->count(),
            ],
            'projects' => ProjectResource::collection($projects),
            'upcoming' => TaskResource::collection($upcoming),
            'myTasks' => TaskResource::collection($myTasks),
            'activities' => ActivityResource::collection(
                Activity::query()
                    ->whereIn('project_id', $visibleProjectIds)
                    ->with('causer')
                    ->latest()
                    ->limit(10)
                    ->get()
            ),
        ]);
    }
}
