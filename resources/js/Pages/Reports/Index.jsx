import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import { Line, Bar, Pie, Doughnut } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from "chart.js";
import Button from "@/Components/Button";
import {
    ArrowDownTrayIcon,
    CalendarIcon,
    ChartBarIcon,
    ClockIcon,
    UserGroupIcon,
    DocumentTextIcon,
} from "@heroicons/react/24/outline";

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export default function Reports({ auth, reportData }) {
    const [dateRange, setDateRange] = useState("last_30_days");
    const [selectedDepartment, setSelectedDepartment] = useState("all");
    const [reportType, setReportType] = useState("overview"); // overview, attendance, leaves, tasks, performance

    // Attendance Trend Chart
    const attendanceTrendData = {
        labels: reportData.attendance?.dates || [],
        datasets: [
            {
                label: "Present",
                data: reportData.attendance?.present || [],
                borderColor: "rgb(34, 197, 94)",
                backgroundColor: "rgba(34, 197, 94, 0.1)",
                fill: true,
                tension: 0.4,
            },
            {
                label: "Late",
                data: reportData.attendance?.late || [],
                borderColor: "rgb(234, 179, 8)",
                backgroundColor: "rgba(234, 179, 8, 0.1)",
                fill: true,
                tension: 0.4,
            },
            {
                label: "Absent",
                data: reportData.attendance?.absent || [],
                borderColor: "rgb(239, 68, 68)",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                fill: true,
                tension: 0.4,
            },
        ],
    };

    // Leave Statistics Chart
    const leaveStatsData = {
        labels: [
            "Sick Leave",
            "Casual Leave",
            "Annual Leave",
            "Emergency Leave",
        ],
        datasets: [
            {
                label: "Leave Requests",
                data: reportData.leaves?.byType || [0, 0, 0, 0],
                backgroundColor: [
                    "rgba(239, 68, 68, 0.8)",
                    "rgba(59, 130, 246, 0.8)",
                    "rgba(34, 197, 94, 0.8)",
                    "rgba(234, 179, 8, 0.8)",
                ],
                borderWidth: 1,
            },
        ],
    };

    // Task Completion Rate Chart
    const taskCompletionData = {
        labels: reportData.tasks?.months || [],
        datasets: [
            {
                label: "Completed",
                data: reportData.tasks?.completed || [],
                backgroundColor: "rgba(34, 197, 94, 0.8)",
            },
            {
                label: "In Progress",
                data: reportData.tasks?.in_progress || [],
                backgroundColor: "rgba(59, 130, 246, 0.8)",
            },
            {
                label: "Pending",
                data: reportData.tasks?.pending || [],
                backgroundColor: "rgba(156, 163, 175, 0.8)",
            },
        ],
    };

    // Department Performance Chart
    const departmentPerformanceData = {
        labels: reportData.departments?.names || [],
        datasets: [
            {
                data: reportData.departments?.performance || [],
                backgroundColor: [
                    "rgba(99, 102, 241, 0.8)",
                    "rgba(139, 92, 246, 0.8)",
                    "rgba(236, 72, 153, 0.8)",
                    "rgba(34, 197, 94, 0.8)",
                    "rgba(234, 179, 8, 0.8)",
                ],
            },
        ],
    };

    // Average Performance Ratings Chart
    const performanceRatingsData = {
        labels: ["5 Stars", "4 Stars", "3 Stars", "2 Stars", "1 Star"],
        datasets: [
            {
                label: "Number of Reviews",
                data: reportData.performance?.ratingDistribution || [
                    0, 0, 0, 0, 0,
                ],
                backgroundColor: "rgba(99, 102, 241, 0.8)",
                borderColor: "rgba(99, 102, 241, 1)",
                borderWidth: 1,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "top",
            },
        },
    };

    const handleExport = (format) => {
        // Trigger export endpoint
        window.location.href = route("reports.export", {
            format,
            dateRange,
            department: selectedDepartment,
            type: reportType,
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Reports & Analytics
                    </h2>
                    <div className="flex space-x-2">
                        <Button
                            variant="outline"
                            onClick={() => handleExport("pdf")}
                        >
                            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                            Export PDF
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => handleExport("excel")}
                        >
                            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                            Export Excel
                        </Button>
                    </div>
                </div>
            }
        >
            <Head title="Reports" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Filters */}
                    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                        <div className="grid grid-cols-3 gap-4">
                            {/* Date Range */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <CalendarIcon className="inline h-4 w-4 mr-1" />
                                    Date Range
                                </label>
                                <select
                                    value={dateRange}
                                    onChange={(e) =>
                                        setDateRange(e.target.value)
                                    }
                                    className="w-full rounded-md border-gray-300"
                                >
                                    <option value="today">Today</option>
                                    <option value="last_7_days">
                                        Last 7 Days
                                    </option>
                                    <option value="last_30_days">
                                        Last 30 Days
                                    </option>
                                    <option value="this_month">
                                        This Month
                                    </option>
                                    <option value="last_month">
                                        Last Month
                                    </option>
                                    <option value="this_quarter">
                                        This Quarter
                                    </option>
                                    <option value="this_year">This Year</option>
                                    <option value="custom">Custom Range</option>
                                </select>
                            </div>

                            {/* Department Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <UserGroupIcon className="inline h-4 w-4 mr-1" />
                                    Department
                                </label>
                                <select
                                    value={selectedDepartment}
                                    onChange={(e) =>
                                        setSelectedDepartment(e.target.value)
                                    }
                                    className="w-full rounded-md border-gray-300"
                                >
                                    <option value="all">All Departments</option>
                                    {reportData.departments?.names.map(
                                        (dept, index) => (
                                            <option key={index} value={dept}>
                                                {dept}
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>

                            {/* Report Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <ChartBarIcon className="inline h-4 w-4 mr-1" />
                                    Report Type
                                </label>
                                <select
                                    value={reportType}
                                    onChange={(e) =>
                                        setReportType(e.target.value)
                                    }
                                    className="w-full rounded-md border-gray-300"
                                >
                                    <option value="overview">Overview</option>
                                    <option value="attendance">
                                        Attendance Details
                                    </option>
                                    <option value="leaves">
                                        Leave Analysis
                                    </option>
                                    <option value="tasks">
                                        Task Performance
                                    </option>
                                    <option value="performance">
                                        Performance Reviews
                                    </option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">
                                        Attendance Rate
                                    </p>
                                    <p className="text-3xl font-bold text-green-600">
                                        {reportData.metrics?.attendanceRate ||
                                            0}
                                        %
                                    </p>
                                </div>
                                <ClockIcon className="h-12 w-12 text-green-500 opacity-20" />
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">
                                        Active Tasks
                                    </p>
                                    <p className="text-3xl font-bold text-blue-600">
                                        {reportData.metrics?.activeTasks || 0}
                                    </p>
                                </div>
                                <DocumentTextIcon className="h-12 w-12 text-blue-500 opacity-20" />
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">
                                        Avg Performance
                                    </p>
                                    <p className="text-3xl font-bold text-yellow-600">
                                        {reportData.metrics?.avgPerformance ||
                                            0}
                                        /5
                                    </p>
                                </div>
                                <ChartBarIcon className="h-12 w-12 text-yellow-500 opacity-20" />
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600">
                                        Total Employees
                                    </p>
                                    <p className="text-3xl font-bold text-indigo-600">
                                        {reportData.metrics?.totalEmployees ||
                                            0}
                                    </p>
                                </div>
                                <UserGroupIcon className="h-12 w-12 text-indigo-500 opacity-20" />
                            </div>
                        </div>
                    </div>

                    {/* Charts Grid */}
                    {reportType === "overview" && (
                        <div className="grid grid-cols-2 gap-6">
                            {/* Attendance Trend */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Attendance Trend
                                </h3>
                                <div className="h-80">
                                    <Line
                                        data={attendanceTrendData}
                                        options={chartOptions}
                                    />
                                </div>
                            </div>

                            {/* Task Completion */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Task Completion Status
                                </h3>
                                <div className="h-80">
                                    <Bar
                                        data={taskCompletionData}
                                        options={chartOptions}
                                    />
                                </div>
                            </div>

                            {/* Leave Statistics */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Leave Type Distribution
                                </h3>
                                <div className="h-80">
                                    <Pie
                                        data={leaveStatsData}
                                        options={chartOptions}
                                    />
                                </div>
                            </div>

                            {/* Department Performance */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Department Performance
                                </h3>
                                <div className="h-80">
                                    <Doughnut
                                        data={departmentPerformanceData}
                                        options={chartOptions}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {reportType === "attendance" && (
                        <div className="space-y-6">
                            {/* Attendance Details */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Attendance Trends
                                </h3>
                                <div className="h-96">
                                    <Line
                                        data={attendanceTrendData}
                                        options={chartOptions}
                                    />
                                </div>
                            </div>

                            {/* Attendance Statistics Table */}
                            <div className="bg-white rounded-lg shadow overflow-hidden">
                                <div className="p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                        Detailed Statistics
                                    </h3>
                                </div>
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Date
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Present
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Late
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Absent
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Rate
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {reportData.attendance?.details?.map(
                                            (record, index) => (
                                                <tr key={index}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {record.date}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                                                        {record.present}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">
                                                        {record.late}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                                                        {record.absent}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {record.rate}%
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {reportType === "performance" && (
                        <div className="space-y-6">
                            {/* Performance Ratings Distribution */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Performance Rating Distribution
                                </h3>
                                <div className="h-96">
                                    <Bar
                                        data={performanceRatingsData}
                                        options={chartOptions}
                                    />
                                </div>
                            </div>

                            {/* Top Performers */}
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Top Performers
                                </h3>
                                <div className="space-y-3">
                                    {reportData.performance?.topPerformers?.map(
                                        (performer, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <div className="text-2xl font-bold text-indigo-600">
                                                        #{index + 1}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">
                                                            {performer.name}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            {
                                                                performer.department
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-semibold text-yellow-600">
                                                        ⭐ {performer.rating}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {performer.reviews}{" "}
                                                        reviews
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
