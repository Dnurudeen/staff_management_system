import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm } from "@inertiajs/react";
import Button from "@/Components/Button";
import FileUpload from "@/Components/FileUpload";
import Toast from "@/Components/Toast";
import LoadingSpinner from "@/Components/LoadingSpinner";

export default function CreateEdit({ auth, user, departments }) {
    const isEdit = !!user;
    const { data, setData, post, put, processing, errors } = useForm({
        // For invitation (create mode)
        email: user?.email || "",
        role: user?.role || "staff",
        department_id: user?.department_id || "",

        // For edit mode only
        name: user?.name || "",
        status: user?.status || "active",
        phone: user?.phone || "",
        bio: user?.bio || "",
        avatar: null,
        password: "",
        password_confirmation: "",
    });

    const [toast, setToast] = useState({
        show: false,
        message: "",
        type: "success",
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        if (isEdit) {
            const formData = new FormData();
            Object.keys(data).forEach((key) => {
                if (data[key] !== null && data[key] !== "") {
                    formData.append(key, data[key]);
                }
            });
            formData.append("_method", "PUT");

            post(route("users.update", user.id), {
                data: formData,
                forceFormData: true,
                onSuccess: () => {
                    setToast({
                        show: true,
                        message: "User updated successfully!",
                        type: "success",
                    });
                },
                onError: () => {
                    setToast({
                        show: true,
                        message: "Failed to update user!",
                        type: "error",
                    });
                },
            });
        } else {
            // Invitation mode - only send email, role, and department_id
            post(route("users.store"), {
                onSuccess: () => {
                    setToast({
                        show: true,
                        message: "Invitation sent successfully!",
                        type: "success",
                    });
                },
                onError: () => {
                    setToast({
                        show: true,
                        message: "Failed to send invitation!",
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
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    {isEdit ? "Edit User" : "Create User"}
                </h2>
            }
        >
            <Head title={isEdit ? "Edit User" : "Create User"} />

            <div className="py-12">
                <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        {processing ? (
                            <div className="py-12">
                                <LoadingSpinner size="lg" text="Saving..." />
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {!isEdit ? (
                                    // INVITATION MODE - Simple form
                                    <>
                                        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                                            <div className="flex">
                                                <div className="flex-shrink-0">
                                                    <svg
                                                        className="h-5 w-5 text-blue-400"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm text-blue-700">
                                                        An invitation email will
                                                        be sent to the user with
                                                        a unique link to
                                                        complete their
                                                        onboarding process.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Email Address *
                                            </label>
                                            <input
                                                type="email"
                                                value={data.email}
                                                onChange={(e) =>
                                                    setData(
                                                        "email",
                                                        e.target.value
                                                    )
                                                }
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                placeholder="user@example.com"
                                                required
                                            />
                                            {errors.email && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {errors.email}
                                                </p>
                                            )}
                                            <p className="mt-1 text-xs text-gray-500">
                                                The user will receive an
                                                invitation email at this address
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Role *
                                            </label>
                                            <select
                                                value={data.role}
                                                onChange={(e) =>
                                                    setData(
                                                        "role",
                                                        e.target.value
                                                    )
                                                }
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                required
                                            >
                                                {auth.user.role ===
                                                    "prime_admin" && (
                                                    <option value="prime_admin">
                                                        Prime Admin
                                                    </option>
                                                )}
                                                {auth.user.role ===
                                                    "prime_admin" && (
                                                    <option value="admin">
                                                        Admin
                                                    </option>
                                                )}
                                                <option value="staff">
                                                    Staff
                                                </option>
                                            </select>
                                            {errors.role && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {errors.role}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Department
                                            </label>
                                            <select
                                                value={data.department_id}
                                                onChange={(e) =>
                                                    setData(
                                                        "department_id",
                                                        e.target.value
                                                    )
                                                }
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            >
                                                <option value="">
                                                    Select Department
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

                                        <div className="bg-green-50 border-l-4 border-green-400 p-4">
                                            <div className="flex">
                                                <div className="flex-shrink-0">
                                                    <svg
                                                        className="h-5 w-5 text-green-400"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm text-green-700">
                                                        <strong>
                                                            What happens next:
                                                        </strong>
                                                    </p>
                                                    <ul className="mt-2 text-sm text-green-700 list-disc list-inside space-y-1">
                                                        <li>
                                                            User receives
                                                            invitation email
                                                        </li>
                                                        <li>
                                                            User clicks the link
                                                            to access onboarding
                                                        </li>
                                                        <li>
                                                            User completes
                                                            personal and bank
                                                            details
                                                        </li>
                                                        <li>
                                                            User sets their
                                                            password
                                                        </li>
                                                        <li>
                                                            User gains access to
                                                            the system
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    // EDIT MODE - Full form
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={data.name}
                                                onChange={(e) =>
                                                    setData(
                                                        "name",
                                                        e.target.value
                                                    )
                                                }
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                required
                                            />
                                            {errors.name && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {errors.name}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Email *
                                            </label>
                                            <input
                                                type="email"
                                                value={data.email}
                                                onChange={(e) =>
                                                    setData(
                                                        "email",
                                                        e.target.value
                                                    )
                                                }
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                required
                                            />
                                            {errors.email && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {errors.email}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Password{" "}
                                                {isEdit &&
                                                    "(Leave blank to keep current)"}
                                            </label>
                                            <input
                                                type="password"
                                                value={data.password}
                                                onChange={(e) =>
                                                    setData(
                                                        "password",
                                                        e.target.value
                                                    )
                                                }
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            />
                                            {errors.password && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {errors.password}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Confirm Password
                                            </label>
                                            <input
                                                type="password"
                                                value={
                                                    data.password_confirmation
                                                }
                                                onChange={(e) =>
                                                    setData(
                                                        "password_confirmation",
                                                        e.target.value
                                                    )
                                                }
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Role *
                                            </label>
                                            <select
                                                value={data.role}
                                                onChange={(e) =>
                                                    setData(
                                                        "role",
                                                        e.target.value
                                                    )
                                                }
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                required
                                                disabled={
                                                    user?.role === "prime_admin"
                                                }
                                            >
                                                {auth.user.role ===
                                                    "prime_admin" && (
                                                    <option value="prime_admin">
                                                        Prime Admin
                                                    </option>
                                                )}
                                                {auth.user.role ===
                                                    "prime_admin" && (
                                                    <option value="admin">
                                                        Admin
                                                    </option>
                                                )}
                                                <option value="staff">
                                                    Staff
                                                </option>
                                            </select>
                                            {errors.role && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {errors.role}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Status *
                                            </label>
                                            <select
                                                value={data.status}
                                                onChange={(e) =>
                                                    setData(
                                                        "status",
                                                        e.target.value
                                                    )
                                                }
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                required
                                            >
                                                <option value="active">
                                                    Active
                                                </option>
                                                <option value="inactive">
                                                    Inactive
                                                </option>
                                                <option value="suspended">
                                                    Suspended
                                                </option>
                                            </select>
                                            {errors.status && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {errors.status}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Department
                                            </label>
                                            <select
                                                value={data.department_id}
                                                onChange={(e) =>
                                                    setData(
                                                        "department_id",
                                                        e.target.value
                                                    )
                                                }
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            >
                                                <option value="">
                                                    Select Department
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
                                            <label className="block text-sm font-medium text-gray-700">
                                                Phone
                                            </label>
                                            <input
                                                type="tel"
                                                value={data.phone}
                                                onChange={(e) =>
                                                    setData(
                                                        "phone",
                                                        e.target.value
                                                    )
                                                }
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            />
                                            {errors.phone && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {errors.phone}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Bio
                                            </label>
                                            <textarea
                                                value={data.bio}
                                                onChange={(e) =>
                                                    setData(
                                                        "bio",
                                                        e.target.value
                                                    )
                                                }
                                                rows={4}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            />
                                            {errors.bio && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {errors.bio}
                                                </p>
                                            )}
                                        </div>

                                        <FileUpload
                                            label="Profile Picture"
                                            accept="image/*"
                                            maxSize={2097152}
                                            onFileSelect={(file) =>
                                                setData("avatar", file)
                                            }
                                        />
                                        {errors.avatar && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.avatar}
                                            </p>
                                        )}
                                    </>
                                )}

                                <div className="flex items-center justify-end space-x-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => window.history.back()}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={processing}>
                                        {isEdit
                                            ? "Update User"
                                            : "Send Invitation"}
                                    </Button>
                                </div>
                            </form>
                        )}
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
