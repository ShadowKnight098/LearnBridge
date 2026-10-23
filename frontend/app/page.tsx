"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Globe, GraduationCap, ShieldCheck, Sparkles, BookOpen, ArrowRight } from "lucide-react";
import { useTranslation, Language } from "../lib/i18n";
import { Mascot } from "../components/Mascot";
import { LanguageToggle } from "../components/LanguageToggle";

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
    <main className="min-h-screen bg-gradient-to-b from-purple-100 via-indigo-50/60 to-white flex flex-col justify-between p-4 sm:p-8">
      {/* Sticky Floating Modern Navbar */}
      <header className="sticky top-3 sm:top-4 z-50 max-w-5xl w-full mx-auto bg-white/85 backdrop-blur-xl border border-purple-200/90 rounded-2xl sm:rounded-3xl px-3.5 py-2 sm:px-6 sm:py-3 shadow-md shadow-purple-950/5 flex items-center justify-between gap-3 transition-all">
        {/* Brand */}
        <Link href="/" className="group flex items-center gap-2.5 focus:outline-none">
          <span className="text-2xl sm:text-3xl group-hover:rotate-6 group-hover:scale-105 active:scale-95 transition-transform select-none filter drop-shadow">
            🦉
          </span>
          <div className="flex flex-col">
            <span className="text-xl sm:text-2xl font-black text-purple-950 tracking-tight leading-none">
              LearnBridge
            </span>
            <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-purple-700/80 mt-0.5">
              NEP 2020 • NIPUN Bharat
            </span>
          </div>
        </Link>

        {/* Center / Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageToggle minimal />

          <Link
            href="/student/login"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold text-purple-800 hover:text-purple-950 hover:bg-purple-100/60 active:scale-95 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Student PIN Login</span>
          </Link>

          <Link
            href="/login"
            className="group inline-flex items-center gap-2 px-3.5 py-2 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold bg-gradient-to-r from-purple-700 to-indigo-600 text-white shadow-sm hover:shadow-md hover:from-purple-800 hover:to-indigo-700 active:scale-95 transition-all whitespace-nowrap"
          >
            <GraduationCap className="w-4 h-4" />
            <span>Staff Login</span>
            <ArrowRight className="w-3.5 h-3.5 text-purple-200 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </header>

      {/* Main Hero & Mascot Greeting */}
      <div className="max-w-4xl w-full mx-auto text-center py-6 sm:py-8">
        <div className="flex justify-center mb-4">
          <Mascot mood="greeting" speech="Welcome! Choose your language to start learning." size="lg" />
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-purple-950 mb-3 tracking-tight">
          Learn Math, Reading & Words Every Day!
        </h1>
        <p className="text-base sm:text-xl text-purple-800/90 font-medium max-w-xl mx-auto">
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

        {/* Dedicated Educator & Admin Portal Banner */}
        <div className="mt-10 sm:mt-12 max-w-3xl w-full mx-auto">
          <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-5 border border-purple-800/40 text-left">
            <div className="flex items-center gap-4">
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center flex-shrink-0 text-amber-300">
                <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Educator & Admin Portal</span>
                </div>
                <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                  Classroom Heatmaps, AI Question Generation & School Analytics
                </h3>
                <p className="text-xs sm:text-sm text-purple-200/80 mt-0.5">
                  Designed for primary school teachers, headmasters, and coordinators.
                </p>
              </div>
            </div>

            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white hover:bg-purple-50 text-purple-950 font-black text-sm shadow-lg hover:shadow-xl transition-all whitespace-nowrap flex-shrink-0 group"
            >
              <span>Teacher / Admin Sign In</span>
              <ArrowRight className="w-4 h-4 text-purple-700 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <footer className="max-w-5xl w-full mx-auto text-center py-4 border-t border-purple-200/60 text-xs sm:text-sm text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
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
