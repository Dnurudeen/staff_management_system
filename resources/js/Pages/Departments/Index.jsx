import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import DataTable from "@/Components/DataTable";
import Button from "@/Components/Button";
import { PencilIcon, TrashIcon, PlusIcon } from "@heroicons/react/24/outline";

export default function Index({ auth, departments }) {
    const columns = [
        { key: "name", label: "Name", sortable: true },
        { key: "description", label: "Description", sortable: false },
        {
            key: "head",
            label: "Department Head",
            sortable: false,
            render: (value) => (value ? value.name : "-"),
        },
        {
            key: "users_count",
            label: "Staff Count",
            sortable: true,
            render: (value) => value || 0,
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
                            : "bg-gray-100 text-gray-800"
                    }`}
                >
                    {value.toUpperCase()}
                </span>
            ),
        },
    ];

    const actions = (row) => (
        <div className="flex items-center justify-end space-x-2">
            <Button
                variant="outline"
                size="sm"
                onClick={() => router.visit(route("departments.edit", row.id))}
            >
                <PencilIcon className="h-4 w-4" />
            </Button>
            {row.users_count === 0 && (
                <Button
                    variant="danger"
                    size="sm"
                    onClick={() =>
                        router.delete(route("departments.destroy", row.id))
                    }
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
                        Departments
                    </h2>
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
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <DataTable
                            columns={columns}
                            data={departments.data}
                            pagination={departments}
                            actions={actions}
                        />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
