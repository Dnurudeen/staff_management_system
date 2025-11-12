import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import Modal from "@/Components/Modal";
import Button from "@/Components/Button";
import {
    ClockIcon,
    CalendarDaysIcon,
    VideoCameraIcon,
    CheckCircleIcon,
    BriefcaseIcon,
    XCircleIcon,
} from "@heroicons/react/24/outline";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

export default function CalendarView({ auth, events }) {
    const [view, setView] = useState("month");
    const [date, setDate] = useState(new Date());
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showEventModal, setShowEventModal] = useState(false);

    // Event type filters
    const [filters, setFilters] = useState({
        attendance: true,
        leaves: true,
        meetings: true,
        tasks: true,
    });

    // Transform events for calendar
    const calendarEvents = events
        .filter((event) => filters[event.type])
        .map((event) => {
            let start, end, title, color, icon;

            switch (event.type) {
                case "attendance":
                    start = new Date(event.clock_in);
                    end = event.clock_out
                        ? new Date(event.clock_out)
                        : new Date(event.clock_in);
                    title = `⏰ ${
                        event.status === "present" ? "Present" : "Late"
                    }`;
                    color = event.status === "present" ? "#10b981" : "#f59e0b";
                    icon = ClockIcon;
                    break;

                case "leaves":
                    start = new Date(event.start_date);
                    end = new Date(event.end_date);
                    title = `🏖️ ${event.leave_type.replace("_", " ")} - ${
                        event.status
                    }`;
                    color =
                        event.status === "approved"
                            ? "#3b82f6"
                            : event.status === "rejected"
                            ? "#ef4444"
                            : "#9ca3af";
                    icon = CalendarDaysIcon;
                    break;

                case "meetings":
                    start = new Date(event.scheduled_at);
                    end = new Date(
                        moment(event.scheduled_at).add(
                            event.duration,
                            "minutes"
                        )
                    );
                    title = `📹 ${event.title}`;
                    color =
                        event.type === "video"
                            ? "#6366f1"
                            : event.type === "audio"
                            ? "#8b5cf6"
                            : "#10b981";
                    icon = VideoCameraIcon;
                    break;

                case "tasks":
                    start = new Date(event.due_date);
                    end = new Date(event.due_date);
                    title = `✓ ${event.title} - ${event.status}`;
                    color =
                        event.status === "completed"
                            ? "#10b981"
                            : event.status === "in_progress"
                            ? "#3b82f6"
                            : "#9ca3af";
                    icon = BriefcaseIcon;
                    break;

                default:
                    start = new Date();
                    end = new Date();
                    title = "Unknown Event";
                    color = "#9ca3af";
            }

            return {
                ...event,
                start,
                end,
                title,
                color,
                icon,
            };
        });

    const eventStyleGetter = (event) => {
        return {
            style: {
                backgroundColor: event.color,
                borderRadius: "4px",
                opacity: 0.9,
                color: "white",
                border: "0px",
                display: "block",
                fontSize: "0.85rem",
                padding: "2px 5px",
            },
        };
    };

    const handleSelectEvent = (event) => {
        setSelectedEvent(event);
        setShowEventModal(true);
    };

    const toggleFilter = (filterKey) => {
        setFilters((prev) => ({
            ...prev,
            [filterKey]: !prev[filterKey],
        }));
    };

    const renderEventDetails = () => {
        if (!selectedEvent) return null;

        const IconComponent = selectedEvent.icon;

        return (
            <div className="space-y-4">
                {/* Event Type Header */}
                <div className="flex items-center space-x-3">
                    <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: selectedEvent.color + "20" }}
                    >
                        <IconComponent
                            className="h-6 w-6"
                            style={{ color: selectedEvent.color }}
                        />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 uppercase font-medium">
                            {selectedEvent.type}
                        </p>
                        <p className="text-lg font-semibold text-gray-900">
                            {selectedEvent.title}
                        </p>
                    </div>
                </div>

                {/* Event Details Based on Type */}
                {selectedEvent.type === "attendance" && (
                    <div className="space-y-3 pt-4 border-t">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-500 uppercase mb-1">
                                    Clock In
                                </p>
                                <p className="text-sm font-medium">
                                    {moment(selectedEvent.clock_in).format(
                                        "h:mm A"
                                    )}
                                </p>
                            </div>
                            {selectedEvent.clock_out && (
                                <div>
                                    <p className="text-xs text-gray-500 uppercase mb-1">
                                        Clock Out
                                    </p>
                                    <p className="text-sm font-medium">
                                        {moment(selectedEvent.clock_out).format(
                                            "h:mm A"
                                        )}
                                    </p>
                                </div>
                            )}
                            <div>
                                <p className="text-xs text-gray-500 uppercase mb-1">
                                    Status
                                </p>
                                <span
                                    className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                                        selectedEvent.status === "present"
                                            ? "bg-green-100 text-green-800"
                                            : selectedEvent.status === "late"
                                            ? "bg-yellow-100 text-yellow-800"
                                            : "bg-red-100 text-red-800"
                                    }`}
                                >
                                    {selectedEvent.status}
                                </span>
                            </div>
                            {selectedEvent.total_hours && (
                                <div>
                                    <p className="text-xs text-gray-500 uppercase mb-1">
                                        Total Hours
                                    </p>
                                    <p className="text-sm font-medium">
                                        {selectedEvent.total_hours}h
                                    </p>
                                </div>
                            )}
                        </div>
                        {selectedEvent.notes && (
                            <div>
                                <p className="text-xs text-gray-500 uppercase mb-1">
                                    Notes
                                </p>
                                <p className="text-sm text-gray-700">
                                    {selectedEvent.notes}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {selectedEvent.type === "leaves" && (
                    <div className="space-y-3 pt-4 border-t">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-500 uppercase mb-1">
                                    Start Date
                                </p>
                                <p className="text-sm font-medium">
                                    {moment(selectedEvent.start_date).format(
                                        "MMM DD, YYYY"
                                    )}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase mb-1">
                                    End Date
                                </p>
                                <p className="text-sm font-medium">
                                    {moment(selectedEvent.end_date).format(
                                        "MMM DD, YYYY"
                                    )}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase mb-1">
                                    Leave Type
                                </p>
                                <p className="text-sm font-medium capitalize">
                                    {selectedEvent.leave_type.replace("_", " ")}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase mb-1">
                                    Status
                                </p>
                                <span
                                    className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                                        selectedEvent.status === "approved"
                                            ? "bg-green-100 text-green-800"
                                            : selectedEvent.status ===
                                              "rejected"
                                            ? "bg-red-100 text-red-800"
                                            : "bg-yellow-100 text-yellow-800"
                                    }`}
                                >
                                    {selectedEvent.status}
                                </span>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase mb-1">
                                Reason
                            </p>
                            <p className="text-sm text-gray-700">
                                {selectedEvent.reason}
                            </p>
                        </div>
                    </div>
                )}

                {selectedEvent.type === "meetings" && (
                    <div className="space-y-3 pt-4 border-t">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-500 uppercase mb-1">
                                    Date & Time
                                </p>
                                <p className="text-sm font-medium">
                                    {moment(selectedEvent.scheduled_at).format(
                                        "MMM DD, YYYY h:mm A"
                                    )}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase mb-1">
                                    Duration
                                </p>
                                <p className="text-sm font-medium">
                                    {selectedEvent.duration} minutes
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase mb-1">
                                    Type
                                </p>
                                <p className="text-sm font-medium capitalize">
                                    {selectedEvent.meeting_type}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase mb-1">
                                    Status
                                </p>
                                <span
                                    className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                                        selectedEvent.status === "scheduled"
                                            ? "bg-blue-100 text-blue-800"
                                            : selectedEvent.status ===
                                              "completed"
                                            ? "bg-green-100 text-green-800"
                                            : "bg-red-100 text-red-800"
                                    }`}
                                >
                                    {selectedEvent.status}
                                </span>
                            </div>
                        </div>
                        {selectedEvent.description && (
                            <div>
                                <p className="text-xs text-gray-500 uppercase mb-1">
                                    Description
                                </p>
                                <p className="text-sm text-gray-700">
                                    {selectedEvent.description}
                                </p>
                            </div>
                        )}
                        {selectedEvent.meeting_link && (
                            <div>
                                <Button
                                    onClick={() =>
                                        window.open(
                                            selectedEvent.meeting_link,
                                            "_blank"
                                        )
                                    }
                                    size="sm"
                                >
                                    Join Meeting
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {selectedEvent.type === "tasks" && (
                    <div className="space-y-3 pt-4 border-t">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-500 uppercase mb-1">
                                    Due Date
                                </p>
                                <p className="text-sm font-medium">
                                    {moment(selectedEvent.due_date).format(
                                        "MMM DD, YYYY"
                                    )}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase mb-1">
                                    Priority
                                </p>
                                <span
                                    className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                                        selectedEvent.priority === "urgent"
                                            ? "bg-red-100 text-red-800"
                                            : selectedEvent.priority === "high"
                                            ? "bg-orange-100 text-orange-800"
                                            : selectedEvent.priority ===
                                              "medium"
                                            ? "bg-yellow-100 text-yellow-800"
                                            : "bg-green-100 text-green-800"
                                    }`}
                                >
                                    {selectedEvent.priority}
                                </span>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase mb-1">
                                    Status
                                </p>
                                <span
                                    className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                                        selectedEvent.status === "completed"
                                            ? "bg-green-100 text-green-800"
                                            : selectedEvent.status ===
                                              "in_progress"
                                            ? "bg-blue-100 text-blue-800"
                                            : "bg-gray-100 text-gray-800"
                                    }`}
                                >
                                    {selectedEvent.status.replace("_", " ")}
                                </span>
                            </div>
                            {selectedEvent.assigned_user && (
                                <div>
                                    <p className="text-xs text-gray-500 uppercase mb-1">
                                        Assigned To
                                    </p>
                                    <p className="text-sm font-medium">
                                        {selectedEvent.assigned_user.name}
                                    </p>
                                </div>
                            )}
                        </div>
                        {selectedEvent.description && (
                            <div>
                                <p className="text-xs text-gray-500 uppercase mb-1">
                                    Description
                                </p>
                                <p className="text-sm text-gray-700">
                                    {selectedEvent.description}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Unified Calendar
                    </h2>
                </div>
            }
        >
            <Head title="Calendar" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Event Type Filters */}
                    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                        <div className="flex items-center space-x-4">
                            <span className="text-sm font-medium text-gray-700">
                                Show:
                            </span>

                            <button
                                onClick={() => toggleFilter("attendance")}
                                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                                    filters.attendance
                                        ? "bg-green-100 text-green-800"
                                        : "bg-gray-100 text-gray-500"
                                }`}
                            >
                                <ClockIcon className="h-4 w-4" />
                                <span className="text-sm font-medium">
                                    Attendance
                                </span>
                            </button>

                            <button
                                onClick={() => toggleFilter("leaves")}
                                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                                    filters.leaves
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-gray-100 text-gray-500"
                                }`}
                            >
                                <CalendarDaysIcon className="h-4 w-4" />
                                <span className="text-sm font-medium">
                                    Leaves
                                </span>
                            </button>

                            <button
                                onClick={() => toggleFilter("meetings")}
                                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                                    filters.meetings
                                        ? "bg-indigo-100 text-indigo-800"
                                        : "bg-gray-100 text-gray-500"
                                }`}
                            >
                                <VideoCameraIcon className="h-4 w-4" />
                                <span className="text-sm font-medium">
                                    Meetings
                                </span>
                            </button>

                            <button
                                onClick={() => toggleFilter("tasks")}
                                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                                    filters.tasks
                                        ? "bg-purple-100 text-purple-800"
                                        : "bg-gray-100 text-gray-500"
                                }`}
                            >
                                <BriefcaseIcon className="h-4 w-4" />
                                <span className="text-sm font-medium">
                                    Tasks
                                </span>
                            </button>

                            <div className="flex-1"></div>

                            <div className="text-sm text-gray-600">
                                <span className="font-medium">
                                    {calendarEvents.length}
                                </span>{" "}
                                events
                            </div>
                        </div>
                    </div>

                    {/* Calendar */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <Calendar
                            localizer={localizer}
                            events={calendarEvents}
                            startAccessor="start"
                            endAccessor="end"
                            style={{ height: 700 }}
                            view={view}
                            onView={setView}
                            date={date}
                            onNavigate={setDate}
                            eventPropGetter={eventStyleGetter}
                            onSelectEvent={handleSelectEvent}
                            views={["month", "week", "day", "agenda"]}
                            popup
                            selectable
                        />
                    </div>

                    {/* Legend */}
                    <div className="mt-6 bg-white rounded-lg shadow-sm p-4">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">
                            Event Legend
                        </h3>
                        <div className="grid grid-cols-4 gap-4">
                            <div className="flex items-center space-x-2">
                                <div
                                    className="w-4 h-4 rounded"
                                    style={{ backgroundColor: "#10b981" }}
                                ></div>
                                <span className="text-sm text-gray-600">
                                    Present / Approved Leave / Completed Task
                                </span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div
                                    className="w-4 h-4 rounded"
                                    style={{ backgroundColor: "#3b82f6" }}
                                ></div>
                                <span className="text-sm text-gray-600">
                                    Task In Progress
                                </span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div
                                    className="w-4 h-4 rounded"
                                    style={{ backgroundColor: "#6366f1" }}
                                ></div>
                                <span className="text-sm text-gray-600">
                                    Video Meeting
                                </span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div
                                    className="w-4 h-4 rounded"
                                    style={{ backgroundColor: "#f59e0b" }}
                                ></div>
                                <span className="text-sm text-gray-600">
                                    Late / Pending Leave
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Event Detail Modal */}
            <Modal
                show={showEventModal}
                onClose={() => {
                    setShowEventModal(false);
                    setSelectedEvent(null);
                }}
                maxWidth="2xl"
            >
                {renderEventDetails()}
            </Modal>
        </AuthenticatedLayout>
    );
}
