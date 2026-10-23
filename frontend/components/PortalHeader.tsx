"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  GraduationCap,
  Users,
  FileUp,
  CheckSquare,
  BarChart3,
  Bell,
  LogOut,
  Building,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { LanguageToggle } from "./LanguageToggle";
import { clearStoredAuth, getStoredUser, UserProfile } from "../lib/api";
import { useTranslation } from "../lib/i18n";

interface PortalHeaderProps {
  role: "teacher" | "admin";
}

export const PortalHeader: React.FC<PortalHeaderProps> = ({ role }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  // SSR hydration safety: load client-side user info after mount
  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Close mobile drawer on escape key or outside click
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    if (mobileMenuOpen) {
      document.addEventListener("keydown", handleKeyDown);
      // prevent body scroll when drawer is open
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    clearStoredAuth();
    router.push("/");
  };

  const teacherNav = [
    { href: "/teacher/dashboard", label: t("teacher.dashboard", "Teacher Dashboard"), icon: GraduationCap },
    { href: "/teacher/classes", label: t("teacher.students", "Students & Roster"), icon: Users },
    { href: "/teacher/upload", label: t("teacher.uploadPdf", "Upload Textbook / PDF"), icon: FileUp },
    { href: "/teacher/review", label: t("teacher.reviewQuestions", "Review Questions"), icon: CheckSquare },
    { href: "/teacher/reports", label: t("teacher.reports", "Class Heatmap & Reports"), icon: BarChart3 },
    { href: "/teacher/alerts", label: t("teacher.alerts", "Alerts & Interventions"), icon: Bell },
  ];

  const adminNav = [
    { href: "/admin/dashboard", label: t("admin.dashboard", "Institutional Overview"), icon: Building },
    { href: "/admin/teachers", label: t("admin.teacherManagement", "Teacher Management"), icon: Users },
    { href: "/admin/classes", label: t("admin.classManagement", "Class Allocations"), icon: GraduationCap },
    { href: "/admin/reports", label: t("admin.schoolComparison", "School Reports"), icon: BarChart3 },
  ];

  const navItems = role === "admin" ? adminNav : teacherNav;
  const isTeacher = role === "teacher";

  // Derive user initials
  const getInitials = (name?: string) => {
    if (!name) return isTeacher ? "TL" : "AD";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const navLinksList = (
    <nav className="flex flex-col gap-1.5 px-3 py-2">
      <div className="px-3 pb-2 pt-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
        {isTeacher ? "Teacher Navigation" : "Administrator"}
      </div>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href ||
          (item.href !== "/teacher/dashboard" &&
            item.href !== "/admin/dashboard" &&
            pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileMenuOpen(false)}
            className={`group relative flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-150 select-none ${
              isActive
                ? isTeacher
                  ? "bg-blue-50 text-blue-700 ring-1 ring-blue-500/20 shadow-xs font-bold"
                  : "bg-purple-50 text-purple-700 ring-1 ring-purple-500/20 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 active:scale-[0.98]"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 ${
                  isActive
                    ? isTeacher
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-purple-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className="truncate">{item.label}</span>
            </div>
            {isActive && (
              <ChevronRight
                className={`w-4 h-4 flex-shrink-0 ${
                  isTeacher ? "text-blue-500" : "text-purple-500"
                }`}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );

  const sidebarFooter = (
    <div className="p-4 border-t border-slate-200/80 bg-slate-50/70 space-y-3">
      {/* Language Switcher */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Language
        </span>
        <LanguageToggle minimal />
      </div>

      {/* User Info Card */}
      <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-xs">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm text-white shadow-xs flex-shrink-0 ${
            isTeacher
              ? "bg-gradient-to-tr from-blue-600 to-indigo-600"
              : "bg-gradient-to-tr from-purple-600 to-indigo-600"
          }`}
        >
          {getInitials(user?.name)}
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-xs font-bold text-slate-800 leading-tight truncate">
            {user?.name || (isTeacher ? "Teacher Lakshmi" : "Administrator")}
          </span>
          <span className="text-[10px] text-slate-500 font-medium leading-none capitalize mt-0.5">
            {user?.role || (isTeacher ? "teacher" : "admin")}
          </span>
        </div>
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200/80 hover:border-rose-200 transition-all duration-150 active:scale-98"
      >
        <LogOut className="w-3.5 h-3.5" />
        <span>{t("common.logout", "Logout")}</span>
      </button>
    </div>
  );

  return (
    <>
      {/* 1. DESKTOP LEFT SIDEBAR */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 xl:w-72 lg:flex-shrink-0 lg:sticky lg:top-0 lg:h-screen lg:overflow-hidden border-r border-slate-200/80 bg-white z-30 select-none shadow-[1px_0_4px_0_rgba(0,0,0,0.02)]">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-200/80 flex items-center justify-between gap-3 bg-white">
          <Link
            href={isTeacher ? "/teacher/dashboard" : "/admin/dashboard"}
            className="group flex items-center gap-2.5 focus:outline-none"
          >
            <span className="text-2xl group-hover:scale-110 group-active:scale-95 transition-transform duration-150 inline-block">
              🦉
            </span>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg text-slate-900 tracking-tight leading-none">
                LearnBridge
              </span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
                {isTeacher ? "Educator Suite" : "Admin Console"}
              </span>
            </div>
          </Link>

          {/* Role Pill */}
          <div
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              isTeacher
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : "bg-purple-50 text-purple-700 border border-purple-200"
            }`}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isTeacher ? "bg-blue-400" : "bg-purple-400"
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                  isTeacher ? "bg-blue-500" : "bg-purple-600"
                }`}
              />
            </span>
            <span>{isTeacher ? "Teacher" : "Admin"}</span>
          </div>
        </div>

        {/* Scrollable Navigation Menu */}
        <div className="flex-1 overflow-y-auto py-2">{navLinksList}</div>

        {/* Sidebar Footer */}
        {sidebarFooter}
      </aside>

      {/* 2. MOBILE TOPBAR (< lg) */}
      <header className="lg:hidden sticky top-0 z-40 w-full bg-white/90 backdrop-blur-xl border-b border-slate-200 shadow-xs px-3 sm:px-4 h-16 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80 active:scale-95 transition-all flex-shrink-0"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link
            href={isTeacher ? "/teacher/dashboard" : "/admin/dashboard"}
            className="flex items-center gap-1.5 min-w-0 truncate"
          >
            <span className="text-xl sm:text-2xl flex-shrink-0">🦉</span>
            <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight truncate">
              LearnBridge
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <LanguageToggle minimal />
          {user && (
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white shadow-xs flex-shrink-0 ${
                isTeacher
                  ? "bg-gradient-to-tr from-blue-600 to-indigo-600"
                  : "bg-gradient-to-tr from-purple-600 to-indigo-600"
              }`}
            >
              {getInitials(user.name)}
            </div>
          )}
        </div>
      </header>

      {/* 3. MOBILE SLIDE-OUT LEFT DRAWER WITH SMOOTH TRANSITION */}
      <div
        className={`lg:hidden fixed inset-0 z-50 flex transition-all duration-300 ${
          mobileMenuOpen ? "pointer-events-auto visible" : "pointer-events-none invisible"
        }`}
        aria-hidden={!mobileMenuOpen}
      >
        {/* Backdrop overlay */}
        <div
          className={`fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
            mobileMenuOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setMobileMenuOpen(false)}
        />

        {/* Drawer sheet from the left with smooth slide */}
        <div
          ref={drawerRef}
          className={`relative w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-50 transform transition-transform duration-300 ease-out will-change-transform ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Drawer Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🦉</span>
              <span className="font-extrabold text-lg text-slate-900">
                LearnBridge
              </span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:scale-90 transition-all"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation in Drawer */}
          <div className="flex-1 overflow-y-auto py-2">{navLinksList}</div>

          {/* Drawer Footer */}
          {sidebarFooter}
        </div>
      </div>
    </>
  );
};
