import axios from "axios";

import type { ApiItem, ApiList, Banner, Brand, Cart, Category, FlashSale, HomeSection, Order, OrderStats, PCBuild, Product, ProductType, Review, SiteSetting, User, UserSummary } from "@/types";

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
  googleSignIn: (credential: string) =>
    api.post<{ message: string; accessToken: string }>("/auth/google", { credential }),
  signOut: () => api.post("/auth/signout"),
  me: () => api.get<{ user: User }>("/users/me"),
  updateProfile: (payload: Pick<User, "userName" | "email"> & Pick<Required<User>, "phone" | "address">) =>
    api.put<{ message: string; user: User }>("/users/me", payload),
};

export const catalogApi = {
  products: (params?: Record<string, string | number | boolean | undefined>) =>
    api.get<ApiList<Product>>("/products", { params }),
  product: (id: string) => api.get<ApiItem<Product>>(`/products/${id}`),
  categories: () => api.get<ApiList<Category>>("/categories"),
  brands: () => api.get<ApiList<Brand>>("/brands"),
  banners: (params?: { position?: string; isActive?: boolean }) => api.get<ApiList<Banner>>("/banners", { params }),
  homeSections: (params?: { isActive?: boolean }) => api.get<ApiList<HomeSection>>("/home-sections", { params }),
};

export const siteSettingApi = {
  get: () => api.get<ApiItem<SiteSetting>>("/site-settings"),
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
    selectedProductIds?: string[];
  }) => api.post<ApiItem<Order> & { cart: Cart; paymentUrl?: string | null }>("/orders", payload),
  mine: () => api.get<ApiList<Order>>("/orders/my-orders"),
  cancel: (id: string) => api.put<ApiItem<Order>>(`/orders/${id}/cancel`),
};

export const paymentApi = {
  vnPayReturn: (params: URLSearchParams) =>
    api.get<ApiItem<Order> & { code: string; message: string }>(`/payments/vnpay/return?${params.toString()}`),
  cancelVnPay: (orderId: string) => api.post(`/payments/vnpay/cancel/${orderId}`),
};

export const buildPcApi = {
  components: (productType: ProductType) => api.get<ApiList<Product>>(`/build-pc/components/${productType}`),
  save: (payload: { name: string; components: Record<string, { product: string; quantity: number }>; note?: string }) =>
    api.post<ApiItem<unknown>>("/build-pc/save", payload),
  mine: () => api.get<ApiList<PCBuild>>("/build-pc/my-builds"),
  addToCart: (id: string) => api.post<ApiItem<Cart>>(`/build-pc/${id}/add-to-cart`),
  remove: (id: string) => api.delete(`/build-pc/${id}`),
};

export const reviewApi = {
  list: (productId: string) => api.get<ApiList<Review>>(`/reviews/product/${productId}`),
  create: (productId: string, payload: { rating: number; comment: string }) =>
    api.post<ApiItem<Review>>(`/reviews/product/${productId}`, payload),
  remove: (id: string) => api.delete(`/reviews/${id}`),
};

export const flashSaleApi = {
  active: () => api.get<ApiItem<FlashSale | null>>("/flash-sales/active"),
  list: () => api.get<ApiList<FlashSale>>("/flash-sales"),
  create: (payload: { name: string; startAt: string; endAt: string; status: FlashSale["status"] }) =>
    api.post<ApiItem<FlashSale>>("/flash-sales", payload),
  update: (id: string, payload: Partial<Pick<FlashSale, "name" | "startAt" | "endAt" | "status">>) =>
    api.put<ApiItem<FlashSale>>(`/flash-sales/${id}`, payload),
  remove: (id: string) => api.delete(`/flash-sales/${id}`),
  addItem: (id: string, payload: { productId: string; dealPrice: number; quantity: number }) =>
    api.post<ApiItem<FlashSale>>(`/flash-sales/${id}/items`, payload),
  updateItem: (id: string, itemId: string, payload: { dealPrice?: number; quantity?: number }) =>
    api.put<ApiItem<FlashSale>>(`/flash-sales/${id}/items/${itemId}`, payload),
  removeItem: (id: string, itemId: string) =>
    api.delete<ApiItem<FlashSale>>(`/flash-sales/${id}/items/${itemId}`),
};

export const adminApi = {
  users: (params?: { page?: number; limit?: number; search?: string; role?: string; status?: string }) =>
    api.get<ApiList<User> & { summary: UserSummary }>("/users", { params }),
  updateUser: (id: string, payload: { role?: User["role"]; isActive?: boolean }) =>
    api.patch<ApiItem<User>>(`/users/${id}/admin`, payload),
  orders: () => api.get<ApiList<Order>>("/orders"),
  orderStats: () => api.get<ApiItem<OrderStats>>("/orders/stats"),
  updateOrder: (
    id: string,
    payload: { orderStatus?: Order["orderStatus"]; paymentStatus?: Order["paymentStatus"] },
  ) => api.put<ApiItem<Order>>(`/orders/${id}/status`, payload),
  createProduct: (payload: Omit<Partial<Product>, "category" | "brand"> & { name: string; price: number; category: string; brand?: string }) =>
    api.post<ApiItem<Product>>("/products", payload),
  updateProduct: (
    id: string,
    payload: Omit<Partial<Product>, "category" | "brand"> & { category?: string; brand?: string },
  ) => api.put<ApiItem<Product>>(`/products/${id}`, payload),
  deleteProduct: (id: string) => api.delete(`/products/${id}`),
  deleteAllProducts: () => api.delete<{ success: boolean; message: string; deletedCount: number }>("/products/all"),
  createCategory: (payload: { name: string; image?: string }) => api.post<ApiItem<Category>>("/categories", payload),
  createBrand: (payload: { name: string; logo?: string }) => api.post<ApiItem<Brand>>("/brands", payload),
  createBanner: (payload: Omit<Banner, "_id" | "createdAt" | "updatedAt">) =>
    api.post<ApiItem<Banner>>("/banners", payload),
  updateBanner: (id: string, payload: Partial<Omit<Banner, "_id" | "createdAt" | "updatedAt">>) =>
    api.put<ApiItem<Banner>>(`/banners/${id}`, payload),
  deleteBanner: (id: string) => api.delete(`/banners/${id}`),
  createHomeSection: (payload: {
    title: string;
    keyword?: string;
    bannerImage: string;
    category: string;
    products: string[];
    isActive: boolean;
    sortOrder: number;
  }) => api.post<ApiItem<HomeSection>>("/home-sections", payload),
  updateHomeSection: (id: string, payload: Partial<{
    title: string;
    keyword: string;
    bannerImage: string;
    category: string;
    products: string[];
    isActive: boolean;
    sortOrder: number;
  }>) => api.put<ApiItem<HomeSection>>(`/home-sections/${id}`, payload),
  deleteHomeSection: (id: string) => api.delete(`/home-sections/${id}`),
  updateSiteSetting: (payload: SiteSetting) => api.put<ApiItem<SiteSetting>>("/site-settings", payload),
  uploadBanner: (file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    return api.post<ApiItem<{ image: string }>>("/banners/upload", formData);
  },
};
