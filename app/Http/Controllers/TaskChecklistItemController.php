<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TaskChecklistItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class TaskChecklistItemController extends Controller
{
    public function store(Request $request, Task $task): RedirectResponse
    {
        $this->authorize('update', $task);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
        ]);

        $task->checklistItems()->create([
            'title' => $data['title'],
            'sort_order' => (int) $task->checklistItems()->max('sort_order') + 1,
        ]);

        return back();
    }

    public function update(Request $request, Task $task, TaskChecklistItem $item): RedirectResponse
    {
        abort_unless($item->task_id === $task->id, 404);
        $this->authorize('update', $task);

        $data = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'is_done' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);

        if (array_key_exists('is_done', $data)) {
            $data['completed_at'] = $data['is_done'] ? now() : null;
        }

        $item->update($data);

        return back();
    }

    public function destroy(Task $task, TaskChecklistItem $item): RedirectResponse
    {
        abort_unless($item->task_id === $task->id, 404);
        $this->authorize('update', $task);

        $item->delete();

        return back();
    }
}
