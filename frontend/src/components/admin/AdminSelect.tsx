import { Check, ChevronDown } from "lucide-react";
import { Select } from "radix-ui";

export type AdminSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type Props = {
  value: string;
  options: AdminSelectOption[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  contentClassName?: string;
};

export default function AdminSelect({
  value,
  options,
  onValueChange,
  placeholder = "Chọn một giá trị",
  disabled = false,
  className = "",
  contentClassName = "",
}: Props) {
  return (
    <Select.Root disabled={disabled} onValueChange={onValueChange} value={value}>
      <Select.Trigger
        className={`inline-flex h-11 min-w-0 items-center justify-between gap-3 rounded-lg border border-[#e4e7ec] bg-white px-3 text-left text-sm font-semibold text-[#344054] shadow-sm outline-none transition hover:border-[#b8c4ff] focus:border-[#465fff] focus:ring-4 focus:ring-[#465fff]/10 disabled:cursor-not-allowed disabled:bg-[#f2f4f7] disabled:text-[#98a2b3] ${className}`}
      >
        <Select.Value placeholder={placeholder} />
        <Select.Icon><ChevronDown className="size-4 shrink-0 text-[#667085]" /></Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          className={`z-[130] max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-[#eaecf0] bg-white p-1.5 shadow-[0_16px_40px_rgba(16,24,40,0.16)] ${contentClassName}`}
          position="popper"
          sideOffset={6}
        >
          <Select.Viewport>
            {options.map((option) => (
              <Select.Item
                className="relative flex min-h-10 cursor-pointer select-none items-center rounded-lg py-2 pl-3 pr-9 text-sm font-medium text-[#344054] outline-none transition data-[disabled]:pointer-events-none data-[disabled]:opacity-40 data-[highlighted]:bg-[#f2f4f7] data-[state=checked]:bg-[#ecf3ff] data-[state=checked]:font-semibold data-[state=checked]:text-[#465fff]"
                disabled={option.disabled}
                key={option.value}
                value={option.value}
              >
                <Select.ItemText>{option.label}</Select.ItemText>
                <Select.ItemIndicator className="absolute right-3 grid place-items-center text-[#465fff]">
                  <Check className="size-4" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
