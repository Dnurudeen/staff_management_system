import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, router } from "@inertiajs/react";
import Button from "@/Components/Button";
import Modal from "@/Components/Modal";
import DataTable from "@/Components/DataTable";
import { PlusIcon, StarIcon } from "@heroicons/react/24/solid";
import { StarIcon as StarOutlineIcon } from "@heroicons/react/24/outline";

export default function Index({ auth, reviews, users }) {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedReview, setSelectedReview] = useState(null);
    const [hoveredRating, setHoveredRating] = useState(0);

    const { data, setData, post, put, reset, processing, errors } = useForm({
        user_id: "",
        review_period: "",
        rating: 0,
        strengths: "",
        areas_for_improvement: "",
        goals: "",
        comments: "",
        status: "draft",
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        if (selectedReview) {
            put(route("performance-reviews.update", selectedReview.id), {
                onSuccess: () => {
                    reset();
                    setShowCreateModal(false);
                    setSelectedReview(null);
                },
            });
        } else {
            post(route("performance-reviews.store"), {
                onSuccess: () => {
                    reset();
                    setShowCreateModal(false);
                },
            });
        }
    };

    const handleEdit = (review) => {
        setSelectedReview(review);
        setData({
            user_id: review.user_id,
            review_period: review.review_period,
            rating: review.rating,
            strengths: review.strengths || "",
            areas_for_improvement: review.areas_for_improvement || "",
            goals: review.goals || "",
            comments: review.comments || "",
            status: review.status,
        });
        setShowCreateModal(true);
    };

    const renderStars = (rating, interactive = false, size = "md") => {
        const sizeClasses = {
            sm: "h-4 w-4",
            md: "h-6 w-6",
            lg: "h-8 w-8",
        };

        return (
            <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => {
                    const isActive = interactive
                        ? hoveredRating
                            ? star <= hoveredRating
                            : star <= rating
                        : star <= rating;

                    return interactive ? (
                        <button
                            key={star}
                            type="button"
                            onMouseEnter={() => setHoveredRating(star)}
                            onMouseLeave={() => setHoveredRating(0)}
                            onClick={() => setData("rating", star)}
                            className="focus:outline-none transition-transform hover:scale-110"
                        >
                            {isActive ? (
                                <StarIcon
                                    className={`${sizeClasses[size]} text-yellow-400`}
                                />
                            ) : (
                                <StarOutlineIcon
                                    className={`${sizeClasses[size]} text-gray-300`}
                                />
                            )}
                        </button>
                    ) : (
                        <span key={star}>
                            {isActive ? (
                                <StarIcon
                                    className={`${sizeClasses[size]} text-yellow-400`}
                                />
                            ) : (
                                <StarOutlineIcon
                                    className={`${sizeClasses[size]} text-gray-300`}
                                />
                            )}
                        </span>
                    );
                })}
            </div>
        );
    };

    const columns = [
        {
            key: "user",
            label: "Employee",
            sortable: true,
            render: (value) => (
                <div>
                    <div className="font-medium text-gray-900">
                        {value.name}
                    </div>
                    <div className="text-sm text-gray-500">{value.email}</div>
                </div>
            ),
        },
        {
            key: "reviewer",
            label: "Reviewer",
            sortable: false,
            render: (value) => (value ? value.name : "-"),
        },
        {
            key: "review_period",
            label: "Period",
            sortable: true,
        },
        {
            key: "rating",
            label: "Rating",
            sortable: true,
            render: (value) => renderStars(value, false, "sm"),
        },
        {
            key: "status",
            label: "Status",
            sortable: true,
            render: (value) => (
                <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        value === "draft"
                            ? "bg-gray-100 text-gray-800"
                            : value === "submitted"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                    }`}
                >
                    {value.toUpperCase()}
                </span>
            ),
        },
        {
            key: "reviewed_at",
            label: "Date",
            sortable: true,
            render: (value) =>
                value ? new Date(value).toLocaleDateString() : "-",
        },
    ];

    const actions = (row) => (
        <div className="flex items-center justify-end space-x-2">
            <Button variant="outline" size="sm" onClick={() => handleEdit(row)}>
                View/Edit
            </Button>
        </div>
    );

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Performance Reviews
                    </h2>
                    {auth.user.role !== "staff" && (
                        <Button onClick={() => setShowCreateModal(true)}>
                            <PlusIcon className="h-5 w-5 mr-2" />
                            Create Review
                        </Button>
                    )}
                </div>
            }
        >
            <Head title="Performance Reviews" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="text-sm text-gray-600 mb-1">
                                Total Reviews
                            </div>
                            <div className="text-3xl font-bold text-gray-900">
                                {reviews.total || 0}
                            </div>
                        </div>
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="text-sm text-gray-600 mb-1">
                                Average Rating
                            </div>
                            <div className="flex items-center">
                                <span className="text-3xl font-bold text-gray-900 mr-2">
                                    {reviews.average_rating
                                        ? reviews.average_rating.toFixed(1)
                                        : "0.0"}
                                </span>
                                <StarIcon className="h-6 w-6 text-yellow-400" />
                            </div>
                        </div>
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="text-sm text-gray-600 mb-1">
                                Pending Reviews
                            </div>
                            <div className="text-3xl font-bold text-gray-900">
                                {
                                    reviews.data.filter(
                                        (r) => r.status === "draft"
                                    ).length
                                }
                            </div>
                        </div>
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                            <div className="text-sm text-gray-600 mb-1">
                                This Quarter
                            </div>
                            <div className="text-3xl font-bold text-gray-900">
                                {
                                    reviews.data.filter((r) => {
                                        const reviewDate = new Date(
                                            r.reviewed_at || r.created_at
                                        );
                                        const quarterStart = new Date();
                                        quarterStart.setMonth(
                                            Math.floor(
                                                quarterStart.getMonth() / 3
                                            ) * 3,
                                            1
                                        );
                                        return reviewDate >= quarterStart;
                                    }).length
                                }
                            </div>
                        </div>
                    </div>

                    {/* Reviews Table */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <DataTable
                            columns={columns}
                            data={reviews.data}
                            pagination={reviews}
                            actions={actions}
                        />
                    </div>
                </div>
            </div>

            {/* Create/Edit Review Modal */}
            <Modal
                show={showCreateModal}
                onClose={() => {
                    setShowCreateModal(false);
                    setSelectedReview(null);
                    reset();
                }}
                title={
                    selectedReview
                        ? "Edit Performance Review"
                        : "Create Performance Review"
                }
                maxWidth="3xl"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Employee *
                            </label>
                            <select
                                value={data.user_id}
                                onChange={(e) =>
                                    setData("user_id", e.target.value)
                                }
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                required
                                disabled={!!selectedReview}
                            >
                                <option value="">Select Employee</option>
                                {users.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.name} -{" "}
                                        {user.department?.name ||
                                            "No Department"}
                                    </option>
                                ))}
                            </select>
                            {errors.user_id && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.user_id}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Review Period *
                            </label>
                            <input
                                type="text"
                                value={data.review_period}
                                onChange={(e) =>
                                    setData("review_period", e.target.value)
                                }
                                placeholder="Q1 2025, Jan-Mar 2025, etc."
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                required
                            />
                            {errors.review_period && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.review_period}
                                </p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Overall Rating *
                        </label>
                        <div className="flex items-center space-x-4">
                            {renderStars(data.rating, true, "lg")}
                            <span className="text-2xl font-bold text-gray-700">
                                {data.rating > 0
                                    ? `${data.rating}.0`
                                    : "Select rating"}
                            </span>
                        </div>
                        {errors.rating && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.rating}
                            </p>
                        )}
                    </div>

                    <div className="border-t pt-4">
                        <h4 className="text-md font-semibold text-gray-900 mb-4">
                            Review Details
                        </h4>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Strengths *
                                </label>
                                <p className="text-xs text-gray-500 mb-1">
                                    What does this employee do well?
                                </p>
                                <textarea
                                    value={data.strengths}
                                    onChange={(e) =>
                                        setData("strengths", e.target.value)
                                    }
                                    rows={4}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    placeholder="List the employee's key strengths and achievements..."
                                    required
                                />
                                {errors.strengths && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.strengths}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Areas for Improvement *
                                </label>
                                <p className="text-xs text-gray-500 mb-1">
                                    Where can they grow?
                                </p>
                                <textarea
                                    value={data.areas_for_improvement}
                                    onChange={(e) =>
                                        setData(
                                            "areas_for_improvement",
                                            e.target.value
                                        )
                                    }
                                    rows={4}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    placeholder="Constructive feedback and development areas..."
                                    required
                                />
                                {errors.areas_for_improvement && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.areas_for_improvement}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Goals for Next Period
                                </label>
                                <p className="text-xs text-gray-500 mb-1">
                                    What should they focus on?
                                </p>
                                <textarea
                                    value={data.goals}
                                    onChange={(e) =>
                                        setData("goals", e.target.value)
                                    }
                                    rows={4}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    placeholder="SMART goals for the next review period..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Additional Comments
                                </label>
                                <textarea
                                    value={data.comments}
                                    onChange={(e) =>
                                        setData("comments", e.target.value)
                                    }
                                    rows={3}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    placeholder="Any other feedback or notes..."
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Status
                        </label>
                        <select
                            value={data.status}
                            onChange={(e) => setData("status", e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            <option value="draft">
                                Draft (Save for later)
                            </option>
                            <option value="submitted">Submit for Review</option>
                            <option value="completed">
                                Completed (Discussed with employee)
                            </option>
                        </select>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4 border-t">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                                setShowCreateModal(false);
                                setSelectedReview(null);
                                reset();
                            }}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {selectedReview ? "Update Review" : "Create Review"}
                        </Button>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
