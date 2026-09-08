import { Loader2, Sparkles, BookOpen } from "lucide-react";

const INK = "#0B2E22";
const GOLD = "#B3A369";
const GOLD_DEEP = "#8C7F4B";
const GREEN = "#1F7A54";
const SURFACE = "#FFFFFF";
const MUTED = "#5B6660";

/**
 * @param {number} percent
 * @returns {{ bg: string, color: string }}
 */
function matchColors(percent) {
  if (percent >= 80) return { bg: "#E8F5EE", color: GREEN };
  if (percent >= 60) return { bg: "#F3EED9", color: GOLD_DEEP };
  return { bg: "#F5F6F1", color: MUTED };
}

/**
 * @typedef {{ code: string, title: string, credits: number, category?: string, matchPercent?: number, matchLabel?: string, reason: string }} Recommendation
 */

export function RecommendationCard({ course }) {
  const percent = Number.isFinite(course.matchPercent) ? course.matchPercent : null;
  const colors = percent != null ? matchColors(percent) : { bg: "#F5F6F1", color: MUTED };
  const label = course.matchLabel || (percent != null ? `${percent}% match` : null);

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: SURFACE, border: `1px solid ${colors.color}33` }}
    >
      <div className="flex items-center justify-between mb-2 gap-2">
        {label ? (
          <span
            className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full font-semibold"
            style={{ background: colors.bg, color: colors.color }}
          >
            {label}
          </span>
        ) : (
          <span />
        )}
        <span className="text-[11px] shrink-0" style={{ color: GOLD_DEEP }}>
          {course.credits} hrs
        </span>
      </div>
      <p className="text-[11px] mb-0.5" style={{ fontFamily: "ui-monospace, monospace", color: MUTED }}>
        {course.code}
      </p>
      <h4 className="text-sm font-semibold mb-1" style={{ color: INK }}>{course.title}</h4>
      <p className="text-xs leading-relaxed" style={{ color: MUTED }}>{course.reason}</p>
    </div>
  );
}

/**
 * Inline recommendation results for the Reflect step.
 * @param {{
 *   loading?: boolean,
 *   error?: string | null,
 *   summary?: string | null,
 *   recommendations?: Recommendation[],
 * }} props
 */
export default function CourseAdvisor({ loading, error, summary, recommendations = [] }) {
  if (!loading && !error && !summary && recommendations.length === 0) {
    return null;
  }

  return (
    <div
      id="course-recommendations"
      className="rounded-2xl p-6 mt-8"
      style={{ background: SURFACE, border: "1px solid #E4E1D4" }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={18} color={GREEN} />
        <h3 className="text-lg font-semibold" style={{ color: INK, fontFamily: "Georgia, serif" }}>
          Course recommendations
        </h3>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm" style={{ color: MUTED }}>
          <Loader2 size={16} className="animate-spin" />
          Finding eligible courses for your term and credit load...
        </div>
      )}

      {error && (
        <p className="text-sm rounded-lg px-3 py-2" style={{ background: "#FFF8E8", color: "#C47A20" }}>
          {error}
        </p>
      )}

      {!loading && summary && (
        <p className="text-sm mb-4 leading-relaxed" style={{ color: MUTED }}>{summary}</p>
      )}

      {!loading && recommendations.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-4">
          {recommendations.map((course) => (
            <RecommendationCard key={course.code} course={course} />
          ))}
        </div>
      )}

      {!loading && !error && recommendations.length === 0 && summary && (
        <div className="flex items-center gap-2 text-sm" style={{ color: MUTED }}>
          <BookOpen size={16} />
          No additional eligible courses matched your preferences for this term.
        </div>
      )}

      <p className="text-[10px] mt-4" style={{ color: MUTED }}>
        Match labels come from your Reflect ratings (Strong match / Good option). Recommendations are still filtered by prerequisite eligibility — confirm availability with your advisor before registering.
      </p>
    </div>
  );
}
