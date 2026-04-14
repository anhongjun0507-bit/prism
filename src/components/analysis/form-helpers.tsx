"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

/**
 * Analysis 페이지의 form 위저드에서 반복 사용되는 입력 위젯들.
 * 분리 이유: 각 위젯이 작고 재사용 가능, 페이지 본체 가독성 개선.
 */

export function FormField({
  label, ...props
}: {
  label: string;
  placeholder: string;
  type: string;
  step?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type={props.type}
        step={props.step}
        placeholder={props.placeholder}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        className="h-11 rounded-xl"
      />
    </div>
  );
}

export function TierSelector({
  label, options, selected, onSelect,
}: {
  label: string;
  options: { value: string | number; label: string }[];
  selected: string | number;
  onSelect: (v: string | number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex gap-1.5">
        {options.map(({ value, label }) => (
          <button
            key={String(value)}
            onClick={() => onSelect(value)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              selected === value
                ? "bg-primary text-white shadow-sm"
                : "bg-accent/50 text-foreground hover:bg-accent"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ToggleRow({
  label, checked, onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <Label className="text-sm">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export function PillButton({
  active, onClick, children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
        active
          ? "bg-primary text-white shadow-sm"
          : "bg-white border text-foreground hover:bg-accent/50"
      }`}
    >
      {children}
    </button>
  );
}
