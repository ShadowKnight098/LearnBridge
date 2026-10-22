"use client";

import React from "react";
import { AudioButton } from "./AudioButton";

export type MascotMood =
  | "greeting"
  | "thinking"
  | "cheering"
  | "encouraging"
  | "celebrating"
  | "sleepy";

interface MascotProps {
  mood?: MascotMood;
  speech?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const Mascot: React.FC<MascotProps> = ({
  mood = "greeting",
  speech,
  size = "md",
  className = "",
}) => {
  const sizeMap = {
    sm: "w-16 h-16 text-3xl",
    md: "w-28 h-28 text-6xl",
    lg: "w-40 h-40 text-8xl",
  };

  // SVGs / characters representing the friendly mascot "Mitra" (the wise friendly owl)
  const renderMascotEmoji = () => {
    switch (mood) {
      case "cheering":
        return "🦉✨";
      case "celebrating":
        return "🦉🎉";
      case "encouraging":
        return "🦉💛";
      case "thinking":
        return "🦉💭";
      case "sleepy":
        return "🦉💤";
      case "greeting":
      default:
        return "🦉👋";
    }
  };

  return (
    <div className={`flex flex-col sm:flex-row items-center gap-3 ${className}`}>
      {/* Animated Avatar Container */}
      <div
        className={`flex items-center justify-center rounded-3xl bg-gradient-to-tr from-purple-200 via-indigo-100 to-pink-100 shadow-md border-2 border-purple-300 p-2 select-none animate-soft-bounce ${sizeMap[size]}`}
      >
        <span role="img" aria-label={`Mitra the mascot is ${mood}`}>
          {renderMascotEmoji()}
        </span>
      </div>

      {/* Optional Speech Bubble */}
      {speech && (
        <div className="relative max-w-sm sm:max-w-md bg-white border-2 border-purple-200 rounded-3xl p-4 shadow-md text-slate-800">
          {/* Arrow */}
          <div className="hidden sm:block absolute -left-2.5 top-6 w-4 h-4 bg-white border-l-2 border-b-2 border-purple-200 transform rotate-45" />
          
          <div className="flex items-center justify-between gap-3">
            <p className="text-lg font-bold text-slate-800 leading-snug">{speech}</p>
            <AudioButton text={speech} size="sm" />
          </div>
        </div>
      )}
    </div>
  );
};
