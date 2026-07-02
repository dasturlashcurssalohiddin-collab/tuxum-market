import React, { useState, useEffect } from "react";
import { 
  Lock, Settings as SettingsIcon, Plus, Trash2, Edit2, 
  CheckCircle, Clock, ShoppingBag, DollarSign, LogOut, Check, Save, Layers
} from "lucide-react";
import { Order, Post, Settings } from "../types";

interface AdminDashboardProps {
  onClose: () => void;
  showToast: (msg: string, bg?: string) => void;
  t: (key: string) => string;
}

export default function AdminDashboard({ onClose, showToast, t }: AdminDashboardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Loaded Admin data
  const [orders, setOrders] = useState<Order[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stock, setStock] = useState(0);
  const [price, setPrice] = useState(0);
  const [settings, setSettings] = useState<Settings>({
    phone: "",
    telegramBot: "",
    telegramChannel: "",
    pickupAddress: "",
    pickupLat: "",
    pickupLng: "",
    deliveryPricePerKm: 10000
  });

  // Active view tab: 'orders' | 'posts' | 'settings' | 'stock'
  const [activeTab, setActiveTab] = useState<"orders" | "posts" | "settings">("orders");

  // Form states for creating/editing posts
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  // Settings form states
  const [formPhone, setFormPhone] = useState("");
  const [formBot, setFormBot] = useState("");
  const [formChannel, setFormChannel] = useState("");
  const [formPickup, setFormPickup] = useState("");
  const [formLat, setFormLat] = useState("");
  const [formLng, setFormLng] = useState("");
  const [formDeliveryPrice, setFormDeliveryPrice] = useState(10000);

  // Temp local Stock / Price inputs
  const [tempStock, setTempStock] = useState("");
  const [tempPrice, setTempPrice] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setIsLoggingIn(true);

    try {
      const response = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setIsAuthenticated(true);
        loadFullAdminData();
        showToast("✅ Tizimga muvaffaqiyatli kirildi!", "bg-emerald-600");
      } else {
        showToast(data.error || "Noto'g'ri parol!", "bg-rose-500");
      }
    } catch (err) {
      showToast("Tizimda xatolik yuz berdi", "bg-rose-500");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const loadFullAdminData = async () => {
    try {
      const response = await fetch("/api/admin/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const resData = await response.json();

      if (response.ok && resData.success) {
        const d = resData.data;
        setOrders(d.orders);
        setPosts(d.posts);
        setStock(d.stock);
        setPrice(d.price);
        setTempStock(String(d.stock));
        setTempPrice(String(d.price));
        
        const s = d.settings;
        setSettings(s);
        setFormPhone(s.phone);
        setFormBot(s.telegramBot);
        setFormChannel(s.telegramChannel);
        setFormPickup(s.pickupAddress);
        setFormLat(s.pickupLat);
        setFormLng(s.pickupLng);
        setFormDeliveryPrice(s.deliveryPricePerKm);
      }
    } catch (err) {
      showToast("Ma'lumot yuklashda xatolik", "bg-rose-500");
    }
  };

  // Update order status
  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order["status"]) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, status: newStatus }),
      });
      const resData = await response.json();

      if (response.ok && resData.success) {
        setOrders(resData.orders);
        setStock(resData.stock);
        setTempStock(String(resData.stock));
        showToast("✅ Buyurtma holati o'zgartirildi!");
      } else {
        showToast(resData.error || "Xatolik", "bg-rose-500");
      }
    } catch (err) {
      showToast("Bog'lanish xatosi", "bg-rose-500");
    }
  };

  // Delete Order
  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm("Rostdan ham ushbu buyurtmani o'chirmoqchimisiz?")) return;
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const resData = await response.json();

      if (response.ok && resData.success) {
        setOrders(resData.orders);
        showToast("🗑️ Buyurtma o'chirildi", "bg-stone-800");
      }
    } catch (err) {
      showToast("Xatolik", "bg-rose-500");
    }
  };

  // Update stock & price
  const handleUpdateStockPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    const stNum = Number(tempStock);
    const prNum = Number(tempPrice);
    if (isNaN(stNum) || isNaN(prNum)) {
      showToast("Narx va miqdor son bo'lishi kerak", "bg-rose-500");
      return;
    }

    try {
      const response = await fetch("/api/admin/stock-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, stock: stNum, price: prNum }),
      });
      const resData = await response.json();

      if (response.ok && resData.success) {
        setStock(resData.stock);
        setPrice(resData.price);
        showToast("✅ Zaxira va narx yangilandi!");
      }
    } catch (err) {
      showToast("Yangilashda xatolik", "bg-rose-500");
    }
  };

  // Save Post (Create / Edit)
  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) {
      showToast("Sarlavha va kontent bo'sh bo'lishi mumkin emas", "bg-rose-500");
      return;
    }

    try {
      const endpoint = editingPostId ? `/api/admin/posts/${editingPostId}/edit` : "/api/admin/posts";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, title: postTitle.trim(), content: postContent.trim() }),
      });
      const resData = await response.json();

      if (response.ok && resData.success) {
        setPosts(resData.posts);
        setPostTitle("");
        setPostContent("");
        setEditingPostId(null);
        showToast(editingPostId ? "✅ Ma'lumot tahrirlandi!" : "✅ Yangi ma'lumot yuklandi!");
      }
    } catch (err) {
      showToast("Saqlashda xatolik", "bg-rose-500");
    }
  };

  // Edit Post button handler
  const triggerEditPost = (post: Post) => {
    setEditingPostId(post.id);
    setPostTitle(post.title);
    setPostContent(post.content);
    window.scrollTo({ top: 350, behavior: "smooth" });
  };

  // Delete Post
  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("Ushbu foydali ma'lumotni o'chirmoqchimisiz?")) return;
    try {
      const response = await fetch(`/api/admin/posts/${postId}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const resData = await response.json();

      if (response.ok && resData.success) {
        setPosts(resData.posts);
        showToast("🗑️ Ma'lumot o'chirildi", "bg-stone-800");
      }
    } catch (err) {
      showToast("O'chirishda xatolik", "bg-rose-500");
    }
  };

  // Save system settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      phone: formPhone.trim(),
      telegramBot: formBot.trim(),
      telegramChannel: formChannel.trim(),
      pickupAddress: formPickup.trim(),
      pickupLat: formLat.trim(),
      pickupLng: formLng.trim(),
      deliveryPricePerKm: Number(formDeliveryPrice)
    };

    try {
      const response = await fetch("/api/admin/settings/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, settings: payload }),
      });
      const resData = await response.json();

      if (response.ok && resData.success) {
        setSettings(resData.settings);
        showToast("✅ Sozlamalar muvaffaqiyatli saqlandi!");
      }
    } catch (err) {
      showToast("Saqlashda xatolik", "bg-rose-500");
    }
  };

  // Calculate statistics
  const totalOrders = orders.length;
  const newOrdersCount = orders.filter(o => o.status === "yangi").length;
  const totalRevenue = orders
    .filter(o => o.status === "yetkazildi" || o.status === "tasdiqlandi")
    .reduce((acc, curr) => acc + curr.total, 0);

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-stone-950/90 flex items-center justify-center p-4 z-[9999] backdrop-blur-md animate-in fade-in duration-300">
        <div className="w-full max-w-md bg-white dark:bg-stone-900 rounded-3xl p-6 md:p-8 border border-amber-900/10 dark:border-amber-100/10 shadow-2xl">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-amber-500/10 dark:bg-amber-400/5 text-amber-500">
              <Lock className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-serif font-bold text-stone-900 dark:text-white">Admin Panelga kirish</h2>
              <p className="text-xs text-stone-400 mt-1">Uheyiluy Tuxum bozori boshqaruv tizimi</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4 text-left pt-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider">
                  Admin Paroli
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Boshqaruv parolini kiriting..."
                  className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-2xl text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400 text-sm"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-850 rounded-2xl text-xs font-semibold text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
                >
                  Yopish
                </button>
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 dark:bg-amber-400 dark:hover:bg-amber-500 text-stone-950 rounded-2xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  {isLoggingIn ? "Kirilmoqda..." : "Kirish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-stone-950/60 dark:bg-stone-950/85 z-[9999] backdrop-blur-md overflow-y-auto p-4 md:p-6 animate-in fade-in duration-300">
      <div className="w-full max-w-6xl mx-auto bg-stone-50 dark:bg-stone-900/95 rounded-3xl shadow-2xl border border-amber-900/10 dark:border-amber-100/10 overflow-hidden mt-2 mb-8">
        
        {/* Header */}
        <div className="bg-stone-900 p-5 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-amber-500/10">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-amber-500 flex items-center justify-center font-bold text-lg text-stone-950 shadow-md">
              🥚
            </div>
            <div className="text-left">
              <h2 className="text-lg font-serif font-bold text-white">Tuxum Market Boshqaruv Paneli</h2>
              <span className="text-[11px] text-amber-400 font-mono tracking-wider uppercase">Tizim Faol</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsAuthenticated(false);
                setPassword("");
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Chiqish
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-sm"
            >
              Paneldan chiqish
            </button>
          </div>
        </div>

        {/* Dashboard Grid stats */}
        <div className="p-4 md:p-6 grid grid-cols-2 lg:grid-cols-4 gap-4 bg-stone-100 dark:bg-stone-950/40">
          {/* Stat 1 */}
          <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/50 dark:border-stone-850 flex items-center gap-3 shadow-sm">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div className="text-left">
              <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Jami buyurtmalar</div>
              <div className="text-lg font-bold font-serif text-stone-950 dark:text-white">{totalOrders} ta</div>
            </div>
          </div>

          {/* Stat 2 */}
          <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/50 dark:border-stone-850 flex items-center gap-3 shadow-sm">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center animate-pulse">
              <Clock className="h-5 w-5" />
            </div>
            <div className="text-left">
              <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Yangi buyurtmalar</div>
              <div className="text-lg font-bold font-serif text-amber-600 dark:text-amber-400">{newOrdersCount} ta</div>
            </div>
          </div>

          {/* Stat 3 */}
          <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/50 dark:border-stone-850 flex items-center gap-3 shadow-sm">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="h-5 w-5" />
            </div>
            <div className="text-left">
              <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Tasdiqlangan tushum</div>
              <div className="text-base font-bold font-serif text-emerald-600 dark:text-emerald-400">
                {totalRevenue.toLocaleString("uz-UZ")} so'm
              </div>
            </div>
          </div>

          {/* Stat 4 */}
          <div className="bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200/50 dark:border-stone-850 flex items-center gap-3 shadow-sm">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              🥚
            </div>
            <div className="text-left">
              <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400">Zaxiradagi tuxum</div>
              <div className="text-lg font-bold font-serif text-purple-600 dark:text-purple-400">{stock} dona</div>
            </div>
          </div>
        </div>

        {/* Workspace body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 md:p-6">
          {/* Tab buttons */}
          <div className="lg:col-span-3 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
            <button
              onClick={() => setActiveTab("orders")}
              className={`flex-1 lg:flex-none flex items-center justify-center lg:justify-start gap-2 px-4 py-3 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === "orders"
                  ? "bg-stone-900 text-amber-400 dark:bg-amber-400 dark:text-stone-950"
                  : "bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-850 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              Buyurtmalar ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab("posts")}
              className={`flex-1 lg:flex-none flex items-center justify-center lg:justify-start gap-2 px-4 py-3 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === "posts"
                  ? "bg-stone-900 text-amber-400 dark:bg-amber-400 dark:text-stone-950"
                  : "bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-850 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
              }`}
            >
              <Layers className="h-4 w-4" />
              Foydali Ma'lumotlar / CRUD ({posts.length})
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex-1 lg:flex-none flex items-center justify-center lg:justify-start gap-2 px-4 py-3 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === "settings"
                  ? "bg-stone-900 text-amber-400 dark:bg-amber-400 dark:text-stone-950"
                  : "bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-850 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
              }`}
            >
              <SettingsIcon className="h-4 w-4" />
              Tizim Sozlamalari
            </button>

            {/* Quick stock and price manager directly inside sidebar on desktop */}
            <div className="hidden lg:block mt-6 p-4 rounded-2xl border border-amber-900/10 dark:border-amber-100/5 bg-amber-500/[0.02] dark:bg-stone-950/40 space-y-4">
              <div className="text-xs font-bold uppercase tracking-wider text-stone-500">Narx & Zaxira Boshqaruvi</div>
              <form onSubmit={handleUpdateStockPrice} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-500 uppercase">Zaxira (dona)</label>
                  <input
                    type="number"
                    value={tempStock}
                    onChange={(e) => setTempStock(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-500 uppercase">Narx (so'm / dona)</label>
                  <input
                    type="number"
                    value={tempPrice}
                    onChange={(e) => setTempPrice(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg text-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-amber-500 text-stone-950 dark:bg-amber-400 hover:bg-amber-600 font-bold rounded-xl text-xs cursor-pointer transition-colors"
                >
                  Saqlash
                </button>
              </form>
            </div>
          </div>

          {/* Main Workspace content */}
          <div className="lg:col-span-9 space-y-6">
            
            {/* ORDERS TAB */}
            {activeTab === "orders" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2">
                  <h3 className="text-base font-serif font-bold text-stone-900 dark:text-white">Buyurtmalar ro'yxati</h3>
                  <span className="text-[11px] text-stone-500">{orders.length} ta jami</span>
                </div>

                <div className="block lg:hidden mt-2 p-4 rounded-xl border border-amber-500/15 bg-amber-500/[0.02] space-y-3 text-left">
                  <h4 className="text-xs font-bold text-stone-700 dark:text-stone-300">Zaxira va Narx (Tezkor o'zgartirish)</h4>
                  <form onSubmit={handleUpdateStockPrice} className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      placeholder="Zaxira"
                      value={tempStock}
                      onChange={(e) => setTempStock(e.target.value)}
                      className="px-2.5 py-1.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg text-xs"
                    />
                    <input
                      type="number"
                      placeholder="Narx"
                      value={tempPrice}
                      onChange={(e) => setTempPrice(e.target.value)}
                      className="px-2.5 py-1.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg text-xs"
                    />
                    <button type="submit" className="col-span-2 py-1.5 bg-amber-500 text-stone-950 font-bold rounded-lg text-xs cursor-pointer">
                      Tasdiqlash
                    </button>
                  </form>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-stone-100 dark:bg-stone-900 text-stone-500 font-bold border-b border-stone-200 dark:border-stone-800">
                        <th className="p-3">Mijoz / Telefon</th>
                        <th className="p-3">Manzil</th>
                        <th className="p-3 text-center">Soni</th>
                        <th className="p-3 text-right">To'lov</th>
                        <th className="p-3 text-center">Holat</th>
                        <th className="p-3 text-center">Amal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-850">
                      {orders.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-stone-400">
                            Buyurtmalar mavjud emas
                          </td>
                        </tr>
                      ) : (
                        orders.map((order) => {
                          const isNew = order.status === "yangi";
                          return (
                            <tr key={order.id} className="hover:bg-amber-50/10 dark:hover:bg-stone-900/40 transition-colors">
                              <td className="p-3 space-y-0.5 text-left">
                                <div className="font-bold text-stone-900 dark:text-white flex items-center gap-1">
                                  {order.name}
                                  {isNew && (
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping"></span>
                                  )}
                                </div>
                                <a href={`tel:${order.phone}`} className="text-stone-400 dark:text-stone-500 hover:text-amber-500 hover:underline">
                                  {order.phone}
                                </a>
                                <div className="text-[10px] text-stone-400">
                                  {new Date(order.createdAt).toLocaleDateString("uz-UZ")} {new Date(order.createdAt).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
                                </div>
                              </td>
                              <td className="p-3 max-w-[200px] truncate text-stone-600 dark:text-stone-300 text-left" title={order.address}>
                                {order.address}
                              </td>
                              <td className="p-3 text-center font-bold font-mono text-stone-900 dark:text-stone-200">
                                {order.qty}
                              </td>
                              <td className="p-3 text-right font-bold text-stone-950 dark:text-white">
                                {order.total.toLocaleString("uz-UZ")} so'm
                              </td>
                              <td className="p-3 text-center">
                                <select
                                  value={order.status}
                                  onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as Order["status"])}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border focus:outline-none focus:ring-1 ${
                                    order.status === "yangi"
                                      ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                                      : order.status === "tasdiqlandi"
                                      ? "bg-blue-500/10 text-blue-600 border-blue-500/30"
                                      : order.status === "yetkazildi"
                                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                      : "bg-stone-500/10 text-stone-600 border-stone-500/30"
                                  }`}
                                >
                                  <option value="yangi">🟡 Yangi</option>
                                  <option value="tasdiqlandi">🔵 Tasdiqlash</option>
                                  <option value="yetkazildi">🟢 Yetkazildi</option>
                                  <option value="bekor">🔴 Bekor qilindi</option>
                                </select>
                              </td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => handleDeleteOrder(order.id)}
                                  className="p-1 text-stone-400 hover:text-rose-600 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                                  title="O'chirish"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* FOYDALI MA'LUMOTLAR TAB */}
            {activeTab === "posts" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2">
                  <h3 className="text-base font-serif font-bold text-stone-900 dark:text-white">
                    {editingPostId ? "Ma'lumotni tahrirlash" : "Yangi foydali ma'lumot joylash"}
                  </h3>
                  {editingPostId && (
                    <button
                      onClick={() => {
                        setEditingPostId(null);
                        setPostTitle("");
                        setPostContent("");
                      }}
                      className="text-xs text-stone-500 hover:text-amber-500 underline cursor-pointer"
                    >
                      Bekor qilish
                    </button>
                  )}
                </div>

                <form onSubmit={handleSavePost} className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-850 p-4 rounded-2xl space-y-4">
                  <div className="space-y-1 text-left">
                    <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                      Maqola sarlavhasi / Title (Masalan: Uheyiluy tuxumi xususiyatlari)
                    </label>
                    <input
                      type="text"
                      required
                      value={postTitle}
                      onChange={(e) => setPostTitle(e.target.value)}
                      placeholder="Mavzuni kiriting..."
                      className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                      Maqola matni / Details (Shifobaxsh afzalliklari, foydali tavsiyalar)
                    </label>
                    <textarea
                      rows={5}
                      required
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                      placeholder="Batafsil ma'lumot matnini yozing..."
                      className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-stone-900 dark:bg-amber-400 text-amber-400 dark:text-stone-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 hover:opacity-90 cursor-pointer"
                  >
                    <Save className="h-4 w-4" />
                    {editingPostId ? "Ma'lumotni saqlash" : "Foydali Ma'lumot Joylash"}
                  </button>
                </form>

                {/* Published lists */}
                <div className="space-y-4">
                  <h4 className="font-serif font-bold text-stone-900 dark:text-white border-b border-stone-200 dark:border-stone-800 pb-2 text-left">
                    Siz tomondan joylangan maqolalar ({posts.length})
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {posts.length === 0 ? (
                      <div className="col-span-2 text-center text-stone-400 py-6">
                        Hali hech qanday maqola yuklanmagan.
                      </div>
                    ) : (
                      posts.map((post) => (
                        <div key={post.id} className="bg-white dark:bg-stone-950 p-4 rounded-2xl border border-stone-200 dark:border-stone-850 flex flex-col justify-between shadow-sm hover:border-amber-500/20 transition-all text-left">
                          <div>
                            <h5 className="font-serif font-bold text-stone-950 dark:text-white text-sm leading-tight mb-2">
                              {post.title}
                            </h5>
                            <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-4 leading-relaxed">
                              {post.content}
                            </p>
                          </div>
                          
                          <div className="flex items-center justify-between border-t border-stone-100 dark:border-stone-850 pt-3 mt-4">
                            <span className="text-[10px] text-stone-400 font-mono">
                              {new Date(post.createdAt).toLocaleDateString("uz-UZ")}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => triggerEditPost(post)}
                                className="p-1.5 bg-stone-50 dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:text-amber-500 rounded-lg transition-colors cursor-pointer"
                                title="Tahrirlash"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeletePost(post.id)}
                                className="p-1.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 hover:text-rose-700 rounded-lg transition-colors cursor-pointer"
                                title="O'chirish"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* SYSTEM SETTINGS TAB */}
            {activeTab === "settings" && (
              <div className="space-y-4">
                <div className="border-b border-stone-200 dark:border-stone-800 pb-2 text-left">
                  <h3 className="text-base font-serif font-bold text-stone-900 dark:text-white">Tizim va Kontakt Sozlamalari</h3>
                  <span className="text-[11px] text-stone-400">Botlar va xaritadagi do'kon nuqtangizni boshqarish</span>
                </div>

                <form onSubmit={handleSaveSettings} className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-850 p-6 rounded-2xl space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Phone */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-bold text-stone-500 uppercase block">Telefon raqamimiz</label>
                      <input
                        type="text"
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        className="w-full px-3 py-2.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-xl text-xs focus:ring-1"
                      />
                    </div>

                    {/* Bot name */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-bold text-stone-500 uppercase block">Telegram Botimiz (masalan: txum_bot)</label>
                      <input
                        type="text"
                        value={formBot}
                        onChange={(e) => setFormBot(e.target.value)}
                        className="w-full px-3 py-2.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-xl text-xs focus:ring-1"
                      />
                    </div>

                    {/* Telegram channel */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-bold text-stone-500 uppercase block">Telegram Lichka / Kanal (masalan: salohiddinTm)</label>
                      <input
                        type="text"
                        value={formChannel}
                        onChange={(e) => setFormChannel(e.target.value)}
                        className="w-full px-3 py-2.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-xl text-xs focus:ring-1"
                      />
                    </div>

                    {/* Delivery price */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-bold text-stone-500 uppercase block">Yetkazish narxi (1 km uchun so'm)</label>
                      <input
                        type="number"
                        value={formDeliveryPrice}
                        onChange={(e) => setFormDeliveryPrice(Number(e.target.value))}
                        className="w-full px-3 py-2.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-xl text-xs focus:ring-1"
                      />
                    </div>
                  </div>

                  {/* Pickup Address */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold text-stone-500 uppercase block">Olib ketish manzili (Uzbekcha matn)</label>
                    <input
                      type="text"
                      value={formPickup}
                      onChange={(e) => setFormPickup(e.target.value)}
                      className="w-full px-3 py-2.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-xl text-xs"
                    />
                  </div>

                  {/* Geolocation */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-bold text-stone-500 uppercase block">Olib ketish koordinatasi Lat</label>
                      <input
                        type="text"
                        value={formLat}
                        onChange={(e) => setFormLat(e.target.value)}
                        placeholder="40.3842"
                        className="w-full px-3 py-2.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-xl text-xs"
                      />
                    </div>
                    <div className="space-y-1.5 text-left">
                      <label className="text-[10px] font-bold text-stone-500 uppercase block">Olib ketish koordinatasi Lng</label>
                      <input
                        type="text"
                        value={formLng}
                        onChange={(e) => setFormLng(e.target.value)}
                        placeholder="71.7748"
                        className="w-full px-3 py-2.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-850 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-amber-500 text-stone-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 hover:bg-amber-600 transition-colors cursor-pointer"
                  >
                    <Check className="h-4 w-4" />
                    Sozlamalarni Saqlash
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
