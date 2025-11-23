# backend/schemas.py
from typing import List, Optional
from pydantic import BaseModel


class StartInterviewRequest(BaseModel):
    role: str
    level: str = "junior"
    num_questions: int = 5


class QuestionOut(BaseModel):
    id: int
    text: str
    category: str
    difficulty: str


class StartInterviewResponse(BaseModel):
    session_id: str
    first_question: QuestionOut
    total_questions: int


class AnswerRequest(BaseModel):
    session_id: str
    question_id: int
    user_answer: str


class AnswerFeedback(BaseModel):
    overall_score: float
    clarity_score: float
    coverage_score: float
    feedback_points: List[str]
    follow_up_question: Optional[str] = None
    is_last_question: bool = False
    next_question: Optional[QuestionOut] = None


class SessionSummary(BaseModel):
    session_id: str
    role: str
    total_questions: int
    avg_score: float
    strengths: List[str]
    improvements: List[str]
