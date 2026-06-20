import { CalendarDays, Check, ChevronLeft, ChevronRight, Clock3 } from "lucide-react";
import { Popover } from "radix-ui";
import { useMemo, useState } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

const weekDays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const monthNames = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12",
];

const pad = (value: number) => String(value).padStart(2, "0");

const parseValue = (value: string) => {
  const [datePart = "", timePart = "00:00"] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour = 0, minute = 0] = timePart.split(":").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day, hour, minute);
};

const toValue = (date: Date, hour: number, minute: number) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(hour)}:${pad(minute)}`;

export default function AdminDateTimePicker({ value, onChange, placeholder = "Chọn ngày và giờ" }: Props) {
  const selected = parseValue(value);
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => selected || new Date());
  const [hour, setHour] = useState(selected?.getHours() ?? 0);
  const [minute, setMinute] = useState(selected?.getMinutes() ?? 0);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      const next = parseValue(value) || new Date();
      setViewDate(next);
      setHour(next.getHours());
      setMinute(next.getMinutes());
    }
    setOpen(nextOpen);
  };

  const days = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const mondayOffset = (firstDay.getDay() + 6) % 7;
    const start = new Date(year, month, 1 - mondayOffset);
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }, [viewDate]);

  const selectDay = (date: Date) => {
    onChange(toValue(date, hour, minute));
  };

  const updateTime = (nextHour: number, nextMinute: number) => {
    setHour(nextHour);
    setMinute(nextMinute);
    onChange(toValue(selected || viewDate, nextHour, nextMinute));
  };

  const chooseToday = () => {
    const now = new Date();
    const roundedMinute = Math.floor(now.getMinutes() / 5) * 5;
    setViewDate(now);
    setHour(now.getHours());
    setMinute(roundedMinute);
    onChange(toValue(now, now.getHours(), roundedMinute));
  };

  const displayValue = selected
    ? selected.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <Popover.Root onOpenChange={handleOpenChange} open={open}>
      <Popover.Trigger asChild>
        <button className="flex h-11 w-full items-center justify-between rounded-lg border border-[#e4e7ec] bg-white px-3 text-left text-sm font-medium text-[#344054] shadow-sm outline-none transition hover:border-[#b8c4ff] focus:border-[#465fff] focus:ring-4 focus:ring-[#465fff]/10" type="button">
          <span className={displayValue ? "" : "text-[#98a2b3]"}>{displayValue || placeholder}</span>
          <CalendarDays className="size-4 shrink-0 text-[#667085]" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="start" className="z-[140] w-[330px] rounded-2xl border border-[#eaecf0] bg-white p-4 shadow-[0_18px_45px_rgba(16,24,40,0.18)]" sideOffset={7}>
          <div className="flex items-center justify-between">
            <button className="grid size-9 place-items-center rounded-lg text-[#667085] hover:bg-[#f2f4f7]" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} type="button"><ChevronLeft className="size-4" /></button>
            <p className="font-bold text-[#101828]">{monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}</p>
            <button className="grid size-9 place-items-center rounded-lg text-[#667085] hover:bg-[#f2f4f7]" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} type="button"><ChevronRight className="size-4" /></button>
          </div>

          <div className="mt-3 grid grid-cols-7 text-center">
            {weekDays.map((day) => <span className="py-2 text-[11px] font-bold text-[#98a2b3]" key={day}>{day}</span>)}
            {days.map((date) => {
              const inMonth = date.getMonth() === viewDate.getMonth();
              const isSelected = selected &&
                date.getFullYear() === selected.getFullYear() &&
                date.getMonth() === selected.getMonth() &&
                date.getDate() === selected.getDate();
              const today = new Date();
              const isToday = date.toDateString() === today.toDateString();
              return (
                <button
                  className={`relative grid aspect-square place-items-center rounded-lg text-sm transition ${isSelected ? "bg-[#465fff] font-bold text-white" : inMonth ? "text-[#344054] hover:bg-[#ecf3ff] hover:text-[#465fff]" : "text-[#d0d5dd] hover:bg-[#f9fafb]"} ${isToday && !isSelected ? "font-bold text-[#465fff]" : ""}`}
                  key={date.toISOString()}
                  onClick={() => selectDay(date)}
                  type="button"
                >
                  {date.getDate()}
                  {isToday && !isSelected ? <span className="absolute bottom-1 size-1 rounded-full bg-[#465fff]" /> : null}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center gap-3 border-t border-[#eaecf0] pt-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#ecf3ff] text-[#465fff]"><Clock3 className="size-4" /></span>
            <label className="flex flex-1 items-center gap-2">
              <input className="h-10 w-full rounded-lg border border-[#e4e7ec] px-2 text-center text-sm font-semibold outline-none focus:border-[#465fff]" max="23" min="0" onChange={(event) => updateTime(Math.min(23, Math.max(0, Number(event.target.value))), minute)} type="number" value={hour} />
              <b className="text-[#98a2b3]">:</b>
              <input className="h-10 w-full rounded-lg border border-[#e4e7ec] px-2 text-center text-sm font-semibold outline-none focus:border-[#465fff]" max="59" min="0" onChange={(event) => updateTime(hour, Math.min(59, Math.max(0, Number(event.target.value))))} step="5" type="number" value={minute} />
            </label>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-[#eaecf0] pt-3">
            <button className="text-sm font-semibold text-[#465fff] hover:text-[#3641f5]" onClick={chooseToday} type="button">Hôm nay</button>
            <button className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#465fff] px-3 text-sm font-bold text-white hover:bg-[#3641f5]" onClick={() => setOpen(false)} type="button"><Check className="size-4" />Xong</button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
