import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, useForm } from "@inertiajs/react";
import Button from "@/Components/Button";
import Modal from "@/Components/Modal";
import Pagination from "@/Components/Pagination";
import Toast from "@/Components/Toast";
import {
    ClockIcon,
    CheckCircleIcon,
    Cog6ToothIcon,
    UserGroupIcon,
    FunnelIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";

export default function Index({
    auth,
    attendance,
    todayAttendance,
    allStaffAttendance,
    users,
    filters,
    workingHours,
    todayStats,
    isAdmin,
}) {
    const [clockingIn, setClockingIn] = useState(false);
    const [clockingOut, setClockingOut] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [activeTab, setActiveTab] = useState("my-attendance");
    const [toast, setToast] = useState({
        show: false,
        message: "",
        type: "success",
    });

    // Filter states
    const [filterUserId, setFilterUserId] = useState(filters?.user_id || "all");
    const [filterStatus, setFilterStatus] = useState(filters?.status || "all");
    const [filterStartDate, setFilterStartDate] = useState(
        filters?.start_date || ""
    );
    const [filterEndDate, setFilterEndDate] = useState(filters?.end_date || "");
    const [showTodayOnly, setShowTodayOnly] = useState(
        filters?.today === "true"
    );

    // Working hours form
    const { data, setData, post, processing, errors } = useForm({
        work_start_time: workingHours?.start_time?.slice(0, 5) || "09:00",
        work_end_time: workingHours?.end_time?.slice(0, 5) || "17:00",
        late_threshold_minutes: workingHours?.late_threshold || 15,
        work_days: workingHours?.work_days || [1, 2, 3, 4, 5],
    });

    const dayNames = [
        { id: 1, name: "Mon" },
        { id: 2, name: "Tue" },
        { id: 3, name: "Wed" },
        { id: 4, name: "Thu" },
        { id: 5, name: "Fri" },
        { id: 6, name: "Sat" },
        { id: 7, name: "Sun" },
    ];

    const handleClockIn = () => {
        setClockingIn(true);
        router.post(
            route("attendance.clock-in"),
            {},
            {
                onSuccess: () => {
                    setToast({
                        show: true,
                        message: "Clocked in successfully!",
                        type: "success",
                    });
                },
                onFinish: () => setClockingIn(false),
            }
        );
    };

    const handleClockOut = () => {
        setClockingOut(true);
        router.post(
            route("attendance.clock-out"),
            {},
            {
                onSuccess: () => {
                    setToast({
                        show: true,
                        message: "Clocked out successfully!",
                        type: "success",
                    });
                },
                onFinish: () => setClockingOut(false),
            }
        );
    };

    const handleSaveSettings = (e) => {
        e.preventDefault();
        post(route("attendance.working-hours"), {
            onSuccess: () => {
                setShowSettingsModal(false);
                setToast({
                    show: true,
                    message: "Working hours updated!",
                    type: "success",
                });
            },
        });
    };

    const toggleWorkDay = (dayId) => {
        if (data.work_days.includes(dayId)) {
            setData(
                "work_days",
                data.work_days.filter((d) => d !== dayId)
            );
        } else {
            setData("work_days", [...data.work_days, dayId].sort());
        }
    };

    const applyFilters = () => {
        router.get(
            route("attendance.index"),
            {
                user_id: filterUserId !== "all" ? filterUserId : undefined,
                status: filterStatus !== "all" ? filterStatus : undefined,
                start_date: filterStartDate || undefined,
                end_date: filterEndDate || undefined,
                today: showTodayOnly ? "true" : undefined,
            },
            { preserveState: true }
        );
    };

    const clearFilters = () => {
        setFilterUserId("all");
        setFilterStatus("all");
        setFilterStartDate("");
        setFilterEndDate("");
        setShowTodayOnly(false);
        router.get(route("attendance.index"));
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Attendance
                    </h2>
                    {auth.user.role === "prime_admin" && (
                        <Button
                            variant="outline"
                            onClick={() => setShowSettingsModal(true)}
                        >
                            <Cog6ToothIcon className="h-5 w-5 mr-2" />
                            Working Hours Settings
                        </Button>
                    )}
                </div>
            }
        >
            <Head title="Attendance" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Working Hours Info Banner */}
                    {workingHours && (
                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center space-x-4">
                                    <ClockIcon className="h-6 w-6 text-indigo-600" />
                                    <div>
                                        <p className="text-sm font-medium text-indigo-900">
                                            Working Hours
                                        </p>
                                        <p className="text-sm text-indigo-700">
                                            {workingHours.formatted_start} -{" "}
                                            {workingHours.formatted_end}
                                            <span className="mx-2">•</span>
                                            Late after{" "}
                                            {workingHours.late_threshold} min
                                            grace period
                                        </p>
                                    </div>
                                </div>
                                <div className="text-sm text-indigo-600">
                                    Work days:{" "}
                                    {dayNames
                                        .filter((d) =>
                                            workingHours.work_days?.includes(
                                                d.id
                                            )
                                        )
                                        .map((d) => d.name)
                                        .join(", ")}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Clock In/Out Card */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Today's Attendance
                                </h3>
                                <p className="text-sm text-gray-600">
                                    {format(new Date(), "EEEE, MMMM d, yyyy")}
                                </p>
                            </div>
                            <div className="flex space-x-4">
                                {!todayAttendance ||
                                !todayAttendance.clock_in ? (
                                    <Button
                                        size="lg"
                                        onClick={handleClockIn}
                                        disabled={clockingIn}
                                    >
                                        <ClockIcon className="h-5 w-5 mr-2" />
                                        {clockingIn
                                            ? "Clocking In..."
                                            : "Clock In"}
                                    </Button>
                                ) : !todayAttendance.clock_out ? (
                                    <Button
                                        size="lg"
                                        variant="danger"
                                        onClick={handleClockOut}
                                        disabled={clockingOut}
                                    >
                                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                                        {clockingOut
                                            ? "Clocking Out..."
                                            : "Clock Out"}
                                    </Button>
                                ) : (
                                    <div className="text-green-600 font-semibold flex items-center">
                                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                                        Completed for today
                                    </div>
                                )}
                            </div>
                        </div>

                        {todayAttendance && (
                            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-600">
                                        Clock In
                                    </p>
                                    <p className="text-lg font-semibold text-gray-900">
                                        {todayAttendance.clock_in
                                            ? format(
                                                  new Date(
                                                      todayAttendance.clock_in
                                                  ),
                                                  "h:mm a"
                                              )
                                            : "-"}
                                    </p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-600">
                                        Clock Out
                                    </p>
                                    <p className="text-lg font-semibold text-gray-900">
                                        {todayAttendance.clock_out
                                            ? format(
                                                  new Date(
                                                      todayAttendance.clock_out
                                                  ),
                                                  "h:mm a"
                                              )
                                            : "-"}
                                    </p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-600">
                                        Total Hours
                                    </p>
                                    <p className="text-lg font-semibold text-gray-900">
                                        {todayAttendance.total_hours || "-"}
                                    </p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-600">
                                        Status
                                    </p>
                                    <span
                                        className={`inline-flex px-2 py-1 text-sm font-semibold rounded-full ${
                                            todayAttendance.is_late
                                                ? "bg-red-100 text-red-800"
                                                : "bg-green-100 text-green-800"
                                        }`}
                                    >
                                        {todayAttendance.is_late
                                            ? "Late"
                                            : "On Time"}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Admin Tabs */}
                    {isAdmin && (
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="border-b border-gray-200">
                                <nav className="flex -mb-px">
                                    <button
                                        onClick={() =>
                                            setActiveTab("my-attendance")
                                        }
                                        className={`py-4 px-6 border-b-2 font-medium text-sm ${
                                            activeTab === "my-attendance"
                                                ? "border-indigo-500 text-indigo-600"
                                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                        }`}
                                    >
                                        My Attendance
                                    </button>
                                    <button
                                        onClick={() =>
                                            setActiveTab("all-staff")
                                        }
                                        className={`py-4 px-6 border-b-2 font-medium text-sm ${
                                            activeTab === "all-staff"
                                                ? "border-indigo-500 text-indigo-600"
                                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                        }`}
                                    >
                                        <UserGroupIcon className="h-4 w-4 inline mr-2" />
                                        All Staff Attendance
                                    </button>
                                </nav>
                            </div>

                            {/* Today's Stats for All Staff */}
                            {activeTab === "all-staff" && todayStats && (
                                <div className="p-6 border-b border-gray-200 bg-gray-50">
                                    <h4 className="text-sm font-medium text-gray-700 mb-4">
                                        Today's Overview
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                                        <div className="bg-white p-3 rounded-lg shadow-sm text-center">
                                            <p className="text-2xl font-bold text-gray-900">
                                                {todayStats.total_employees}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Total Staff
                                            </p>
                                        </div>
                                        <div className="bg-white p-3 rounded-lg shadow-sm text-center">
                                            <p className="text-2xl font-bold text-green-600">
                                                {todayStats.clocked_in}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Clocked In
                                            </p>
                                        </div>
                                        <div className="bg-white p-3 rounded-lg shadow-sm text-center">
                                            <p className="text-2xl font-bold text-red-600">
                                                {todayStats.not_clocked_in}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Not Clocked In
                                            </p>
                                        </div>
                                        <div className="bg-white p-3 rounded-lg shadow-sm text-center">
                                            <p className="text-2xl font-bold text-green-600">
                                                {todayStats.on_time}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                On Time
                                            </p>
                                        </div>
                                        <div className="bg-white p-3 rounded-lg shadow-sm text-center">
                                            <p className="text-2xl font-bold text-yellow-600">
                                                {todayStats.late}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Late
                                            </p>
                                        </div>
                                        <div className="bg-white p-3 rounded-lg shadow-sm text-center">
                                            <p className="text-2xl font-bold text-blue-600">
                                                {todayStats.still_working}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Still Working
                                            </p>
                                        </div>
                                        <div className="bg-white p-3 rounded-lg shadow-sm text-center">
                                            <p className="text-2xl font-bold text-gray-600">
                                                {todayStats.clocked_out}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Clocked Out
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* All Staff Attendance List */}
                            {activeTab === "all-staff" && (
                                <div className="p-6">
                                    {/* Filters */}
                                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-2 mb-3">
                                            <FunnelIcon className="h-5 w-5 text-gray-500" />
                                            <span className="font-medium text-gray-700">
                                                Filters
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">
                                                    Employee
                                                </label>
                                                <select
                                                    value={filterUserId}
                                                    onChange={(e) =>
                                                        setFilterUserId(
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-full rounded-md border-gray-300 text-sm"
                                                >
                                                    <option value="all">
                                                        All Employees
                                                    </option>
                                                    {users?.map((user) => (
                                                        <option
                                                            key={user.id}
                                                            value={user.id}
                                                        >
                                                            {user.name} (
                                                            {user.role})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">
                                                    Status
                                                </label>
                                                <select
                                                    value={filterStatus}
                                                    onChange={(e) =>
                                                        setFilterStatus(
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-full rounded-md border-gray-300 text-sm"
                                                >
                                                    <option value="all">
                                                        All Status
                                                    </option>
                                                    <option value="on_time">
                                                        On Time
                                                    </option>
                                                    <option value="late">
                                                        Late
                                                    </option>
                                                    <option value="present">
                                                        Present
                                                    </option>
                                                    <option value="absent">
                                                        Absent
                                                    </option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">
                                                    Start Date
                                                </label>
                                                <input
                                                    type="date"
                                                    value={filterStartDate}
                                                    onChange={(e) =>
                                                        setFilterStartDate(
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-full rounded-md border-gray-300 text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">
                                                    End Date
                                                </label>
                                                <input
                                                    type="date"
                                                    value={filterEndDate}
                                                    onChange={(e) =>
                                                        setFilterEndDate(
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-full rounded-md border-gray-300 text-sm"
                                                />
                                            </div>
                                            <div className="flex items-end gap-2">
                                                <Button
                                                    onClick={applyFilters}
                                                    size="sm"
                                                >
                                                    Apply
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={clearFilters}
                                                    size="sm"
                                                >
                                                    Clear
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="mt-3">
                                            <label className="inline-flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={showTodayOnly}
                                                    onChange={(e) => {
                                                        setShowTodayOnly(
                                                            e.target.checked
                                                        );
                                                        if (e.target.checked) {
                                                            setFilterStartDate(
                                                                ""
                                                            );
                                                            setFilterEndDate(
                                                                ""
                                                            );
                                                        }
                                                    }}
                                                    className="rounded border-gray-300 text-indigo-600"
                                                />
                                                <span className="ml-2 text-sm text-gray-600">
                                                    Show today only
                                                </span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Attendance Table */}
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Employee
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Date
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Clock In
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Clock Out
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Hours
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Status
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {allStaffAttendance?.data
                                                    ?.length > 0 ? (
                                                    allStaffAttendance.data.map(
                                                        (record) => (
                                                            <tr
                                                                key={record.id}
                                                                className="hover:bg-gray-50"
                                                            >
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="flex items-center">
                                                                        {record
                                                                            .user
                                                                            ?.avatar ? (
                                                                            <img
                                                                                className="h-8 w-8 rounded-full"
                                                                                src={`/storage/${record.user.avatar}`}
                                                                                alt=""
                                                                            />
                                                                        ) : (
                                                                            <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
                                                                                {record.user?.name
                                                                                    ?.charAt(
                                                                                        0
                                                                                    )
                                                                                    .toUpperCase()}
                                                                            </div>
                                                                        )}
                                                                        <div className="ml-3">
                                                                            <p className="text-sm font-medium text-gray-900">
                                                                                {
                                                                                    record
                                                                                        .user
                                                                                        ?.name
                                                                                }
                                                                            </p>
                                                                            <p className="text-xs text-gray-500">
                                                                                {
                                                                                    record
                                                                                        .user
                                                                                        ?.email
                                                                                }
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                    {format(
                                                                        new Date(
                                                                            record.date
                                                                        ),
                                                                        "MMM d, yyyy"
                                                                    )}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                    {record.clock_in
                                                                        ? format(
                                                                              new Date(
                                                                                  record.clock_in
                                                                              ),
                                                                              "h:mm a"
                                                                          )
                                                                        : "-"}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                    {record.clock_out
                                                                        ? format(
                                                                              new Date(
                                                                                  record.clock_out
                                                                              ),
                                                                              "h:mm a"
                                                                          )
                                                                        : "-"}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                    {record.total_hours
                                                                        ? `${record.total_hours}h`
                                                                        : "-"}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <span
                                                                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                                            record.is_late
                                                                                ? "bg-red-100 text-red-800"
                                                                                : "bg-green-100 text-green-800"
                                                                        }`}
                                                                    >
                                                                        {record.is_late
                                                                            ? "Late"
                                                                            : "On Time"}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        )
                                                    )
                                                ) : (
                                                    <tr>
                                                        <td
                                                            colSpan="6"
                                                            className="px-6 py-12 text-center text-gray-500"
                                                        >
                                                            No attendance
                                                            records found
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    {allStaffAttendance?.links && (
                                        <div className="mt-4">
                                            <Pagination
                                                links={allStaffAttendance.links}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* My Attendance History */}
                            {activeTab === "my-attendance" && (
                                <div className="p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                        My Recent Attendance
                                    </h3>
                                    <AttendanceHistory records={attendance} />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Staff View - Attendance History */}
                    {!isAdmin && (
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Recent Attendance
                            </h3>
                            <AttendanceHistory records={attendance} />
                        </div>
                    )}
                </div>
            </div>

            {/* Working Hours Settings Modal */}
            <Modal
                show={showSettingsModal}
                onClose={() => setShowSettingsModal(false)}
                maxWidth="lg"
            >
                <form onSubmit={handleSaveSettings} className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Working Hours Settings
                        </h2>
                        <button
                            type="button"
                            onClick={() => setShowSettingsModal(false)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Work Start Time
                                </label>
                                <input
                                    type="time"
                                    value={data.work_start_time}
                                    onChange={(e) =>
                                        setData(
                                            "work_start_time",
                                            e.target.value
                                        )
                                    }
                                    className="w-full rounded-md border-gray-300"
                                />
                                {errors.work_start_time && (
                                    <p className="text-sm text-red-600 mt-1">
                                        {errors.work_start_time}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Work End Time
                                </label>
                                <input
                                    type="time"
                                    value={data.work_end_time}
                                    onChange={(e) =>
                                        setData("work_end_time", e.target.value)
                                    }
                                    className="w-full rounded-md border-gray-300"
                                />
                                {errors.work_end_time && (
                                    <p className="text-sm text-red-600 mt-1">
                                        {errors.work_end_time}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Late Threshold (minutes)
                            </label>
                            <p className="text-xs text-gray-500 mb-2">
                                Grace period after work start time before
                                marking as late
                            </p>
                            <input
                                type="number"
                                min="0"
                                max="60"
                                value={data.late_threshold_minutes}
                                onChange={(e) =>
                                    setData(
                                        "late_threshold_minutes",
                                        parseInt(e.target.value)
                                    )
                                }
                                className="w-32 rounded-md border-gray-300"
                            />
                            {errors.late_threshold_minutes && (
                                <p className="text-sm text-red-600 mt-1">
                                    {errors.late_threshold_minutes}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Work Days
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {dayNames.map((day) => (
                                    <button
                                        key={day.id}
                                        type="button"
                                        onClick={() => toggleWorkDay(day.id)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            data.work_days.includes(day.id)
                                                ? "bg-indigo-600 text-white"
                                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        }`}
                                    >
                                        {day.name}
                                    </button>
                                ))}
                            </div>
                            {errors.work_days && (
                                <p className="text-sm text-red-600 mt-1">
                                    {errors.work_days}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowSettingsModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? "Saving..." : "Save Settings"}
                        </Button>
                    </div>
                </form>
            </Modal>

            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ ...toast, show: false })}
            />
        </AuthenticatedLayout>
    );
}

// Attendance History Component
function AttendanceHistory({ records }) {
    if (!records || records.length === 0) {
        return (
            <p className="text-gray-500 text-center py-8">
                No attendance records yet
            </p>
        );
    }

    return (
        <div className="space-y-3">
            {records.map((record) => (
                <div
                    key={record.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <div>
                        <p className="font-medium text-gray-900">
                            {format(new Date(record.date), "MMMM d, yyyy")}
                        </p>
                        <p className="text-sm text-gray-600">
                            {record.clock_in &&
                                format(
                                    new Date(record.clock_in),
                                    "h:mm a"
                                )}{" "}
                            -
                            {record.clock_out
                                ? format(new Date(record.clock_out), "h:mm a")
                                : " In Progress"}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                            {record.total_hours || "-"} hours
                        </p>
                        <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                record.is_late
                                    ? "bg-red-100 text-red-800"
                                    : "bg-green-100 text-green-800"
                            }`}
                        >
                            {record.is_late ? "Late" : "On Time"}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}
