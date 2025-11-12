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
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('conversation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['text', 'voice', 'file', 'image', 'video'])->default('text');
            $table->text('content')->nullable(); // For text messages
            $table->string('file_path')->nullable(); // For voice, file, image, video
            $table->string('file_name')->nullable();
            $table->string('file_type')->nullable();
            $table->integer('file_size')->nullable(); // In bytes
            $table->integer('voice_duration')->nullable(); // In seconds
            $table->foreignId('reply_to')->nullable()->constrained('messages')->nullOnDelete();
            $table->boolean('is_edited')->default(false);
            $table->boolean('is_deleted')->default(false);
            $table->json('reactions')->nullable();
            $table->timestamps();

            $table->index(['conversation_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
