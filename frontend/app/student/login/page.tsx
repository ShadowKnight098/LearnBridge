"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  KeyRound,
  School,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Sparkles,
  UserCheck,
  Check,
  Delete,
  RotateCcw,
} from "lucide-react";
import { useTranslation } from "../../../lib/i18n";
import { api } from "../../../lib/api";
import { Mascot } from "../../../components/Mascot";
import { LanguageToggle } from "../../../components/LanguageToggle";

interface RosterStudent {
  id: string;
  name: string;
  roll_number: string;
  username: string;
}

export default function StudentLoginPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [classCode, setClassCode] = useState("CLS3A");
  const [pin, setPin] = useState("1234");
  const [rollNumber, setRollNumber] = useState("222");
  const [manualMode, setManualMode] = useState(false);
  const [roster, setRoster] = useState<RosterStudent[]>([
    { id: "s1", name: "Ashraf", roll_number: "222", username: "222" },
    { id: "s2", name: "Karthik", roll_number: "6565", username: "6565" },
    { id: "s3", name: "Aarav Sharma", roll_number: "R-001", username: "R-001" },
    { id: "s4", name: "Ananya Verma", roll_number: "R-002", username: "R-002" },
  ]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Avatar choices for young learners to pick their persona
  const avatarChoices = ["🐯", "🐼", "🦊", "🦁", "🐰", "🐘"];
  const [selectedAvatar, setSelectedAvatar] = useState("🐯");

  // Load roster whenever classCode is entered
  useEffect(() => {
    if (!classCode || classCode.trim().length < 3) return;
    let isCancelled = false;

    const fetchRoster = async () => {
      try {
        setLoadingRoster(true);
        const data = await api.getClassRoster(classCode.trim());
        if (!isCancelled && data && data.length > 0) {
          // Deduplicate by roll_number or id
          const seen = new Set<string>();
          const unique: RosterStudent[] = [];
          for (const item of data) {
            const key = item.roll_number || item.username;
            if (!seen.has(key)) {
              seen.add(key);
              unique.push(item);
            }
          }
          setRoster(unique);
          if (unique.length > 0 && !rollNumber) {
            setRollNumber(unique[0].roll_number || unique[0].username);
          }
        }
      } catch {
        // Keep fallback mock roster
      } finally {
        if (!isCancelled) setLoadingRoster(false);
      }
    };

    fetchRoster();
    return () => {
      isCancelled = true;
    };
  }, [classCode]);

  const handleKeypadPress = (digit: string) => {
    if (pin.length < 4) {
      setPin((prev) => prev + digit);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClearPin = () => {
    setPin("");
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!classCode.trim() || !pin.trim()) {
      setError("Please enter your Class Code and 4-digit PIN");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await api.loginStudent(classCode.trim(), pin.trim(), rollNumber.trim() || undefined);
      router.push("/student/home");
    } catch (err: any) {
      setError(err.message || "Could not find your student record. Please verify your Roll Number and PIN!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-100 via-indigo-50 to-white flex flex-col justify-between p-3 sm:p-6 md:p-8">
      {/* Responsive Top Header */}
      <div className="max-w-xl w-full mx-auto flex items-center justify-between gap-2 mb-2 sm:mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl bg-white border border-purple-200 text-purple-700 font-bold hover:bg-purple-50 transition-colors shadow-xs text-xs sm:text-sm"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>{t("common.back", "Back")}</span>
        </Link>
        <LanguageToggle minimal />
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto my-3 sm:my-6 bg-white rounded-3xl p-5 sm:p-8 shadow-xl border-2 sm:border-4 border-purple-200">
        <div className="flex justify-center -mt-14 sm:-mt-16 mb-3 sm:mb-4">
          <Mascot mood="greeting" speech={t("student.loginSubtitle", "Choose your Roll Number & PIN to jump in!")} size="md" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-center text-purple-950 mb-1">
          {t("student.loginTitle", "Welcome, Learner!")}
        </h1>
        <p className="text-xs sm:text-sm text-center text-purple-700/80 font-semibold mb-4">
          Pick your roll number and enter your 4-digit PIN number
        </p>

        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-800 text-xs sm:text-sm font-bold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Fun Avatar Selector */}
        <div className="mb-5">
          <label className="block text-xs font-bold text-slate-600 mb-1.5 text-center">
            Pick your avatar:
          </label>
          <div className="flex items-center justify-center gap-2 overflow-x-auto py-1">
            {avatarChoices.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setSelectedAvatar(emoji)}
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl text-xl sm:text-2xl flex items-center justify-center transition-all ${
                  selectedAvatar === emoji
                    ? "bg-purple-600 shadow-md scale-110 ring-4 ring-purple-200"
                    : "bg-purple-50 hover:bg-purple-100 active:scale-95"
                }`}
                aria-label={`Select avatar ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Step 1: Class Code */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1">
              {t("student.classCode", "Class Code")}
            </label>
            <div className="relative">
              <School className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                placeholder="e.g. CLS3A"
                className="w-full pl-11 pr-4 py-2.5 sm:py-3 rounded-2xl border-2 border-slate-200 font-black text-slate-800 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all uppercase text-base sm:text-lg tracking-wider"
                required
              />
            </div>
          </div>

          {/* Step 2: Choose Your Roll Number */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs sm:text-sm font-bold text-slate-700">
                Choose Your Roll Number:
              </label>
              <button
                type="button"
                onClick={() => setManualMode(!manualMode)}
                className="text-[11px] font-bold text-purple-700 hover:text-purple-900 underline"
              >
                {manualMode ? "Pick from list" : "Type manually"}
              </button>
            </div>

            {manualMode ? (
              <div className="relative">
                <UserCheck className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="e.g. 222 or 6565"
                  className="w-full pl-11 pr-4 py-2.5 sm:py-3 rounded-2xl border-2 border-slate-200 font-bold text-slate-800 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all text-sm sm:text-base"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1 bg-slate-50/80 rounded-2xl border border-slate-200">
                {roster.map((student) => {
                  const studentRoll = student.roll_number || student.username;
                  const isSelected = rollNumber === studentRoll || rollNumber === student.username;
                  return (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => {
                        setRollNumber(studentRoll);
                        setError(null);
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? "bg-purple-600 border-purple-600 text-white shadow-sm scale-[1.02]"
                          : "bg-white border-slate-200 hover:border-purple-300 text-slate-800 hover:bg-purple-50/40"
                      }`}
                    >
                      <div className="min-w-0 pr-1">
                        <span className={`block font-black text-xs sm:text-sm truncate ${isSelected ? "text-white" : "text-purple-900"}`}>
                          Roll: {studentRoll}
                        </span>
                        <span className={`block text-[11px] truncate capitalize ${isSelected ? "text-purple-100" : "text-slate-500"}`}>
                          {student.name}
                        </span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-white flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Selected Roll: <strong className="text-purple-800">{rollNumber || "None selected"}</strong></span>
              {loadingRoster && <span className="text-purple-600 animate-pulse">Loading class roster...</span>}
            </div>
          </div>

          {/* Step 3: Choose 4-Digit Number (PIN) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs sm:text-sm font-bold text-slate-700">
                Enter 4-Digit PIN Number:
              </label>
              <button
                type="button"
                onClick={() => setPin("1234")}
                className="text-[11px] font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3 text-purple-600" />
                <span>Fill 1234</span>
              </button>
            </div>

            {/* Visual PIN Dots Display */}
            <div className="flex items-center justify-center gap-3 py-2 bg-purple-50/70 border-2 border-purple-200 rounded-2xl mb-2.5">
              {[0, 1, 2, 3].map((index) => {
                const isFilled = pin.length > index;
                return (
                  <div
                    key={index}
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-black text-xl transition-all ${
                      isFilled
                        ? "bg-purple-600 text-white shadow-sm scale-105"
                        : "bg-white border-2 border-purple-200 text-slate-300"
                    }`}
                  >
                    {isFilled ? "•" : ""}
                  </div>
                );
              })}
            </div>

            {/* Touch-Friendly Numeric Keypad */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 max-w-[260px] mx-auto">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleKeypadPress(digit)}
                  className="h-10 sm:h-11 rounded-xl bg-slate-100 hover:bg-purple-100 active:bg-purple-200 active:scale-95 text-slate-800 font-black text-base sm:text-lg border border-slate-200 shadow-2xs transition-all select-none"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClearPin}
                className="h-10 sm:h-11 rounded-xl bg-slate-100 hover:bg-rose-100 active:bg-rose-200 active:scale-95 text-slate-600 font-bold text-xs border border-slate-200 shadow-2xs transition-all flex items-center justify-center select-none"
                title="Clear PIN"
              >
                <RotateCcw className="w-4 h-4 text-slate-600" />
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress("0")}
                className="h-10 sm:h-11 rounded-xl bg-slate-100 hover:bg-purple-100 active:bg-purple-200 active:scale-95 text-slate-800 font-black text-base sm:text-lg border border-slate-200 shadow-2xs transition-all select-none"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="h-10 sm:h-11 rounded-xl bg-slate-100 hover:bg-amber-100 active:bg-amber-200 active:scale-95 text-slate-600 font-bold text-xs border border-slate-200 shadow-2xs transition-all flex items-center justify-center select-none"
                title="Backspace"
              >
                <Delete className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || pin.length < 4}
            className="w-full min-h-[52px] sm:min-h-[56px] py-3.5 sm:py-4 rounded-2xl bg-purple-600 hover:bg-purple-700 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-lg sm:text-xl shadow-lg hover:shadow-purple-300 transition-all flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <span>{t("common.loading", "Loading...")}</span>
            ) : (
              <>
                <span>{t("student.signIn", "Let's Go! 🚀")}</span>
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Footer Demo Helper */}
      <div className="text-center text-xs text-slate-500 flex flex-col items-center gap-2 mt-2">
        <div>
          Class: <span className="font-bold text-purple-700">CLS3A</span> • Active Rolls: <span className="font-bold text-purple-700">222</span> (Ashraf), <span className="font-bold text-purple-700">6565</span> (Karthik) • PIN: <span className="font-bold text-purple-700">1234</span>
        </div>
      </div>
    </main>
  );
}
