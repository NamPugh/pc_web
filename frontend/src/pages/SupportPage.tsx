import { Clock3, Headphones, MapPin, MessageCircle, MonitorCog, PackageSearch, PhoneCall, ShieldCheck } from "lucide-react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";

const supportCards = [
  { title: "Tư vấn build PC", description: "Gợi ý cấu hình theo game, đồ họa, văn phòng và ngân sách.", icon: MonitorCog, href: "/build-pc" },
  { title: "Tra cứu đơn hàng", description: "Kiểm tra trạng thái xử lý, giao hàng và thanh toán.", icon: PackageSearch, href: "/orders" },
  { title: "Bảo hành", description: "Hỗ trợ thông tin bảo hành linh kiện, PC và phụ kiện.", icon: ShieldCheck, href: "/support" },
];

const faqs = [
  "Sản phẩm còn hàng sẽ được xác nhận trước khi đóng gói.",
  "Đơn COD có thể hủy khi trạng thái còn pending hoặc confirmed.",
  "Cấu hình PC đã lưu có thể thêm vào giỏ hàng từ trang Build PC.",
  "Đánh giá sản phẩm nằm trong trang chi tiết từng sản phẩm.",
];

export default function SupportPage() {
  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="p-6 sm:p-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#d71920]">Hỗ trợ khách hàng</p>
            <h1 className="mt-2 max-w-2xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">Cần tư vấn cấu hình, đơn hàng hoặc bảo hành?</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
              Khu vực hỗ trợ gom các lối đi nhanh cho khách mua linh kiện: build PC, theo dõi đơn, chính sách bảo hành và kênh liên hệ.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button className="h-11 rounded-md bg-[#d71920] px-5 hover:bg-[#b80d18]" asChild>
                <Link to="/build-pc">Build PC ngay</Link>
              </Button>
              <Button className="h-11 rounded-md" variant="outline" asChild>
                <Link to="/orders">Theo dõi đơn</Link>
              </Button>
            </div>
          </div>
          <div className="bg-[#111111] p-6 text-white sm:p-8">
            <Headphones className="size-9 text-red-100" />
            <h2 className="mt-5 text-2xl font-bold tracking-tight">Kênh liên hệ</h2>
            <div className="mt-5 grid gap-3 text-sm">
              <p className="inline-flex items-center gap-3 rounded-md border border-white/15 bg-white/10 p-4 text-white/82">
                <PhoneCall className="size-5 text-red-100" />
                0911111111
              </p>
              <p className="inline-flex items-center gap-3 rounded-md border border-white/15 bg-white/10 p-4 text-white/82">
                <MessageCircle className="size-5 text-red-100" />
                cskh@pcweb.local
              </p>
              <p className="inline-flex items-center gap-3 rounded-md border border-white/15 bg-white/10 p-4 text-white/82">
                <MapPin className="size-5 text-red-100" />
                114 Chiến Thắng, Hà Nội
              </p>
              <p className="inline-flex items-center gap-3 rounded-md border border-white/15 bg-white/10 p-4 text-white/82">
                <Clock3 className="size-5 text-red-100" />
                8:30 - 21:00 hằng ngày
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {supportCards.map((item) => {
          const Icon = item.icon;

          return (
            <Link key={item.title} to={item.href} className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-red-200 hover:shadow-sm">
              <div className="grid size-12 place-items-center rounded-md bg-red-50 text-[#d71920] transition group-hover:bg-[#d71920] group-hover:text-white">
                <Icon className="size-5" />
              </div>
              <h2 className="mt-4 text-xl font-bold tracking-tight text-slate-950">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
            </Link>
          );
        })}
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">Câu hỏi thường gặp</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {faqs.map((faq) => (
            <div key={faq} className="rounded-md bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              {faq}
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
