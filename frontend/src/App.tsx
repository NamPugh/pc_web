import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { Toaster } from "sonner";

import Layout from "@/components/Layout";
import AccountPage from "@/pages/AccountPage";
import AdminPage from "@/pages/AdminPage";
import BuildPcPage from "@/pages/BuildPcPage";
import CartPage from "@/pages/CartPage";
import HomePage from "@/pages/HomePage";
import NewsDetailPage from "@/pages/NewsDetailPage";
import NewsPage from "@/pages/NewsPage";
import OrdersPage from "@/pages/OrdersPage";
import ProductDetailPage from "@/pages/ProductDetailPage";
import SignInPage from "@/pages/SignInPage";
import SignUpPage from "@/pages/SignUpPage";
import SupportPage from "@/pages/SupportPage";
import VnPayReturnPage from "@/pages/VnPayReturnPage";

function App() {
  return (
    <>
      <Toaster richColors position="top-right" />
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/build-pc" element={<BuildPcPage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/news/:slug" element={<NewsDetailPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/payment/vnpay-return" element={<VnPayReturnPage />} />
          </Route>
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
