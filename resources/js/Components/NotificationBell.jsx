import { useState, useEffect, Fragment, useRef } from "react";
import { router } from "@inertiajs/react";
import { Menu, Transition } from "@headlessui/react";
import {
    BellIcon,
    XMarkIcon,
    CheckIcon,
    TrashIcon,
    CalendarIcon,
    ClipboardDocumentCheckIcon,
    UserGroupIcon,
    ClockIcon,
    ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { BellIcon as BellIconSolid } from "@heroicons/react/24/solid";
import axios from "axios";

export default function NotificationBell() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const notificationsRef = useRef(null);

    // Fetch notifications
    const fetchNotifications = async (pageNum = 1, append = false) => {
        try {
            setLoading(true);
            const response = await axios.get(`/notifications?page=${pageNum}`);
            const data = response.data;

            if (append) {
                setNotifications((prev) => [...prev, ...data.data]);
            } else {
                setNotifications(data.data);
            }

            setHasMore(data.current_page < data.last_page);
            setPage(data.current_page);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch unread count
    const fetchUnreadCount = async () => {
        try {
            const response = await axios.get("/notifications/unread-count");
            setUnreadCount(response.data.count);
        } catch (error) {
            console.error("Failed to fetch unread count:", error);
        }
    };

    // Mark notification as read
    const markAsRead = async (notificationId) => {
        try {
            await axios.post(`/notifications/${notificationId}/read`);
            setNotifications((prev) =>
                prev.map((n) =>
                    n.id === notificationId ? { ...n, read_at: new Date() } : n
                )
            );
            fetchUnreadCount();
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        try {
            await axios.post("/notifications/mark-all-read");
            setNotifications((prev) =>
                prev.map((n) => ({ ...n, read_at: new Date() }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to mark all as read:", error);
        }
    };

    // Delete notification
    const deleteNotification = async (notificationId) => {
        try {
            await axios.delete(`/notifications/${notificationId}`);
            setNotifications((prev) =>
                prev.filter((n) => n.id !== notificationId)
            );
            fetchUnreadCount();
        } catch (error) {
            console.error("Failed to delete notification:", error);
        }
    };

    // Load more notifications
    const loadMore = () => {
        if (!loading && hasMore) {
            fetchNotifications(page + 1, true);
        }
    };

    // Get notification icon based on type
    const getNotificationIcon = (type) => {
        switch (type) {
            case "meeting":
                return <CalendarIcon className="h-5 w-5 text-blue-500" />;
            case "task":
                return (
                    <ClipboardDocumentCheckIcon className="h-5 w-5 text-green-500" />
                );
            case "leave":
                return <ClockIcon className="h-5 w-5 text-orange-500" />;
            case "attendance":
                return <UserGroupIcon className="h-5 w-5 text-purple-500" />;
            default:
                return (
                    <ExclamationCircleIcon className="h-5 w-5 text-gray-500" />
                );
        }
    };

    // Handle notification click
    const handleNotificationClick = (notification) => {
        if (!notification.read_at) {
            markAsRead(notification.id);
        }

        // Navigate to relevant page based on type and data
        if (notification.data?.url) {
            router.visit(notification.data.url);
        } else if (
            notification.type === "meeting" &&
            notification.data?.meeting_id
        ) {
            router.visit("/meetings");
        } else if (notification.type === "task" && notification.data?.task_id) {
            router.visit("/tasks");
        } else if (
            notification.type === "leave" &&
            notification.data?.leave_request_id
        ) {
            router.visit("/leave-requests");
        }
    };

    // Format relative time
    const formatRelativeTime = (date) => {
        const now = new Date();
        const notificationDate = new Date(date);
        const diffInSeconds = Math.floor((now - notificationDate) / 1000);

        if (diffInSeconds < 60) return "Just now";
        if (diffInSeconds < 3600)
            return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400)
            return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800)
            return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return notificationDate.toLocaleDateString();
    };

    // Initial fetch
    useEffect(() => {
        fetchNotifications();
        fetchUnreadCount();

        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchUnreadCount, 30000);

        // Listen for real-time notifications via Laravel Echo
        if (window.Echo) {
            window.Echo.private(`users.${window.Laravel?.user?.id}`).listen(
                ".notification.created",
                (event) => {
                    // Add new notification to the list
                    setNotifications((prev) => [event.notification, ...prev]);
                    setUnreadCount((prev) => prev + 1);

                    // Optional: Show browser notification
                    if (Notification.permission === "granted") {
                        new Notification(event.notification.title, {
                            body: event.notification.message,
                            icon: "/favicon.ico",
                        });
                    }
                }
            );
        }

        // Request notification permission
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }

        return () => {
            clearInterval(interval);
            if (window.Echo) {
                window.Echo.leave(`users.${window.Laravel?.user?.id}`);
            }
        };
    }, []);

    return (
        <Menu as="div" className="relative">
            <Menu.Button className="relative rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                <span className="sr-only">View notifications</span>
                {unreadCount > 0 ? (
                    <BellIconSolid className="h-6 w-6 text-indigo-600" />
                ) : (
                    <BellIcon className="h-6 w-6" />
                )}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white ring-2 ring-white">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </Menu.Button>

            <Transition
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-150"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
            >
                <Menu.Items className="absolute right-0 z-50 mt-2 w-96 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Notifications
                        </h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div
                        ref={notificationsRef}
                        className="max-h-[32rem] overflow-y-auto"
                    >
                        {notifications.length === 0 ? (
                            <div className="px-4 py-12 text-center">
                                <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">
                                    No notifications
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    You're all caught up!
                                </p>
                            </div>
                        ) : (
                            <>
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`relative border-b border-gray-100 transition hover:bg-gray-50 ${
                                            !notification.read_at
                                                ? "bg-indigo-50"
                                                : ""
                                        }`}
                                    >
                                        <div
                                            onClick={() =>
                                                handleNotificationClick(
                                                    notification
                                                )
                                            }
                                            className="cursor-pointer px-4 py-3"
                                        >
                                            <div className="flex items-start space-x-3">
                                                {/* Icon */}
                                                <div className="flex-shrink-0 pt-0.5">
                                                    {getNotificationIcon(
                                                        notification.type
                                                    )}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {notification.title}
                                                    </p>
                                                    <p className="mt-0.5 text-sm text-gray-600 line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        {formatRelativeTime(
                                                            notification.created_at
                                                        )}
                                                    </p>
                                                </div>

                                                {/* Unread indicator */}
                                                {!notification.read_at && (
                                                    <div className="flex-shrink-0">
                                                        <span className="block h-2 w-2 rounded-full bg-indigo-600"></span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="absolute right-2 top-2 flex space-x-1">
                                            {!notification.read_at && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        markAsRead(
                                                            notification.id
                                                        );
                                                    }}
                                                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                                    title="Mark as read"
                                                >
                                                    <CheckIcon className="h-4 w-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteNotification(
                                                        notification.id
                                                    );
                                                }}
                                                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                                                title="Delete"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {/* Load More */}
                                {hasMore && (
                                    <div className="px-4 py-3 text-center">
                                        <button
                                            onClick={loadMore}
                                            disabled={loading}
                                            className="text-sm font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
                                        >
                                            {loading
                                                ? "Loading..."
                                                : "Load more"}
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="border-t border-gray-200 px-4 py-3 text-center">
                            <button
                                onClick={() => router.visit("/notifications")}
                                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                            >
                                View all notifications
                            </button>
                        </div>
                    )}
                </Menu.Items>
            </Transition>
        </Menu>
    );
}
