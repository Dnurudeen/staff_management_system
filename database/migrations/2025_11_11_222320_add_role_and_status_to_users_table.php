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
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['prime_admin', 'admin', 'staff'])->default('staff')->after('email');
            $table->enum('status', ['active', 'inactive', 'suspended'])->default('active')->after('role');
            $table->foreignId('department_id')->nullable()->constrained()->nullOnDelete()->after('status');
            $table->string('phone')->nullable()->after('department_id');
            $table->string('avatar')->nullable()->after('phone');
            $table->text('bio')->nullable()->after('avatar');
            $table->enum('presence_status', ['available', 'away', 'busy', 'do_not_disturb', 'offline'])->default('offline')->after('bio');
            $table->string('custom_status')->nullable()->after('presence_status');
            $table->timestamp('last_seen_at')->nullable()->after('custom_status');
            $table->boolean('is_online')->default(false)->after('last_seen_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['department_id']);
            $table->dropColumn([
                'role',
                'status',
                'department_id',
                'phone',
                'avatar',
                'bio',
                'presence_status',
                'custom_status',
                'last_seen_at',
                'is_online'
            ]);
        });
    }
};
