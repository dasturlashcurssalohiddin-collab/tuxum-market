import { useState, useEffect, useRef } from "react";
import { Play, Pause, Square, Volume2, FastForward } from "lucide-react";

interface AudioReaderProps {
  title: string;
  content: string;
  langCode: string;
  t: (key: string) => string;
}

export default function AudioReader({ title, content, langCode, t }: AudioReaderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(1); // Speech rate: 0.8, 1, 1.2, 1.5

  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      stopAudio();
    };
  }, []);

  const startAudio = () => {
    if (!synthRef.current) return;

    // Stop current speech
    synthRef.current.cancel();

    // Text to read: title + content
    const textToRead = `${t("ttsIntro")} ${title}. ${t("ttsBody")} ${content}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utteranceRef.current = utterance;

    // Set voice based on language
    const voices = synthRef.current.getVoices();
    let voiceToUse = null;

    // Match best voice
    if (langCode === "uz" || langCode === "uz-cyr") {
      // Often Uzbek voices are rare natively, we search for Turkish, Russian or local voices as backup
      voiceToUse = voices.find(v => v.lang.startsWith("tr") || v.lang.startsWith("uz") || v.lang.startsWith("ru"));
    } else if (langCode === "ru") {
      voiceToUse = voices.find(v => v.lang.startsWith("ru"));
    } else {
      voiceToUse = voices.find(v => v.lang.startsWith("en"));
    }

    if (voiceToUse) {
      utterance.voice = voiceToUse;
    }

    // Set language
    utterance.lang = langCode === "uz-cyr" ? "uz-UZ" : langCode;
    utterance.rate = speed;
    utterance.pitch = 1.05; // Slightly warmer/friendly pitch

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    synthRef.current.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const pauseAudio = () => {
    if (synthRef.current && isPlaying && !isPaused) {
      synthRef.current.pause();
      setIsPaused(true);
    }
  };

  const resumeAudio = () => {
    if (synthRef.current && isPlaying && isPaused) {
      synthRef.current.resume();
      setIsPaused(false);
    }
  };

  const stopAudio = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsPlaying(false);
      setIsPaused(false);
    }
  };

  const cycleSpeed = () => {
    const nextSpeeds = [0.8, 1.0, 1.25, 1.5, 1.75];
    const currentIndex = nextSpeeds.indexOf(speed);
    const nextIndex = (currentIndex + 1) % nextSpeeds.length;
    const newSpeed = nextSpeeds[nextIndex];
    setSpeed(newSpeed);

    if (isPlaying) {
      // Re-trigger with new speed
      const wasPaused = isPaused;
      startAudio();
      if (wasPaused && synthRef.current) {
        synthRef.current.pause();
        setIsPaused(true);
      }
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3.5 p-3.5 rounded-2xl border border-amber-500/10 bg-amber-50/40 dark:bg-stone-850/40 transition-all duration-300">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400">
          <Volume2 className={`h-4.5 w-4.5 ${isPlaying && !isPaused ? "animate-bounce" : ""}`} />
        </div>
        <span className="text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wider">
          {t("btnReadAloud")}
        </span>
      </div>

      <div className="flex items-center gap-2.5">
        {!isPlaying ? (
          <button
            onClick={startAudio}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-xl bg-amber-500 text-stone-950 hover:bg-amber-600 dark:bg-amber-400 dark:hover:bg-amber-500 transition-colors cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
          >
            <Play className="h-3 w-3 fill-current" />
            {t("btnReadAloud")}
          </button>
        ) : (
          <>
            {isPaused ? (
              <button
                onClick={resumeAudio}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-500/30 transition-colors cursor-pointer"
              >
                <Play className="h-3 w-3 fill-current" />
                {t("btnResume")}
              </button>
            ) : (
              <button
                onClick={pauseAudio}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-stone-500/20 text-stone-700 dark:text-stone-300 hover:bg-stone-500/30 transition-colors cursor-pointer"
              >
                <Pause className="h-3 w-3" />
                {t("btnPause")}
              </button>
            )}

            <button
              onClick={stopAudio}
              className="flex items-center justify-center h-8 w-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
            >
              <Square className="h-3 w-3 fill-current" />
            </button>
          </>
        )}

        <button
          onClick={cycleSpeed}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl border border-amber-900/10 dark:border-amber-100/10 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          title="Ovoz tezligi / Speech speed"
        >
          <FastForward className="h-3 w-3" />
          <span>{speed.toFixed(1)}x</span>
        </button>
      </div>

      {isPlaying && !isPaused && (
        <div className="flex items-end gap-1 h-3.5 py-0.5 ml-auto">
          <div className="w-1 bg-amber-500 dark:bg-amber-400 rounded-full animate-[sound_0.7s_infinite_ease-in-out_alternate]"></div>
          <div className="w-1 bg-amber-600 dark:bg-amber-300 rounded-full animate-[sound_0.5s_infinite_ease-in-out_alternate_delay-100]"></div>
          <div className="w-1 bg-amber-400 dark:bg-amber-500 rounded-full animate-[sound_0.8s_infinite_ease-in-out_alternate_delay-300]"></div>
          <div className="w-1 bg-amber-500 dark:bg-amber-200 rounded-full animate-[sound_0.6s_infinite_ease-in-out_alternate_delay-200]"></div>
        </div>
      )}
    </div>
  );
}
