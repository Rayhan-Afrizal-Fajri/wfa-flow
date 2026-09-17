<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RoleAndUserSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (['admin', 'developer', 'marketer'] as $name) {
            Role::findOrCreate($name, 'web');
        }

        $people = [
            [
                'name' => 'Rayhan Afrizal Fajri',
                'email' => 'rayhan@agency.test',
                'job_title' => 'Lead Developer',
                'role' => 'admin',
            ],
            [
                'name' => 'Maya Chen',
                'email' => 'maya@agency.test',
                'job_title' => 'Full-stack Developer',
                'role' => 'developer',
            ],
            [
                'name' => 'Diego Alvarez',
                'email' => 'diego@agency.test',
                'job_title' => 'Paid Media Specialist',
                'role' => 'marketer',
            ],
            [
                'name' => 'Ads Partner',
                'email' => 'ads@agency.test',
                'job_title' => 'Ads Strategist',
                'role' => 'marketer',
            ],
        ];

        foreach ($people as $person) {
            $user = User::firstOrCreate(
                ['email' => $person['email']],
                [
                    'name' => $person['name'],
                    'password' => Hash::make('password'),
                    'job_title' => $person['job_title'],
                    'is_active' => true,
                    'email_verified_at' => now(),
                ],
            );

            $user->syncRoles([$person['role']]);
        }
    }
}
