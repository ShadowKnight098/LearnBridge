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
      <div className="flex items-center gap-1 bg-white/80 backdrop-blur rounded-full p-1 border border-purple-200 shadow-sm">
        <Globe className="w-4 h-4 text-purple-600 ml-2" />
        {languages.map((l) => (
          <button
            key={l.code}
            onClick={() => setLanguage(l.code)}
            className={`px-3 py-1 text-sm font-semibold rounded-full transition-all ${
              language === l.code
                ? "bg-purple-600 text-white shadow-sm"
                : "text-slate-600 hover:text-purple-600 hover:bg-purple-50"
            }`}
            aria-label={`Switch language to ${l.native}`}
          >
            {l.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center rounded-2xl bg-white p-1.5 shadow-md border border-slate-200">
      <Globe className="w-5 h-5 text-indigo-500 ml-2 mr-1" />
      {languages.map((l) => (
        <button
          key={l.code}
          onClick={() => setLanguage(l.code)}
          className={`px-4 py-2 text-base font-bold rounded-xl transition-all ${
            language === l.code
              ? "bg-indigo-600 text-white shadow-md scale-105"
              : "text-slate-600 hover:text-indigo-600 hover:bg-slate-50"
          }`}
          aria-label={`Switch language to ${l.native}`}
        >
          {l.native}
        </button>
      ))}
    </div>
  );
};
