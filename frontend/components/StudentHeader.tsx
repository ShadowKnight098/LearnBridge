"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flame, Star, Coins, LogOut, ArrowLeft } from "lucide-react";
import { LanguageToggle } from "./LanguageToggle";
import { clearStoredAuth } from "../lib/api";

interface StudentHeaderProps {
  level?: number;
  xp?: number;
  streak?: number;
  coins?: number;
  showBack?: boolean;
  backHref?: string;
}

export const StudentHeader: React.FC<StudentHeaderProps> = ({
  level = 1,
  xp = 0,
  streak = 1,
  coins = 0,
  showBack = false,
  backHref = "/student/home",
}) => {
  const router = useRouter();

  const handleLogout = () => {
    clearStoredAuth();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-xl border-b border-purple-100/90 shadow-[0_2px_8px_-2px_rgba(108,77,246,0.06)] transition-all">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Back button or Brand logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {showBack ? (
            <Link
              href={backHref}
              className="group inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 border border-purple-200/80 hover:bg-purple-100 hover:border-purple-300 active:scale-90 shadow-xs transition-all duration-150"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform duration-150" />
            </Link>
          ) : (
            <Link
              href="/student/home"
              className="group flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-xl px-1 py-0.5"
            >
              <span className="text-2xl sm:text-3xl group-hover:rotate-6 group-hover:scale-105 active:scale-95 transition-transform duration-150 select-none">
                🦉
              </span>
              <span className="font-black text-lg sm:text-2xl tracking-tight bg-gradient-to-r from-purple-700 to-indigo-600 bg-clip-text text-transparent">
                LearnBridge
              </span>
            </Link>
          )}
        </div>

        {/* Center: Gamified Stats (Level, XP, Streak, Coins) */}
        <div className="flex items-center gap-1.5 sm:gap-3 select-none">
          {/* Level Pill */}
          <Link
            href="/student/badges"
            className="flex items-center gap-1.5 bg-gradient-to-b from-purple-50 to-indigo-50/80 border border-purple-200/90 px-2 sm:px-3 py-1 rounded-2xl shadow-xs hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-150"
            title={`Level ${level} — Click to view badges`}
          >
            <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center text-[10px] sm:text-xs font-black shadow-xs">
              {level}
            </span>
            <span className="font-extrabold text-purple-900 text-xs sm:text-sm">
              <span className="hidden sm:inline">Lvl </span>
              {level}
            </span>
          </Link>

          {/* XP Pill */}
          <Link
            href="/student/badges"
            className="flex items-center gap-1.5 bg-gradient-to-b from-amber-50 to-yellow-50/80 border border-amber-200/90 px-2 sm:px-3 py-1 rounded-2xl shadow-xs hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-150"
            title={`${xp} Total XP — Click to view badges`}
          >
            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 fill-amber-400 drop-shadow-xs" />
            <span className="font-extrabold text-amber-950 text-xs sm:text-sm">{xp}</span>
            <span className="hidden sm:inline text-[10px] font-bold text-amber-700">XP</span>
          </Link>

          {/* Streak Pill */}
          <Link
            href="/student/badges"
            className="flex items-center gap-1 sm:gap-1.5 bg-gradient-to-b from-orange-50 to-amber-50/80 border border-orange-200/90 px-2 sm:px-3 py-1 rounded-2xl shadow-xs hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-150"
            title={`${streak} Day Streak — Keep practising daily!`}
          >
            <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500 fill-orange-500 animate-pulse" />
            <span className="font-extrabold text-orange-950 text-xs sm:text-sm">{streak}</span>
            <span className="text-[10px] font-bold text-orange-700">d</span>
          </Link>

          {/* Coins Pill */}
          <Link
            href="/student/shop"
            className="flex items-center gap-1 sm:gap-1.5 bg-gradient-to-b from-yellow-50 to-amber-50/80 border border-yellow-300/90 px-2 sm:px-3 py-1 rounded-2xl shadow-xs hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-150"
            title={`${coins} Coins — Visit the Avatar Shop`}
          >
            <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-600 fill-yellow-400" />
            <span className="font-extrabold text-yellow-950 text-xs sm:text-sm">{coins}</span>
          </Link>
        </div>

        {/* Right: Language Switcher & Logout */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <LanguageToggle minimal />
          <button
            onClick={handleLogout}
            className="inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-2xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 active:scale-90 transition-all duration-150"
            title="Log out"
            aria-label="Log out"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
