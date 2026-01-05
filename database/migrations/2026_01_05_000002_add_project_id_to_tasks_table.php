<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->foreignId('project_id')->nullable()->after('department_id')->constrained()->nullOnDelete();
            $table->foreignId('organization_id')->nullable()->after('id')->constrained()->cascadeOnDelete();

            $table->index(['project_id', 'status']);
            $table->index(['organization_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropForeign(['project_id']);
            $table->dropForeign(['organization_id']);
            $table->dropColumn(['project_id', 'organization_id']);
        });
    }
};
