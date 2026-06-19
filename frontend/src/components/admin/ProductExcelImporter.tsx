import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, LoaderCircle, Upload, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { adminApi, getErrorMessage } from "@/api/client";
import { Button } from "@/components/ui/button";
import type { Brand, Category, Product, ProductType } from "@/types";

const productTypes: ProductType[] = ["cpu", "mainboard", "ram", "ssd", "hdd", "gpu", "psu", "case", "cooler", "monitor", "keyboard", "mouse", "headphone", "laptop", "pc", "other"];
const currency = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

type Props = {
  categories: Category[];
  brands: Brand[];
  products: Product[];
  onImported: () => Promise<void>;
};

type ImportRow = {
  rowNumber: number;
  name: string;
  sku?: string;
  price: number;
  oldPrice?: number;
  discount?: number;
  ratingCount?: number;
  stock: number;
  categoryId: string;
  categoryName: string;
  brandId?: string;
  brandName?: string;
  productType: ProductType;
  description?: string;
  images?: string[];
  specs?: Record<string, string>;
  status: Product["status"];
  errors: string[];
};

const headerAliases: Record<string, string[]> = {
  name: ["ten san pham", "tên sản phẩm", "name", "product name"],
  sku: ["ma san pham", "mã sản phẩm", "ma san pham sku", "mã sản phẩm sku", "sku"],
  price: ["gia ban", "giá bán", "gia khuyen mai", "giá khuyến mãi", "gia khuyen mai vnd", "giá khuyến mãi vnd", "price"],
  oldPrice: ["gia cu", "giá cũ", "gia goc", "giá gốc", "gia goc vnd", "giá gốc vnd", "old price", "oldprice"],
  discount: ["phan tram giam", "phần trăm giảm", "discount"],
  ratingCount: ["so danh gia", "số đánh giá", "rating count", "ratings"],
  stock: ["ton kho", "tồn kho", "stock", "quantity"],
  category: ["danh muc", "danh mục", "category"],
  brand: ["thuong hieu", "thương hiệu", "brand"],
  productType: ["loai san pham", "loại sản phẩm", "product type", "producttype"],
  description: ["mo ta", "mô tả", "mo ta san pham", "mô tả sản phẩm", "product description", "description"],
  images: ["hinh anh", "hình ảnh", "anh", "ảnh", "link anh", "link ảnh", "images", "image"],
  additionalImages: ["anh khac", "ảnh khác", "anh khac cach nhau", "ảnh khác cách nhau", "additional images"],
  specs: ["thong so ky thuat", "thông số kỹ thuật", "specs", "specifications"],
  status: ["trang thai", "trạng thái", "status"],
};

const normalize = (value: unknown) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const findColumn = (headers: string[], key: keyof typeof headerAliases) => {
  const aliases = headerAliases[key].map(normalize);
  const exactMatch = headers.findIndex((header) => aliases.includes(header));
  if (exactMatch >= 0) return exactMatch;
  return headers.findIndex((header) => aliases.some((alias) => header.startsWith(`${alias} `)));
};

const cellText = (row: unknown[], index: number) => index >= 0 ? String(row[index] ?? "").trim() : "";

const parseNumber = (value: unknown) => {
  if (typeof value === "number") return value;
  const normalizedValue = String(value ?? "").replace(/[^\d.-]/g, "");
  return normalizedValue ? Number(normalizedValue) : 0;
};

const parseSpecs = (value: string) =>
  Object.fromEntries(
    value
      .split(/\s*\|\s*|\n+/)
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item, index) => {
        const separator = item.indexOf(":");
        return separator > 0
          ? [item.slice(0, separator).trim(), item.slice(separator + 1).trim()]
          : [`Thông số ${index + 1}`, item];
      }),
  );

const inferProductType = (categoryName: string): ProductType => {
  const category = normalize(categoryName);
  if (category.includes("laptop")) return "laptop";
  if (category.includes("man hinh") || category.includes("monitor")) return "monitor";
  if (category.includes("vga") || category.includes("card man hinh")) return "gpu";
  if (category.includes("mainboard") || category.includes("bo mach chu") || category === "main") return "mainboard";
  if (category.includes("cpu") || category.includes("bo vi xu ly")) return "cpu";
  if (category.includes("ram") || category.includes("bo nho trong")) return "ram";
  if (category.includes("ssd")) return "ssd";
  if (category.includes("hdd") || category.includes("o cung")) return "hdd";
  if (category.includes("nguon") || category.includes("psu")) return "psu";
  if (category.includes("case") || category.includes("vo may")) return "case";
  if (category.includes("tan nhiet") || category.includes("cooler")) return "cooler";
  if (category.includes("ban phim") || category.includes("keyboard")) return "keyboard";
  if (category.includes("chuot") || category.includes("mouse")) return "mouse";
  if (category.includes("tai nghe") || category.includes("headphone") || category.includes("headset")) return "headphone";
  if (category.includes("pc")) return "pc";
  return "other";
};

const parseStatus = (value: unknown, stock: number): Product["status"] => {
  const status = normalize(value);
  if (!status) return stock > 0 ? "active" : "out_of_stock";
  if (["active", "dang ban", "hoat dong"].includes(status)) return "active";
  if (["inactive", "ngung ban", "khong hoat dong"].includes(status)) return "inactive";
  if (["out of stock", "het hang"].includes(status)) return "out_of_stock";
  return undefined;
};

const columnIndex = (reference: string) => {
  const letters = reference.match(/[A-Z]+/i)?.[0]?.toUpperCase() || "";
  return [...letters].reduce((index, letter) => index * 26 + letter.charCodeAt(0) - 64, 0) - 1;
};

const readExcelSheet = async (file: File): Promise<unknown[][]> => {
  const { unzipSync } = await import("fflate");
  const files = unzipSync(new Uint8Array(await file.arrayBuffer()));
  const decoder = new TextDecoder();
  const parseXml = (path: string) => {
    const content = files[path];
    if (!content) throw new Error(`File Excel thiếu thành phần ${path}`);
    return new DOMParser().parseFromString(decoder.decode(content), "application/xml");
  };

  const workbook = parseXml("xl/workbook.xml");
  const relationships = parseXml("xl/_rels/workbook.xml.rels");
  const firstSheet = workbook.querySelector("sheet");
  const relationshipId = firstSheet?.getAttribute("r:id");
  const relationship = [...relationships.querySelectorAll("Relationship")]
    .find((item) => item.getAttribute("Id") === relationshipId);
  const target = relationship?.getAttribute("Target");
  if (!target) throw new Error("Không tìm thấy sheet dữ liệu trong file Excel");
  const sheetPath = target.startsWith("/") ? target.slice(1) : `xl/${target.replace(/^\.\//, "")}`;

  const sharedStrings = files["xl/sharedStrings.xml"]
    ? [...parseXml("xl/sharedStrings.xml").querySelectorAll("si")]
        .map((item) => [...item.querySelectorAll("t")].map((text) => text.textContent || "").join(""))
    : [];
  const sheet = parseXml(sheetPath);

  return [...sheet.querySelectorAll("sheetData > row")].map((row) => {
    const values: unknown[] = [];
    for (const cell of row.querySelectorAll(":scope > c")) {
      const index = columnIndex(cell.getAttribute("r") || "");
      const type = cell.getAttribute("t");
      const rawValue = cell.querySelector(":scope > v")?.textContent || "";
      if (type === "s") values[index] = sharedStrings[Number(rawValue)] || "";
      else if (type === "inlineStr") values[index] = [...cell.querySelectorAll("is t")].map((item) => item.textContent || "").join("");
      else if (type === "b") values[index] = rawValue === "1";
      else values[index] = rawValue === "" ? "" : Number.isNaN(Number(rawValue)) ? rawValue : Number(rawValue);
    }
    return values;
  });
};

export default function ProductExcelImporter({ categories, brands, products, onImported }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const validRows = useMemo(() => rows.filter((row) => row.errors.length === 0), [rows]);
  const invalidRows = rows.length - validRows.length;

  const reset = () => {
    setFileName("");
    setRows([]);
    setProgress({ done: 0, total: 0 });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const close = () => {
    if (importing) return;
    reset();
    setOpen(false);
  };

  const downloadTemplate = async () => {
    const categoryExample = categories[0]?.name || "Card màn hình";
    const brandExample = brands[0]?.name || "ASUS";
    const { default: writeXlsxFile } = await import("write-excel-file/browser");
    await writeXlsxFile(
      [
        ["Tên sản phẩm", "Giá bán", "Giá cũ", "Tồn kho", "Danh mục", "Thương hiệu", "Loại sản phẩm", "Mô tả", "Hình ảnh", "Trạng thái"],
        ["Card màn hình mẫu", 12990000, 14990000, 10, categoryExample, brandExample, "gpu", "Mô tả chi tiết", "https://example.com/image.jpg", "active"],
      ],
    ).toFile("mau-nhap-san-pham.xlsx");
  };

  const parseFile = async (file?: File) => {
    if (!file) return;
    setParsing(true);
    setFileName(file.name);
    try {
      const sheet = await readExcelSheet(file);
      if (sheet.length < 2) throw new Error("File Excel chưa có dữ liệu sản phẩm");

      const headers = sheet[0].map(normalize);
      const columns = {
        name: findColumn(headers, "name"),
        sku: findColumn(headers, "sku"),
        price: findColumn(headers, "price"),
        oldPrice: findColumn(headers, "oldPrice"),
        discount: findColumn(headers, "discount"),
        ratingCount: findColumn(headers, "ratingCount"),
        stock: findColumn(headers, "stock"),
        category: findColumn(headers, "category"),
        brand: findColumn(headers, "brand"),
        productType: findColumn(headers, "productType"),
        description: findColumn(headers, "description"),
        images: findColumn(headers, "images"),
        additionalImages: findColumn(headers, "additionalImages"),
        specs: findColumn(headers, "specs"),
        status: findColumn(headers, "status"),
      };

      if (columns.name < 0 || columns.price < 0 || columns.category < 0) {
        throw new Error("File phải có các cột: Tên sản phẩm, Giá bán và Danh mục");
      }

      const categoryMap = new Map(categories.flatMap((item) => [[normalize(item.name), item], [normalize(item.slug), item]]));
      const brandMap = new Map(brands.flatMap((item) => [[normalize(item.name), item], [normalize(item.slug), item]]));
      const existingNames = new Set(products.map((item) => normalize(item.name)));
      const namesInFile = new Set<string>();

      const parsedRows = sheet.slice(1).map((rawRow, index): ImportRow | null => {
        const row = rawRow as unknown[];
        const name = cellText(row, columns.name);
        if (!name && row.every((cell) => !String(cell ?? "").trim())) return null;

        const price = parseNumber(row[columns.price]);
        const oldPriceValue = columns.oldPrice >= 0 ? parseNumber(row[columns.oldPrice]) : 0;
        const discountValue = columns.discount >= 0 ? Math.abs(parseNumber(row[columns.discount])) : 0;
        const ratingCountValue = columns.ratingCount >= 0 ? parseNumber(row[columns.ratingCount]) : 0;
        const stockCell = cellText(row, columns.stock);
        const stockValue = columns.stock >= 0 && stockCell ? parseNumber(row[columns.stock]) : 50;
        const categoryText = cellText(row, columns.category);
        const brandText = cellText(row, columns.brand);
        const inferredType = inferProductType(categoryText);
        const typeText = normalize(cellText(row, columns.productType) || inferredType) as ProductType;
        const rawStatus = cellText(row, columns.status);
        const parsedStatus = rawStatus ? parseStatus(rawStatus, stockValue) : "active";
        const category = categoryMap.get(normalize(categoryText));
        const brand = brandText ? brandMap.get(normalize(brandText)) : undefined;
        const errors: string[] = [];
        const normalizedName = normalize(name);

        if (!name) errors.push("Thiếu tên sản phẩm");
        if (!Number.isFinite(price) || price <= 0) errors.push("Giá bán không hợp lệ");
        if (!Number.isInteger(stockValue) || stockValue < 0) errors.push("Tồn kho phải là số nguyên không âm");
        if (!categoryText) errors.push("Thiếu danh mục");
        if (brandText && !brand) errors.push(`Không tìm thấy thương hiệu "${brandText}"`);
        if (!productTypes.includes(typeText)) errors.push(`Loại sản phẩm "${typeText}" không hợp lệ`);
        if (!parsedStatus) errors.push(`Trạng thái "${rawStatus}" không hợp lệ`);
        if (existingNames.has(normalizedName)) errors.push("Sản phẩm đã tồn tại");
        if (namesInFile.has(normalizedName)) errors.push("Tên sản phẩm bị trùng trong file");
        namesInFile.add(normalizedName);

        return {
          rowNumber: index + 2,
          name,
          sku: cellText(row, columns.sku) || undefined,
          price,
          oldPrice: oldPriceValue > price ? oldPriceValue : undefined,
          discount: discountValue || (oldPriceValue > price ? Math.round((1 - price / oldPriceValue) * 100) : undefined),
          ratingCount: Number.isInteger(ratingCountValue) && ratingCountValue >= 0 ? ratingCountValue : undefined,
          stock: stockValue,
          categoryId: category?._id || "",
          categoryName: categoryText,
          brandId: brand?._id,
          brandName: brandText || undefined,
          productType: productTypes.includes(typeText) ? typeText : "other",
          description: cellText(row, columns.description) || undefined,
          images: [cellText(row, columns.images), cellText(row, columns.additionalImages)]
            .join(";")
            .split(/[|;\n]+/)
            .map((image) => image.trim())
            .filter(Boolean),
          specs: parseSpecs(cellText(row, columns.specs)),
          status: parsedStatus || "active",
          errors,
        };
      }).filter((row): row is ImportRow => Boolean(row));

      setRows(parsedRows);
      if (!parsedRows.length) throw new Error("Không tìm thấy dòng sản phẩm nào trong file");
    } catch (error) {
      reset();
      toast.error(error instanceof Error ? error.message : "Không thể đọc file Excel");
    } finally {
      setParsing(false);
    }
  };

  const importProducts = async () => {
    if (!validRows.length) return;
    setImporting(true);
    setProgress({ done: 0, total: validRows.length });
    const failedRows: ImportRow[] = [];
    const categoryIds = new Map(categories.flatMap((item) => [[normalize(item.name), item._id], [normalize(item.slug), item._id]]));

    for (const row of validRows) {
      try {
        let categoryId = row.categoryId || categoryIds.get(normalize(row.categoryName));
        if (!categoryId) {
          const response = await adminApi.createCategory({ name: row.categoryName });
          categoryId = response.data.data._id;
          categoryIds.set(normalize(row.categoryName), categoryId);
        }
        await adminApi.createProduct({
          name: row.name,
          sku: row.sku,
          price: row.price,
          oldPrice: row.oldPrice,
          discount: row.discount,
          ratingCount: row.ratingCount,
          stock: row.stock,
          category: categoryId,
          brand: row.brandId,
          productType: row.productType,
          description: row.description,
          images: row.images,
          specs: row.specs,
          status: row.status,
        });
      } catch (error) {
        failedRows.push({ ...row, errors: [getErrorMessage(error)] });
      } finally {
        setProgress((current) => ({ ...current, done: current.done + 1 }));
      }
    }

    await onImported();
    setImporting(false);

    if (failedRows.length) {
      setRows([...rows.filter((row) => row.errors.length > 0), ...failedRows]);
      toast.warning(`Đã nhập ${validRows.length - failedRows.length}/${validRows.length} sản phẩm`);
    } else {
      toast.success(`Đã nhập thành công ${validRows.length} sản phẩm`);
      close();
    }
  };

  return (
    <>
      <Button className="h-10 rounded-none border-[#16a34a] text-[#15803d] hover:bg-[#f0fdf4]" onClick={() => setOpen(true)} type="button" variant="outline">
        <FileSpreadsheet className="size-4" />
        Nhập từ Excel
      </Button>

      {open ? (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-[#101828]/60 p-4 backdrop-blur-[2px]" onMouseDown={close}>
          <section className="max-h-[92vh] w-full max-w-6xl overflow-y-auto bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#e5e7eb] bg-white px-5 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#16a34a]">Nhập hàng loạt</p>
                <h2 className="mt-1 text-xl font-black text-[#1d2939]">Thêm sản phẩm từ Excel</h2>
              </div>
              <button className="grid size-10 place-items-center text-[#667085] hover:bg-[#f2f4f7]" disabled={importing} onClick={close} type="button"><X className="size-5" /></button>
            </header>

            <div className="space-y-5 p-5">
              <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                <div className="border border-dashed border-[#9cbcff] bg-[#f8faff] p-6 text-center">
                  <input accept=".xlsx" className="hidden" onChange={(event) => void parseFile(event.target.files?.[0])} ref={fileInputRef} type="file" />
                  {parsing ? <LoaderCircle className="mx-auto size-8 animate-spin text-[#3278f6]" /> : <Upload className="mx-auto size-8 text-[#3278f6]" />}
                  <p className="mt-3 font-bold text-[#344054]">{fileName || "Chọn file Excel chứa danh sách sản phẩm"}</p>
                  <p className="mt-1 text-xs text-[#8d94ac]">Hỗ trợ .xlsx · tương thích mẫu TNC và mẫu tải từ hệ thống</p>
                  <Button className="mt-4 rounded-none bg-[#3278f6] hover:bg-[#2860c5]" disabled={parsing || importing} onClick={() => fileInputRef.current?.click()} type="button">
                    {rows.length ? "Chọn file khác" : "Chọn file Excel"}
                  </Button>
                </div>
                <div className="flex min-w-64 flex-col justify-center border border-[#e5e7eb] p-5">
                  <Download className="size-6 text-[#16a34a]" />
                  <p className="mt-3 font-bold text-[#344054]">Chưa có file đúng mẫu?</p>
                  <p className="mt-1 text-xs leading-5 text-[#8d94ac]">Tải file mẫu có sẵn tiêu đề và một dòng minh họa.</p>
                  <Button className="mt-4 rounded-none" onClick={() => void downloadTemplate()} type="button" variant="outline">
                    <Download className="size-4" /> Tải file mẫu
                  </Button>
                </div>
              </div>

              {rows.length ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="border border-[#e5e7eb] p-4"><p className="text-sm text-[#667085]">Tổng số dòng</p><p className="mt-1 text-2xl font-black text-[#1d2939]">{rows.length}</p></div>
                    <div className="border border-[#bbf7d0] bg-[#f0fdf4] p-4"><p className="text-sm text-[#15803d]">Có thể nhập</p><p className="mt-1 text-2xl font-black text-[#15803d]">{validRows.length}</p></div>
                    <div className="border border-[#fecaca] bg-[#fef2f2] p-4"><p className="text-sm text-[#b91c1c]">Cần sửa trong file</p><p className="mt-1 text-2xl font-black text-[#b91c1c]">{invalidRows}</p></div>
                  </div>

                  <div className="overflow-x-auto border border-[#e5e7eb]">
                    <div className="min-w-[1050px]">
                      <div className="grid grid-cols-[65px_minmax(250px,1fr)_130px_100px_150px_130px_minmax(220px,1fr)] bg-[#f9fafb] px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[#667085]">
                        <span>Dòng</span><span>Sản phẩm</span><span>Giá</span><span>Kho</span><span>Danh mục</span><span>Loại</span><span>Trạng thái kiểm tra</span>
                      </div>
                      <div className="max-h-[380px] divide-y divide-[#eef0f3] overflow-y-auto">
                        {rows.map((row) => (
                          <div className="grid grid-cols-[65px_minmax(250px,1fr)_130px_100px_150px_130px_minmax(220px,1fr)] items-center gap-2 px-4 py-3 text-sm" key={row.rowNumber}>
                            <span className="font-bold text-[#667085]">{row.rowNumber}</span>
                            <div className="min-w-0"><p className="truncate font-bold text-[#344054]">{row.name || "—"}</p><p className="truncate text-xs text-[#98a2b3]">{row.brandName || "Không thương hiệu"}</p></div>
                            <span>{Number.isFinite(row.price) ? currency.format(row.price) : "—"}</span>
                            <span>{row.stock}</span>
                            <span className="truncate">{row.categoryName || "—"}</span>
                            <span className="uppercase">{row.productType}</span>
                            {row.errors.length ? (
                              <span className="flex items-start gap-2 text-xs font-semibold leading-5 text-[#b91c1c]"><AlertCircle className="mt-0.5 size-4 shrink-0" />{row.errors.join(" · ")}</span>
                            ) : (
                              <span className="flex items-center gap-2 text-xs font-bold text-[#15803d]"><CheckCircle2 className="size-4" />Hợp lệ</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {importing ? (
                    <div>
                      <div className="mb-2 flex justify-between text-sm font-semibold text-[#667085]"><span>Đang nhập sản phẩm...</span><span>{progress.done}/{progress.total}</span></div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#eef0f3]"><div className="h-full bg-[#3278f6] transition-all" style={{ width: `${(progress.done / Math.max(progress.total, 1)) * 100}%` }} /></div>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap justify-end gap-2">
                    <Button className="rounded-none" disabled={importing} onClick={close} type="button" variant="outline">Hủy</Button>
                    <Button className="rounded-none bg-[#16a34a] hover:bg-[#15803d]" disabled={!validRows.length || importing} onClick={() => void importProducts()} type="button">
                      {importing ? <LoaderCircle className="size-4 animate-spin" /> : <FileSpreadsheet className="size-4" />}
                      Nhập {validRows.length} sản phẩm hợp lệ
                    </Button>
                  </div>
                </>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
