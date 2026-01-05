import React from "react";
import { Head, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { FolderIcon } from "@heroicons/react/24/outline";

export default function Edit({
    auth,
    task,
    users,
    departments,
    projects = [],
}) {
    const isStaff = auth.user.role === "staff";
    const canEditAllFields = !isStaff;

    const { data, setData, put, processing, errors } = useForm({
        title: task.title || "",
        description: task.description || "",
        assigned_to: task.assigned_to || "",
        department_id: task.department_id || "",
        project_id: task.project_id || "",
        priority: task.priority || "medium",
        status: task.status || "pending",
        due_date: task.due_date || "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route("tasks.update", task.id));
    };

    const priorityOptions = [
        { value: "low", label: "Low" },
        { value: "medium", label: "Medium" },
        { value: "high", label: "High" },
        { value: "urgent", label: "Urgent" },
    ];

    const statusOptions = [
        { value: "pending", label: "Pending" },
        { value: "in_progress", label: "In Progress" },
        { value: "completed", label: "Completed" },
    ];

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Edit Task" />

            <div className="py-6">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">
                            Edit Task
                        </h1>
                        <p className="mt-1 text-sm text-gray-600">
                            {isStaff
                                ? "Update the status of your assigned task"
                                : "Update task details and assignment"}
                        </p>
                    </div>

                    <div className="bg-white shadow rounded-lg">
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Staff Info Banner */}
                            {isStaff && (
                                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                                    <p className="text-sm text-blue-800">
                                        <strong>Note:</strong> As a staff
                                        member, you can only update the task
                                        status. Contact your manager to change
                                        other task details.
                                    </p>
                                </div>
                            )}

                            {/* Title */}
                            <div>
                                <label
                                    htmlFor="title"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Task Title
                                </label>
                                <input
                                    type="text"
                                    id="title"
                                    value={data.title}
                                    onChange={(e) =>
                                        setData("title", e.target.value)
                                    }
                                    disabled={isStaff}
                                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                                        isStaff
                                            ? "bg-gray-100 cursor-not-allowed"
                                            : ""
                                    }`}
                                    required={canEditAllFields}
                                />
                                {errors.title && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.title}
                                    </p>
                                )}
                            </div>

                            {/* Description */}
                            <div>
                                <label
                                    htmlFor="description"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    rows={4}
                                    value={data.description}
                                    onChange={(e) =>
                                        setData("description", e.target.value)
                                    }
                                    disabled={isStaff}
                                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                                        isStaff
                                            ? "bg-gray-100 cursor-not-allowed"
                                            : ""
                                    }`}
                                />
                                {errors.description && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.description}
                                    </p>
                                )}
                            </div>

                            {/* Status */}
                            <div>
                                <label
                                    htmlFor="status"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Status{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <select
                                    id="status"
                                    value={data.status}
                                    onChange={(e) =>
                                        setData("status", e.target.value)
                                    }
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    required
                                >
                                    {statusOptions.map((option) => (
                                        <option
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                {errors.status && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.status}
                                    </p>
                                )}
                            </div>

                            {/* Completed Date */}
                            {task.completed_at && (
                                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                                    <p className="text-sm text-green-800">
                                        <strong>Completed:</strong>{" "}
                                        {new Date(
                                            task.completed_at
                                        ).toLocaleString()}
                                    </p>
                                </div>
                            )}

                            {/* Admin-only fields */}
                            {canEditAllFields && (
                                <>
                                    {/* Project Selection */}
                                    <div>
                                        <label
                                            htmlFor="project_id"
                                            className="block text-sm font-medium text-gray-700"
                                        >
                                            <FolderIcon className="h-4 w-4 inline mr-1" />
                                            Project (Optional)
                                        </label>
                                        <select
                                            id="project_id"
                                            value={data.project_id}
                                            onChange={(e) =>
                                                setData(
                                                    "project_id",
                                                    e.target.value
                                                )
                                            }
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        >
                                            <option value="">
                                                No project (standalone task)
                                            </option>
                                            {projects.map((project) => (
                                                <option
                                                    key={project.id}
                                                    value={project.id}
                                                >
                                                    {project.name}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.project_id && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.project_id}
                                            </p>
                                        )}
                                    </div>

                                    {/* Assigned To & Department */}
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <div>
                                            <label
                                                htmlFor="assigned_to"
                                                className="block text-sm font-medium text-gray-700"
                                            >
                                                Assign To{" "}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </label>
                                            <select
                                                id="assigned_to"
                                                value={data.assigned_to}
                                                onChange={(e) =>
                                                    setData(
                                                        "assigned_to",
                                                        e.target.value
                                                    )
                                                }
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                required
                                            >
                                                <option value="">
                                                    Select a user
                                                </option>
                                                {users.map((user) => (
                                                    <option
                                                        key={user.id}
                                                        value={user.id}
                                                    >
                                                        {user.name} -{" "}
                                                        {user.role}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.assigned_to && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {errors.assigned_to}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="department_id"
                                                className="block text-sm font-medium text-gray-700"
                                            >
                                                Department
                                            </label>
                                            <select
                                                id="department_id"
                                                value={data.department_id}
                                                onChange={(e) =>
                                                    setData(
                                                        "department_id",
                                                        e.target.value
                                                    )
                                                }
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                            >
                                                <option value="">
                                                    Select a department
                                                </option>
                                                {departments.map((dept) => (
                                                    <option
                                                        key={dept.id}
                                                        value={dept.id}
                                                    >
                                                        {dept.name}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.department_id && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {errors.department_id}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Priority & Due Date */}
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <div>
                                            <label
                                                htmlFor="priority"
                                                className="block text-sm font-medium text-gray-700"
                                            >
                                                Priority{" "}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </label>
                                            <select
                                                id="priority"
                                                value={data.priority}
                                                onChange={(e) =>
                                                    setData(
                                                        "priority",
                                                        e.target.value
                                                    )
                                                }
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                required
                                            >
                                                {priorityOptions.map(
                                                    (option) => (
                                                        <option
                                                            key={option.value}
                                                            value={option.value}
                                                        >
                                                            {option.label}
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                            {errors.priority && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {errors.priority}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="due_date"
                                                className="block text-sm font-medium text-gray-700"
                                            >
                                                Due Date{" "}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </label>
                                            <input
                                                type="date"
                                                id="due_date"
                                                value={data.due_date}
                                                onChange={(e) =>
                                                    setData(
                                                        "due_date",
                                                        e.target.value
                                                    )
                                                }
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                                required
                                            />
                                            {errors.due_date && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {errors.due_date}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Task Metadata */}
                            <div className="bg-gray-50 rounded-md p-4 space-y-2">
                                <p className="text-sm text-gray-600">
                                    <strong>Created by:</strong>{" "}
                                    {task.assigned_by_user?.name || "N/A"}
                                </p>
                                <p className="text-sm text-gray-600">
                                    <strong>Assigned to:</strong>{" "}
                                    {task.assigned_user?.name || "N/A"}
                                </p>
                                {task.project && (
                                    <p className="text-sm text-gray-600">
                                        <strong>Project:</strong>{" "}
                                        {task.project.name}
                                    </p>
                                )}
                                {task.department && (
                                    <p className="text-sm text-gray-600">
                                        <strong>Department:</strong>{" "}
                                        {task.department.name}
                                    </p>
                                )}
                                <p className="text-sm text-gray-600">
                                    <strong>Created:</strong>{" "}
                                    {new Date(
                                        task.created_at
                                    ).toLocaleDateString()}
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end space-x-3 pt-6 border-t">
                                <button
                                    type="button"
                                    onClick={() => window.history.back()}
                                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {processing ? "Updating..." : "Update Task"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
