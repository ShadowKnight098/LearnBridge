"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTranslation, Language } from "../lib/i18n";
import { Globe, ChevronDown, Check } from "lucide-react";

export const LanguageToggle: React.FC<{ minimal?: boolean }> = ({ minimal = false }) => {
  const { language, setLanguage } = useTranslation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const languages: { code: Language; label: string; native: string }[] = [
    { code: "en", label: "EN", native: "English" },
    { code: "hi", label: "HI", native: "हिन्दी" },
    { code: "te", label: "TE", native: "తెలుగు" },
  ];

  const currentLang = languages.find((l) => l.code === language) || languages[0];

  // Close dropdown on outside click or escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDropdownOpen(false);
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [dropdownOpen]);

  const selectLanguage = (code: Language) => {
    setLanguage(code);
    setDropdownOpen(false);
  };

  return (
    <div ref={containerRef} className="relative inline-block" suppressHydrationWarning>
      {/* 1. MOBILE COMPACT TRIGGER (< sm) */}
      <div className="sm:hidden">
        <button
          type="button"
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 active:scale-95 text-xs font-bold text-slate-700 border border-slate-200 shadow-xs transition-all select-none"
          aria-expanded={dropdownOpen}
          aria-haspopup="listbox"
          aria-label="Select Language"
        >
          <Globe className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
          <span className="font-extrabold uppercase text-purple-900">{currentLang.label}</span>
          <ChevronDown
            className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${
              dropdownOpen ? "rotate-180 text-purple-600" : ""
            }`}
          />
        </button>

        {/* Mobile Floating Dropdown Menu */}
        {dropdownOpen && (
          <div
            role="listbox"
            className="absolute right-0 top-full mt-2 w-44 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl shadow-purple-950/15 border-2 border-purple-100 p-1.5 z-50 animate-menu-pop"
          >
            <div className="px-2.5 py-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              Choose Language
            </div>
            {languages.map((l) => {
              const isSelected = language === l.code;
              return (
                <button
                  key={l.code}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => selectLanguage(l.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    isSelected
                      ? "bg-purple-600 text-white shadow-xs"
                      : "text-slate-700 hover:bg-purple-50 hover:text-purple-900 active:scale-98"
                  }`}
                >
                  <span className="font-semibold">{l.native}</span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                        isSelected ? "bg-purple-700 text-purple-100" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {l.label}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. DESKTOP / TABLET SEGMENTED PILLS (>= sm) */}
      <div className="hidden sm:inline-flex">
        {minimal ? (
          <div
            className="inline-flex items-center gap-0.5 bg-slate-100/90 p-1 rounded-full border border-slate-200/80 shadow-xs"
            role="group"
            aria-label="Language selector"
          >
            <div className="pl-1.5 pr-0.5 flex items-center text-slate-400">
              <Globe className="w-3.5 h-3.5" />
            </div>
            {languages.map((l) => {
              const isActive = language === l.code;
              return (
                <button
                  key={l.code}
                  onClick={() => selectLanguage(l.code)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-full transition-all duration-150 select-none ${
                    isActive
                      ? "bg-white text-purple-700 shadow-xs scale-100 font-extrabold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60 active:scale-95"
                  }`}
                  aria-label={`Switch language to ${l.native}`}
                  aria-pressed={isActive}
                >
                  {l.label}
                </button>
              );
            })}
          </div>
        ) : (
          <div
            className="inline-flex items-center gap-1 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl shadow-sm border border-slate-200/90"
            role="group"
            aria-label="Language selector"
          >
            <div className="pl-2 pr-1 flex items-center text-indigo-500">
              <Globe className="w-4 h-4" />
            </div>
            {languages.map((l) => {
              const isActive = language === l.code;
              return (
                <button
                  key={l.code}
                  onClick={() => selectLanguage(l.code)}
                  className={`px-3.5 py-1.5 text-sm font-bold rounded-xl transition-all duration-150 select-none ${
                    isActive
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm shadow-purple-500/20 scale-[1.02]"
                      : "text-slate-600 hover:text-indigo-600 hover:bg-slate-50 active:scale-95"
                  }`}
                  aria-label={`Switch language to ${l.native}`}
                  aria-pressed={isActive}
                >
                  {l.native}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
