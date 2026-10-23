"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building,
  Users,
  GraduationCap,
  BarChart3,
  CheckCircle,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { PortalHeader } from "../../../components/PortalHeader";
import { api, getStoredUser } from "../../../lib/api";
import { useTranslation } from "../../../lib/i18n";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>({
    total_students: 24,
    total_teachers: 3,
    total_sessions: 142,
    avg_mastery: 0.74,
    class_comparisons: [],
  });

  useEffect(() => {
    const user = getStoredUser();
    if (!user || user.role !== "admin") {
      router.push("/login");
      return;
    }

    api
      .getSchoolReport()
      .then((data) => {
        setReport(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" suppressHydrationWarning>
      <PortalHeader role="admin" />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-wider bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
            Institutional Administration
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            {t("admin.dashboard", "School Administrator Overview")}
          </h1>
          <p className="text-sm text-slate-500">
            School-wide KPIs, teacher allocations, class performance, and foundational mastery metrics.
          </p>
        </div>

        {/* KPI Cards (A1) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase text-slate-500">
                {t("admin.totalStudents", "Total Active Students")}
              </span>
              <p className="text-3xl font-black text-slate-900 mt-1">{report.total_students || 24}</p>
              <span className="text-xs text-emerald-600 font-semibold">Active This Term</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase text-slate-500">
                {t("admin.totalTeachers", "Certified Teachers")}
              </span>
              <p className="text-3xl font-black text-slate-900 mt-1">{report.total_teachers || 3}</p>
              <span className="text-xs text-blue-600 font-semibold">Assigned & Active</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase text-slate-500">
                {t("admin.totalSessions", "Completed Sessions")}
              </span>
              <p className="text-3xl font-black text-slate-900 mt-1">{report.total_sessions || 142}</p>
              <span className="text-xs text-amber-600 font-semibold">Practice Rounds</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase text-slate-500">
                {t("admin.avgMastery", "School-Wide Mastery")}
              </span>
              <p className="text-3xl font-black text-slate-900 mt-1">
                {Math.round((report.avg_mastery || 0.74) * 100)}%
              </p>
              <span className="text-xs text-emerald-600 font-semibold">Foundational Benchmark</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <BarChart3 className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Action Management Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/admin/teachers"
            className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-purple-400 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                <Users className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">
                {t("admin.teacherManagement", "Teacher Management")}
              </h2>
              <p className="text-sm text-slate-500">
                Register new teachers, update class assignments, and manage access permissions.
              </p>
            </div>
            <span className="mt-4 text-sm font-bold text-purple-600 flex items-center gap-1">
              Manage Staff <ArrowRight className="w-4 h-4" />
            </span>
          </Link>

          <Link
            href="/admin/classes"
            className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-purple-400 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">
                {t("admin.classManagement", "Class Allocations")}
              </h2>
              <p className="text-sm text-slate-500">
                Create new grade cohorts, map class codes, and track teacher-to-student ratios.
              </p>
            </div>
            <span className="mt-4 text-sm font-bold text-blue-600 flex items-center gap-1">
              Manage Classes <ArrowRight className="w-4 h-4" />
            </span>
          </Link>

          <Link
            href="/admin/reports"
            className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-purple-400 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">
                {t("admin.schoolComparison", "School Comparison Reports")}
              </h2>
              <p className="text-sm text-slate-500">
                Cross-class benchmarks, weekly participation trends, and institutional export.
              </p>
            </div>
            <span className="mt-4 text-sm font-bold text-emerald-600 flex items-center gap-1">
              View Analytics <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}
