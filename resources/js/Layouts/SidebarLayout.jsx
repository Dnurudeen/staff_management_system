import ApplicationLogo from "@/Components/ApplicationLogo";
import Dropdown from "@/Components/Dropdown";
import Sidebar from "@/Components/Sidebar";
import { usePage } from "@inertiajs/react";
import { useState } from "react";
import { Bars3Icon, BellIcon } from "@heroicons/react/24/outline";

export default function SidebarLayout({ header, children }) {
    const { auth } = usePage().props;
    const user = auth.user;
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen overflow-hidden bg-gray-100">
            {/* Desktop Sidebar */}
            <div className="hidden md:flex md:flex-shrink-0 relative">
                <Sidebar
                    collapsed={sidebarCollapsed}
                    onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                />
            </div>

            {/* Mobile Sidebar Overlay */}
            {mobileSidebarOpen && (
                <div className="fixed inset-0 z-40 md:hidden">
                    <div
                        className="fixed inset-0 bg-gray-600 bg-opacity-75"
                        onClick={() => setMobileSidebarOpen(false)}
                    />
                    <div className="fixed inset-y-0 left-0 flex w-64 flex-col">
                        <Sidebar collapsed={false} />
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Top Navigation Bar */}
                <div className="flex h-16 flex-shrink-0 border-b border-gray-200 bg-white shadow-sm">
                    <div className="flex flex-1 justify-between px-4">
                        {/* Mobile menu button */}
                        <div className="flex items-center md:hidden">
                            <button
                                type="button"
                                className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                                onClick={() => setMobileSidebarOpen(true)}
                            >
                                <span className="sr-only">Open sidebar</span>
                                <Bars3Icon className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Header Title */}
                        <div className="flex flex-1 items-center justify-center md:justify-start">
                            {header && (
                                <h1 className="text-xl font-semibold text-gray-900">
                                    {header}
                                </h1>
                            )}
                        </div>

                        {/* Right side actions */}
                        <div className="flex items-center space-x-4">
                            {/* Notifications */}
                            <button
                                type="button"
                                className="relative rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                <span className="sr-only">
                                    View notifications
                                </span>
                                <BellIcon className="h-6 w-6" />
                                {/* Notification badge */}
                                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                            </button>

                            {/* User Menu */}
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <button className="flex items-center space-x-3 rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                                        <span className="sr-only">
                                            Open user menu
                                        </span>
                                        {user.avatar ? (
                                            <img
                                                src={`/storage/${user.avatar}`}
                                                alt={user.name}
                                                className="h-8 w-8 rounded-full"
                                            />
                                        ) : (
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white font-medium text-sm">
                                                {user.name
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </div>
                                        )}
                                        <span className="hidden lg:flex lg:items-center">
                                            <span className="text-sm font-medium text-gray-700">
                                                {user.name}
                                            </span>
                                            <svg
                                                className="ml-2 h-4 w-4 text-gray-400"
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </span>
                                    </button>
                                </Dropdown.Trigger>

                                <Dropdown.Content>
                                    <div className="px-4 py-3 border-b border-gray-100">
                                        <p className="text-sm font-medium text-gray-900">
                                            {user.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {user.email}
                                        </p>
                                        <p className="text-xs text-gray-500 capitalize mt-1">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                                                {user.role.replace("_", " ")}
                                            </span>
                                        </p>
                                    </div>
                                    <Dropdown.Link href={route("profile.edit")}>
                                        Profile Settings
                                    </Dropdown.Link>
                                    <Dropdown.Link href={route("dashboard")}>
                                        Dashboard
                                    </Dropdown.Link>
                                    <div className="border-t border-gray-100" />
                                    <Dropdown.Link
                                        href={route("logout")}
                                        method="post"
                                        as="button"
                                    >
                                        Log Out
                                    </Dropdown.Link>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>
                    </div>
                </div>

                {/* Main Content with Scroll */}
                <main className="flex-1 overflow-y-auto bg-gray-50">
                    {children}
                </main>
            </div>
        </div>
    );
}
