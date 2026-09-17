<?php

namespace App\Http\Requests;

use App\Enums\TaskStatus;
use App\Models\Project;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReorderTasksRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->project());
    }

    private function project(): Project
    {
        $project = $this->route('project');

        return $project instanceof Project ? $project : abort(404);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'tasks' => ['required', 'array', 'min:1'],
            'tasks.*.id' => [
                'required',
                'integer',
                Rule::exists('tasks', 'id')->where('project_id', $this->project()->id),
            ],
            'tasks.*.status' => ['required', Rule::in(TaskStatus::values())],
            'tasks.*.sort_order' => ['required', 'integer', 'min:0'],
        ];
    }
}
