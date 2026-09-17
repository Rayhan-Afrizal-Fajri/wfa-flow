<?php

namespace App\Support;

use App\Models\Activity;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

/**
 * Thin write-side helper for the project timeline. Everything that changes a
 * project or one of its tasks funnels through here so the timeline stays a
 * single, chronologically ordered source of truth.
 */
class ActivityLogger
{
    /** @param  array<string, mixed>  $properties */
    public static function log(
        string $event,
        string $description,
        ?Model $subject = null,
        Project|int|null $project = null,
        array $properties = [],
        ?User $causer = null,
    ): Activity {
        $projectId = $project instanceof Project ? $project->id : $project;

        return Activity::create([
            'project_id' => $projectId,
            'causer_id' => ($causer ?? auth()->user())?->id,
            'subject_type' => $subject?->getMorphClass(),
            'subject_id' => $subject?->getKey(),
            'event' => $event,
            'description' => $description,
            'properties' => $properties ?: null,
        ]);
    }

    /**
     * Records only the attributes that actually changed, so the timeline does
     * not fill up with no-op "updated" entries.
     *
     * @param  array<string, mixed>  $before
     * @param  array<string, mixed>  $after
     * @return array<string, array{from: mixed, to: mixed}>
     */
    public static function diff(array $before, array $after): array
    {
        $changes = [];

        foreach ($after as $key => $value) {
            $old = $before[$key] ?? null;

            if (self::normalise($old) !== self::normalise($value)) {
                $changes[$key] = ['from' => self::normalise($old), 'to' => self::normalise($value)];
            }
        }

        return $changes;
    }

    private static function normalise(mixed $value): mixed
    {
        if ($value instanceof \BackedEnum) {
            return $value->value;
        }

        if ($value instanceof \DateTimeInterface) {
            return $value->format('Y-m-d');
        }

        return $value;
    }
}
