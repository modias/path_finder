import { ChevronDown } from "lucide-react";

const INK = "#0B2E22";
const GOLD = "#B3A369";
const ON_DARK_MUTED = "#BFD9CB";

/**
 * 1–5 rating row for reflect-step questions. Use `input="dropdown"` for a
 * labeled select that still stores 1–5.
 */
export default function RatingRow({
  prompt,
  lowLabel,
  highLabel,
  value,
  onChange,
  variant = "dark",
  input = "scale",
  options,
}) {
  const isDark = variant === "dark";
  const promptColor = isDark ? "#FFFFFF" : INK;
  const labelColor = isDark ? ON_DARK_MUTED : "#5B6660";
  const idleBorder = isDark ? "rgba(255,255,255,0.4)" : "#DCDACD";
  const hasValue = value != null;

  return (
    <div className="mb-5 last:mb-0">
      <p className="text-sm font-medium mb-2" style={{ color: promptColor }}>
        {prompt}
      </p>
      {input === "dropdown" ? (
        <div className="relative max-w-xl">
          <select
            value={hasValue ? String(value) : ""}
            aria-label={prompt}
            onChange={(event) => {
              const next = event.target.value;
              onChange(next === "" ? null : Number(next));
            }}
            className="w-full appearance-none rounded-full pl-4 pr-10 py-2.5 text-sm outline-none"
            style={{
              background: "transparent",
              color: isDark ? "#FFFFFF" : INK,
              border: `1.5px solid ${hasValue ? GOLD : idleBorder}`,
            }}
          >
            <option value="" disabled>
              Select a preference
            </option>
            {(options || []).map((option) => (
              <option key={option.value} value={option.value} style={{ color: INK }}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            color={hasValue ? GOLD : isDark ? "#FFFFFF" : INK}
            className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2"
            aria-hidden="true"
          />
        </div>
      ) : (
        <>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {[1, 2, 3, 4, 5].map((rating) => {
              const active = value === rating;
              return (
                <button
                  key={rating}
                  type="button"
                  aria-label={`${rating} out of 5`}
                  onClick={() => onChange(rating)}
                  className={`flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full border text-sm font-semibold transition-colors ${active || !isDark ? "" : "glass-chip"}`}
                  style={{
                    borderColor: active ? GOLD : idleBorder,
                    background: active ? GOLD : isDark ? undefined : "transparent",
                    color: active ? INK : isDark ? "#FFFFFF" : INK,
                  }}
                >
                  {rating}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] leading-snug mt-1.5" style={{ color: labelColor }}>
            (1 for {lowLabel} · 5 for {highLabel})
          </p>
        </>
      )}
    </div>
  );
}
