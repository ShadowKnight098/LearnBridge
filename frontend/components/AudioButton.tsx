"use client";

import React from "react";
import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { useSpeech, TTSLanguage } from "../lib/tts";
import { useTranslation } from "../lib/i18n";

interface AudioButtonProps {
  text: string;
  lang?: TTSLanguage;
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}

export const AudioButton: React.FC<AudioButtonProps> = ({
  text,
  lang,
  size = "md",
  className = "",
  label,
}) => {
  const { language } = useTranslation();
  const { isPlaying, speak, stop, supported } = useSpeech();
  const activeLang = (lang || language) as TTSLanguage;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) {
      stop();
    } else {
      speak(text, activeLang);
    }
  };

  const sizeClasses = {
    sm: "p-1.5 text-xs",
    md: "p-2.5 text-sm",
    lg: "p-4 text-base",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  if (!supported) return null;

  return (
    <button
      onClick={handleClick}
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-full font-bold transition-all shadow-sm active:scale-95 ${
        isPlaying
          ? "bg-amber-400 text-amber-950 ring-4 ring-amber-200 animate-pulse"
          : "bg-purple-100 text-purple-700 hover:bg-purple-200 hover:text-purple-900 border border-purple-200"
      } ${sizeClasses[size]} ${className}`}
      title={label || "Listen to text"}
      aria-label={label || "Listen to text"}
    >
      {isPlaying ? (
        <Volume2 className={`${iconSizes[size]} animate-bounce`} />
      ) : (
        <Volume2 className={iconSizes[size]} />
      )}
      {label && <span>{label}</span>}
    </button>
  );
};
