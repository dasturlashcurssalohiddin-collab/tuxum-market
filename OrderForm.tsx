import React, { useState, useEffect } from "react";
import { User, Phone, MapPin, Search, Check, AlertTriangle, Minus, Plus } from "lucide-react";

interface OrderFormProps {
  stock: number;
  price: number;
  t: (key: string) => string;
  onOrderSuccess: (newStock: number) => void;
  showToast: (msg: string, bg?: string) => void;
}

export default function OrderForm({ stock, price, t, onOrderSuccess, showToast }: OrderFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [qty, setQty] = useState(10); // Standard order is usually 10-30 eggs
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapSearch, setMapSearch] = useState("");
  const [mapIframeUrl, setMapIframeUrl] = useState(
    "https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d24000!2d71.7748!3d40.3842!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1suz!2suz!4v1"
  );
  const [confirmedMapAddress, setConfirmedMapAddress] = useState("");

  useEffect(() => {
    // Keep qty within stock limit
    if (stock > 0 && qty > stock) {
      setQty(stock);
    }
  }, [stock]);

  const changeQty = (delta: number) => {
    if (stock <= 0) return;
    const newQty = Math.min(stock, Math.max(1, qty + delta));
    setQty(newQty);
  };

  const handleSearchOnMap = () => {
    if (!mapSearch.trim()) return;
    const query = encodeURIComponent(mapSearch + ", Farg'ona, O'zbekiston");
    const embedUrl = `https://maps.google.com/maps?q=${query}&output=embed&z=16`;
    setMapIframeUrl(embedUrl);
    setAddress(mapSearch);
  };

  const useMapAddress = () => {
    const finalAddress = mapSearch.trim() || address.trim();
    if (!finalAddress) {
      showToast(t("toastError"), "bg-rose-500");
      return;
    }
    setAddress(finalAddress);
    setConfirmedMapAddress(finalAddress);
    setShowMap(false);
    showToast("✅ Manzil tasdiqlandi!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stock <= 0) return;
    if (!name.trim() || !phone.trim() || !address.trim()) {
      showToast(t("toastError"), "bg-rose-500");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          qty,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast(t("toastSuccess"), "bg-emerald-600");
        onOrderSuccess(data.currentStock);
        // Reset form
        setName("");
        setPhone("");
        setAddress("");
        setConfirmedMapAddress("");
        setQty(Math.min(data.currentStock, 10) || 1);
      } else {
        showToast(data.error || "Xatolik yuz berdi", "bg-rose-500");
      }
    } catch (err) {
      showToast("Tarmoq xatosi yuz berdi", "bg-rose-500");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalCost = qty * price;

  return (
    <div className="rounded-3xl border border-amber-900/5 dark:border-amber-100/5 bg-amber-500/[0.02] dark:bg-stone-900/40 p-6 md:p-8 backdrop-blur-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 h-40 w-40 bg-amber-500/10 dark:bg-amber-400/5 rounded-full blur-3xl -z-10"></div>
      
      <h3 className="font-serif text-2xl font-bold text-stone-900 dark:text-white mb-2">
        {t("orderTitle")}
      </h3>
      <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">
        {t("orderSub")}
      </p>

      {stock === 0 ? (
        <div className="flex items-start gap-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 p-4 text-rose-800 dark:text-rose-300 text-sm mb-6 animate-pulse">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{t("emptyStockMsg")}</span>
        </div>
      ) : stock <= 30 ? (
        <div className="flex items-start gap-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 text-amber-800 dark:text-amber-300 text-sm mb-6">
          <AlertTriangle className="h-5 w-5 shrink-0 animate-bounce" />
          <span>{t("lowStockMsg")} ({stock} {t("statsStockDesc")})</span>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Name input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider block">
              {t("labelName")}
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                type="text"
                required
                disabled={stock === 0}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("placeholderName")}
                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-stone-950/80 border border-stone-200 dark:border-stone-850 rounded-2xl text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 transition-all text-sm disabled:opacity-50"
              />
            </div>
          </div>

          {/* Phone input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider block">
              {t("labelPhone")}
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                type="tel"
                required
                disabled={stock === 0}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t("placeholderPhone")}
                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-stone-950/80 border border-stone-200 dark:border-stone-850 rounded-2xl text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 transition-all text-sm disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Address input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider block">
            {t("labelAddress")}
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                type="text"
                required
                disabled={stock === 0}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t("placeholderAddress")}
                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-stone-950/80 border border-stone-200 dark:border-stone-850 rounded-2xl text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-600 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 transition-all text-sm disabled:opacity-50"
              />
            </div>
            <button
              type="button"
              disabled={stock === 0}
              onClick={() => setShowMap(!showMap)}
              className="px-4 py-3 bg-stone-900 text-amber-400 hover:bg-stone-800 dark:bg-stone-850 dark:hover:bg-stone-800 font-semibold rounded-2xl text-xs transition-colors flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer disabled:opacity-50"
            >
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">{t("btnLocateMap")}</span>
            </button>
          </div>

          {/* Map panel */}
          {showMap && (
            <div className="mt-3 rounded-2xl overflow-hidden border-2 border-amber-500/30 shadow-lg animate-in slide-in-from-top duration-300">
              <div className="relative h-64 w-full bg-stone-100 dark:bg-stone-950">
                <iframe
                  src={mapIframeUrl}
                  className="w-full h-full border-none"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
              <div className="bg-stone-900 p-3 flex gap-2 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
                  <input
                    type="text"
                    value={mapSearch}
                    onChange={(e) => setMapSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearchOnMap()}
                    placeholder={t("gmapSearchPlaceholder")}
                    className="w-full pl-9 pr-3 py-2 bg-stone-800 text-stone-100 border-none rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSearchOnMap}
                  className="px-3 py-2 bg-stone-800 text-stone-300 hover:bg-stone-750 rounded-xl text-xs cursor-pointer font-medium"
                >
                  Qidirish
                </button>
                <button
                  type="button"
                  onClick={useMapAddress}
                  className="px-3.5 py-2 bg-amber-500 text-stone-950 hover:bg-amber-600 font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Check className="h-3.5 w-3.5" />
                  {t("gmapConfirm")}
                </button>
              </div>
            </div>
          )}

          {confirmedMapAddress && (
            <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-pulse">
              <Check className="h-3.5 w-3.5" />
              <span>Manzil tasdiqlandi: {confirmedMapAddress}</span>
            </div>
          )}
        </div>

        {/* Quantity selector */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl border border-stone-200/60 dark:border-stone-850 bg-white/50 dark:bg-stone-950/40">
          <div className="text-left">
            <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
              {t("labelQuantity")}
            </span>
            <span className="text-xs text-stone-400 dark:text-stone-500">
              {t("availableEggs")}: {stock}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              disabled={qty <= 1 || stock === 0}
              onClick={() => changeQty(-1)}
              className="h-10 w-10 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-amber-500 hover:text-stone-950 hover:border-amber-500 dark:hover:bg-amber-400 dark:hover:text-stone-950 dark:hover:border-amber-400 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-stone-700 disabled:hover:border-stone-200 rounded-xl flex items-center justify-center font-bold text-lg cursor-pointer transition-all duration-200"
            >
              <Minus className="h-4.5 w-4.5" />
            </button>
            <span className="text-xl font-bold font-serif text-stone-900 dark:text-white min-w-[36px] text-center">
              {qty}
            </span>
            <button
              type="button"
              disabled={qty >= stock || stock === 0}
              onClick={() => changeQty(1)}
              className="h-10 w-10 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-amber-500 hover:text-stone-950 hover:border-amber-500 dark:hover:bg-amber-400 dark:hover:text-stone-950 dark:hover:border-amber-400 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-stone-700 disabled:hover:border-stone-200 rounded-xl flex items-center justify-center font-bold text-lg cursor-pointer transition-all duration-200"
            >
              <Plus className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        {/* Total Box */}
        <div className="p-4 rounded-2xl bg-stone-900 text-stone-100 flex items-center justify-between shadow-sm">
          <span className="text-sm text-stone-400">{t("totalPayment")}</span>
          <span className="text-xl font-bold font-serif text-amber-400">
            {totalCost.toLocaleString("uz-UZ")} so'm
          </span>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || stock === 0}
          className="w-full py-4 rounded-2xl bg-amber-500 text-stone-950 hover:bg-amber-600 dark:bg-amber-400 dark:hover:bg-amber-500 font-bold shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 text-base select-none hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
        >
          {isSubmitting ? t("btnSubmitting") : t("btnSubmitOrder")}
        </button>
      </form>
    </div>
  );
}
