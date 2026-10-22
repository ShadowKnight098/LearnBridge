"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Award, Lock, Sparkles, CheckCircle2 } from "lucide-react";
import { useTranslation } from "../../../lib/i18n";
import { api } from "../../../lib/api";
import { StudentHeader } from "../../../components/StudentHeader";
import { Mascot } from "../../../components/Mascot";

export default function BadgesShelfPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [badgesData, setBadgesData] = useState<{
    unlocked: any[];
    available: any[];
  }>({
    unlocked: [],
    available: [],
  });

  useEffect(() => {
    api
      .getStudentRewards()
      .then((data) => {
        setBadgesData({
          unlocked: data.badges || [],
          available: data.available_badges || [
            { id: "b1", name: "First Steps", description: "Complete your first practice session", icon: "🌱", unlocked: true },
            { id: "b2", name: "On Fire", description: "Maintain a 3-day learning streak", icon: "🔥", unlocked: true },
            { id: "b3", name: "Week Warrior", description: "Reach a 7-day learning streak", icon: "⚡", unlocked: false },
            { id: "b4", name: "Math Wizard", description: "Reach 0.8 mastery in 3 numeracy skills", icon: "🧙‍♂️", unlocked: false },
            { id: "b5", name: "Word Explorer", description: "Reach 0.8 mastery in 3 literacy skills", icon: "📚", unlocked: false },
            { id: "b6", name: "Bilingual Star", description: "Complete sessions in two languages", icon: "🌐", unlocked: false },
            { id: "b7", name: "Comeback Kid", description: "Raise a weak skill by 0.2 points", icon: "🚀", unlocked: false },
          ],
        });
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-student-bg flex flex-col">
      <StudentHeader showBack backHref="/student/home" />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border-2 border-purple-100 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 mb-1">
              {t("student.badgesShelf", "My Badges 🏆")}
            </h1>
            <p className="text-slate-600 font-medium">
              Collect trophies for daily streaks, accuracy, and subject mastery!
            </p>
          </div>
          <Mascot mood="cheering" size="sm" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {badgesData.available.map((badge: any) => {
            const isUnlocked =
              badge.unlocked ||
              badgesData.unlocked.some((b) => b.id === badge.id || b.name === badge.name);

            return (
              <div
                key={badge.id}
                className={`p-6 rounded-3xl border-2 flex flex-col justify-between transition-all ${
                  isUnlocked
                    ? "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300 shadow-md transform hover:-translate-y-1"
                    : "bg-slate-50 border-slate-200 opacity-60"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-5xl">{badge.icon || "🏅"}</span>
                    {isUnlocked ? (
                      <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Unlocked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-200 px-2.5 py-1 rounded-full">
                        <Lock className="w-3.5 h-3.5" />
                        Locked
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-black text-slate-900 mb-1">{badge.name}</h3>
                  <p className="text-sm font-medium text-slate-600">{badge.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 text-xs font-bold text-slate-500">
                  {isUnlocked ? "Awarded to you ⭐" : "Keep practicing to unlock!"}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
