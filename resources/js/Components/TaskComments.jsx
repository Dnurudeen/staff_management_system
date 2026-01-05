import React, { useState, useRef, useEffect } from "react";
import { router } from "@inertiajs/react";
import axios from "axios";
import {
    ChatBubbleLeftIcon,
    PaperClipIcon,
    PaperAirplaneIcon,
    XMarkIcon,
    PhotoIcon,
    TrashIcon,
    PencilIcon,
    ArrowUturnLeftIcon,
    AtSymbolIcon,
    DocumentIcon,
} from "@heroicons/react/24/outline";

// Comment Input Component with Mentions
function CommentInput({
    taskId,
    parentId = null,
    users = [],
    onCommentAdded,
    onCancel,
    placeholder = "Write a comment...",
    autoFocus = false,
}) {
    const [content, setContent] = useState("");
    const [attachments, setAttachments] = useState([]);
    const [mentions, setMentions] = useState([]);
    const [showMentions, setShowMentions] = useState(false);
    const [mentionSearch, setMentionSearch] = useState("");
    const [mentionPosition, setMentionPosition] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (autoFocus && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [autoFocus]);

    const handleContentChange = (e) => {
        const value = e.target.value;
        const cursorPosition = e.target.selectionStart;
        setContent(value);

        // Check for @ mentions
        const textBeforeCursor = value.substring(0, cursorPosition);
        const lastAtIndex = textBeforeCursor.lastIndexOf("@");

        if (lastAtIndex !== -1) {
            const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
            // Check if there's no space after @ (user is typing a mention)
            if (!textAfterAt.includes(" ")) {
                setMentionSearch(textAfterAt.toLowerCase());
                setMentionPosition(lastAtIndex);
                setShowMentions(true);
                return;
            }
        }
        setShowMentions(false);
    };

    const handleMentionSelect = (user) => {
        const beforeMention = content.substring(0, mentionPosition);
        const afterMention = content.substring(
            mentionPosition + mentionSearch.length + 1
        );
        const newContent = `${beforeMention}@${user.name} ${afterMention}`;
        setContent(newContent);

        if (!mentions.includes(user.id)) {
            setMentions([...mentions, user.id]);
        }

        setShowMentions(false);
        textareaRef.current?.focus();
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        const validFiles = files.filter((file) => {
            const validTypes = [
                "image/jpeg",
                "image/png",
                "image/gif",
                "image/webp",
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ];
            return (
                validTypes.includes(file.type) && file.size <= 10 * 1024 * 1024
            );
        });

        if (validFiles.length + attachments.length > 5) {
            alert("Maximum 5 attachments allowed");
            return;
        }

        setAttachments([...attachments, ...validFiles]);
        e.target.value = "";
    };

    const removeAttachment = (index) => {
        setAttachments(attachments.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim() && attachments.length === 0) return;

        setSubmitting(true);

        const formData = new FormData();
        formData.append("content", content);
        if (parentId) {
            formData.append("parent_id", parentId);
        }
        mentions.forEach((id, index) => {
            formData.append(`mentions[${index}]`, id);
        });
        attachments.forEach((file, index) => {
            formData.append(`attachments[${index}]`, file);
        });

        try {
            const response = await axios.post(
                route("task-comments.store", taskId),
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            setContent("");
            setAttachments([]);
            setMentions([]);
            onCommentAdded?.(response.data.comment);
        } catch (error) {
            console.error("Error posting comment:", error);
            alert("Failed to post comment. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const filteredUsers = users.filter(
        (user) =>
            user.name.toLowerCase().includes(mentionSearch) ||
            user.email?.toLowerCase().includes(mentionSearch)
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={handleContentChange}
                    placeholder={placeholder}
                    rows={3}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm resize-none"
                    disabled={submitting}
                />

                {/* Mention Dropdown */}
                {showMentions && filteredUsers.length > 0 && (
                    <div className="absolute z-10 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 max-h-48 overflow-y-auto">
                        {filteredUsers.slice(0, 5).map((user) => (
                            <button
                                key={user.id}
                                type="button"
                                onClick={() => handleMentionSelect(user)}
                                className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-2"
                            >
                                {user.avatar ? (
                                    <img
                                        src={`/storage/${user.avatar}`}
                                        alt={user.name}
                                        className="h-6 w-6 rounded-full"
                                    />
                                ) : (
                                    <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center">
                                        <span className="text-xs font-medium text-indigo-600">
                                            {user.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                )}
                                <span className="text-sm text-gray-700">
                                    {user.name}
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Attachments Preview */}
            {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {attachments.map((file, index) => (
                        <div
                            key={index}
                            className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-1.5"
                        >
                            {file.type.startsWith("image/") ? (
                                <PhotoIcon className="h-4 w-4 text-gray-500" />
                            ) : (
                                <DocumentIcon className="h-4 w-4 text-gray-500" />
                            )}
                            <span className="text-xs text-gray-600 max-w-[100px] truncate">
                                {file.name}
                            </span>
                            <button
                                type="button"
                                onClick={() => removeAttachment(index)}
                                className="text-gray-400 hover:text-red-500"
                            >
                                <XMarkIcon className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*,.pdf,.doc,.docx"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Attach files"
                    >
                        <PaperClipIcon className="h-5 w-5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setContent(content + "@");
                            setShowMentions(true);
                            setMentionSearch("");
                            setMentionPosition(content.length);
                            textareaRef.current?.focus();
                        }}
                        className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Mention someone"
                    >
                        <AtSymbolIcon className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex items-center space-x-2">
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={
                            submitting ||
                            (!content.trim() && attachments.length === 0)
                        }
                        className="inline-flex items-center px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {submitting ? (
                            "Posting..."
                        ) : (
                            <>
                                <PaperAirplaneIcon className="h-4 w-4 mr-1" />
                                Post
                            </>
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
}

// Single Comment Component
function Comment({
    comment,
    taskId,
    users,
    currentUserId,
    onCommentDeleted,
    onCommentUpdated,
    onReplyAdded,
    depth = 0,
}) {
    const [showReplyInput, setShowReplyInput] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);
    const [showFullContent, setShowFullContent] = useState(false);
    const maxDepth = 3;

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this comment?")) return;

        try {
            await axios.delete(
                route("task-comments.destroy", [taskId, comment.id])
            );
            onCommentDeleted?.(comment.id);
        } catch (error) {
            console.error("Error deleting comment:", error);
            alert("Failed to delete comment. Please try again.");
        }
    };

    const handleUpdate = async () => {
        if (!editContent.trim()) return;

        try {
            const response = await axios.put(
                route("task-comments.update", [taskId, comment.id]),
                { content: editContent }
            );
            onCommentUpdated?.(response.data.comment);
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating comment:", error);
            alert("Failed to update comment. Please try again.");
        }
    };

    const handleReplyAdded = (newReply) => {
        setShowReplyInput(false);
        onReplyAdded?.(comment.id, newReply);
    };

    // Format content with mentions highlighted
    const formatContent = (text) => {
        // Simple @mention highlighting
        return text.replace(
            /@(\w+(?:\s+\w+)?)/g,
            '<span class="text-indigo-600 font-medium">@$1</span>'
        );
    };

    const isLongContent = comment.content.length > 300;
    const displayContent =
        isLongContent && !showFullContent
            ? comment.content.substring(0, 300) + "..."
            : comment.content;

    return (
        <div
            className={`${
                depth > 0 ? "ml-8 border-l-2 border-gray-100 pl-4" : ""
            }`}
        >
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                {/* Comment Header */}
                <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-3">
                        {comment.user?.avatar ? (
                            <img
                                src={`/storage/${comment.user.avatar}`}
                                alt={comment.user.name}
                                className="h-8 w-8 rounded-full"
                            />
                        ) : (
                            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-indigo-600">
                                    {comment.user?.name
                                        ?.charAt(0)
                                        .toUpperCase() || "?"}
                                </span>
                            </div>
                        )}
                        <div>
                            <span className="text-sm font-medium text-gray-900">
                                {comment.user?.name || "Unknown User"}
                            </span>
                            <span className="text-xs text-gray-500 ml-2">
                                {new Date(comment.created_at).toLocaleString()}
                            </span>
                            {comment.updated_at !== comment.created_at && (
                                <span className="text-xs text-gray-400 ml-1">
                                    (edited)
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    {comment.user_id === currentUserId && (
                        <div className="flex items-center space-x-1">
                            <button
                                onClick={() => setIsEditing(true)}
                                className="p-1 text-gray-400 hover:text-indigo-600 rounded"
                                title="Edit"
                            >
                                <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                                onClick={handleDelete}
                                className="p-1 text-gray-400 hover:text-red-600 rounded"
                                title="Delete"
                            >
                                <TrashIcon className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Comment Content */}
                {isEditing ? (
                    <div className="space-y-2">
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full rounded-lg border-gray-300 text-sm"
                            rows={3}
                        />
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    setEditContent(comment.content);
                                }}
                                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdate}
                                className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <p
                            className="text-sm text-gray-700 whitespace-pre-wrap"
                            dangerouslySetInnerHTML={{
                                __html: formatContent(displayContent),
                            }}
                        />
                        {isLongContent && (
                            <button
                                onClick={() =>
                                    setShowFullContent(!showFullContent)
                                }
                                className="text-xs text-indigo-600 hover:text-indigo-800 mt-1"
                            >
                                {showFullContent ? "Show less" : "Show more"}
                            </button>
                        )}
                    </div>
                )}

                {/* Attachments */}
                {comment.attachments && comment.attachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                        <p className="text-xs text-gray-500 font-medium">
                            Attachments:
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {comment.attachments.map((attachment, index) => (
                                <a
                                    key={index}
                                    href={`/storage/${attachment.path}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group relative"
                                >
                                    {attachment.type?.startsWith("image/") ? (
                                        <img
                                            src={`/storage/${attachment.path}`}
                                            alt={attachment.name}
                                            className="h-20 w-20 object-cover rounded-lg border border-gray-200 hover:border-indigo-500 transition-colors"
                                        />
                                    ) : (
                                        <div className="h-20 w-20 bg-gray-100 rounded-lg border border-gray-200 hover:border-indigo-500 transition-colors flex flex-col items-center justify-center p-2">
                                            <DocumentIcon className="h-8 w-8 text-gray-400" />
                                            <span className="text-xs text-gray-500 truncate w-full text-center mt-1">
                                                {attachment.name}
                                            </span>
                                        </div>
                                    )}
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* Reply Button */}
                {depth < maxDepth && !isEditing && (
                    <div className="mt-3 pt-2 border-t border-gray-100">
                        <button
                            onClick={() => setShowReplyInput(!showReplyInput)}
                            className="inline-flex items-center text-xs text-gray-500 hover:text-indigo-600 transition-colors"
                        >
                            <ArrowUturnLeftIcon className="h-3.5 w-3.5 mr-1" />
                            Reply
                        </button>
                    </div>
                )}
            </div>

            {/* Reply Input */}
            {showReplyInput && (
                <div className="mt-2 ml-8">
                    <CommentInput
                        taskId={taskId}
                        parentId={comment.id}
                        users={users}
                        onCommentAdded={handleReplyAdded}
                        onCancel={() => setShowReplyInput(false)}
                        placeholder="Write a reply..."
                        autoFocus
                    />
                </div>
            )}

            {/* Replies */}
            {comment.replies && comment.replies.length > 0 && (
                <div className="mt-3 space-y-3">
                    {comment.replies.map((reply) => (
                        <Comment
                            key={reply.id}
                            comment={reply}
                            taskId={taskId}
                            users={users}
                            currentUserId={currentUserId}
                            onCommentDeleted={onCommentDeleted}
                            onCommentUpdated={onCommentUpdated}
                            onReplyAdded={onReplyAdded}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// Main TaskComments Component
export default function TaskComments({ taskId, currentUserId, users = [] }) {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalComments, setTotalComments] = useState(0);

    const fetchComments = async () => {
        try {
            const response = await axios.get(
                route("task-comments.index", taskId)
            );
            setComments(response.data.comments);
            setTotalComments(response.data.total);
        } catch (error) {
            console.error("Error fetching comments:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [taskId]);

    const handleCommentAdded = (newComment) => {
        setComments([newComment, ...comments]);
        setTotalComments(totalComments + 1);
    };

    const handleCommentDeleted = (commentId) => {
        // Recursively remove comment and its replies
        const removeComment = (commentsArray, id) => {
            return commentsArray.filter((c) => {
                if (c.id === id) return false;
                if (c.replies) {
                    c.replies = removeComment(c.replies, id);
                }
                return true;
            });
        };
        setComments(removeComment(comments, commentId));
        setTotalComments(totalComments - 1);
    };

    const handleCommentUpdated = (updatedComment) => {
        const updateComment = (commentsArray, updated) => {
            return commentsArray.map((c) => {
                if (c.id === updated.id) {
                    return { ...c, ...updated };
                }
                if (c.replies) {
                    c.replies = updateComment(c.replies, updated);
                }
                return c;
            });
        };
        setComments(updateComment(comments, updatedComment));
    };

    const handleReplyAdded = (parentId, newReply) => {
        const addReply = (commentsArray, pid, reply) => {
            return commentsArray.map((c) => {
                if (c.id === pid) {
                    return {
                        ...c,
                        replies: [...(c.replies || []), reply],
                    };
                }
                if (c.replies) {
                    c.replies = addReply(c.replies, pid, reply);
                }
                return c;
            });
        };
        setComments(addReply(comments, parentId, newReply));
        setTotalComments(totalComments + 1);
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center space-x-2">
                <ChatBubbleLeftIcon className="h-5 w-5 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900">
                    Comments {totalComments > 0 && `(${totalComments})`}
                </h3>
            </div>

            {/* New Comment Input */}
            <div className="bg-gray-50 rounded-lg p-4">
                <CommentInput
                    taskId={taskId}
                    users={users}
                    onCommentAdded={handleCommentAdded}
                    placeholder="Write a comment... Use @ to mention someone"
                />
            </div>

            {/* Comments List */}
            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            ) : comments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    <ChatBubbleLeftIcon className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                    <p>No comments yet. Be the first to comment!</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {comments.map((comment) => (
                        <Comment
                            key={comment.id}
                            comment={comment}
                            taskId={taskId}
                            users={users}
                            currentUserId={currentUserId}
                            onCommentDeleted={handleCommentDeleted}
                            onCommentUpdated={handleCommentUpdated}
                            onReplyAdded={handleReplyAdded}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
