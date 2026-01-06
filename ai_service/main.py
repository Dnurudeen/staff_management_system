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
import random
import hashlib
import time
from enum import Enum

app = FastAPI(
    title="Staff Management AI Assistant",
    description="AI-powered suggestion service for tasks, meetings, and departments",
    version="1.0.0"
)

# CORS middleware for React frontend
# Allow all origins for now - restrict in production if needed
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
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
    regenerate: Optional[bool] = Field(default=False, description="Force a different suggestion")


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
# Multiple variations for each template type to ensure variety

TASK_TEMPLATES = {
    "review": [
        "Review and provide comprehensive feedback on {subject}. Ensure all key points are addressed and documented accordingly. Please complete this task by the specified deadline.",
        "Conduct a thorough review of {subject}, identifying strengths, weaknesses, and areas requiring attention. Compile findings into a detailed report for stakeholder consideration.",
        "Examine {subject} critically, ensuring compliance with established standards and best practices. Provide actionable recommendations for improvement where necessary.",
        "Undertake a systematic review of {subject}, assessing quality, accuracy, and completeness. Highlight any discrepancies and propose corrective measures.",
        "Perform an in-depth analysis and review of {subject}. Document observations, flag potential issues, and prepare a summary for team discussion.",
    ],
    "prepare": [
        "Prepare all necessary documentation and materials for {subject}. Coordinate with relevant team members and ensure everything is organised properly.",
        "Assemble and organise all required resources for {subject}. Verify completeness, accuracy, and adherence to organisational standards before distribution.",
        "Develop comprehensive preparation materials for {subject}, including supporting documents, reference materials, and any prerequisite information needed.",
        "Create a well-structured preparation pack for {subject}. Ensure all stakeholders have access to the necessary information in advance.",
        "Compile essential materials and documentation for {subject}. Cross-reference requirements with relevant parties to ensure nothing is overlooked.",
    ],
    "complete": [
        "Complete the assigned work on {subject}. Follow the established guidelines and maintain quality standards throughout the process.",
        "Finalise all outstanding activities related to {subject}. Ensure deliverables meet the specified requirements and are ready for handover.",
        "Bring {subject} to completion, adhering to agreed timelines and quality benchmarks. Document any challenges encountered and lessons learnt.",
        "Execute and complete all tasks associated with {subject}. Perform quality checks before submission and obtain necessary approvals.",
        "Deliver the finished work on {subject}, ensuring all acceptance criteria have been satisfied. Provide a completion summary for records.",
    ],
    "update": [
        "Update the existing {subject} with the latest information. Verify accuracy and ensure all stakeholders are informed of the changes.",
        "Refresh and revise {subject} to reflect current status and recent developments. Maintain version control and communicate updates appropriately.",
        "Modify {subject} to incorporate new data, feedback, or requirements. Ensure consistency across related documents and systems.",
        "Revise {subject} comprehensively, addressing outdated information and incorporating recent changes. Circulate the updated version to relevant parties.",
        "Bring {subject} up to date with the latest standards and information. Track all changes made and notify affected stakeholders.",
    ],
    "create": [
        "Create a new {subject} following the organisation's standards and best practices. Document all relevant details and seek approval where necessary.",
        "Develop {subject} from scratch, ensuring alignment with project objectives and organisational guidelines. Include all required components and documentation.",
        "Design and build {subject}, incorporating stakeholder requirements and industry best practices. Produce accompanying documentation as needed.",
        "Establish {subject} with careful attention to detail and compliance requirements. Validate the output against specified criteria before finalisation.",
        "Construct {subject} methodically, following approved templates and standards. Obtain feedback from key stakeholders during the development process.",
    ],
    "analyse": [
        "Analyse {subject} thoroughly and prepare a detailed report. Identify key findings, trends, and actionable recommendations.",
        "Conduct comprehensive analysis of {subject}, examining patterns, anomalies, and underlying factors. Present insights in a clear, structured format.",
        "Investigate {subject} systematically, gathering relevant data and applying appropriate analytical methods. Summarise conclusions and next steps.",
        "Perform detailed examination of {subject}, assessing performance metrics and identifying opportunities for improvement. Provide evidence-based recommendations.",
        "Study {subject} in depth, evaluating strengths, weaknesses, and areas of concern. Deliver a comprehensive analysis report with supporting data.",
    ],
    "organise": [
        "Organise {subject} efficiently, ensuring all components are properly arranged and accessible. Maintain clear documentation throughout.",
        "Structure and coordinate {subject}, establishing logical workflows and clear responsibilities. Ensure effective communication channels are in place.",
        "Arrange {subject} systematically, optimising for efficiency and ease of access. Create supporting materials to guide participants or users.",
        "Coordinate {subject} comprehensively, addressing logistics, resources, and stakeholder engagement. Monitor progress and address issues promptly.",
        "Set up and manage {subject}, ensuring smooth execution and proper resource allocation. Document procedures for future reference.",
    ],
    "coordinate": [
        "Coordinate with team members regarding {subject}. Ensure clear communication and alignment on objectives and timelines.",
        "Facilitate collaboration across teams on {subject}, managing dependencies and ensuring seamless integration of contributions.",
        "Lead coordination efforts for {subject}, establishing regular check-ins and maintaining transparent communication with all parties involved.",
        "Manage the coordination of {subject}, tracking progress, resolving conflicts, and ensuring collective alignment towards shared goals.",
        "Oversee collaborative work on {subject}, ensuring all participants are informed, engaged, and working towards common objectives.",
    ],
    "implement": [
        "Implement the planned changes for {subject}. Follow the approved approach and document any deviations or issues encountered.",
        "Execute the implementation plan for {subject}, ensuring smooth transition and minimal disruption. Provide regular status updates to stakeholders.",
        "Deploy {subject} according to specifications, conducting thorough testing and validation. Address any issues identified during rollout.",
        "Carry out the implementation of {subject}, coordinating with affected teams and ensuring all prerequisites are satisfied beforehand.",
        "Roll out {subject} systematically, following the established implementation roadmap. Monitor performance and gather feedback post-deployment.",
    ],
    "evaluate": [
        "Evaluate {subject} against established criteria. Provide objective assessment and recommendations for improvement.",
        "Assess {subject} comprehensively, measuring performance against benchmarks and identifying areas for enhancement. Document findings clearly.",
        "Conduct thorough evaluation of {subject}, considering effectiveness, efficiency, and stakeholder satisfaction. Propose actionable improvements.",
        "Review and assess {subject} objectively, using defined metrics and criteria. Prepare an evaluation report with supporting evidence.",
        "Appraise {subject} systematically, identifying successes, challenges, and opportunities. Provide balanced recommendations based on findings.",
    ],
    "default": [
        "Complete the task related to {subject}. Ensure all requirements are met and deliverables are of high quality. Please coordinate with relevant stakeholders as needed.",
        "Address {subject} with attention to detail and adherence to established standards. Keep stakeholders informed of progress and any issues encountered.",
        "Work on {subject} diligently, ensuring quality outcomes and timely delivery. Seek clarification on any ambiguous requirements and document your progress.",
        "Execute tasks associated with {subject}, following best practices and maintaining clear communication. Deliver results that meet or exceed expectations.",
        "Handle {subject} professionally, ensuring compliance with guidelines and standards. Provide regular updates and escalate concerns as appropriate.",
    ]
}

MEETING_TEMPLATES = {
    "planning": [
        "This meeting will focus on planning and strategising for {subject}. We shall review current status, discuss objectives, and establish clear action items. All participants are encouraged to come prepared with their updates.",
        "Strategic planning session for {subject}. The agenda includes reviewing progress, identifying priorities, and defining the roadmap ahead. Please bring relevant data and proposals for discussion.",
        "Planning meeting dedicated to {subject}. We will assess where we stand, determine key milestones, and allocate responsibilities. Active participation from all attendees is essential.",
        "Collaborative planning discussion on {subject}. Topics include goal-setting, resource planning, and timeline establishment. Come prepared with your insights and suggestions.",
        "This session aims to develop a comprehensive plan for {subject}. We will analyse requirements, discuss approaches, and agree on deliverables and deadlines.",
    ],
    "review": [
        "A review session to assess progress on {subject}. We shall examine achievements, identify challenges, and determine necessary adjustments to our approach.",
        "Progress review meeting for {subject}. We will evaluate completed work, discuss blockers, and refine our strategy moving forward. Please prepare status updates.",
        "This meeting provides an opportunity to review {subject} in detail. We will celebrate successes, address concerns, and agree on corrective actions if needed.",
        "Comprehensive review of {subject}. The session will cover performance metrics, lessons learnt, and recommendations for improvement. Data-driven insights are welcome.",
        "Team review session focusing on {subject}. We will assess outcomes against objectives, discuss feedback, and plan subsequent steps.",
    ],
    "brainstorm": [
        "An open discussion session to generate ideas and solutions for {subject}. All contributions are welcome, and we shall work collaboratively to find the best approaches.",
        "Creative brainstorming meeting on {subject}. This is a safe space to share innovative ideas without judgement. Our goal is to explore possibilities and spark new thinking.",
        "Ideation session dedicated to {subject}. We encourage free-flowing discussion and out-of-the-box thinking. All ideas will be captured and evaluated for feasibility.",
        "Collaborative brainstorm for {subject}. Bring your creativity and enthusiasm as we explore solutions together. Diverse perspectives are highly valued.",
        "This brainstorming session invites fresh thinking on {subject}. We will use structured techniques to generate, refine, and prioritise ideas for implementation.",
    ],
    "training": [
        "Training session covering {subject}. Participants will gain practical knowledge and skills. Please bring any questions or specific topics you would like addressed.",
        "Educational workshop on {subject}. This session aims to build competency through instruction and hands-on exercises. Materials will be provided.",
        "Skill development training focusing on {subject}. Participants will learn key concepts, best practices, and practical applications. Interactive elements included.",
        "Comprehensive training on {subject}. The session includes theoretical foundations, practical demonstrations, and Q&A. Attendance is encouraged for all relevant staff.",
        "Learning session dedicated to {subject}. Our objective is to enhance understanding and capability in this area. Please come prepared to engage actively.",
    ],
    "update": [
        "Regular update meeting regarding {subject}. Team members will share progress, raise concerns, and align on next steps.",
        "Status update session on {subject}. This meeting provides visibility into current activities and upcoming priorities. Brief updates from each area are expected.",
        "Team sync meeting focusing on {subject}. We will share updates, coordinate activities, and ensure everyone is aligned on key developments.",
        "Periodic update on {subject}. The purpose is to maintain transparency, identify dependencies, and address any blockers. Please prepare concise updates.",
        "Standing update meeting for {subject}. We will review what has been accomplished, what is in progress, and what requires attention going forward.",
    ],
    "kickoff": [
        "Project kickoff meeting for {subject}. We shall establish objectives, assign responsibilities, and set expectations for the project timeline.",
        "Launch meeting for {subject}. This session marks the formal start of the initiative. We will review scope, introduce team members, and outline the approach.",
        "Kickoff session for {subject}. The agenda includes vision-setting, role clarification, and timeline discussion. This meeting sets the foundation for success.",
        "Initiation meeting for {subject}. We will align on goals, discuss deliverables, and establish communication protocols for the duration of the project.",
        "Formal kickoff for {subject}. Key topics include project charter review, stakeholder expectations, and team commitments. Full attendance is required.",
    ],
    "retrospective": [
        "Retrospective meeting to reflect on {subject}. We shall discuss what went well, areas for improvement, and lessons learnt.",
        "Team retrospective on {subject}. This is an opportunity to openly discuss experiences, celebrate achievements, and identify actionable improvements.",
        "Reflection session for {subject}. We will review our journey, acknowledge contributions, and capture insights for future endeavours.",
        "Post-mortem meeting on {subject}. Our aim is constructive analysis of outcomes, process evaluation, and continuous improvement. All perspectives are valued.",
        "Retrospective discussion for {subject}. We will examine successes and challenges, fostering a culture of learning and growth within the team.",
    ],
    "one-on-one": [
        "One-on-one discussion regarding {subject}. This is an opportunity to provide feedback, discuss career development, and address any concerns.",
        "Personal meeting to discuss {subject}. Topics may include performance feedback, goal-setting, and professional development opportunities.",
        "Individual catch-up on {subject}. This meeting provides dedicated time for open dialogue, support, and alignment on personal objectives.",
        "One-on-one session covering {subject}. We will discuss progress, challenges, and how best to support your success and growth.",
        "Private discussion regarding {subject}. This is a confidential space to share thoughts, receive guidance, and plan development activities.",
    ],
    "default": [
        "Meeting to discuss {subject}. We shall cover key points, make decisions where necessary, and establish clear action items for follow-up.",
        "Team meeting on {subject}. The session will address relevant topics, facilitate discussion, and ensure alignment across participants.",
        "Discussion session regarding {subject}. We will review important matters, seek input from attendees, and determine next steps collaboratively.",
        "Scheduled meeting for {subject}. The agenda includes topic discussion, decision-making, and action item assignment. Please come prepared to contribute.",
        "General meeting covering {subject}. We will address outstanding items, share updates, and ensure everyone leaves with clarity on their responsibilities.",
    ]
}

DEPARTMENT_TEMPLATES = {
    "engineering": [
        "The {name} team is responsible for technical development, innovation, and maintaining high-quality standards across all engineering projects. The team collaborates closely with other departments to deliver robust solutions.",
        "The {name} department drives technical excellence, building and maintaining systems that power the organisation. Team members bring expertise in software development, architecture, and problem-solving.",
        "{name} encompasses the technical workforce responsible for designing, developing, and deploying solutions. The team emphasises quality, innovation, and continuous improvement in all endeavours.",
        "The {name} team delivers technical solutions aligned with business objectives. Responsibilities include system development, code quality assurance, and technological innovation.",
        "{name} is the technical backbone of the organisation, responsible for engineering solutions that meet evolving business needs. The team values collaboration, craftsmanship, and continuous learning.",
    ],
    "marketing": [
        "The {name} team drives brand awareness, customer engagement, and market growth initiatives. The team develops and executes strategic campaigns aligned with organisational objectives.",
        "{name} is responsible for promoting the organisation's products and services, building brand equity, and generating demand. The team combines creativity with data-driven strategies.",
        "The {name} department leads marketing strategy, content creation, and campaign execution. Team members work to enhance visibility and attract target audiences through various channels.",
        "{name} focuses on communicating value to customers and prospects. The team manages brand identity, marketing communications, and digital presence to drive business growth.",
        "The {name} team crafts compelling narratives and campaigns that resonate with audiences. Responsibilities include market research, campaign development, and performance analysis.",
    ],
    "sales": [
        "The {name} team focuses on revenue generation, client relationships, and business development. The team works to identify opportunities and deliver value to customers.",
        "{name} is responsible for driving sales growth and building lasting customer partnerships. Team members engage prospects, manage accounts, and close deals to meet revenue targets.",
        "The {name} department leads commercial efforts, from lead generation to deal closure. The team combines relationship-building skills with product expertise to deliver results.",
        "{name} drives the organisation's revenue engine through strategic selling and account management. The team is dedicated to understanding customer needs and delivering tailored solutions.",
        "The {name} team is at the forefront of customer acquisition and retention. Responsibilities include prospecting, negotiation, and fostering long-term business relationships.",
    ],
    "hr": [
        "The {name} team manages human resources, talent acquisition, employee relations, and organisational development. The team ensures a positive workplace culture and supports staff wellbeing.",
        "{name} is dedicated to attracting, developing, and retaining top talent. The team handles recruitment, performance management, and employee engagement initiatives.",
        "The {name} department oversees people operations, ensuring the organisation has the human capital needed to succeed. Team focus areas include hiring, training, and employee support.",
        "{name} champions the employee experience, from onboarding to career development. The team fosters a culture of respect, inclusion, and continuous growth.",
        "The {name} team supports organisational success through effective people management. Responsibilities include talent acquisition, policy development, and employee relations.",
    ],
    "finance": [
        "The {name} team oversees financial planning, reporting, and compliance. The team ensures fiscal responsibility and provides strategic financial guidance.",
        "{name} manages the organisation's financial health, including budgeting, accounting, and financial analysis. The team supports informed decision-making through accurate reporting.",
        "The {name} department is responsible for financial stewardship, ensuring resources are managed effectively. Team activities include forecasting, compliance, and financial controls.",
        "{name} provides financial leadership and oversight, supporting sustainable growth. The team handles treasury, reporting, and financial strategy.",
        "The {name} team ensures sound financial management and transparency. Responsibilities include financial planning, audit support, and regulatory compliance.",
    ],
    "operations": [
        "The {name} team manages day-to-day operational activities, process optimisation, and resource allocation. The team ensures efficient and effective business operations.",
        "{name} is the operational backbone of the organisation, ensuring smooth execution of daily activities. The team focuses on process improvement and resource efficiency.",
        "The {name} department oversees operational processes, logistics, and service delivery. Team members work to streamline operations and enhance productivity.",
        "{name} ensures the organisation runs efficiently by managing operations, workflows, and resources. The team continuously seeks improvements to deliver better outcomes.",
        "The {name} team coordinates operational activities across the organisation. Responsibilities include process management, capacity planning, and operational excellence.",
    ],
    "support": [
        "The {name} team provides assistance and resolves issues for internal and external stakeholders. The team maintains high service standards and customer satisfaction.",
        "{name} is dedicated to helping users and customers succeed by providing timely, effective support. The team handles enquiries, troubleshooting, and issue resolution.",
        "The {name} department delivers responsive support services, ensuring positive experiences for all stakeholders. Team focus includes problem-solving and service excellence.",
        "{name} serves as the frontline for customer and employee assistance. The team is committed to resolving issues efficiently while maintaining empathy and professionalism.",
        "The {name} team ensures stakeholders receive the help they need promptly. Responsibilities include ticket management, knowledge sharing, and continuous service improvement.",
    ],
    "design": [
        "The {name} team creates user-centred designs, visual assets, and brand materials. The team ensures consistency and excellence in all design deliverables.",
        "{name} brings creativity and user focus to every project. The team is responsible for visual design, user experience, and brand identity across all touchpoints.",
        "The {name} department crafts compelling designs that enhance user experiences and brand perception. Team expertise spans UI/UX design, graphics, and creative direction.",
        "{name} transforms ideas into visually appealing and functional designs. The team collaborates across departments to deliver cohesive, impactful creative work.",
        "The {name} team shapes the visual identity and user experience of products and communications. Responsibilities include design strategy, prototyping, and creative production.",
    ],
    "product": [
        "The {name} team drives product strategy, roadmap development, and feature prioritisation. The team works cross-functionally to deliver products that meet customer needs.",
        "{name} is responsible for defining and delivering products that create value for customers and the business. The team balances user needs with technical feasibility and business goals.",
        "The {name} department leads product vision, planning, and execution. Team members work closely with engineering, design, and stakeholders to bring products to market.",
        "{name} shapes the product portfolio through research, strategy, and prioritisation. The team ensures products evolve to meet changing market demands.",
        "The {name} team owns the product lifecycle from concept to delivery. Responsibilities include market analysis, feature definition, and cross-functional coordination.",
    ],
    "default": [
        "The {name} team plays a vital role in the organisation's success. The team collaborates effectively with other departments and maintains high standards of professionalism and delivery.",
        "{name} contributes to organisational objectives through dedicated effort and teamwork. The team is committed to excellence and continuous improvement in its area of responsibility.",
        "The {name} department supports the organisation's mission by delivering quality outcomes. Team members work collaboratively to achieve shared goals.",
        "{name} is an integral part of the organisation, providing essential services and expertise. The team values collaboration, integrity, and results.",
        "The {name} team is dedicated to excellence in its domain. Responsibilities include delivering quality work, supporting colleagues, and contributing to organisational success.",
    ]
}

# Sentence enhancers for more variety
SENTENCE_ENHANCERS = [
    "This initiative aligns with our strategic objectives and supports broader organisational goals.",
    "Clear communication and collaboration are essential for successful delivery.",
    "Regular progress updates will be provided to keep all stakeholders informed.",
    "Quality assurance and attention to detail are paramount throughout this process.",
    "Feedback and input from team members are welcome and encouraged.",
    "Documentation should be maintained to support future reference and knowledge transfer.",
    "Timely completion will enable subsequent activities to proceed as planned.",
    "Please escalate any blockers or concerns promptly to ensure we stay on track.",
    "This work contributes to our commitment to excellence and continuous improvement.",
    "Cross-functional collaboration may be required to achieve the best outcomes.",
]

# Opening phrases for variety
OPENING_PHRASES = [
    "This {type} involves",
    "The objective is to",
    "This {type} focuses on",
    "The purpose of this {type} is to",
    "This {type} is designed to",
    "The goal of this {type} is to",
    "This {type} aims to",
    "The scope of this {type} includes",
]

# Closing phrases for variety
CLOSING_PHRASES = [
    "Please ensure timely completion and maintain quality standards.",
    "Coordinate with relevant stakeholders as needed.",
    "Keep all parties informed of progress and any issues encountered.",
    "Deliver results that meet or exceed expectations.",
    "Document findings and outcomes for future reference.",
    "Seek clarification on any ambiguous requirements.",
    "Maintain clear communication throughout the process.",
    "Ensure compliance with established guidelines and procedures.",
]


def get_random_seed():
    """Generate a seed based on current time for randomization"""
    return int(time.time() * 1000) % 10000


def select_template_variation(templates: list, title: str, regenerate: bool = False) -> str:
    """Select a template variation with randomization support"""
    if regenerate:
        # Use current time to ensure different selection
        random.seed(get_random_seed())
    else:
        # Use title-based seed for consistency on first request
        seed = int(hashlib.md5(title.encode()).hexdigest(), 16) % 10000
        random.seed(seed)
    
    return random.choice(templates)

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


def generate_task_description(title: str, context: Optional[dict] = None, regenerate: bool = False) -> DescriptionResponse:
    """Generate task description suggestion with variety"""
    template_key = detect_template_key(title)
    subject = extract_subject(title)
    templates = TASK_TEMPLATES.get(template_key, TASK_TEMPLATES["default"])
    
    # Select a template variation
    template = select_template_variation(templates, title, regenerate)
    suggestion = template.format(subject=subject)
    
    # Optionally add an enhancer for regeneration requests
    if regenerate:
        random.seed(get_random_seed())
        enhancer = random.choice(SENTENCE_ENHANCERS)
        suggestion = f"{suggestion} {enhancer}"
    
    # Add priority context if available
    if context and context.get("priority"):
        priority = context["priority"]
        if priority == "urgent":
            suggestion = f"URGENT: {suggestion} This is a high-priority task requiring immediate attention."
        elif priority == "high":
            suggestion = f"{suggestion} This task has been marked as high priority."
    
    # Generate alternatives from different template variations
    alternatives = []
    all_templates = []
    for key, tmpls in TASK_TEMPLATES.items():
        if key != "default":
            all_templates.extend([(key, t) for t in tmpls])
    
    random.seed(get_random_seed())
    random.shuffle(all_templates)
    
    for key, tmpl in all_templates:
        alt = tmpl.format(subject=subject)
        if alt != suggestion and alt not in alternatives:
            alternatives.append(alt)
            if len(alternatives) >= 3:
                break
    
    return DescriptionResponse(
        suggestion=suggestion,
        alternatives=alternatives,
        confidence=0.85 if template_key != "default" else 0.7
    )


def generate_meeting_description(title: str, context: Optional[dict] = None, regenerate: bool = False) -> DescriptionResponse:
    """Generate meeting description/agenda suggestion with variety"""
    meeting_type = detect_meeting_type(title)
    subject = extract_subject(title)
    templates = MEETING_TEMPLATES.get(meeting_type, MEETING_TEMPLATES["default"])
    
    # Select a template variation
    template = select_template_variation(templates, title, regenerate)
    suggestion = template.format(subject=subject)
    
    # Optionally add an enhancer for regeneration requests
    if regenerate:
        random.seed(get_random_seed())
        enhancer = random.choice(SENTENCE_ENHANCERS)
        suggestion = f"{suggestion} {enhancer}"
    
    # Add duration context if available
    if context and context.get("duration"):
        duration = context["duration"]
        suggestion += f" The meeting is scheduled for {duration} minutes."
    
    # Generate alternatives from different template variations
    alternatives = []
    all_templates = []
    for key, tmpls in MEETING_TEMPLATES.items():
        if key != "default":
            all_templates.extend([(key, t) for t in tmpls])
    
    random.seed(get_random_seed())
    random.shuffle(all_templates)
    
    for key, tmpl in all_templates:
        alt = tmpl.format(subject=subject)
        if alt != suggestion and alt not in alternatives:
            alternatives.append(alt)
            if len(alternatives) >= 3:
                break
    
    return DescriptionResponse(
        suggestion=suggestion,
        alternatives=alternatives,
        confidence=0.85 if meeting_type != "default" else 0.7
    )


def generate_department_description(name: str, context: Optional[dict] = None, regenerate: bool = False) -> DescriptionResponse:
    """Generate department description suggestion with variety"""
    dept_type = detect_department_type(name)
    templates = DEPARTMENT_TEMPLATES.get(dept_type, DEPARTMENT_TEMPLATES["default"])
    
    # Select a template variation
    template = select_template_variation(templates, name, regenerate)
    suggestion = template.format(name=name)
    
    # Generate alternatives from different template variations
    alternatives = []
    all_templates = []
    for key, tmpls in DEPARTMENT_TEMPLATES.items():
        if key != "default":
            all_templates.extend([(key, t) for t in tmpls])
    
    random.seed(get_random_seed())
    random.shuffle(all_templates)
    
    for key, tmpl in all_templates:
        alt = tmpl.format(name=name)
        if alt != suggestion and alt not in alternatives:
            alternatives.append(alt)
            if len(alternatives) >= 3:
                break
    
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
    - **regenerate**: Force a different suggestion (for rewrite functionality)
    """
    # Simulate slight delay for realistic feel
    await asyncio.sleep(0.1)
    
    if not request.title.strip():
        raise HTTPException(status_code=400, detail="Title cannot be empty")
    
    regenerate = request.regenerate or False
    
    if request.type == SuggestionType.TASK:
        return generate_task_description(request.title, request.context, regenerate)
    elif request.type == SuggestionType.MEETING:
        return generate_meeting_description(request.title, request.context, regenerate)
    elif request.type == SuggestionType.DEPARTMENT:
        return generate_department_description(request.title, request.context, regenerate)
    else:
        # General suggestion - try to detect type from title
        title_lower = request.title.lower()
        if any(word in title_lower for word in ["meeting", "session", "call", "sync"]):
            return generate_meeting_description(request.title, request.context, regenerate)
        elif any(word in title_lower for word in ["team", "department", "group", "division"]):
            return generate_department_description(request.title, request.context, regenerate)
        else:
            return generate_task_description(request.title, request.context, regenerate)


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
    
    # Collect all template variations
    all_alternatives = []
    for key, template_list in templates.items():
        if key != "default":
            for template in template_list:
                if request.type == SuggestionType.DEPARTMENT:
                    alt = template.format(name=request.title)
                else:
                    alt = template.format(subject=subject)
                all_alternatives.append({
                    "type": key,
                    "description": alt
                })
    
    # Shuffle and return top 5
    random.seed(get_random_seed())
    random.shuffle(all_alternatives)
    
    return {"alternatives": all_alternatives[:5]}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=True)
