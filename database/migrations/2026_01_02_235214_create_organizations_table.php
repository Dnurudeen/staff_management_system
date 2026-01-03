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
        Schema::create('organizations', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->foreignId('owner_id')->constrained('users')->onDelete('cascade');
            $table->string('subscription_plan')->default('starter'); // starter, professional, enterprise
            $table->timestamp('subscription_expires_at')->nullable();
            $table->integer('max_employees')->default(10);
            $table->json('features')->nullable(); // Plan-specific features
            $table->string('status')->default('active'); // active, suspended, cancelled
            $table->bigInteger('storage_used')->default(0); // in bytes
            $table->bigInteger('storage_limit')->default(5368709120); // 5GB in bytes
            $table->timestamps();
        });

        // Add organization_id to users table
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('organization_id')->nullable()->after('id')->constrained('organizations')->onDelete('cascade');
        });

        // Add organization_id to departments table
        Schema::table('departments', function (Blueprint $table) {
            $table->foreignId('organization_id')->nullable()->after('id')->constrained('organizations')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['organization_id']);
            $table->dropColumn('organization_id');
        });

        Schema::table('departments', function (Blueprint $table) {
            $table->dropForeign(['organization_id']);
            $table->dropColumn('organization_id');
        });

        Schema::dropIfExists('organizations');
    }
};
