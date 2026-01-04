import { useState, useCallback } from "react";
import { SparklesIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { useAISuggestion, useAICompletion } from "@/Hooks/useAI";
import AISuggestionBox from "./AISuggestionBox";
import AIInput from "./AIInput";

/**
 * AI-Enhanced Description Field
 * Combines title-based suggestions with inline completion
 */
export default function AIDescriptionField({
    title,
    value,
    onChange,
    type = "general", // 'task', 'meeting', 'department', 'general'
    context = null,
    label = "Description",
    placeholder = "Enter description...",
    required = false,
    error = null,
    rows = 4,
    className = "",
}) {
    const [showSuggestion, setShowSuggestion] = useState(false);
    const [hasAcceptedSuggestion, setHasAcceptedSuggestion] = useState(false);

    // AI hooks
    const {
        suggestion,
        alternatives,
        isLoading: suggestionLoading,
        confidence,
        isAvailable,
        fetchSuggestion,
        clearSuggestion,
    } = useAISuggestion(type);

    const {
        completion,
        isLoading: completionLoading,
        fetchCompletion,
        clearCompletion,
        acceptCompletion,
    } = useAICompletion("description", type);

    // Generate suggestion when title changes (with debounce)
    const handleGenerateSuggestion = useCallback(() => {
        if (title && title.length >= 3) {
            setShowSuggestion(true);
            setHasAcceptedSuggestion(false);
            fetchSuggestion(title, context);
        }
    }, [title, context, fetchSuggestion]);

    // Regenerate suggestion (force new request)
    const handleRegenerateSuggestion = useCallback(() => {
        if (title && title.length >= 3) {
            clearSuggestion();
            // Small delay to show the loading state
            setTimeout(() => {
                fetchSuggestion(title, context);
            }, 100);
        }
    }, [title, context, fetchSuggestion, clearSuggestion]);

    // Accept the AI suggestion
    const handleAcceptSuggestion = useCallback(
        (text) => {
            onChange(text || suggestion);
            setShowSuggestion(false);
            setHasAcceptedSuggestion(true);
            clearSuggestion();
        },
        [suggestion, onChange, clearSuggestion]
    );

    // Reject/dismiss the suggestion
    const handleRejectSuggestion = useCallback(() => {
        setShowSuggestion(false);
        clearSuggestion();
    }, [clearSuggestion]);

    // Handle description change and fetch inline completion
    const handleDescriptionChange = useCallback(
        (newValue) => {
            onChange(newValue);
            // Fetch completion for text 3+ chars (lowered from 10)
            if (newValue.length >= 3) {
                fetchCompletion(newValue);
            } else {
                clearCompletion();
            }
        },
        [onChange, fetchCompletion, clearCompletion]
    );

    // Accept inline completion
    const handleAcceptCompletion = useCallback(
        (fullText) => {
            onChange(fullText);
            clearCompletion();
        },
        [onChange, clearCompletion]
    );

    return (
        <div className={`space-y-3 ${className}`}>
            {/* Label with AI button */}
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>

                {isAvailable &&
                    title &&
                    title.length >= 3 &&
                    !hasAcceptedSuggestion && (
                        <button
                            type="button"
                            onClick={handleGenerateSuggestion}
                            disabled={suggestionLoading}
                            className={`
                            inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full
                            transition-all duration-200 transform hover:scale-105
                            ${
                                suggestionLoading
                                    ? "bg-indigo-100 text-indigo-400 cursor-wait"
                                    : "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 shadow-md hover:shadow-lg"
                            }
                        `}
                        >
                            {suggestionLoading ? (
                                <ArrowPathIcon className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                            ) : (
                                <SparklesIcon className="h-3.5 w-3.5 mr-1.5" />
                            )}
                            {suggestionLoading ? "Generating..." : "AI Suggest"}
                        </button>
                    )}
            </div>

            {/* AI Suggestion Box */}
            {showSuggestion && (suggestion || suggestionLoading) && (
                <AISuggestionBox
                    suggestion={suggestion}
                    alternatives={alternatives}
                    isLoading={suggestionLoading}
                    confidence={confidence}
                    onAccept={handleAcceptSuggestion}
                    onReject={handleRejectSuggestion}
                    onSelectAlternative={handleAcceptSuggestion}
                    onRegenerate={handleRegenerateSuggestion}
                />
            )}

            {/* Description Input with AI Completion */}
            <AIInput
                value={value}
                onChange={handleDescriptionChange}
                completion={completion}
                onAcceptCompletion={handleAcceptCompletion}
                isLoading={completionLoading}
                placeholder={placeholder}
                multiline
                rows={rows}
            />

            {/* Helper text */}
            {isAvailable && !showSuggestion && !value && (
                <p className="text-xs text-gray-500 flex items-center">
                    <SparklesIcon className="h-3.5 w-3.5 mr-1 text-indigo-500" />
                    AI-powered suggestions available. Press Tab to accept inline
                    completions.
                </p>
            )}

            {/* Error message */}
            {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
    );
}
