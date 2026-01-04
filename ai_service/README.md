# AI Suggestion Service

A FastAPI-based intelligent suggestion service for the Staff Management System.

## Features

-   **Description Suggestions**: Automatically generates descriptions for tasks, meetings, and departments based on titles
-   **Inline Completions**: Real-time text completion suggestions as users type
-   **UK English**: All suggestions use British English spelling and phrasing
-   **Context-Aware**: Considers additional context like priority, duration, etc.

## Setup

1. Create a virtual environment:

```bash
cd ai_service
python -m venv venv
```

2. Activate the virtual environment:

```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Run the service:

```bash
python main.py
```

Or using uvicorn directly:

```bash
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

## API Endpoints

### Health Check

```
GET /
```

### Description Suggestion

```
POST /api/suggest/description
Content-Type: application/json

{
    "title": "Review quarterly report",
    "type": "task",
    "context": {
        "priority": "high"
    }
}
```

### Inline Completion

```
POST /api/suggest/completion
Content-Type: application/json

{
    "text": "Please ensure",
    "field_type": "description",
    "context_type": "task"
}
```

### Alternative Suggestions

```
POST /api/suggest/alternatives
Content-Type: application/json

{
    "title": "Engineering Team",
    "type": "department"
}
```

## Response Examples

### Description Response

```json
{
    "suggestion": "Review and provide comprehensive feedback on quarterly report...",
    "alternatives": ["...", "..."],
    "confidence": 0.85
}
```

### Completion Response

```json
{
    "completion": " all stakeholders are",
    "full_text": "Please ensure all stakeholders are",
    "confidence": 0.9
}
```

## Integration

The service runs on port 8001 by default and accepts requests from the Laravel/React frontend.

Add the AI service URL to your `.env` file:

```
VITE_AI_SERVICE_URL=http://localhost:8001
```
