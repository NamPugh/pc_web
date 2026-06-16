import { ArrowLeft, CalendarDays, Newspaper } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";

import { getErrorMessage, newsApi } from "@/api/client";
import { Button } from "@/components/ui/button";
import type { News } from "@/types";

export default function NewsDetailPage() {
  const { slug = "" } = useParams();
  const [article, setArticle] = useState<News | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadArticle = async () => {
      setLoading(true);
      try {
        const { data } = await newsApi.bySlug(slug);
        setArticle(data.data);
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    if (slug) void loadArticle();
  }, [slug]);

  if (loading) {
    return <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">Đang tải bài viết...</div>;
  }

  if (!article) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <Newspaper className="mx-auto size-8 text-slate-400" />
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-950">Không tìm thấy bài viết</h1>
        <Button className="mt-5 rounded-md bg-[#d71920] hover:bg-[#b80d18]" asChild>
          <Link to="/news">Quay lại tin tức</Link>
        </Button>
      </section>
    );
  }

  return (
    <article className="mx-auto max-w-4xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="relative bg-[#111]">
        <img className="max-h-[460px] w-full object-cover opacity-80" src={article.thumbnail || "/icons.svg"} alt={article.title} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white sm:p-8">
          <Link className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-white/80 transition hover:text-white" to="/news">
            <ArrowLeft className="size-4" />
            Tin tức
          </Link>
          <h1 className="max-w-3xl text-3xl font-bold leading-tight tracking-tight sm:text-5xl">{article.title}</h1>
          <p className="mt-4 inline-flex items-center gap-2 text-sm text-white/75">
            <CalendarDays className="size-4" />
            {new Date(article.createdAt).toLocaleDateString("vi-VN")}
          </p>
        </div>
      </div>
      <div className="p-6 sm:p-8">
        {article.summary ? <p className="mb-6 rounded-md bg-red-50 p-4 text-base font-semibold leading-7 text-[#9d0d16]">{article.summary}</p> : null}
        <div className="whitespace-pre-line text-sm leading-8 text-slate-700 sm:text-base">{article.content}</div>
      </div>
    </article>
  );
}
