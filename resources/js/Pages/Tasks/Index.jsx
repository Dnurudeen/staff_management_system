import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, Link } from "@inertiajs/react";
import DataTable from "@/Components/DataTable";
import Button from "@/Components/Button";
import { PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

export default function Index({ auth, tasks }) {
    const [updatingStatus, setUpdatingStatus] = useState(null);

    const handleStatusUpdate = (taskId, newStatus) => {
        setUpdatingStatus(taskId);
        router.post(
            route("tasks.update-status", taskId),
            {
                status: newStatus,
            },
            {
                preserveScroll: true,
                onFinish: () => setUpdatingStatus(null),
            }
        );
    };

    const handleDelete = (taskId) => {
        if (confirm("Are you sure you want to delete this task?")) {
            router.delete(route("tasks.destroy", taskId), {
                preserveScroll: true,
            });
        }
    };

    const columns = [
        {
            key: "title",
            label: "Title",
            sortable: true,
            render: (task) => (
                <div>
                    <div className="font-medium text-gray-900">
                        {task.title}
                    </div>
                    {task.description && (
                        <div className="text-sm text-gray-500 truncate max-w-md">
                            {task.description.substring(0, 100)}
                            {task.description.length > 100 && "..."}
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: "priority",
            label: "Priority",
            render: (task) => (
                <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        task.priority === "urgent"
                            ? "bg-red-100 text-red-800"
                            : task.priority === "high"
                            ? "bg-orange-100 text-orange-800"
                            : task.priority === "medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                    }`}
                >
                    {task.priority.toUpperCase()}
                </span>
            ),
        },
        {
            key: "status",
            label: "Status",
            render: (task) => {
                const colors = {
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

                // For staff users on their own tasks, show a dropdown
                if (
                    auth.user.role === "staff" &&
                    task.assigned_to === auth.user.id
                ) {
                    return (
                        <select
                            value={task.status}
                            onChange={(e) => {
                                e.stopPropagation();
                                handleStatusUpdate(task.id, e.target.value);
                            }}
                            disabled={updatingStatus === task.id}
                            className={`px-2 py-1 text-xs font-semibold rounded border-0 focus:ring-2 focus:ring-indigo-500 ${
                                colors[task.status]
                            } ${
                                updatingStatus === task.id
                                    ? "opacity-50 cursor-not-allowed"
                                    : "cursor-pointer"
                            }`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                        </select>
                    );
                }

                // For non-staff or unassigned tasks, show a badge
                return (
                    <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            colors[task.status]
                        }`}
                    >
                        {statusLabels[task.status] || task.status}
                    </span>
                );
            },
        },
        {
            key: "assigned_user",
            label: "Assigned To",
            render: (task) =>
                task.assigned_user ? task.assigned_user.name : "-",
        },
        {
            key: "due_date",
            label: "Due Date",
            render: (task) => {
                if (!task.due_date) return "-";

                const dueDate = new Date(task.due_date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const isOverdue =
                    dueDate < today && task.status !== "completed";

                return (
                    <span
                        className={
                            isOverdue ? "text-red-600 font-semibold" : ""
                        }
                    >
                        {dueDate.toLocaleDateString()}
                        {isOverdue && <span className="ml-1">(Overdue)</span>}
                    </span>
                );
            },
        },
        {
            key: "actions",
            label: "Actions",
            render: (task) => (
                <div className="flex items-center space-x-2">
                    <Link
                        href={route("tasks.edit", task.id)}
                        className="text-indigo-600 hover:text-indigo-900 transition-colors"
                        title="Edit Task"
                    >
                        <PencilIcon className="h-5 w-5" />
                    </Link>
                    {auth.user.role !== "staff" && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(task.id);
                            }}
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="Delete Task"
                        >
                            <TrashIcon className="h-5 w-5" />
                        </button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Tasks
                    </h2>
                    {auth.user.role !== "staff" && (
                        <Button
                            onClick={() => router.visit(route("tasks.create"))}
                        >
                            <PlusIcon className="h-5 w-5 mr-2" />
                            Create Task
                        </Button>
                    )}
                </div>
            }
        >
            <Head title="Tasks" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Info banner for staff users */}
                    {auth.user.role === "staff" && (
                        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm text-blue-800">
                                <strong>Tip:</strong> You can update the status
                                of your tasks directly from the table below by
                                using the dropdown menu.
                            </p>
                        </div>
                    )}

                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <DataTable
                            columns={columns}
                            data={tasks.data}
                            pagination={tasks}
                        />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
