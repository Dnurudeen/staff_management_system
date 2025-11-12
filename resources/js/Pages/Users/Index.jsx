import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import DataTable from "@/Components/DataTable";
import Modal from "@/Components/Modal";
import Button from "@/Components/Button";
import Toast from "@/Components/Toast";
import {
    PencilIcon,
    TrashIcon,
    PlusIcon,
    ArrowDownTrayIcon,
    ArrowUpTrayIcon,
} from "@heroicons/react/24/outline";

export default function Index({ auth, users, filters }) {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [toast, setToast] = useState({
        show: false,
        message: "",
        type: "success",
    });
    const [sortColumn, setSortColumn] = useState("name");
    const [sortDirection, setSortDirection] = useState("asc");

    const columns = [
        {
            key: "name",
            label: "Name",
            sortable: true,
            render: (value, row) => (
                <div className="flex items-center">
                    {row.avatar ? (
                        <img
                            className="h-10 w-10 rounded-full"
                            src={`/storage/${row.avatar}`}
                            alt={value}
                        />
                    ) : (
                        <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
                            {value.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                            {value}
                        </div>
                        <div className="text-sm text-gray-500">{row.email}</div>
                    </div>
                </div>
            ),
        },
        {
            key: "role",
            label: "Role",
            sortable: true,
            render: (value) => (
                <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        value === "prime_admin"
                            ? "bg-purple-100 text-purple-800"
                            : value === "admin"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                    }`}
                >
                    {value.replace("_", " ").toUpperCase()}
                </span>
            ),
        },
        {
            key: "department",
            label: "Department",
            sortable: false,
            render: (value) => (value ? value.name : "-"),
        },
        {
            key: "status",
            label: "Status",
            sortable: true,
            render: (value) => (
                <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        value === "active"
                            ? "bg-green-100 text-green-800"
                            : value === "inactive"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-red-100 text-red-800"
                    }`}
                >
                    {value.toUpperCase()}
                </span>
            ),
        },
        {
            key: "phone",
            label: "Phone",
            sortable: false,
            render: (value) => value || "-",
        },
    ];

    const handleSort = (column) => {
        const direction =
            sortColumn === column && sortDirection === "asc" ? "desc" : "asc";
        setSortColumn(column);
        setSortDirection(direction);

        router.get(
            route("users.index"),
            {
                ...filters,
                sort: column,
                direction: direction,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const handleSearch = (searchTerm) => {
        router.get(
            route("users.index"),
            {
                ...filters,
                search: searchTerm,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const handlePageChange = (page) => {
        router.get(
            route("users.index"),
            {
                ...filters,
                page: page,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const handleDelete = (user) => {
        setUserToDelete(user);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        router.delete(route("users.destroy", userToDelete.id), {
            onSuccess: () => {
                setShowDeleteModal(false);
                setUserToDelete(null);
                setToast({
                    show: true,
                    message: "User deleted successfully!",
                    type: "success",
                });
            },
            onError: () => {
                setToast({
                    show: true,
                    message: "Failed to delete user!",
                    type: "error",
                });
            },
        });
    };

    const handleExport = () => {
        window.location.href = route("users.export");
    };

    const actions = (row) => (
        <div className="flex items-center justify-end space-x-2">
            <Button
                variant="outline"
                size="sm"
                onClick={() => router.visit(route("users.edit", row.id))}
            >
                <PencilIcon className="h-4 w-4" />
            </Button>
            {row.role !== "prime_admin" && (
                <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(row)}
                >
                    <TrashIcon className="h-4 w-4" />
                </Button>
            )}
        </div>
    );

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        User Management
                    </h2>
                    <div className="flex space-x-2">
                        <Button variant="outline" onClick={handleExport}>
                            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                            Export
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => router.visit(route("users.import"))}
                        >
                            <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
                            Import
                        </Button>
                        <Button
                            onClick={() => router.visit(route("users.create"))}
                        >
                            <PlusIcon className="h-5 w-5 mr-2" />
                            Invite User
                        </Button>
                    </div>
                </div>
            }
        >
            <Head title="Users" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <DataTable
                            columns={columns}
                            data={users.data}
                            onSort={handleSort}
                            sortColumn={sortColumn}
                            sortDirection={sortDirection}
                            searchable={true}
                            onSearch={handleSearch}
                            searchPlaceholder="Search users..."
                            pagination={users}
                            onPageChange={handlePageChange}
                            actions={actions}
                        />
                    </div>
                </div>
            </div>

            <Modal
                show={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Delete User"
                maxWidth="md"
            >
                <p className="text-sm text-gray-600">
                    Are you sure you want to delete{" "}
                    <strong>{userToDelete?.name}</strong>? This action cannot be
                    undone.
                </p>
                <div className="flex justify-end space-x-2 mt-6">
                    <Button
                        variant="ghost"
                        onClick={() => setShowDeleteModal(false)}
                    >
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={confirmDelete}>
                        Delete
                    </Button>
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
