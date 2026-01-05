import React from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router } from "@inertiajs/react";
import TaskComments from "@/Components/TaskComments";
import {
    ArrowLeftIcon,
    ClipboardDocumentListIcon,
    CalendarDaysIcon,
    UserIcon,
    FolderIcon,
    BuildingOfficeIcon,
    PencilIcon,
    TrashIcon,
    CheckCircleIcon,
    ClockIcon,
    ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

export default function Show({ auth, task, users = [] }) {
    const canEdit =
        auth.user.role !== "staff" || task.assigned_to === auth.user.id;
    const canDelete = auth.user.role !== "staff";

    const handleDelete = () => {
        if (confirm("Are you sure you want to delete this task?")) {
            router.delete(route("tasks.destroy", task.id));
        }
    };

    const handleStatusChange = (newStatus) => {
        router.post(route("tasks.update-status", task.id), {
            status: newStatus,
        });
    };

    const priorityColors = {
        low: "bg-green-100 text-green-800",
        medium: "bg-yellow-100 text-yellow-800",
        high: "bg-orange-100 text-orange-800",
        urgent: "bg-red-100 text-red-800",
    };

    const statusColors = {
        pending: "bg-gray-100 text-gray-800",
        in_progress: "bg-blue-100 text-blue-800",
        completed: "bg-green-100 text-green-800",
        cancelled: "bg-red-100 text-red-800",
    };

    const statusLabels = {
        pending: "Pending",
        in_progress: "In Progress",
        completed: "Completed",
        cancelled: "Cancelled",
    };

    const isOverdue =
        task.due_date &&
        new Date(task.due_date) < new Date() &&
        task.status !== "completed";

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => router.visit(route("tasks.index"))}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
                    </button>
                    <ClipboardDocumentListIcon className="h-6 w-6 text-indigo-600" />
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Task Details
                    </h2>
                </div>
            }
        >
            <Head title={task.title} />

            <div className="py-8">
                <div className="max-w-5xl mx-auto sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Task Header */}
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                            {task.title}
                                        </h1>
                                        <div className="flex items-center space-x-3">
                                            <span
                                                className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                                                    priorityColors[
                                                        task.priority
                                                    ]
                                                }`}
                                            >
                                                {task.priority?.toUpperCase()}
                                            </span>
                                            <span
                                                className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                                                    statusColors[task.status]
                                                }`}
                                            >
                                                {statusLabels[task.status]}
                                            </span>
                                            {isOverdue && (
                                                <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                                    <ExclamationTriangleIcon className="h-3.5 w-3.5 mr-1" />
                                                    Overdue
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {canEdit && (
                                            <Link
                                                href={route(
                                                    "tasks.edit",
                                                    task.id
                                                )}
                                                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-colors"
                                            >
                                                <PencilIcon className="h-5 w-5" />
                                            </Link>
                                        )}
                                        {canDelete && (
                                            <button
                                                onClick={handleDelete}
                                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors"
                                            >
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Description */}
                                {task.description && (
                                    <div className="prose prose-sm max-w-none text-gray-600">
                                        <p className="whitespace-pre-wrap">
                                            {task.description}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Comments Section */}
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <TaskComments
                                    taskId={task.id}
                                    currentUserId={auth.user.id}
                                    users={users}
                                />
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Quick Actions */}
                            {(task.assigned_to === auth.user.id ||
                                auth.user.role !== "staff") && (
                                <div className="bg-white rounded-lg shadow-sm p-6">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-4">
                                        Update Status
                                    </h3>
                                    <div className="space-y-2">
                                        {task.status !== "completed" && (
                                            <button
                                                onClick={() =>
                                                    handleStatusChange(
                                                        "completed"
                                                    )
                                                }
                                                className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                                            >
                                                <CheckCircleIcon className="h-5 w-5 mr-2" />
                                                Mark Complete
                                            </button>
                                        )}
                                        {task.status === "pending" && (
                                            <button
                                                onClick={() =>
                                                    handleStatusChange(
                                                        "in_progress"
                                                    )
                                                }
                                                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                <ClockIcon className="h-5 w-5 mr-2" />
                                                Start Working
                                            </button>
                                        )}
                                        {task.status === "in_progress" && (
                                            <button
                                                onClick={() =>
                                                    handleStatusChange(
                                                        "pending"
                                                    )
                                                }
                                                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                                Move to Pending
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Task Details */}
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <h3 className="text-sm font-semibold text-gray-700 mb-4">
                                    Details
                                </h3>
                                <div className="space-y-4">
                                    {/* Assigned To */}
                                    <div className="flex items-start space-x-3">
                                        <UserIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-gray-500">
                                                Assigned To
                                            </p>
                                            <p className="text-sm font-medium text-gray-900">
                                                {task.assigned_user?.name ||
                                                    "Unassigned"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Assigned By */}
                                    <div className="flex items-start space-x-3">
                                        <UserIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-gray-500">
                                                Created By
                                            </p>
                                            <p className="text-sm font-medium text-gray-900">
                                                {task.assigned_by_user?.name ||
                                                    "Unknown"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Due Date */}
                                    <div className="flex items-start space-x-3">
                                        <CalendarDaysIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-gray-500">
                                                Due Date
                                            </p>
                                            <p
                                                className={`text-sm font-medium ${
                                                    isOverdue
                                                        ? "text-red-600"
                                                        : "text-gray-900"
                                                }`}
                                            >
                                                {task.due_date
                                                    ? new Date(
                                                          task.due_date
                                                      ).toLocaleDateString(
                                                          "en-GB",
                                                          {
                                                              day: "numeric",
                                                              month: "long",
                                                              year: "numeric",
                                                          }
                                                      )
                                                    : "No due date"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Project */}
                                    {task.project && (
                                        <div className="flex items-start space-x-3">
                                            <FolderIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                                            <div>
                                                <p className="text-xs text-gray-500">
                                                    Project
                                                </p>
                                                <Link
                                                    href={route(
                                                        "projects.show",
                                                        task.project.id
                                                    )}
                                                    className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                                                >
                                                    {task.project.name}
                                                </Link>
                                            </div>
                                        </div>
                                    )}

                                    {/* Department */}
                                    {task.department && (
                                        <div className="flex items-start space-x-3">
                                            <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                                            <div>
                                                <p className="text-xs text-gray-500">
                                                    Department
                                                </p>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {task.department.name}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Completed At */}
                                    {task.completed_at && (
                                        <div className="flex items-start space-x-3">
                                            <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5" />
                                            <div>
                                                <p className="text-xs text-gray-500">
                                                    Completed
                                                </p>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {new Date(
                                                        task.completed_at
                                                    ).toLocaleString("en-GB", {
                                                        day: "numeric",
                                                        month: "long",
                                                        year: "numeric",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Timestamps */}
                            <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-500">
                                <p>
                                    Created:{" "}
                                    {new Date(task.created_at).toLocaleString(
                                        "en-GB"
                                    )}
                                </p>
                                <p className="mt-1">
                                    Updated:{" "}
                                    {new Date(task.updated_at).toLocaleString(
                                        "en-GB"
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
