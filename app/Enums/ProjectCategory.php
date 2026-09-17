<?php

namespace App\Enums;

enum ProjectCategory: string
{
    case WebApp = 'web_app';
    case AdsOptimization = 'ads_opt';

    /** @return array<int, string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function label(): string
    {
        return match ($this) {
            self::WebApp => 'Web App',
            self::AdsOptimization => 'Ads Optimization',
        };
    }
}
