<?php

namespace App\Http\Requests;

use App\Enums\ProjectCategory;
use App\Enums\ProjectStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('project'));
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'client_id' => ['nullable', 'integer', 'exists:clients,id'],
            'category' => ['sometimes', 'required', Rule::in(ProjectCategory::values())],
            'status' => ['sometimes', 'required', Rule::in(ProjectStatus::values())],
            'start_date' => ['sometimes', 'required', 'date'],
            'deadline' => ['sometimes', 'required', 'date', 'after_or_equal:start_date'],
            'archived' => ['sometimes', 'boolean'],
        ];
    }
}
