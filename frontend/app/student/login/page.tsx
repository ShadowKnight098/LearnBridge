"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, School, ArrowRight, ArrowLeft, AlertCircle, Sparkles } from "lucide-react";
import { useTranslation } from "../../../lib/i18n";
import { api } from "../../../lib/api";
import { Mascot } from "../../../components/Mascot";
import { LanguageToggle } from "../../../components/LanguageToggle";

export default function StudentLoginPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [classCode, setClassCode] = useState("CLS-001");
  const [pin, setPin] = useState("1234");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Avatar choices for young learners to pick their persona
  const avatarChoices = ["🐯", "🐼", "🦊", "🦁", "🐰", "🐘"];
  const [selectedAvatar, setSelectedAvatar] = useState("🐯");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classCode.trim() || !pin.trim()) {
      setError("Please enter your Class Code and 4-digit PIN");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await api.loginStudent(classCode.trim(), pin.trim());
      router.push("/student/home");
    } catch (err: any) {
      setError(err.message || "Could not find your student record. Please check with your teacher!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-100 via-indigo-50 to-white flex flex-col justify-between p-4 sm:p-8">
      {/* Header */}
      <div className="max-w-xl w-full mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white border border-purple-200 text-purple-700 font-bold hover:bg-purple-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{t("common.back", "Back")}</span>
        </Link>
        <LanguageToggle minimal />
      </div>

      {/* Login Card */}
      <div className="max-w-md w-full mx-auto my-6 bg-white rounded-3xl p-6 sm:p-8 shadow-xl border-4 border-purple-200">
        <div className="flex justify-center -mt-16 mb-4">
          <Mascot mood="greeting" speech={t("student.loginSubtitle", "Enter your Class Code and 4-digit PIN")} size="md" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-center text-purple-950 mb-2">
          {t("student.loginTitle", "Welcome back, Learner!")}
        </h1>

        {error && (
          <div className="mb-4 p-4 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-800 text-sm font-bold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Fun Avatar Selector */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-slate-700 mb-2 text-center">
            Pick your character for today:
          </label>
          <div className="flex items-center justify-center gap-2 overflow-x-auto py-1">
            {avatarChoices.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setSelectedAvatar(emoji)}
                className={`w-12 h-12 rounded-2xl text-2xl flex items-center justify-center transition-all ${
                  selectedAvatar === emoji
                    ? "bg-purple-600 shadow-md scale-110 ring-4 ring-purple-200"
                    : "bg-purple-50 hover:bg-purple-100"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              {t("student.classCode", "Class Code")}
            </label>
            <div className="relative">
              <School className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                placeholder={t("student.classCodePlaceholder", "e.g. CLS-001")}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-slate-200 font-bold text-slate-800 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all uppercase text-lg"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              {t("student.pin", "Your 4-Digit PIN")}
            </label>
            <div className="relative">
              <KeyRound className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-slate-200 font-black tracking-widest text-slate-800 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all text-xl"
                required
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">Default demo student PIN: 1234</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[56px] py-4 rounded-2xl bg-purple-600 hover:bg-purple-700 active:scale-98 text-white font-black text-xl shadow-lg hover:shadow-purple-300 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>{t("common.loading", "Loading...")}</span>
            ) : (
              <>
                <span>{t("student.signIn", "Let's Go! 🚀")}</span>
                <ArrowRight className="w-6 h-6" />
              </>
            )}
          </button>
        </form>
      </div>

      <div className="text-center text-xs text-slate-500">
        Demo Tip: Use Class <span className="font-bold">CLS-001</span> and PIN <span className="font-bold">1234</span>
      </div>
    </main>
  );
}
