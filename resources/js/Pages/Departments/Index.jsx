import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, usePage } from "@inertiajs/react";
import DataTable from "@/Components/DataTable";
import Button from "@/Components/Button";
import Modal from "@/Components/Modal";
import Toast from "@/Components/Toast";
import {
    PencilIcon,
    TrashIcon,
    PlusIcon,
    BuildingOffice2Icon,
    UserGroupIcon,
    MagnifyingGlassIcon,
    ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

export default function Index({ auth, departments, filters }) {
    const { flash } = usePage().props;
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [departmentToDelete, setDepartmentToDelete] = useState(null);
    const [search, setSearch] = useState(filters?.search || "");
    const [statusFilter, setStatusFilter] = useState(filters?.status || "all");
    const [toast, setToast] = useState({
        show: !!flash?.success || !!flash?.error,
        message: flash?.success || flash?.error || "",
        type: flash?.success ? "success" : "error",
    });

    const columns = [
        {
            key: "name",
            label: "Department/Team Name",
            sortable: true,
            render: (value, row) => (
                <div className="flex items-center">
                    <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center mr-3">
                        <BuildingOffice2Icon className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                        <p className="font-medium text-gray-900">{value}</p>
                        {row.description && (
                            <p className="text-xs text-gray-500 truncate max-w-xs">
                                {row.description}
                            </p>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: "head",
            label: "Team Lead",
            sortable: false,
            render: (value) =>
                value ? (
                    <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                            {value.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-gray-900">
                            {value.name}
                        </span>
                    </div>
                ) : (
                    <span className="text-gray-400">No lead assigned</span>
                ),
        },
        {
            key: "users_count",
            label: "Members",
            sortable: true,
            render: (value) => (
                <div className="flex items-center">
                    <UserGroupIcon className="h-4 w-4 text-gray-400 mr-1" />
                    <span className="text-sm font-medium">{value || 0}</span>
                </div>
            ),
        },
        {
            key: "status",
            label: "Status",
            sortable: true,
            render: (value) => (
                <span
                    className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                        value === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                    }`}
                >
                    {value?.toUpperCase()}
                </span>
            ),
        },
    ];

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(
            route("departments.index"),
            {
                search,
                status: statusFilter !== "all" ? statusFilter : undefined,
            },
            { preserveState: true }
        );
    };

    const handleStatusFilter = (status) => {
        setStatusFilter(status);
        router.get(
            route("departments.index"),
            { search, status: status !== "all" ? status : undefined },
            { preserveState: true }
        );
    };

    const handleDelete = (department) => {
        setDepartmentToDelete(department);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        router.delete(route("departments.destroy", departmentToDelete.id), {
            onSuccess: () => {
                setShowDeleteModal(false);
                setDepartmentToDelete(null);
                setToast({
                    show: true,
                    message: "Department/Team deleted successfully!",
                    type: "success",
                });
            },
            onError: () => {
                setShowDeleteModal(false);
                setToast({
                    show: true,
                    message: "Failed to delete department/team.",
                    type: "error",
                });
            },
        });
    };

    const actions = (row) => (
        <div className="flex items-center justify-end space-x-2">
            <Button
                variant="outline"
                size="sm"
                onClick={() => router.visit(route("departments.edit", row.id))}
                title="Edit"
            >
                <PencilIcon className="h-4 w-4" />
            </Button>
            {row.users_count === 0 && (
                <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(row)}
                    title="Delete"
                >
                    <TrashIcon className="h-4 w-4" />
                </Button>
            )}
        </div>
    );

    // Stats
    const totalDepartments = departments?.data?.length || 0;
    const activeDepartments =
        departments?.data?.filter((d) => d.status === "active").length || 0;
    const totalMembers =
        departments?.data?.reduce((sum, d) => sum + (d.users_count || 0), 0) ||
        0;

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <BuildingOffice2Icon className="h-6 w-6 text-gray-600" />
                        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                            Departments / Teams
                        </h2>
                    </div>
                    <Button
                        onClick={() =>
                            router.visit(route("departments.create"))
                        }
                    >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Add Department
                    </Button>
                </div>
            }
        >
            <Head title="Departments" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex items-center">
                                <div className="p-3 bg-indigo-100 rounded-full">
                                    <BuildingOffice2Icon className="h-6 w-6 text-indigo-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">
                                        Total Departments
                                    </p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {totalDepartments}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex items-center">
                                <div className="p-3 bg-green-100 rounded-full">
                                    <BuildingOffice2Icon className="h-6 w-6 text-green-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">
                                        Active
                                    </p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {activeDepartments}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex items-center">
                                <div className="p-3 bg-purple-100 rounded-full">
                                    <UserGroupIcon className="h-6 w-6 text-purple-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">
                                        Total Members
                                    </p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {totalMembers}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        {/* Filters */}
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                            <form
                                onSubmit={handleSearch}
                                className="flex gap-2"
                            >
                                <div className="relative">
                                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                        placeholder="Search departments..."
                                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                <Button type="submit" variant="outline">
                                    Search
                                </Button>
                            </form>

                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">
                                    Status:
                                </span>
                                <select
                                    value={statusFilter}
                                    onChange={(e) =>
                                        handleStatusFilter(e.target.value)
                                    }
                                    className="rounded-md border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="all">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>

                        {/* Table */}
                        <DataTable
                            columns={columns}
                            data={departments.data}
                            pagination={departments}
                            actions={actions}
                        />
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <Modal
                show={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                maxWidth="md"
            >
                <div className="p-6">
                    <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                        <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
                        Delete Department/Team
                    </h3>
                    <p className="text-sm text-gray-500 text-center mb-6">
                        Are you sure you want to delete "
                        {departmentToDelete?.name}"? This action cannot be
                        undone.
                    </p>
                    <div className="flex justify-center space-x-3">
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={confirmDelete}>
                            Delete
                        </Button>
                    </div>
                </div>
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
