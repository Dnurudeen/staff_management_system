/**
 * AI Service Client
 * Handles communication with the FastAPI AI suggestion service
 */

const AI_SERVICE_URL =
    import.meta.env.VITE_AI_SERVICE_URL || "http://localhost:8001";

/**
 * Fetch description suggestion from AI service
 * @param {string} title - The title to generate description for
 * @param {string} type - Type: 'task', 'meeting', 'department', 'general'
 * @param {object} context - Additional context (priority, duration, etc.)
 * @returns {Promise<{suggestion: string, alternatives: string[], confidence: number}>}
 */
export async function suggestDescription(
    title,
    type = "general",
    context = null
) {
    try {
        const response = await fetch(
            `${AI_SERVICE_URL}/api/suggest/description`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title,
                    type,
                    context,
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`AI service error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("AI suggestion error:", error);
        return {
            suggestion: "",
            alternatives: [],
            confidence: 0,
        };
    }
}

/**
 * Fetch inline completion suggestion from AI service
 * @param {string} text - Current text being typed
 * @param {string} fieldType - Type of field: 'title', 'description', 'agenda'
 * @param {string} contextType - Context: 'task', 'meeting', 'department', 'general'
 * @returns {Promise<{completion: string, full_text: string, confidence: number}>}
 */
export async function suggestCompletion(
    text,
    fieldType = "description",
    contextType = "general"
) {
    try {
        const response = await fetch(
            `${AI_SERVICE_URL}/api/suggest/completion`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    text,
                    field_type: fieldType,
                    context_type: contextType,
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`AI service error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("AI completion error:", error);
        return {
            completion: "",
            full_text: text,
            confidence: 0,
        };
    }
}

/**
 * Fetch alternative descriptions from AI service
 * @param {string} title - The title to generate alternatives for
 * @param {string} type - Type: 'task', 'meeting', 'department', 'general'
 * @returns {Promise<{alternatives: Array<{type: string, description: string}>}>}
 */
export async function suggestAlternatives(title, type = "general") {
    try {
        const response = await fetch(
            `${AI_SERVICE_URL}/api/suggest/alternatives`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title,
                    type,
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`AI service error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("AI alternatives error:", error);
        return {
            alternatives: [],
        };
    }
}

/**
 * Check if AI service is available
 * @returns {Promise<boolean>}
 */
export async function checkAIServiceHealth() {
    try {
        const response = await fetch(`${AI_SERVICE_URL}/`, {
            method: "GET",
            timeout: 3000,
        });
        return response.ok;
    } catch (error) {
        console.warn("AI service unavailable:", error);
        return false;
    }
}

export default {
    suggestDescription,
    suggestCompletion,
    suggestAlternatives,
    checkAIServiceHealth,
};
