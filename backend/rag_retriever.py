# backend/rag_retriever.py
from typing import Optional, Tuple
import difflib
import pandas as pd


class SimpleRAGRetriever:
    """
    Very simple retrieval:
    - Given a question text, find the most similar 'question' in software Q&A CSV.
    """

    def __init__(self, soft_df: pd.DataFrame):
        self.soft_df = soft_df
        # Expect columns: question, answer, category, difficulty
        self.soft_df.columns = [c.strip().lower() for c in self.soft_df.columns]

    def get_best_match(self, question_text: str) -> Optional[Tuple[str, str]]:
        if "question" not in self.soft_df.columns or "answer" not in self.soft_df.columns:
            return None

        best_ratio = 0.0
        best_q = None
        best_a = None

        for _, row in self.soft_df.iterrows():
            q = str(row["question"])
            ratio = difflib.SequenceMatcher(None, question_text.lower(), q.lower()).ratio()
            if ratio > best_ratio:
                best_ratio = ratio
                best_q = q
                best_a = str(row["answer"])

        # Use a small threshold to avoid completely unrelated match
        if best_ratio < 0.3:
            return None

        return best_q, best_a
