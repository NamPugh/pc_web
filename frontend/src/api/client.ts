import axios from "axios";

import type { ApiItem, ApiList, Banner, Brand, Cart, Category, News, Order, OrderStats, Product, ProductType, Review, User } from "@/types";

export const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getErrorMessage(error: unknown) {
  if (axios.isAxiosError<{ message?: string; error?: string }>(error)) {
    return error.response?.data?.message || error.response?.data?.error || error.message;
  }
  return "Có lỗi xảy ra";
}

export const authApi = {
  signIn: (payload: { email: string; password: string }) =>
    api.post<{ message: string; accessToken: string }>("/auth/signin", payload),
  signUp: (payload: { userName: string; email: string; password: string }) => api.post("/auth/signup", payload),
  signOut: () => api.post("/auth/signout"),
  me: () => api.get<{ user: User }>("/users/me"),
};

export const catalogApi = {
  products: (params?: Record<string, string | number | boolean | undefined>) =>
    api.get<ApiList<Product>>("/products", { params }),
  product: (id: string) => api.get<ApiItem<Product>>(`/products/${id}`),
  categories: () => api.get<ApiList<Category>>("/categories"),
  brands: () => api.get<ApiList<Brand>>("/brands"),
  banners: (params?: { position?: string; isActive?: boolean }) => api.get<ApiList<Banner>>("/banners", { params }),
};

export const cartApi = {
  get: () => api.get<ApiItem<Cart>>("/carts"),
  add: (productId: string, quantity = 1) => api.post<ApiItem<Cart>>("/carts/add", { productId, quantity }),
  update: (productId: string, quantity: number) => api.put<ApiItem<Cart>>(`/carts/update/${productId}`, { quantity }),
  remove: (productId: string) => api.delete<ApiItem<Cart>>(`/carts/remove/${productId}`),
  clear: () => api.delete<ApiItem<Cart>>("/carts/clear"),
};

export const orderApi = {
  create: (payload: {
    customerInfo: { fullName: string; phone: string; email: string; address: string };
    paymentMethod: "cod" | "banking" | "momo" | "vnpay";
    note?: string;
  }) => api.post<ApiItem<Order>>("/orders", payload),
  mine: () => api.get<ApiList<Order>>("/orders/my-orders"),
  cancel: (id: string) => api.put<ApiItem<Order>>(`/orders/${id}/cancel`),
};

export const buildPcApi = {
  components: (productType: ProductType) => api.get<ApiList<Product>>(`/build-pc/components/${productType}`),
  save: (payload: { name: string; components: Record<string, { product: string; quantity: number }>; note?: string }) =>
    api.post<ApiItem<unknown>>("/build-pc/save", payload),
  mine: () => api.get<ApiList<unknown>>("/build-pc/my-builds"),
  addToCart: (id: string) => api.post<ApiItem<Cart>>(`/build-pc/${id}/add-to-cart`),
};

export const reviewApi = {
  list: (productId: string) => api.get<ApiList<Review>>(`/reviews/product/${productId}`),
  create: (productId: string, payload: { rating: number; comment: string }) =>
    api.post<ApiItem<Review>>(`/reviews/product/${productId}`, payload),
  remove: (id: string) => api.delete(`/reviews/${id}`),
};

export const newsApi = {
  list: (params?: { status?: string; keyword?: string }) => api.get<ApiList<News>>("/news", { params }),
  bySlug: (slug: string) => api.get<ApiItem<News>>(`/news/slug/${slug}`),
};

export const adminApi = {
  orders: () => api.get<ApiList<Order>>("/orders"),
  orderStats: () => api.get<ApiItem<OrderStats>>("/orders/stats"),
  updateOrder: (
    id: string,
    payload: { orderStatus?: Order["orderStatus"]; paymentStatus?: Order["paymentStatus"] },
  ) => api.put<ApiItem<Order>>(`/orders/${id}/status`, payload),
  createProduct: (payload: Omit<Partial<Product>, "category" | "brand"> & { name: string; price: number; category: string; brand?: string }) =>
    api.post<ApiItem<Product>>("/products", payload),
  updateProduct: (id: string, payload: Partial<Product>) => api.put<ApiItem<Product>>(`/products/${id}`, payload),
  deleteProduct: (id: string) => api.delete(`/products/${id}`),
  createCategory: (payload: { name: string; image?: string }) => api.post<ApiItem<Category>>("/categories", payload),
  createBrand: (payload: { name: string; logo?: string }) => api.post<ApiItem<Brand>>("/brands", payload),
  createBanner: (payload: Omit<Banner, "_id" | "createdAt" | "updatedAt">) =>
    api.post<ApiItem<Banner>>("/banners", payload),
  updateBanner: (id: string, payload: Partial<Omit<Banner, "_id" | "createdAt" | "updatedAt">>) =>
    api.put<ApiItem<Banner>>(`/banners/${id}`, payload),
  deleteBanner: (id: string) => api.delete(`/banners/${id}`),
};
