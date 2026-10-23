"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  FileUp,
  CheckSquare,
  BarChart3,
  Bell,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { PortalHeader } from "../../../components/PortalHeader";
import { api, getStoredUser } from "../../../lib/api";
import { useTranslation } from "../../../lib/i18n";

export default function TeacherDashboardPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<any[]>([]);
  const [draftsCount, setDraftsCount] = useState(0);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    const localUser = getStoredUser();
    if (!localUser || localUser.role !== "teacher") {
      router.push("/login");
      return;
    }
    setUser(localUser);

    Promise.all([
      api.getTeacherClasses().catch(() => []),
      api.getDraftQuestions("draft").catch(() => []),
      api.getTeacherAlerts().catch(() => []),
    ]).then(([cls, drafts, alts]) => {
      setClasses(cls);
      setDraftsCount(drafts.length);
      setAlerts(alts);
      setLoading(false);
    });
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row" suppressHydrationWarning>
      <PortalHeader role="teacher" />

      <div className="flex-1 min-w-0 flex flex-col">
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-2xl p-6 sm:p-8 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs uppercase font-extrabold tracking-wider bg-white/20 px-3 py-1 rounded-full">
              Teacher Dashboard
            </span>
            <h1 className="text-2xl sm:text-3xl font-black mt-2" suppressHydrationWarning>
              Welcome back, {mounted ? (user?.name || "Teacher") : "Teacher"}!
            </h1>
            <p className="text-blue-100 text-sm sm:text-base mt-1 max-w-xl">
              Monitor student mastery in real time, extract curricula from textbooks in your browser, and review AI-aligned practice questions.
            </p>
          </div>
          <Link
            href="/teacher/upload"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-sm shadow-sm transition-all whitespace-nowrap"
          >
            <FileUp className="w-5 h-5 text-blue-600" />
            <span>Upload Textbook PDF</span>
          </Link>
        </div>

        {/* Quick KPI Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase text-slate-500">My Classes</span>
              <p className="text-3xl font-black text-slate-900 mt-1">{classes.length || 1}</p>
              <span className="text-xs text-slate-500">Primary Grades</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase text-slate-500">Total Enrolled</span>
              <p className="text-3xl font-black text-slate-900 mt-1">
                {classes.reduce((acc, c) => acc + (c.student_count || 3), 0)}
              </p>
              <span className="text-xs text-emerald-600 font-semibold">Active Practice</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <Link
            href="/teacher/review"
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-400 transition-all flex items-center justify-between group"
          >
            <div>
              <span className="text-xs font-bold uppercase text-slate-500">Draft Questions</span>
              <p className="text-3xl font-black text-slate-900 mt-1">{draftsCount}</p>
              <span className="text-xs text-blue-600 font-semibold group-hover:underline">
                Review pending drafts →
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <CheckSquare className="w-6 h-6" />
            </div>
          </Link>

          <Link
            href="/teacher/alerts"
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-red-400 transition-all flex items-center justify-between group"
          >
            <div>
              <span className="text-xs font-bold uppercase text-slate-500">Active Alerts</span>
              <p className="text-3xl font-black text-slate-900 mt-1">{alerts.length}</p>
              <span className="text-xs text-red-600 font-semibold group-hover:underline">
                {alerts.length > 0 ? "Requires intervention →" : "All good"}
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <Bell className="w-6 h-6" />
            </div>
          </Link>
        </div>

        {/* Alerts & Action items */}
        {alerts.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3 text-amber-900 font-bold">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span>Attention Needed: {alerts.length} Student Alert(s) Detected</span>
            </div>
            <div className="space-y-2">
              {alerts.slice(0, 3).map((a: any) => (
                <div
                  key={a.id}
                  className="bg-white p-3.5 rounded-xl border border-amber-200 flex items-center justify-between text-sm"
                >
                  <div>
                    <span className="font-bold text-slate-900">{a.student_name || "Student"}</span>:{" "}
                    <span className="text-slate-600">{a.reason || a.alert_type}</span>
                  </div>
                  <Link
                    href="/teacher/alerts"
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    Resolve Alert
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Launch Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/teacher/classes"
            className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <Users className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">Students & Roster</h2>
              <p className="text-sm text-slate-500">
                Manage student profiles, reset 4-digit PINs, and import rosters from CSV spreadsheets.
              </p>
            </div>
            <span className="mt-4 text-sm font-bold text-blue-600 flex items-center gap-1">
              Open Roster <ArrowRight className="w-4 h-4" />
            </span>
          </Link>

          <Link
            href="/teacher/review"
            className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                <CheckSquare className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">Question Review & Approvals</h2>
              <p className="text-sm text-slate-500">
                Inspect AI-generated draft questions, edit text, verify correct answers, or bulk-approve.
              </p>
            </div>
            <span className="mt-4 text-sm font-bold text-blue-600 flex items-center gap-1">
              Review Drafts <ArrowRight className="w-4 h-4" />
            </span>
          </Link>

          <Link
            href="/teacher/reports"
            className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">Mastery Heatmap & Reports</h2>
              <p className="text-sm text-slate-500">
                Visual matrix of student mastery per foundational skill, most-missed concepts, and CSV export.
              </p>
            </div>
            <span className="mt-4 text-sm font-bold text-blue-600 flex items-center gap-1">
              View Analytics <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>
      </main>
    </div>
  </div>
);
}
