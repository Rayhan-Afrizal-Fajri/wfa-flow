<?php

namespace App\Http\Controllers;

use App\Enums\ProjectStatus;
use App\Http\Requests\ClientRequest;
use App\Http\Resources\ClientResource;
use App\Http\Resources\ProjectResource;
use App\Models\Client;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ClientController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Client::class);

        $search = $request->string('search')->toString();

        $clients = Client::query()
            ->when($search !== '', fn ($q) => $q->where(function ($q) use ($search) {
                $q->where('company_name', 'like', "%{$search}%")
                    ->orWhere('contact_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            }))
            ->withCount([
                'projects',
                'projects as active_projects_count' => fn ($q) => $q->whereIn('status', ProjectStatus::openValues()),
            ])
            ->orderBy('company_name')
            ->get();

        return Inertia::render('clients/index', [
            'clients' => ClientResource::collection($clients),
            'filters' => ['search' => $search],
            'can' => [
                'create' => $request->user()->can('create', Client::class),
            ],
        ]);
    }

    public function show(Request $request, Client $client): Response
    {
        $this->authorize('view', $client);

        $client->loadCount([
            'projects',
            'projects as active_projects_count' => fn ($q) => $q->whereIn('status', ProjectStatus::openValues()),
        ]);

        $projects = $client->projects()
            ->visibleTo($request->user())
            ->withTaskStats()
            ->orderBy('deadline')
            ->get();

        return Inertia::render('clients/show', [
            'client' => new ClientResource($client),
            'projects' => ProjectResource::collection($projects),
            'can' => [
                'update' => $request->user()->can('update', $client),
                'delete' => $request->user()->can('delete', $client),
            ],
        ]);
    }

    public function store(ClientRequest $request): RedirectResponse
    {
        $client = Client::create($request->validated());

        $this->toast("Client \"{$client->company_name}\" created.");

        return back();
    }

    public function update(ClientRequest $request, Client $client): RedirectResponse
    {
        $client->update($request->validated());

        $this->toast('Client updated.');

        return back();
    }

    public function destroy(Client $client): RedirectResponse
    {
        $this->authorize('delete', $client);

        if ($client->projects()->exists()) {
            throw ValidationException::withMessages([
                'client' => 'This client still has projects. Move or delete them first.',
            ]);
        }

        $name = $client->company_name;
        $client->delete();

        $this->toast("Client \"{$name}\" deleted.");

        return to_route('clients.index');
    }
}
