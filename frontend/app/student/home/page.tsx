"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Play,
  Map,
  Award,
  ShoppingBag,
  Sparkles,
  Flame,
  Star,
  Coins,
  CheckCircle,
  Clock,
  Compass,
} from "lucide-react";
import { useTranslation } from "../../../lib/i18n";
import { api, getStoredUser } from "../../../lib/api";
import { Mascot } from "../../../components/Mascot";
import { StudentHeader } from "../../../components/StudentHeader";

export default function StudentHomePage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [rewards, setRewards] = useState({
    xp: 45,
    level: 1,
    streak: 3,
    coins: 60,
    badges: [] as any[],
  });
  const [progress, setProgress] = useState({
    mastery_by_skill: {} as Record<string, any>,
    total_sessions: 0,
    accuracy_rate: 0,
  });

  useEffect(() => {
    const localUser = getStoredUser();
    if (!localUser || localUser.role !== "student") {
      router.push("/student/login");
      return;
    }
    setUser(localUser);

    Promise.all([
      api.getStudentRewards().catch(() => null),
      api.getStudentProgress().catch(() => null),
    ]).then(([rData, pData]) => {
      if (rData) {
        setRewards({
          xp: rData.xp,
          level: rData.level,
          streak: rData.streak,
          coins: rData.coins,
          badges: rData.badges || [],
        });
      }
      if (pData) {
        setProgress(pData);
      }
      setLoading(false);
    });
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-student-bg flex items-center justify-center p-4">
        <Mascot mood="thinking" speech={t("common.loading", "Loading your learning dashboard...")} />
      </div>
    );
  }

  // Calculate XP progress within current level
  const nextLevelXp = Math.pow(rewards.level, 2) * 50;
  const prevLevelXp = Math.pow(rewards.level - 1, 2) * 50;
  const xpInLevel = Math.max(0, rewards.xp - prevLevelXp);
  const xpNeeded = Math.max(1, nextLevelXp - prevLevelXp);
  const xpPercent = Math.min(100, Math.round((xpInLevel / xpNeeded) * 100));

  return (
    <div className="min-h-screen bg-student-bg flex flex-col">
      <StudentHeader
        level={rewards.level}
        xp={rewards.xp}
        streak={rewards.streak}
        coins={rewards.coins}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Mascot & Welcome Card */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border-2 border-purple-100 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1">
            <span className="text-xs uppercase font-extrabold tracking-wider bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
              {user?.name ? `Hello, ${user.name}! 🌟` : "Ready to Learn! 🌟"}
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 mt-2 mb-2">
              {t("student.mascotGreeting", "Ready for today's learning adventure?")}
            </h1>
            <p className="text-slate-600 font-medium">
              Every practice session brings you closer to new badges, coins, and knowledge power!
            </p>

            {/* Level & XP Progress bar */}
            <div className="mt-4 bg-purple-50 rounded-2xl p-4 border border-purple-100">
              <div className="flex justify-between text-sm font-black text-purple-900 mb-1.5">
                <span>Level {rewards.level} Explorer</span>
                <span>{rewards.xp} XP</span>
              </div>
              <div className="w-full h-3.5 bg-purple-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
              <p className="text-xs font-semibold text-purple-600 mt-1.5 text-right">
                {nextLevelXp - rewards.xp} XP to Level {rewards.level + 1}
              </p>
            </div>
          </div>

          <div className="flex-shrink-0">
            <Mascot mood="cheering" size="lg" />
          </div>
        </section>

        {/* Big Start Practice CTA Button (Touch target >= 56px, high contrast) */}
        <div className="text-center">
          <Link
            href="/student/practice"
            className="inline-flex items-center justify-center gap-3 w-full sm:w-auto px-10 py-5 rounded-3xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white font-black text-2xl shadow-xl hover:shadow-purple-300 hover:scale-105 active:scale-95 transition-all min-h-[64px]"
          >
            <Play className="w-8 h-8 fill-white" />
            <span>{t("student.startPractice", "Start Practice 🎯")}</span>
          </Link>
        </div>

        {/* Activity & Exploration Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Skill Journey Map (S8) */}
          <Link
            href="/student/skills"
            className="group p-6 rounded-3xl bg-white border-2 border-emerald-100 hover:border-emerald-400 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[170px]"
          >
            <div className="flex items-center justify-between">
              <span className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 text-2xl group-hover:scale-110 transition-transform">
                🗺️
              </span>
              <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                Interactive Map
              </span>
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 mb-1">
                {t("student.skillJourney", "Skill Journey 🗺️")}
              </h2>
              <p className="text-sm font-medium text-slate-500">
                Explore numeracy, reading & words progress.
              </p>
            </div>
          </Link>

          {/* Badges Shelf (S9) */}
          <Link
            href="/student/badges"
            className="group p-6 rounded-3xl bg-white border-2 border-amber-100 hover:border-amber-400 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[170px]"
          >
            <div className="flex items-center justify-between">
              <span className="p-3 rounded-2xl bg-amber-50 text-amber-600 text-2xl group-hover:scale-110 transition-transform">
                🏆
              </span>
              <span className="text-xs font-black text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                {rewards.badges.length} Unlocked
              </span>
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 mb-1">
                {t("student.badgesShelf", "My Badges 🏆")}
              </h2>
              <p className="text-sm font-medium text-slate-500">
                Collect trophies for streaks and mastery!
              </p>
            </div>
          </Link>

          {/* Avatar Shop (S10) */}
          <Link
            href="/student/shop"
            className="group p-6 rounded-3xl bg-white border-2 border-indigo-100 hover:border-indigo-400 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[170px]"
          >
            <div className="flex items-center justify-between">
              <span className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 text-2xl group-hover:scale-110 transition-transform">
                🛒
              </span>
              <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
                {rewards.coins} Coins
              </span>
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 mb-1">
                {t("student.avatarShop", "Avatar Shop 🛒")}
              </h2>
              <p className="text-sm font-medium text-slate-500">
                Spend coins on cool hats, glasses and frames.
              </p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
