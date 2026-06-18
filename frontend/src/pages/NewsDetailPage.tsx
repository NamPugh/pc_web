import { ArrowLeft, ArrowUpRight, CalendarDays, Clock3, Home, Link2, Newspaper } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";

import { getErrorMessage, newsApi } from "@/api/client";
import { Button } from "@/components/ui/button";
import type { News } from "@/types";

function readingTime(content: string) {
  return Math.max(1, Math.ceil(content.trim().split(/\s+/).length / 220));
}

export default function NewsDetailPage() {
  const { slug = "" } = useParams();
  const [article, setArticle] = useState<News | null>(null);
  const [relatedNews, setRelatedNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadArticle = async () => {
      setLoading(true);
      try {
        const [articleRes, newsRes] = await Promise.all([
          newsApi.bySlug(slug),
          newsApi.list({ status: "published" }),
        ]);
        setArticle(articleRes.data.data);
        setRelatedNews(newsRes.data.data.filter((item) => item.slug !== slug).slice(0, 5));
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    if (slug) void loadArticle();
  }, [slug]);

  const minutes = useMemo(() => readingTime(article?.content || ""), [article?.content]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Đã sao chép liên kết bài viết");
    } catch {
      toast.error("Không thể sao chép liên kết");
    }
  };

  if (loading) {
    return (
      <div className="my-6 border border-[#ededed] bg-white p-10 text-center text-[#8d94ac]">
        Đang tải bài viết...
      </div>
    );
  }

  if (!article) {
    return (
      <section className="my-6 border border-[#ededed] bg-white p-10 text-center">
        <Newspaper className="mx-auto size-9 text-[#8d94ac]" />
        <h1 className="mt-4 text-2xl font-bold text-[#29324e]">Không tìm thấy bài viết</h1>
        <Button className="mt-5 rounded-none bg-[#3278f6] hover:bg-[#2860c5]" asChild>
          <Link to="/news">Quay lại tin tức</Link>
        </Button>
      </section>
    );
  }

  return (
    <div className="py-6">
      <nav className="mb-4 flex min-w-0 items-center gap-2 overflow-hidden text-sm font-semibold text-[#8d94ac]">
        <Link className="inline-flex shrink-0 items-center gap-1 transition hover:text-[#3278f6]" to="/">
          <Home className="size-4" />
          Trang chủ
        </Link>
        <span>/</span>
        <Link className="shrink-0 transition hover:text-[#3278f6]" to="/news">Tin tức</Link>
        <span>/</span>
        <span className="truncate text-[#29324e]">{article.title}</span>
      </nav>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <article className="border border-[#ededed] bg-white">
          <header className="border-b border-[#ededed] px-5 py-6 sm:px-8">
            <Link className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-[#3278f6] transition hover:text-[#fb4e4e]" to="/news">
              <ArrowLeft className="size-4" />
              Tin tức công nghệ
            </Link>
            <h1 className="max-w-5xl text-3xl font-bold leading-[1.25] text-[#29324e] sm:text-4xl">
              {article.title}
            </h1>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-[#8d94ac]">
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="size-4 text-[#3278f6]" />
                {new Date(article.createdAt).toLocaleDateString("vi-VN")}
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock3 className="size-4 text-[#3278f6]" />
                {minutes} phút đọc
              </span>
              <button className="inline-flex items-center gap-2 transition hover:text-[#3278f6]" onClick={copyLink} type="button">
                <Link2 className="size-4" />
                Sao chép liên kết
              </button>
            </div>
          </header>

          {article.thumbnail ? (
            <figure className="border-b border-[#ededed] bg-[#f5f5f5]">
              <img className="mx-auto max-h-[620px] w-full object-contain" src={article.thumbnail} alt={article.title} />
            </figure>
          ) : null}

          <div className="px-5 py-7 sm:px-8 sm:py-9">
            {article.summary ? (
              <p className="mb-7 border-l-4 border-[#3278f6] bg-[#eef4ff] px-5 py-4 text-base font-semibold leading-7 text-[#29324e]">
                {article.summary}
              </p>
            ) : null}
            <div className="whitespace-pre-line text-[15px] leading-8 text-[#3e465c] sm:text-base">
              {article.content}
            </div>
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#ededed] px-5 py-5 sm:px-8">
            <Link className="inline-flex items-center gap-2 text-sm font-bold text-[#3278f6] transition hover:text-[#fb4e4e]" to="/news">
              <ArrowLeft className="size-4" />
              Quay lại danh sách tin
            </Link>
            <button className="inline-flex h-10 items-center gap-2 bg-[#3278f6] px-4 text-sm font-bold text-white transition hover:bg-[#2860c5]" onClick={copyLink} type="button">
              <Link2 className="size-4" />
              Chia sẻ bài viết
            </button>
          </footer>
        </article>

        <aside className="space-y-5 lg:sticky lg:top-[210px]">
          <section className="border border-[#ededed] bg-white p-5">
            <h2 className="border-b border-[#ededed] pb-3 text-lg font-bold uppercase text-[#29324e]">
              Tin mới nhất
            </h2>
            <div className="divide-y divide-[#ededed]">
              {relatedNews.map((item) => (
                <Link className="group grid grid-cols-[96px_minmax(0,1fr)] gap-3 py-4" key={item._id} to={`/news/${item.slug}`}>
                  <img className="aspect-[4/3] w-full bg-[#f5f5f5] object-cover" src={item.thumbnail || "/icons.svg"} alt={item.title} />
                  <span className="min-w-0">
                    <b className="line-clamp-3 text-sm leading-5 text-[#29324e] transition group-hover:text-[#3278f6]">{item.title}</b>
                    <small className="mt-2 block text-xs font-semibold text-[#8d94ac]">
                      {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                    </small>
                  </span>
                </Link>
              ))}
              {relatedNews.length === 0 ? <p className="py-5 text-sm text-[#8d94ac]">Chưa có bài viết liên quan.</p> : null}
            </div>
          </section>

          <section className="bg-[#29324e] p-5 text-white">
            <span className="text-xs font-bold uppercase text-[#fbff32]">HNH Channel</span>
            <h2 className="mt-2 text-xl font-bold">Build PC và tin công nghệ</h2>
            <p className="mt-2 text-sm leading-6 text-white/70">
              Cập nhật phần cứng, cấu hình gaming và kinh nghiệm chọn thiết bị phù hợp.
            </p>
            <Link className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-white transition hover:text-[#fbff32]" to="/news">
              Xem tất cả bài viết
              <ArrowUpRight className="size-4" />
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
