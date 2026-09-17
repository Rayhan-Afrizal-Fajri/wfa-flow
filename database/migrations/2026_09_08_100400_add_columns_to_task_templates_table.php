<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('task_templates', function (Blueprint $table) {
            $table->enum('type', ['feature', 'setup', 'revision', 'maintenance'])
                ->default('feature')
                ->after('description');
            // Which team role this seed task should be auto-assigned to.
            $table->string('default_role')->nullable()->after('type');
            $table->unsignedInteger('sort_order')->default(0)->after('due_day_offset');
        });
    }

    public function down(): void
    {
        Schema::table('task_templates', function (Blueprint $table) {
            $table->dropColumn(['type', 'default_role', 'sort_order']);
        });
    }
};
