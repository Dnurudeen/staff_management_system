import { useState } from "react";
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
} from "@heroicons/react/24/outline";

const localizer = momentLocalizer(moment);

export default function Index({ auth, meetings, users }) {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedMeeting, setSelectedMeeting] = useState(null);
    const [view, setView] = useState("month");

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

    const handleSelectSlot = ({ start, end }) => {
        setData("scheduled_at", moment(start).format("YYYY-MM-DDTHH:mm"));
        setData("duration", Math.round((end - start) / 60000)); // minutes
        setShowCreateModal(true);
    };

    const handleSelectEvent = (meeting) => {
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
            recurrence_end_date: meeting.recurrence_end_date || "",
        });
        setShowCreateModal(true);
    };

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

    // Transform meetings to calendar events
    const events = meetings.map((meeting) => ({
        ...meeting,
        start: new Date(meeting.scheduled_at),
        end: new Date(
            moment(meeting.scheduled_at).add(meeting.duration, "minutes")
        ),
        title: meeting.title,
    }));

    // Event styling
    const eventStyleGetter = (event) => {
        let backgroundColor = "#3b82f6"; // blue

        if (event.type === "video") {
            backgroundColor = "#6366f1"; // indigo
        } else if (event.type === "audio") {
            backgroundColor = "#8b5cf6"; // purple
        } else if (event.type === "in_person") {
            backgroundColor = "#10b981"; // green
        }

        if (event.status === "cancelled") {
            backgroundColor = "#ef4444"; // red
        }

        return {
            style: {
                backgroundColor,
                borderRadius: "4px",
                opacity: 0.9,
                color: "white",
                border: "0px",
                display: "block",
            },
        };
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
                            eventPropGetter={eventStyleGetter}
                            popup
                            style={{ height: "100%" }}
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
        </AuthenticatedLayout>
    );
}
