<?php

namespace App\Http\Controllers;

use App\Http\Requests\TaskCommentRequest;
use App\Models\Task;
use App\Models\TaskComment;
use App\Models\User;
use App\Notifications\TaskCommented;
use App\Support\ActivityLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;

class TaskCommentController extends Controller
{
    public function store(TaskCommentRequest $request, Task $task): RedirectResponse
    {
        $comment = $task->comments()->create([
            'user_id' => $request->user()->id,
            'body' => $request->validated('body'),
        ]);

        ActivityLogger::log(
            event: 'task.commented',
            description: 'commented on "'.$task->title.'": '.Str::limit($comment->body, 100),
            subject: $task,
            project: $task->project_id,
        );

        $this->notifyWatchers($task, $comment, $request->user()->id);

        return back();
    }

    public function update(TaskCommentRequest $request, Task $task, TaskComment $comment): RedirectResponse
    {
        abort_unless($comment->task_id === $task->id, 404);

        $comment->update([
            'body' => $request->validated('body'),
            'edited_at' => now(),
        ]);

        return back();
    }

    public function destroy(Task $task, TaskComment $comment): RedirectResponse
    {
        abort_unless($comment->task_id === $task->id, 404);
        $this->authorize('delete', $comment);

        $comment->delete();

        $this->toast('Comment deleted.');

        return back();
    }

    /**
     * Everyone with a stake in the task hears about it: the assignee, the
     * project owner, and anyone who already commented — minus the author.
     */
    private function notifyWatchers(Task $task, TaskComment $comment, int $authorId): void
    {
        $comment->loadMissing('user');

        $recipientIds = collect([$task->assignee_id, $task->project->owner_id])
            ->merge($task->comments()->pluck('user_id'))
            ->filter()
            ->unique()
            ->reject(fn ($id) => (int) $id === $authorId);

        if ($recipientIds->isEmpty()) {
            return;
        }

        Notification::send(
            User::whereIn('id', $recipientIds)->get(),
            new TaskCommented($comment),
        );
    }
}
