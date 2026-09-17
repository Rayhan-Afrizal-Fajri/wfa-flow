<?php

namespace App\Http\Requests;

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Enums\TaskType;
use App\Models\Task;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->task());
    }

    private function task(): Task
    {
        $task = $this->route('task');

        return $task instanceof Task ? $task : abort(404);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $task = $this->task();

        return [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:10000'],
            'assignee_id' => ['sometimes', 'nullable', 'integer', 'exists:users,id'],
            'parent_task_id' => [
                'sometimes',
                'nullable',
                'integer',
                // Same project, and never its own parent.
                Rule::exists('tasks', 'id')->where('project_id', $task->project_id),
                Rule::notIn([$task->id]),
            ],
            'type' => ['sometimes', Rule::in(TaskType::values())],
            'status' => ['sometimes', Rule::in(TaskStatus::values())],
            'priority' => ['sometimes', Rule::in(TaskPriority::values())],
            'start_date' => ['sometimes', 'nullable', 'date'],
            'due_date' => ['sometimes', 'nullable', 'date'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'parent_task_id.not_in' => 'A task cannot be its own parent.',
        ];
    }
}
