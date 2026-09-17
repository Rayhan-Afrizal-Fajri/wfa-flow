<?php

namespace App\Enums;

enum TaskType: string
{
    case Feature = 'feature';
    case Setup = 'setup';
    case Revision = 'revision';
    case Maintenance = 'maintenance';

    /** @return array<int, string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function label(): string
    {
        return ucfirst($this->value);
    }
}
