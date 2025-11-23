# backend/evaluator.py
from typing import Dict, List, Optional
import re

STOPWORDS = {
    "the", "is", "a", "an", "of", "and", "to", "in", "on", "for", "with", "that",
    "this", "it", "as", "by", "at", "are", "be", "or", "from"
}


def tokenize(text: str) -> List[str]:
    if not text:
        return []
    text = text.lower()
    tokens = re.findall(r"[a-zA-Z]+", text)
    return [t for t in tokens if t not in STOPWORDS]


def jaccard_similarity(a: List[str], b: List[str]) -> float:
    set_a = set(a)
    set_b = set(b)
    if not set_a and not set_b:
        return 0.0
    inter = len(set_a & set_b)
    union = len(set_a | set_b)
    return inter / union if union > 0 else 0.0


def _coverage_score_from_ratio(ratio: float) -> int:
    """
    Map keyword coverage ratio [0,1] -> score 1..5.

    - >= 0.75 → 5 (very good / almost all key points)
    - 0.55–0.74 → 4 (good, minor gaps)
    - 0.35–0.54 → 3 (partially correct)
    - 0.18–0.34 → 2 (somewhat related)
    - < 0.18  → 1 (mostly incorrect / off-topic)
    """
    if ratio >= 0.75:
        return 5
    elif ratio >= 0.55:
        return 4
    elif ratio >= 0.35:
        return 3
    elif ratio >= 0.18:
        return 2
    else:
        return 1


def _clarity_score_from_length(word_count: int) -> int:
    """
    Simple clarity heuristic based on answer length.
    Too short = unclear, too long but unstructured is also not great,
    but we approximate here using only length.
    """
    if word_count >= 80:
        return 5
    elif word_count >= 50:
        return 4
    elif word_count >= 25:
        return 3
    elif word_count >= 10:
        return 2
    elif word_count > 0:
        return 1
    else:
        return 1


def evaluate_answer(
    question: str,
    user_answer: str,
    ideal_answer: Optional[str]
) -> Dict:
    """
    Improved evaluation:
    - Extracts keywords from ideal answer
    - Checks how many are covered in user answer
    - Gives partial marks for partially correct answers
    - Gives higher marks when most keywords are covered
    - Uses answer length as a proxy for clarity
    - Generates feedback + follow-up question based on missing keywords
    """

    user_answer = (user_answer or "").strip()

    # If user didn't answer at all
    if not user_answer:
        return {
            "overall_score": 1.0,
            "clarity_score": 1.0,
            "coverage_score": 1.0,
            "feedback_points": [
                "You did not provide an answer. In an interview, always attempt an answer, even if you are not fully sure.",
                "Try to at least define the term, then give one example or scenario."
            ],
            "follow_up_question": "Can you try to give a short explanation in your own words, even if you’re not fully confident?"
        }

    user_tokens = tokenize(user_answer)
    ideal_tokens = tokenize(ideal_answer) if ideal_answer else []

    # If we don't have an ideal answer (no match found), fall back to simple clarity-only scoring
    if not ideal_tokens:
        word_count = len(user_answer.split())
        clarity_score = _clarity_score_from_length(word_count)
        overall_score = float(clarity_score)  # only clarity available

        feedback_points = [
            "I don't have a reference answer for this question, so I evaluated mainly based on how clearly you explained.",
        ]
        if clarity_score <= 2:
            feedback_points.append(
                "Try to give a bit more detail: define the concept, explain how it works, and give one example."
            )
        else:
            feedback_points.append(
                "Your explanation has a reasonable length. You can improve further by adding more precise technical details."
            )

        return {
            "overall_score": float(overall_score),
            "clarity_score": float(clarity_score),
            "coverage_score": 3.0,  # neutral
            "feedback_points": feedback_points,
            "follow_up_question": None,
        }

    # --- Keyword coverage / correctness ---
    ideal_set = set(ideal_tokens)
    user_set = set(user_tokens)

    common_keywords = sorted(list(ideal_set & user_set))
    missing_keywords = sorted(list(ideal_set - user_set))

    # Use ratio of matched keywords for correctness / coverage
    coverage_ratio = len(common_keywords) / len(ideal_set) if ideal_set else 0.0
    coverage_score = _coverage_score_from_ratio(coverage_ratio)

    # --- Clarity based on length ---
    word_count = len(user_answer.split())
    clarity_score = _clarity_score_from_length(word_count)

    # Overall score: weight correctness more than clarity
    overall_score = round(0.7 * coverage_score + 0.3 * clarity_score, 2)

    feedback_points: List[str] = []

    # Feedback based on correctness / coverage
    if coverage_score >= 5:
        feedback_points.append(
            "Excellent: you covered almost all of the important technical points for this question."
        )
    elif coverage_score == 4:
        feedback_points.append(
            "Good answer: you covered most of the important concepts, with only a few minor gaps."
        )
    elif coverage_score == 3:
        feedback_points.append(
            "Your answer is partially correct. You mentioned some key ideas, but you missed a few important concepts."
        )
    elif coverage_score == 2:
        feedback_points.append(
            "Your answer is somewhat related to the topic, but it misses many core technical points."
        )
    else:
        feedback_points.append(
            "Your answer is mostly off-topic or missing the main idea. Try to start by defining the term clearly."
        )

    # Feedback based on clarity
    if clarity_score >= 4:
        feedback_points.append(
            "Your explanation length is good. In an interview, keep this structure: definition → explanation → example."
        )
    elif clarity_score == 3:
        feedback_points.append(
            "The explanation length is okay, but you can improve clarity by organizing your answer into clear steps."
        )
    else:
        feedback_points.append(
            "Try to give a slightly longer and more structured explanation: start with a simple definition, then add 1–2 supporting points."
        )

    # Add info on what was done well (matched keywords)
    if common_keywords:
        feedback_points.append(
            "Good job mentioning key terms like: " + ", ".join(common_keywords[:5]) + "."
        )

    # Follow-up question based on missing keywords
    follow_up_question = None
    if missing_keywords:
        # Pick up to 3 missing keywords that are a bit longer (more meaningful)
        important_missing = [w for w in missing_keywords if len(w) > 3][:3]
        if important_missing:
            joined = ", ".join(important_missing)
            follow_up_question = (
                f"You did not clearly mention: {joined}. "
                f"Can you also explain how {joined} relates to this question?"
            )

    return {
        "overall_score": float(overall_score),
        "clarity_score": float(clarity_score),
        "coverage_score": float(coverage_score),
        "feedback_points": feedback_points,
        "follow_up_question": follow_up_question,
    }
