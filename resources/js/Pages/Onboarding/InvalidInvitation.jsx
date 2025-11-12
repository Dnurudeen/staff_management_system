import GuestLayout from "@/Layouts/GuestLayout";
import { Head } from "@inertiajs/react";
import {
    ExclamationTriangleIcon,
    ClockIcon,
    XCircleIcon,
} from "@heroicons/react/24/outline";

export default function InvalidInvitation({ message }) {
    const isExpired = message.includes("expired");

    return (
        <GuestLayout>
            <Head title="Invalid Invitation" />

            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    <div className="text-center">
                        {isExpired ? (
                            <ClockIcon className="mx-auto h-16 w-16 text-orange-500" />
                        ) : (
                            <XCircleIcon className="mx-auto h-16 w-16 text-red-500" />
                        )}
                        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                            {isExpired
                                ? "Invitation Expired"
                                : "Invalid Invitation"}
                        </h2>
                        <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-yellow-700">
                                        {message}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6">
                            <a
                                href={route("login")}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Go to Login
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
