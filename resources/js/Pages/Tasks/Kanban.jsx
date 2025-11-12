import { useState } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router } from "@inertiajs/react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import Button from "@/Components/Button";
import Modal from "@/Components/Modal";
import {
    PlusIcon,
    EllipsisVerticalIcon,
    UserCircleIcon,
    CalendarIcon,
    FlagIcon,
} from "@heroicons/react/24/outline";

export default function Kanban({ auth, tasks }) {
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [filter, setFilter] = useState("all"); // all, my-tasks, assigned-by-me

    // Group tasks by status
    const columns = {
        pending: {
            title: "To Do",
            color: "bg-gray-100",
            tasks: tasks.filter((t) => t.status === "pending"),
        },
        in_progress: {
            title: "In Progress",
            color: "bg-blue-100",
            tasks: tasks.filter((t) => t.status === "in_progress"),
        },
        completed: {
            title: "Done",
            color: "bg-green-100",
            tasks: tasks.filter((t) => t.status === "completed"),
        },
    };

    const handleDragEnd = (result) => {
        if (!result.destination) return;

        const { draggableId, destination } = result;
        const taskId = draggableId.replace("task-", "");
        const newStatus = destination.droppableId;

        // Update task status
        router.post(
            route("tasks.update-status", taskId),
            {
                status: newStatus,
            },
            {
                preserveScroll: true,
            }
        );
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case "urgent":
                return "border-red-500 bg-red-50";
            case "high":
                return "border-orange-500 bg-orange-50";
            case "medium":
                return "border-yellow-500 bg-yellow-50";
            case "low":
                return "border-green-500 bg-green-50";
            default:
                return "border-gray-300 bg-white";
        }
    };

    const getPriorityBadge = (priority) => {
        const colors = {
            urgent: "bg-red-100 text-red-800",
            high: "bg-orange-100 text-orange-800",
            medium: "bg-yellow-100 text-yellow-800",
            low: "bg-green-100 text-green-800",
        };

        return (
            <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[priority]}`}
            >
                <FlagIcon className="h-3 w-3 mr-1" />
                {priority}
            </span>
        );
    };

    const TaskCard = ({ task, index }) => (
        <Draggable draggableId={`task-${task.id}`} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`mb-3 p-4 rounded-lg border-l-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${getPriorityColor(
                        task.priority
                    )} ${snapshot.isDragging ? "opacity-75 rotate-2" : ""}`}
                    onClick={() => {
                        setSelectedTask(task);
                        setShowTaskModal(true);
                    }}
                >
                    {/* Task Title */}
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-start justify-between">
                        <span className="flex-1 pr-2">{task.title}</span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                // Show task options menu
                            }}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <EllipsisVerticalIcon className="h-5 w-5" />
                        </button>
                    </h4>

                    {/* Task Description */}
                    {task.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {task.description}
                        </p>
                    )}

                    {/* Task Meta */}
                    <div className="space-y-2">
                        {/* Priority */}
                        <div>{getPriorityBadge(task.priority)}</div>

                        {/* Assigned User */}
                        {task.assigned_user && (
                            <div className="flex items-center text-xs text-gray-500">
                                {task.assigned_user.avatar ? (
                                    <img
                                        src={`/storage/${task.assigned_user.avatar}`}
                                        alt={task.assigned_user.name}
                                        className="h-6 w-6 rounded-full mr-2"
                                    />
                                ) : (
                                    <UserCircleIcon className="h-6 w-6 mr-2 text-gray-400" />
                                )}
                                <span>{task.assigned_user.name}</span>
                            </div>
                        )}

                        {/* Due Date */}
                        {task.due_date && (
                            <div className="flex items-center text-xs text-gray-500">
                                <CalendarIcon className="h-4 w-4 mr-1" />
                                <span>
                                    {new Date(
                                        task.due_date
                                    ).toLocaleDateString()}
                                </span>
                                {new Date(task.due_date) < new Date() &&
                                    task.status !== "completed" && (
                                        <span className="ml-2 text-red-600 font-semibold">
                                            Overdue
                                        </span>
                                    )}
                            </div>
                        )}

                        {/* Department */}
                        {task.department && (
                            <div className="text-xs text-gray-500">
                                {task.department.name}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Draggable>
    );

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Task Board
                    </h2>
                    <div className="flex items-center space-x-3">
                        {/* Filter */}
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="rounded-md border-gray-300 text-sm"
                        >
                            <option value="all">All Tasks</option>
                            <option value="my-tasks">My Tasks</option>
                            <option value="assigned-by-me">
                                Assigned by Me
                            </option>
                        </select>

                        {auth.user.role !== "staff" && (
                            <Button
                                onClick={() =>
                                    router.visit(route("tasks.create"))
                                }
                            >
                                <PlusIcon className="h-5 w-5 mr-2" />
                                New Task
                            </Button>
                        )}
                    </div>
                </div>
            }
        >
            <Head title="Task Board" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Statistics */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="text-sm text-gray-600">
                                Total Tasks
                            </div>
                            <div className="text-2xl font-bold text-gray-900">
                                {tasks.length}
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="text-sm text-gray-600">To Do</div>
                            <div className="text-2xl font-bold text-gray-600">
                                {columns.pending.tasks.length}
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="text-sm text-gray-600">
                                In Progress
                            </div>
                            <div className="text-2xl font-bold text-blue-600">
                                {columns.in_progress.tasks.length}
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4">
                            <div className="text-sm text-gray-600">
                                Completed
                            </div>
                            <div className="text-2xl font-bold text-green-600">
                                {columns.completed.tasks.length}
                            </div>
                        </div>
                    </div>

                    {/* Kanban Board */}
                    <DragDropContext onDragEnd={handleDragEnd}>
                        <div className="grid grid-cols-3 gap-6">
                            {Object.entries(columns).map(
                                ([columnId, column]) => (
                                    <div
                                        key={columnId}
                                        className="bg-gray-50 rounded-lg p-4"
                                    >
                                        {/* Column Header */}
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-semibold text-gray-900 flex items-center">
                                                {column.title}
                                                <span className="ml-2 bg-gray-200 text-gray-700 text-xs font-medium px-2 py-1 rounded-full">
                                                    {column.tasks.length}
                                                </span>
                                            </h3>
                                        </div>

                                        {/* Droppable Column */}
                                        <Droppable droppableId={columnId}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.droppableProps}
                                                    className={`min-h-[500px] ${
                                                        snapshot.isDraggingOver
                                                            ? "bg-blue-50 rounded-lg"
                                                            : ""
                                                    }`}
                                                >
                                                    {column.tasks.map(
                                                        (task, index) => (
                                                            <TaskCard
                                                                key={task.id}
                                                                task={task}
                                                                index={index}
                                                            />
                                                        )
                                                    )}
                                                    {provided.placeholder}

                                                    {column.tasks.length ===
                                                        0 && (
                                                        <div className="text-center py-12 text-gray-400">
                                                            <p className="text-sm">
                                                                No tasks
                                                            </p>
                                                            <p className="text-xs mt-1">
                                                                Drag tasks here
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </Droppable>
                                    </div>
                                )
                            )}
                        </div>
                    </DragDropContext>
                </div>
            </div>

            {/* Task Detail Modal */}
            <Modal
                show={showTaskModal}
                onClose={() => {
                    setShowTaskModal(false);
                    setSelectedTask(null);
                }}
                title={selectedTask?.title}
                maxWidth="2xl"
            >
                {selectedTask && (
                    <div className="space-y-4">
                        {/* Priority and Status */}
                        <div className="flex items-center space-x-2">
                            {getPriorityBadge(selectedTask.priority)}
                            <span
                                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                    selectedTask.status === "pending"
                                        ? "bg-gray-100 text-gray-800"
                                        : selectedTask.status === "in_progress"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-green-100 text-green-800"
                                }`}
                            >
                                {selectedTask.status
                                    .replace("_", " ")
                                    .toUpperCase()}
                            </span>
                        </div>

                        {/* Description */}
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-2">
                                Description
                            </h4>
                            <p className="text-sm text-gray-600">
                                {selectedTask.description || "No description"}
                            </p>
                        </div>

                        {/* Details */}
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                            <div>
                                <h5 className="text-xs font-semibold text-gray-500 uppercase mb-1">
                                    Assigned To
                                </h5>
                                <div className="flex items-center">
                                    {selectedTask.assigned_user?.avatar ? (
                                        <img
                                            src={`/storage/${selectedTask.assigned_user.avatar}`}
                                            alt={
                                                selectedTask.assigned_user.name
                                            }
                                            className="h-8 w-8 rounded-full mr-2"
                                        />
                                    ) : (
                                        <UserCircleIcon className="h-8 w-8 mr-2 text-gray-400" />
                                    )}
                                    <span className="text-sm">
                                        {selectedTask.assigned_user?.name ||
                                            "Unassigned"}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <h5 className="text-xs font-semibold text-gray-500 uppercase mb-1">
                                    Assigned By
                                </h5>
                                <p className="text-sm">
                                    {selectedTask.assigned_by_user?.name || "-"}
                                </p>
                            </div>

                            <div>
                                <h5 className="text-xs font-semibold text-gray-500 uppercase mb-1">
                                    Department
                                </h5>
                                <p className="text-sm">
                                    {selectedTask.department?.name || "-"}
                                </p>
                            </div>

                            <div>
                                <h5 className="text-xs font-semibold text-gray-500 uppercase mb-1">
                                    Due Date
                                </h5>
                                <p className="text-sm">
                                    {selectedTask.due_date
                                        ? new Date(
                                              selectedTask.due_date
                                          ).toLocaleDateString()
                                        : "-"}
                                </p>
                            </div>

                            {selectedTask.completed_at && (
                                <div>
                                    <h5 className="text-xs font-semibold text-gray-500 uppercase mb-1">
                                        Completed At
                                    </h5>
                                    <p className="text-sm">
                                        {new Date(
                                            selectedTask.completed_at
                                        ).toLocaleDateString()}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Attachments */}
                        {selectedTask.attachments &&
                            selectedTask.attachments.length > 0 && (
                                <div className="pt-4 border-t">
                                    <h5 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                        Attachments
                                    </h5>
                                    <div className="space-y-2">
                                        {selectedTask.attachments.map(
                                            (attachment, index) => (
                                                <a
                                                    key={index}
                                                    href={attachment.url}
                                                    className="flex items-center text-sm text-indigo-600 hover:text-indigo-800"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    📎 {attachment.name}
                                                </a>
                                            )
                                        )}
                                    </div>
                                </div>
                            )}

                        {/* Actions */}
                        <div className="flex justify-end space-x-2 pt-4 border-t">
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setShowTaskModal(false);
                                    setSelectedTask(null);
                                }}
                            >
                                Close
                            </Button>
                            <Button
                                onClick={() =>
                                    router.visit(
                                        route("tasks.edit", selectedTask.id)
                                    )
                                }
                            >
                                Edit Task
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </AuthenticatedLayout>
    );
}
