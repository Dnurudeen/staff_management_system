<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            // Change clock_in and clock_out from time to datetime
            $table->dateTime('clock_in')->change();
            $table->dateTime('clock_out')->nullable()->change();

            // Change total_hours from integer to decimal
            $table->decimal('total_hours', 5, 2)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->time('clock_in')->change();
            $table->time('clock_out')->nullable()->change();
            $table->integer('total_hours')->nullable()->change();
        });
    }
};
