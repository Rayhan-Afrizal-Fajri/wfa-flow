<?php

namespace App\Enums;

enum ProjectStatus: string
{
    case Onboarding = 'onboarding';
    case InProgress = 'in_progress';
    case Review = 'review';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
    case Closed = 'closed';

    /** @return array<int, string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Statuses that still consume team capacity.
     *
     * @return array<int, string>
     */
    public static function openValues(): array
    {
        return [self::Onboarding->value, self::InProgress->value, self::Review->value];
    }

    public function label(): string
    {
        return match ($this) {
            self::Onboarding => 'Onboarding',
            self::InProgress => 'In Progress',
            self::Review => 'Review',
            self::Completed => 'Completed',
            self::Cancelled => 'Cancelled',
            self::Closed => 'Closed',
        };
    }
}
