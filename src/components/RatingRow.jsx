const INK = "#0B2E22";
const GOLD = "#B3A369";
const ON_DARK_MUTED = "#BFD9CB";

/**
 * 1–5 rating row for reflect-step questions.
 */
export default function RatingRow({ prompt, lowLabel, highLabel, value, onChange, variant = "dark" }) {
  const isDark = variant === "dark";
  const promptColor = isDark ? "#FFFFFF" : INK;
  const labelColor = isDark ? ON_DARK_MUTED : "#5B6660";

  return (
    <div className="mb-5 last:mb-0">
      <p className="text-sm font-medium mb-2" style={{ color: promptColor }}>
        {prompt}
      </p>
      <div className="flex items-center gap-1.5 sm:gap-2">
        {[1, 2, 3, 4, 5].map((rating) => {
          const active = value === rating;
          return (
            <button
              key={rating}
              type="button"
              aria-label={`${rating} out of 5`}
              onClick={() => onChange(rating)}
              className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full border text-sm font-semibold transition-colors"
              style={{
                borderColor: active ? GOLD : isDark ? "rgba(255,255,255,0.4)" : "#DCDACD",
                background: active ? GOLD : "transparent",
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
    </div>
  );
}
