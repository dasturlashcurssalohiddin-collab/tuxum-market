export interface Order {
  id: string;
  name: string;
  phone: string;
  address: string;
  qty: number;
  total: number;
  status: "yangi" | "tasdiqlandi" | "yetkazildi" | "bekor";
  createdAt: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface Settings {
  phone: string;
  telegramBot: string;
  telegramChannel: string;
  pickupAddress: string;
  pickupLat: string;
  pickupLng: string;
  deliveryPricePerKm: number;
}

export interface FullData {
  stock: number;
  price: number;
  posts: Post[];
  settings: Settings;
}
