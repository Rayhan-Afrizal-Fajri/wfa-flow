<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProjectMemberRequest;
use App\Models\Project;
use App\Models\User;
use App\Notifications\AddedToProject;
use App\Support\ActivityLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;

class ProjectMemberController extends Controller
{
    public function store(ProjectMemberRequest $request, Project $project): RedirectResponse
    {
        $userId = (int) $request->validated('user_id');
        $isNew = ! $project->members()->where('users.id', $userId)->exists();

        $project->members()->syncWithoutDetaching([
            $userId => ['role' => $request->validated('role')],
        ]);

        if ($isNew) {
            $user = User::find($userId);

            ActivityLogger::log(
                event: 'project.member_added',
                description: "added {$user->name} to the project",
                subject: $project,
                project: $project,
            );

            if ($userId !== $request->user()->id) {
                $user->notify(new AddedToProject($project, $request->user()));
            }
        }

        $this->toast('Member saved.');

        return back();
    }

    public function destroy(Project $project, User $user): RedirectResponse
    {
        $this->authorize('manageMembers', $project);

        if ($project->owner_id === $user->id) {
            throw ValidationException::withMessages([
                'user_id' => 'The project owner cannot be removed. Transfer ownership first.',
            ]);
        }

        $project->members()->detach($user->id);

        ActivityLogger::log(
            event: 'project.member_removed',
            description: "removed {$user->name} from the project",
            subject: $project,
            project: $project,
        );

        $this->toast('Member removed.');

        return back();
    }
}
