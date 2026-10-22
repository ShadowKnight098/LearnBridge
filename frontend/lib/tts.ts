"use client";

import { useState, useEffect, useCallback } from "react";

export type TTSLanguage = "te" | "hi" | "en";

const LANG_MAP: Record<TTSLanguage, string[]> = {
  te: ["te-IN", "te"],
  hi: ["hi-IN", "hi"],
  en: ["en-IN", "en-US", "en-GB", "en"],
};

export class TTSService {
  private static instance: TTSService;
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private currentAudio: HTMLAudioElement | null = null;

  private constructor() {
    if (typeof window !== "undefined") {
      if ("speechSynthesis" in window) {
        this.synth = window.speechSynthesis;
        this.loadVoices();
        if (this.synth.onvoiceschanged !== undefined) {
          this.synth.onvoiceschanged = () => this.loadVoices();
        }
      }
    }
  }

  public static getInstance(): TTSService {
    if (!TTSService.instance) {
      TTSService.instance = new TTSService();
    }
    return TTSService.instance;
  }

  private loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
  }

  public isSupported(): boolean {
    return typeof window !== "undefined";
  }

  public speak(
    text: string,
    lang: TTSLanguage = "en",
    onEnd?: () => void,
    onError?: (err: any) => void
  ): boolean {
    if (!text || !text.trim()) return false;

    // Stop any ongoing speech or audio playback
    this.stop();

    const cleanText = text.replace(/<[^>]*>?/gm, "").trim();
    const targetLangs = LANG_MAP[lang] || ["en-US"];

    // Reload voices in case browser populated them asynchronously
    if (this.synth && this.voices.length === 0) {
      this.loadVoices();
    }

    // Check if the local browser has a voice for this language
    let matchingVoice: SpeechSynthesisVoice | undefined;
    if (this.voices.length > 0) {
      matchingVoice = this.voices.find((v) =>
        targetLangs.some((l) => v.lang.toLowerCase() === l.toLowerCase())
      );

      if (!matchingVoice) {
        matchingVoice = this.voices.find((v) =>
          targetLangs.some((l) => v.lang.toLowerCase().startsWith(l.slice(0, 2).toLowerCase()))
        );
      }
    }

    // If a matching native voice exists in the browser, use Web Speech API
    if (this.synth && matchingVoice) {
      try {
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.voice = matchingVoice;
        utterance.lang = matchingVoice.lang;
        utterance.rate = 0.9;
        utterance.pitch = 1.05;

        utterance.onend = () => {
          if (onEnd) onEnd();
        };

        utterance.onerror = (e) => {
          console.warn("Native TTS error, attempting fallback audio stream:", e);
          this.fallbackAudioSpeak(cleanText, lang, onEnd, onError);
        };

        this.synth.speak(utterance);
        return true;
      } catch (e) {
        console.warn("Synth speak failed, using fallback audio:", e);
        return this.fallbackAudioSpeak(cleanText, lang, onEnd, onError);
      }
    }

    // Otherwise (e.g. Windows without regional speech pack), use high-fidelity Web Audio TTS fallback
    return this.fallbackAudioSpeak(cleanText, lang, onEnd, onError);
  }

  private fallbackAudioSpeak(
    text: string,
    lang: TTSLanguage,
    onEnd?: () => void,
    onError?: (err: any) => void
  ): boolean {
    if (typeof window === "undefined") return false;

    try {
      const targetLang = lang === "te" ? "te" : lang === "hi" ? "hi" : "en";
      const encodedText = encodeURIComponent(text.slice(0, 250));
      // Primary: Same-origin Next.js audio route handler
      const audioUrl = `/api/tts?lang=${targetLang}&text=${encodedText}`;

      const audio = new Audio(audioUrl);
      this.currentAudio = audio;

      audio.onended = () => {
        this.currentAudio = null;
        if (onEnd) onEnd();
      };

      audio.onerror = (err) => {
        console.warn("Primary /api/tts failed, trying backend /tts fallback:", err);
        // Fallback to FastAPI backend route
        const backendUrl = `http://localhost:8000/tts?lang=${targetLang}&text=${encodedText}`;
        const fallbackAudio = new Audio(backendUrl);
        this.currentAudio = fallbackAudio;

        fallbackAudio.onended = () => {
          this.currentAudio = null;
          if (onEnd) onEnd();
        };

        fallbackAudio.onerror = (fErr) => {
          console.warn("All audio TTS streams failed:", fErr);
          this.currentAudio = null;
          if (onError) onError(fErr);
          if (onEnd) onEnd();
        };

        fallbackAudio.play().catch((playErr) => {
          this.currentAudio = null;
          if (onError) onError(playErr);
          if (onEnd) onEnd();
        });
      };

      audio.play().catch((err) => {
        console.warn("Audio autoplay policy or playback issue:", err);
        this.currentAudio = null;
        if (onError) onError(err);
        if (onEnd) onEnd();
      });

      return true;
    } catch (err) {
      if (onError) onError(err);
      if (onEnd) onEnd();
      return false;
    }
  }

  public stop() {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {}
    }
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.currentAudio = null;
      } catch {}
    }
  }
}

export function useSpeech() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    const tts = TTSService.getInstance();
    setSupported(tts.isSupported());
  }, []);

  const speak = useCallback((text: string, lang: TTSLanguage = "en") => {
    const tts = TTSService.getInstance();
    setIsPlaying(true);
    const started = tts.speak(
      text,
      lang,
      () => setIsPlaying(false),
      () => setIsPlaying(false)
    );
    if (!started) setIsPlaying(false);
  }, []);

  const stop = useCallback(() => {
    const tts = TTSService.getInstance();
    tts.stop();
    setIsPlaying(false);
  }, []);

  return { isPlaying, supported, speak, stop };
}
