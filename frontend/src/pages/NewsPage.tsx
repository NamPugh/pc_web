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
    <section className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#d71920]">Tin tức</p>
          <h1 className="m-0 text-3xl font-bold tracking-tight text-slate-950">Bài viết & tư vấn</h1>
          <p className="mt-1 text-sm text-slate-500">Bài viết được publish từ API `/news`.</p>
        </div>
        <input
          className="mt-4 h-11 w-full rounded-md border border-slate-200 px-4 text-sm sm:mt-0 sm:max-w-sm"
          placeholder="Tìm bài viết"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {news.map((item) => (
          <Link key={item._id} to={`/news/${item.slug}`} className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-sm">
            <img className="aspect-video w-full bg-slate-100 object-cover" src={item.thumbnail || "/icons.svg"} alt={item.title} />
            <div className="p-4">
              <p className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleDateString("vi-VN")}</p>
              <h2 className="mt-2 text-lg font-bold tracking-tight text-slate-950 transition group-hover:text-[#d71920]">{item.title}</h2>
              <p className="mt-2 line-clamp-3 text-sm text-slate-600">{item.summary || item.content}</p>
            </div>
          </Link>
        ))}
      </div>
      {news.length === 0 ? <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">Chưa có bài viết.</div> : null}
    </section>
  );
}
