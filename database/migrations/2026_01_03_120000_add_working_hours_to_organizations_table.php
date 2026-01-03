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
        Schema::table('organizations', function (Blueprint $table) {
            $table->time('work_start_time')->default('09:00:00')->after('features');
            $table->time('work_end_time')->default('17:00:00')->after('work_start_time');
            $table->integer('late_threshold_minutes')->default(15)->after('work_end_time');
            $table->json('work_days')->nullable()->after('late_threshold_minutes'); // e.g., [1,2,3,4,5] for Mon-Fri
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('organizations', function (Blueprint $table) {
            $table->dropColumn(['work_start_time', 'work_end_time', 'late_threshold_minutes', 'work_days']);
        });
    }
};
