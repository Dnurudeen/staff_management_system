import { useState, useEffect, useRef } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, useForm } from "@inertiajs/react";
import Button from "@/Components/Button";
import VoiceRecorder from "@/Components/VoiceRecorder";
import FileUpload from "@/Components/FileUpload";
import Modal from "@/Components/Modal";
import axios from "axios";
import {
    PaperAirplaneIcon,
    MicrophoneIcon,
    PaperClipIcon,
    FaceSmileIcon,
    MagnifyingGlassIcon,
    PlusIcon,
    EllipsisVerticalIcon,
    PhoneIcon,
    VideoCameraIcon,
    ArrowDownTrayIcon,
    PlayIcon,
    PauseIcon,
    DocumentIcon,
    PhotoIcon,
    FilmIcon,
    DocumentTextIcon,
} from "@heroicons/react/24/outline";
import Echo from "laravel-echo";
import Pusher from "pusher-js";

export default function Chat({
    auth,
    conversations,
    activeConversation,
    messages,
    users = [],
}) {
    const [selectedConversation, setSelectedConversation] =
        useState(activeConversation);
    const [conversationMessages, setConversationMessages] = useState(
        messages || []
    );
    const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
    const [showFileUpload, setShowFileUpload] = useState(false);
    const [showNewChat, setShowNewChat] = useState(false);
    const [chatType, setChatType] = useState("private"); // 'private' or 'group'
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [groupName, setGroupName] = useState("");
    const [groupDescription, setGroupDescription] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [typingUsers, setTypingUsers] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const messagesEndRef = useRef(null);
    const [echo, setEcho] = useState(null);
    const [isCreatingChat, setIsCreatingChat] = useState(false);
    const [playingVoiceId, setPlayingVoiceId] = useState(null);
    const [showFilePreview, setShowFilePreview] = useState(false);
    const [previewFile, setPreviewFile] = useState(null);

    const { data, setData, post, reset, processing } = useForm({
        message: "",
        type: "text",
        file: null,
        voice: null,
        voice_duration: null,
    });

    // Initialize Laravel Echo
    useEffect(() => {
        window.Pusher = Pusher;

        const echoInstance = new Echo({
            broadcaster: "reverb",
            key: import.meta.env.VITE_REVERB_APP_KEY,
            wsHost: import.meta.env.VITE_REVERB_HOST,
            wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
            wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
            forceTLS:
                (import.meta.env.VITE_REVERB_SCHEME ?? "https") === "https",
            enabledTransports: ["ws", "wss"],
        });

        setEcho(echoInstance);

        // Join presence channel
        echoInstance
            .join("online")
            .here((users) => {
                setOnlineUsers(users.map((u) => u.id));
            })
            .joining((user) => {
                setOnlineUsers((prev) => [...prev, user.id]);
            })
            .leaving((user) => {
                setOnlineUsers((prev) => prev.filter((id) => id !== user.id));
            });

        return () => {
            echoInstance.leave("online");
        };
    }, []);

    // Listen for new messages
    useEffect(() => {
        if (selectedConversation && echo) {
            const channel = echo.private(
                `conversation.${selectedConversation.id}`
            );

            // Listen for new messages from other users
            channel.listen("MessageSent", (e) => {
                console.log("New message received:", e.message);
                // Check if message already exists (prevent duplicates)
                setConversationMessages((prev) => {
                    const exists = prev.some((msg) => msg.id === e.message.id);
                    if (exists) return prev;
                    return [...prev, e.message];
                });
                scrollToBottom();
            });

            // Listen for typing indicators
            channel.listenForWhisper("typing", (e) => {
                if (e.userId !== auth.user.id) {
                    setTypingUsers((prev) => {
                        if (!prev.includes(e.userId)) {
                            return [...prev, e.userId];
                        }
                        return prev;
                    });

                    setTimeout(() => {
                        setTypingUsers((prev) =>
                            prev.filter((id) => id !== e.userId)
                        );
                    }, 3000);
                }
            });

            return () => {
                channel.stopListening("MessageSent");
                echo.leave(`conversation.${selectedConversation.id}`);
            };
        }
    }, [selectedConversation, echo, auth.user.id]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [conversationMessages]);

    const handleSendMessage = (e) => {
        e.preventDefault();

        if (!data.message.trim() && !data.file && !data.voice) return;

        if (data.type === "text") {
            // Send text message using axios
            axios
                .post(route("messages.store", selectedConversation.id), {
                    type: "text",
                    content: data.message,
                })
                .then((response) => {
                    // Add message to local state
                    setConversationMessages((prev) => [
                        ...prev,
                        response.data.message,
                    ]);
                    reset();
                    scrollToBottom();
                })
                .catch((error) => {
                    console.error("Error sending message:", error);
                    alert("Failed to send message. Please try again.");
                });
        } else if (data.type === "file" && data.file) {
            // Send file message using FormData
            const formData = new FormData();
            formData.append("type", "file");
            formData.append("file", data.file);

            axios
                .post(
                    route("messages.store", selectedConversation.id),
                    formData,
                    {
                        headers: { "Content-Type": "multipart/form-data" },
                    }
                )
                .then((response) => {
                    setConversationMessages((prev) => [
                        ...prev,
                        response.data.message,
                    ]);
                    reset();
                    setShowFileUpload(false);
                    scrollToBottom();
                })
                .catch((error) => {
                    console.error("Error sending file:", error);
                    alert("Failed to send file. Please try again.");
                });
        } else if (data.type === "voice" && data.voice) {
            // Send voice message using FormData
            const formData = new FormData();
            formData.append("type", "voice");
            formData.append("file", data.voice, "voice-note.wav");
            if (data.voice_duration) {
                formData.append("voice_duration", data.voice_duration);
            }

            axios
                .post(
                    route("messages.store", selectedConversation.id),
                    formData,
                    {
                        headers: { "Content-Type": "multipart/form-data" },
                    }
                )
                .then((response) => {
                    setConversationMessages((prev) => [
                        ...prev,
                        response.data.message,
                    ]);
                    reset();
                    setShowVoiceRecorder(false);
                    scrollToBottom();
                })
                .catch((error) => {
                    console.error("Error sending voice note:", error);
                    alert("Failed to send voice note. Please try again.");
                });
        }
    };

    const handleTyping = () => {
        if (selectedConversation && echo) {
            echo.private(`conversation.${selectedConversation.id}`).whisper(
                "typing",
                {
                    userId: auth.user.id,
                    userName: auth.user.name,
                }
            );
        }
    };

    const handleVoiceNote = (blob, duration) => {
        // Auto-submit voice note using axios
        const formData = new FormData();
        formData.append("type", "voice");
        formData.append("file", blob, "voice-note.wav");
        if (duration) {
            formData.append("voice_duration", duration);
        }

        axios
            .post(route("messages.store", selectedConversation.id), formData, {
                headers: { "Content-Type": "multipart/form-data" },
            })
            .then((response) => {
                setConversationMessages((prev) => [
                    ...prev,
                    response.data.message,
                ]);
                reset();
                setShowVoiceRecorder(false);
                scrollToBottom();
            })
            .catch((error) => {
                console.error("Error sending voice note:", error);
                alert("Failed to send voice note. Please try again.");
            });
    };

    const handleFileSelect = (file) => {
        setData("file", file);
        setData("type", "file");
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const isOnline = (userId) => onlineUsers.includes(userId);

    const handleCreatePrivateChat = async (userId) => {
        setIsCreatingChat(true);
        try {
            const response = await axios.post(
                route("conversations.create-private"),
                { user_id: userId }
            );
            setShowNewChat(false);
            router.visit(
                route("conversations.show", response.data.conversation.id)
            );
        } catch (error) {
            console.error("Error creating private chat:", error);
            alert("Failed to create chat. Please try again.");
        } finally {
            setIsCreatingChat(false);
        }
    };

    const handleCreateGroupChat = async () => {
        if (!groupName.trim()) {
            alert("Please enter a group name");
            return;
        }
        if (selectedUsers.length === 0) {
            alert("Please select at least one participant");
            return;
        }

        setIsCreatingChat(true);
        try {
            const response = await axios.post(
                route("conversations.create-group"),
                {
                    name: groupName,
                    description: groupDescription,
                    participant_ids: selectedUsers,
                }
            );
            setShowNewChat(false);
            setGroupName("");
            setGroupDescription("");
            setSelectedUsers([]);
            router.visit(
                route("conversations.show", response.data.conversation.id)
            );
        } catch (error) {
            console.error("Error creating group chat:", error);
            alert("Failed to create group. Please try again.");
        } finally {
            setIsCreatingChat(false);
        }
    };

    const toggleUserSelection = (userId) => {
        setSelectedUsers((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId]
        );
    };

    const filteredUsers = users.filter(
        (user) =>
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Helper function to check if file is an image
    const isImage = (fileType) => {
        return fileType && fileType.startsWith("image/");
    };

    // Helper function to check if file is a video
    const isVideo = (fileType) => {
        return fileType && fileType.startsWith("video/");
    };

    // Helper function to check if file is a PDF
    const isPDF = (fileType) => {
        return fileType === "application/pdf";
    };

    // Helper function to format file size
    const formatFileSize = (bytes) => {
        if (!bytes) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return (
            Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
        );
    };

    // Helper function to format voice duration
    const formatDuration = (seconds) => {
        if (!seconds) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Messages
                </h2>
            }
        >
            <Head title="Chat" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div
                        className="bg-white overflow-hidden shadow-sm sm:rounded-lg"
                        style={{ height: "calc(100vh - 200px)" }}
                    >
                        <div className="flex h-full">
                            {/* Conversations Sidebar */}
                            <div className="w-1/3 border-r border-gray-200 flex flex-col">
                                {/* Header */}
                                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                                    <h3 className="text-lg font-semibold">
                                        Chats
                                    </h3>
                                    <Button
                                        size="sm"
                                        onClick={() => setShowNewChat(true)}
                                    >
                                        <PlusIcon className="h-5 w-5" />
                                    </Button>
                                </div>

                                {/* Search */}
                                <div className="p-4 border-b border-gray-200">
                                    <div className="relative">
                                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search conversations..."
                                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                </div>

                                {/* Conversation List */}
                                <div className="flex-1 overflow-y-auto">
                                    {conversations.map((conversation) => {
                                        const otherUser =
                                            conversation.type === "private"
                                                ? conversation.participants.find(
                                                      (p) =>
                                                          p.id !== auth.user.id
                                                  )
                                                : null;
                                        const displayName =
                                            conversation.type === "group"
                                                ? conversation.name
                                                : otherUser?.name;
                                        const isUserOnline = otherUser
                                            ? isOnline(otherUser.id)
                                            : false;

                                        return (
                                            <div
                                                key={conversation.id}
                                                onClick={() => {
                                                    setSelectedConversation(
                                                        conversation
                                                    );
                                                    router.visit(
                                                        route(
                                                            "conversations.show",
                                                            conversation.id
                                                        ),
                                                        {
                                                            preserveScroll: true,
                                                        }
                                                    );
                                                }}
                                                className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                                                    selectedConversation?.id ===
                                                    conversation.id
                                                        ? "bg-indigo-50"
                                                        : ""
                                                }`}
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <div className="relative flex-shrink-0">
                                                        {conversation.avatar ||
                                                        otherUser?.avatar ? (
                                                            <img
                                                                src={`/storage/${
                                                                    conversation.avatar ||
                                                                    otherUser?.avatar
                                                                }`}
                                                                alt={
                                                                    displayName
                                                                }
                                                                className="h-12 w-12 rounded-full"
                                                            />
                                                        ) : (
                                                            <div className="h-12 w-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-lg">
                                                                {displayName
                                                                    ?.charAt(0)
                                                                    .toUpperCase()}
                                                            </div>
                                                        )}
                                                        {isUserOnline && (
                                                            <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-400 ring-2 ring-white"></span>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {displayName}
                                                        </p>
                                                        <p className="text-sm text-gray-500 truncate">
                                                            {conversation
                                                                .last_message
                                                                ?.content ||
                                                                "No messages yet"}
                                                        </p>
                                                    </div>
                                                    <div className="text-xs text-gray-400">
                                                        {conversation.last_message_at &&
                                                            formatTime(
                                                                conversation.last_message_at
                                                            )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Chat Area */}
                            {selectedConversation ? (
                                <div className="flex-1 flex flex-col">
                                    {/* Chat Header */}
                                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="relative">
                                                {selectedConversation.avatar ? (
                                                    <img
                                                        src={`/storage/${selectedConversation.avatar}`}
                                                        alt={
                                                            selectedConversation.name
                                                        }
                                                        className="h-10 w-10 rounded-full"
                                                    />
                                                ) : (
                                                    <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
                                                        {selectedConversation.name
                                                            ?.charAt(0)
                                                            .toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-semibold text-gray-900">
                                                    {selectedConversation.name}
                                                </h3>
                                                <p className="text-xs text-gray-500">
                                                    {selectedConversation.type ===
                                                    "group"
                                                        ? `${selectedConversation.participants.length} members`
                                                        : isOnline(
                                                              selectedConversation.participants.find(
                                                                  (p) =>
                                                                      p.id !==
                                                                      auth.user
                                                                          .id
                                                              )?.id
                                                          )
                                                        ? "Online"
                                                        : "Offline"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Button variant="ghost" size="sm">
                                                <PhoneIcon className="h-5 w-5" />
                                            </Button>
                                            <Button variant="ghost" size="sm">
                                                <VideoCameraIcon className="h-5 w-5" />
                                            </Button>
                                            <Button variant="ghost" size="sm">
                                                <EllipsisVerticalIcon className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Messages */}
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                        {conversationMessages.map((message) => {
                                            const isOwnMessage =
                                                message.user_id ===
                                                auth.user.id;

                                            return (
                                                <div
                                                    key={message.id}
                                                    className={`flex ${
                                                        isOwnMessage
                                                            ? "justify-end"
                                                            : "justify-start"
                                                    }`}
                                                >
                                                    <div
                                                        className={`max-w-xs lg:max-w-md ${
                                                            isOwnMessage
                                                                ? "order-2"
                                                                : "order-1"
                                                        }`}
                                                    >
                                                        {!isOwnMessage &&
                                                            selectedConversation.type ===
                                                                "group" && (
                                                                <p className="text-xs text-gray-500 mb-1 ml-2">
                                                                    {
                                                                        message
                                                                            .user
                                                                            .name
                                                                    }
                                                                </p>
                                                            )}
                                                        <div
                                                            className={`rounded-lg px-4 py-2 ${
                                                                isOwnMessage
                                                                    ? "bg-indigo-600 text-white"
                                                                    : "bg-gray-100 text-gray-900"
                                                            }`}
                                                        >
                                                            {/* Text Message */}
                                                            {message.type ===
                                                                "text" && (
                                                                <p className="text-sm whitespace-pre-wrap break-words">
                                                                    {
                                                                        message.content
                                                                    }
                                                                </p>
                                                            )}

                                                            {/* File Message with Thumbnail */}
                                                            {message.type ===
                                                                "file" && (
                                                                <div className="space-y-2">
                                                                    {/* Image Preview */}
                                                                    {isImage(
                                                                        message.file_type
                                                                    ) && (
                                                                        <div className="relative group">
                                                                            <img
                                                                                src={`/storage/${message.file_path}`}
                                                                                alt={
                                                                                    message.file_name
                                                                                }
                                                                                className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                                                                onClick={() => {
                                                                                    setPreviewFile(
                                                                                        message
                                                                                    );
                                                                                    setShowFilePreview(
                                                                                        true
                                                                                    );
                                                                                }}
                                                                            />
                                                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all flex items-center justify-center">
                                                                                <PhotoIcon className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {/* Video Preview */}
                                                                    {isVideo(
                                                                        message.file_type
                                                                    ) && (
                                                                        <div className="relative">
                                                                            <video
                                                                                src={`/storage/${message.file_path}`}
                                                                                controls
                                                                                className="max-w-xs rounded-lg"
                                                                            />
                                                                        </div>
                                                                    )}

                                                                    {/* PDF Preview */}
                                                                    {isPDF(
                                                                        message.file_type
                                                                    ) && (
                                                                        <div className="flex items-center space-x-3 p-3 bg-white bg-opacity-10 rounded-lg">
                                                                            <div className="flex-shrink-0">
                                                                                <DocumentTextIcon
                                                                                    className={`h-10 w-10 ${
                                                                                        isOwnMessage
                                                                                            ? "text-indigo-200"
                                                                                            : "text-red-500"
                                                                                    }`}
                                                                                />
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className="text-sm font-medium truncate">
                                                                                    {
                                                                                        message.file_name
                                                                                    }
                                                                                </p>
                                                                                <p
                                                                                    className={`text-xs ${
                                                                                        isOwnMessage
                                                                                            ? "text-indigo-200"
                                                                                            : "text-gray-500"
                                                                                    }`}
                                                                                >
                                                                                    {formatFileSize(
                                                                                        message.file_size
                                                                                    )}
                                                                                </p>
                                                                            </div>
                                                                            <a
                                                                                href={`/storage/${message.file_path}`}
                                                                                download
                                                                                className="flex-shrink-0"
                                                                            >
                                                                                <ArrowDownTrayIcon
                                                                                    className={`h-5 w-5 ${
                                                                                        isOwnMessage
                                                                                            ? "text-white hover:text-indigo-200"
                                                                                            : "text-gray-600 hover:text-gray-900"
                                                                                    }`}
                                                                                />
                                                                            </a>
                                                                        </div>
                                                                    )}

                                                                    {/* Other Files */}
                                                                    {!isImage(
                                                                        message.file_type
                                                                    ) &&
                                                                        !isVideo(
                                                                            message.file_type
                                                                        ) &&
                                                                        !isPDF(
                                                                            message.file_type
                                                                        ) && (
                                                                            <div className="flex items-center space-x-3 p-3 bg-white bg-opacity-10 rounded-lg">
                                                                                <div className="flex-shrink-0">
                                                                                    <DocumentIcon
                                                                                        className={`h-10 w-10 ${
                                                                                            isOwnMessage
                                                                                                ? "text-indigo-200"
                                                                                                : "text-gray-500"
                                                                                        }`}
                                                                                    />
                                                                                </div>
                                                                                <div className="flex-1 min-w-0">
                                                                                    <p className="text-sm font-medium truncate">
                                                                                        {
                                                                                            message.file_name
                                                                                        }
                                                                                    </p>
                                                                                    <p
                                                                                        className={`text-xs ${
                                                                                            isOwnMessage
                                                                                                ? "text-indigo-200"
                                                                                                : "text-gray-500"
                                                                                        }`}
                                                                                    >
                                                                                        {formatFileSize(
                                                                                            message.file_size
                                                                                        )}
                                                                                    </p>
                                                                                </div>
                                                                                <a
                                                                                    href={`/storage/${message.file_path}`}
                                                                                    download
                                                                                    className="flex-shrink-0"
                                                                                >
                                                                                    <ArrowDownTrayIcon
                                                                                        className={`h-5 w-5 ${
                                                                                            isOwnMessage
                                                                                                ? "text-white hover:text-indigo-200"
                                                                                                : "text-gray-600 hover:text-gray-900"
                                                                                        }`}
                                                                                    />
                                                                                </a>
                                                                            </div>
                                                                        )}
                                                                </div>
                                                            )}

                                                            {/* Voice Note with Modern Player */}
                                                            {message.type ===
                                                                "voice" && (
                                                                <div className="flex items-center space-x-3 min-w-[250px]">
                                                                    {/* Play/Pause Button */}
                                                                    <button
                                                                        onClick={() => {
                                                                            const audio =
                                                                                document.getElementById(
                                                                                    `audio-${message.id}`
                                                                                );
                                                                            if (
                                                                                playingVoiceId ===
                                                                                message.id
                                                                            ) {
                                                                                audio.pause();
                                                                                setPlayingVoiceId(
                                                                                    null
                                                                                );
                                                                            } else {
                                                                                // Pause any currently playing audio
                                                                                if (
                                                                                    playingVoiceId
                                                                                ) {
                                                                                    document
                                                                                        .getElementById(
                                                                                            `audio-${playingVoiceId}`
                                                                                        )
                                                                                        ?.pause();
                                                                                }
                                                                                audio.play();
                                                                                setPlayingVoiceId(
                                                                                    message.id
                                                                                );
                                                                            }
                                                                        }}
                                                                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                                                                            isOwnMessage
                                                                                ? "bg-white bg-opacity-20 hover:bg-opacity-30"
                                                                                : "bg-indigo-600 hover:bg-indigo-700"
                                                                        }`}
                                                                    >
                                                                        {playingVoiceId ===
                                                                        message.id ? (
                                                                            <PauseIcon
                                                                                className={`h-5 w-5 ${
                                                                                    isOwnMessage
                                                                                        ? "text-white"
                                                                                        : "text-white"
                                                                                }`}
                                                                            />
                                                                        ) : (
                                                                            <PlayIcon
                                                                                className={`h-5 w-5 ${
                                                                                    isOwnMessage
                                                                                        ? "text-white"
                                                                                        : "text-white"
                                                                                }`}
                                                                            />
                                                                        )}
                                                                    </button>

                                                                    {/* Waveform Visualization (Simulated) */}
                                                                    <div className="flex-1 flex items-center space-x-1">
                                                                        {[
                                                                            ...Array(
                                                                                20
                                                                            ),
                                                                        ].map(
                                                                            (
                                                                                _,
                                                                                i
                                                                            ) => (
                                                                                <div
                                                                                    key={
                                                                                        i
                                                                                    }
                                                                                    className={`w-1 rounded-full transition-all ${
                                                                                        isOwnMessage
                                                                                            ? "bg-white bg-opacity-60"
                                                                                            : "bg-indigo-600"
                                                                                    }`}
                                                                                    style={{
                                                                                        height: `${
                                                                                            Math.random() *
                                                                                                16 +
                                                                                            8
                                                                                        }px`,
                                                                                    }}
                                                                                ></div>
                                                                            )
                                                                        )}
                                                                    </div>

                                                                    {/* Duration */}
                                                                    <span
                                                                        className={`text-xs font-medium ${
                                                                            isOwnMessage
                                                                                ? "text-indigo-100"
                                                                                : "text-gray-600"
                                                                        }`}
                                                                    >
                                                                        {formatDuration(
                                                                            message.voice_duration
                                                                        )}
                                                                    </span>

                                                                    {/* Hidden Audio Element */}
                                                                    <audio
                                                                        id={`audio-${message.id}`}
                                                                        src={`/storage/${message.file_path}`}
                                                                        onEnded={() =>
                                                                            setPlayingVoiceId(
                                                                                null
                                                                            )
                                                                        }
                                                                        className="hidden"
                                                                    />
                                                                </div>
                                                            )}

                                                            {/* Timestamp */}
                                                            <p
                                                                className={`text-xs mt-1 ${
                                                                    isOwnMessage
                                                                        ? "text-indigo-100"
                                                                        : "text-gray-500"
                                                                }`}
                                                            >
                                                                {formatTime(
                                                                    message.created_at
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {typingUsers.length > 0 && (
                                            <div className="flex justify-start">
                                                <div className="bg-gray-100 rounded-lg px-4 py-2">
                                                    <div className="flex space-x-1">
                                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                                        <div
                                                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                                            style={{
                                                                animationDelay:
                                                                    "0.1s",
                                                            }}
                                                        ></div>
                                                        <div
                                                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                                            style={{
                                                                animationDelay:
                                                                    "0.2s",
                                                            }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Message Input */}
                                    <div className="p-4 border-t border-gray-200">
                                        {showVoiceRecorder ? (
                                            <VoiceRecorder
                                                onRecordingComplete={
                                                    handleVoiceNote
                                                }
                                            />
                                        ) : showFileUpload ? (
                                            <div>
                                                <FileUpload
                                                    label="Upload File"
                                                    onFileSelect={
                                                        handleFileSelect
                                                    }
                                                    maxSize={10485760}
                                                />
                                                {data.file && (
                                                    <div className="mt-2 flex space-x-2">
                                                        <Button
                                                            onClick={
                                                                handleSendMessage
                                                            }
                                                        >
                                                            Send File
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            onClick={() =>
                                                                setShowFileUpload(
                                                                    false
                                                                )
                                                            }
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <form
                                                onSubmit={handleSendMessage}
                                                className="flex items-center space-x-2"
                                            >
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        setShowFileUpload(true)
                                                    }
                                                >
                                                    <PaperClipIcon className="h-5 w-5" />
                                                </Button>
                                                <input
                                                    type="text"
                                                    value={data.message}
                                                    onChange={(e) => {
                                                        setData(
                                                            "message",
                                                            e.target.value
                                                        );
                                                        handleTyping();
                                                    }}
                                                    placeholder="Type a message..."
                                                    className="flex-1 rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        setShowVoiceRecorder(
                                                            true
                                                        )
                                                    }
                                                >
                                                    <MicrophoneIcon className="h-5 w-5" />
                                                </Button>
                                                <Button
                                                    type="submit"
                                                    disabled={
                                                        processing ||
                                                        !data.message.trim()
                                                    }
                                                >
                                                    <PaperAirplaneIcon className="h-5 w-5" />
                                                </Button>
                                            </form>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-gray-500">
                                    <p>
                                        Select a conversation to start chatting
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* New Chat Modal */}
            <Modal
                show={showNewChat}
                onClose={() => setShowNewChat(false)}
                maxWidth="2xl"
                title="New Chat"
            >
                {/* Chat Type Selector */}
                <div className="flex space-x-4 mb-6">
                    <button
                        onClick={() => setChatType("private")}
                        className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                            chatType === "private"
                                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                                : "border-gray-300 hover:border-gray-400"
                        }`}
                    >
                        <div className="font-semibold">Private Chat</div>
                        <div className="text-sm text-gray-600">
                            One-on-one conversation
                        </div>
                    </button>
                    <button
                        onClick={() => setChatType("group")}
                        className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                            chatType === "group"
                                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                                : "border-gray-300 hover:border-gray-400"
                        }`}
                    >
                        <div className="font-semibold">Group Chat</div>
                        <div className="text-sm text-gray-600">
                            Multiple participants
                        </div>
                    </button>
                </div>

                {/* Group Name (only for group chats) */}
                {chatType === "group" && (
                    <div className="mb-4 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Group Name *
                            </label>
                            <input
                                type="text"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                placeholder="Enter group name"
                                className="w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description (optional)
                            </label>
                            <textarea
                                value={groupDescription}
                                onChange={(e) =>
                                    setGroupDescription(e.target.value)
                                }
                                placeholder="Enter group description"
                                rows={2}
                                className="w-full rounded-lg border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                    </div>
                )}

                {/* Search Users */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        {chatType === "private"
                            ? "Select User"
                            : "Select Participants"}
                    </label>
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search users..."
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                </div>

                {/* User List */}
                <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                    {filteredUsers.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No users found
                        </div>
                    ) : (
                        filteredUsers.map((user) => (
                            <div
                                key={user.id}
                                onClick={() => {
                                    if (chatType === "private") {
                                        handleCreatePrivateChat(user.id);
                                    } else {
                                        toggleUserSelection(user.id);
                                    }
                                }}
                                className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                                    chatType === "group" &&
                                    selectedUsers.includes(user.id)
                                        ? "bg-indigo-50"
                                        : ""
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="relative flex-shrink-0">
                                        {user.avatar ? (
                                            <img
                                                src={`/storage/${user.avatar}`}
                                                alt={user.name}
                                                className="h-10 w-10 rounded-full"
                                            />
                                        ) : (
                                            <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
                                                {user.name
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </div>
                                        )}
                                        {isOnline(user.id) && (
                                            <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-400 ring-2 ring-white"></span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {user.name}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
                                            {user.email}
                                            {user.department && (
                                                <span className="ml-2">
                                                    • {user.department.name}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    {chatType === "group" && (
                                        <div>
                                            {selectedUsers.includes(user.id) ? (
                                                <div className="h-5 w-5 rounded bg-indigo-600 flex items-center justify-center">
                                                    <svg
                                                        className="h-3 w-3 text-white"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M5 13l4 4L19 7"
                                                        />
                                                    </svg>
                                                </div>
                                            ) : (
                                                <div className="h-5 w-5 rounded border-2 border-gray-300"></div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Action Buttons */}
                {chatType === "group" && (
                    <div className="mt-6 flex justify-end space-x-3">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setShowNewChat(false);
                                setGroupName("");
                                setGroupDescription("");
                                setSelectedUsers([]);
                                setSearchQuery("");
                            }}
                            disabled={isCreatingChat}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateGroupChat}
                            disabled={
                                isCreatingChat ||
                                !groupName.trim() ||
                                selectedUsers.length === 0
                            }
                        >
                            {isCreatingChat ? "Creating..." : "Create Group"}
                        </Button>
                    </div>
                )}
            </Modal>

            {/* File Preview Modal */}
            <Modal
                show={showFilePreview}
                onClose={() => {
                    setShowFilePreview(false);
                    setPreviewFile(null);
                }}
                maxWidth="4xl"
                title={previewFile?.file_name}
            >
                {previewFile && (
                    <>
                        <div className="flex items-center justify-end mb-4">
                            <a
                                href={`/storage/${previewFile.file_path}`}
                                download
                                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                                Download
                            </a>
                        </div>

                        {/* Preview Content */}
                        <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center min-h-[400px]">
                            {isImage(previewFile.file_type) && (
                                <img
                                    src={`/storage/${previewFile.file_path}`}
                                    alt={previewFile.file_name}
                                    className="max-w-full max-h-[600px] rounded-lg shadow-lg"
                                />
                            )}
                            {isVideo(previewFile.file_type) && (
                                <video
                                    src={`/storage/${previewFile.file_path}`}
                                    controls
                                    className="max-w-full max-h-[600px] rounded-lg shadow-lg"
                                />
                            )}
                            {isPDF(previewFile.file_type) && (
                                <iframe
                                    src={`/storage/${previewFile.file_path}`}
                                    className="w-full h-[600px] rounded-lg"
                                    title={previewFile.file_name}
                                />
                            )}
                        </div>

                        {/* File Info */}
                        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="font-medium text-gray-700">
                                    File Size:
                                </span>
                                <span className="ml-2 text-gray-600">
                                    {formatFileSize(previewFile.file_size)}
                                </span>
                            </div>
                            <div>
                                <span className="font-medium text-gray-700">
                                    Type:
                                </span>
                                <span className="ml-2 text-gray-600">
                                    {previewFile.file_type}
                                </span>
                            </div>
                            <div>
                                <span className="font-medium text-gray-700">
                                    Uploaded by:
                                </span>
                                <span className="ml-2 text-gray-600">
                                    {previewFile.user?.name || "Unknown"}
                                </span>
                            </div>
                            <div>
                                <span className="font-medium text-gray-700">
                                    Date:
                                </span>
                                <span className="ml-2 text-gray-600">
                                    {new Date(
                                        previewFile.created_at
                                    ).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </>
                )}
            </Modal>
        </AuthenticatedLayout>
    );
}
