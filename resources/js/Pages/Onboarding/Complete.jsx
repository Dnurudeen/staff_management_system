import { useState } from "react";
import GuestLayout from "@/Layouts/GuestLayout";
import { Head, useForm } from "@inertiajs/react";
import Button from "@/Components/Button";
import LoadingSpinner from "@/Components/LoadingSpinner";
import {
    UserIcon,
    CalendarIcon,
    BanknotesIcon,
    LockClosedIcon,
    CheckCircleIcon,
} from "@heroicons/react/24/outline";

export default function Complete({ invitation, token }) {
    const { data, setData, post, processing, errors } = useForm({
        first_name: "",
        last_name: "",
        date_of_birth: "",
        bank_name: "",
        account_number: "",
        account_name: "",
        password: "",
        password_confirmation: "",
        phone: "",
    });

    const [currentStep, setCurrentStep] = useState(1);

    // Safety check for invitation data
    if (!invitation) {
        return (
            <GuestLayout>
                <Head title="Invalid Invitation" />
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            Loading...
                        </h2>
                        <p className="text-gray-600">
                            Please wait while we load your invitation.
                        </p>
                    </div>
                </div>
            </GuestLayout>
        );
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("onboarding.complete", token));
    };

    const steps = [
        { id: 1, name: "Personal Info", icon: UserIcon },
        { id: 2, name: "Bank Details", icon: BanknotesIcon },
        { id: 3, name: "Security", icon: LockClosedIcon },
    ];

    return (
        <GuestLayout>
            <Head title="Complete Onboarding" />

            <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto">
                    {/* Welcome Banner */}
                    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600">
                                <CheckCircleIcon className="h-10 w-10 text-white" />
                            </div>
                            <h2 className="mt-4 text-3xl font-extrabold text-gray-900">
                                Welcome to the Team!
                            </h2>
                            <p className="mt-2 text-lg text-gray-600">
                                You've been invited to join as{" "}
                                <span className="font-semibold text-indigo-600">
                                    {invitation?.role
                                        ? invitation.role
                                              .replace("_", " ")
                                              .toUpperCase()
                                        : "STAFF"}
                                </span>
                                {invitation?.department && (
                                    <>
                                        {" "}
                                        in the{" "}
                                        <span className="font-semibold text-indigo-600">
                                            {invitation.department.name}
                                        </span>{" "}
                                        department
                                    </>
                                )}
                            </p>
                            <div className="mt-4 inline-flex items-center px-4 py-2 bg-blue-50 rounded-full">
                                <span className="text-sm text-blue-700">
                                    📧 {invitation?.email || ""}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Step Indicator */}
                    <div className="mb-8">
                        <nav aria-label="Progress">
                            <ol className="flex items-center justify-center space-x-4">
                                {steps.map((step, index) => (
                                    <li
                                        key={step.id}
                                        className="flex items-center"
                                    >
                                        <div
                                            className={`flex items-center ${
                                                currentStep >= step.id
                                                    ? "text-indigo-600"
                                                    : "text-gray-400"
                                            }`}
                                        >
                                            <div
                                                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                                                    currentStep >= step.id
                                                        ? "border-indigo-600 bg-indigo-600"
                                                        : "border-gray-300 bg-white"
                                                }`}
                                            >
                                                <step.icon
                                                    className={`h-6 w-6 ${
                                                        currentStep >= step.id
                                                            ? "text-white"
                                                            : "text-gray-400"
                                                    }`}
                                                />
                                            </div>
                                            <span className="ml-2 text-sm font-medium hidden sm:block">
                                                {step.name}
                                            </span>
                                        </div>
                                        {index < steps.length - 1 && (
                                            <div
                                                className={`ml-4 h-0.5 w-16 ${
                                                    currentStep > step.id
                                                        ? "bg-indigo-600"
                                                        : "bg-gray-300"
                                                }`}
                                            />
                                        )}
                                    </li>
                                ))}
                            </ol>
                        </nav>
                    </div>

                    {/* Form */}
                    <div className="bg-white rounded-lg shadow-lg p-8">
                        {processing ? (
                            <div className="py-12">
                                <LoadingSpinner
                                    size="lg"
                                    text="Creating your account..."
                                />
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Step 1: Personal Information */}
                                {currentStep === 1 && (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                                Personal Information
                                            </h3>
                                        </div>

                                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    First Name *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.first_name}
                                                    onChange={(e) =>
                                                        setData(
                                                            "first_name",
                                                            e.target.value
                                                        )
                                                    }
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                    required
                                                />
                                                {errors.first_name && (
                                                    <p className="mt-1 text-sm text-red-600">
                                                        {errors.first_name}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Last Name *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.last_name}
                                                    onChange={(e) =>
                                                        setData(
                                                            "last_name",
                                                            e.target.value
                                                        )
                                                    }
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                    required
                                                />
                                                {errors.last_name && (
                                                    <p className="mt-1 text-sm text-red-600">
                                                        {errors.last_name}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Date of Birth *
                                            </label>
                                            <input
                                                type="date"
                                                value={data.date_of_birth}
                                                onChange={(e) =>
                                                    setData(
                                                        "date_of_birth",
                                                        e.target.value
                                                    )
                                                }
                                                max={
                                                    new Date()
                                                        .toISOString()
                                                        .split("T")[0]
                                                }
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                required
                                            />
                                            {errors.date_of_birth && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {errors.date_of_birth}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Phone Number (Optional)
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

                                        <div className="flex justify-end">
                                            <Button
                                                type="button"
                                                onClick={() =>
                                                    setCurrentStep(2)
                                                }
                                            >
                                                Next: Bank Details →
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Step 2: Bank Details */}
                                {currentStep === 2 && (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                                Bank Account Details
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                This information is required for
                                                payroll processing
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Bank Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={data.bank_name}
                                                onChange={(e) =>
                                                    setData(
                                                        "bank_name",
                                                        e.target.value
                                                    )
                                                }
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                placeholder="e.g., First Bank, GTBank, etc."
                                                required
                                            />
                                            {errors.bank_name && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {errors.bank_name}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Account Number *
                                            </label>
                                            <input
                                                type="text"
                                                value={data.account_number}
                                                onChange={(e) =>
                                                    setData(
                                                        "account_number",
                                                        e.target.value
                                                    )
                                                }
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                placeholder="0123456789"
                                                required
                                            />
                                            {errors.account_number && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {errors.account_number}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Account Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={data.account_name}
                                                onChange={(e) =>
                                                    setData(
                                                        "account_name",
                                                        e.target.value
                                                    )
                                                }
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                placeholder="Account name as shown in bank"
                                                required
                                            />
                                            {errors.account_name && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {errors.account_name}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex justify-between">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                onClick={() =>
                                                    setCurrentStep(1)
                                                }
                                            >
                                                ← Back
                                            </Button>
                                            <Button
                                                type="button"
                                                onClick={() =>
                                                    setCurrentStep(3)
                                                }
                                            >
                                                Next: Set Password →
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Step 3: Security */}
                                {currentStep === 3 && (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                                Set Your Password
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                Create a secure password to
                                                protect your account
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Password *
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
                                                placeholder="Minimum 8 characters"
                                                required
                                            />
                                            {errors.password && (
                                                <p className="mt-1 text-sm text-red-600">
                                                    {errors.password}
                                                </p>
                                            )}
                                            <p className="mt-1 text-xs text-gray-500">
                                                Use at least 8 characters with a
                                                mix of letters, numbers &
                                                symbols
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Confirm Password *
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
                                                placeholder="Re-enter your password"
                                                required
                                            />
                                        </div>

                                        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                                            <div className="flex">
                                                <div className="flex-shrink-0">
                                                    <CheckCircleIcon className="h-5 w-5 text-blue-400" />
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm text-blue-700">
                                                        By completing this
                                                        onboarding, you'll gain
                                                        full access to the
                                                        system and can start
                                                        collaborating with your
                                                        team!
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-between">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                onClick={() =>
                                                    setCurrentStep(2)
                                                }
                                            >
                                                ← Back
                                            </Button>
                                            <Button
                                                type="submit"
                                                disabled={processing}
                                            >
                                                Complete Onboarding
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </form>
                        )}
                    </div>

                    {/* Help Text */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Need help? Contact your administrator
                            {invitation?.inviter?.email && (
                                <>
                                    {" at "}
                                    <a
                                        href={`mailto:${invitation.inviter.email}`}
                                        className="text-indigo-600 hover:text-indigo-500"
                                    >
                                        {invitation.inviter.email}
                                    </a>
                                </>
                            )}
                        </p>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
