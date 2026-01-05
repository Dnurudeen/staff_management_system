import React from "react";
import { Head, useForm } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import AIDescriptionField from "@/Components/AIDescriptionField";
import { FolderIcon } from "@heroicons/react/24/outline";

export default function Create({ auth, users, departments, projects = [] }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        title: "",
        description: "",
        assigned_to: "",
        department_id: "",
        project_id: "",
        priority: "medium",
        due_date: "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("tasks.store"), {
            onSuccess: () => reset(),
        });
    };

    const priorityOptions = [
        { value: "low", label: "Low" },
        { value: "medium", label: "Medium" },
        { value: "high", label: "High" },
        { value: "urgent", label: "Urgent" },
    ];

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="Create Task" />

            <div className="py-6">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">
                            Create New Task
                        </h1>
                        <p className="mt-1 text-sm text-gray-600">
                            Assign a new task to a team member
                        </p>
                    </div>

                    <div className="bg-white shadow rounded-lg">
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Title */}
                            <div>
                                <label
                                    htmlFor="title"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Task Title{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="title"
                                    value={data.title}
                                    onChange={(e) =>
                                        setData("title", e.target.value)
                                    }
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    placeholder="Enter task title"
                                    required
                                />
                                {errors.title && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.title}
                                    </p>
                                )}
                            </div>

                            {/* AI-Enhanced Description */}
                            <AIDescriptionField
                                title={data.title}
                                value={data.description}
                                onChange={(value) =>
                                    setData("description", value)
                                }
                                type="task"
                                context={{ priority: data.priority }}
                                label="Description"
                                placeholder="Enter task description or click 'AI Suggest' for auto-generated content..."
                                error={errors.description}
                                rows={4}
                            />

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
                                        setData("project_id", e.target.value)
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
                                <p className="mt-1 text-xs text-gray-500">
                                    Optionally assign this task to a project for
                                    better organisation
                                </p>
                            </div>

                            {/* Assigned To & Department */}
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div>
                                    <label
                                        htmlFor="assigned_to"
                                        className="block text-sm font-medium text-gray-700"
                                    >
                                        Assign To{" "}
                                        <span className="text-red-500">*</span>
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
                                        <option value="">Select a user</option>
                                        {users.map((user) => (
                                            <option
                                                key={user.id}
                                                value={user.id}
                                            >
                                                {user.name} - {user.role}
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
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="priority"
                                        value={data.priority}
                                        onChange={(e) =>
                                            setData("priority", e.target.value)
                                        }
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        required
                                    >
                                        {priorityOptions.map((option) => (
                                            <option
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </option>
                                        ))}
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
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        id="due_date"
                                        value={data.due_date}
                                        onChange={(e) =>
                                            setData("due_date", e.target.value)
                                        }
                                        min={
                                            new Date()
                                                .toISOString()
                                                .split("T")[0]
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
                                    {processing ? "Creating..." : "Create Task"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
