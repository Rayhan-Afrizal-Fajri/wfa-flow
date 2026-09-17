<?php

namespace App\Http\Controllers;

use App\Enums\TaskStatus;
use App\Http\Requests\ReorderTasksRequest;
use App\Http\Requests\UpdateTaskStatusRequest;
use App\Models\Project;
use App\Models\Task;
use App\Support\ActivityLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

/**
 * Kanban writes. Kept separate from TaskController because the board only ever
 * moves cards between columns, and it does so on every drag.
 */
class TaskStatusController extends Controller
{
    /** Moves a single card, optionally to a given position in the column. */
    public function update(UpdateTaskStatusRequest $request, Task $task): RedirectResponse
    {
        $status = TaskStatus::from($request->validated('status'));
        $previous = $task->status;

        if ($previous === $status && $request->validated('sort_order') === null) {
            return back();
        }

        DB::transaction(function () use ($task, $status, $request) {
            $position = $request->validated('sort_order');

            if ($position !== null) {
                // Make room at the target index inside the destination column.
                Task::where('project_id', $task->project_id)
                    ->where('status', $status->value)
                    ->whereKeyNot($task->id)
                    ->where('sort_order', '>=', $position)
                    ->increment('sort_order');

                $task->sort_order = $position;
            } elseif ($task->status !== $status) {
                $task->sort_order = (int) Task::where('project_id', $task->project_id)
                    ->where('status', $status->value)
                    ->max('sort_order') + 1;
            }

            $task->applyStatus($status, $request->user());
            $task->save();
        });

        if ($previous !== $status) {
            ActivityLogger::log(
                event: 'task.status_changed',
                description: "moved \"{$task->title}\" to {$status->label()}",
                subject: $task,
                project: $task->project_id,
                properties: ['from' => $previous->value, 'to' => $status->value],
            );
        }

        return back();
    }

    /**
     * Persists a whole board layout in one round trip. The client sends the
     * final (status, sort_order) of every card it moved.
     */
    public function reorder(ReorderTasksRequest $request, Project $project): RedirectResponse
    {
        $moves = [];

        foreach ((array) $request->validated('tasks') as $row) {
            $moves[(int) $row['id']] = [
                'status' => TaskStatus::from($row['status']),
                'sort_order' => (int) $row['sort_order'],
            ];
        }

        DB::transaction(function () use ($moves, $project, $request) {
            $tasks = Task::where('project_id', $project->id)
                ->whereIn('id', array_keys($moves))
                ->get();

            foreach ($tasks as $task) {
                $move = $moves[$task->id];

                $task->sort_order = $move['sort_order'];
                $task->applyStatus($move['status'], $request->user());
                $task->save();
            }
        });

        return back();
    }
}
