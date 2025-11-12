import { Link, usePage } from "@inertiajs/react";
import {
    HomeIcon,
    UserGroupIcon,
    ClockIcon,
    CalendarDaysIcon,
    ClipboardDocumentListIcon,
    ChatBubbleLeftRightIcon,
    VideoCameraIcon,
    ChartBarIcon,
    CalendarIcon,
    StarIcon,
    Squares2X2Icon,
    BuildingOfficeIcon,
} from "@heroicons/react/24/outline";
import {
    HomeIcon as HomeIconSolid,
    UserGroupIcon as UserGroupIconSolid,
    ClockIcon as ClockIconSolid,
    CalendarDaysIcon as CalendarDaysIconSolid,
    ClipboardDocumentListIcon as ClipboardDocumentListIconSolid,
    ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconSolid,
    VideoCameraIcon as VideoCameraIconSolid,
    ChartBarIcon as ChartBarIconSolid,
    CalendarIcon as CalendarIconSolid,
    StarIcon as StarIconSolid,
    Squares2X2Icon as Squares2X2IconSolid,
    BuildingOfficeIcon as BuildingOfficeIconSolid,
} from "@heroicons/react/24/solid";

export default function Sidebar({ collapsed = false, onToggle }) {
    const { auth } = usePage().props;
    const user = auth.user;
    const isAdmin = user.role === "admin" || user.role === "prime_admin";

    const navigation = [
        {
            name: "Dashboard",
            href: route("dashboard"),
            icon: HomeIcon,
            iconSolid: HomeIconSolid,
            current: route().current("dashboard"),
        },
        {
            name: "Attendance",
            href: route("attendance.index"),
            icon: ClockIcon,
            iconSolid: ClockIconSolid,
            current: route().current("attendance.*"),
        },
        {
            name: "Leave Requests",
            href: route("leave-requests.index"),
            icon: CalendarDaysIcon,
            iconSolid: CalendarDaysIconSolid,
            current: route().current("leave-requests.*"),
        },
        {
            name: "Tasks",
            href: route("tasks.index"),
            icon: ClipboardDocumentListIcon,
            iconSolid: ClipboardDocumentListIconSolid,
            current:
                route().current("tasks.*") && !route().current("tasks.kanban"),
        },
        {
            name: "Kanban Board",
            href: route("tasks.kanban"),
            icon: Squares2X2Icon,
            iconSolid: Squares2X2IconSolid,
            current: route().current("tasks.kanban"),
        },
        {
            name: "Chat",
            href: route("conversations.index"),
            icon: ChatBubbleLeftRightIcon,
            iconSolid: ChatBubbleLeftRightIconSolid,
            current:
                route().current("conversations.*") ||
                route().current("messages.*"),
        },
        {
            name: "Meetings",
            href: route("meetings.index"),
            icon: VideoCameraIcon,
            iconSolid: VideoCameraIconSolid,
            current: route().current("meetings.*"),
        },
        {
            name: "Calendar",
            href: route("calendar.index"),
            icon: CalendarIcon,
            iconSolid: CalendarIconSolid,
            current: route().current("calendar.*"),
        },
    ];

    const adminNavigation = [
        {
            name: "Users",
            href: route("users.index"),
            icon: UserGroupIcon,
            iconSolid: UserGroupIconSolid,
            current: route().current("users.*"),
        },
        {
            name: "Departments",
            href: route("departments.index"),
            icon: BuildingOfficeIcon,
            iconSolid: BuildingOfficeIconSolid,
            current: route().current("departments.*"),
        },
        {
            name: "Performance Reviews",
            href: route("performance-reviews.index"),
            icon: StarIcon,
            iconSolid: StarIconSolid,
            current: route().current("performance-reviews.*"),
        },
        {
            name: "Reports",
            href: route("reports.index"),
            icon: ChartBarIcon,
            iconSolid: ChartBarIconSolid,
            current: route().current("reports.*"),
        },
    ];

    return (
        <div
            className={`flex flex-col bg-gradient-to-b from-indigo-800 to-indigo-900 text-white transition-all duration-300 ${
                collapsed ? "w-20" : "w-64"
            }`}
        >
            {/* Logo Section */}
            <div className="flex h-16 items-center justify-between px-4 border-b border-indigo-700">
                {!collapsed && (
                    <Link href="/" className="flex items-center space-x-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-indigo-900 font-bold text-xl">
                            S
                        </div>
                        <span className="text-lg font-bold">Staff MS</span>
                    </Link>
                )}
                {collapsed && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-indigo-900 font-bold text-xl mx-auto">
                        S
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
                {/* Main Navigation */}
                {navigation.map((item) => {
                    const Icon = item.current ? item.iconSolid : item.icon;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center px-3 py-2.5 rounded-lg transition-colors ${
                                item.current
                                    ? "bg-indigo-700 text-white font-medium"
                                    : "text-indigo-100 hover:bg-indigo-700/50 hover:text-white"
                            } ${collapsed ? "justify-center" : "space-x-3"}`}
                            title={collapsed ? item.name : ""}
                        >
                            <Icon className="h-6 w-6 flex-shrink-0" />
                            {!collapsed && (
                                <span className="text-sm">{item.name}</span>
                            )}
                        </Link>
                    );
                })}

                {/* Admin Navigation */}
                {isAdmin && (
                    <>
                        <div
                            className={`pt-4 pb-2 ${
                                collapsed ? "px-2" : "px-3"
                            }`}
                        >
                            {!collapsed && (
                                <p className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                                    Administration
                                </p>
                            )}
                            {collapsed && (
                                <div className="h-px bg-indigo-700"></div>
                            )}
                        </div>
                        {adminNavigation.map((item) => {
                            const Icon = item.current
                                ? item.iconSolid
                                : item.icon;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center px-3 py-2.5 rounded-lg transition-colors ${
                                        item.current
                                            ? "bg-indigo-700 text-white font-medium"
                                            : "text-indigo-100 hover:bg-indigo-700/50 hover:text-white"
                                    } ${
                                        collapsed
                                            ? "justify-center"
                                            : "space-x-3"
                                    }`}
                                    title={collapsed ? item.name : ""}
                                >
                                    <Icon className="h-6 w-6 flex-shrink-0" />
                                    {!collapsed && (
                                        <span className="text-sm">
                                            {item.name}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </>
                )}
            </nav>

            {/* User Section */}
            <div className="border-t border-indigo-700 p-4">
                <div
                    className={`flex items-center ${
                        collapsed ? "justify-center" : "space-x-3"
                    }`}
                >
                    {user.avatar ? (
                        <img
                            src={`/storage/${user.avatar}`}
                            alt={user.name}
                            className="h-8 w-8 rounded-full"
                        />
                    ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-700 text-white font-medium text-sm">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                    {!collapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                                {user.name}
                            </p>
                            <p className="text-xs text-indigo-300 capitalize">
                                {user.role.replace("_", " ")}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Toggle Button */}
            <button
                onClick={onToggle}
                className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
                <svg
                    className={`h-3 w-3 transition-transform ${
                        collapsed ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                    />
                </svg>
            </button>
        </div>
    );
}
