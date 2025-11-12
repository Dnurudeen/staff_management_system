import { useState, useMemo, useCallback } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, router } from "@inertiajs/react";
import Button from "@/Components/Button";
import Modal from "@/Components/Modal";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
    PlusIcon,
    VideoCameraIcon,
    MapPinIcon,
    UsersIcon,
    PhoneIcon,
    TrashIcon,
    PencilIcon,
    ClockIcon,
    CalendarIcon,
} from "@heroicons/react/24/outline";

const localizer = momentLocalizer(moment);

export default function Index({ auth, meetings, users }) {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedMeeting, setSelectedMeeting] = useState(null);
    const [view, setView] = useState("month");
    const [date, setDate] = useState(new Date());
    const [showEventDetails, setShowEventDetails] = useState(false);
    const [eventToView, setEventToView] = useState(null);

    const { data, setData, post, put, reset, processing, errors } = useForm({
        title: "",
        description: "",
        agenda: "",
        type: "video",
        scheduled_at: "",
        duration: 60,
        location: "",
        meeting_link: "",
        participant_ids: [],
        recurrence: "none",
        recurrence_end_date: "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        if (selectedMeeting) {
            put(route("meetings.update", selectedMeeting.id), {
                onSuccess: () => {
                    reset();
                    setShowCreateModal(false);
                    setSelectedMeeting(null);
                },
            });
        } else {
            post(route("meetings.store"), {
                onSuccess: () => {
                    reset();
                    setShowCreateModal(false);
                },
            });
        }
    };

    const handleSelectSlot = useCallback(({ start, end }) => {
        // Reset form for new meeting
        setSelectedMeeting(null);
        reset();

        // Calculate duration in minutes
        const durationInMinutes = Math.round((end - start) / 60000);

        setData({
            title: "",
            description: "",
            agenda: "",
            type: "video",
            scheduled_at: moment(start).format("YYYY-MM-DDTHH:mm"),
            duration: durationInMinutes >= 15 ? durationInMinutes : 60,
            location: "",
            meeting_link: "",
            participant_ids: [],
            recurrence: "none",
            recurrence_end_date: "",
        });

        setShowCreateModal(true);
    }, []);

    const handleSelectEvent = useCallback((meeting) => {
        setEventToView(meeting);
        setShowEventDetails(true);
    }, []);

    const handleEditMeeting = useCallback((meeting) => {
        setSelectedMeeting(meeting);
        setData({
            title: meeting.title,
            description: meeting.description || "",
            agenda: meeting.agenda || "",
            type: meeting.type,
            scheduled_at: moment(meeting.scheduled_at).format(
                "YYYY-MM-DDTHH:mm"
            ),
            duration: meeting.duration,
            location: meeting.location || "",
            meeting_link: meeting.meeting_link || "",
            participant_ids: meeting.participants.map((p) => p.id),
            recurrence: meeting.recurrence || "none",
            recurrence_end_date: meeting.recurrence_end_date
                ? moment(meeting.recurrence_end_date).format("YYYY-MM-DD")
                : "",
        });
        setShowEventDetails(false);
        setShowCreateModal(true);
    }, []);

    const handleDeleteMeeting = useCallback((meetingId) => {
        if (confirm("Are you sure you want to delete this meeting?")) {
            router.delete(route("meetings.destroy", meetingId), {
                onSuccess: () => {
                    setShowEventDetails(false);
                    setEventToView(null);
                },
            });
        }
    }, []);

    const handleRSVP = (meetingId, status) => {
        router.post(route("meetings.rsvp", meetingId), {
            status: status,
        });
    };

    const handleJoinMeeting = (meeting) => {
        if (meeting.meeting_link) {
            window.open(meeting.meeting_link, "_blank");
        }
    };

    // Transform meetings to calendar events with memoization
    const events = useMemo(() => {
        return meetings.map((meeting) => ({
            ...meeting,
            start: new Date(meeting.scheduled_at),
            end: new Date(
                moment(meeting.scheduled_at).add(meeting.duration, "minutes")
            ),
            title: meeting.title,
            resource: meeting, // Store full meeting data
        }));
    }, [meetings]);

    // Event styling with better visual indicators
    const eventStyleGetter = useCallback(
        (event) => {
            let backgroundColor = "#3b82f6"; // blue
            let borderColor = "#2563eb";

            if (event.type === "video") {
                backgroundColor = "#6366f1"; // indigo
                borderColor = "#4f46e5";
            } else if (event.type === "audio") {
                backgroundColor = "#8b5cf6"; // purple
                borderColor = "#7c3aed";
            } else if (event.type === "in_person") {
                backgroundColor = "#10b981"; // green
                borderColor = "#059669";
            }

            if (event.status === "cancelled") {
                backgroundColor = "#ef4444"; // red
                borderColor = "#dc2626";
            } else if (event.status === "completed") {
                backgroundColor = "#6b7280"; // gray
                borderColor = "#4b5563";
            }

            // Check if user has RSVP'd
            const userParticipant = event.participants?.find(
                (p) => p.id === auth.user.id
            );

            if (userParticipant?.pivot?.rsvp_status === "declined") {
                backgroundColor = "#f59e0b"; // amber
                borderColor = "#d97706";
            }

            return {
                style: {
                    backgroundColor,
                    borderLeft: `4px solid ${borderColor}`,
                    borderRadius: "4px",
                    opacity: event.status === "cancelled" ? 0.6 : 0.9,
                    color: "white",
                    border: "0px",
                    display: "block",
                    fontSize: "0.875rem",
                    padding: "2px 5px",
                },
            };
        },
        [auth.user.id]
    );

    // Custom event component for better display
    const EventComponent = ({ event }) => {
        const typeIcon = {
            video: <VideoCameraIcon className="h-3 w-3 inline mr-1" />,
            audio: <PhoneIcon className="h-3 w-3 inline mr-1" />,
            in_person: <MapPinIcon className="h-3 w-3 inline mr-1" />,
        };

        return (
            <div className="flex items-center">
                {typeIcon[event.type]}
                <span className="truncate">{event.title}</span>
            </div>
        );
    };

    // Navigate to today
    const handleNavigateToday = useCallback(() => {
        setDate(new Date());
    }, []);

    // Custom toolbar for better navigation
    const CustomToolbar = (toolbar) => {
        const goToBack = () => {
            toolbar.onNavigate("PREV");
        };

        const goToNext = () => {
            toolbar.onNavigate("NEXT");
        };

        const goToToday = () => {
            toolbar.onNavigate("TODAY");
        };

        const label = () => {
            const date = moment(toolbar.date);
            return (
                <span className="text-lg font-semibold text-gray-900">
                    {date.format("MMMM YYYY")}
                </span>
            );
        };

        return (
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                    <Button size="sm" variant="ghost" onClick={goToBack}>
                        Previous
                    </Button>
                    <Button size="sm" onClick={goToToday}>
                        Today
                    </Button>
                    <Button size="sm" variant="ghost" onClick={goToNext}>
                        Next
                    </Button>
                </div>

                <div>{label()}</div>

                <div className="flex items-center space-x-2">
                    <Button
                        size="sm"
                        variant={toolbar.view === "month" ? "primary" : "ghost"}
                        onClick={() => toolbar.onView("month")}
                    >
                        Month
                    </Button>
                    <Button
                        size="sm"
                        variant={toolbar.view === "week" ? "primary" : "ghost"}
                        onClick={() => toolbar.onView("week")}
                    >
                        Week
                    </Button>
                    <Button
                        size="sm"
                        variant={toolbar.view === "day" ? "primary" : "ghost"}
                        onClick={() => toolbar.onView("day")}
                    >
                        Day
                    </Button>
                    <Button
                        size="sm"
                        variant={
                            toolbar.view === "agenda" ? "primary" : "ghost"
                        }
                        onClick={() => toolbar.onView("agenda")}
                    >
                        Agenda
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Meeting Scheduler
                    </h2>
                    <Button onClick={() => setShowCreateModal(true)}>
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Schedule Meeting
                    </Button>
                </div>
            }
        >
            <Head title="Meetings" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Calendar View */}
                    <div
                        className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 mb-6"
                        style={{ height: "700px" }}
                    >
                        <Calendar
                            localizer={localizer}
                            events={events}
                            startAccessor="start"
                            endAccessor="end"
                            onSelectSlot={handleSelectSlot}
                            onSelectEvent={handleSelectEvent}
                            selectable
                            view={view}
                            onView={setView}
                            date={date}
                            onNavigate={setDate}
                            eventPropGetter={eventStyleGetter}
                            components={{
                                event: EventComponent,
                                toolbar: CustomToolbar,
                            }}
                            popup
                            step={15}
                            timeslots={4}
                            showMultiDayTimes
                            defaultDate={new Date()}
                            scrollToTime={new Date(1970, 1, 1, 8)}
                            style={{ height: "100%" }}
                            messages={{
                                next: "Next",
                                previous: "Previous",
                                today: "Today",
                                month: "Month",
                                week: "Week",
                                day: "Day",
                                agenda: "Agenda",
                                date: "Date",
                                time: "Time",
                                event: "Meeting",
                                noEventsInRange: "No meetings in this range.",
                                showMore: (total) => `+${total} more`,
                            }}
                        />
                    </div>

                    {/* Upcoming Meetings List */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Upcoming Meetings
                        </h3>
                        <div className="space-y-4">
                            {meetings
                                .filter((m) =>
                                    moment(m.scheduled_at).isAfter(moment())
                                )
                                .slice(0, 5)
                                .map((meeting) => {
                                    const userParticipant =
                                        meeting.participants.find(
                                            (p) => p.id === auth.user.id
                                        );
                                    const rsvpStatus =
                                        userParticipant?.pivot?.rsvp_status ||
                                        "pending";

                                    return (
                                        <div
                                            key={meeting.id}
                                            className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2 mb-2">
                                                        <h4 className="text-sm font-semibold text-gray-900">
                                                            {meeting.title}
                                                        </h4>
                                                        {meeting.type ===
                                                            "video" && (
                                                            <VideoCameraIcon className="h-4 w-4 text-indigo-600" />
                                                        )}
                                                        {meeting.type ===
                                                            "in_person" && (
                                                            <MapPinIcon className="h-4 w-4 text-green-600" />
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-600 mb-2">
                                                        {meeting.description}
                                                    </p>
                                                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                                                        <span>
                                                            {moment(
                                                                meeting.scheduled_at
                                                            ).format(
                                                                "MMM DD, YYYY h:mm A"
                                                            )}
                                                        </span>
                                                        <span>
                                                            {meeting.duration}{" "}
                                                            min
                                                        </span>
                                                        <span className="flex items-center">
                                                            <UsersIcon className="h-3 w-3 mr-1" />
                                                            {
                                                                meeting
                                                                    .participants
                                                                    .length
                                                            }
                                                        </span>
                                                    </div>
                                                    {meeting.location && (
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            📍{" "}
                                                            {meeting.location}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="ml-4 flex flex-col space-y-2">
                                                    {meeting.meeting_link &&
                                                        moment(
                                                            meeting.scheduled_at
                                                        ).isBefore(
                                                            moment().add(
                                                                15,
                                                                "minutes"
                                                            )
                                                        ) && (
                                                            <Button
                                                                size="sm"
                                                                variant="success"
                                                                onClick={() =>
                                                                    handleJoinMeeting(
                                                                        meeting
                                                                    )
                                                                }
                                                            >
                                                                Join Now
                                                            </Button>
                                                        )}
                                                    {rsvpStatus ===
                                                        "pending" && (
                                                        <div className="flex space-x-2">
                                                            <Button
                                                                size="sm"
                                                                variant="success"
                                                                onClick={() =>
                                                                    handleRSVP(
                                                                        meeting.id,
                                                                        "accepted"
                                                                    )
                                                                }
                                                            >
                                                                Accept
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="danger"
                                                                onClick={() =>
                                                                    handleRSVP(
                                                                        meeting.id,
                                                                        "declined"
                                                                    )
                                                                }
                                                            >
                                                                Decline
                                                            </Button>
                                                        </div>
                                                    )}
                                                    {rsvpStatus !==
                                                        "pending" && (
                                                        <span
                                                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                                rsvpStatus ===
                                                                "accepted"
                                                                    ? "bg-green-100 text-green-800"
                                                                    : rsvpStatus ===
                                                                      "declined"
                                                                    ? "bg-red-100 text-red-800"
                                                                    : "bg-yellow-100 text-yellow-800"
                                                            }`}
                                                        >
                                                            {rsvpStatus}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Create/Edit Meeting Modal */}
            <Modal
                show={showCreateModal}
                onClose={() => {
                    setShowCreateModal(false);
                    setSelectedMeeting(null);
                    reset();
                }}
                title={selectedMeeting ? "Edit Meeting" : "Schedule Meeting"}
                maxWidth="2xl"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Title *
                        </label>
                        <input
                            type="text"
                            value={data.title}
                            onChange={(e) => setData("title", e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            required
                        />
                        {errors.title && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.title}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Description
                        </label>
                        <textarea
                            value={data.description}
                            onChange={(e) =>
                                setData("description", e.target.value)
                            }
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Agenda
                        </label>
                        <textarea
                            value={data.agenda}
                            onChange={(e) => setData("agenda", e.target.value)}
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            placeholder="Meeting topics and discussion points..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Type *
                            </label>
                            <select
                                value={data.type}
                                onChange={(e) =>
                                    setData("type", e.target.value)
                                }
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                required
                            >
                                <option value="video">Video Call</option>
                                <option value="audio">Audio Call</option>
                                <option value="in_person">In Person</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Duration (minutes) *
                            </label>
                            <input
                                type="number"
                                value={data.duration}
                                onChange={(e) =>
                                    setData("duration", e.target.value)
                                }
                                min="15"
                                step="15"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Scheduled At *
                        </label>
                        <input
                            type="datetime-local"
                            value={data.scheduled_at}
                            onChange={(e) =>
                                setData("scheduled_at", e.target.value)
                            }
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            required
                        />
                    </div>

                    {data.type === "in_person" && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Location
                            </label>
                            <input
                                type="text"
                                value={data.location}
                                onChange={(e) =>
                                    setData("location", e.target.value)
                                }
                                placeholder="Conference Room A, Building 2"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                        </div>
                    )}

                    {(data.type === "video" || data.type === "audio") && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Meeting Link
                            </label>
                            <input
                                type="url"
                                value={data.meeting_link}
                                onChange={(e) =>
                                    setData("meeting_link", e.target.value)
                                }
                                placeholder="https://meet.google.com/..."
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Participants *
                        </label>
                        <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2 space-y-2">
                            {users.map((user) => (
                                <label
                                    key={user.id}
                                    className="flex items-center space-x-2 hover:bg-gray-50 p-1 rounded"
                                >
                                    <input
                                        type="checkbox"
                                        checked={data.participant_ids.includes(
                                            user.id
                                        )}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setData("participant_ids", [
                                                    ...data.participant_ids,
                                                    user.id,
                                                ]);
                                            } else {
                                                setData(
                                                    "participant_ids",
                                                    data.participant_ids.filter(
                                                        (id) => id !== user.id
                                                    )
                                                );
                                            }
                                        }}
                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-sm">
                                        {user.name} ({user.email})
                                    </span>
                                </label>
                            ))}
                        </div>
                        {errors.participant_ids && (
                            <p className="mt-1 text-sm text-red-600">
                                {errors.participant_ids}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Recurrence
                            </label>
                            <select
                                value={data.recurrence}
                                onChange={(e) =>
                                    setData("recurrence", e.target.value)
                                }
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                <option value="none">None</option>
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>

                        {data.recurrence !== "none" && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Recurrence End Date
                                </label>
                                <input
                                    type="date"
                                    value={data.recurrence_end_date}
                                    onChange={(e) =>
                                        setData(
                                            "recurrence_end_date",
                                            e.target.value
                                        )
                                    }
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end space-x-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                                setShowCreateModal(false);
                                setSelectedMeeting(null);
                                reset();
                            }}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {selectedMeeting ? "Update" : "Schedule"} Meeting
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Event Details Modal */}
            <Modal
                show={showEventDetails}
                onClose={() => {
                    setShowEventDetails(false);
                    setEventToView(null);
                }}
                title="Meeting Details"
                maxWidth="2xl"
            >
                {eventToView && (
                    <div className="space-y-6">
                        {/* Header with actions */}
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                    {eventToView.title}
                                </h3>
                                <div className="flex items-center space-x-4">
                                    <span
                                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                            eventToView.type === "video"
                                                ? "bg-indigo-100 text-indigo-800"
                                                : eventToView.type === "audio"
                                                ? "bg-purple-100 text-purple-800"
                                                : "bg-green-100 text-green-800"
                                        }`}
                                    >
                                        {eventToView.type === "video" && (
                                            <VideoCameraIcon className="h-4 w-4 mr-1" />
                                        )}
                                        {eventToView.type === "audio" && (
                                            <PhoneIcon className="h-4 w-4 mr-1" />
                                        )}
                                        {eventToView.type === "in_person" && (
                                            <MapPinIcon className="h-4 w-4 mr-1" />
                                        )}
                                        {eventToView.type === "video"
                                            ? "Video Call"
                                            : eventToView.type === "audio"
                                            ? "Audio Call"
                                            : "In Person"}
                                    </span>
                                    <span
                                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                            eventToView.status === "scheduled"
                                                ? "bg-blue-100 text-blue-800"
                                                : eventToView.status ===
                                                  "ongoing"
                                                ? "bg-green-100 text-green-800"
                                                : eventToView.status ===
                                                  "completed"
                                                ? "bg-gray-100 text-gray-800"
                                                : "bg-red-100 text-red-800"
                                        }`}
                                    >
                                        {eventToView.status}
                                    </span>
                                </div>
                            </div>

                            {/* Action buttons for meeting creator */}
                            {eventToView.created_by === auth.user.id && (
                                <div className="flex items-center space-x-2">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() =>
                                            handleEditMeeting(eventToView)
                                        }
                                    >
                                        <PencilIcon className="h-4 w-4 mr-1" />
                                        Edit
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="danger"
                                        onClick={() =>
                                            handleDeleteMeeting(eventToView.id)
                                        }
                                    >
                                        <TrashIcon className="h-4 w-4 mr-1" />
                                        Delete
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Time and Duration */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-start space-x-3">
                                <CalendarIcon className="h-5 w-5 text-gray-400 mt-1" />
                                <div>
                                    <p className="text-sm font-medium text-gray-700">
                                        Date & Time
                                    </p>
                                    <p className="text-sm text-gray-900">
                                        {moment(
                                            eventToView.scheduled_at
                                        ).format("dddd, MMMM DD, YYYY")}
                                    </p>
                                    <p className="text-sm text-gray-900">
                                        {moment(
                                            eventToView.scheduled_at
                                        ).format("h:mm A")}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start space-x-3">
                                <ClockIcon className="h-5 w-5 text-gray-400 mt-1" />
                                <div>
                                    <p className="text-sm font-medium text-gray-700">
                                        Duration
                                    </p>
                                    <p className="text-sm text-gray-900">
                                        {eventToView.duration} minutes
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Until{" "}
                                        {moment(eventToView.scheduled_at)
                                            .add(
                                                eventToView.duration,
                                                "minutes"
                                            )
                                            .format("h:mm A")}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        {eventToView.description && (
                            <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </h4>
                                <p className="text-sm text-gray-900">
                                    {eventToView.description}
                                </p>
                            </div>
                        )}

                        {/* Agenda */}
                        {eventToView.agenda && (
                            <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-2">
                                    Agenda
                                </h4>
                                <p className="text-sm text-gray-900 whitespace-pre-wrap">
                                    {eventToView.agenda}
                                </p>
                            </div>
                        )}

                        {/* Location or Meeting Link */}
                        {eventToView.type === "in_person" &&
                            eventToView.location && (
                                <div className="flex items-start space-x-3 bg-gray-50 p-4 rounded-lg">
                                    <MapPinIcon className="h-5 w-5 text-gray-400 mt-1" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">
                                            Location
                                        </p>
                                        <p className="text-sm text-gray-900">
                                            {eventToView.location}
                                        </p>
                                    </div>
                                </div>
                            )}

                        {(eventToView.type === "video" ||
                            eventToView.type === "audio") &&
                            eventToView.meeting_link && (
                                <div className="flex items-start space-x-3 bg-indigo-50 p-4 rounded-lg">
                                    <VideoCameraIcon className="h-5 w-5 text-indigo-600 mt-1" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-700 mb-2">
                                            Meeting Link
                                        </p>
                                        <a
                                            href={eventToView.meeting_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-indigo-600 hover:text-indigo-800 break-all"
                                        >
                                            {eventToView.meeting_link}
                                        </a>
                                    </div>
                                </div>
                            )}

                        {/* Participants */}
                        <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-3">
                                Participants (
                                {eventToView.participants?.length || 0})
                            </h4>
                            <div className="space-y-2">
                                {eventToView.participants?.map(
                                    (participant) => {
                                        const isOrganizer =
                                            participant.pivot?.role === "host";
                                        const rsvpStatus =
                                            participant.pivot?.rsvp_status ||
                                            "pending";

                                        return (
                                            <div
                                                key={participant.id}
                                                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <div className="flex-shrink-0 h-8 w-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                                        {participant.name.charAt(
                                                            0
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {participant.name}
                                                            {isOrganizer && (
                                                                <span className="ml-2 text-xs text-indigo-600">
                                                                    (Organizer)
                                                                </span>
                                                            )}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {participant.email}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span
                                                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                        rsvpStatus ===
                                                        "accepted"
                                                            ? "bg-green-100 text-green-800"
                                                            : rsvpStatus ===
                                                              "declined"
                                                            ? "bg-red-100 text-red-800"
                                                            : rsvpStatus ===
                                                              "maybe"
                                                            ? "bg-yellow-100 text-yellow-800"
                                                            : "bg-gray-100 text-gray-800"
                                                    }`}
                                                >
                                                    {rsvpStatus}
                                                </span>
                                            </div>
                                        );
                                    }
                                )}
                            </div>
                        </div>

                        {/* RSVP Actions for participant */}
                        {eventToView.participants?.some(
                            (p) => p.id === auth.user.id
                        ) && (
                            <div className="border-t border-gray-200 pt-4">
                                {eventToView.participants.find(
                                    (p) => p.id === auth.user.id
                                )?.pivot?.rsvp_status === "pending" ? (
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-gray-700">
                                            Will you attend this meeting?
                                        </p>
                                        <div className="flex space-x-2">
                                            <Button
                                                size="sm"
                                                variant="success"
                                                onClick={() => {
                                                    handleRSVP(
                                                        eventToView.id,
                                                        "accepted"
                                                    );
                                                    setShowEventDetails(false);
                                                }}
                                            >
                                                Accept
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => {
                                                    handleRSVP(
                                                        eventToView.id,
                                                        "maybe"
                                                    );
                                                    setShowEventDetails(false);
                                                }}
                                            >
                                                Maybe
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="danger"
                                                onClick={() => {
                                                    handleRSVP(
                                                        eventToView.id,
                                                        "declined"
                                                    );
                                                    setShowEventDetails(false);
                                                }}
                                            >
                                                Decline
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-gray-700">
                                            Your response:{" "}
                                            <span className="font-semibold">
                                                {
                                                    eventToView.participants.find(
                                                        (p) =>
                                                            p.id ===
                                                            auth.user.id
                                                    )?.pivot?.rsvp_status
                                                }
                                            </span>
                                        </p>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                                handleRSVP(
                                                    eventToView.id,
                                                    "pending"
                                                );
                                                setShowEventDetails(false);
                                            }}
                                        >
                                            Change Response
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Join Meeting Button */}
                        {eventToView.meeting_link &&
                            moment(eventToView.scheduled_at).isBefore(
                                moment().add(15, "minutes")
                            ) &&
                            moment(eventToView.scheduled_at)
                                .add(eventToView.duration, "minutes")
                                .isAfter(moment()) && (
                                <div className="border-t border-gray-200 pt-4">
                                    <Button
                                        className="w-full"
                                        onClick={() =>
                                            handleJoinMeeting(eventToView)
                                        }
                                    >
                                        <VideoCameraIcon className="h-5 w-5 mr-2" />
                                        Join Meeting Now
                                    </Button>
                                </div>
                            )}
                    </div>
                )}
            </Modal>
        </AuthenticatedLayout>
    );
}
