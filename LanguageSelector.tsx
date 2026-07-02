import { useState } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { LANGUAGES_50, LanguageOption } from "../utils/languages";

interface LanguageSelectorProps {
  currentLang: string;
  onLanguageChange: (code: string) => void;
}

export default function LanguageSelector({ currentLang, onLanguageChange }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedLang = LANGUAGES_50.find((l) => l.code === currentLang) || LANGUAGES_50[0];

  const handleSelect = (code: string) => {
    onLanguageChange(code);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left z-50">
      <div>
        <button
          id="lang-selector-btn"
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex justify-center items-center gap-2 rounded-xl border border-amber-900/10 dark:border-amber-100/10 bg-white/80 dark:bg-stone-900/80 px-3 py-2 text-sm font-medium text-stone-800 dark:text-stone-200 hover:bg-amber-50 dark:hover:bg-stone-800 focus:outline-none transition-all duration-200 shadow-sm backdrop-blur-md"
        >
          <Globe className="h-4 w-4 text-amber-600 dark:text-amber-400 animate-pulse" />
          <span className="max-w-[100px] truncate">{selectedLang.nativeName}</span>
          <ChevronDown className={`h-4 w-4 text-stone-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 max-h-80 overflow-y-auto rounded-2xl bg-white dark:bg-stone-900 shadow-xl border border-amber-900/5 dark:border-amber-100/5 focus:outline-none z-50 animate-in fade-in slide-in-from-top-2 duration-200 scrollbar-thin scrollbar-thumb-amber-200 scrollbar-track-transparent">
            <div className="py-1.5" role="menu">
              <div className="px-3 py-1 text-[11px] font-bold tracking-wider text-amber-600 dark:text-amber-400 uppercase border-b border-amber-900/5 dark:border-amber-100/5 mb-1.5">
                50 Tillar / Languages
              </div>
              {LANGUAGES_50.map((lang: LanguageOption) => {
                const isSelected = lang.code === currentLang;
                return (
                  <button
                    key={lang.code}
                    onClick={() => handleSelect(lang.code)}
                    className={`w-full flex items-center justify-between px-4 py-2 text-left text-sm transition-colors duration-150 ${
                      isSelected
                        ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium"
                        : "text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                    }`}
                    role="menuitem"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-stone-950 dark:text-white">
                        {lang.nativeName}
                      </span>
                      <span className="text-[11px] text-stone-400 dark:text-stone-500">
                        {lang.name}
                      </span>
                    </div>
                    {isSelected && (
                      <Check className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
