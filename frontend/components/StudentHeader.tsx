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
    <header className="w-full bg-white/90 backdrop-blur-md border-b-2 border-purple-100 px-4 py-3 sticky top-0 z-50 shadow-sm">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
        {/* Left: Back or Brand */}
        <div className="flex items-center gap-2">
          {showBack ? (
            <Link
              href={backHref}
              className="inline-flex items-center justify-center min-w-[48px] min-h-[48px] rounded-full bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors shadow-sm"
              aria-label="Go back"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
          ) : (
            <Link href="/student/home" className="flex items-center gap-2">
              <span className="text-3xl">🦉</span>
              <span className="font-extrabold text-xl sm:text-2xl tracking-tight bg-gradient-to-r from-purple-700 to-indigo-600 bg-clip-text text-transparent">
                LearnBridge
              </span>
            </Link>
          )}
        </div>

        {/* Center: Live Stats (Level, XP, Streak, Coins) */}
        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto py-1">
          {/* Level Pill */}
          <div className="flex items-center gap-1.5 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-full text-purple-900 font-extrabold text-sm sm:text-base">
            <span className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs">
              {level}
            </span>
            <span className="hidden sm:inline">Lvl</span>
          </div>

          {/* XP Pill */}
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full text-amber-900 font-extrabold text-sm sm:text-base">
            <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
            <span>{xp}</span>
            <span className="hidden sm:inline text-xs text-amber-700">XP</span>
          </div>

          {/* Streak Pill */}
          <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-full text-orange-900 font-extrabold text-sm sm:text-base">
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
            <span>{streak}</span>
            <span className="hidden sm:inline text-xs text-orange-700">d</span>
          </div>

          {/* Coins Pill */}
          <div className="flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 px-3 py-1.5 rounded-full text-yellow-900 font-extrabold text-sm sm:text-base">
            <Coins className="w-4 h-4 text-yellow-600" />
            <span>{coins}</span>
          </div>
        </div>

        {/* Right: Language & Logout */}
        <div className="flex items-center gap-2">
          <LanguageToggle minimal />
          <button
            onClick={handleLogout}
            className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Log out"
            aria-label="Log out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
