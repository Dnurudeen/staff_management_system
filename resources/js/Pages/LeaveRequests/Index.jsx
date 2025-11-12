import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, router } from "@inertiajs/react";
import Button from "@/Components/Button";
import DataTable from "@/Components/DataTable";
import Modal from "@/Components/Modal";
import { PlusIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";

export default function Index({ auth, leaveRequests }) {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const { data, setData, post, reset, processing, errors } = useForm({
        leave_type: "sick",
        start_date: "",
        end_date: "",
        reason: "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("leave-requests.store"), {
            onSuccess: () => {
                reset();
                setShowCreateModal(false);
            },
        });
    };

    const handleApprove = (id) => {
        router.post(route("leave-requests.approve", id));
    };

    const handleReject = (id) => {
        router.post(route("leave-requests.reject", id));
    };

    const columns = [
        {
            key: "user",
            label: "Employee",
            render: (value) => value.name,
        },
        {
            key: "leave_type",
            label: "Type",
            render: (value) => (
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {value.replace("_", " ").toUpperCase()}
                </span>
            ),
        },
        {
            key: "start_date",
            label: "Start Date",
            render: (value) => new Date(value).toLocaleDateString(),
        },
        {
            key: "end_date",
            label: "End Date",
            render: (value) => new Date(value).toLocaleDateString(),
        },
        {
            key: "total_days",
            label: "Days",
        },
        {
            key: "status",
            label: "Status",
            render: (value) => (
                <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        value === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : value === "approved"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                    }`}
                >
                    {value.toUpperCase()}
                </span>
            ),
        },
    ];

    const actions = (row) => {
        if (auth.user.role !== "staff" && row.status === "pending") {
            return (
                <div className="flex items-center justify-end space-x-2">
                    <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleApprove(row.id)}
                    >
                        <CheckIcon className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleReject(row.id)}
                    >
                        <XMarkIcon className="h-4 w-4" />
                    </Button>
                </div>
            );
        }
        return null;
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Leave Requests
                    </h2>
                    <Button onClick={() => setShowCreateModal(true)}>
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Request Leave
                    </Button>
                </div>
            }
        >
            <Head title="Leave Requests" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <DataTable
                            columns={columns}
                            data={leaveRequests.data}
                            pagination={leaveRequests}
                            actions={actions}
                        />
                    </div>
                </div>
            </div>

            <Modal
                show={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Request Leave"
                maxWidth="md"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Leave Type *
                        </label>
                        <select
                            value={data.leave_type}
                            onChange={(e) =>
                                setData("leave_type", e.target.value)
                            }
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            required
                        >
                            <option value="sick">Sick Leave</option>
                            <option value="casual">Casual Leave</option>
                            <option value="annual">Annual Leave</option>
                            <option value="maternity">Maternity Leave</option>
                            <option value="paternity">Paternity Leave</option>
                            <option value="unpaid">Unpaid Leave</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Start Date *
                        </label>
                        <input
                            type="date"
                            value={data.start_date}
                            onChange={(e) =>
                                setData("start_date", e.target.value)
                            }
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            End Date *
                        </label>
                        <input
                            type="date"
                            value={data.end_date}
                            onChange={(e) =>
                                setData("end_date", e.target.value)
                            }
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Reason *
                        </label>
                        <textarea
                            value={data.reason}
                            onChange={(e) => setData("reason", e.target.value)}
                            rows={4}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            required
                        />
                        {errors.reason && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.reason}
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end space-x-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setShowCreateModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            Submit Request
                        </Button>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
