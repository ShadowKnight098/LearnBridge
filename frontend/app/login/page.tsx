"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  ShieldCheck,
  User,
  Lock,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2
} from "lucide-react";
import { api } from "../../lib/api";
import { useTranslation } from "../../lib/i18n";
import { LanguageToggle } from "../../components/LanguageToggle";

export default function StaffLoginPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [roleTab, setRoleTab] = useState<"teacher" | "admin">("teacher");
  const [usernameOrEmail, setUsernameOrEmail] = useState("teacher1");
  const [password, setPassword] = useState("teacher123");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRoleTab = (tab: "teacher" | "admin") => {
    setRoleTab(tab);
    if (tab === "teacher") {
      setUsernameOrEmail("teacher1");
      setPassword("teacher123");
    } else {
      setUsernameOrEmail("admin");
      setPassword("admin123");
    }
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail.trim() || !password.trim()) {
      setError("Please enter both your username/email and password.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.loginTeacherAdmin(usernameOrEmail.trim(), password.trim());
      const role = res?.user?.role || roleTab;
      if (role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/teacher/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please verify your login details.");
    } finally {
      setLoading(false);
    }
  };

  const isTeacher = roleTab === "teacher";

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-100/70 via-purple-50/40 to-slate-100 flex flex-col items-center justify-center p-4 sm:p-8 relative selection:bg-purple-200">
      {/* Decorative ambient background glows */}
      <div className="absolute top-12 left-1/4 w-72 h-72 bg-indigo-200/40 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-12 right-1/4 w-80 h-80 bg-purple-200/40 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Header Navigation */}
      <div className="max-w-lg w-full flex items-center justify-between mb-5 sm:mb-6">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/90 backdrop-blur border border-purple-200/80 text-purple-950 font-bold hover:bg-white hover:border-purple-300 transition-all shadow-sm text-sm"
        >
          <ArrowLeft className="w-4 h-4 text-purple-600 group-hover:-translate-x-0.5 transition-transform" />
          <span>{t("common.back", "Back to Student Hub")}</span>
        </Link>
        <LanguageToggle minimal />
      </div>

      {/* Main Login Card */}
      <div className="max-w-lg w-full bg-white rounded-3xl p-6 sm:p-10 shadow-2xl shadow-indigo-950/10 border-2 border-purple-100/80 transition-all">
        {/* Brand / Role Icon Badge */}
        <div className="text-center mb-6">
          <div
            className={`inline-flex items-center justify-center p-3.5 rounded-2xl mb-3 shadow-sm transition-all ${
              isTeacher
                ? "bg-indigo-50 text-indigo-600 ring-4 ring-indigo-50"
                : "bg-purple-50 text-purple-600 ring-4 ring-purple-50"
            }`}
          >
            {isTeacher ? <GraduationCap className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
          </div>

          <div className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2 bg-slate-100 text-slate-700">
            {isTeacher ? "Primary Educator Portal" : "School Admin Portal"}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {isTeacher ? "Teacher & Mentor Sign In" : "Administrator Sign In"}
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
            {isTeacher
              ? "Access curricula, track live classroom mastery heatmaps, and generate bilingual assessment items."
              : "Oversee school-wide FLN competency, teacher rosters, and curriculum compliance."}
          </p>
        </div>

        {/* Dual Role Segmented Tab Switcher */}
        <div className="flex rounded-2xl bg-slate-100/90 p-1.5 mb-6 border border-slate-200/60 shadow-inner">
          <button
            type="button"
            onClick={() => handleRoleTab("teacher")}
            className={`flex-1 py-2.5 text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
              isTeacher
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900 font-bold"
            }`}
          >
            <GraduationCap className={`w-4 h-4 ${isTeacher ? "text-indigo-600" : "text-slate-400"}`} />
            <span>Teacher</span>
          </button>
          <button
            type="button"
            onClick={() => handleRoleTab("admin")}
            className={`flex-1 py-2.5 text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
              !isTeacher
                ? "bg-white text-purple-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900 font-bold"
            }`}
          >
            <ShieldCheck className={`w-4 h-4 ${!isTeacher ? "text-purple-600" : "text-slate-400"}`} />
            <span>Administrator</span>
          </button>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-bold flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
              Username or Email
            </label>
            <div className="relative flex items-center">
              <User className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                placeholder={isTeacher ? "teacher1 (or email)" : "admin (or email)"}
                className={`w-full pl-11 pr-4 py-3 rounded-2xl border bg-slate-50/50 text-slate-900 font-semibold text-sm outline-none transition-all ${
                  isTeacher
                    ? "border-slate-200 focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                    : "border-slate-200 focus:border-purple-600 focus:bg-white focus:ring-4 focus:ring-purple-100"
                }`}
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                Password
              </label>
            </div>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full pl-11 pr-11 py-3 rounded-2xl border bg-slate-50/50 text-slate-900 font-semibold text-sm outline-none transition-all ${
                  isTeacher
                    ? "border-slate-200 focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                    : "border-slate-200 focus:border-purple-600 focus:bg-white focus:ring-4 focus:ring-purple-100"
                }`}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full mt-2 py-3.5 rounded-2xl text-white font-black text-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 transform active:scale-[0.99] disabled:opacity-70 ${
              isTeacher
                ? "bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-700 hover:to-blue-700 shadow-indigo-200"
                : "bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-700 shadow-purple-200"
            }`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Verifying Credentials...</span>
              </span>
            ) : (
              <>
                <span>{isTeacher ? "Sign In to Teacher Dashboard" : "Sign In to Administrator Portal"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Autofill Chips */}
        <div className="mt-7 pt-5 border-t border-slate-100 text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
            Quick One-Click Demo Access
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => handleRoleTab("teacher")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                isTeacher
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-xs"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Autofill Teacher (teacher1)</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleTab("admin")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                !isTeacher
                  ? "bg-purple-50 border-purple-200 text-purple-700 shadow-xs"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
              <span>Autofill Admin (admin)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Security Badge */}
      <div className="mt-6 text-center text-xs text-slate-500 font-semibold flex items-center justify-center gap-2">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span>Argon2 Password Security • Role-Based Access Control • NEP 2020 Aligned</span>
      </div>
    </main>
  );
}
