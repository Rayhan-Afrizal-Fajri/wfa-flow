<?php

namespace Database\Seeders;

use App\Models\ProjectTemplate;
use Illuminate\Database\Seeder;

class TemplateSeeder extends Seeder
{
    public function run(): void
    {
        foreach ($this->templates() as $definition) {
            $tasks = $definition['tasks'];
            unset($definition['tasks']);

            $template = ProjectTemplate::updateOrCreate(
                ['name' => $definition['name']],
                $definition,
            );

            $template->taskTemplates()->delete();

            foreach (array_values($tasks) as $index => $task) {
                $template->taskTemplates()->create([...$task, 'sort_order' => $index]);
            }
        }
    }

    /** @return array<int, array<string, mixed>> */
    private function templates(): array
    {
        return [
            [
                'name' => 'Custom Web App',
                'category' => 'web_app',
                'description' => 'Full build lifecycle from discovery to launch for a bespoke web application.',
                'is_active' => true,
                'default_duration_days' => 45,
                'tasks' => [
                    ['title' => 'Discovery & requirements workshop', 'type' => 'setup', 'priority' => 'high', 'default_role' => 'developer', 'start_day_offset' => 0, 'due_day_offset' => 2],
                    ['title' => 'Information architecture & wireframes', 'type' => 'setup', 'priority' => 'high', 'default_role' => 'developer', 'start_day_offset' => 2, 'due_day_offset' => 5],
                    ['title' => 'Design system & tokens', 'type' => 'setup', 'priority' => 'medium', 'default_role' => 'developer', 'start_day_offset' => 5, 'due_day_offset' => 8],
                    ['title' => 'Repository & CI/CD scaffolding', 'type' => 'setup', 'priority' => 'medium', 'default_role' => 'developer', 'start_day_offset' => 6, 'due_day_offset' => 9],
                    ['title' => 'Core data model & migrations', 'type' => 'feature', 'priority' => 'high', 'default_role' => 'developer', 'start_day_offset' => 9, 'due_day_offset' => 13],
                    ['title' => 'Authentication & accounts', 'type' => 'feature', 'priority' => 'high', 'default_role' => 'developer', 'start_day_offset' => 13, 'due_day_offset' => 17],
                    ['title' => 'Primary feature build', 'type' => 'feature', 'priority' => 'urgent', 'default_role' => 'developer', 'start_day_offset' => 17, 'due_day_offset' => 25],
                    ['title' => 'Marketing landing page', 'type' => 'feature', 'priority' => 'medium', 'default_role' => 'marketer', 'start_day_offset' => 22, 'due_day_offset' => 28],
                    ['title' => 'SEO & analytics setup', 'type' => 'setup', 'priority' => 'medium', 'default_role' => 'marketer', 'start_day_offset' => 28, 'due_day_offset' => 31],
                    ['title' => 'QA & accessibility pass', 'type' => 'revision', 'priority' => 'high', 'default_role' => 'developer', 'start_day_offset' => 31, 'due_day_offset' => 35],
                    ['title' => 'Performance tuning', 'type' => 'revision', 'priority' => 'medium', 'default_role' => 'developer', 'start_day_offset' => 35, 'due_day_offset' => 39],
                    ['title' => 'Launch & handoff', 'type' => 'feature', 'priority' => 'urgent', 'default_role' => 'developer', 'start_day_offset' => 39, 'due_day_offset' => 43],
                ],
            ],
            [
                'name' => 'Ads Optimization Setup',
                'category' => 'ads_opt',
                'description' => 'Standardized paid-media onboarding, tracking, and optimization cadence.',
                'is_active' => true,
                'default_duration_days' => 36,
                'tasks' => [
                    ['title' => 'Ad account & access audit', 'type' => 'setup', 'priority' => 'high', 'default_role' => 'marketer', 'start_day_offset' => 0, 'due_day_offset' => 1],
                    ['title' => 'Conversion tracking install', 'type' => 'setup', 'priority' => 'urgent', 'default_role' => 'marketer', 'start_day_offset' => 1, 'due_day_offset' => 3],
                    ['title' => 'Audience & keyword research', 'type' => 'setup', 'priority' => 'high', 'default_role' => 'marketer', 'start_day_offset' => 3, 'due_day_offset' => 5],
                    ['title' => 'Landing page speed review', 'type' => 'revision', 'priority' => 'high', 'default_role' => 'developer', 'start_day_offset' => 4, 'due_day_offset' => 7],
                    ['title' => 'Creative concepts brief', 'type' => 'feature', 'priority' => 'medium', 'default_role' => 'marketer', 'start_day_offset' => 6, 'due_day_offset' => 9],
                    ['title' => 'Campaign structure build', 'type' => 'setup', 'priority' => 'high', 'default_role' => 'marketer', 'start_day_offset' => 9, 'due_day_offset' => 12],
                    ['title' => 'A/B test creatives', 'type' => 'feature', 'priority' => 'medium', 'default_role' => 'marketer', 'start_day_offset' => 12, 'due_day_offset' => 16],
                    ['title' => 'Bid strategy optimization', 'type' => 'revision', 'priority' => 'high', 'default_role' => 'marketer', 'start_day_offset' => 16, 'due_day_offset' => 19],
                    ['title' => 'Retargeting audiences', 'type' => 'setup', 'priority' => 'medium', 'default_role' => 'marketer', 'start_day_offset' => 19, 'due_day_offset' => 22],
                    ['title' => 'Weekly performance report', 'type' => 'revision', 'priority' => 'low', 'default_role' => 'marketer', 'start_day_offset' => 22, 'due_day_offset' => 26],
                    ['title' => 'Scale winning campaigns', 'type' => 'feature', 'priority' => 'urgent', 'default_role' => 'marketer', 'start_day_offset' => 26, 'due_day_offset' => 31],
                    ['title' => 'Monthly strategy review', 'type' => 'revision', 'priority' => 'medium', 'default_role' => 'marketer', 'start_day_offset' => 31, 'due_day_offset' => 35],
                ],
            ],
            [
                'name' => 'Website Maintenance Retainer',
                'category' => 'web_app',
                'description' => 'Recurring upkeep: dependency updates, backups, uptime checks and small fixes.',
                'is_active' => true,
                'default_duration_days' => 30,
                'tasks' => [
                    ['title' => 'Dependency & security updates', 'type' => 'maintenance', 'priority' => 'high', 'default_role' => 'developer', 'start_day_offset' => 0, 'due_day_offset' => 3],
                    ['title' => 'Backup & restore verification', 'type' => 'maintenance', 'priority' => 'medium', 'default_role' => 'developer', 'start_day_offset' => 3, 'due_day_offset' => 6],
                    ['title' => 'Uptime & error log review', 'type' => 'maintenance', 'priority' => 'medium', 'default_role' => 'developer', 'start_day_offset' => 6, 'due_day_offset' => 10],
                    ['title' => 'Content & copy updates', 'type' => 'revision', 'priority' => 'low', 'default_role' => 'marketer', 'start_day_offset' => 10, 'due_day_offset' => 16],
                    ['title' => 'Monthly health report', 'type' => 'revision', 'priority' => 'medium', 'default_role' => 'developer', 'start_day_offset' => 24, 'due_day_offset' => 28],
                ],
            ],
        ];
    }
}
