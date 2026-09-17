<?php

namespace App\Enums;

enum ProjectRole: string
{
    case Manager = 'manager';
    case Member = 'member';
    case Viewer = 'viewer';

    /** @return array<int, string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function label(): string
    {
        return ucfirst($this->value);
    }

    public function canEdit(): bool
    {
        return $this !== self::Viewer;
    }
}
