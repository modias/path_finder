import { Loader2, Sparkles, BookOpen } from "lucide-react";
import { CATEGORY_META } from "../data/courseCatalog";

const INK = "#0B2E22";
const GOLD = "#B3A369";
const GOLD_DEEP = "#8C7F4B";
const GREEN = "#1F7A54";
const SURFACE = "#FFFFFF";
const MUTED = "#5B6660";

const CATEGORY_COLORS = {
  gen_ed: { bg: "#E8F1FB", color: "#1A5FA8" },
  core: { bg: "#E8F5EE", color: GREEN },
  outside_elective: { bg: "#F3EAF8", color: "#7B4B9A" },
  computing: { bg: "#EEF0EA", color: INK },
  capstone: { bg: "#F3EED9", color: GOLD_DEEP },
};

/**
 * @typedef {{ code: string, title: string, credits: number, category?: string, reason: string }} Recommendation
 */

export function RecommendationCard({ course }) {
  const colors = CATEGORY_COLORS[course.category] || CATEGORY_COLORS.outside_elective;
  const meta = CATEGORY_META[course.category];

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: SURFACE, border: `1px solid ${colors.color}33` }}
    >
      <div className="flex items-center justify-between mb-2 gap-2">
        {meta && (
          <span
            className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full font-semibold"
            style={{ background: colors.bg, color: colors.color }}
          >
            {meta.short}
          </span>
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
        Recommendations are filtered by prerequisite eligibility only — confirm availability with your advisor before registering.
      </p>
    </div>
  );
}
