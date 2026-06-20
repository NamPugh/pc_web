export type User = {
  _id: string;
  userName: string;
  email: string;
  phone?: string;
  address?: string;
  role: "user" | "admin";
  avatarUrl?: string;
};

export type Category = {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  isActive?: boolean;
};

export type Banner = {
  _id: string;
  title: string;
  image: string;
  link?: string;
  position?: string;
  isActive?: boolean;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type HomeSection = {
  _id: string;
  title: string;
  keyword?: string;
  bannerImage: string;
  category: Category;
  products: Product[];
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
};

export type SiteSetting = {
  _id?: string;
  phone: string;
  email: string;
  footerTitle: string;
  footerDescription: string;
  showroomAddress: string;
  warrantyAddress: string;
  newsletterTitle: string;
  newsletterDescription: string;
  copyright: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Brand = {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
};

export type ProductType =
  | "cpu"
  | "mainboard"
  | "ram"
  | "ssd"
  | "hdd"
  | "gpu"
  | "psu"
  | "case"
  | "cooler"
  | "monitor"
  | "keyboard"
  | "mouse"
  | "headphone"
  | "laptop"
  | "pc"
  | "other";

export type Product = {
  _id: string;
  name: string;
  sku?: string;
  slug: string;
  price: number;
  oldPrice?: number;
  discount?: number;
  stock: number;
  category?: Category;
  brand?: Brand;
  images?: string[];
  description?: string;
  productType: ProductType;
  specs?: Record<string, unknown>;
  isFeatured?: boolean;
  isDeal?: boolean;
  dealPrice?: number;
  dealStartAt?: string | null;
  dealEndAt?: string | null;
  dealQuantity?: number;
  dealSold?: number;
  ratingAverage?: number;
  ratingCount?: number;
  sold?: number;
  status?: "active" | "inactive" | "out_of_stock";
};

export type FlashSaleItem = {
  _id: string;
  product: Product;
  dealPrice: number;
  quantity: number;
  sold: number;
};

export type FlashSale = {
  _id: string;
  name: string;
  startAt: string;
  endAt: string;
  status: "draft" | "active" | "inactive";
  items: FlashSaleItem[];
  createdAt?: string;
  updatedAt?: string;
};

export type CartItem = {
  product: Product;
  quantity: number;
  price: number;
  flashSale?: string | null;
  flashSaleItem?: string | null;
};

export type Cart = {
  _id: string;
  user: string;
  items: CartItem[];
  totalPrice: number;
};

export type Order = {
  _id: string;
  user?: Pick<User, "_id" | "userName" | "email" | "phone"> | string;
  customerInfo: {
    fullName?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  items: Array<{
    product?: string;
    name: string;
    image?: string;
    price: number;
    quantity: number;
  }>;
  totalPrice: number;
  paymentMethod: "cod" | "banking" | "momo" | "vnpay";
  paymentStatus: "unpaid" | "paid";
  orderStatus: "pending" | "confirmed" | "shipping" | "completed" | "cancelled";
  note?: string;
  createdAt: string;
};

export type OrderStats = {
  totalRevenue: number;
  monthRevenue: number;
  previousMonthRevenue: number;
  monthGrowth: number;
  totalOrders: number;
  monthOrders: number;
  completedOrders: number;
  averageOrderValue: number;
  statusCounts: Record<Order["orderStatus"], number>;
  dailyRevenue: Array<{ date: string; revenue: number; orders: number }>;
  topProducts: Array<{
    product?: string;
    name: string;
    image?: string;
    quantity: number;
    revenue: number;
  }>;
};

export type News = {
  _id: string;
  title: string;
  slug: string;
  thumbnail?: string;
  summary?: string;
  content: string;
  status: "draft" | "published";
  createdAt: string;
};

export type Review = {
  _id: string;
  rating: number;
  comment?: string;
  images?: string[];
  user?: Pick<User, "_id" | "userName" | "avatarUrl">;
  createdAt: string;
};

export type ApiList<T> = {
  success: boolean;
  count: number;
  total?: number;
  currentPage?: number;
  totalPages?: number;
  data: T[];
};

export type ApiItem<T> = {
  success: boolean;
  message?: string;
  data: T;
};
