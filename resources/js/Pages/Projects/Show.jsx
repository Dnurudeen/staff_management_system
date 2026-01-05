import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, router, Link } from "@inertiajs/react";
import Button from "@/Components/Button";
import Modal from "@/Components/Modal";
import AIDescriptionField from "@/Components/AIDescriptionField";
import {
    FolderIcon,
    ArrowLeftIcon,
    PlusIcon,
    PencilIcon,
    TrashIcon,
    UserGroupIcon,
    CalendarDaysIcon,
    ClipboardDocumentListIcon,
    CheckCircleIcon,
    ClockIcon,
    ExclamationCircleIcon,
    XCircleIcon,
    ChartBarIcon,
    CurrencyPoundIcon,
} from "@heroicons/react/24/outline";

export default function Show({
    auth,
    project,
    tasks,
    users,
    taskStats,
    taskStatuses,
    taskPriorities,
}) {
    const [showAddTaskModal, setShowAddTaskModal] = useState(false);
    const [taskFilter, setTaskFilter] = useState("all");

    const { data, setData, post, processing, errors, reset } = useForm({
        title: "",
        description: "",
        assigned_to: "",
        priority: "medium",
        due_date: "",
    });

    const handleAddTask = (e) => {
        e.preventDefault();
        post(route("projects.tasks.store", project.id), {
            onSuccess: () => {
                reset();
                setShowAddTaskModal(false);
            },
        });
    };

    const handleTaskStatusUpdate = (taskId, newStatus) => {
        router.patch(
            route("projects.tasks.update-status", [project.id, taskId]),
            { status: newStatus },
            { preserveScroll: true }
        );
    };

    const handleDeleteProject = () => {
        if (
            confirm(
                "Are you sure you want to delete this project? This action cannot be undone."
            )
        ) {
            router.delete(route("projects.destroy", project.id));
        }
    };

    const getStatusIcon = (status) => {
        const icons = {
            pending: <ClockIcon className="h-4 w-4 text-gray-500" />,
            in_progress: (
                <ExclamationCircleIcon className="h-4 w-4 text-blue-500" />
            ),
            completed: <CheckCircleIcon className="h-4 w-4 text-green-500" />,
            cancelled: <XCircleIcon className="h-4 w-4 text-red-500" />,
        };
        return icons[status] || icons.pending;
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: "bg-gray-100 text-gray-800",
            in_progress: "bg-blue-100 text-blue-800",
            completed: "bg-green-100 text-green-800",
            cancelled: "bg-red-100 text-red-800",
        };
        return colors[status] || "bg-gray-100 text-gray-800";
    };

    const getPriorityColor = (priority) => {
        const colors = {
            low: "bg-green-100 text-green-800",
            medium: "bg-yellow-100 text-yellow-800",
            high: "bg-orange-100 text-orange-800",
            urgent: "bg-red-100 text-red-800",
            critical: "bg-red-100 text-red-800",
        };
        return colors[priority] || "bg-gray-100 text-gray-800";
    };

    const formatDate = (dateString) => {
        if (!dateString) return "Not set";
        return new Date(dateString).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    const filteredTasks =
        taskFilter === "all"
            ? tasks
            : tasks.filter((task) => task.status === taskFilter);

    const projectProgress =
        taskStats.total > 0
            ? Math.round((taskStats.completed / taskStats.total) * 100)
            : 0;

    const canManage =
        auth.user.role !== "staff" ||
        project.created_by === auth.user.id ||
        project.manager_id === auth.user.id;

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() =>
                                router.visit(route("projects.index"))
                            }
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
                        </button>
                        <div
                            className="w-3 h-8 rounded"
                            style={{
                                backgroundColor: project.color || "#6366f1",
                            }}
                        />
                        <div>
                            <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                                {project.name}
                            </h2>
                            <p className="text-sm text-gray-500">
                                {project.department?.name || "No department"}
                            </p>
                        </div>
                    </div>
                    {canManage && (
                        <div className="flex items-center space-x-2">
                            <Link
                                href={route("projects.edit", project.id)}
                                className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <PencilIcon className="h-5 w-5" />
                            </Link>
                            <button
                                onClick={handleDeleteProject}
                                className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <TrashIcon className="h-5 w-5" />
                            </button>
                        </div>
                    )}
                </div>
            }
        >
            <Head title={project.name} />

            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Project Stats */}
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-gray-900 flex items-center">
                                        <ChartBarIcon className="h-5 w-5 mr-2 text-indigo-600" />
                                        Progress Overview
                                    </h3>
                                    <span className="text-2xl font-bold text-indigo-600">
                                        {projectProgress}%
                                    </span>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                                    <div
                                        className="bg-indigo-600 h-3 rounded-full transition-all"
                                        style={{ width: `${projectProgress}%` }}
                                    />
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-4 gap-4 text-center">
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <div className="text-2xl font-bold text-gray-900">
                                            {taskStats.total}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Total
                                        </div>
                                    </div>
                                    <div className="p-3 bg-yellow-50 rounded-lg">
                                        <div className="text-2xl font-bold text-yellow-600">
                                            {taskStats.pending}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Pending
                                        </div>
                                    </div>
                                    <div className="p-3 bg-blue-50 rounded-lg">
                                        <div className="text-2xl font-bold text-blue-600">
                                            {taskStats.in_progress}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            In Progress
                                        </div>
                                    </div>
                                    <div className="p-3 bg-green-50 rounded-lg">
                                        <div className="text-2xl font-bold text-green-600">
                                            {taskStats.completed}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Completed
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tasks Section */}
                            <div className="bg-white rounded-lg shadow-sm">
                                <div className="px-6 py-4 border-b flex items-center justify-between">
                                    <h3 className="font-semibold text-gray-900 flex items-center">
                                        <ClipboardDocumentListIcon className="h-5 w-5 mr-2 text-indigo-600" />
                                        Tasks
                                    </h3>
                                    <div className="flex items-center space-x-3">
                                        <select
                                            value={taskFilter}
                                            onChange={(e) =>
                                                setTaskFilter(e.target.value)
                                            }
                                            className="text-sm border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                        >
                                            <option value="all">
                                                All Tasks
                                            </option>
                                            {Object.entries(taskStatuses).map(
                                                ([key, label]) => (
                                                    <option
                                                        key={key}
                                                        value={key}
                                                    >
                                                        {label}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                        {canManage && (
                                            <Button
                                                onClick={() =>
                                                    setShowAddTaskModal(true)
                                                }
                                                size="sm"
                                            >
                                                <PlusIcon className="h-4 w-4 mr-1" />
                                                Add Task
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div className="divide-y">
                                    {filteredTasks.length === 0 ? (
                                        <div className="px-6 py-12 text-center text-gray-500">
                                            <ClipboardDocumentListIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                                            <p>No tasks found</p>
                                            {canManage && (
                                                <Button
                                                    onClick={() =>
                                                        setShowAddTaskModal(
                                                            true
                                                        )
                                                    }
                                                    variant="secondary"
                                                    className="mt-3"
                                                >
                                                    Add First Task
                                                </Button>
                                            )}
                                        </div>
                                    ) : (
                                        filteredTasks.map((task) => (
                                            <div
                                                key={task.id}
                                                className="px-6 py-4 hover:bg-gray-50 transition-colors"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center space-x-2">
                                                            {getStatusIcon(
                                                                task.status
                                                            )}
                                                            <h4 className="font-medium text-gray-900">
                                                                {task.title}
                                                            </h4>
                                                            <span
                                                                className={`px-2 py-0.5 text-xs font-medium rounded ${getPriorityColor(
                                                                    task.priority
                                                                )}`}
                                                            >
                                                                {
                                                                    taskPriorities[
                                                                        task
                                                                            .priority
                                                                    ]
                                                                }
                                                            </span>
                                                        </div>
                                                        {task.description && (
                                                            <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                                                                {
                                                                    task.description
                                                                }
                                                            </p>
                                                        )}
                                                        <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                                                            <span className="flex items-center">
                                                                <UserGroupIcon className="h-3.5 w-3.5 mr-1" />
                                                                {task
                                                                    .assigned_user
                                                                    ?.name ||
                                                                    "Unassigned"}
                                                            </span>
                                                            {task.due_date && (
                                                                <span className="flex items-center">
                                                                    <CalendarDaysIcon className="h-3.5 w-3.5 mr-1" />
                                                                    {formatDate(
                                                                        task.due_date
                                                                    )}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Status Dropdown */}
                                                    <select
                                                        value={task.status}
                                                        onChange={(e) =>
                                                            handleTaskStatusUpdate(
                                                                task.id,
                                                                e.target.value
                                                            )
                                                        }
                                                        className={`ml-4 text-xs font-medium rounded border-0 focus:ring-2 focus:ring-indigo-500 ${getStatusColor(
                                                            task.status
                                                        )}`}
                                                    >
                                                        {Object.entries(
                                                            taskStatuses
                                                        ).map(
                                                            ([key, label]) => (
                                                                <option
                                                                    key={key}
                                                                    value={key}
                                                                >
                                                                    {label}
                                                                </option>
                                                            )
                                                        )}
                                                    </select>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Project Details */}
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <h3 className="font-semibold text-gray-900 mb-4">
                                    Details
                                </h3>

                                <dl className="space-y-4">
                                    <div>
                                        <dt className="text-xs font-medium text-gray-500 uppercase">
                                            Status
                                        </dt>
                                        <dd className="mt-1">
                                            <span
                                                className={`inline-flex px-2 py-1 text-sm font-medium rounded-full ${
                                                    project.status === "active"
                                                        ? "bg-green-100 text-green-800"
                                                        : project.status ===
                                                          "completed"
                                                        ? "bg-blue-100 text-blue-800"
                                                        : project.status ===
                                                          "on_hold"
                                                        ? "bg-yellow-100 text-yellow-800"
                                                        : project.status ===
                                                          "cancelled"
                                                        ? "bg-red-100 text-red-800"
                                                        : "bg-gray-100 text-gray-800"
                                                }`}
                                            >
                                                {project.status
                                                    .replace("_", " ")
                                                    .toUpperCase()}
                                            </span>
                                        </dd>
                                    </div>

                                    <div>
                                        <dt className="text-xs font-medium text-gray-500 uppercase">
                                            Priority
                                        </dt>
                                        <dd className="mt-1">
                                            <span
                                                className={`inline-flex px-2 py-1 text-sm font-medium rounded-full ${getPriorityColor(
                                                    project.priority
                                                )}`}
                                            >
                                                {project.priority.toUpperCase()}
                                            </span>
                                        </dd>
                                    </div>

                                    {project.manager && (
                                        <div>
                                            <dt className="text-xs font-medium text-gray-500 uppercase">
                                                Manager
                                            </dt>
                                            <dd className="mt-1 text-sm text-gray-900">
                                                {project.manager.name}
                                            </dd>
                                        </div>
                                    )}

                                    <div>
                                        <dt className="text-xs font-medium text-gray-500 uppercase">
                                            Timeline
                                        </dt>
                                        <dd className="mt-1 text-sm text-gray-900 flex items-center">
                                            <CalendarDaysIcon className="h-4 w-4 mr-1 text-gray-400" />
                                            {formatDate(project.start_date)} -{" "}
                                            {formatDate(project.end_date)}
                                        </dd>
                                    </div>

                                    {project.budget && (
                                        <div>
                                            <dt className="text-xs font-medium text-gray-500 uppercase">
                                                Budget
                                            </dt>
                                            <dd className="mt-1 text-sm text-gray-900 flex items-center">
                                                <CurrencyPoundIcon className="h-4 w-4 mr-1 text-gray-400" />
                                                £
                                                {parseFloat(
                                                    project.budget
                                                ).toLocaleString()}
                                            </dd>
                                        </div>
                                    )}

                                    <div>
                                        <dt className="text-xs font-medium text-gray-500 uppercase">
                                            Created By
                                        </dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                            {project.creator?.name || "Unknown"}
                                        </dd>
                                    </div>
                                </dl>
                            </div>

                            {/* Description */}
                            {project.description && (
                                <div className="bg-white rounded-lg shadow-sm p-6">
                                    <h3 className="font-semibold text-gray-900 mb-3">
                                        Description
                                    </h3>
                                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                        {project.description}
                                    </p>
                                </div>
                            )}

                            {/* Team Members */}
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                                    <UserGroupIcon className="h-5 w-5 mr-2 text-indigo-600" />
                                    Team Members ({project.members?.length || 0}
                                    )
                                </h3>
                                {project.members &&
                                project.members.length > 0 ? (
                                    <ul className="space-y-2">
                                        {project.members.map((member) => (
                                            <li
                                                key={member.id}
                                                className="flex items-center text-sm text-gray-700"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                                                    <span className="text-indigo-600 font-medium text-xs">
                                                        {member.name
                                                            .split(" ")
                                                            .map((n) => n[0])
                                                            .join("")
                                                            .toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="font-medium">
                                                        {member.name}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {member.pivot?.role ||
                                                            "Member"}
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-gray-500">
                                        No team members assigned
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Task Modal */}
            <Modal
                show={showAddTaskModal}
                onClose={() => setShowAddTaskModal(false)}
                maxWidth="lg"
            >
                <form onSubmit={handleAddTask} className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        Add Task to Project
                    </h2>

                    <div className="space-y-4">
                        {/* Task Title */}
                        <div>
                            <label
                                htmlFor="task_title"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Task Title{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="task_title"
                                value={data.title}
                                onChange={(e) =>
                                    setData("title", e.target.value)
                                }
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                            onChange={(value) => setData("description", value)}
                            type="task"
                            label="Description"
                            placeholder="Describe the task..."
                            error={errors.description}
                            rows={3}
                        />

                        {/* Assigned To and Priority */}
                        <div className="grid grid-cols-2 gap-4">
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
                                        setData("assigned_to", e.target.value)
                                    }
                                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    required
                                >
                                    <option value="">Select user</option>
                                    {users.map((user) => (
                                        <option key={user.id} value={user.id}>
                                            {user.name}
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
                                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    required
                                >
                                    {Object.entries(taskPriorities).map(
                                        ([key, label]) => (
                                            <option key={key} value={key}>
                                                {label}
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
                        </div>

                        {/* Due Date */}
                        <div>
                            <label
                                htmlFor="due_date"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Due Date
                            </label>
                            <input
                                type="date"
                                id="due_date"
                                value={data.due_date}
                                onChange={(e) =>
                                    setData("due_date", e.target.value)
                                }
                                min={new Date().toISOString().split("T")[0]}
                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                            {errors.due_date && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.due_date}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                                reset();
                                setShowAddTaskModal(false);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? "Adding..." : "Add Task"}
                        </Button>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
