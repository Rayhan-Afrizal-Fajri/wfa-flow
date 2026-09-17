<?php

namespace App\Http\Requests;

use App\Enums\ProjectCategory;
use App\Enums\TaskPriority;
use App\Enums\TaskType;
use App\Models\ProjectTemplate;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProjectTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        $template = $this->route('project_template');

        return $template
            ? $this->user()->can('update', $template)
            : $this->user()->can('create', ProjectTemplate::class);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'category' => ['required', Rule::in(ProjectCategory::values())],
            'description' => ['nullable', 'string', 'max:2000'],
            'is_active' => ['boolean'],
            'default_duration_days' => ['required', 'integer', 'min:1', 'max:365'],

            // The task checklist is edited inline with the template itself.
            'task_templates' => ['present', 'array'],
            'task_templates.*.id' => ['nullable', 'integer', 'exists:task_templates,id'],
            'task_templates.*.title' => ['required', 'string', 'max:255'],
            'task_templates.*.description' => ['nullable', 'string', 'max:2000'],
            'task_templates.*.type' => ['required', Rule::in(TaskType::values())],
            'task_templates.*.default_role' => ['nullable', 'string', 'exists:roles,name'],
            'task_templates.*.priority' => ['required', Rule::in(TaskPriority::values())],
            'task_templates.*.start_day_offset' => ['required', 'integer', 'min:0', 'max:365'],
            'task_templates.*.due_day_offset' => ['required', 'integer', 'min:0', 'max:365', 'gte:task_templates.*.start_day_offset'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'task_templates.*.title.required' => 'Every template task needs a title.',
            'task_templates.*.due_day_offset.gte' => 'The due day must be on or after the start day.',
        ];
    }
}
