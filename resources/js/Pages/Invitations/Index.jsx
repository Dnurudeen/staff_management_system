import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, router, usePage } from "@inertiajs/react";
import Button from "@/Components/Button";
import Pagination from "@/Components/Pagination";
import Toast from "@/Components/Toast";
import {
    EnvelopeIcon,
    ArrowPathIcon,
    XMarkIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    ExclamationTriangleIcon,
    UserPlusIcon,
    FunnelIcon,
} from "@heroicons/react/24/outline";

export default function Index({ auth, invitations, filters, counts }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState(filters.search || "");
    const [processing, setProcessing] = useState(null);
    const [toast, setToast] = useState({
        show: !!flash?.success || !!flash?.error,
        message: flash?.success || flash?.error || "",
        type: flash?.success ? "success" : "error",
    });

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(
            route("invitations.index"),
            { search, status: filters.status },
            { preserveState: true }
        );
    };

    const handleFilterChange = (status) => {
        router.get(
            route("invitations.index"),
            { status, search: filters.search },
            { preserveState: true }
        );
    };

    const handleResend = (invitation) => {
        if (processing) return;
        setProcessing(invitation.id);

        router.post(
            route("invitations.resend", invitation.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setToast({
                        show: true,
                        message: `Invitation resent to ${invitation.email}`,
                        type: "success",
                    });
                },
                onError: () => {
                    setToast({
                        show: true,
                        message: "Failed to resend invitation",
                        type: "error",
                    });
                },
                onFinish: () => setProcessing(null),
            }
        );
    };

    const handleCancel = (invitation) => {
        if (processing) return;
        if (
            !confirm(
                `Are you sure you want to cancel the invitation for ${invitation.email}?`
            )
        ) {
            return;
        }

        setProcessing(invitation.id);
        router.post(
            route("invitations.cancel", invitation.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setToast({
                        show: true,
                        message: "Invitation cancelled",
                        type: "success",
                    });
                },
                onError: () => {
                    setToast({
                        show: true,
                        message: "Failed to cancel invitation",
                        type: "error",
                    });
                },
                onFinish: () => setProcessing(null),
            }
        );
    };

    const handleDelete = (invitation) => {
        if (processing) return;
        if (
            !confirm(
                `Are you sure you want to permanently delete this invitation record?`
            )
        ) {
            return;
        }

        setProcessing(invitation.id);
        router.delete(route("invitations.destroy", invitation.id), {
            preserveScroll: true,
            onSuccess: () => {
                setToast({
                    show: true,
                    message: "Invitation deleted",
                    type: "success",
                });
            },
            onError: () => {
                setToast({
                    show: true,
                    message: "Failed to delete invitation",
                    type: "error",
                });
            },
            onFinish: () => setProcessing(null),
        });
    };

    const getStatusBadge = (invitation) => {
        if (invitation.status === "accepted") {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircleIcon className="w-3.5 h-3.5 mr-1" />
                    Accepted
                </span>
            );
        }
        if (invitation.status === "cancelled") {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    <XCircleIcon className="w-3.5 h-3.5 mr-1" />
                    Cancelled
                </span>
            );
        }
        if (invitation.is_expired) {
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <ExclamationTriangleIcon className="w-3.5 h-3.5 mr-1" />
                    Expired
                </span>
            );
        }
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                <ClockIcon className="w-3.5 h-3.5 mr-1" />
                Pending
            </span>
        );
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const filterTabs = [
        { key: "all", label: "All", count: counts.all },
        { key: "pending", label: "Pending", count: counts.pending },
        { key: "accepted", label: "Accepted", count: counts.accepted },
        { key: "expired", label: "Expired", count: counts.expired },
        { key: "cancelled", label: "Cancelled", count: counts.cancelled },
    ];

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Pending Invitations
                    </h2>
                    <Link href={route("users.create")}>
                        <Button>
                            <UserPlusIcon className="w-4 h-4 mr-2" />
                            Invite User
                        </Button>
                    </Link>
                </div>
            }
        >
            <Head title="Invitations" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        {/* Filter Tabs */}
                        <div className="border-b border-gray-200">
                            <nav className="flex -mb-px overflow-x-auto">
                                {filterTabs.map((tab) => (
                                    <button
                                        key={tab.key}
                                        onClick={() =>
                                            handleFilterChange(tab.key)
                                        }
                                        className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-colors ${
                                            filters.status === tab.key ||
                                            (tab.key === "all" &&
                                                !filters.status)
                                                ? "border-indigo-500 text-indigo-600"
                                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                        }`}
                                    >
                                        {tab.label}
                                        <span
                                            className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                                                filters.status === tab.key ||
                                                (tab.key === "all" &&
                                                    !filters.status)
                                                    ? "bg-indigo-100 text-indigo-600"
                                                    : "bg-gray-100 text-gray-600"
                                            }`}
                                        >
                                            {tab.count}
                                        </span>
                                    </button>
                                ))}
                            </nav>
                        </div>

                        {/* Search Bar */}
                        <div className="p-4 border-b border-gray-200">
                            <form
                                onSubmit={handleSearch}
                                className="flex gap-2"
                            >
                                <div className="relative flex-1 max-w-md">
                                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                        placeholder="Search by email..."
                                        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                <Button type="submit" variant="outline">
                                    Search
                                </Button>
                            </form>
                        </div>

                        {/* Invitations List */}
                        <div className="divide-y divide-gray-200">
                            {invitations.data.length === 0 ? (
                                <div className="p-12 text-center">
                                    <EnvelopeIcon className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-4 text-lg font-medium text-gray-900">
                                        No invitations found
                                    </h3>
                                    <p className="mt-2 text-sm text-gray-500">
                                        {filters.status &&
                                        filters.status !== "all"
                                            ? `No ${filters.status} invitations.`
                                            : "You haven't sent any invitations yet."}
                                    </p>
                                    <div className="mt-6">
                                        <Link href={route("users.create")}>
                                            <Button>
                                                <UserPlusIcon className="w-4 h-4 mr-2" />
                                                Invite Your First User
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                invitations.data.map((invitation) => (
                                    <div
                                        key={invitation.id}
                                        className="p-4 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-shrink-0">
                                                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                                            <EnvelopeIcon className="h-5 w-5 text-indigo-600" />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {invitation.email}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-xs text-gray-500 capitalize">
                                                                {
                                                                    invitation.role
                                                                }
                                                            </span>
                                                            {invitation.department && (
                                                                <>
                                                                    <span className="text-gray-300">
                                                                        •
                                                                    </span>
                                                                    <span className="text-xs text-gray-500">
                                                                        {
                                                                            invitation
                                                                                .department
                                                                                .name
                                                                        }
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 ml-4">
                                                {/* Status Badge */}
                                                <div className="hidden sm:block">
                                                    {getStatusBadge(invitation)}
                                                </div>

                                                {/* Dates */}
                                                <div className="hidden md:block text-right">
                                                    <p className="text-xs text-gray-500">
                                                        Sent:{" "}
                                                        {formatDate(
                                                            invitation.created_at
                                                        )}
                                                    </p>
                                                    {invitation.is_pending && (
                                                        <p className="text-xs text-gray-500">
                                                            Expires in{" "}
                                                            {
                                                                invitation.days_until_expiry
                                                            }{" "}
                                                            day
                                                            {invitation.days_until_expiry !==
                                                            1
                                                                ? "s"
                                                                : ""}
                                                        </p>
                                                    )}
                                                    {invitation.is_expired && (
                                                        <p className="text-xs text-red-500">
                                                            Expired:{" "}
                                                            {formatDate(
                                                                invitation.expires_at
                                                            )}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-2">
                                                    {invitation.is_pending && (
                                                        <>
                                                            <button
                                                                onClick={() =>
                                                                    handleResend(
                                                                        invitation
                                                                    )
                                                                }
                                                                disabled={
                                                                    processing ===
                                                                    invitation.id
                                                                }
                                                                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
                                                                title="Resend invitation"
                                                            >
                                                                <ArrowPathIcon
                                                                    className={`w-5 h-5 ${
                                                                        processing ===
                                                                        invitation.id
                                                                            ? "animate-spin"
                                                                            : ""
                                                                    }`}
                                                                />
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    handleCancel(
                                                                        invitation
                                                                    )
                                                                }
                                                                disabled={
                                                                    processing ===
                                                                    invitation.id
                                                                }
                                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                                title="Cancel invitation"
                                                            >
                                                                <XMarkIcon className="w-5 h-5" />
                                                            </button>
                                                        </>
                                                    )}
                                                    {invitation.is_expired && (
                                                        <button
                                                            onClick={() =>
                                                                handleResend(
                                                                    invitation
                                                                )
                                                            }
                                                            disabled={
                                                                processing ===
                                                                invitation.id
                                                            }
                                                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
                                                            title="Resend invitation"
                                                        >
                                                            <ArrowPathIcon
                                                                className={`w-5 h-5 ${
                                                                    processing ===
                                                                    invitation.id
                                                                        ? "animate-spin"
                                                                        : ""
                                                                }`}
                                                            />
                                                        </button>
                                                    )}
                                                    {(invitation.status ===
                                                        "cancelled" ||
                                                        invitation.status ===
                                                            "accepted" ||
                                                        invitation.is_expired) && (
                                                        <button
                                                            onClick={() =>
                                                                handleDelete(
                                                                    invitation
                                                                )
                                                            }
                                                            disabled={
                                                                processing ===
                                                                invitation.id
                                                            }
                                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                            title="Delete invitation"
                                                        >
                                                            <TrashIcon className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Mobile Status */}
                                        <div className="mt-2 flex items-center gap-2 sm:hidden">
                                            {getStatusBadge(invitation)}
                                            <span className="text-xs text-gray-500">
                                                {formatDate(
                                                    invitation.created_at
                                                )}
                                            </span>
                                        </div>

                                        {/* Invited By */}
                                        {invitation.inviter && (
                                            <p className="mt-2 text-xs text-gray-400 ml-13">
                                                Invited by{" "}
                                                {invitation.inviter.name}
                                            </p>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Pagination */}
                        {invitations.data.length > 0 && (
                            <div className="px-4 py-3 border-t border-gray-200">
                                <Pagination links={invitations.links} />
                            </div>
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
