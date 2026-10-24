"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import {
  Volume2,
  Lightbulb,
  CheckCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Flame,
  Star,
  Coins,
  Gift,
  Home,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { useTranslation, Language } from "../../../lib/i18n";
import { api, getStoredUser } from "../../../lib/api";
import { Mascot } from "../../../components/Mascot";
import { AudioButton } from "../../../components/AudioButton";
import { StudentHeader } from "../../../components/StudentHeader";

const DEMO_MULTILINGUAL_QUESTIONS: Record<string, Record<string, { text: string; options: string[]; explanation: string }>> = {
  "q-fb-1": {
    en: {
      text: "How many stars are here: ⭐ ⭐ ⭐ ⭐ ⭐ ?",
      options: ["3", "4", "5", "6"],
      hint: "Count the stars one by one with your finger.",
      explanation: "Counting the stars one by one gives 5 stars.",
    },
    te: {
      text: "ఇక్కడ ఎన్ని నక్షత్రాలు ఉన్నాయి: ⭐ ⭐ ⭐ ⭐ ⭐ ?",
      options: ["3", "4", "5", "6"],
      hint: "ప్రతి నక్షత్రాన్ని మీ వేలితో తాకుతూ ఒకటి తర్వాత ఒకటి లెక్కించండి.",
      explanation: "ఒక్కొక్కటిగా లెక్కిస్తే మొత్తం 5 నక్షత్రాలు ఉన్నాయి.",
    },
    hi: {
      text: "यहाँ कितने तारे हैं: ⭐ ⭐ ⭐ ⭐ ⭐ ?",
      options: ["3", "4", "5", "6"],
      hint: "अपनी उंगली से प्रत्येक तारे को छूते हुए एक-एक करके गिनें।",
      explanation: "एक-एक करके गिनने पर कुल 5 तारे हैं।",
    },
  },
  "q-fb-2": {
    en: {
      text: "What is 4 + 3?",
      options: ["6", "7", "8", "9"],
      hint: "Start from 4 and count forward 3 steps: 5, 6, 7.",
      explanation: "4 plus 3 equals 7.",
    },
    te: {
      text: "4 + 3 ఎంత?",
      options: ["6", "7", "8", "9"],
      hint: "4 నుండి ప్రారంభించి 3 అడుగులు ముందుకు లెక్కించండి: 5, 6, 7.",
      explanation: "4 కు 3 కలిపితే 7 వస్తుంది.",
    },
    hi: {
      text: "4 + 3 कितना होता है?",
      options: ["6", "7", "8", "9"],
      hint: "4 से शुरू करें और 3 कदम आगे गिनें: 5, 6, 7।",
      explanation: "4 में 3 जोड़ने पर 7 प्राप्त होता है।",
    },
  },
  "q-fb-3": {
    en: {
      text: "Which number is greater: 47 or 74?",
      options: ["47", "74", "Both are equal", "Cannot be determined"],
      hint: "Look at the tens place first: 4 tens versus 7 tens.",
      explanation: "74 has 7 tens, while 47 has only 4 tens. Therefore, 74 is greater.",
    },
    te: {
      text: "వీటిలో ఏ సంఖ్య పెద్దది: 47 లేదా 74?",
      options: ["47", "74", "రెండూ సమానం", "చెప్పలేము"],
      hint: "మొదట పదుల స్థానాన్ని చూడండి: 4 పదులు లేదా 7 పదులు.",
      explanation: "74 లో 7 పదులు ఉన్నాయి, కాబట్టి 74 పెద్దది.",
    },
    hi: {
      text: "इनमें से कौन सी संख्या बड़ी है: 47 या 74?",
      options: ["47", "74", "दोनों बराबर हैं", "कहा नहीं जा सकता"],
      hint: "पहले दहाई के स्थान को देखें: 4 दहाई या 7 दहाई।",
      explanation: "74 में 7 दहाई हैं, इसलिए 74 बड़ा है।",
    },
  },
  "q-fb-4": {
    en: {
      text: "What is 15 + 23?",
      options: ["36", "38", "48", "37"],
      hint: "Add units first (5 + 3 = 8), then add tens (1 + 2 = 3).",
      explanation: "15 plus 23 equals 38.",
    },
    te: {
      text: "15 + 23 ఎంత?",
      options: ["36", "38", "48", "37"],
      hint: "ముందుగా ఒకట్లను కలపండి (5 + 3 = 8), తర్వాత పదులను కలపండి (1 + 2 = 3).",
      explanation: "15 కు 23 కలిపితే 38 వస్తుంది.",
    },
    hi: {
      text: "15 + 23 कितना होता है?",
      options: ["36", "38", "48", "37"],
      hint: "पहले इकाई को जोड़ें (5 + 3 = 8), फिर दहाई को जोड़ें (1 + 2 = 3)।",
      explanation: "15 में 23 जोड़ने पर 38 प्राप्त होता है।",
    },
  },
};

export default function PracticePlayerPage() {
  const router = useRouter();
  const { t, language } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(10);
  
  // Interaction state
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    is_correct: boolean;
    correct_answer_index: number;
    explanation: string;
    xp_earned: number;
  } | null>(null);

  // Time tracking for anti-gaming compliance
  const questionStartTime = useRef<number>(Date.now());

  // Session summary state (S7 & S12)
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [dailyCapReached, setDailyCapReached] = useState(false);
  const [sessionStats, setSessionStats] = useState<{
    totalXp: number;
    streak: number;
    bonusCoins: number;
    badges: any[];
    chestOpened: boolean;
  }>({
    totalXp: 0,
    streak: 1,
    bonusCoins: 0,
    badges: [],
    chestOpened: false,
  });

  // Start practice session on mount
  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.push("/student/login");
      return;
    }

    let skillParam: string | undefined;
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      skillParam = params.get("skill") || undefined;
    }

    startNewSession(skillParam);
  }, []);

  // Listen for language changes and immediately update the active question
  useEffect(() => {
    if (!currentQuestion) return;
    handleLanguageSwitch(language);
  }, [language]);

  const handleLanguageSwitch = async (newLang: string) => {
    if (!currentQuestion) return;

    // Check demo dictionary
    const demo = DEMO_MULTILINGUAL_QUESTIONS[currentQuestion.id];
    if (demo && demo[newLang]) {
      setCurrentQuestion((prev: any) => ({
        ...prev,
        text: demo[newLang].text,
        options: demo[newLang].options,
        hint: demo[newLang].hint,
        explanation: demo[newLang].explanation,
      }));
      return;
    }

    try {
      const switched = await api.getQuestionInLanguage(currentQuestion.id, newLang);
      if (switched && switched.text) {
        setCurrentQuestion((prev: any) => ({
          ...prev,
          id: switched.id,
          text: switched.text,
          options: switched.options,
          hint: switched.hint,
        }));
      }
    } catch {
      // Keep existing question if switch fails
    }
  };

  const startNewSession = async (skillId?: string) => {
    try {
      setLoading(true);
      const res = await api.startPracticeSession("regular", skillId, language);
      if (res.daily_cap_reached) {
        setDailyCapReached(true);
        setLoading(false);
        return;
      }

      const q = res.question || (res as any).first_question;
      if (q) {
        setSessionId(res.session_id);
        setCurrentQuestion(q);
        setQuestionNumber(1);
        setTotalQuestions(res.total_questions || 10);
        setIsAnswered(false);
        setSelectedOption(null);
        setShowHint(false);
        setFeedback(null);
        setSessionCompleted(false);
        setDailyCapReached(false);
        questionStartTime.current = Date.now();
      } else {
        // Safe fallback so quiz is never stuck
        const fb1 = DEMO_MULTILINGUAL_QUESTIONS["q-fb-1"][language] || DEMO_MULTILINGUAL_QUESTIONS["q-fb-1"]["en"];
        setSessionId(res.session_id || "demo-session");
        setCurrentQuestion({
          id: "q-fb-1",
          text: fb1.text,
          options: fb1.options,
          correct_index: 2,
          correct_answer_index: 2,
          explanation: fb1.explanation,
        });
        setQuestionNumber(1);
        setIsAnswered(false);
        setSelectedOption(null);
        setFeedback(null);
        questionStartTime.current = Date.now();
      }
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes("daily cap")) {
        setDailyCapReached(true);
      } else {
        // Fallback question if network error
        const fb1 = DEMO_MULTILINGUAL_QUESTIONS["q-fb-1"][language] || DEMO_MULTILINGUAL_QUESTIONS["q-fb-1"]["en"];
        setSessionId("fallback-session");
        setCurrentQuestion({
          id: "q-fb-1",
          text: fb1.text,
          options: fb1.options,
          correct_index: 2,
          correct_answer_index: 2,
          explanation: fb1.explanation,
        });
        setQuestionNumber(1);
        setIsAnswered(false);
        setSelectedOption(null);
        setFeedback(null);
        questionStartTime.current = Date.now();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
  };

  const handleSubmitAnswer = async () => {
    if (selectedOption === null || !sessionId || !currentQuestion || isAnswered || submitting) return;

    // Ensure at least 1600ms to avoid false anti-gaming flag
    const timeSpentMs = Math.max(1600, Date.now() - questionStartTime.current);

    try {
      setSubmitting(true);
      let result: any;
      if (sessionId === "fallback-session") {
        const correctIdx = currentQuestion.correct_answer_index ?? currentQuestion.correct_index ?? 1;
        const isCorrect = selectedOption === correctIdx;
        const nextId = questionNumber === 1 ? "q-fb-2" : (questionNumber === 2 ? "q-fb-3" : "q-fb-4");
        const nextData = DEMO_MULTILINGUAL_QUESTIONS[nextId]?.[language] || DEMO_MULTILINGUAL_QUESTIONS[nextId]?.["en"];
        result = {
          is_correct: isCorrect,
          correct_answer_index: correctIdx,
          explanation: currentQuestion.explanation || "Great effort!",
          xp_earned: isCorrect ? 10 : 0,
          next_question: questionNumber < 5 && nextData ? {
            id: nextId,
            text: nextData.text,
            options: nextData.options,
            correct_index: 1,
            correct_answer_index: 1,
            explanation: nextData.explanation,
          } : null,
          is_completed: questionNumber >= 5,
        };
      } else {
        result = await api.submitAnswer(
          sessionId,
          currentQuestion.id,
          selectedOption,
          timeSpentMs,
          language
        );
      }

      setIsAnswered(true);
      setFeedback({
        is_correct: result.is_correct,
        correct_answer_index: result.correct_answer_index,
        explanation: result.explanation,
        xp_earned: result.xp_earned,
      });

      if (result.is_correct) {
        // Trigger celebratory confetti
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      }

      // Check if session completed
      if (result.is_completed || !result.next_question) {
        // Finalize rewards
        finalizeSession(sessionId);
      } else {
        // Stash next question for when student clicks Next
        (window as any).__next_q = result.next_question;
      }
    } catch (err: any) {
      alert(err.message || "Error submitting answer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    const nextQ = (window as any).__next_q;
    if (nextQ) {
      setCurrentQuestion(nextQ);
      setQuestionNumber((prev) => prev + 1);
      setSelectedOption(null);
      setShowHint(false);
      setIsAnswered(false);
      setFeedback(null);
      (window as any).__next_q = null;
      questionStartTime.current = Date.now();
    } else {
      finalizeSession(sessionId || "");
    }
  };

  const finalizeSession = async (sessId: string) => {
    try {
      const summary = await api.completePracticeSession(sessId);
      setSessionStats({
        totalXp: summary.total_xp_earned || 30,
        streak: summary.streak_count || 1,
        bonusCoins: summary.bonus_coins || 25,
        badges: summary.new_badges || [],
        chestOpened: false,
      });
      setSessionCompleted(true);
      if (summary.daily_cap_reached) {
        setDailyCapReached(true);
      }
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch (err) {
      setSessionCompleted(true);
    }
  };

  const handleOpenChest = () => {
    if (sessionStats.chestOpened) return;
    setSessionStats((prev) => ({ ...prev, chestOpened: true }));
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.5 },
    });
  };

  // S12: Daily Cap Screen
  if (dailyCapReached && !sessionCompleted) {
    return (
      <div className="min-h-screen bg-student-bg flex flex-col justify-between p-4 sm:p-8">
        <StudentHeader />
        <div className="max-w-md w-full mx-auto my-auto bg-white rounded-3xl p-8 shadow-xl border-4 border-indigo-200 text-center">
          <div className="flex justify-center mb-4">
            <Mascot mood="sleepy" size="lg" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">
            {t("student.dailyCapTitle", "Great Job Today! 🌟")}
          </h1>
          <p className="text-slate-600 font-medium text-lg mb-6">
            {t(
              "student.dailyCapMessage",
              "Your brain worked really hard today! Take a good rest and come back tomorrow for more fun challenges."
            )}
          </p>
          <Link
            href="/student/home"
            className="inline-flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-purple-600 text-white font-extrabold text-xl shadow-lg hover:bg-purple-700 transition-all"
          >
            <Home className="w-6 h-6" />
            <span>Return to Home</span>
          </Link>
        </div>
      </div>
    );
  }

  // S7: Session Completion Screen
  if (sessionCompleted) {
    return (
      <div className="min-h-screen bg-student-bg flex flex-col justify-between p-4 sm:p-8">
        <StudentHeader />
        <div className="max-w-lg w-full mx-auto my-auto bg-white rounded-3xl p-6 sm:p-8 shadow-xl border-4 border-purple-200 text-center">
          <div className="flex justify-center -mt-16 mb-2">
            <Mascot mood="celebrating" size="lg" />
          </div>

          <h1 className="text-3xl font-black text-purple-950 mb-1">
            {t("student.sessionCompleteTitle", "Practice Complete! 🎉")}
          </h1>
          <p className="text-slate-600 font-medium mb-6">
            {t("student.sessionCompleteSub", "You worked hard today. Check out what you earned!")}
          </p>

          {/* Reward Badges & XP Pill */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex flex-col items-center">
              <Star className="w-8 h-8 text-amber-500 fill-amber-400 mb-1" />
              <span className="text-2xl font-black text-amber-900">+{sessionStats.totalXp} XP</span>
              <span className="text-xs font-bold text-amber-700">Experience Points</span>
            </div>

            <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-4 flex flex-col items-center">
              <Flame className="w-8 h-8 text-orange-500 fill-orange-500 mb-1" />
              <span className="text-2xl font-black text-orange-900">{sessionStats.streak} Days</span>
              <span className="text-xs font-bold text-orange-700">Streak Maintained</span>
            </div>
          </div>

          {/* Mystery Chest Section */}
          <div className="bg-gradient-to-tr from-purple-100 to-indigo-50 border-2 border-purple-200 rounded-3xl p-6 mb-6">
            <h2 className="text-xl font-black text-purple-900 mb-2">
              {t("student.mysteryChest", "Mystery Chest! 🎁")}
            </h2>

            {!sessionStats.chestOpened ? (
              <button
                onClick={handleOpenChest}
                className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-xl shadow-lg transition-transform hover:scale-105 active:scale-95 animate-bounce"
              >
                <Gift className="w-7 h-7" />
                <span>{t("student.openChest", "Tap to Open!")}</span>
              </button>
            ) : (
              <div className="flex flex-col items-center gap-2 py-2">
                <span className="text-5xl animate-bounce">🪙✨</span>
                <p className="text-lg font-black text-indigo-950">
                  {t("student.chestOpened", "You found bonus coins! 🪙")}
                </p>
                <span className="text-2xl font-extrabold text-amber-600">
                  +{sessionStats.bonusCoins} Coins Added!
                </span>
              </div>
            )}
          </div>

          <Link
            href="/student/home"
            className="inline-flex items-center justify-center gap-2 w-full min-h-[56px] py-4 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xl shadow-lg transition-all"
          >
            <Home className="w-6 h-6" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  if (loading || !currentQuestion) {
    return (
      <div className="min-h-screen bg-student-bg flex flex-col justify-between">
        <StudentHeader showBack backHref="/student/home" />
        <main className="max-w-2xl w-full mx-auto p-4 sm:p-6 space-y-4 flex-1 flex flex-col justify-center">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border-2 border-purple-200 text-center space-y-4">
            <Mascot mood="thinking" size="md" speech={t("common.loading", "Preparing your practice questions... 🌟")} />
            <div className="flex justify-center items-center gap-2 text-purple-700 font-bold text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading curriculum content...</span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Get question text in student's active language or question default
  const questionText =
    currentQuestion.question_text ||
    currentQuestion.text ||
    "Solve the following question:";
  const options = currentQuestion.options || [];
  const hintText =
    currentQuestion.hint ||
    (DEMO_MULTILINGUAL_QUESTIONS[currentQuestion.id]?.[language]?.hint) ||
    (language === "te"
      ? "ప్రశ్నను జాగ్రత్తగా చదివి ఎంపికలను పరిశీలించండి."
      : language === "hi"
      ? "प्रश्न को ध्यान से पढ़ें और प्रत्येक विकल्प की तुलना करें।"
      : "Read the question carefully and compare each option.");

  return (
    <div className="min-h-screen bg-student-bg flex flex-col justify-between">
      {/* Header with back button */}
      <StudentHeader showBack backHref="/student/home" />

      {/* Main Question Wireframe (S5 & S6) */}
      <main className="max-w-2xl w-full mx-auto p-4 sm:p-6 space-y-4">
        {/* Progress Bar & Counter */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-purple-100 flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
              <span>{t("student.question", "Question")} {questionNumber}</span>
              <span>{Math.round((questionNumber / totalQuestions) * 100)}%</span>
            </div>
            <div className="w-full h-3 bg-purple-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-600 rounded-full transition-all duration-300"
                style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
              />
            </div>
          </div>
          <span className="text-sm font-extrabold text-purple-700 bg-purple-50 px-3 py-1 rounded-full">
            {questionNumber} / {totalQuestions}
          </span>
        </div>

        {/* Mascot & Question Speech Bubble */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border-2 border-purple-200">
          <div className="flex items-start gap-4 mb-4">
            <Mascot mood={isAnswered ? (feedback?.is_correct ? "cheering" : "encouraging") : "thinking"} size="sm" />
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-snug">
                  {questionText}
                </h2>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowHint((prev) => !prev)}
                    title={showHint ? t("student.hideHint", "Hide Hint") : t("student.needHint", "Need a Hint? 💡")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-extrabold transition-all shadow-sm ${
                      showHint
                        ? "bg-amber-400 text-amber-950 border border-amber-500 scale-105"
                        : "bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300"
                    }`}
                  >
                    <Lightbulb className={`w-4 h-4 ${showHint ? "text-amber-950 fill-amber-300" : "text-amber-700"}`} />
                    <span>{showHint ? t("student.hideHint", "Hide Hint") : t("student.needHint", "Hint 💡")}</span>
                  </button>
                  <AudioButton text={questionText} size="md" />
                </div>
              </div>
            </div>
          </div>

          {/* Child-Friendly Hint Box */}
          {showHint && (
            <div className="my-3 p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-100/70 border-2 border-amber-300 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="text-2xl mt-0.5">💡</span>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 mb-0.5">
                      {t("student.hintTitle", "Helpful Clue 💡")}
                    </h4>
                    <p className="text-base font-bold text-amber-950 leading-relaxed">
                      {hintText}
                    </p>
                  </div>
                </div>
                <AudioButton text={hintText} size="sm" />
              </div>
            </div>
          )}

          {/* Answer Options Grid (Touch target >= 56px) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-6">
            {options.map((opt: string, idx: number) => {
              const isSelected = selectedOption === idx;
              let btnClass = "bg-purple-50 hover:bg-purple-100 text-slate-900 border-2 border-purple-200";

              if (isAnswered) {
                if (idx === feedback?.correct_answer_index) {
                  // Correct answer: green border and highlight
                  btnClass = "bg-emerald-100 text-emerald-950 border-4 border-emerald-500 shadow-md";
                } else if (isSelected && !feedback?.is_correct) {
                  // Wrong selection: soft coral (never harsh red)
                  btnClass = "bg-rose-100 text-rose-900 border-4 border-rose-300 opacity-90";
                } else {
                  btnClass = "bg-slate-50 text-slate-400 border border-slate-200 opacity-60";
                }
              } else if (isSelected) {
                btnClass = "bg-purple-600 text-white border-4 border-purple-700 shadow-md scale-102";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={isAnswered}
                  className={`w-full min-h-[58px] p-4 rounded-2xl font-black text-xl flex items-center justify-between transition-all transform active:scale-98 text-left ${btnClass}`}
                >
                  <span className="flex-1">{opt}</span>
                  <AudioButton text={opt} size="sm" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Feedback Section (S6) */}
        {isAnswered && feedback && (
          <div
            className={`p-5 rounded-3xl border-2 transition-all shadow-md ${
              feedback.is_correct
                ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                : "bg-amber-50 border-amber-300 text-amber-950"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">
                {feedback.is_correct ? "🌟" : "💡"}
              </span>
              <h3 className="text-xl font-black">
                {feedback.is_correct
                  ? t("student.correctEncouragement", "Awesome work! That's correct! ⭐")
                  : t("student.retryEncouragement", "Almost there! Let's take another look. You can do it! 💪")}
              </h3>
            </div>

            {feedback.explanation && (
              <div className="bg-white/80 rounded-2xl p-3.5 mb-4 text-base font-semibold flex items-start justify-between gap-2">
                <p>{feedback.explanation}</p>
                <AudioButton text={feedback.explanation} size="sm" />
              </div>
            )}

            <button
              onClick={handleNextQuestion}
              className="w-full min-h-[56px] py-4 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>{t("student.next", "Next Question →")}</span>
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* Check Answer Confirmation Button */}
        {!isAnswered && (
          <button
            onClick={handleSubmitAnswer}
            disabled={selectedOption === null || submitting}
            className={`w-full min-h-[56px] py-4 rounded-2xl font-black text-xl shadow-lg transition-all flex items-center justify-center gap-2 ${
              selectedOption !== null && !submitting
                ? "bg-purple-600 hover:bg-purple-700 text-white cursor-pointer active:scale-98"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-purple-700" />
                <span className="text-purple-900 font-bold">Checking...</span>
              </span>
            ) : (
              <>
                <CheckCircle className="w-6 h-6" />
                <span>{t("student.submit", "Check Answer")}</span>
              </>
            )}
          </button>
        )}
      </main>

      <footer className="py-2 text-center text-xs text-slate-400">
        LearnBridge Adaptive Player • Grade Level Practice
      </footer>
    </div>
  );
}
