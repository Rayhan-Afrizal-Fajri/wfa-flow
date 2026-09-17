<?php

namespace App\Policies;

use App\Models\Client;
use App\Models\User;

class ClientPolicy
{
    public function before(User $user, string $ability): ?bool
    {
        return $user->hasRole('admin') ? true : null;
    }

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Client $client): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'developer', 'marketer']);
    }

    public function update(User $user, Client $client): bool
    {
        return $this->create($user);
    }

    /** Never orphan projects: a client with work on the books stays put. */
    public function delete(User $user, Client $client): bool
    {
        return $user->hasRole('admin') && $client->projects()->doesntExist();
    }
}
