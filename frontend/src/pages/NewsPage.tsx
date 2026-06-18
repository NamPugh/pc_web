import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

import { getErrorMessage, newsApi } from "@/api/client";
import type { News } from "@/types";

export default function NewsPage() {
  const [news, setNews] = useState<News[]>([]);
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    const loadNews = async () => {
      try {
        const { data } = await newsApi.list({ keyword: keyword || undefined, status: "published" });
        setNews(data.data);
      } catch (error) {
        toast.error(getErrorMessage(error));
      }
    };

    void loadNews();
  }, [keyword]);

  return (
    <section className="space-y-6 py-6">
      <div className="border border-[#ededed] bg-white p-5 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-[#3278f6]">Tin tức công nghệ</p>
          <h1 className="mt-1 text-3xl font-bold text-[#29324e]">Bài viết & tư vấn</h1>
          <p className="mt-1 text-sm text-[#8d94ac]">Cập nhật phần cứng, gaming gear và kinh nghiệm chọn cấu hình.</p>
        </div>
        <label className="mt-4 flex h-11 w-full items-center gap-2 border border-[#ededed] bg-[#f5f5f5] px-3 sm:mt-0 sm:max-w-sm">
          <Search className="size-4 text-[#3278f6]" />
          <input
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            placeholder="Tìm bài viết"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {news.map((item) => (
          <Link key={item._id} to={`/news/${item.slug}`} className="group overflow-hidden border border-[#ededed] bg-white transition hover:border-[#3278f6] hover:shadow-[0_8px_20px_rgba(50,120,246,0.12)]">
            <img className="aspect-video w-full bg-[#f5f5f5] object-cover" src={item.thumbnail || "/icons.svg"} alt={item.title} />
            <div className="p-4">
              <p className="text-xs font-semibold text-[#8d94ac]">{new Date(item.createdAt).toLocaleDateString("vi-VN")}</p>
              <h2 className="mt-2 line-clamp-2 text-lg font-bold leading-6 text-[#29324e] transition group-hover:text-[#3278f6]">{item.title}</h2>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#555d72]">{item.summary || item.content}</p>
            </div>
          </Link>
        ))}
      </div>
      {news.length === 0 ? <div className="border border-[#ededed] bg-white p-10 text-center text-[#8d94ac]">Chưa có bài viết.</div> : null}
    </section>
  );
}
