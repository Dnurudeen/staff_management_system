<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Department;
use App\Models\Attendance;
use App\Models\LeaveRequest;
use App\Models\Task;
use App\Models\PerformanceReview;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create Departments
        $departments = [
            ['name' => 'Human Resources', 'description' => 'Manages employee relations and recruitment', 'status' => 'active'],
            ['name' => 'Engineering', 'description' => 'Software development and technical support', 'status' => 'active'],
            ['name' => 'Marketing', 'description' => 'Marketing and brand management', 'status' => 'active'],
            ['name' => 'Finance', 'description' => 'Financial planning and accounting', 'status' => 'active'],
            ['name' => 'Operations', 'description' => 'Daily operations and logistics', 'status' => 'active'],
        ];

        foreach ($departments as $dept) {
            Department::create($dept);
        }

        // Create Prime Admin
        $primeAdmin = User::create([
            'name' => 'Prime Administrator',
            'email' => 'primeadmin@staffms.com',
            'password' => Hash::make('password'),
            'role' => 'prime_admin',
            'status' => 'active',
            'department_id' => 1,
            'phone' => '+1234567890',
            'bio' => 'System administrator with full access',
            'presence_status' => 'available',
            'is_online' => true,
        ]);

        // Create 2 Admins
        $admin1 = User::create([
            'name' => 'John Admin',
            'email' => 'admin1@staffms.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'status' => 'active',
            'department_id' => 1,
            'phone' => '+1234567891',
            'bio' => 'HR Department Administrator',
            'presence_status' => 'available',
            'is_online' => true,
        ]);

        $admin2 = User::create([
            'name' => 'Sarah Admin',
            'email' => 'admin2@staffms.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'status' => 'active',
            'department_id' => 2,
            'phone' => '+1234567892',
            'bio' => 'Engineering Department Administrator',
            'presence_status' => 'available',
            'is_online' => false,
        ]);

        // Update department heads
        Department::find(1)->update(['head_id' => $admin1->id]);
        Department::find(2)->update(['head_id' => $admin2->id]);

        // Create 10 Staff members
        $staffNames = [
            'Michael Johnson',
            'Emily Davis',
            'David Wilson',
            'Jessica Martinez',
            'James Anderson',
            'Linda Taylor',
            'Robert Thomas',
            'Patricia Moore',
            'Christopher Jackson',
            'Jennifer White'
        ];

        $staff = [];
        foreach ($staffNames as $index => $name) {
            $staff[] = User::create([
                'name' => $name,
                'email' => 'staff' . ($index + 1) . '@staffms.com',
                'password' => Hash::make('password'),
                'role' => 'staff',
                'status' => 'active',
                'department_id' => ($index % 5) + 1,
                'phone' => '+12345678' . str_pad($index + 93, 2, '0', STR_PAD_LEFT),
                'bio' => 'Team member in ' . $departments[($index % 5)]['name'],
                'presence_status' => $index % 2 == 0 ? 'available' : 'away',
                'is_online' => $index % 3 == 0,
            ]);
        }

        // Create sample attendances for the current month
        $today = now();
        foreach ($staff as $user) {
            for ($i = 1; $i <= 20; $i++) {
                $date = $today->copy()->subDays($i);
                if ($date->isWeekday()) {
                    Attendance::create([
                        'user_id' => $user->id,
                        'date' => $date,
                        'clock_in' => $date->copy()->setTime(9, rand(0, 30), 0),
                        'clock_out' => $date->copy()->setTime(17, rand(0, 30), 0),
                        'total_hours' => 8,
                        'is_late' => rand(0, 10) > 8,
                        'status' => 'present',
                    ]);
                }
            }
        }

        // Create sample leave requests
        foreach ($staff as $index => $user) {
            if ($index < 5) {
                LeaveRequest::create([
                    'user_id' => $user->id,
                    'leave_type' => ['sick', 'vacation', 'personal'][rand(0, 2)],
                    'start_date' => now()->addDays(rand(5, 15)),
                    'end_date' => now()->addDays(rand(16, 25)),
                    'total_days' => rand(2, 5),
                    'reason' => 'Personal reasons',
                    'status' => ['pending', 'approved', 'rejected'][rand(0, 2)],
                    'approved_by' => $admin1->id,
                ]);
            }
        }

        // Create sample tasks
        foreach ($staff as $index => $user) {
            Task::create([
                'title' => 'Complete project documentation',
                'description' => 'Document all features and API endpoints',
                'assigned_to' => $user->id,
                'assigned_by' => $admin1->id,
                'department_id' => $user->department_id,
                'priority' => ['low', 'medium', 'high'][rand(0, 2)],
                'status' => ['pending', 'in_progress', 'completed'][rand(0, 2)],
                'due_date' => now()->addDays(rand(1, 30)),
            ]);
        }

        // Create sample performance reviews
        foreach ($staff as $index => $user) {
            if ($index < 3) {
                PerformanceReview::create([
                    'user_id' => $user->id,
                    'reviewer_id' => $admin1->id,
                    'review_period' => 'Q4 2024',
                    'rating' => rand(3, 5),
                    'strengths' => 'Excellent team player, strong technical skills',
                    'areas_for_improvement' => 'Could improve time management',
                    'goals' => 'Lead a major project in Q1 2025',
                    'comments' => 'Overall great performance',
                    'status' => 'completed',
                    'reviewed_at' => now()->subDays(rand(10, 30)),
                ]);
            }
        }

        $this->command->info('Database seeded successfully!');
        $this->command->info('Login Credentials:');
        $this->command->info('Prime Admin: primeadmin@staffms.com / password');
        $this->command->info('Admin 1: admin1@staffms.com / password');
        $this->command->info('Admin 2: admin2@staffms.com / password');
        $this->command->info('Staff: staff1@staffms.com to staff10@staffms.com / password');
    }
}
