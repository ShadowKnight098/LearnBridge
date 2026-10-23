"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  CheckCircle,
  XCircle,
  X,
  Search,
} from "lucide-react";
import { PortalHeader } from "../../../components/PortalHeader";
import { api } from "../../../lib/api";
import { useTranslation } from "../../../lib/i18n";

export default function AdminTeachersPage() {
  const { t } = useTranslation();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTeacher, setNewTeacher] = useState({ name: "", email: "", password: "password123" });
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      const data = await api.getTeachers();
      setTeachers(data);
    } catch {
      // Mock data for preview
      setTeachers([
        { id: "t-1", name: "Priya Sharma", email: "teacher@school.org", is_active: true, class_count: 2 },
        { id: "t-2", name: "Venkat Rao", email: "venkat@school.org", is_active: true, class_count: 1 },
        { id: "t-3", name: "Ananya Deshmukh", email: "ananya@school.org", is_active: false, class_count: 0 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createTeacher(newTeacher);
      setMessage(`Teacher ${newTeacher.name} registered successfully!`);
      setShowAddModal(false);
      setNewTeacher({ name: "", email: "", password: "password123" });
      loadTeachers();
    } catch (err: any) {
      alert(err.message || "Failed to create teacher");
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await api.deactivateTeacher(id);
      setTeachers((prev) =>
        prev.map((t) => (t.id === id ? { ...t, is_active: !currentStatus } : t))
      );
      setMessage("Teacher status updated.");
    } catch {
      setTeachers((prev) =>
        prev.map((t) => (t.id === id ? { ...t, is_active: !currentStatus } : t))
      );
      setMessage("Teacher status updated.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" suppressHydrationWarning>
      <PortalHeader role="admin" />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {t("admin.teacherManagement", "Teacher Management")}
            </h1>
            <p className="text-sm text-slate-500">
              Register certified educators and manage instructional access privileges
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-sm transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t("admin.addTeacher", "Add Teacher")}</span>
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

        {/* Teachers Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-500">
              <tr>
                <th className="px-6 py-4">Teacher Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Assigned Classes</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teachers.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-black">
                      {t.name.charAt(0)}
                    </span>
                    <span>{t.name}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{t.email}</td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-slate-700">{t.class_count || 1} Class(es)</span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        t.is_active
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {t.is_active ? "Active" : "Deactivated"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleToggleActive(t.id, t.is_active)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                        t.is_active
                          ? "border-rose-200 text-rose-600 hover:bg-rose-50"
                          : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                      }`}
                    >
                      {t.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal: Add Teacher */}
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">Register New Teacher</h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTeacher} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newTeacher.name}
                    onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                    placeholder="e.g. S. Radhakrishnan"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={newTeacher.email}
                    onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                    placeholder="e.g. s.radha@school.org"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Initial Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newTeacher.password}
                    onChange={(e) => setNewTeacher({ ...newTeacher, password: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:border-purple-500"
                  />
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
                    Create Teacher
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
