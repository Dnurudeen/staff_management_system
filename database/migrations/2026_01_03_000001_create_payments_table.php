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
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('email');
            $table->string('reference')->unique();
            $table->decimal('amount', 10, 2);
            $table->string('currency')->default('NGN');
            $table->string('payment_method')->nullable(); // paystack, flutterwave
            $table->string('status')->default('pending'); // pending, success, failed
            $table->string('plan')->nullable(); // starter, professional, enterprise
            $table->json('metadata')->nullable();
            $table->string('transaction_id')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });

        // Add payment-related columns to users table
        Schema::table('users', function (Blueprint $table) {
            $table->string('subscription_plan')->nullable()->after('role');
            $table->timestamp('subscription_expires_at')->nullable()->after('subscription_plan');
            $table->boolean('is_paid')->default(false)->after('subscription_expires_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['subscription_plan', 'subscription_expires_at', 'is_paid']);
        });
    }
};
