import { useState, useEffect, useRef } from "react";
import {
    SparklesIcon,
    ArrowPathIcon,
    CheckIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";

/**
 * AI Description Suggester Component
 * Displays AI-generated description suggestions with animations
 */
export default function AISuggestionBox({
    suggestion,
    alternatives = [],
    isLoading,
    confidence,
    onAccept,
    onReject,
    onSelectAlternative,
    onRegenerate,
    className = "",
}) {
    const [isVisible, setIsVisible] = useState(false);
    const [showAlternatives, setShowAlternatives] = useState(false);
    const [displayedText, setDisplayedText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const typingRef = useRef(null);

    // Animate visibility
    useEffect(() => {
        if (suggestion || isLoading) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    }, [suggestion, isLoading]);

    // Typewriter effect for suggestion
    useEffect(() => {
        if (!suggestion) {
            setDisplayedText("");
            return;
        }

        setIsTyping(true);
        setDisplayedText("");

        let index = 0;
        const text = suggestion;

        // Clear previous interval
        if (typingRef.current) {
            clearInterval(typingRef.current);
        }

        typingRef.current = setInterval(() => {
            if (index < text.length) {
                setDisplayedText(text.slice(0, index + 1));
                index++;
            } else {
                clearInterval(typingRef.current);
                setIsTyping(false);
            }
        }, 10); // Fast typing speed

        return () => {
            if (typingRef.current) {
                clearInterval(typingRef.current);
            }
        };
    }, [suggestion]);

    if (!isVisible) return null;

    return (
        <div
            className={`
                transform transition-all duration-300 ease-out
                ${
                    isVisible
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 -translate-y-2"
                }
                ${className}
            `}
        >
            <div className="relative bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-xl border border-indigo-100 shadow-lg overflow-hidden">
                {/* Animated background gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 animate-gradient-x" />

                {/* Header */}
                <div className="relative flex items-center justify-between px-4 py-3 border-b border-indigo-100/50 bg-white/50 backdrop-blur-sm">
                    <div className="flex items-center space-x-2">
                        <div className="relative">
                            <SparklesIcon
                                className={`h-5 w-5 text-indigo-600 ${
                                    isLoading || isTyping ? "animate-pulse" : ""
                                }`}
                            />
                            {isLoading && (
                                <span className="absolute -top-1 -right-1 h-2 w-2 bg-indigo-500 rounded-full animate-ping" />
                            )}
                        </div>
                        <span className="text-sm font-semibold text-indigo-900">
                            AI Suggestion
                        </span>
                        {confidence > 0 && !isLoading && (
                            <span
                                className={`text-xs px-2 py-0.5 rounded-full ${
                                    confidence >= 0.8
                                        ? "bg-green-100 text-green-700"
                                        : confidence >= 0.6
                                        ? "bg-yellow-100 text-yellow-700"
                                        : "bg-gray-100 text-gray-600"
                                }`}
                            >
                                {Math.round(confidence * 100)}% match
                            </span>
                        )}
                    </div>

                    {!isLoading && suggestion && (
                        <div className="flex items-center space-x-1">
                            <button
                                onClick={onAccept}
                                className="p-1.5 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                                title="Accept suggestion"
                            >
                                <CheckIcon className="h-4 w-4" />
                            </button>
                            <button
                                onClick={onReject}
                                className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                title="Dismiss"
                            >
                                <XMarkIcon className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="relative p-4">
                    {isLoading ? (
                        <div className="flex items-center space-x-3">
                            <ArrowPathIcon className="h-5 w-5 text-indigo-500 animate-spin" />
                            <div className="flex space-x-1">
                                <span className="text-sm text-indigo-600">
                                    Generating suggestion
                                </span>
                                <span
                                    className="animate-bounce"
                                    style={{ animationDelay: "0ms" }}
                                >
                                    .
                                </span>
                                <span
                                    className="animate-bounce"
                                    style={{ animationDelay: "150ms" }}
                                >
                                    .
                                </span>
                                <span
                                    className="animate-bounce"
                                    style={{ animationDelay: "300ms" }}
                                >
                                    .
                                </span>
                            </div>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm text-gray-700 leading-relaxed">
                                {displayedText}
                                {isTyping && (
                                    <span className="inline-block w-0.5 h-4 bg-indigo-500 animate-blink ml-0.5" />
                                )}
                            </p>

                            {/* Action buttons */}
                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-indigo-100/50">
                                <div className="flex items-center space-x-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            onAccept && onAccept(suggestion)
                                        }
                                        className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                    >
                                        <CheckIcon className="h-4 w-4 mr-1.5" />
                                        Use this
                                    </button>

                                    {/* Regenerate button */}
                                    {onRegenerate && (
                                        <button
                                            type="button"
                                            onClick={onRegenerate}
                                            className="inline-flex items-center px-3 py-2 bg-white border border-indigo-300 text-indigo-600 text-sm font-medium rounded-lg hover:bg-indigo-50 hover:border-indigo-400 transition-all"
                                            title="Generate a new suggestion"
                                        >
                                            <ArrowPathIcon className="h-4 w-4 mr-1.5" />
                                            Rewrite
                                        </button>
                                    )}
                                </div>

                                {alternatives.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowAlternatives(
                                                !showAlternatives
                                            )
                                        }
                                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                                    >
                                        {showAlternatives ? "Hide" : "Show"}{" "}
                                        alternatives ({alternatives.length})
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Alternatives */}
                {showAlternatives && alternatives.length > 0 && (
                    <div className="border-t border-indigo-100 bg-white/30 p-4 space-y-2">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                            Click to use an alternative suggestion
                        </p>
                        {alternatives.map((alt, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => {
                                    setSelectedIndex(index);
                                    if (onSelectAlternative) {
                                        onSelectAlternative(alt);
                                    }
                                }}
                                className={`w-full text-left p-3 text-sm rounded-lg border transition-all cursor-pointer ${
                                    selectedIndex === index
                                        ? "bg-indigo-100 border-indigo-300 text-indigo-800"
                                        : "bg-white/50 border-transparent text-gray-600 hover:bg-white hover:border-indigo-200"
                                }`}
                            >
                                {alt.length > 150
                                    ? `${alt.slice(0, 150)}...`
                                    : alt}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
