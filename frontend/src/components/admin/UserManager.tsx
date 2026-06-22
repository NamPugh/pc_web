import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  LockKeyhole,
  Mail,
  RefreshCw,
  Search,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { adminApi, getErrorMessage } from "@/api/client";
import AdminSelect from "@/components/admin/AdminSelect";
import { useAuthStore } from "@/store/auth";
import type { User, UserSummary } from "@/types";

const emptySummary: UserSummary = {
  totalUsers: 0,
  totalAdmins: 0,
  activeUsers: 0,
  inactiveUsers: 0,
};

const summaryCards = [
  { key: "totalUsers", label: "Tổng tài khoản", icon: UsersRound, color: "text-[#465fff]" },
  { key: "activeUsers", label: "Đang hoạt động", icon: CheckCircle2, color: "text-[#12b76a]" },
  { key: "totalAdmins", label: "Quản trị viên", icon: ShieldCheck, color: "text-[#7a5af8]" },
  { key: "inactiveUsers", label: "Đã khóa", icon: LockKeyhole, color: "text-[#f04438]" },
] as const;

const roleOptions = [
  { value: "user", label: "Thành viên" },
  { value: "admin", label: "Quản trị viên" },
];

const getUserName = (user: User) => String(user.userName || user.email || "Người dùng").trim();
const getInitial = (user: User) => getUserName(user).slice(0, 1).toUpperCase() || "U";

const normalizeSummary = (summary?: Partial<UserSummary>): UserSummary => ({
  totalUsers: Number(summary?.totalUsers) || 0,
  totalAdmins: Number(summary?.totalAdmins) || 0,
  activeUsers: Number(summary?.activeUsers) || 0,
  inactiveUsers: Number(summary?.inactiveUsers) || 0,
});

export default function UserManager() {
  const currentUser = useAuthStore((state) => state.user);
  const [users, setUsers] = useState<User[]>([]);
  const [summary, setSummary] = useState<UserSummary>(emptySummary);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search.trim());
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.users({
        page,
        limit: 12,
        search: debouncedSearch || undefined,
        role,
        status,
      });
      const nextUsers = Array.isArray(data.data) ? data.data : [];
      setUsers(nextUsers);
      setSummary(normalizeSummary(data.summary));
      setTotal(data.total ?? nextUsers.length);
      setTotalPages(data.totalPages ?? 1);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, role, status]);

  useEffect(() => {
    let active = true;
    adminApi.users({
      page,
      limit: 12,
      search: debouncedSearch || undefined,
      role,
      status,
    }).then(({ data }) => {
      if (!active) return;
      const nextUsers = Array.isArray(data.data) ? data.data : [];
      setUsers(nextUsers);
      setSummary(normalizeSummary(data.summary));
      setTotal(data.total ?? nextUsers.length);
      setTotalPages(data.totalPages ?? 1);
      setLoading(false);
    }).catch((error: unknown) => {
      if (!active) return;
      toast.error(getErrorMessage(error));
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [debouncedSearch, page, role, status]);

  const updateUser = async (user: User, payload: { role?: User["role"]; isActive?: boolean }) => {
    setUpdatingId(user._id);
    try {
      const { data } = await adminApi.updateUser(user._id, payload);
      setUsers((current) => current.map((item) => item._id === user._id ? data.data : item));
      setSummary((current) => {
        const next = { ...current };
        if (payload.role && payload.role !== user.role) {
          next.totalAdmins += payload.role === "admin" ? 1 : -1;
        }
        if (payload.isActive !== undefined && payload.isActive !== (user.isActive !== false)) {
          next.activeUsers += payload.isActive ? 1 : -1;
          next.inactiveUsers += payload.isActive ? -1 : 1;
        }
        return next;
      });
      toast.success(payload.isActive === false ? "Đã khóa tài khoản" : payload.isActive === true ? "Đã mở khóa tài khoản" : "Đã cập nhật vai trò");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setUpdatingId("");
    }
  };

  const visibleRange = useMemo(() => {
    if (!total) return "0";
    const start = (page - 1) * 12 + 1;
    return `${start}–${Math.min(start + users.length - 1, total)}`;
  }, [page, total, users.length]);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <article className="rounded-xl border border-[#eaecf0] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]" key={card.key}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#667085]">{card.label}</p>
                  <strong className="mt-2 block text-3xl font-bold tracking-tight text-[#101828]">{summary[card.key]}</strong>
                </div>
                <Icon className={`size-8 ${card.color}`} strokeWidth={1.8} />
              </div>
            </article>
          );
        })}
      </div>

      <section className="overflow-hidden rounded-xl border border-[#eaecf0] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="border-b border-[#eaecf0] p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-[#101828]">Quản lý người dùng</h2>
            <button
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#d0d5dd] px-3 text-sm font-semibold text-[#344054] transition hover:bg-[#f9fafb]"
              onClick={() => void loadUsers()}
              type="button"
            >
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
              Làm mới
            </button>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(280px,1fr)_210px_210px]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#98a2b3]" />
              <input
                className="h-11 w-full rounded-lg border border-[#d0d5dd] pl-10 pr-3 text-sm outline-none transition focus:border-[#465fff] focus:ring-4 focus:ring-[#465fff]/10"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm tên, email hoặc số điện thoại..."
                value={search}
              />
            </label>
            <AdminSelect
              options={[{ value: "all", label: "Tất cả vai trò" }, ...roleOptions]}
              onValueChange={(value) => {
                setPage(1);
                setRole(value);
              }}
              value={role}
            />
            <AdminSelect
              options={[
                { value: "all", label: "Tất cả trạng thái" },
                { value: "active", label: "Đang hoạt động" },
                { value: "inactive", label: "Đã khóa" },
              ]}
              onValueChange={(value) => {
                setPage(1);
                setStatus(value);
              }}
              value={status}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[1040px]">
            <div className="grid grid-cols-[minmax(260px,1.4fr)_minmax(220px,1fr)_150px_180px_150px] bg-[#f9fafb] px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-[#667085]">
              <span>Người dùng</span>
              <span>Liên hệ</span>
              <span>Ngày tham gia</span>
              <span>Vai trò</span>
              <span>Trạng thái</span>
            </div>

            <div className="divide-y divide-[#eef0f3]">
              {loading ? (
                <div className="p-12 text-center text-sm font-semibold text-[#98a2b3]">Đang tải người dùng...</div>
              ) : users.length === 0 ? (
                <div className="grid place-items-center p-12 text-center">
                  <UsersRound className="size-11 text-[#cbd5e1]" />
                  <p className="mt-3 font-bold text-[#475467]">Không tìm thấy người dùng</p>
                  <p className="mt-1 text-sm text-[#98a2b3]">Hãy thử thay đổi từ khóa hoặc bộ lọc.</p>
                </div>
              ) : users.map((user) => {
                const isSelf = currentUser?._id === user._id;
                const isActive = user.isActive !== false;
                return (
                  <div className="grid grid-cols-[minmax(260px,1.4fr)_minmax(220px,1fr)_150px_180px_150px] items-center px-5 py-4 text-sm" key={user._id}>
                    <div className="flex min-w-0 items-center gap-3">
                      {user.avatarUrl ? (
                        <img alt={getUserName(user)} className="size-11 shrink-0 rounded-full object-cover" src={user.avatarUrl} />
                      ) : (
                        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#eef4ff] font-bold text-[#465fff]">{getInitial(user)}</span>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-bold text-[#344054]">{getUserName(user)}</p>
                          {isSelf ? <span className="rounded bg-[#ecf3ff] px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#465fff]">Bạn</span> : null}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-[#98a2b3]">
                          {(user.authProviders || ["local"]).includes("google") ? "Google" : "Email & mật khẩu"}
                        </p>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <p className="flex items-center gap-2 truncate font-semibold text-[#475467]"><Mail className="size-4 shrink-0 text-[#98a2b3]" />{user.email}</p>
                      <p className="mt-1 truncate pl-6 text-xs text-[#98a2b3]">{user.phone || "Chưa có số điện thoại"}</p>
                    </div>

                    <div>
                      <p className="font-semibold text-[#475467]">{user.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "—"}</p>
                      <p className="mt-0.5 text-xs text-[#98a2b3]">{user.createdAt ? new Date(user.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : ""}</p>
                    </div>

                    <AdminSelect
                      className={`h-10 w-[165px] ${user.role === "admin" ? "!border-[#d9d6fe] !bg-[#f4f3ff] !text-[#6941c6]" : ""}`}
                      disabled={updatingId === user._id || isSelf}
                      options={roleOptions}
                      onValueChange={(value) => void updateUser(user, { role: value as User["role"] })}
                      value={user.role}
                    />

                    <button
                      className={`inline-flex h-9 w-fit items-center gap-2 rounded-full px-3 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${isActive ? "bg-[#ecfdf3] text-[#027a48] hover:bg-[#d1fadf]" : "bg-[#fef3f2] text-[#b42318] hover:bg-[#fee4e2]"}`}
                      disabled={updatingId === user._id || isSelf}
                      onClick={() => void updateUser(user, { isActive: !isActive })}
                      type="button"
                    >
                      {isActive ? <CheckCircle2 className="size-4" /> : <LockKeyhole className="size-4" />}
                      {isActive ? "Hoạt động" : "Đã khóa"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eaecf0] px-5 py-4">
          <p className="text-sm text-[#667085]">Hiển thị <b className="text-[#344054]">{visibleRange}</b> trong <b className="text-[#344054]">{total}</b> tài khoản</p>
          <div className="flex items-center gap-2">
            <button
              className="grid size-9 place-items-center rounded-lg border border-[#d0d5dd] text-[#475467] transition hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
              type="button"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="min-w-20 text-center text-sm font-semibold text-[#475467]">{page} / {totalPages}</span>
            <button
              className="grid size-9 place-items-center rounded-lg border border-[#d0d5dd] text-[#475467] transition hover:bg-[#f9fafb] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
              type="button"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
