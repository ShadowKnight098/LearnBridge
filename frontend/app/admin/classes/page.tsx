"use client";

import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  Plus,
  School,
  CheckCircle,
  X,
  Users,
} from "lucide-react";
import { PortalHeader } from "../../../components/PortalHeader";
import { api } from "../../../lib/api";
import { useTranslation } from "../../../lib/i18n";

export default function AdminClassesPage() {
  const { t } = useTranslation();
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClass, setNewClass] = useState({ name: "", grade: 3, teacher_id: "" });
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cls, tchs] = await Promise.all([
        api.getAdminClasses().catch(() => []),
        api.getTeachers().catch(() => []),
      ]);
      setClasses(cls);
      setTeachers(tchs);
      if (tchs.length > 0) {
        setNewClass((prev) => ({ ...prev, teacher_id: tchs[0].id }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createClass(newClass);
      setMessage(`Class "${newClass.name}" created successfully!`);
      setShowAddModal(false);
      setNewClass({ name: "", grade: 3, teacher_id: teachers[0]?.id || "" });
      loadData();
    } catch (err: any) {
      alert(err.message || "Failed to create class");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PortalHeader role="admin" />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {t("admin.classManagement", "Class Allocations")}
            </h1>
            <p className="text-sm text-slate-500">
              Assign teachers to grade cohorts and review class codes for student login
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{t("admin.addClass", "Add Class")}</span>
          </button>
        </div>

        {message && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>{message}</span>
            </div>
            <button onClick={() => setMessage(null)} className="text-xs text-emerald-700 underline">
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {classes.map((c) => (
            <div
              key={c.id}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-purple-300 transition-all flex flex-col justify-between min-h-[160px]"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full">
                    {c.class_code || "CLS-001"}
                  </span>
                  <span className="text-xs font-bold text-slate-500">Grade {c.grade || 3}</span>
                </div>
                <h3 className="text-xl font-black text-slate-900">{c.name}</h3>
                <p className="text-xs text-slate-500 mt-1">Teacher: {c.teacher_name || "Assigned Teacher"}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span>{c.student_count || 12} Enrolled</span>
                </span>
                <span className="text-emerald-600">Active</span>
              </div>
            </div>
          ))}

          {classes.length === 0 && !loading && (
            <div className="col-span-3 bg-white rounded-2xl p-8 text-center border border-slate-200 text-slate-500">
              No classes created yet. Click <span className="font-bold">Add Class</span> to create one.
            </div>
          )}
        </div>

        {/* Modal: Add Class */}
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">Create New Class Cohort</h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateClass} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Class Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newClass.name}
                    onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                    placeholder="e.g. Grade 3 - Alpha"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Grade Level
                  </label>
                  <select
                    value={newClass.grade}
                    onChange={(e) => setNewClass({ ...newClass, grade: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:border-purple-500"
                  >
                    {[1, 2, 3, 4, 5].map((g) => (
                      <option key={g} value={g}>
                        Grade {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Assign Certified Teacher
                  </label>
                  <select
                    value={newClass.teacher_id}
                    onChange={(e) => setNewClass({ ...newClass, teacher_id: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:border-purple-500"
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-sm hover:bg-purple-700"
                  >
                    Save Cohort
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
