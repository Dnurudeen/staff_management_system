import { useState, useEffect, useRef, forwardRef } from "react";
import { SparklesIcon } from "@heroicons/react/24/outline";

/**
 * AI-Enhanced Input/Textarea Component
 * Provides inline completion suggestions with Tab to accept
 */
const AIInput = forwardRef(function AIInput(
    {
        value,
        onChange,
        completion,
        onAcceptCompletion,
        isLoading,
        placeholder = "",
        className = "",
        multiline = false,
        rows = 4,
        disabled = false,
        ...props
    },
    ref
) {
    const [isFocused, setIsFocused] = useState(false);
    const [showCompletion, setShowCompletion] = useState(false);
    const inputRef = useRef(null);
    const combinedRef = ref || inputRef;

    // Show completion when we have one and field is focused
    useEffect(() => {
        setShowCompletion(isFocused && !!completion && completion.length > 0);
    }, [isFocused, completion]);

    const handleKeyDown = (e) => {
        // Accept completion with Tab
        if (e.key === "Tab" && completion && showCompletion) {
            e.preventDefault();
            if (onAcceptCompletion) {
                onAcceptCompletion(value + completion);
            }
        }
        // Dismiss completion with Escape
        if (e.key === "Escape" && showCompletion) {
            setShowCompletion(false);
        }
    };

    const handleChange = (e) => {
        onChange(e.target.value);
    };

    const baseClassName = `
        w-full rounded-lg border border-gray-300 shadow-sm
        focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20
        transition-all duration-200
        ${disabled ? "bg-gray-50 cursor-not-allowed" : "bg-white"}
        ${className}
    `;

    const InputComponent = multiline ? "textarea" : "input";

    return (
        <div className="relative">
            {/* Main Input */}
            <InputComponent
                ref={combinedRef}
                type={multiline ? undefined : "text"}
                value={value}
                onChange={handleChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                rows={multiline ? rows : undefined}
                className={`${baseClassName} ${multiline ? "resize-none" : ""}`}
                {...props}
            />

            {/* Completion overlay */}
            {showCompletion && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
                    {multiline ? (
                        <div
                            className="p-3 text-sm whitespace-pre-wrap break-words"
                            style={{
                                color: "transparent",
                                lineHeight: "1.5rem",
                            }}
                        >
                            <span>{value}</span>
                            <span className="text-gray-400 bg-indigo-50/80">
                                {completion}
                            </span>
                        </div>
                    ) : (
                        <div className="absolute inset-y-0 left-0 flex items-center px-3">
                            <span className="text-transparent">{value}</span>
                            <span className="text-gray-400 bg-indigo-50/80 rounded px-0.5">
                                {completion}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* AI indicator */}
            {(isLoading || showCompletion) && (
                <div className="absolute right-3 top-3 flex items-center space-x-2">
                    {isLoading && (
                        <div className="flex items-center space-x-1 text-indigo-500">
                            <SparklesIcon className="h-4 w-4 animate-pulse" />
                        </div>
                    )}
                    {showCompletion && !isLoading && (
                        <div className="flex items-center space-x-1 px-2 py-1 bg-indigo-100 rounded-md">
                            <span className="text-xs text-indigo-700 font-medium">
                                Tab
                            </span>
                            <span className="text-xs text-indigo-500">
                                to accept
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});

export default AIInput;
