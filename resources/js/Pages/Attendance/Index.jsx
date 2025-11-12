import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import Button from "@/Components/Button";
import { ClockIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";

export default function Index({ auth, attendance, todayAttendance }) {
    const [clockingIn, setClockingIn] = useState(false);
    const [clockingOut, setClockingOut] = useState(false);

    const handleClockIn = () => {
        setClockingIn(true);
        router.post(
            route("attendance.clock-in"),
            {},
            {
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
                onFinish: () => setClockingOut(false),
            }
        );
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Attendance
                </h2>
            }
        >
            <Head title="Attendance" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Clock In/Out Card */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <div className="flex items-center justify-between">
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
                                        Clock In
                                    </Button>
                                ) : !todayAttendance.clock_out ? (
                                    <Button
                                        size="lg"
                                        variant="danger"
                                        onClick={handleClockOut}
                                        disabled={clockingOut}
                                    >
                                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                                        Clock Out
                                    </Button>
                                ) : (
                                    <div className="text-green-600 font-semibold">
                                        ✓ Completed for today
                                    </div>
                                )}
                            </div>
                        </div>

                        {todayAttendance && (
                            <div className="mt-6 grid grid-cols-3 gap-4">
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
                            </div>
                        )}
                    </div>

                    {/* Attendance History */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Recent Attendance
                        </h3>
                        <div className="space-y-3">
                            {attendance && attendance.length > 0 ? (
                                attendance.map((record) => (
                                    <div
                                        key={record.id}
                                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                                    >
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {format(
                                                    new Date(record.date),
                                                    "MMMM d, yyyy"
                                                )}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                {record.clock_in &&
                                                    format(
                                                        new Date(
                                                            record.clock_in
                                                        ),
                                                        "h:mm a"
                                                    )}{" "}
                                                -
                                                {record.clock_out
                                                    ? format(
                                                          new Date(
                                                              record.clock_out
                                                          ),
                                                          "h:mm a"
                                                      )
                                                    : " In Progress"}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-gray-900">
                                                {record.total_hours || "-"}{" "}
                                                hours
                                            </p>
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
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 text-center py-8">
                                    No attendance records yet
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
