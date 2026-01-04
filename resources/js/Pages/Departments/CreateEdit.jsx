import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, router } from "@inertiajs/react";
import Button from "@/Components/Button";
import Toast from "@/Components/Toast";
import AIDescriptionField from "@/Components/AIDescriptionField";
import {
    BuildingOffice2Icon,
    UserGroupIcon,
    CheckCircleIcon,
} from "@heroicons/react/24/outline";

export default function CreateEdit({ auth, department, users }) {
    const isEdit = !!department;

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: department?.name || "",
        description: department?.description || "",
        head_id: department?.head_id || "",
        status: department?.status || "active",
    });

    const [toast, setToast] = useState({
        show: false,
        message: "",
        type: "success",
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        if (isEdit) {
            put(route("departments.update", department.id), {
                onSuccess: () => {
                    setToast({
                        show: true,
                        message: "Department/Team updated successfully!",
                        type: "success",
                    });
                },
                onError: () => {
                    setToast({
                        show: true,
                        message: "Failed to update department/team.",
                        type: "error",
                    });
                },
            });
        } else {
            post(route("departments.store"), {
                onSuccess: () => {
                    setToast({
                        show: true,
                        message: "Department/Team created successfully!",
                        type: "success",
                    });
                },
                onError: () => {
                    setToast({
                        show: true,
                        message: "Failed to create department/team.",
                        type: "error",
                    });
                },
            });
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center space-x-3">
                    <BuildingOffice2Icon className="h-6 w-6 text-gray-600" />
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        {isEdit
                            ? "Edit Department/Team"
                            : "Create Department/Team"}
                    </h2>
                </div>
            }
        >
            <Head title={isEdit ? "Edit Department" : "Create Department"} />

            <div className="py-12">
                <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            {/* Info Banner */}
                            <div className="mb-6 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                                <div className="flex items-start">
                                    <UserGroupIcon className="h-6 w-6 text-indigo-600 mr-3 mt-0.5" />
                                    <div>
                                        <h3 className="text-sm font-medium text-indigo-900">
                                            {isEdit
                                                ? "Update Department/Team"
                                                : "Create a New Department/Team"}
                                        </h3>
                                        <p className="text-sm text-indigo-700 mt-1">
                                            Departments (also known as Teams)
                                            help organize your staff into
                                            groups. You can assign a team lead
                                            and track performance by department.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Department Name */}
                                <div>
                                    <label
                                        htmlFor="name"
                                        className="block text-sm font-medium text-gray-700"
                                    >
                                        Department/Team Name{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="name"
                                        type="text"
                                        value={data.name}
                                        onChange={(e) =>
                                            setData("name", e.target.value)
                                        }
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        placeholder="e.g., Engineering, Marketing, Sales"
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
                                    type="department"
                                    label="Description"
                                    placeholder="Brief description of what this department/team does or click 'AI Suggest'..."
                                    error={errors.description}
                                    rows={4}
                                />

                                {/* Department Head */}
                                <div>
                                    <label
                                        htmlFor="head_id"
                                        className="block text-sm font-medium text-gray-700"
                                    >
                                        Department/Team Head
                                    </label>
                                    <p className="text-xs text-gray-500 mb-1">
                                        Select an employee to lead this
                                        department/team (optional)
                                    </p>
                                    <select
                                        id="head_id"
                                        value={data.head_id}
                                        onChange={(e) =>
                                            setData("head_id", e.target.value)
                                        }
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="">
                                            No Head Selected
                                        </option>
                                        {users?.map((user) => (
                                            <option
                                                key={user.id}
                                                value={user.id}
                                            >
                                                {user.name} ({user.email}) -{" "}
                                                {user.role.replace("_", " ")}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.head_id && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.head_id}
                                        </p>
                                    )}
                                </div>

                                {/* Status */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Status{" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex space-x-4">
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="status"
                                                value="active"
                                                checked={
                                                    data.status === "active"
                                                }
                                                onChange={(e) =>
                                                    setData(
                                                        "status",
                                                        e.target.value
                                                    )
                                                }
                                                className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">
                                                <span className="inline-flex items-center">
                                                    <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
                                                    Active
                                                </span>
                                            </span>
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="status"
                                                value="inactive"
                                                checked={
                                                    data.status === "inactive"
                                                }
                                                onChange={(e) =>
                                                    setData(
                                                        "status",
                                                        e.target.value
                                                    )
                                                }
                                                className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">
                                                Inactive
                                            </span>
                                        </label>
                                    </div>
                                    {errors.status && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {errors.status}
                                        </p>
                                    )}
                                </div>

                                {/* Form Actions */}
                                <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            router.visit(
                                                route("departments.index")
                                            )
                                        }
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={processing}>
                                        {processing ? (
                                            <>
                                                <svg
                                                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <circle
                                                        className="opacity-25"
                                                        cx="12"
                                                        cy="12"
                                                        r="10"
                                                        stroke="currentColor"
                                                        strokeWidth="4"
                                                    ></circle>
                                                    <path
                                                        className="opacity-75"
                                                        fill="currentColor"
                                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                    ></path>
                                                </svg>
                                                {isEdit
                                                    ? "Updating..."
                                                    : "Creating..."}
                                            </>
                                        ) : isEdit ? (
                                            "Update Department/Team"
                                        ) : (
                                            "Create Department/Team"
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ ...toast, show: false })}
            />
        </AuthenticatedLayout>
    );
}
