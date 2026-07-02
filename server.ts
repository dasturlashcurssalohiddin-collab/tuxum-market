import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Data file path
  const DATA_DIR = path.join(process.cwd(), "data");
  const DATA_FILE = path.join(DATA_DIR, "db.json");

  // Ensure data folder and file exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
  }

  // Seed data
  const defaultData = {
    stock: 250,
    price: 8000,
    orders: [
      {
        id: "ord-1",
        name: "Salohiddin",
        phone: "+998 95 100 01 30",
        address: "Farg'ona sh., Mustaqillik ko'chasi, 12-uy",
        qty: 30,
        total: 240000,
        status: "tasdiqlandi",
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(), // 4 hours ago
      },
      {
        id: "ord-2",
        name: "Zuhra opa",
        phone: "+998 90 555 12 34",
        address: "Marg'ilon sh., Buyuk Ipak Yo'li ko'chasi",
        qty: 15,
        total: 120000,
        status: "yangi",
        createdAt: new Date().toISOString(),
      }
    ],
    posts: [
      {
        id: "post-1",
        title: "Uheyiluy (Wu Hei Yi Lu) tuxumlarining shifobaxsh sirlari",
        content: "Uheyiluy tovuqlari o'zining qora terisi, qora suyaklari va go'shti bilan ajralib turadi. Ularning tuxumlari esa tabiat mo'jizasi bo'lib, och yashil-moviy rangda bo'ladi. Bu tuxumlar tarkibida oddiy tuxumlarga qaraganda selen, rux va aminokislotalar miqdori 5-10 baravar ko'p, xolesterin miqdori esa juda past. Yosh bolalar xotirasini kuchaytirishda va keksalar qon bosimini mo'tadillashtirishda juda foydali.",
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: "post-2",
        title: "Tabiiy va Toza Oziqlantirish - Bizning Ustuvorligimiz",
        content: "Tuxumlarimiz sifati tovuqlarimizning parvarishiga bevosita bog'liq. Bizning Uheyiluy tovuqlarimiz Farg'onaning toza havoli hududida erkin yayrab yuradi va faqat tabiiy don, ko'katlar va toza suv bilan oziqlanadi. Hech qanday sun'iy o'sish gormonlari yoki kimyoviy qo'shimchalar ishlatilmaydi. Shuning uchun ham tuxumlarimiz 100% tabiiy va shifobaxshdir.",
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      }
    ],
    settings: {
      password: "admin",
      phone: "+998 95 100 01 30",
      telegramBot: "txum_bot",
      telegramChannel: "salohiddinTm",
      pickupAddress: "Farg'ona shahri, Sayilgoh ko'chasi, 15-uy",
      pickupLat: "40.3842",
      pickupLng: "71.7748",
      deliveryPricePerKm: 10000
    }
  };

  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2), "utf-8");
  }

  // Read helper
  const readDb = () => {
    try {
      return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    } catch (e) {
      return defaultData;
    }
  };

  // Write helper
  const writeDb = (data: any) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  };

  // API: Get all data
  app.get("/api/data", (req, res) => {
    const db = readDb();
    const { password, ...publicSettings } = db.settings;
    res.json({
      stock: db.stock,
      price: db.price,
      posts: db.posts,
      settings: publicSettings,
    });
  });

  // API: Login admin
  app.post("/api/admin/auth", (req, res) => {
    const { password } = req.body;
    const db = readDb();
    if (password === db.settings.password) {
      res.json({ success: true, settings: db.settings, orders: db.orders });
    } else {
      res.status(401).json({ success: false, error: "Noto'g'ri parol!" });
    }
  });

  // API: Admin load data (requires password verify)
  app.post("/api/admin/data", (req, res) => {
    const { password } = req.body;
    const db = readDb();
    if (password === db.settings.password) {
      res.json({ success: true, data: db });
    } else {
      res.status(401).json({ success: false, error: "Ruxsat berilmadi" });
    }
  });

  // API: Save new order
  app.post("/api/order", (req, res) => {
    const { name, phone, address, qty } = req.body;
    if (!name || !phone || !address || !qty) {
      return res.status(400).json({ error: "Ma'lumotlar to'liq emas" });
    }

    const db = readDb();
    if (db.stock < qty) {
      return res.status(400).json({ error: `Kechirasiz, zaxirada yetarli tuxum yo'q. Hozirda ${db.stock} ta mavjud.` });
    }

    const orderId = "ord-" + Math.random().toString(36).substring(2, 9);
    const total = qty * db.price;

    const newOrder = {
      id: orderId,
      name,
      phone,
      address,
      qty,
      total,
      status: "yangi",
      createdAt: new Date().toISOString(),
    };

    db.orders.unshift(newOrder);
    db.stock = Math.max(0, db.stock - qty);
    writeDb(db);

    res.json({ success: true, order: newOrder, currentStock: db.stock });
  });

  // API: Admin update order status
  app.post("/api/admin/orders/:id/status", (req, res) => {
    const { id } = req.params;
    const { password, status } = req.body;
    const db = readDb();

    if (password !== db.settings.password) {
      return res.status(401).json({ error: "Ruxsat berilmadi" });
    }

    const orderIndex = db.orders.findIndex((o: any) => o.id === id);
    if (orderIndex === -1) {
      return res.status(404).json({ error: "Buyurtma topilmadi" });
    }

    const oldStatus = db.orders[orderIndex].status;
    db.orders[orderIndex].status = status;

    if (status === "bekor" && oldStatus !== "bekor") {
      db.stock += db.orders[orderIndex].qty;
    } else if (oldStatus === "bekor" && status !== "bekor") {
      db.stock = Math.max(0, db.stock - db.orders[orderIndex].qty);
    }

    writeDb(db);
    res.json({ success: true, orders: db.orders, stock: db.stock });
  });

  // API: Admin delete order
  app.post("/api/admin/orders/:id/delete", (req, res) => {
    const { id } = req.params;
    const { password } = req.body;
    const db = readDb();

    if (password !== db.settings.password) {
      return res.status(401).json({ error: "Ruxsat berilmadi" });
    }

    db.orders = db.orders.filter((o: any) => o.id !== id);
    writeDb(db);
    res.json({ success: true, orders: db.orders });
  });

  // API: Admin update stock & price
  app.post("/api/admin/stock-price", (req, res) => {
    const { password, stock, price } = req.body;
    const db = readDb();

    if (password !== db.settings.password) {
      return res.status(401).json({ error: "Ruxsat berilmadi" });
    }

    db.stock = Number(stock);
    db.price = Number(price);
    writeDb(db);
    res.json({ success: true, stock: db.stock, price: db.price });
  });

  // API: Admin posts CRUD
  app.post("/api/admin/posts", (req, res) => {
    const { password, title, content } = req.body;
    const db = readDb();

    if (password !== db.settings.password) {
      return res.status(401).json({ error: "Ruxsat berilmadi" });
    }

    const newPost = {
      id: "post-" + Math.random().toString(36).substring(2, 9),
      title,
      content,
      createdAt: new Date().toISOString()
    };

    db.posts.unshift(newPost);
    writeDb(db);
    res.json({ success: true, posts: db.posts });
  });

  app.post("/api/admin/posts/:id/edit", (req, res) => {
    const { id } = req.params;
    const { password, title, content } = req.body;
    const db = readDb();

    if (password !== db.settings.password) {
      return res.status(401).json({ error: "Ruxsat berilmadi" });
    }

    const postIndex = db.posts.findIndex((p: any) => p.id === id);
    if (postIndex === -1) {
      return res.status(404).json({ error: "Ma'lumot topilmadi" });
    }

    db.posts[postIndex].title = title;
    db.posts[postIndex].content = content;
    writeDb(db);
    res.json({ success: true, posts: db.posts });
  });

  app.post("/api/admin/posts/:id/delete", (req, res) => {
    const { id } = req.params;
    const { password } = req.body;
    const db = readDb();

    if (password !== db.settings.password) {
      return res.status(401).json({ error: "Ruxsat berilmadi" });
    }

    db.posts = db.posts.filter((p: any) => p.id !== id);
    writeDb(db);
    res.json({ success: true, posts: db.posts });
  });

  // API: Admin save settings
  app.post("/api/admin/settings/save", (req, res) => {
    const { password, settings } = req.body;
    const db = readDb();

    if (password !== db.settings.password) {
      return res.status(401).json({ error: "Ruxsat berilmadi" });
    }

    db.settings = {
      ...db.settings,
      ...settings,
    };
    writeDb(db);
    res.json({ success: true, settings: db.settings });
  });

  // API: Translate post text via Gemini
  app.post("/api/translate-post", async (req, res) => {
    const { text, targetLang } = req.body;
    if (!text || !targetLang) {
      return res.status(400).json({ error: "Text and targetLang are required" });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY || GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
      return res.json({ translatedText: text + ` (Translated to ${targetLang} - fallback)` });
    }

    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      const prompt = `Translate the following Uzbek/Russian text about healthy organic Uheyiluy eggs into ${targetLang}. Keep the exact factual benefits and warm tone. Do not add metadata, just return the exact translated text. Text to translate:\n\n${text}`;
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });
      
      const translatedText = response.text?.trim() || text;
      res.json({ translatedText });
    } catch (error: any) {
      console.error("Gemini translation error:", error);
      res.status(500).json({ error: "Tarjimada xatolik yuz berdi" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
