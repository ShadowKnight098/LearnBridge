"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Globe, GraduationCap, ShieldCheck, Sparkles, BookOpen } from "lucide-react";
import { useTranslation, Language } from "../lib/i18n";
import { Mascot } from "../components/Mascot";

export default function SplashPage() {
  const router = useRouter();
  const { setLanguage, t } = useTranslation();

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang);
    router.push("/student/login");
  };

  const languages: {
    code: Language;
    title: string;
    sub: string;
    greeting: string;
    bg: string;
    border: string;
    hover: string;
  }[] = [
    {
      code: "te",
      title: "తెలుగు",
      sub: "తెలుగులో నేర్చుకోండి",
      greeting: "నమస్కారం! బాగున్నారా?",
      bg: "from-amber-50 to-orange-100",
      border: "border-amber-300",
      hover: "hover:border-amber-500 hover:shadow-orange-200",
    },
    {
      code: "hi",
      title: "हिन्दी",
      sub: "हिन्दी में सीखें",
      greeting: "नमस्ते! सीखने के लिए तैयार?",
      bg: "from-emerald-50 to-teal-100",
      border: "border-emerald-300",
      hover: "hover:border-emerald-500 hover:shadow-teal-200",
    },
    {
      code: "en",
      title: "English",
      sub: "Learn in English",
      greeting: "Hello! Ready for today?",
      bg: "from-purple-50 to-indigo-100",
      border: "border-purple-300",
      hover: "hover:border-purple-500 hover:shadow-indigo-200",
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-100 via-indigo-50 to-white flex flex-col justify-between p-4 sm:p-8">
      {/* Top Bar with Teacher/Admin direct access */}
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🦉</span>
          <span className="text-2xl font-black text-purple-900 tracking-tight">
            LearnBridge
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-white text-slate-700 hover:text-indigo-600 hover:bg-slate-50 border border-slate-200 shadow-sm transition-all"
          >
            <GraduationCap className="w-4 h-4 text-indigo-600" />
            <span>Teacher & Admin Login</span>
          </Link>
        </div>
      </div>

      {/* Main Hero & Mascot Greeting */}
      <div className="max-w-4xl w-full mx-auto text-center py-6">
        <div className="flex justify-center mb-4">
          <Mascot mood="greeting" speech="Welcome! Choose your language to start learning." size="lg" />
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-purple-950 mb-3 tracking-tight">
          Learn Math, Reading & Words Every Day!
        </h1>
        <p className="text-lg sm:text-xl text-purple-800 font-medium max-w-xl mx-auto">
          Interactive adaptive learning made fun and easy with Mitra the Owl.
        </p>

        {/* Big Language Pick Cards (S1) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 max-w-3xl mx-auto">
          {languages.map((item) => (
            <button
              key={item.code}
              onClick={() => handleLanguageSelect(item.code)}
              className={`flex flex-col items-center justify-between p-6 sm:p-8 rounded-3xl bg-gradient-to-br ${item.bg} border-4 ${item.border} ${item.hover} shadow-lg transition-all transform hover:-translate-y-2 active:scale-95 group text-center min-h-[220px]`}
            >
              <div className="w-14 h-14 rounded-2xl bg-white/80 backdrop-blur shadow-sm flex items-center justify-center text-purple-700 font-extrabold text-xl group-hover:scale-110 transition-transform">
                <Globe className="w-7 h-7 text-purple-600" />
              </div>
              <div>
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-1">
                  {item.title}
                </h2>
                <p className="text-base font-bold text-slate-700">{item.sub}</p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/90 text-purple-900 shadow-sm">
                {item.greeting}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Footer */}
      <footer className="max-w-5xl w-full mx-auto text-center py-4 border-t border-purple-100 text-sm text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>© 2026 LearnBridge — Zero-cost, privacy-first foundational learning</p>
        <div className="flex items-center gap-4 font-semibold text-purple-700">
          <span>Accessible WCAG AA</span>
          <span>•</span>
          <span>Offline & Low-Bandwidth Ready</span>
        </div>
      </footer>
    </main>
  );
}
