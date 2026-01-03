import { useState, useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, usePage, router } from "@inertiajs/react";
import Button from "@/Components/Button";
import FileUpload from "@/Components/FileUpload";
import Toast from "@/Components/Toast";
import LoadingSpinner from "@/Components/LoadingSpinner";
import {
    CheckCircleIcon,
    XCircleIcon,
    ExclamationTriangleIcon,
    EnvelopeIcon,
    UserPlusIcon,
} from "@heroicons/react/24/outline";

export default function CreateEdit({
    auth,
    user,
    departments,
    organizationStats,
}) {
    const { flash } = usePage().props;
    const isEdit = !!user;
    const { data, setData, post, put, processing, errors, reset } = useForm({
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

    const [inviteStatus, setInviteStatus] = useState({
        show: false,
        success: false,
        email: "",
        message: "",
        details: null,
    });

    // Handle flash messages from server redirect
    useEffect(() => {
        if (flash?.success && flash?.invited_email) {
            setInviteStatus({
                show: true,
                success: true,
                email: flash.invited_email,
                message: "Invitation sent successfully!",
                details: `An invitation email has been sent to ${flash.invited_email}. They will receive a link to complete their onboarding.`,
            });
        } else if (flash?.error && flash?.invited_email) {
            setInviteStatus({
                show: true,
                success: false,
                email: flash.invited_email,
                message: "Failed to send invitation",
                details: flash.error_details || flash.error,
            });
        }
    }, [flash]);

    // Check if organization can add more employees
    const canAddEmployee = organizationStats?.can_add_employee ?? true;
    const remainingSlots = organizationStats?.remaining_slots ?? -1;

    const handleSubmit = (e) => {
        e.preventDefault();

        // Check employee limit before submitting invitation
        if (!isEdit && !canAddEmployee) {
            setInviteStatus({
                show: true,
                success: false,
                email: data.email,
                message: "Employee limit reached",
                details: `Your ${
                    organizationStats?.plan_name || "current"
                } plan allows a maximum of ${
                    organizationStats?.max_employees
                } employees. Please upgrade your plan to add more team members.`,
            });
            return;
        }

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
                onError: (errors) => {
                    const errorMessage =
                        Object.values(errors)[0] || "Failed to update user!";
                    setToast({
                        show: true,
                        message: errorMessage,
                        type: "error",
                    });
                },
            });
        } else {
            // Invitation mode - only send email, role, and department_id
            const invitedEmail = data.email;

            post(route("users.store"), {
                onSuccess: (page) => {
                    // Show success status
                    setInviteStatus({
                        show: true,
                        success: true,
                        email: invitedEmail,
                        message: "Invitation sent successfully!",
                        details: `An invitation email has been sent to ${invitedEmail}. They will receive a link to complete their onboarding.`,
                    });
                    // Reset form
                    reset();
                },
                onError: (errors) => {
                    // Determine error type and show appropriate message
                    let errorMessage = "Failed to send invitation";
                    let errorDetails =
                        "An unexpected error occurred. Please try again.";

                    if (errors.email) {
                        if (
                            errors.email.includes("taken") ||
                            errors.email.includes("unique")
                        ) {
                            errorMessage = "Email already registered";
                            errorDetails = `The email address ${invitedEmail} is already associated with an existing user or pending invitation.`;
                        } else {
                            errorMessage = "Invalid email address";
                            errorDetails = errors.email;
                        }
                    } else if (errors.organization) {
                        errorMessage = "Organization limit reached";
                        errorDetails = errors.organization;
                    } else if (errors.role) {
                        errorMessage = "Invalid role selection";
                        errorDetails = errors.role;
                    } else if (Object.keys(errors).length > 0) {
                        errorDetails = Object.values(errors).join(". ");
                    }

                    setInviteStatus({
                        show: true,
                        success: false,
                        email: invitedEmail,
                        message: errorMessage,
                        details: errorDetails,
                    });
                },
            });
        }
    };

    const handleInviteAnother = () => {
        setInviteStatus({
            show: false,
            success: false,
            email: "",
            message: "",
            details: null,
        });
        reset();
    };

    const handleGoToUsers = () => {
        router.visit(route("users.index"));
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
                        {/* Invitation Status Card */}
                        {!isEdit && inviteStatus.show ? (
                            <div className="text-center py-8">
                                {inviteStatus.success ? (
                                    <>
                                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                                            <CheckCircleIcon className="h-10 w-10 text-green-600" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                            {inviteStatus.message}
                                        </h3>
                                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                            {inviteStatus.details}
                                        </p>
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 max-w-md mx-auto">
                                            <div className="flex items-center justify-center space-x-2">
                                                <EnvelopeIcon className="h-5 w-5 text-green-600" />
                                                <span className="text-green-800 font-medium">
                                                    {inviteStatus.email}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-center space-x-4">
                                            <Button
                                                variant="outline"
                                                onClick={handleGoToUsers}
                                            >
                                                Back to Users
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() =>
                                                    router.visit(
                                                        route(
                                                            "invitations.index"
                                                        )
                                                    )
                                                }
                                            >
                                                <EnvelopeIcon className="h-5 w-5 mr-2" />
                                                View Invitations
                                            </Button>
                                            <Button
                                                onClick={handleInviteAnother}
                                            >
                                                <UserPlusIcon className="h-5 w-5 mr-2" />
                                                Invite Another User
                                            </Button>
                                        </div>
                                        {remainingSlots !== -1 &&
                                            remainingSlots > 0 && (
                                                <p className="text-sm text-gray-500 mt-4">
                                                    You have{" "}
                                                    {remainingSlots - 1}{" "}
                                                    employee slot
                                                    {remainingSlots - 1 !== 1
                                                        ? "s"
                                                        : ""}{" "}
                                                    remaining.
                                                </p>
                                            )}
                                    </>
                                ) : (
                                    <>
                                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                                            <XCircleIcon className="h-10 w-10 text-red-600" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                            {inviteStatus.message}
                                        </h3>
                                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                            {inviteStatus.details}
                                        </p>
                                        {inviteStatus.email && (
                                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 max-w-md mx-auto">
                                                <div className="flex items-center justify-center space-x-2">
                                                    <EnvelopeIcon className="h-5 w-5 text-red-600" />
                                                    <span className="text-red-800 font-medium">
                                                        {inviteStatus.email}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex items-center justify-center space-x-4">
                                            <Button
                                                variant="outline"
                                                onClick={handleGoToUsers}
                                            >
                                                Back to Users
                                            </Button>
                                            <Button
                                                onClick={handleInviteAnother}
                                            >
                                                Try Again
                                            </Button>
                                        </div>
                                        {inviteStatus.message ===
                                            "Employee limit reached" && (
                                            <div className="mt-6">
                                                <Button
                                                    variant="primary"
                                                    onClick={() =>
                                                        router.visit(
                                                            route(
                                                                "billing.index"
                                                            )
                                                        )
                                                    }
                                                    className="bg-gradient-to-r from-indigo-600 to-purple-600"
                                                >
                                                    Upgrade Plan
                                                </Button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        ) : processing ? (
                            <div className="py-12">
                                <LoadingSpinner
                                    size="lg"
                                    text="Invitation in process..."
                                />
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {!isEdit ? (
                                    // INVITATION MODE - Simple form
                                    <>
                                        {/* Employee Limit Warning */}
                                        {!canAddEmployee && (
                                            <div className="bg-red-50 border-l-4 border-red-400 p-4">
                                                <div className="flex">
                                                    <div className="flex-shrink-0">
                                                        <XCircleIcon className="h-5 w-5 text-red-400" />
                                                    </div>
                                                    <div className="ml-3">
                                                        <p className="text-sm text-red-700">
                                                            <strong>
                                                                Employee limit
                                                                reached!
                                                            </strong>{" "}
                                                            Your{" "}
                                                            {
                                                                organizationStats?.plan_name
                                                            }{" "}
                                                            plan allows a
                                                            maximum of{" "}
                                                            {
                                                                organizationStats?.max_employees
                                                            }{" "}
                                                            employees.
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    router.visit(
                                                                        route(
                                                                            "billing.index"
                                                                        )
                                                                    )
                                                                }
                                                                className="underline font-medium hover:text-red-800 ml-1"
                                                            >
                                                                Upgrade your
                                                                plan
                                                            </button>{" "}
                                                            to add more team
                                                            members.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Low slots warning */}
                                        {canAddEmployee &&
                                            remainingSlots !== -1 &&
                                            remainingSlots <= 3 &&
                                            remainingSlots > 0 && (
                                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                                                    <div className="flex">
                                                        <div className="flex-shrink-0">
                                                            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                                                        </div>
                                                        <div className="ml-3">
                                                            <p className="text-sm text-yellow-700">
                                                                <strong>
                                                                    Running low
                                                                    on employee
                                                                    slots!
                                                                </strong>{" "}
                                                                You have only{" "}
                                                                {remainingSlots}{" "}
                                                                slot
                                                                {remainingSlots !==
                                                                1
                                                                    ? "s"
                                                                    : ""}{" "}
                                                                remaining on
                                                                your{" "}
                                                                {
                                                                    organizationStats?.plan_name
                                                                }{" "}
                                                                plan.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

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
                                    <Button
                                        type="submit"
                                        disabled={
                                            processing ||
                                            (!isEdit && remainingSlots === 0)
                                        }
                                        className={
                                            !isEdit && remainingSlots === 0
                                                ? "opacity-50 cursor-not-allowed"
                                                : ""
                                        }
                                    >
                                        {processing ? (
                                            <>
                                                <svg
                                                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline"
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
                                                    : "Sending..."}
                                            </>
                                        ) : isEdit ? (
                                            "Update User"
                                        ) : (
                                            "Send Invitation"
                                        )}
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
