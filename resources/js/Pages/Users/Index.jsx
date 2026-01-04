import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, usePage } from "@inertiajs/react";
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
    ExclamationTriangleIcon,
    UserGroupIcon,
    ChartBarIcon,
    EnvelopeIcon,
    BuildingOffice2Icon,
    XMarkIcon,
} from "@heroicons/react/24/outline";

export default function Index({
    auth,
    users,
    filters,
    organizationStats,
    departments,
}) {
    const { organization, planFeatures } = usePage().props;
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [showDepartmentModal, setShowDepartmentModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedDepartments, setSelectedDepartments] = useState([]);
    const [toast, setToast] = useState({
        show: false,
        message: "",
        type: "success",
    });
    const [sortColumn, setSortColumn] = useState("name");
    const [sortDirection, setSortDirection] = useState("asc");

    const canAddEmployee = organizationStats?.can_add_employee ?? true;
    const employeeUsagePercentage =
        organizationStats?.max_employees > 0
            ? Math.round(
                  (organizationStats?.current_employees /
                      organizationStats?.max_employees) *
                      100
              )
            : 0;

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
            key: "departments",
            label: "Department/Team",
            sortable: false,
            render: (value, row) => {
                // Combine legacy department with many-to-many departments
                const allDepartments = [];

                // Add departments from many-to-many relationship
                if (row.departments && row.departments.length > 0) {
                    row.departments.forEach((dept) => {
                        if (!allDepartments.find((d) => d.id === dept.id)) {
                            allDepartments.push(dept);
                        }
                    });
                }

                // Also check legacy department field
                if (
                    row.department &&
                    !allDepartments.find((d) => d.id === row.department.id)
                ) {
                    allDepartments.push(row.department);
                }

                if (allDepartments.length === 0) {
                    return (
                        <button
                            onClick={() => openDepartmentModal(row)}
                            className="text-gray-400 hover:text-indigo-600 text-sm flex items-center gap-1"
                        >
                            <PlusIcon className="h-4 w-4" />
                            Add Team
                        </button>
                    );
                }

                return (
                    <div className="flex flex-wrap gap-1 items-center">
                        {allDepartments.slice(0, 2).map((dept) => (
                            <span
                                key={dept.id}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                            >
                                {dept.name}
                            </span>
                        ))}
                        {allDepartments.length > 2 && (
                            <span className="text-xs text-gray-500">
                                +{allDepartments.length - 2} more
                            </span>
                        )}
                        <button
                            onClick={() => openDepartmentModal(row)}
                            className="ml-1 text-gray-400 hover:text-indigo-600"
                            title="Manage Teams"
                        >
                            <PencilIcon className="h-3.5 w-3.5" />
                        </button>
                    </div>
                );
            },
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

    const openDepartmentModal = (user) => {
        setSelectedUser(user);
        // Get current department IDs from the user
        const currentDeptIds = [];
        if (user.departments && user.departments.length > 0) {
            user.departments.forEach((dept) => currentDeptIds.push(dept.id));
        }
        // Also include legacy department if exists and not already included
        if (user.department && !currentDeptIds.includes(user.department.id)) {
            currentDeptIds.push(user.department.id);
        }
        setSelectedDepartments(currentDeptIds);
        setShowDepartmentModal(true);
    };

    const toggleDepartment = (deptId) => {
        setSelectedDepartments((prev) => {
            if (prev.includes(deptId)) {
                return prev.filter((id) => id !== deptId);
            }
            return [...prev, deptId];
        });
    };

    const saveDepartments = () => {
        router.put(
            route("users.departments.update", selectedUser.id),
            { department_ids: selectedDepartments },
            {
                onSuccess: () => {
                    setShowDepartmentModal(false);
                    setSelectedUser(null);
                    setToast({
                        show: true,
                        message: "User departments updated successfully!",
                        type: "success",
                    });
                },
                onError: () => {
                    setToast({
                        show: true,
                        message: "Failed to update departments!",
                        type: "error",
                    });
                },
            }
        );
    };

    const handleExport = () => {
        window.location.href = route("users.export");
    };

    const handleInviteClick = () => {
        if (!canAddEmployee) {
            setShowUpgradeModal(true);
        } else {
            router.visit(route("users.create"));
        }
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
                        <Button
                            variant="outline"
                            onClick={() =>
                                router.visit(route("invitations.index"))
                            }
                        >
                            <EnvelopeIcon className="h-5 w-5 mr-2" />
                            Invitations
                        </Button>
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
                        <Button onClick={handleInviteClick}>
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
                    {/* Organization Stats Card */}
                    {organizationStats && (
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 mb-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="p-3 bg-indigo-100 rounded-full">
                                        <UserGroupIcon className="h-6 w-6 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {organization?.name ||
                                                "Your Organization"}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            {organizationStats.plan_name} Plan
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-6">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-gray-900">
                                            {
                                                organizationStats.current_employees
                                            }
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Employees
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-gray-900">
                                            {organizationStats.max_employees ===
                                            -1
                                                ? "∞"
                                                : organizationStats.max_employees}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Max Allowed
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-gray-900">
                                            {organizationStats.remaining_slots ===
                                            -1
                                                ? "∞"
                                                : organizationStats.remaining_slots}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Slots Left
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            {organizationStats.max_employees !== -1 && (
                                <div className="mt-4">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-600">
                                            Employee Usage
                                        </span>
                                        <span
                                            className={`font-medium ${
                                                employeeUsagePercentage >= 90
                                                    ? "text-red-600"
                                                    : employeeUsagePercentage >=
                                                      75
                                                    ? "text-yellow-600"
                                                    : "text-green-600"
                                            }`}
                                        >
                                            {employeeUsagePercentage}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full transition-all duration-300 ${
                                                employeeUsagePercentage >= 90
                                                    ? "bg-red-500"
                                                    : employeeUsagePercentage >=
                                                      75
                                                    ? "bg-yellow-500"
                                                    : "bg-green-500"
                                            }`}
                                            style={{
                                                width: `${Math.min(
                                                    employeeUsagePercentage,
                                                    100
                                                )}%`,
                                            }}
                                        />
                                    </div>
                                    {employeeUsagePercentage >= 90 && (
                                        <div className="mt-2 flex items-center text-sm text-yellow-600">
                                            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                                            You're approaching your employee
                                            limit. Consider upgrading your plan.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

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

            {/* Delete Modal */}
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

            {/* Upgrade Modal */}
            <Modal
                show={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                title="Employee Limit Reached"
                maxWidth="md"
            >
                <div className="text-center py-4">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                        <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Upgrade Required
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                        You've reached the maximum number of employees (
                        {organizationStats?.max_employees}) for your{" "}
                        <strong>{organizationStats?.plan_name}</strong> plan.
                        Upgrade your plan to add more team members.
                    </p>
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <p className="text-sm text-gray-600">
                            <strong>Current Plan:</strong>{" "}
                            {organizationStats?.plan_name}
                            <br />
                            <strong>Employees:</strong>{" "}
                            {organizationStats?.current_employees} /{" "}
                            {organizationStats?.max_employees}
                        </p>
                    </div>
                </div>
                <div className="flex justify-end space-x-2">
                    <Button
                        variant="ghost"
                        onClick={() => setShowUpgradeModal(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => {
                            setShowUpgradeModal(false);
                            // Navigate to billing/upgrade page
                            router.visit(route("billing.index"));
                        }}
                    >
                        <ChartBarIcon className="h-4 w-4 mr-2" />
                        Upgrade Plan
                    </Button>
                </div>
            </Modal>

            {/* Department Management Modal */}
            <Modal
                show={showDepartmentModal}
                onClose={() => setShowDepartmentModal(false)}
                maxWidth="md"
            >
                <div className="p-6">
                    <div className="flex items-center mb-4">
                        <div className="p-2 bg-indigo-100 rounded-full mr-3">
                            <BuildingOffice2Icon className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                Manage Teams
                            </h3>
                            <p className="text-sm text-gray-500">
                                {selectedUser?.name}
                            </p>
                        </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-4">
                        Select the departments/teams this user belongs to. Users
                        can be members of multiple teams.
                    </p>

                    {departments && departments.length > 0 ? (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {departments.map((dept) => (
                                <label
                                    key={dept.id}
                                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                                        selectedDepartments.includes(dept.id)
                                            ? "border-indigo-500 bg-indigo-50"
                                            : "border-gray-200 hover:bg-gray-50"
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedDepartments.includes(
                                            dept.id
                                        )}
                                        onChange={() =>
                                            toggleDepartment(dept.id)
                                        }
                                        className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                    />
                                    <div className="ml-3 flex-1">
                                        <span className="font-medium text-gray-900">
                                            {dept.name}
                                        </span>
                                        {dept.description && (
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {dept.description}
                                            </p>
                                        )}
                                    </div>
                                    {selectedDepartments.includes(dept.id) && (
                                        <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                                            Member
                                        </span>
                                    )}
                                </label>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <BuildingOffice2Icon className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                            <p>No departments/teams created yet.</p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                onClick={() =>
                                    router.visit(route("departments.create"))
                                }
                            >
                                <PlusIcon className="h-4 w-4 mr-1" />
                                Create Team
                            </Button>
                        </div>
                    )}

                    <div className="flex justify-between items-center mt-6 pt-4 border-t">
                        <span className="text-sm text-gray-500">
                            {selectedDepartments.length} team(s) selected
                        </span>
                        <div className="flex space-x-2">
                            <Button
                                variant="ghost"
                                onClick={() => setShowDepartmentModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button onClick={saveDepartments}>
                                Save Changes
                            </Button>
                        </div>
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
