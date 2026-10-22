"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star, ArrowLeft, Play, Sparkles } from "lucide-react";
import { useTranslation } from "../../../lib/i18n";
import { api } from "../../../lib/api";
import { StudentHeader } from "../../../components/StudentHeader";
import { Mascot } from "../../../components/Mascot";

export default function SkillMapPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<any>(null);

  useEffect(() => {
    api
      .getStudentProgress()
      .then((data) => {
        setProgress(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const skillCategories = [
    {
      category: "Numeracy",
      icon: "🔢",
      color: "border-purple-300 bg-purple-50",
      skills: [
        { id: "NUM-01", name: "Counting 1-20", mastery: 0.85, stars: 3 },
        { id: "NUM-02", name: "Single-Digit Addition", mastery: 0.72, stars: 2 },
        { id: "NUM-03", name: "Single-Digit Subtraction", mastery: 0.55, stars: 2 },
        { id: "NUM-04", name: "Place Value (Tens & Ones)", mastery: 0.35, stars: 1 },
        { id: "NUM-05", name: "Two-Digit Addition", mastery: 0.2, stars: 0 },
      ],
    },
    {
      category: "Literacy & Phonics",
      icon: "📖",
      color: "border-emerald-300 bg-emerald-50",
      skills: [
        { id: "LIT-01", name: "Letter Recognition", mastery: 0.9, stars: 3 },
        { id: "LIT-02", name: "Beginning Sounds", mastery: 0.8, stars: 3 },
        { id: "LIT-03", name: "CVC Word Blending", mastery: 0.6, stars: 2 },
        { id: "LIT-04", name: "Sight Words", mastery: 0.45, stars: 1 },
      ],
    },
    {
      category: "Language & Vocabulary",
      icon: "🗣️",
      color: "border-amber-300 bg-amber-50",
      skills: [
        { id: "LANG-01", name: "Everyday Objects", mastery: 0.8, stars: 3 },
        { id: "LANG-02", name: "Action Words", mastery: 0.65, stars: 2 },
        { id: "LANG-03", name: "Simple Sentences", mastery: 0.3, stars: 1 },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-student-bg flex flex-col">
      <StudentHeader showBack backHref="/student/home" />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border-2 border-purple-100 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 mb-1">
              {t("student.skillJourney", "Skill Journey 🗺️")}
            </h1>
            <p className="text-slate-600 font-medium">
              Earn up to 3 stars in each skill to become a Master Learner!
            </p>
          </div>
          <Mascot mood="greeting" size="sm" />
        </div>

        <div className="space-y-6">
          {skillCategories.map((cat) => (
            <div key={cat.category} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{cat.icon}</span>
                <h2 className="text-2xl font-black text-slate-800">{cat.category}</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {cat.skills.map((skill) => {
                  const currentMastery =
                    progress?.mastery_by_skill?.[skill.id]?.mastery ?? skill.mastery;
                  const currentStars = Math.min(
                    3,
                    Math.floor(currentMastery * 3.3)
                  );

                  return (
                    <div
                      key={skill.id}
                      className={`p-4 rounded-2xl border-2 ${cat.color} flex flex-col justify-between min-h-[140px]`}
                    >
                      <div>
                        <span className="text-xs font-black text-slate-500 uppercase">
                          {skill.id}
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 leading-tight mt-0.5">
                          {skill.name}
                        </h3>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200/60">
                        {/* Stars */}
                        <div className="flex items-center gap-1">
                          {[1, 2, 3].map((starIdx) => (
                            <Star
                              key={starIdx}
                              className={`w-5 h-5 ${
                                starIdx <= currentStars
                                  ? "text-amber-400 fill-amber-400"
                                  : "text-slate-300"
                              }`}
                            />
                          ))}
                        </div>

                        <Link
                          href={`/student/practice?skill=${skill.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition-transform active:scale-95"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>Practice</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
