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
  User as UserIcon,
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
  const menuRef = useRef<HTMLDivElement>(null);

  // SSR hydration safety: load client-side user info after mount
  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Close mobile menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    clearStoredAuth();
    router.push("/");
  };

  const teacherNav = [
    { href: "/teacher/dashboard", label: t("teacher.dashboard", "Dashboard"), icon: GraduationCap },
    { href: "/teacher/classes", label: t("teacher.students", "Classes & Roster"), icon: Users },
    { href: "/teacher/upload", label: t("teacher.uploadPdf", "Upload Content"), icon: FileUp },
    { href: "/teacher/review", label: t("teacher.reviewQuestions", "Review Questions"), icon: CheckSquare },
    { href: "/teacher/reports", label: t("teacher.reports", "Analytics"), icon: BarChart3 },
    { href: "/teacher/alerts", label: t("teacher.alerts", "Alerts"), icon: Bell },
  ];

  const adminNav = [
    { href: "/admin/dashboard", label: t("admin.dashboard", "Overview"), icon: Building },
    { href: "/admin/teachers", label: t("admin.teacherManagement", "Teachers"), icon: Users },
    { href: "/admin/classes", label: t("admin.classManagement", "Classes"), icon: GraduationCap },
    { href: "/admin/reports", label: t("admin.schoolComparison", "School Reports"), icon: BarChart3 },
  ];

  const navItems = role === "admin" ? adminNav : teacherNav;
  const isTeacher = role === "teacher";

  // Derive user initials or icon
  const getInitials = (name?: string) => {
    if (!name) return isTeacher ? "T" : "A";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/85 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Left: Brand Logo & Role Badge */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
            <Link
              href={role === "admin" ? "/admin/dashboard" : "/teacher/dashboard"}
              className="group flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xl px-1 py-0.5"
            >
              <span className="text-2xl group-hover:scale-110 group-active:scale-95 transition-transform duration-150 inline-block">
                🦉
              </span>
              <span className="font-extrabold text-lg sm:text-xl text-slate-900 tracking-tight">
                LearnBridge
              </span>
            </Link>

            {/* Portal Badge with pulse indicator */}
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors ${
                isTeacher
                  ? "bg-blue-50 text-blue-700 border border-blue-200/80"
                  : "bg-purple-50 text-purple-700 border border-purple-200/80"
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isTeacher ? "bg-blue-400" : "bg-purple-400"
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    isTeacher ? "bg-blue-500" : "bg-purple-600"
                  }`}
                />
              </span>
              <span className="hidden xs:inline">
                {isTeacher ? "Teacher" : "Admin"}
              </span>
            </div>
          </div>

          {/* Center: Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 active:scale-[0.97] select-none ${
                    isActive
                      ? isTeacher
                        ? "bg-blue-50 text-blue-700 ring-1 ring-blue-500/20 shadow-xs"
                        : "bg-purple-50 text-purple-700 ring-1 ring-purple-500/20 shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive
                        ? isTeacher
                          ? "text-blue-600"
                          : "text-purple-600"
                        : "text-slate-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Controls: Language, User Profile, Logout & Mobile Toggle */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <LanguageToggle minimal />

            {/* User Chip (Desktop) */}
            {user && (
              <div
                className="hidden sm:flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-xl bg-slate-50/80 border border-slate-200/60"
                title={user.email}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white shadow-xs ${
                    isTeacher
                      ? "bg-gradient-to-tr from-blue-600 to-indigo-600"
                      : "bg-gradient-to-tr from-purple-600 to-indigo-600"
                  }`}
                >
                  {getInitials(user.name)}
                </div>
                <div className="hidden xl:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-800 leading-tight max-w-[120px] truncate">
                    {user.name || (isTeacher ? "Teacher" : "Admin")}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium leading-none capitalize">
                    {user.role}
                  </span>
                </div>
              </div>
            )}

            {/* Logout Button (Desktop) */}
            <button
              onClick={handleLogout}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50/80 border border-transparent hover:border-rose-100 active:scale-95 transition-all duration-150"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">{t("common.logout", "Logout")}</span>
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80 active:scale-95 transition-all duration-150"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu Drawer */}
      {mobileMenuOpen && (
        <div
          ref={menuRef}
          className="lg:hidden border-t border-slate-200/90 bg-white/95 backdrop-blur-xl px-4 py-3 shadow-lg animate-in slide-in-from-top-2 duration-150"
        >
          {/* User Profile summary on mobile */}
          {user && (
            <div className="flex items-center gap-3 pb-3 mb-2 border-b border-slate-100">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white shadow-xs ${
                  isTeacher
                    ? "bg-gradient-to-tr from-blue-600 to-indigo-600"
                    : "bg-gradient-to-tr from-purple-600 to-indigo-600"
                }`}
              >
                {getInitials(user.name)}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-800">
                  {user.name || (isTeacher ? "Teacher" : "Admin")}
                </span>
                <span className="text-xs text-slate-500 font-medium capitalize">
                  {user.email || user.role}
                </span>
              </div>
            </div>
          )}

          {/* Navigation Items List */}
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-[0.98] ${
                    isActive
                      ? isTeacher
                        ? "bg-blue-50 text-blue-700 ring-1 ring-blue-500/20 shadow-xs"
                        : "bg-purple-50 text-purple-700 ring-1 ring-purple-500/20 shadow-xs"
                      : "text-slate-700 hover:bg-slate-100/80 active:bg-slate-100"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      isActive
                        ? isTeacher
                          ? "text-blue-600"
                          : "text-purple-600"
                        : "text-slate-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Mobile Logout Button */}
          <div className="pt-2 mt-2 border-t border-slate-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 active:bg-rose-100 transition-colors"
            >
              <LogOut className="w-5 h-5 text-rose-500" />
              <span>{t("common.logout", "Logout")}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
