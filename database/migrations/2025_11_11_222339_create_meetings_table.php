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
        Schema::create('meetings', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->text('agenda')->nullable();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->enum('type', ['audio', 'video', 'in_person'])->default('video');
            $table->dateTime('scheduled_at');
            $table->integer('duration')->default(60); // In minutes
            $table->string('location')->nullable(); // For in-person meetings
            $table->string('meeting_link')->nullable(); // Generated meeting link
            $table->enum('status', ['scheduled', 'ongoing', 'completed', 'cancelled'])->default('scheduled');
            $table->enum('recurrence', ['none', 'daily', 'weekly', 'monthly'])->default('none');
            $table->dateTime('recurrence_end_date')->nullable();
            $table->json('attachments')->nullable();
            $table->text('notes')->nullable();
            $table->string('recording_path')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('meetings');
    }
};
