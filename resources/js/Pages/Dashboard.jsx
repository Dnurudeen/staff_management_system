import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import StatCard from "@/Components/Dashboard/StatCard";
import {
    UsersIcon,
    UserGroupIcon,
    ClockIcon,
    CalendarDaysIcon,
    CheckCircleIcon,
    XCircleIcon,
    BuildingOfficeIcon,
    ChartBarIcon,
} from "@heroicons/react/24/outline";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from "chart.js";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

export default function Dashboard({ auth, stats }) {
    const user = auth.user;

    // Prime Admin/Admin Dashboard
    if (user.role === "prime_admin" || user.role === "admin") {
        const userRoleData = {
            labels: ["Prime Admin", "Admin", "Staff"],
            datasets: [
                {
                    label: "Users by Role",
                    data: [
                        stats.user_stats?.find((s) => s.role === "prime_admin")
                            ?.count || 0,
                        stats.user_stats?.find((s) => s.role === "admin")
                            ?.count || 0,
                        stats.user_stats?.find((s) => s.role === "staff")
                            ?.count || 0,
                    ],
                    backgroundColor: ["#6366f1", "#8b5cf6", "#3b82f6"],
                },
            ],
        };

        const attendanceData = {
            labels: ["Present", "Absent", "Half Day", "On Leave"],
            datasets: [
                {
                    label: "Today's Attendance",
                    data: [
                        stats.attendance_today?.present || 0,
                        stats.attendance_today?.absent || 0,
                        stats.attendance_today?.half_day || 0,
                        stats.attendance_today?.on_leave || 0,
                    ],
                    backgroundColor: [
                        "#10b981",
                        "#ef4444",
                        "#f59e0b",
                        "#6b7280",
                    ],
                },
            ],
        };

        return (
            <AuthenticatedLayout
                user={auth.user}
                header={
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        {user.role === "prime_admin" ? "Prime Admin" : "Admin"}{" "}
                        Dashboard
                    </h2>
                }
            >
                <Head title="Dashboard" />

                <div className="py-12">
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                            <StatCard
                                title="Total Users"
                                value={stats.total_users || 0}
                                icon={UsersIcon}
                                color="indigo"
                            />
                            {user.role === "prime_admin" && (
                                <StatCard
                                    title="Admins"
                                    value={stats.total_admins || 0}
                                    icon={UserGroupIcon}
                                    color="purple"
                                />
                            )}
                            <StatCard
                                title="Staff Members"
                                value={stats.total_staff || 0}
                                icon={UserGroupIcon}
                                color="blue"
                            />
                            <StatCard
                                title="Departments"
                                value={stats.total_departments || 0}
                                icon={BuildingOfficeIcon}
                                color="green"
                            />
                            <StatCard
                                title="Present Today"
                                value={stats.attendance_today?.present || 0}
                                icon={CheckCircleIcon}
                                color="green"
                            />
                            <StatCard
                                title="Pending Leaves"
                                value={stats.pending_leaves || 0}
                                icon={CalendarDaysIcon}
                                color="yellow"
                            />
                            <StatCard
                                title="Active Tasks"
                                value={stats.active_tasks || 0}
                                icon={ChartBarIcon}
                                color="indigo"
                            />
                            <StatCard
                                title="Active Users"
                                value={stats.active_users || 0}
                                icon={UsersIcon}
                                color="green"
                            />
                        </div>

                        {/* Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Users by Role
                                </h3>
                                <Bar
                                    data={userRoleData}
                                    options={{
                                        responsive: true,
                                        plugins: {
                                            legend: {
                                                display: false,
                                            },
                                        },
                                    }}
                                />
                            </div>

                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Today's Attendance
                                </h3>
                                <Doughnut
                                    data={attendanceData}
                                    options={{
                                        responsive: true,
                                        plugins: {
                                            legend: {
                                                position: "bottom",
                                            },
                                        },
                                    }}
                                />
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="mt-6 bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Quick Stats
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                Staff in My Department
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Active employees
                                            </p>
                                        </div>
                                        <p className="text-2xl font-bold text-indigo-600">
                                            {stats.my_department_staff || 0}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                Attendance This Month
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Current month records
                                            </p>
                                        </div>
                                        <p className="text-2xl font-bold text-green-600">
                                            {stats.monthly_attendance || 0}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                Tasks Assigned
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                By me
                                            </p>
                                        </div>
                                        <p className="text-2xl font-bold text-blue-600">
                                            {stats.my_tasks || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    // Staff Dashboard
    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    My Dashboard
                </h2>
            }
        >
            <Head title="Dashboard" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                        <StatCard
                            title="My Attendance (Month)"
                            value={stats.my_attendance_count || 0}
                            icon={ClockIcon}
                            color="indigo"
                        />
                        <StatCard
                            title="Pending Tasks"
                            value={stats.my_pending_tasks || 0}
                            icon={ChartBarIcon}
                            color="yellow"
                        />
                        <StatCard
                            title="Completed Tasks"
                            value={stats.my_completed_tasks || 0}
                            icon={CheckCircleIcon}
                            color="green"
                        />
                        <StatCard
                            title="Leave Balance"
                            value={`${stats.leave_balance || 0} days`}
                            icon={CalendarDaysIcon}
                            color="blue"
                        />
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Quick Actions
                                </h3>
                                <div className="space-y-3">
                                    <a
                                        href={route("attendance.index")}
                                        className="block w-full text-left px-4 py-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                                    >
                                        <div className="flex items-center">
                                            <ClockIcon className="h-6 w-6 text-indigo-600 mr-3" />
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    Clock In/Out
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Mark your attendance
                                                </p>
                                            </div>
                                        </div>
                                    </a>
                                    <a
                                        href={route("leave-requests.create")}
                                        className="block w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                                    >
                                        <div className="flex items-center">
                                            <CalendarDaysIcon className="h-6 w-6 text-green-600 mr-3" />
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    Request Leave
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Apply for time off
                                                </p>
                                            </div>
                                        </div>
                                    </a>
                                    <a
                                        href={route("tasks.index")}
                                        className="block w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                    >
                                        <div className="flex items-center">
                                            <ChartBarIcon className="h-6 w-6 text-blue-600 mr-3" />
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    View Tasks
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Check assigned tasks
                                                </p>
                                            </div>
                                        </div>
                                    </a>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    My Leave Requests
                                </h3>
                                {stats.my_pending_leaves &&
                                stats.my_pending_leaves.length > 0 ? (
                                    <div className="space-y-3">
                                        {stats.my_pending_leaves.map(
                                            (leave) => (
                                                <div
                                                    key={leave.id}
                                                    className="p-4 border border-gray-200 rounded-lg"
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-sm font-medium text-gray-900">
                                                            {leave.leave_type}
                                                        </span>
                                                        <span
                                                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                                leave.status ===
                                                                "pending"
                                                                    ? "bg-yellow-100 text-yellow-800"
                                                                    : leave.status ===
                                                                      "approved"
                                                                    ? "bg-green-100 text-green-800"
                                                                    : "bg-red-100 text-red-800"
                                                            }`}
                                                        >
                                                            {leave.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(
                                                            leave.start_date
                                                        ).toLocaleDateString()}{" "}
                                                        -{" "}
                                                        {new Date(
                                                            leave.end_date
                                                        ).toLocaleDateString()}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {leave.total_days} days
                                                    </p>
                                                </div>
                                            )
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">
                                        No pending leave requests
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Upcoming Tasks */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Upcoming Tasks
                            </h3>
                            {stats.upcoming_tasks &&
                            stats.upcoming_tasks.length > 0 ? (
                                <div className="space-y-3">
                                    {stats.upcoming_tasks.map((task) => (
                                        <div
                                            key={task.id}
                                            className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-sm font-medium text-gray-900">
                                                    {task.title}
                                                </h4>
                                                <span
                                                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                        task.priority ===
                                                        "urgent"
                                                            ? "bg-red-100 text-red-800"
                                                            : task.priority ===
                                                              "high"
                                                            ? "bg-orange-100 text-orange-800"
                                                            : task.priority ===
                                                              "medium"
                                                            ? "bg-yellow-100 text-yellow-800"
                                                            : "bg-green-100 text-green-800"
                                                    }`}
                                                >
                                                    {task.priority}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-600 mb-2">
                                                {task.description}
                                            </p>
                                            <div className="flex items-center justify-between text-xs text-gray-500">
                                                <span>
                                                    Due:{" "}
                                                    {new Date(
                                                        task.due_date
                                                    ).toLocaleDateString()}
                                                </span>
                                                <span
                                                    className={`px-2 py-1 rounded-full ${
                                                        task.status ===
                                                        "pending"
                                                            ? "bg-gray-100 text-gray-800"
                                                            : task.status ===
                                                              "in_progress"
                                                            ? "bg-blue-100 text-blue-800"
                                                            : "bg-green-100 text-green-800"
                                                    }`}
                                                >
                                                    {task.status.replace(
                                                        "_",
                                                        " "
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">
                                    No upcoming tasks
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
