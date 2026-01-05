import React, { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, Link } from "@inertiajs/react";
import Button from "@/Components/Button";
import {
    PlusIcon,
    FolderIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    CalendarDaysIcon,
    UserGroupIcon,
    ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";

export default function Index({
    auth,
    projects,
    filters,
    statuses,
    priorities,
}) {
    const [search, setSearch] = useState(filters?.search || "");
    const [statusFilter, setStatusFilter] = useState(filters?.status || "all");
    const [priorityFilter, setPriorityFilter] = useState(
        filters?.priority || "all"
    );

    const handleFilter = () => {
        router.get(
            route("projects.index"),
            {
                search: search || undefined,
                status: statusFilter !== "all" ? statusFilter : undefined,
                priority: priorityFilter !== "all" ? priorityFilter : undefined,
            },
            { preserveState: true }
        );
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            handleFilter();
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            planning: "bg-gray-100 text-gray-800",
            active: "bg-green-100 text-green-800",
            on_hold: "bg-yellow-100 text-yellow-800",
            completed: "bg-blue-100 text-blue-800",
            cancelled: "bg-red-100 text-red-800",
        };
        return colors[status] || "bg-gray-100 text-gray-800";
    };

    const getPriorityColor = (priority) => {
        const colors = {
            low: "bg-green-100 text-green-800",
            medium: "bg-yellow-100 text-yellow-800",
            high: "bg-orange-100 text-orange-800",
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

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <FolderIcon className="h-6 w-6 text-indigo-600" />
                        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                            Projects
                        </h2>
                    </div>
                    {auth.user.role !== "staff" && (
                        <Button
                            onClick={() =>
                                router.visit(route("projects.create"))
                            }
                        >
                            <PlusIcon className="h-5 w-5 mr-2" />
                            New Project
                        </Button>
                    )}
                </div>
            }
        >
            <Head title="Projects" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Filters */}
                    <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            {/* Search */}
                            <div className="flex-1">
                                <div className="relative">
                                    <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                        onKeyDown={handleKeyDown}
                                        placeholder="Search projects..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            {/* Status Filter */}
                            <div className="w-full sm:w-48">
                                <select
                                    value={statusFilter}
                                    onChange={(e) =>
                                        setStatusFilter(e.target.value)
                                    }
                                    className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="all">All Statuses</option>
                                    {Object.entries(statuses).map(
                                        ([key, label]) => (
                                            <option key={key} value={key}>
                                                {label}
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>

                            {/* Priority Filter */}
                            <div className="w-full sm:w-48">
                                <select
                                    value={priorityFilter}
                                    onChange={(e) =>
                                        setPriorityFilter(e.target.value)
                                    }
                                    className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="all">All Priorities</option>
                                    {Object.entries(priorities).map(
                                        ([key, label]) => (
                                            <option key={key} value={key}>
                                                {label}
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>

                            {/* Filter Button */}
                            <Button onClick={handleFilter} variant="secondary">
                                <FunnelIcon className="h-5 w-5 mr-2" />
                                Filter
                            </Button>
                        </div>
                    </div>

                    {/* Projects Grid */}
                    {!projects ||
                    !projects.data ||
                    projects.data.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                            <FolderIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No projects found
                            </h3>
                            <p className="text-gray-500 mb-6">
                                {search ||
                                statusFilter !== "all" ||
                                priorityFilter !== "all"
                                    ? "Try adjusting your filters to find what you're looking for."
                                    : "Get started by creating your first project."}
                            </p>
                            {auth.user.role !== "staff" && (
                                <Button
                                    onClick={() =>
                                        router.visit(route("projects.create"))
                                    }
                                >
                                    <PlusIcon className="h-5 w-5 mr-2" />
                                    Create Project
                                </Button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {projects.data.map((project) => (
                                    <Link
                                        key={project.id}
                                        href={route(
                                            "projects.show",
                                            project.id
                                        )}
                                        className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100"
                                    >
                                        {/* Color Bar */}
                                        <div
                                            className="h-2"
                                            style={{
                                                backgroundColor:
                                                    project.color || "#6366f1",
                                            }}
                                        />

                                        <div className="p-5">
                                            {/* Header */}
                                            <div className="flex items-start justify-between mb-3">
                                                <h3 className="font-semibold text-gray-900 line-clamp-1">
                                                    {project.name}
                                                </h3>
                                                <span
                                                    className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${getStatusColor(
                                                        project.status
                                                    )}`}
                                                >
                                                    {statuses[project.status]}
                                                </span>
                                            </div>

                                            {/* Description */}
                                            {project.description && (
                                                <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                                                    {project.description}
                                                </p>
                                            )}

                                            {/* Progress Bar */}
                                            <div className="mb-4">
                                                <div className="flex items-center justify-between text-sm mb-1">
                                                    <span className="text-gray-500">
                                                        Progress
                                                    </span>
                                                    <span className="font-medium text-gray-700">
                                                        {project.tasks_count > 0
                                                            ? Math.round(
                                                                  (project.completed_tasks_count /
                                                                      project.tasks_count) *
                                                                      100
                                                              )
                                                            : 0}
                                                        %
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-indigo-600 h-2 rounded-full transition-all"
                                                        style={{
                                                            width: `${
                                                                project.tasks_count >
                                                                0
                                                                    ? (project.completed_tasks_count /
                                                                          project.tasks_count) *
                                                                      100
                                                                    : 0
                                                            }%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Meta Info */}
                                            <div className="flex items-center justify-between text-sm text-gray-500">
                                                <div className="flex items-center space-x-4">
                                                    <span className="flex items-center">
                                                        <ClipboardDocumentListIcon className="h-4 w-4 mr-1" />
                                                        {project.tasks_count}{" "}
                                                        tasks
                                                    </span>
                                                    <span className="flex items-center">
                                                        <UserGroupIcon className="h-4 w-4 mr-1" />
                                                        {project.members
                                                            ?.length || 0}
                                                    </span>
                                                </div>
                                                <span
                                                    className={`px-2 py-0.5 text-xs font-medium rounded ${getPriorityColor(
                                                        project.priority
                                                    )}`}
                                                >
                                                    {
                                                        priorities[
                                                            project.priority
                                                        ]
                                                    }
                                                </span>
                                            </div>

                                            {/* Dates */}
                                            {(project.start_date ||
                                                project.end_date) && (
                                                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center text-xs text-gray-500">
                                                    <CalendarDaysIcon className="h-4 w-4 mr-1" />
                                                    <span>
                                                        {formatDate(
                                                            project.start_date
                                                        )}{" "}
                                                        -{" "}
                                                        {formatDate(
                                                            project.end_date
                                                        )}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            {/* Pagination */}
                            {projects.last_page > 1 && (
                                <div className="mt-6 flex justify-center">
                                    <nav className="flex items-center space-x-2">
                                        {projects.links.map((link, index) => (
                                            <button
                                                key={index}
                                                onClick={() =>
                                                    link.url &&
                                                    router.visit(link.url)
                                                }
                                                disabled={!link.url}
                                                className={`px-3 py-2 text-sm rounded-lg ${
                                                    link.active
                                                        ? "bg-indigo-600 text-white"
                                                        : link.url
                                                        ? "bg-white text-gray-700 hover:bg-gray-50"
                                                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                }`}
                                                dangerouslySetInnerHTML={{
                                                    __html: link.label,
                                                }}
                                            />
                                        ))}
                                    </nav>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
