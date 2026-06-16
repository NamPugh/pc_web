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
  slug: string;
  price: number;
  oldPrice?: number;
  discount?: number;
  stock: number;
  category?: Category;
  brand?: Brand;
  images?: string[];
  shortDescription?: string;
  description?: string;
  productType: ProductType;
  specs?: Record<string, unknown>;
  isFeatured?: boolean;
  isDeal?: boolean;
  ratingAverage?: number;
  ratingCount?: number;
  sold?: number;
  status?: "active" | "inactive" | "out_of_stock";
};

export type CartItem = {
  product: Product;
  quantity: number;
  price: number;
};

export type Cart = {
  _id: string;
  user: string;
  items: CartItem[];
  totalPrice: number;
};

export type Order = {
  _id: string;
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
  createdAt: string;
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
