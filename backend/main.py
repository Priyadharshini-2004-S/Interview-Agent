# backend/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uuid
from typing import Dict, Any, List

from .schemas import (
    StartInterviewRequest,
    StartInterviewResponse,
    AnswerRequest,
    AnswerFeedback,
    SessionSummary,
    QuestionOut,
)
from .qa_loader import QuestionBank
from .rag_retriever import SimpleRAGRetriever
from .evaluator import evaluate_answer


app = FastAPI(title="AI Interview Practice Partner")

# CORS (allow frontend like React)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global objects
qb = QuestionBank()
retriever = SimpleRAGRetriever(qb.get_all_soft_qa())

# In-memory session store
SESSIONS: Dict[str, Dict[str, Any]] = {}


@app.post("/start_interview", response_model=StartInterviewResponse)
def start_interview(payload: StartInterviewRequest):
    questions = qb.get_questions_for_role(
        role=payload.role,
        level=payload.level,
        num_questions=payload.num_questions,
    )

    if not questions:
        raise HTTPException(status_code=400, detail="No questions found for this role.")

    session_id = str(uuid.uuid4())

    SESSIONS[session_id] = {
        "role": payload.role,
        "level": payload.level,
        "questions": questions,
        "current_index": 0,
        "feedback_history": [],  # list of {question_id, score, feedback}
    }

    first = questions[0]
    first_q = QuestionOut(
        id=first["id"],
        text=first["text"],
        category=first["category"],
        difficulty=first["difficulty"],
    )

    return StartInterviewResponse(
        session_id=session_id,
        first_question=first_q,
        total_questions=len(questions),
    )


@app.post("/answer", response_model=AnswerFeedback)
def submit_answer(payload: AnswerRequest):
    session = SESSIONS.get(payload.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    questions: List[Dict[str, Any]] = session["questions"]
    idx: int = session["current_index"]

    if idx >= len(questions):
        raise HTTPException(status_code=400, detail="Interview already completed.")

    current_question = questions[idx]
    if current_question["id"] != payload.question_id:
        raise HTTPException(status_code=400, detail="Question ID does not match current question.")

    question_text = current_question["text"]

    # Retrieve ideal answer from software questions CSV
    match = retriever.get_best_match(question_text)
    ideal_answer = match[1] if match else None

    eval_result = evaluate_answer(
        question=question_text,
        user_answer=payload.user_answer,
        ideal_answer=ideal_answer,
    )

    # Save history
    session["feedback_history"].append(
        {
            "question_id": payload.question_id,
            "overall_score": eval_result["overall_score"],
            "clarity_score": eval_result["clarity_score"],
            "coverage_score": eval_result["coverage_score"],
            "feedback_points": eval_result["feedback_points"],
        }
    )

    # Move to next question
    session["current_index"] += 1
    idx = session["current_index"]

    is_last = idx >= len(questions)

    next_question_out = None
    if not is_last:
        next_q = questions[idx]
        next_question_out = QuestionOut(
            id=next_q["id"],
            text=next_q["text"],
            category=next_q["category"],
            difficulty=next_q["difficulty"],
        )

    return AnswerFeedback(
        overall_score=eval_result["overall_score"],
        clarity_score=eval_result["clarity_score"],
        coverage_score=eval_result["coverage_score"],
        feedback_points=eval_result["feedback_points"],
        follow_up_question=eval_result["follow_up_question"],
        is_last_question=is_last,
        next_question=next_question_out,
    )


@app.get("/summary/{session_id}", response_model=SessionSummary)
def get_summary(session_id: str):
    session = SESSIONS.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    history = session["feedback_history"]
    if not history:
        raise HTTPException(status_code=400, detail="No answers submitted yet.")

    scores = [h["overall_score"] for h in history]
    avg_score = round(sum(scores) / len(scores), 2)

    strengths: List[str] = []
    improvements: List[str] = []

    if avg_score >= 4:
        strengths.append("Overall strong technical explanations and clarity.")
    elif avg_score >= 3:
        strengths.append("You have a reasonable understanding of the topics.")
    else:
        improvements.append("Revise core technical concepts and practice structuring your answers.")

    # Aggregate common feedback keywords
    all_feedback_text = " ".join(" ".join(h["feedback_points"]) for h in history)
    if "structure" in all_feedback_text.lower():
        improvements.append("Work on structuring answers (Intro → Concept → Example → Summary).")
    if "examples" in all_feedback_text.lower():
        improvements.append("Add real-world examples in your answers.")

    if not strengths:
        strengths.append("You are taking the right step by practicing interviews. Keep going!")

    if not improvements:
        improvements.append("Fine-tune your explanations and practice more mock interviews.")

    return SessionSummary(
        session_id=session_id,
        role=session["role"],
        total_questions=len(session["questions"]),
        avg_score=avg_score,
        strengths=strengths,
        improvements=improvements,
    )
