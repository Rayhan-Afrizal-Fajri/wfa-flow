<?php

namespace App\Http\Requests;

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Enums\TaskType;
use App\Models\Project;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        $project = Project::find($this->input('project_id'));

        return $project !== null && $this->user()->can('update', $project);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'project_id' => ['required', 'integer', 'exists:projects,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:10000'],
            'assignee_id' => ['nullable', 'integer', 'exists:users,id'],
            'parent_task_id' => [
                'nullable',
                'integer',
                // A subtask must live in the same project as its parent.
                Rule::exists('tasks', 'id')->where('project_id', $this->input('project_id')),
            ],
            'type' => ['nullable', Rule::in(TaskType::values())],
            'status' => ['nullable', Rule::in(TaskStatus::values())],
            'priority' => ['nullable', Rule::in(TaskPriority::values())],
            'start_date' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date', 'after_or_equal:start_date'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'title.required' => 'Give the task a title.',
            'due_date.after_or_equal' => 'The due date must be on or after the start date.',
        ];
    }
}
