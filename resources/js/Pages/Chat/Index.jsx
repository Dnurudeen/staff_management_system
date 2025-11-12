import { useState, useEffect, useRef } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, useForm } from "@inertiajs/react";
import Button from "@/Components/Button";
import VoiceRecorder from "@/Components/VoiceRecorder";
import FileUpload from "@/Components/FileUpload";
import Modal from "@/Components/Modal";
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
} from "@heroicons/react/24/outline";
import Echo from "laravel-echo";
import Pusher from "pusher-js";

export default function Chat({
    auth,
    conversations,
    activeConversation,
    messages,
}) {
    const [selectedConversation, setSelectedConversation] =
        useState(activeConversation);
    const [conversationMessages, setConversationMessages] = useState(
        messages || []
    );
    const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
    const [showFileUpload, setShowFileUpload] = useState(false);
    const [showNewChat, setShowNewChat] = useState(false);
    const [typingUsers, setTypingUsers] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const messagesEndRef = useRef(null);
    const [echo, setEcho] = useState(null);

    const { data, setData, post, reset, processing } = useForm({
        message: "",
        type: "text",
        file: null,
        voice: null,
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
            echo.private(`conversation.${selectedConversation.id}`)
                .listen("MessageSent", (e) => {
                    setConversationMessages((prev) => [...prev, e.message]);
                    scrollToBottom();
                })
                .listenForWhisper("typing", (e) => {
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
        }

        return () => {
            if (selectedConversation && echo) {
                echo.leave(`conversation.${selectedConversation.id}`);
            }
        };
    }, [selectedConversation, echo]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [conversationMessages]);

    const handleSendMessage = (e) => {
        e.preventDefault();

        if (!data.message.trim() && !data.file && !data.voice) return;

        const formData = new FormData();
        formData.append("type", data.type);

        if (data.type === "text") {
            formData.append("content", data.message);
        } else if (data.type === "file" && data.file) {
            formData.append("file", data.file);
        } else if (data.type === "voice" && data.voice) {
            formData.append("voice", data.voice);
        }

        post(route("messages.store", selectedConversation.id), {
            data: formData,
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setShowVoiceRecorder(false);
                setShowFileUpload(false);
            },
        });
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
        setData("voice", blob);
        setData("type", "voice");
        // Auto-submit voice note
        const formData = new FormData();
        formData.append("type", "voice");
        formData.append("voice", blob);
        formData.append("duration", duration);

        post(route("messages.store", selectedConversation.id), {
            data: formData,
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setShowVoiceRecorder(false);
            },
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
                                                            {message.type ===
                                                                "text" && (
                                                                <p className="text-sm">
                                                                    {
                                                                        message.content
                                                                    }
                                                                </p>
                                                            )}
                                                            {message.type ===
                                                                "file" && (
                                                                <div className="flex items-center space-x-2">
                                                                    <PaperClipIcon className="h-5 w-5" />
                                                                    <a
                                                                        href={`/storage/${message.file_path}`}
                                                                        download
                                                                        className="text-sm underline"
                                                                    >
                                                                        {
                                                                            message.file_name
                                                                        }
                                                                    </a>
                                                                </div>
                                                            )}
                                                            {message.type ===
                                                                "voice" && (
                                                                <audio
                                                                    controls
                                                                    className="w-full"
                                                                >
                                                                    <source
                                                                        src={`/storage/${message.file_path}`}
                                                                        type="audio/wav"
                                                                    />
                                                                </audio>
                                                            )}
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
        </AuthenticatedLayout>
    );
}
