<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('project_templates', function (Blueprint $table) {
            $table->boolean('is_active')->default(true)->after('description');
            // Fallback project length when no task template reaches further out.
            $table->unsignedSmallInteger('default_duration_days')->default(30)->after('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('project_templates', function (Blueprint $table) {
            $table->dropColumn(['is_active', 'default_duration_days']);
        });
    }
};
