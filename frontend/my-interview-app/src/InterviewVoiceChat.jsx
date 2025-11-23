import React, { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Send, BarChart3, PlayCircle, User, Bot, Sparkles, Volume2, Briefcase, MessageSquare, Radio, Award, Target, Zap, Clock, ChevronRight, Star, TrendingUp, CheckCircle2, AlertCircle, Headphones, Settings, Crown, Rocket, Brain, Shield } from "lucide-react";

const API_BASE = "http://127.0.0.1:8000";

function speak(text) {
  if (!window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

const InterviewVoiceChat = () => {
  const [sessionId, setSessionId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isInterviewOver, setIsInterviewOver] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setUserAnswer((prev) => (prev ? prev + " " + transcript : transcript));
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;
  }, []);

  const startInterview = async () => {
    try {
      setMessages([]);
      setIsInterviewOver(false);
      setUserAnswer("");
      setQuestionCount(1);
      const res = await fetch(`${API_BASE}/start_interview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "software engineer", level: "junior", num_questions: 15 }),
      });
      const data = await res.json();
      setSessionId(data.session_id);
      setCurrentQuestion(data.first_question);
      const questionText = `Question 1: ${data.first_question.text}`;
      setMessages([{ from: "bot", text: questionText, type: "question" }]);
      speak(questionText);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleListening = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      setUserAnswer("");
      recognition.start();
      setIsListening(true);
    }
  };

  const sendAnswer = async () => {
    if (!sessionId || !currentQuestion || !userAnswer.trim()) return;
    try {
      setMessages((prev) => [...prev, { from: "user", text: userAnswer.trim() }]);
      const res = await fetch(`${API_BASE}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, question_id: currentQuestion.id, user_answer: userAnswer.trim() }),
      });
      setUserAnswer("");
      const data = await res.json();
      const feedbackText = [
        `Score: ${data.overall_score.toFixed(1)} (Clarity: ${data.clarity_score.toFixed(1)}, Coverage: ${data.coverage_score.toFixed(2)})`,
        ...data.feedback_points,
        data.follow_up_question ? `Follow-up: ${data.follow_up_question}` : "",
      ].filter(Boolean).join("\n");
      setMessages((prev) => [...prev, { from: "bot", text: feedbackText, type: "feedback", score: data.overall_score }]);
      speak(feedbackText);
      if (data.is_last_question) {
        setIsInterviewOver(true);
        setCurrentQuestion(null);
      } else if (data.next_question) {
        setQuestionCount(prev => prev + 1);
        setCurrentQuestion(data.next_question);
        const qText = `Question ${questionCount + 1}: ${data.next_question.text}`;
        setMessages((prev) => [...prev, { from: "bot", text: qText, type: "question" }]);
        speak(qText);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSummary = async () => {
    if (!sessionId) return;
    try {
      const res = await fetch(`${API_BASE}/summary/${sessionId}`);
      const data = await res.json();
      const summaryText = [
        `Interview Summary (Role: ${data.role})`,
        `Average Score: ${data.avg_score}`,
        `Strengths: ${data.strengths.join("; ")}`,
        `Areas to improve: ${data.improvements.join("; ")}`
      ].join("\n");
      setMessages((prev) => [...prev, { from: "bot", text: summaryText, type: "summary" }]);
      speak(summaryText);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-3 md:p-6 font-sans overflow-hidden relative">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-r from-violet-600/30 to-fuchsia-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-r from-cyan-600/20 to-blue-600/30 rounded-full blur-3xl animate-pulse" style={{animationDelay:'1.5s'}} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-r from-pink-600/10 to-orange-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay:'3s'}} />
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      <div className="relative max-w-5xl mx-auto">
        {/* Premium Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-full border border-amber-500/30 mb-4">
            <Crown className="w-4 h-4 text-amber-400" />
            <span className="text-amber-300 text-xs font-semibold tracking-wide">PREMIUM AI INTERVIEW COACH</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          
          <div className="flex items-center justify-center gap-4 mb-3">
            <div className="p-4 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 rounded-3xl shadow-2xl shadow-violet-500/40 relative">
              <Brain className="w-10 h-10 text-white" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-slate-950 animate-pulse" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-white via-violet-200 to-fuchsia-200 bg-clip-text text-transparent tracking-tight">
                Interview AI
              </h1>
              <p className="text-slate-400 text-sm flex items-center gap-2 mt-1">
                <Headphones className="w-4 h-4 text-violet-400" />
                Voice-Powered • Real-Time Feedback • Smart Analysis
              </p>
            </div>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
            {[
              { icon: Mic, text: "Voice Input", color: "emerald" },
              { icon: Volume2, text: "Audio Output", color: "blue" },
              { icon: Brain, text: "AI Analysis", color: "violet" },
              { icon: TrendingUp, text: "Score Tracking", color: "amber" }
            ].map((item, i) => (
              <div key={i} className={`flex items-center gap-1.5 px-3 py-1.5 bg-${item.color}-500/10 border border-${item.color}-500/20 rounded-full`}>
                <item.icon className={`w-3.5 h-3.5 text-${item.color}-400`} />
                <span className={`text-${item.color}-300 text-xs font-medium`}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Interface */}
        <div className="bg-slate-900/80 backdrop-blur-2xl rounded-3xl border border-slate-700/50 shadow-2xl overflow-hidden">
          {/* Control Bar */}
          <div className="bg-gradient-to-r from-slate-800/80 via-slate-800/60 to-slate-800/80 px-6 py-4 border-b border-slate-700/50">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={startInterview}
                  className="group flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-white font-bold rounded-2xl shadow-xl shadow-emerald-500/30 transition-all duration-300 hover:scale-105 hover:shadow-emerald-500/50"
                >
                  <Rocket className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  Launch Interview
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                {sessionId && (
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-800/80 rounded-xl border border-slate-600/50">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
                        <div className="absolute inset-0 w-3 h-3 bg-emerald-400 rounded-full animate-ping opacity-50" />
                      </div>
                      <span className="text-emerald-400 text-sm font-semibold">LIVE</span>
                    </div>
                    <div className="w-px h-5 bg-slate-600" />
                    <span className="text-slate-400 text-xs font-mono">{sessionId.slice(0,12)}</span>
                  </div>
                )}
              </div>

              {/* Stats */}
              {sessionId && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-3 py-2 bg-violet-500/10 rounded-xl border border-violet-500/20">
                    <Target className="w-4 h-4 text-violet-400" />
                    <span className="text-violet-300 text-sm font-bold">{questionCount}/15</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span className="text-amber-300 text-sm font-bold">Scoring</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="h-[400px] md:h-[450px] overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-slate-900/50 to-slate-950/80">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <div className="relative mb-6">
                  <div className="p-8 bg-gradient-to-br from-violet-500/20 via-fuchsia-500/20 to-pink-500/20 rounded-[2rem] border border-violet-500/20">
                    <MessageSquare className="w-16 h-16 text-violet-400/60" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl shadow-lg">
                    <Mic className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Ready to Ace Your Interview?</h3>
                <p className="text-slate-400 max-w-md mb-6">Click "Launch Interview" to start your AI-powered mock interview with real-time voice feedback and intelligent scoring.</p>
                <div className="flex flex-wrap justify-center gap-3">
                  {["15 Questions", "Voice Enabled", "Instant Feedback", "Score Analysis"].map((t, i) => (
                    <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 rounded-full text-slate-300 text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />{t}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, idx) => (
                <div key={idx} className={`flex items-start gap-3 ${m.from === "user" ? "flex-row-reverse" : ""} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`flex-shrink-0 p-2.5 rounded-2xl shadow-lg ${
                    m.from === "user" 
                      ? "bg-gradient-to-br from-blue-500 to-cyan-400 shadow-blue-500/30" 
                      : m.type === "question" 
                        ? "bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-violet-500/30"
                        : m.type === "summary"
                          ? "bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/30"
                          : "bg-gradient-to-br from-emerald-500 to-teal-500 shadow-emerald-500/30"
                  }`}>
                    {m.from === "user" ? <User className="w-5 h-5 text-white" /> : 
                     m.type === "summary" ? <BarChart3 className="w-5 h-5 text-white" /> :
                     m.type === "question" ? <Bot className="w-5 h-5 text-white" /> :
                     <Star className="w-5 h-5 text-white" />}
                  </div>
                  <div className={`max-w-[75%] ${m.from === "user" ? "text-right" : ""}`}>
                    {m.type === "feedback" && m.score && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          m.score >= 8 ? "bg-emerald-500/20 text-emerald-400" :
                          m.score >= 6 ? "bg-amber-500/20 text-amber-400" :
                          "bg-red-500/20 text-red-400"
                        }`}>
                          {m.score >= 8 ? "Excellent" : m.score >= 6 ? "Good" : "Needs Work"}
                        </div>
                      </div>
                    )}
                    <div className={`inline-block px-5 py-4 rounded-3xl ${
                      m.from === "user"
                        ? "bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-tr-lg shadow-xl shadow-blue-500/20"
                        : "bg-slate-800/90 text-slate-100 rounded-tl-lg border border-slate-700/50 shadow-xl"
                    }`}>
                      <p className="whitespace-pre-line text-sm leading-relaxed">{m.text}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Section */}
          <div className="p-6 bg-slate-900/90 border-t border-slate-700/50">
            <div className="relative mb-5">
              <textarea
                rows={3}
                className="w-full px-5 py-4 pr-14 bg-slate-800/80 text-white placeholder-slate-500 rounded-2xl border-2 border-slate-700/50 focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/20 outline-none transition-all resize-none text-sm"
                placeholder="Type your answer or click the mic to speak..."
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
              />
              {userAnswer && (
                <div className="absolute bottom-3 right-3 text-xs text-slate-500">
                  {userAnswer.length} chars
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={toggleListening}
                className={`group flex items-center gap-2.5 px-6 py-3.5 font-bold rounded-2xl shadow-xl transition-all duration-300 hover:scale-105 ${
                  isListening 
                    ? "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-red-500/30 hover:shadow-red-500/50" 
                    : "bg-gradient-to-r from-emerald-500 to-green-400 text-white shadow-emerald-500/30 hover:shadow-emerald-500/50"
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-5 h-5" />
                    <span>Stop Recording</span>
                    <div className="flex gap-1">
                      {[0,1,2].map(i => (
                        <div key={i} className="w-1 h-4 bg-white/80 rounded-full animate-pulse" style={{animationDelay:`${i*0.15}s`}} />
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span>Start Speaking</span>
                  </>
                )}
              </button>

              <button
                onClick={sendAnswer}
                className="group flex items-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/30 transition-all duration-300 hover:scale-105 hover:shadow-blue-500/50"
              >
                <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                Submit Answer
              </button>

              <button
                onClick={fetchSummary}
                disabled={!isInterviewOver}
                className={`group flex items-center gap-2.5 px-6 py-3.5 font-bold rounded-2xl shadow-xl transition-all duration-300 ${
                  isInterviewOver 
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-500/30 hover:scale-105 hover:shadow-amber-500/50" 
                    : "bg-slate-800/80 text-slate-500 cursor-not-allowed border border-slate-700/50"
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                View Summary
                {isInterviewOver && <Sparkles className="w-4 h-4 text-amber-200" />}
              </button>
            </div>
          </div>

          {/* Browser Warning */}
          {!window.SpeechRecognition && !window.webkitSpeechRecognition && (
            <div className="px-6 py-4 bg-red-500/10 border-t border-red-500/20 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-300 text-sm">Speech recognition not supported. Please use Chrome or Edge for voice features.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-3 mt-6 text-slate-500 text-xs">
          <Shield className="w-4 h-4" />
          <span>Secure & Private</span>
          <span>•</span>
          <span>Powered by Advanced AI</span>
          <span>•</span>
          <span>Practice Makes Perfect</span>
        </div>
      </div>
    </div>
  );
};

export default InterviewVoiceChat;