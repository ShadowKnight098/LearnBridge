"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, ShieldCheck, Mail, Lock, ArrowRight, ArrowLeft, AlertCircle } from "lucide-react";
import { api } from "../../lib/api";
import { useTranslation } from "../../lib/i18n";
import { LanguageToggle } from "../../components/LanguageToggle";

export default function StaffLoginPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [roleTab, setRoleTab] = useState<"teacher" | "admin">("teacher");
  const [email, setEmail] = useState("teacher@school.org");
  const [password, setPassword] = useState("teacher123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRoleTab = (tab: "teacher" | "admin") => {
    setRoleTab(tab);
    if (tab === "teacher") {
      setEmail("teacher@school.org");
      setPassword("teacher123");
    } else {
      setEmail("admin@school.org");
      setPassword("admin123");
    }
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const res = await api.loginTeacherAdmin(email.trim(), password.trim());
      if (res.user.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/teacher/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please verify your email and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-8">
      {/* Header */}
      <div className="max-w-xl w-full mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors shadow-sm text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t("common.back", "Back to Home")}</span>
        </Link>
        <LanguageToggle minimal />
      </div>

      {/* Login Card */}
      <div className="max-w-md w-full mx-auto my-6 bg-white rounded-2xl p-6 sm:p-8 shadow-md border border-slate-200">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-blue-50 text-blue-600 mb-2">
            {roleTab === "teacher" ? <GraduationCap className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {roleTab === "teacher" ? "Teacher Portal Login" : "Administrator Login"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Access curricula, live class heatmaps, and AI question generation
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-slate-100 p-1 mb-6">
          <button
            type="button"
            onClick={() => handleRoleTab("teacher")}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              roleTab === "teacher"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Teacher</span>
          </button>
          <button
            type="button"
            onClick={() => handleRoleTab("admin")}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
              roleTab === "admin"
                ? "bg-white text-purple-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Administrator</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 font-medium text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 font-medium text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500 font-medium">
            Demo credentials pre-filled. Click <span className="font-bold">Sign In</span> to explore!
          </p>
        </div>
      </div>

      <div className="text-center text-xs text-slate-400">
        LearnBridge Secure Role-Based Access Control • Argon2 Password Security
      </div>
    </main>
  );
}
