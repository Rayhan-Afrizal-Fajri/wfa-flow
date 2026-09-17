<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Inertia\Inertia;

abstract class Controller
{
    use AuthorizesRequests;

    /**
     * Queue a toast for the next Inertia response.
     *
     * This rides Inertia's own flash channel rather than the session prop bag:
     * flash data is delivered once and is never written into the browser's
     * history state, so a toast cannot reappear when the user navigates back.
     */
    protected function toast(string $message, string $type = 'success'): void
    {
        Inertia::flash('toast', [
            'type' => $type,
            'message' => $message,
        ]);
    }
}
