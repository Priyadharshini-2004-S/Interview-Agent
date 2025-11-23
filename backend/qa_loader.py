# backend/qa_loader.py
from pathlib import Path
from typing import List, Dict, Any
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

FULL_Q_FILE = DATA_DIR / "full_interview_questions_dataset.csv"
SOFT_Q_FILE = DATA_DIR / "Software Questions.csv"


class QuestionBank:
    def __init__(self):
        # Use latin1 to avoid UnicodeDecodeError from Excel-exported CSVs
        self.full_df = pd.read_csv(FULL_Q_FILE, encoding="latin1")
        self.soft_df = pd.read_csv(SOFT_Q_FILE, encoding="latin1")

        # Normalize column names
        self.full_df.columns = [c.strip().lower() for c in self.full_df.columns]
        self.soft_df.columns = [c.strip().lower() for c in self.soft_df.columns]

        # Expected columns:
        # full_df: question, role, category, difficulty
        # soft_df: question, answer, category, difficulty

        # Add internal ID to full question dataset if missing
        if "id" not in self.full_df.columns:
            self.full_df["id"] = range(1, len(self.full_df) + 1)

        # Clean up: drop rows without a question
        self.full_df = self.full_df.dropna(subset=["question"])
        # Remove duplicate question texts to avoid asking same question text again
        self.full_df = self.full_df.drop_duplicates(subset=["question"])

    def get_questions_for_role(
        self,
        role: str,
        level: str = "junior",
        num_questions: int = 5
    ) -> List[Dict[str, Any]]:

        # Never ask more than 15 questions in one interview
        MAX_QUESTIONS = 15
        requested = min(num_questions, MAX_QUESTIONS)

        df = self.full_df

        # Role filter (case-insensitive partial match)
        df_role = df[df["role"].str.lower().str.contains(role.lower(), na=False)]

        # If no role match → fallback to ALL questions
        if df_role.empty:
            df_role = df

        # Difficulty levels mapping
        level_map = {
            "fresher": ["easy"],
            "junior": ["easy", "medium"],
            "senior": ["medium", "hard"]
        }

        diffs = level_map.get(level.lower(), ["easy", "medium"])

        # Filter difficulty if column exists
        if "difficulty" in df_role.columns:
            df_level = df_role[df_role["difficulty"].str.lower().isin(diffs)]
        else:
            df_level = df_role

        # Fallback if still empty
        if df_level.empty:
            df_level = df_role

        # Additional: remove duplicates again at this stage (safety)
        df_level = df_level.dropna(subset=["question"])
        df_level = df_level.drop_duplicates(subset=["question"])

        # Random sample for variety (no fixed random_state so each session differs)
        sample_size = min(requested, len(df_level))
        df_sample = df_level.sample(n=sample_size, random_state=None)

        # Convert to output structure
        questions: List[Dict[str, Any]] = []
        for _, row in df_sample.iterrows():
            questions.append(
                {
                    "id": int(row["id"]),
                    "text": str(row["question"]),
                    "category": str(row.get("category", "")),
                    "difficulty": str(row.get("difficulty", "")),
                }
            )

        return questions

    def get_all_soft_qa(self) -> pd.DataFrame:
        return self.soft_df.copy()
