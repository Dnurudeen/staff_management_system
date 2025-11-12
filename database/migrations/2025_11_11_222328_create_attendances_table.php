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
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->dateTime('clock_in');
            $table->dateTime('clock_out')->nullable();
            $table->decimal('total_hours', 5, 2)->nullable();
            $table->boolean('is_late')->default(false);
            $table->text('notes')->nullable();
            $table->enum('status', ['present', 'absent', 'half_day', 'on_leave'])->default('present');
            $table->timestamps();

            $table->unique(['user_id', 'date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};
