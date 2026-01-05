import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, router } from "@inertiajs/react";
import Button from "@/Components/Button";
import AIDescriptionField from "@/Components/AIDescriptionField";
import {
    FolderIcon,
    ArrowLeftIcon,
    UserGroupIcon,
    CalendarDaysIcon,
    CurrencyPoundIcon,
} from "@heroicons/react/24/outline";

export default function Edit({
    auth,
    project,
    users,
    departments,
    statuses,
    priorities,
    colors,
}) {
    const [selectedMembers, setSelectedMembers] = useState(
        project.members?.map((m) => m.id) || []
    );

    const { data, setData, put, processing, errors } = useForm({
        name: project.name || "",
        description: project.description || "",
        department_id: project.department_id || "",
        manager_id: project.manager_id || "",
        status: project.status || "planning",
        priority: project.priority || "medium",
        start_date: project.start_date || "",
        end_date: project.end_date || "",
        budget: project.budget || "",
        color: project.color || colors[0] || "#6366f1",
        member_ids: project.members?.map((m) => m.id) || [],
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route("projects.update", project.id), {
            data: {
                ...data,
                member_ids: selectedMembers,
            },
        });
    };

    const toggleMember = (userId) => {
        setSelectedMembers((prev) => {
            const newMembers = prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId];
            setData("member_ids", newMembers);
            return newMembers;
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() =>
                            router.visit(route("projects.show", project.id))
                        }
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeftIcon className="h-5 w-5 text-gray-500" />
                    </button>
                    <FolderIcon className="h-6 w-6 text-indigo-600" />
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Edit Project
                    </h2>
                </div>
            }
        >
            <Head title={`Edit ${project.name}`} />

            <div className="py-8">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    <form onSubmit={handleSubmit}>
                        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                            {/* Color Picker Bar */}
                            <div className="p-4 border-b bg-gray-50">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Project Colour
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {colors.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() =>
                                                setData("color", color)
                                            }
                                            className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${
                                                data.color === color
                                                    ? "ring-2 ring-offset-2 ring-gray-400 scale-110"
                                                    : ""
                                            }`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Project Name */}
                                <div>
                                    <label
                                        htmlFor="name"
                                        className="block text-sm font-medium text-gray-700"
                                    >
                                        Project Name{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        value={data.name}
                                        onChange={(e) =>
                                            setData("name", e.target.value)
                                        }
                                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        placeholder="Enter project name"
                                        required
                                    />
                                    {errors.name && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.name}
                                        </p>
                                    )}
                                </div>

                                {/* AI-Enhanced Description */}
                                <AIDescriptionField
                                    title={data.name}
                                    value={data.description}
                                    onChange={(value) =>
                                        setData("description", value)
                                    }
                                    type="general"
                                    label="Description"
                                    placeholder="Describe the project objectives, scope, and key deliverables..."
                                    error={errors.description}
                                    rows={4}
                                />

                                {/* Department and Manager */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        >
                                            <option value="">
                                                Select department
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

                                    <div>
                                        <label
                                            htmlFor="manager_id"
                                            className="block text-sm font-medium text-gray-700"
                                        >
                                            Project Manager
                                        </label>
                                        <select
                                            id="manager_id"
                                            value={data.manager_id}
                                            onChange={(e) =>
                                                setData(
                                                    "manager_id",
                                                    e.target.value
                                                )
                                            }
                                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        >
                                            <option value="">
                                                Select manager
                                            </option>
                                            {users.map((user) => (
                                                <option
                                                    key={user.id}
                                                    value={user.id}
                                                >
                                                    {user.name} ({user.role})
                                                </option>
                                            ))}
                                        </select>
                                        {errors.manager_id && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.manager_id}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Status and Priority */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label
                                            htmlFor="status"
                                            className="block text-sm font-medium text-gray-700"
                                        >
                                            Status{" "}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>
                                        <select
                                            id="status"
                                            value={data.status}
                                            onChange={(e) =>
                                                setData(
                                                    "status",
                                                    e.target.value
                                                )
                                            }
                                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            required
                                        >
                                            {Object.entries(statuses).map(
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
                                        {errors.status && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.status}
                                            </p>
                                        )}
                                    </div>

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
                                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            required
                                        >
                                            {Object.entries(priorities).map(
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
                                        {errors.priority && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.priority}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Dates */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label
                                            htmlFor="start_date"
                                            className="block text-sm font-medium text-gray-700"
                                        >
                                            <CalendarDaysIcon className="h-4 w-4 inline mr-1" />
                                            Start Date
                                        </label>
                                        <input
                                            type="date"
                                            id="start_date"
                                            value={data.start_date}
                                            onChange={(e) =>
                                                setData(
                                                    "start_date",
                                                    e.target.value
                                                )
                                            }
                                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        />
                                        {errors.start_date && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.start_date}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="end_date"
                                            className="block text-sm font-medium text-gray-700"
                                        >
                                            <CalendarDaysIcon className="h-4 w-4 inline mr-1" />
                                            End Date
                                        </label>
                                        <input
                                            type="date"
                                            id="end_date"
                                            value={data.end_date}
                                            onChange={(e) =>
                                                setData(
                                                    "end_date",
                                                    e.target.value
                                                )
                                            }
                                            min={data.start_date}
                                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        />
                                        {errors.end_date && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.end_date}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Budget */}
                                <div>
                                    <label
                                        htmlFor="budget"
                                        className="block text-sm font-medium text-gray-700"
                                    >
                                        <CurrencyPoundIcon className="h-4 w-4 inline mr-1" />
                                        Budget (Optional)
                                    </label>
                                    <div className="mt-1 relative rounded-lg shadow-sm">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                            <span className="text-gray-500 sm:text-sm">
                                                £
                                            </span>
                                        </div>
                                        <input
                                            type="number"
                                            id="budget"
                                            value={data.budget}
                                            onChange={(e) =>
                                                setData(
                                                    "budget",
                                                    e.target.value
                                                )
                                            }
                                            className="block w-full rounded-lg border-gray-300 pl-7 pr-12 focus:border-indigo-500 focus:ring-indigo-500"
                                            placeholder="0.00"
                                            step="0.01"
                                            min="0"
                                        />
                                    </div>
                                    {errors.budget && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.budget}
                                        </p>
                                    )}
                                </div>

                                {/* Team Members */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <UserGroupIcon className="h-4 w-4 inline mr-1" />
                                        Team Members
                                    </label>
                                    <p className="text-sm text-gray-500 mb-3">
                                        Select team members for this project
                                    </p>
                                    <div className="border rounded-lg max-h-48 overflow-y-auto">
                                        {users.map((user) => (
                                            <label
                                                key={user.id}
                                                className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedMembers.includes(
                                                        user.id
                                                    )}
                                                    onChange={() =>
                                                        toggleMember(user.id)
                                                    }
                                                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                                />
                                                <span className="ml-3 text-sm text-gray-700">
                                                    {user.name}
                                                </span>
                                                <span className="ml-2 text-xs text-gray-500">
                                                    ({user.role})
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                    {selectedMembers.length > 0 && (
                                        <p className="mt-2 text-sm text-gray-600">
                                            {selectedMembers.length} member(s)
                                            selected
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-end space-x-3">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() =>
                                        router.visit(
                                            route("projects.show", project.id)
                                        )
                                    }
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? "Saving..." : "Save Changes"}
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
