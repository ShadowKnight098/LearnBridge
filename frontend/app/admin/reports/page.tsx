"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Download,
  School,
  TrendingUp,
  Award,
  Users,
} from "lucide-react";
import { PortalHeader } from "../../../components/PortalHeader";
import { api } from "../../../lib/api";
import { useTranslation } from "../../../lib/i18n";

export default function AdminReportsPage() {
  const { t } = useTranslation();
  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getSchoolReport()
      .then((data) => {
        setReport(data);
        setLoading(false);
      })
      .catch(() => {
        // Mock fallback
        setReport({
          total_students: 32,
          total_teachers: 3,
          total_sessions: 168,
          avg_mastery: 0.76,
          class_comparisons: [
            { class_id: "c1", class_name: "Grade 3 - Alpha", teacher_name: "Priya Sharma", student_count: 14, avg_mastery: 0.82, completion_rate: 0.94 },
            { class_id: "c2", class_name: "Grade 3 - Beta", teacher_name: "Venkat Rao", student_count: 12, avg_mastery: 0.74, completion_rate: 0.88 },
            { class_id: "c3", class_name: "Grade 2 - Gamma", teacher_name: "Priya Sharma", student_count: 6, avg_mastery: 0.68, completion_rate: 0.82 },
          ],
        });
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row" suppressHydrationWarning>
      <PortalHeader role="admin" />

      <div className="flex-1 min-w-0 flex flex-col">
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {t("admin.schoolComparison", "School Comparison Reports")}
            </h1>
            <p className="text-sm text-slate-500">
              Cross-class academic benchmarks, participation rates, and institutional evaluation
            </p>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Class Cohort Benchmarks</h2>
            <span className="text-xs font-semibold text-slate-500">All Active Cohorts</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-500">
                <tr>
                  <th className="px-6 py-4">Cohort Name</th>
                  <th className="px-6 py-4">Teacher</th>
                  <th className="px-6 py-4">Students</th>
                  <th className="px-6 py-4">Average Mastery</th>
                  <th className="px-6 py-4">Session Completion</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report?.class_comparisons?.map((row: any) => (
                  <tr key={row.class_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{row.class_name}</td>
                    <td className="px-6 py-4 font-medium text-slate-600">{row.teacher_name}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{row.student_count}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              row.avg_mastery >= 0.7
                                ? "bg-emerald-500"
                                : row.avg_mastery >= 0.4
                                ? "bg-amber-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${Math.round(row.avg_mastery * 100)}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-800 text-xs">
                          {Math.round(row.avg_mastery * 100)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-600">
                      {Math.round(row.completion_rate * 100)}%
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        On Track
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  </div>
);
}
