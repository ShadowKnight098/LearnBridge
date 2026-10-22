"use client";

import React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  GraduationCap,
  Users,
  FileUp,
  CheckSquare,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  Building,
} from "lucide-react";
import { LanguageToggle } from "./LanguageToggle";
import { clearStoredAuth, getStoredUser } from "../lib/api";
import { useTranslation } from "../lib/i18n";

interface PortalHeaderProps {
  role: "teacher" | "admin";
}

export const PortalHeader: React.FC<PortalHeaderProps> = ({ role }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const user = getStoredUser();

  const handleLogout = () => {
    clearStoredAuth();
    router.push("/");
  };

  const teacherNav = [
    { href: "/teacher/dashboard", label: t("teacher.dashboard", "Dashboard"), icon: GraduationCap },
    { href: "/teacher/classes", label: t("teacher.students", "Classes & Roster"), icon: Users },
    { href: "/teacher/upload", label: t("teacher.uploadPdf", "Upload Content"), icon: FileUp },
    { href: "/teacher/review", label: t("teacher.reviewQuestions", "Review Questions"), icon: CheckSquare },
    { href: "/teacher/reports", label: t("teacher.reports", "Analytics & Heatmap"), icon: BarChart3 },
    { href: "/teacher/alerts", label: t("teacher.alerts", "Alerts"), icon: Bell },
  ];

  const adminNav = [
    { href: "/admin/dashboard", label: t("admin.dashboard", "Overview"), icon: Building },
    { href: "/admin/teachers", label: t("admin.teacherManagement", "Teachers"), icon: Users },
    { href: "/admin/classes", label: t("admin.classManagement", "Classes"), icon: GraduationCap },
    { href: "/admin/reports", label: t("admin.schoolComparison", "School Reports"), icon: BarChart3 },
  ];

  const navItems = role === "admin" ? adminNav : teacherNav;

  return (
    <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Portal Badge */}
          <div className="flex items-center gap-3">
            <Link href={role === "admin" ? "/admin/dashboard" : "/teacher/dashboard"} className="flex items-center gap-2">
              <span className="text-2xl">🦉</span>
              <span className="font-bold text-xl text-slate-900 tracking-tight">LearnBridge</span>
            </Link>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                role === "admin"
                  ? "bg-purple-100 text-purple-800 border border-purple-200"
                  : "bg-blue-100 text-blue-800 border border-blue-200"
              }`}
            >
              {role === "admin" ? "Admin Portal" : "Teacher Portal"}
            </span>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            <LanguageToggle minimal />
            {user?.name && (
              <span className="hidden lg:inline text-sm font-medium text-slate-600">
                {user.name}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">{t("common.logout", "Logout")}</span>
            </button>
          </div>
        </div>

        {/* Mobile Nav row */}
        <div className="md:hidden flex items-center gap-2 overflow-x-auto py-2 border-t border-slate-100">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                  isActive
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
};
