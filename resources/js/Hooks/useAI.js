import { useState, useEffect, useCallback, useRef } from "react";
import {
    suggestDescription,
    suggestCompletion,
    checkAIServiceHealth,
} from "@/Services/aiService";

/**
 * Custom hook for AI description suggestions
 * @param {string} type - Type: 'task', 'meeting', 'department', 'general'
 * @param {number} debounceMs - Debounce delay in milliseconds
 */
export function useAISuggestion(type = "general", debounceMs = 500) {
    const [suggestion, setSuggestion] = useState("");
    const [alternatives, setAlternatives] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [confidence, setConfidence] = useState(0);
    const [isAvailable, setIsAvailable] = useState(true);
    const timeoutRef = useRef(null);
    const abortControllerRef = useRef(null);

    // Check service availability on mount
    useEffect(() => {
        checkAIServiceHealth().then(setIsAvailable);
    }, []);

    const fetchSuggestion = useCallback(
        async (title, context = null) => {
            if (!title || title.length < 3 || !isAvailable) {
                setSuggestion("");
                setAlternatives([]);
                setConfidence(0);
                return;
            }

            // Cancel previous request
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            // Clear previous timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            // Debounce the request
            timeoutRef.current = setTimeout(async () => {
                setIsLoading(true);
                abortControllerRef.current = new AbortController();

                try {
                    const result = await suggestDescription(
                        title,
                        type,
                        context
                    );
                    setSuggestion(result.suggestion || "");
                    setAlternatives(result.alternatives || []);
                    setConfidence(result.confidence || 0);
                } catch (error) {
                    if (error.name !== "AbortError") {
                        console.error("Suggestion error:", error);
                    }
                } finally {
                    setIsLoading(false);
                }
            }, debounceMs);
        },
        [type, debounceMs, isAvailable]
    );

    const clearSuggestion = useCallback(() => {
        setSuggestion("");
        setAlternatives([]);
        setConfidence(0);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    return {
        suggestion,
        alternatives,
        isLoading,
        confidence,
        isAvailable,
        fetchSuggestion,
        clearSuggestion,
    };
}

/**
 * Custom hook for AI inline completion
 * @param {string} fieldType - Type of field: 'title', 'description', 'agenda'
 * @param {string} contextType - Context: 'task', 'meeting', 'department', 'general'
 * @param {number} debounceMs - Debounce delay in milliseconds
 */
export function useAICompletion(
    fieldType = "description",
    contextType = "general",
    debounceMs = 200
) {
    const [completion, setCompletion] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [confidence, setConfidence] = useState(0);
    const [isAvailable, setIsAvailable] = useState(true);
    const timeoutRef = useRef(null);
    const lastTextRef = useRef("");

    // Check service availability on mount
    useEffect(() => {
        checkAIServiceHealth().then(setIsAvailable);
    }, []);

    const fetchCompletion = useCallback(
        async (text) => {
            // Reduced minimum length from 5 to 3 characters
            if (!text || text.length < 3 || !isAvailable) {
                setCompletion("");
                setConfidence(0);
                return;
            }

            // Don't fetch if text hasn't changed meaningfully
            // Allow re-fetch if user added a space (indicating a new word)
            if (text === lastTextRef.current && !text.endsWith(" ")) {
                return;
            }
            lastTextRef.current = text;

            // Clear previous timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            // Debounce the request
            timeoutRef.current = setTimeout(async () => {
                setIsLoading(true);

                try {
                    const result = await suggestCompletion(
                        text,
                        fieldType,
                        contextType
                    );
                    // Only update if text hasn't changed
                    if (text === lastTextRef.current) {
                        setCompletion(result.completion || "");
                        setConfidence(result.confidence || 0);
                    }
                } catch (error) {
                    console.error("Completion error:", error);
                } finally {
                    setIsLoading(false);
                }
            }, debounceMs);
        },
        [fieldType, contextType, debounceMs, isAvailable]
    );

    const clearCompletion = useCallback(() => {
        setCompletion("");
        setConfidence(0);
        lastTextRef.current = "";
    }, []);

    const acceptCompletion = useCallback(
        (currentText) => {
            const fullText = currentText + completion;
            clearCompletion();
            return fullText;
        },
        [completion, clearCompletion]
    );

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return {
        completion,
        isLoading,
        confidence,
        isAvailable,
        fetchCompletion,
        clearCompletion,
        acceptCompletion,
    };
}

export default {
    useAISuggestion,
    useAICompletion,
};
