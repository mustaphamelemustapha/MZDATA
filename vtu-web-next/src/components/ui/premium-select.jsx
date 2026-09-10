import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export const PremiumSelect = ({ label, helperText, value, onChange, options, placeholder, required = false, disabled = false }) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-[13px] font-semibold text-foreground/90">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={cn(
            "w-full h-[52px] appearance-none rounded-xl border border-border bg-card px-4 pr-10 text-[15px] font-medium text-foreground transition-all duration-200 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10",
            disabled && "opacity-60 cursor-not-allowed bg-muted/50",
            !value && "text-muted-foreground"
          )}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
          <ChevronDown className="h-5 w-5 text-muted-foreground/60" />
        </div>
      </div>
      {helperText && <p className="text-[12.5px] text-muted-foreground mt-1.5">{helperText}</p>}
    </div>
  );
};
