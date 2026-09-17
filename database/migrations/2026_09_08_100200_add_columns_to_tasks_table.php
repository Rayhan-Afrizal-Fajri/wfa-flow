<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            // Kanban ordering within a status column.
            $table->unsignedInteger('sort_order')->default(0)->after('priority');
            $table->timestamp('completed_at')->nullable()->after('due_date');
            $table->foreignId('completed_by')->nullable()->after('completed_at')->constrained('users')->nullOnDelete();

            // Dates are optional: template-generated tasks always have them,
            // ad-hoc tasks created from the board may not.
            $table->date('start_date')->nullable()->change();
            $table->date('due_date')->nullable()->change();

            $table->index(['project_id', 'status', 'sort_order']);
            $table->index(['assignee_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropIndex(['project_id', 'status', 'sort_order']);
            $table->dropIndex(['assignee_id', 'status']);
            $table->dropConstrainedForeignId('completed_by');
            $table->dropColumn(['sort_order', 'completed_at']);
        });
    }
};
