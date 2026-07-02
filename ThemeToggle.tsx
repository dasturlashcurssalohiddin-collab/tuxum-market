import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  darkMode: boolean;
  onThemeChange: (dark: boolean) => void;
  t: (key: string) => string;
}

export default function ThemeToggle({ darkMode, onThemeChange, t }: ThemeToggleProps) {
  return (
    <button
      id="theme-toggle-btn"
      onClick={() => onThemeChange(!darkMode)}
      className="inline-flex items-center justify-center p-2.5 rounded-xl border border-amber-900/10 dark:border-amber-100/10 bg-white/80 dark:bg-stone-900/80 text-stone-700 dark:text-stone-300 hover:bg-amber-50 dark:hover:bg-stone-800 transition-all duration-200 shadow-sm backdrop-blur-md"
      title={darkMode ? t("lightMode") : t("darkMode")}
    >
      {darkMode ? (
        <Sun className="h-4.5 w-4.5 text-amber-500 hover:rotate-45 transition-transform duration-300" />
      ) : (
        <Moon className="h-4.5 w-4.5 text-stone-700 hover:-rotate-12 transition-transform duration-300" />
      )}
    </button>
  );
}
