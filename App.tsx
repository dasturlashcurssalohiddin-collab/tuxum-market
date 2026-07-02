import { useState, useEffect } from "react";
import { 
  ShoppingBag, MapPin, Layers, Phone, HelpCircle, Shield,
  Globe, Sun, Moon, ArrowRight, BookOpen, ChevronRight, Check, Send
} from "lucide-react";
import { Post, Settings } from "./types";
import { UI_TRANSLATIONS, LANGUAGES_50 } from "./utils/languages";
import LanguageSelector from "./components/LanguageSelector";
import ThemeToggle from "./components/ThemeToggle";
import AudioReader from "./components/AudioReader";
import OrderForm from "./components/OrderForm";
import AdminDashboard from "./components/AdminDashboard";

export default function App() {
  const [currentLang, setCurrentLang] = useState("uz");
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      if (saved) return saved === "dark";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  // Server-fetched states
  const [stock, setStock] = useState(250);
  const [price, setPrice] = useState(8000);
  const [posts, setPosts] = useState<Post[]>([]);
  const [translatedPosts, setTranslatedPosts] = useState<Record<string, Post>>({});
  const [isTranslatingPost, setIsTranslatingPost] = useState<Record<string, boolean>>({});
  const [settings, setSettings] = useState<Settings>({
    phone: "+998 95 100 01 30",
    telegramBot: "txum_bot",
    telegramChannel: "salohiddinTm",
    pickupAddress: "Farg'ona shahri, Sayilgoh ko'chasi, 15-uy",
    pickupLat: "40.3842",
    pickupLng: "71.7748",
    deliveryPricePerKm: 10000
  });

  // UI state
  const [showAdmin, setShowAdmin] = useState(false);
  const [toast, setToast] = useState<{ message: string; bg: string } | null>(null);

  // Load state on mount
  useEffect(() => {
    fetchData();
  }, []);

  // Sync dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const fetchData = async () => {
    try {
      const response = await fetch("/api/data");
      if (response.ok) {
        const data = await response.json();
        setStock(data.stock);
        setPrice(data.price);
        setPosts(data.posts);
        setSettings(data.settings);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    }
  };

  const showToast = (message: string, bg: string = "bg-amber-500 text-stone-950") => {
    setToast({ message, bg });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // UI Localization helper
  const t = (key: string): string => {
    const primaryLangs = ["uz", "uz-cyr", "ru", "en"];
    // If current language is in our primary list, use its translation
    if (primaryLangs.includes(currentLang) && UI_TRANSLATIONS[currentLang]?.[key]) {
      return UI_TRANSLATIONS[currentLang][key];
    }
    // Fallback to English for UI labels when a remote 50-language option is selected
    return UI_TRANSLATIONS["en"]?.[key] || UI_TRANSLATIONS["uz"]?.[key] || key;
  };

  // Dynamic Gemini translation for posts
  const handleTranslatePost = async (post: Post) => {
    const cacheKey = `${post.id}-${currentLang}`;
    if (translatedPosts[cacheKey]) return; // Already translated

    setIsTranslatingPost(prev => ({ ...prev, [post.id]: true }));

    try {
      const targetLangName = LANGUAGES_50.find(l => l.code === currentLang)?.name || currentLang;
      
      // Translate Title
      const resTitle = await fetch("/api/translate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: post.title, targetLang: targetLangName })
      });
      const dataTitle = await resTitle.json();

      // Translate Content
      const resContent = await fetch("/api/translate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: post.content, targetLang: targetLangName })
      });
      const dataContent = await resContent.json();

      if (resTitle.ok && resContent.ok) {
        const translated: Post = {
          ...post,
          title: dataTitle.translatedText,
          content: dataContent.translatedText
        };
        setTranslatedPosts(prev => ({ ...prev, [cacheKey]: translated }));
      }
    } catch (err) {
      console.error("Post translation failed:", err);
      showToast("Tarjimada xatolik yuz berdi", "bg-rose-500 text-white");
    } finally {
      setIsTranslatingPost(prev => ({ ...prev, [post.id]: false }));
    }
  };

  // Trigger translation when current language changes (if currentLang is not primary)
  useEffect(() => {
    const isPrimary = ["uz", "uz-cyr", "ru", "en"].includes(currentLang);
    if (!isPrimary && posts.length > 0) {
      posts.forEach(post => {
        handleTranslatePost(post);
      });
    }
  }, [currentLang, posts]);

  const getLocalizedPost = (post: Post): Post => {
    const cacheKey = `${post.id}-${currentLang}`;
    if (translatedPosts[cacheKey]) {
      return translatedPosts[cacheKey];
    }
    return post;
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-850 dark:text-stone-150 font-sans transition-colors duration-300 selection:bg-amber-500/20 antialiased">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3.5 rounded-2xl shadow-xl font-bold text-sm border border-amber-500/10 z-[10000] animate-in slide-in-from-bottom duration-300 flex items-center gap-2 backdrop-blur-md ${toast.bg}`}>
          <span>{toast.message}</span>
        </div>
      )}

      {/* ADMIN PANEL PORTAL */}
      {showAdmin && (
        <AdminDashboard
          onClose={() => {
            setShowAdmin(false);
            fetchData(); // reload updated stock/price
          }}
          showToast={showToast}
          t={t}
        />
      )}

      {/* HEADER NAVBAR */}
      <header className="sticky top-0 z-40 w-full border-b border-amber-900/5 dark:border-amber-100/5 bg-stone-50/80 dark:bg-stone-950/80 backdrop-blur-md transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-18 flex items-center justify-between">
          <a href="#" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <span className="text-2xl">🥚</span>
            <span className="font-serif text-lg font-black tracking-tight bg-gradient-to-r from-amber-700 to-amber-500 dark:from-amber-400 dark:to-amber-200 bg-clip-text text-transparent">
              {t("brandName")}
            </span>
          </a>

          {/* Nav Links Desktop */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400">
            <a href="#order" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
              {t("btnOrder")}
            </a>
            <a href="#pickup" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
              {t("btnPickup")}
            </a>
            <a href="#delivery" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
              {t("deliveryTitle")}
            </a>
            <a href="#posts" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
              {t("postsSectionTitle")}
            </a>
            <a href="#contact" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
              {t("contactTitle")}
            </a>
          </nav>

          {/* Controls: Language, Theme, Admin */}
          <div className="flex items-center gap-2">
            <LanguageSelector currentLang={currentLang} onLanguageChange={setCurrentLang} />
            <ThemeToggle darkMode={darkMode} onThemeChange={setDarkMode} t={t} />
            <button
              id="header-admin-btn"
              onClick={() => setShowAdmin(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-500/10 dark:bg-amber-400/5 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-stone-950 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
              title="Admin Panel"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Admin</span>
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden py-16 md:py-24 border-b border-amber-900/5 dark:border-amber-100/5 bg-gradient-to-b from-amber-500/[0.03] to-transparent">
        <div className="max-w-6xl mx-auto px-4 md:px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 dark:bg-amber-400/5 border border-amber-500/10 text-amber-700 dark:text-amber-300 text-[11px] font-bold tracking-wider uppercase">
              {t("heroBadge")}
            </div>
            
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-black text-stone-950 dark:text-white leading-none tracking-tight">
              {t("heroTitle")}<br />
              <span className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 dark:from-amber-400 dark:via-amber-300 dark:to-yellow-400 bg-clip-text text-transparent">
                {t("heroTitleSpan")}
              </span>
            </h1>

            <p className="text-base sm:text-lg text-stone-500 dark:text-stone-400 leading-relaxed max-w-lg mx-auto lg:mx-0">
              {t("heroDesc")}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-850 shadow-sm flex items-center gap-3.5 min-w-[180px]">
                <span className="text-3xl">🩵</span>
                <div className="text-left">
                  <div className="text-2xl font-serif font-black text-amber-500">{stock}</div>
                  <div className="text-[10px] uppercase font-bold text-stone-400">{t("availableEggs")}</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-850 shadow-sm flex items-center gap-3.5 min-w-[180px]">
                <span className="text-3xl">🪙</span>
                <div className="text-left">
                  <div className="text-2xl font-serif font-black text-stone-900 dark:text-white">
                    {price.toLocaleString("uz-UZ")}
                  </div>
                  <div className="text-[10px] uppercase font-bold text-stone-400">{t("pricePerEgg")}</div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-4">
              <a href="#order" className="px-7 py-3.5 rounded-2xl bg-amber-500 text-stone-950 hover:bg-amber-600 dark:bg-amber-400 dark:hover:bg-amber-500 text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200 select-none flex items-center gap-2">
                {t("btnOrder")}
                <ArrowRight className="h-4 w-4" />
              </a>
              <a href="#pickup" className="px-7 py-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-900 text-sm font-bold transition-all duration-200">
                {t("btnPickup")}
              </a>
            </div>
          </div>

          {/* Premium Illustration / Generated image */}
          <div className="lg:col-span-6 relative flex justify-center">
            <div className="absolute inset-0 bg-amber-500/10 dark:bg-amber-400/5 rounded-[40px] blur-3xl -z-10 rotate-12"></div>
            <div className="rounded-[32px] overflow-hidden border border-amber-900/10 dark:border-amber-100/10 shadow-2xl hover:scale-[1.01] transition-transform duration-300">
              <img
                src="/src/assets/images/uheyiluy_eggs_1782482690316.jpg"
                alt="Uheyiluy premium blue eggs"
                referrerPolicy="no-referrer"
                className="w-full max-w-[500px] aspect-[16/9] object-cover block"
              />
            </div>
            
            {/* Overlay badge to represent black chicken / green eggs organic source */}
            <div className="absolute -bottom-4 right-4 sm:right-8 bg-stone-900 text-amber-400 dark:bg-amber-400 dark:text-stone-950 p-3 rounded-2xl shadow-lg border border-amber-400/20 flex items-center gap-2 max-w-[200px] text-left">
              <span className="text-xl">🐔</span>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">Uheyiluy Zoti</div>
                <div className="text-xs font-black font-serif">100% Tabiiy Tovuqlar</div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* STATS BENTO GRID */}
      <section className="bg-amber-500 py-10 text-stone-950 transition-colors">
        <div className="max-w-6xl mx-auto px-4 md:px-6 grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <div className="font-serif text-3xl md:text-4xl font-black">10+</div>
            <div className="text-xs font-bold uppercase tracking-wider opacity-80">{t("statsHenTitle")}</div>
            <div className="text-[10px] opacity-60">{t("statsHenDesc")}</div>
          </div>
          <div className="space-y-1 border-l border-stone-950/15">
            <div className="font-serif text-3xl md:text-4xl font-black">{price.toLocaleString("uz-UZ")}</div>
            <div className="text-xs font-bold uppercase tracking-wider opacity-80">{t("pricePerEgg")}</div>
            <div className="text-[10px] opacity-60">Sifatga munosib</div>
          </div>
          <div className="space-y-1 border-l border-stone-950/15">
            <div className="font-serif text-3xl md:text-4xl font-black">24/7</div>
            <div className="text-xs font-bold uppercase tracking-wider opacity-80">{t("statsDeliveryTitle")}</div>
            <div className="text-[10px] opacity-60">{t("statsDeliveryDesc")}</div>
          </div>
          <div className="space-y-1 border-l border-stone-950/15">
            <div className="font-serif text-3xl md:text-4xl font-black">{stock}</div>
            <div className="text-xs font-bold uppercase tracking-wider opacity-80">{t("statsStockTitle")}</div>
            <div className="text-[10px] opacity-60">{t("statsStockDesc")}</div>
          </div>
        </div>
      </section>

      {/* BENEFITS / WHY CHOOSE US */}
      <section className="py-20 max-w-6xl mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <h2 className="font-serif text-3xl md:text-4xl font-black text-stone-950 dark:text-white">
            {t("whyUsTitle")}
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {t("whyUsSub")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-white dark:bg-stone-900 rounded-3xl border border-stone-250/50 dark:border-stone-850 hover:border-amber-500/20 dark:hover:border-amber-400/20 hover:scale-[1.01] transition-all duration-300 text-center space-y-4">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xl">
              🐔
            </div>
            <h3 className="font-serif font-bold text-stone-900 dark:text-white text-base">
              {t("featHenTitle")}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              {t("featHenDesc")}
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-stone-900 rounded-3xl border border-stone-250/50 dark:border-stone-850 hover:border-amber-500/20 dark:hover:border-amber-400/20 hover:scale-[1.01] transition-all duration-300 text-center space-y-4">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xl">
              🩵
            </div>
            <h3 className="font-serif font-bold text-stone-900 dark:text-white text-base">
              {t("featColorTitle")}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              {t("featColorDesc")}
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-stone-900 rounded-3xl border border-stone-250/50 dark:border-stone-850 hover:border-amber-500/20 dark:hover:border-amber-400/20 hover:scale-[1.01] transition-all duration-300 text-center space-y-4">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xl">
              🚗
            </div>
            <h3 className="font-serif font-bold text-stone-900 dark:text-white text-base">
              {t("featFastTitle")}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              {t("featFastDesc")}
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-stone-900 rounded-3xl border border-stone-250/50 dark:border-stone-850 hover:border-amber-500/20 dark:hover:border-amber-400/20 hover:scale-[1.01] transition-all duration-300 text-center space-y-4">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xl">
              💰
            </div>
            <h3 className="font-serif font-bold text-stone-900 dark:text-white text-base">
              {t("featPriceTitle")}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
              {t("featPriceDesc")}
            </p>
          </div>
        </div>
      </section>

      {/* DYNAMIC INFORMATION POSTS SECTION (WITH DYNAMIC SPEECH AUDIO / TRANSLATION) */}
      <section id="posts" className="py-20 bg-stone-100 dark:bg-stone-900/30 transition-colors">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <h2 className="font-serif text-3xl md:text-4xl font-black text-stone-900 dark:text-white flex items-center justify-center gap-2">
              <BookOpen className="h-7 w-7 text-amber-500" />
              {t("postsSectionTitle")}
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              {t("postsSectionSub")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {posts.length === 0 ? (
              <div className="col-span-2 text-center text-stone-400 py-10">
                Ma'lumotlar yuklanmoqda...
              </div>
            ) : (
              posts.map((post) => {
                const isTranslating = isTranslatingPost[post.id];
                const displayPost = getLocalizedPost(post);
                const isTranslated = displayPost.title !== post.title;

                return (
                  <div
                    key={post.id}
                    className="flex flex-col justify-between p-6 md:p-8 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/40 dark:border-stone-850 shadow-sm hover:shadow-md transition-all duration-200 text-left relative group overflow-hidden"
                  >
                    <div className="space-y-4">
                      {/* Translation Status Badge */}
                      {isTranslating ? (
                        <span className="inline-flex items-center text-[10px] font-bold text-amber-500 animate-pulse">
                          🌐 Tarjima qilinmoqda...
                        </span>
                      ) : isTranslated ? (
                        <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          ✨ Gemini tarjimasi ({LANGUAGES_50.find(l => l.code === currentLang)?.nativeName})
                        </span>
                      ) : null}

                      <h3 className="font-serif text-xl font-bold text-stone-900 dark:text-white leading-tight">
                        {displayPost.title}
                      </h3>
                      
                      <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                        {displayPost.content}
                      </p>
                    </div>

                    {/* Integrated TTS Audio Cassette Widget */}
                    <div className="pt-6 mt-6 border-t border-stone-100 dark:border-stone-850">
                      <AudioReader
                        title={displayPost.title}
                        content={displayPost.content}
                        langCode={currentLang}
                        t={t}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* ORDER SECTION FORM */}
      <section id="order" className="py-20 max-w-4xl mx-auto px-4 md:px-6">
        <OrderForm
          stock={stock}
          price={price}
          t={t}
          onOrderSuccess={(newStock) => setStock(newStock)}
          showToast={showToast}
        />
      </section>

      {/* SELF PICKUP MANZILI SECTION */}
      <section id="pickup" className="py-20 bg-stone-100 dark:bg-stone-900/30 transition-colors">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <h2 className="font-serif text-3xl md:text-4xl font-black text-stone-950 dark:text-white">
              {t("pickupTitle")}
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              {t("pickupSub")}
            </p>
          </div>

          <div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 md:p-6 shadow-md grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            {/* Pickup Interactive Google Map */}
            <div className="lg:col-span-7 h-80 rounded-2xl overflow-hidden border border-amber-500/10">
              <iframe
                title="Do'kon xaritasi"
                src={`https://maps.google.com/maps?q=${settings.pickupLat},${settings.pickupLng}&z=17&output=embed`}
                className="w-full h-full border-none"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer"
              ></iframe>
            </div>

            {/* Address specifics and actions */}
            <div className="lg:col-span-5 space-y-6 text-left">
              <div className="space-y-3">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block">
                  {t("pickupCardTitle")}
                </span>
                <p className="text-base font-serif font-black text-stone-950 dark:text-white">
                  {settings.pickupAddress}
                </p>
                <div className="text-xs text-stone-500">
                  Koordinatalar: <span className="font-mono text-amber-600 dark:text-amber-400">{settings.pickupLat}, {settings.pickupLng}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={`tel:${settings.phone}`}
                  className="px-5 py-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-xs flex items-center gap-2 shadow-sm"
                >
                  <Phone className="h-4 w-4" />
                  {t("btnCall")}
                </a>
                <a
                  href={`https://maps.google.com/?q=${settings.pickupLat},${settings.pickupLng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-bold text-xs flex items-center gap-2 shadow-sm"
                >
                  <MapPin className="h-4 w-4" />
                  {t("btnGmaps")}
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* DELIVERY PROGRESS STEPS */}
      <section id="delivery" className="py-20 max-w-6xl mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <h2 className="font-serif text-3xl md:text-4xl font-black text-stone-950 dark:text-white">
            {t("deliveryTitle")}
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {t("deliverySub")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/60 dark:border-stone-850 flex items-start gap-4 text-left shadow-sm">
            <span className="h-8 w-8 rounded-full bg-amber-500 text-stone-950 font-bold text-sm flex items-center justify-center shrink-0">1</span>
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-stone-900 dark:text-white">{t("delStep1Title")}</h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">{t("delStep1Desc")}</p>
            </div>
          </div>

          <div className="p-6 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/60 dark:border-stone-850 flex items-start gap-4 text-left shadow-sm">
            <span className="h-8 w-8 rounded-full bg-amber-500 text-stone-950 font-bold text-sm flex items-center justify-center shrink-0">2</span>
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-stone-900 dark:text-white">{t("delStep2Title")}</h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">{t("delStep2Desc")}</p>
            </div>
          </div>

          <div className="p-6 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/60 dark:border-stone-850 flex items-start gap-4 text-left shadow-sm">
            <span className="h-8 w-8 rounded-full bg-amber-500 text-stone-950 font-bold text-sm flex items-center justify-center shrink-0">3</span>
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-stone-900 dark:text-white">{t("delStep3Title")}</h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">{t("delStep3Desc")}</p>
            </div>
          </div>

          <div className="p-6 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/60 dark:border-stone-850 flex items-start gap-4 text-left shadow-sm">
            <span className="h-8 w-8 rounded-full bg-amber-500 text-stone-950 font-bold text-sm flex items-center justify-center shrink-0">4</span>
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-stone-900 dark:text-white">{t("delStep4Title")}</h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">{t("delStep4Desc")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT segment */}
      <section id="contact" className="py-20 bg-stone-100 dark:bg-stone-900/30 transition-colors">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <h2 className="font-serif text-3xl md:text-4xl font-black text-stone-950 dark:text-white">
              {t("contactTitle")}
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              {t("contactSub")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <a
              href={`https://t.me/${settings.telegramChannel}`}
              target="_blank"
              rel="noreferrer"
              className="p-6 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/60 dark:border-stone-850 hover:border-amber-500/20 text-center space-y-2 hover:scale-[1.01] transition-all cursor-pointer shadow-sm group"
            >
              <div className="inline-flex items-center justify-center h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                ✈️
              </div>
              <h4 className="font-bold text-sm text-stone-900 dark:text-white">{t("contactTg")}</h4>
              <p className="text-xs text-stone-400 font-mono">@{settings.telegramChannel}</p>
            </a>

            <a
              href={`https://t.me/${settings.telegramBot}`}
              target="_blank"
              rel="noreferrer"
              className="p-6 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/60 dark:border-stone-850 hover:border-amber-500/20 text-center space-y-2 hover:scale-[1.01] transition-all cursor-pointer shadow-sm group"
            >
              <div className="inline-flex items-center justify-center h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                🤖
              </div>
              <h4 className="font-bold text-sm text-stone-900 dark:text-white">{t("contactBot")}</h4>
              <p className="text-xs text-stone-400 font-mono">@{settings.telegramBot}</p>
            </a>

            <a
              href={`tel:${settings.phone}`}
              className="p-6 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/60 dark:border-stone-850 hover:border-amber-500/20 text-center space-y-2 hover:scale-[1.01] transition-all cursor-pointer shadow-sm group"
            >
              <div className="inline-flex items-center justify-center h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                📞
              </div>
              <h4 className="font-bold text-sm text-stone-900 dark:text-white">{t("contactPhone")}</h4>
              <p className="text-xs text-stone-400 font-mono">{settings.phone}</p>
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-stone-950 text-stone-500 text-xs py-12 text-center border-t border-stone-900">
        <div className="max-w-6xl mx-auto px-4 md:px-6 space-y-4">
          <div className="flex justify-center items-center gap-2">
            <span className="text-2xl">🥚</span>
            <span className="font-serif text-base font-black text-amber-400 tracking-tight">
              {t("brandName")}
            </span>
          </div>
          <p>{t("footerText")}</p>
          <div className="pt-2 flex items-center justify-center gap-4 text-[11px]">
            <button
              onClick={() => setShowAdmin(true)}
              className="hover:text-amber-400 transition-colors font-semibold cursor-pointer"
            >
              ⚙ {t("adminLink")}
            </button>
            <span className="text-stone-800">|</span>
            <span className="text-stone-600">Farg'ona, O'zbekiston</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
