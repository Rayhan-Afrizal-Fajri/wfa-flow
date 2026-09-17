<?php

namespace App\Http\Requests;

use App\Models\Client;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ClientRequest extends FormRequest
{
    public function authorize(): bool
    {
        $client = $this->client();

        return $client
            ? $this->user()->can('update', $client)
            : $this->user()->can('create', Client::class);
    }

    /** The client being edited, or null when this is a create request. */
    private function client(): ?Client
    {
        $client = $this->route('client');

        return $client instanceof Client ? $client : null;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $clientId = $this->client()?->id;

        return [
            'company_name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('clients', 'company_name')->ignore($clientId),
            ],
            'contact_name' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:500'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'company_name.required' => 'Company name is required.',
            'company_name.unique' => 'A client with this company name already exists.',
        ];
    }
}
