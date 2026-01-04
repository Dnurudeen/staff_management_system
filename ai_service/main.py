"""
AI Suggestion Service for Staff Management System
FastAPI-based LLM service for intelligent text suggestions
Uses UK English as the primary language
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
import asyncio
import re
from enum import Enum

app = FastAPI(
    title="Staff Management AI Assistant",
    description="AI-powered suggestion service for tasks, meetings, and departments",
    version="1.0.0"
)

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:8000", "http://127.0.0.1:5173", "http://127.0.0.1:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SuggestionType(str, Enum):
    TASK = "task"
    MEETING = "meeting"
    DEPARTMENT = "department"
    GENERAL = "general"


class DescriptionRequest(BaseModel):
    """Request model for description suggestions"""
    title: str = Field(..., min_length=1, max_length=500)
    type: SuggestionType = Field(default=SuggestionType.GENERAL)
    context: Optional[dict] = Field(default=None, description="Additional context like priority, department, etc.")


class InlineCompletionRequest(BaseModel):
    """Request model for inline text completion"""
    text: str = Field(..., min_length=1, max_length=1000)
    field_type: str = Field(default="description", description="Type of field: title, description, agenda, etc.")
    context_type: SuggestionType = Field(default=SuggestionType.GENERAL)
    cursor_position: Optional[int] = Field(default=None)


class DescriptionResponse(BaseModel):
    """Response model for description suggestions"""
    suggestion: str
    alternatives: List[str] = []
    confidence: float = Field(ge=0, le=1)


class InlineCompletionResponse(BaseModel):
    """Response model for inline completion"""
    completion: str
    full_text: str
    confidence: float = Field(ge=0, le=1)


# UK English templates and patterns for intelligent suggestions
TASK_TEMPLATES = {
    "review": "Review and provide comprehensive feedback on {subject}. Ensure all key points are addressed and documented accordingly. Please complete this task by the specified deadline.",
    "prepare": "Prepare all necessary documentation and materials for {subject}. Coordinate with relevant team members and ensure everything is organised properly.",
    "complete": "Complete the assigned work on {subject}. Follow the established guidelines and maintain quality standards throughout the process.",
    "update": "Update the existing {subject} with the latest information. Verify accuracy and ensure all stakeholders are informed of the changes.",
    "create": "Create a new {subject} following the organisation's standards and best practices. Document all relevant details and seek approval where necessary.",
    "analyse": "Analyse {subject} thoroughly and prepare a detailed report. Identify key findings, trends, and actionable recommendations.",
    "organise": "Organise {subject} efficiently, ensuring all components are properly arranged and accessible. Maintain clear documentation throughout.",
    "coordinate": "Coordinate with team members regarding {subject}. Ensure clear communication and alignment on objectives and timelines.",
    "implement": "Implement the planned changes for {subject}. Follow the approved approach and document any deviations or issues encountered.",
    "evaluate": "Evaluate {subject} against established criteria. Provide objective assessment and recommendations for improvement.",
    "default": "Complete the task related to {subject}. Ensure all requirements are met and deliverables are of high quality. Please coordinate with relevant stakeholders as needed."
}

MEETING_TEMPLATES = {
    "planning": "This meeting will focus on planning and strategising for {subject}. We shall review current status, discuss objectives, and establish clear action items. All participants are encouraged to come prepared with their updates.",
    "review": "A review session to assess progress on {subject}. We shall examine achievements, identify challenges, and determine necessary adjustments to our approach.",
    "brainstorm": "An open discussion session to generate ideas and solutions for {subject}. All contributions are welcome, and we shall work collaboratively to find the best approaches.",
    "training": "Training session covering {subject}. Participants will gain practical knowledge and skills. Please bring any questions or specific topics you would like addressed.",
    "update": "Regular update meeting regarding {subject}. Team members will share progress, raise concerns, and align on next steps.",
    "kickoff": "Project kickoff meeting for {subject}. We shall establish objectives, assign responsibilities, and set expectations for the project timeline.",
    "retrospective": "Retrospective meeting to reflect on {subject}. We shall discuss what went well, areas for improvement, and lessons learnt.",
    "one-on-one": "One-on-one discussion regarding {subject}. This is an opportunity to provide feedback, discuss career development, and address any concerns.",
    "default": "Meeting to discuss {subject}. We shall cover key points, make decisions where necessary, and establish clear action items for follow-up."
}

DEPARTMENT_TEMPLATES = {
    "engineering": "The {name} team is responsible for technical development, innovation, and maintaining high-quality standards across all engineering projects. The team collaborates closely with other departments to deliver robust solutions.",
    "marketing": "The {name} team drives brand awareness, customer engagement, and market growth initiatives. The team develops and executes strategic campaigns aligned with organisational objectives.",
    "sales": "The {name} team focuses on revenue generation, client relationships, and business development. The team works to identify opportunities and deliver value to customers.",
    "hr": "The {name} team manages human resources, talent acquisition, employee relations, and organisational development. The team ensures a positive workplace culture and supports staff wellbeing.",
    "finance": "The {name} team oversees financial planning, reporting, and compliance. The team ensures fiscal responsibility and provides strategic financial guidance.",
    "operations": "The {name} team manages day-to-day operational activities, process optimisation, and resource allocation. The team ensures efficient and effective business operations.",
    "support": "The {name} team provides assistance and resolves issues for internal and external stakeholders. The team maintains high service standards and customer satisfaction.",
    "design": "The {name} team creates user-centred designs, visual assets, and brand materials. The team ensures consistency and excellence in all design deliverables.",
    "product": "The {name} team drives product strategy, roadmap development, and feature prioritisation. The team works cross-functionally to deliver products that meet customer needs.",
    "default": "The {name} team plays a vital role in the organisation's success. The team collaborates effectively with other departments and maintains high standards of professionalism and delivery."
}

# Inline completion patterns (UK English) - More comprehensive triggers
INLINE_COMPLETIONS = {
    "title": {
        "review": " and provide feedback",
        "prepare": " documentation for",
        "update": " the existing records",
        "create": " new resources for",
        "complete": " the assigned work",
        "schedule": " meeting with the team",
        "organise": " the upcoming event",
        "coordinate": " with team members",
        "implement": " the planned changes",
        "analyse": " and report findings",
        "discuss": " the progress of",
        "finalise": " the requirements",
        "meet": "ing to discuss",
        "call": " with stakeholders",
        "sync": " up on progress",
        "plan": "ning session for",
        "train": "ing workshop",
        "check": " the status of",
        "fix": " the reported issue",
        "debug": " and resolve",
        "test": " the implementation",
    },
    "description": {
        # Sentence starters
        "this ": "task involves working on",
        "this task": " requires careful attention to detail and",
        "this meeting": " will cover important topics regarding",
        "please ": "ensure all requirements are met and",
        "please ensure": " that all stakeholders are informed",
        "we need": " to complete this by the deadline",
        "we should": " coordinate with the relevant teams",
        "the goal": " is to achieve optimal results",
        "the objective": " is to deliver high-quality outcomes",
        "ensure ": "all stakeholders are informed of progress",
        "ensure all": " documentation is updated accordingly",
        "coordinate": " with the relevant department heads",
        "review ": "all documentation and provide feedback",
        "complete ": "all required steps before the deadline",
        "prepare ": "the necessary materials and resources",
        "submit ": "the final deliverables by end of day",
        "all team": " members should be aware of this",
        "the deadline": " for completion is",
        "priority": " should be given to urgent items",
        "key deliverables": " include comprehensive documentation",
        # Common phrases
        "in order to": " achieve our objectives",
        "as part of": " this initiative",
        "with regards to": " the discussed requirements",
        "following up on": " our previous discussion",
        "as discussed": " in the meeting",
        "moving forward": " we shall implement",
        "going forward": " the team will",
        # Verb endings
        "working on": " the assigned deliverables",
        "focusing on": " achieving our targets",
        "looking into": " potential solutions",
        "responsible for": " ensuring quality and",
        "accountable for": " delivering results",
        # Action verbs
        "will be": " responsible for completing",
        "shall ": "ensure compliance with guidelines",
        "must ": "be completed before the deadline",
        "should ": "coordinate with relevant parties",
        "need to": " address this as a priority",
        "required to": " submit documentation",
    },
    "agenda": {
        "welcome": " and introductions",
        "review": " of previous action items",
        "discuss": " key topics and updates",
        "present": " findings and recommendations",
        "q&a": " session and open discussion",
        "next": " steps and action items",
        "closing": " remarks and adjournment",
        "brainstorm": " ideas and solutions",
        "decision": " making on key matters",
        "updates": " from team members",
        "progress": " review and status",
        "action": " items from last meeting",
        "open": " discussion and questions",
        "aob": " - any other business",
        "summary": " and key takeaways",
    }
}


def extract_subject(title: str) -> str:
    """Extract the main subject from a title"""
    # Remove common action words to get the subject
    action_words = [
        "review", "prepare", "complete", "update", "create", "analyse", "analyze",
        "organise", "organize", "coordinate", "implement", "evaluate", "schedule",
        "plan", "discuss", "finalise", "finalize", "check", "verify", "confirm"
    ]
    
    words = title.lower().split()
    subject_words = [w for w in words if w not in action_words and len(w) > 2]
    
    if subject_words:
        return " ".join(subject_words)
    return title


def detect_template_key(title: str) -> str:
    """Detect which template to use based on title keywords"""
    title_lower = title.lower()
    
    keywords_map = {
        "review": ["review", "assess", "evaluate", "check", "audit"],
        "prepare": ["prepare", "ready", "setup", "set up", "arrange"],
        "complete": ["complete", "finish", "finalise", "finalize", "conclude"],
        "update": ["update", "modify", "change", "revise", "edit"],
        "create": ["create", "build", "develop", "design", "make", "new"],
        "analyse": ["analyse", "analyze", "study", "examine", "investigate"],
        "organise": ["organise", "organize", "arrange", "coordinate", "plan"],
        "coordinate": ["coordinate", "sync", "align", "collaborate", "liaise"],
        "implement": ["implement", "deploy", "execute", "launch", "roll out"],
        "evaluate": ["evaluate", "assess", "measure", "gauge", "appraise"],
    }
    
    for key, keywords in keywords_map.items():
        for keyword in keywords:
            if keyword in title_lower:
                return key
    
    return "default"


def detect_meeting_type(title: str) -> str:
    """Detect meeting type from title"""
    title_lower = title.lower()
    
    meeting_types = {
        "planning": ["planning", "strategy", "roadmap", "sprint"],
        "review": ["review", "progress", "status", "check-in"],
        "brainstorm": ["brainstorm", "ideation", "creative", "workshop"],
        "training": ["training", "learning", "workshop", "onboarding"],
        "update": ["update", "sync", "standup", "stand-up", "daily"],
        "kickoff": ["kickoff", "kick-off", "launch", "initiation"],
        "retrospective": ["retrospective", "retro", "post-mortem", "lessons"],
        "one-on-one": ["one-on-one", "1:1", "1-1", "catch-up", "catch up"],
    }
    
    for mtype, keywords in meeting_types.items():
        for keyword in keywords:
            if keyword in title_lower:
                return mtype
    
    return "default"


def detect_department_type(name: str) -> str:
    """Detect department type from name"""
    name_lower = name.lower()
    
    dept_types = {
        "engineering": ["engineering", "development", "tech", "software", "it"],
        "marketing": ["marketing", "brand", "communications", "pr"],
        "sales": ["sales", "business development", "revenue", "commercial"],
        "hr": ["hr", "human resources", "people", "talent", "recruitment"],
        "finance": ["finance", "accounting", "treasury", "fiscal"],
        "operations": ["operations", "ops", "logistics", "supply chain"],
        "support": ["support", "customer service", "helpdesk", "service"],
        "design": ["design", "ux", "ui", "creative", "graphics"],
        "product": ["product", "pm", "product management"],
    }
    
    for dtype, keywords in dept_types.items():
        for keyword in keywords:
            if keyword in name_lower:
                return dtype
    
    return "default"


def generate_task_description(title: str, context: Optional[dict] = None) -> DescriptionResponse:
    """Generate task description suggestion"""
    template_key = detect_template_key(title)
    subject = extract_subject(title)
    template = TASK_TEMPLATES.get(template_key, TASK_TEMPLATES["default"])
    
    suggestion = template.format(subject=subject)
    
    # Add priority context if available
    if context and context.get("priority"):
        priority = context["priority"]
        if priority == "urgent":
            suggestion = f"URGENT: {suggestion} This is a high-priority task requiring immediate attention."
        elif priority == "high":
            suggestion = f"{suggestion} This task has been marked as high priority."
    
    # Generate alternatives
    alternatives = []
    for key, tmpl in TASK_TEMPLATES.items():
        if key != template_key and key != "default":
            alt = tmpl.format(subject=subject)
            if len(alternatives) < 2:
                alternatives.append(alt)
    
    return DescriptionResponse(
        suggestion=suggestion,
        alternatives=alternatives,
        confidence=0.85 if template_key != "default" else 0.7
    )


def generate_meeting_description(title: str, context: Optional[dict] = None) -> DescriptionResponse:
    """Generate meeting description/agenda suggestion"""
    meeting_type = detect_meeting_type(title)
    subject = extract_subject(title)
    template = MEETING_TEMPLATES.get(meeting_type, MEETING_TEMPLATES["default"])
    
    suggestion = template.format(subject=subject)
    
    # Add duration context if available
    if context and context.get("duration"):
        duration = context["duration"]
        suggestion += f" The meeting is scheduled for {duration} minutes."
    
    # Generate alternatives
    alternatives = []
    for key, tmpl in MEETING_TEMPLATES.items():
        if key != meeting_type and key != "default":
            alt = tmpl.format(subject=subject)
            if len(alternatives) < 2:
                alternatives.append(alt)
    
    return DescriptionResponse(
        suggestion=suggestion,
        alternatives=alternatives,
        confidence=0.85 if meeting_type != "default" else 0.7
    )


def generate_department_description(name: str, context: Optional[dict] = None) -> DescriptionResponse:
    """Generate department description suggestion"""
    dept_type = detect_department_type(name)
    template = DEPARTMENT_TEMPLATES.get(dept_type, DEPARTMENT_TEMPLATES["default"])
    
    suggestion = template.format(name=name)
    
    # Generate alternatives
    alternatives = []
    for key, tmpl in DEPARTMENT_TEMPLATES.items():
        if key != dept_type and key != "default":
            alt = tmpl.format(name=name)
            if len(alternatives) < 2:
                alternatives.append(alt)
    
    return DescriptionResponse(
        suggestion=suggestion,
        alternatives=alternatives,
        confidence=0.85 if dept_type != "default" else 0.7
    )


def generate_inline_completion(text: str, field_type: str, context_type: SuggestionType) -> InlineCompletionResponse:
    """Generate inline text completion - more aggressive matching"""
    text_lower = text.lower().strip()
    
    if not text_lower:
        return InlineCompletionResponse(completion="", full_text="", confidence=0)
    
    completions = INLINE_COMPLETIONS.get(field_type, INLINE_COMPLETIONS["description"])
    
    best_match = ""
    best_confidence = 0.0
    
    # Get the last portion of text for matching (last 30 chars for better context)
    last_portion = text_lower[-30:] if len(text_lower) > 30 else text_lower
    
    # Strategy 1: Exact ending match (highest confidence)
    for trigger, completion in completions.items():
        if last_portion.endswith(trigger):
            best_match = completion
            best_confidence = 0.95
            break
    
    # Strategy 2: Match last word if it's incomplete (medium confidence)
    if not best_match and len(text_lower) >= 3:
        words = text_lower.split()
        if words:
            last_word = words[-1]
            # Look for triggers that start with the last word (partial word completion)
            for trigger, completion in completions.items():
                trigger_first_word = trigger.split()[0] if ' ' in trigger else trigger
                if trigger_first_word.startswith(last_word) and len(last_word) >= 3:
                    # Complete the word plus the rest
                    word_completion = trigger_first_word[len(last_word):]
                    best_match = word_completion + completion
                    best_confidence = 0.85
                    break
    
    # Strategy 3: Check if any trigger word appears in last 20 characters
    if not best_match:
        for trigger, completion in completions.items():
            if trigger in last_portion:
                # Only suggest if the trigger is near the end
                idx = last_portion.rfind(trigger)
                if idx >= len(last_portion) - len(trigger) - 5:
                    best_match = completion
                    best_confidence = 0.75
                    break
    
    # Strategy 4: Smart context-based suggestions if still no match
    if not best_match:
        # Check if user just finished typing a word (ends with space)
        if text.endswith(" "):
            words = text_lower.strip().split()
            if words:
                last_word = words[-1]
                # Suggest based on last complete word
                for trigger, completion in completions.items():
                    if trigger.startswith(last_word):
                        best_match = completion
                        best_confidence = 0.65
                        break
        
        # Fallback: provide context-specific suggestions after enough text
        if not best_match and len(text) >= 15:
            if context_type == SuggestionType.TASK:
                if "deadline" in text_lower:
                    best_match = ". Please ensure timely completion."
                elif "urgent" in text_lower or "asap" in text_lower:
                    best_match = " and requires immediate attention."
                else:
                    best_match = ". Please coordinate with relevant stakeholders."
            elif context_type == SuggestionType.MEETING:
                if "discuss" in text_lower:
                    best_match = " and agree on next steps."
                elif "review" in text_lower:
                    best_match = " and provide feedback."
                else:
                    best_match = ". All participants are encouraged to contribute."
            elif context_type == SuggestionType.DEPARTMENT:
                best_match = " and supports the organisation's objectives."
            else:
                best_match = ". Further details will be provided."
            best_confidence = 0.55
    
    return InlineCompletionResponse(
        completion=best_match,
        full_text=text + best_match,
        confidence=best_confidence
    )


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Staff Management AI Assistant",
        "version": "1.0.0",
        "language": "UK English"
    }


@app.post("/api/suggest/description", response_model=DescriptionResponse)
async def suggest_description(request: DescriptionRequest):
    """
    Generate description suggestion based on title and type
    
    - **title**: The title/name of the item
    - **type**: Type of suggestion (task, meeting, department, general)
    - **context**: Additional context like priority, duration, etc.
    """
    # Simulate slight delay for realistic feel
    await asyncio.sleep(0.1)
    
    if not request.title.strip():
        raise HTTPException(status_code=400, detail="Title cannot be empty")
    
    if request.type == SuggestionType.TASK:
        return generate_task_description(request.title, request.context)
    elif request.type == SuggestionType.MEETING:
        return generate_meeting_description(request.title, request.context)
    elif request.type == SuggestionType.DEPARTMENT:
        return generate_department_description(request.title, request.context)
    else:
        # General suggestion - try to detect type from title
        title_lower = request.title.lower()
        if any(word in title_lower for word in ["meeting", "session", "call", "sync"]):
            return generate_meeting_description(request.title, request.context)
        elif any(word in title_lower for word in ["team", "department", "group", "division"]):
            return generate_department_description(request.title, request.context)
        else:
            return generate_task_description(request.title, request.context)


@app.post("/api/suggest/completion", response_model=InlineCompletionResponse)
async def suggest_completion(request: InlineCompletionRequest):
    """
    Generate inline text completion suggestion
    
    - **text**: Current text in the field
    - **field_type**: Type of field (title, description, agenda)
    - **context_type**: Context type (task, meeting, department)
    """
    # Simulate slight delay for realistic feel
    await asyncio.sleep(0.05)
    
    if not request.text.strip():
        return InlineCompletionResponse(
            completion="",
            full_text="",
            confidence=0
        )
    
    return generate_inline_completion(
        request.text,
        request.field_type,
        request.context_type
    )


@app.post("/api/suggest/alternatives")
async def suggest_alternatives(request: DescriptionRequest):
    """
    Generate multiple alternative descriptions
    """
    await asyncio.sleep(0.1)
    
    if not request.title.strip():
        raise HTTPException(status_code=400, detail="Title cannot be empty")
    
    subject = extract_subject(request.title)
    alternatives = []
    
    if request.type == SuggestionType.TASK:
        templates = TASK_TEMPLATES
    elif request.type == SuggestionType.MEETING:
        templates = MEETING_TEMPLATES
    elif request.type == SuggestionType.DEPARTMENT:
        templates = DEPARTMENT_TEMPLATES
    else:
        templates = TASK_TEMPLATES
    
    for key, template in templates.items():
        if key != "default":
            if request.type == SuggestionType.DEPARTMENT:
                alt = template.format(name=request.title)
            else:
                alt = template.format(subject=subject)
            alternatives.append({
                "type": key,
                "description": alt
            })
    
    return {"alternatives": alternatives[:5]}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=True)
