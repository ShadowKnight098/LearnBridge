"use client";

import React from "react";
import { useTranslation, Language } from "../lib/i18n";
import { Globe } from "lucide-react";

export const LanguageToggle: React.FC<{ minimal?: boolean }> = ({ minimal = false }) => {
  const { language, setLanguage } = useTranslation();

  const languages: { code: Language; label: string; native: string }[] = [
    { code: "en", label: "EN", native: "English" },
    { code: "hi", label: "HI", native: "हिन्दी" },
    { code: "te", label: "TE", native: "తెలుగు" },
  ];

  if (minimal) {
    return (
      <div
        className="inline-flex items-center gap-0.5 bg-slate-100/90 p-1 rounded-full border border-slate-200/80 shadow-xs"
        role="group"
        aria-label="Language selector"
        suppressHydrationWarning
      >
        <div className="pl-1.5 pr-0.5 flex items-center text-slate-400">
          <Globe className="w-3.5 h-3.5" />
        </div>
        {languages.map((l) => {
          const isActive = language === l.code;
          return (
            <button
              key={l.code}
              onClick={() => setLanguage(l.code)}
              className={`px-2.5 py-1 text-xs font-bold rounded-full transition-all duration-150 select-none ${
                isActive
                  ? "bg-white text-purple-700 shadow-xs scale-100 font-extrabold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60 active:scale-95"
              }`}
              aria-label={`Switch language to ${l.native}`}
              aria-pressed={isActive}
              suppressHydrationWarning
            >
              {l.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className="inline-flex items-center gap-1 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl shadow-sm border border-slate-200/90"
      role="group"
      aria-label="Language selector"
      suppressHydrationWarning
    >
      <div className="pl-2 pr-1 flex items-center text-indigo-500">
        <Globe className="w-4 h-4" />
      </div>
      {languages.map((l) => {
        const isActive = language === l.code;
        return (
          <button
            key={l.code}
            onClick={() => setLanguage(l.code)}
            className={`px-3.5 py-1.5 text-sm font-bold rounded-xl transition-all duration-150 select-none ${
              isActive
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm shadow-purple-500/20 scale-[1.02]"
                : "text-slate-600 hover:text-indigo-600 hover:bg-slate-50 active:scale-95"
            }`}
            aria-label={`Switch language to ${l.native}`}
            aria-pressed={isActive}
            suppressHydrationWarning
          >
            {l.native}
          </button>
        );
      })}
    </div>
  );
};
