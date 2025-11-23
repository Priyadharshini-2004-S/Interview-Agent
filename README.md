# 🎤 AI Interview Practice Partner  
Voice-Enabled • Smart Scoring • RAG-Based Evaluation • 15 Dynamic Questions

This project is a complete *AI-powered mock interview system* with:

- 🎙 *Voice Input (Speech-to-Text)*
- 🔊 *Voice Output (Text-to-Speech)*
- 🤖 *AI Question Generator (CSV Dataset Based)*
- 🧠 *Keyword-Smart Evaluation*
- 📊 *Real-Time Scoring*
- 🔄 *RAG-based ideal answer retrieval*
- 📝 *Interview Summary with Strengths & Improvements*

Both *frontend (React + Tailwind + Lucide Icons)* and *backend (FastAPI)* are included.

---

# 🚀 Features

### 🎧 Voice Interaction
- The bot *asks questions using TTS*
- User *answers via mic*
- Answers are transcribed and evaluated

### ❓ Smart Question Selection (Upto 15 Questions)
- Pulls questions from *your uploaded datasets*
- Ensures *no duplicates*
- Questions are *role-based* and *difficulty-filtered*

### 🧠 Intelligent Answer Evaluation
The evaluator checks:

✔ Keyword coverage  
✔ Missing keywords  
✔ Clarity (answer length/structure)  
✔ Weighted scoring (70% correctness, 30% clarity)  
✔ Dynamic follow-up questions  

### 📊 Final Summary
- Average score  
- Aggregated strengths  
- Improvement areas  
- Professional interview-style notes  

---

# 📂 Project Structure

interview-agent/
│
├── backend/
│ ├── main.py
│ ├── evaluator.py
│ ├── rag_retriever.py
│ ├── qa_loader.py
│ ├── schemas.py
│ └── data/
│ ├── full_interview_questions_dataset.csv
│ └── Software Questions.csv
│
└── frontend/
└── my-interview-app/
├── src/
│ ├── App.jsx
│ ├── InterviewVoiceChat.jsx
│ └── index.css
├── tailwind.config.js
├── postcss.config.js
└── vite.config.js





---

# ⚙ *Backend Setup (FastAPI)*

### 1. Create virtual environment

```bash
python -m venv venv
source venv/bin/activate   # macOS & Linux
venv\Scripts\activate      # Windows




2. Install dependencies
pip install fastapi uvicorn pandas python-multipart



3. Run backend
uvicorn backend.main:app --reload


Backend starts on:

http://127.0.0.1:8000



Frontend Setup (React + Vite + Tailwind)
1. Go to frontend folder
cd frontend
cd my-interview-app

2. Install dependencies
npm install

3. Install Tailwind (Vite version)
npm install -D tailwindcss @tailwindcss/postcss autoprefixer

4. Create postcss.config.js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};

5. Add Tailwind to index.css
@tailwind base;
@tailwind components;
@tailwind utilities;

6. Run frontend
npm run dev


Frontend runs on:

http://localhost:5173

🧱 Backend Architecture
✔ qa_loader.py — Question Loader

Loads both CSV datasets, cleans duplicates, applies:

Role filters

Difficulty filters

Max 15 questions

Random sampling

✔ rag_retriever.py — Retrieval Augmented Generation

Uses string similarity to find most relevant ideal answer from dataset.

✔ evaluator.py — Smart Evaluation Engine

Improved scoring logic:

Keyword extraction

Jaccard similarity

Weighted score (correctness > clarity)

Missing keyword follow-up questions

Partial credit for partially correct answers

Detects empty answers

✔ main.py — FastAPI Router

Handles:

/start_interview

/answer

/summary/{session_id}

Stores everything in memory (SESSIONS dict).

🧩 Frontend Architecture
✔ InterviewVoiceChat.jsx

Handles:

Voice recording

TTS playback

UI animations

Chat message list

Input box

Feedback cards

Score badges

Summary report

✔ App.jsx

Simply loads the InterviewVoiceChat component.

🧠 Design Decisions
1️⃣ Local-only evaluation — no OpenAI API required

All scoring is deterministic

Pure Python evaluation

Works offline

2️⃣ Voice-first UI

Encourages natural interview flow

Smooth question/answer loop

Clean, animated chat interface

3️⃣ Dataset-driven questions

User can replace CSVs to create custom interview topics

Allows unlimited domain customization

4️⃣ Balanced scoring

Coverage (keywords) = 70%

Clarity (length & flow) = 30%

5️⃣ Role-based difficulty

Senior → harder questions

Junior → easy + medium

Fresher → only easy

🔌 API Documentation
▶ POST /start_interview
Request
{
  "role": "software engineer",
  "level": "junior",
  "num_questions": 15
}

Response

Returns:

session_id

first_question

total_questions

▶ POST /answer
Request
{
  "session_id": "uuid",
  "question_id": 12,
  "user_answer": "your text"
}

Response

Returns:

score breakdown

feedback points

follow_up_question

next_question

▶ GET /summary/{session_id}

Returns:

average score

strengths

improvement list

🧪 How to Test the System
✔ Start backend

✔ Start frontend
✔ Click “Launch Interview”
✔ Speak your answer
✔ Bot evaluates
✔ Continue until 15 questions
✔ Click “View Summary”

Works 100% end-to-end.

📦 Final Notes

Replace CSV files anytime to change interview domain

Works offline

Very easy to deploy

Best suited for coding, reasoning, and general interview prep
