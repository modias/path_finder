import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, BookOpen, Database, Globe, LineChart, Lightbulb, Sparkles } from "lucide-react";
import { COURSES, CORE_REQUIREMENT_GROUPS, ELECTIVE_PATHWAYS } from "../data/courseCatalog";
import CourseAdvisor from "./CourseAdvisor";

const INK = "#1B3A2D";
const GOLD = "#B3A369";
const GOLD_DEEP = "#9A7B2F";
const PANEL_BG = "#F6F3EC";
const LABEL_BG = "#E6ECE6";
const CARD_BORDER = "#E4E1D4";
const MUTED = "#5B6660";
const PATHWAY_BG = "#1E4535";

const PATHWAY_ICONS = {
  ai_ml: Lightbulb,
  data_engineering: Database,
  business_analytics: BarChart3,
  visualization: LineChart,
  applied_ds: Globe,
};

const RECOMMENDATIONS_ID = "course_recommendations";

const COURSE_BY_CODE = Object.fromEntries(
  COURSES.map((c) => [`${c.subject} ${c.number}`, c])
);

function SectionHeading({ children }) {
  return (
    <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: GOLD_DEEP }}>
      {children}
    </p>
  );
}

/**
 * @param {{
 *   registerPath?: string,
 *   recommendations?: import("./CourseAdvisor").Recommendation[],
 *   recommendLoading?: boolean,
 *   recommendError?: string | null,
 *   recommendSummary?: string | null,
 *   onGetRecommendations?: () => void,
 * }} props
 */
export default function CoreRequirementsOverview({
  registerPath = "/register-courses",
  recommendations = [],
  recommendLoading = false,
  recommendError = null,
  recommendSummary = null,
  onGetRecommendations,
}) {
  const [activePathway, setActivePathway] = useState("");
  const showRecommendations = activePathway === RECOMMENDATIONS_ID;
  const hasRecommendationResult =
    recommendLoading || Boolean(recommendError) || Boolean(recommendSummary) || recommendations.length > 0;

  const pathway = ELECTIVE_PATHWAYS.find((p) => p.id === activePathway);
  const pathwayCourses = useMemo(
    () => (pathway ? pathway.electives.map((code) => COURSE_BY_CODE[code]).filter(Boolean) : []),
    [pathway]
  );

  return (
    <div className="rounded-2xl p-5 sm:p-7 mb-8" style={{ background: PANEL_BG }}>
      <h2 className="text-3xl sm:text-4xl font-bold mb-6" style={{ color: INK }}>
        DS Core Courses &amp; Recommended Electives
      </h2>

      <SectionHeading>Core requirements</SectionHeading>
      <div className="flex flex-col gap-2 mb-8">
        {CORE_REQUIREMENT_GROUPS.map((group) => (
          <div key={group.id} className="grid sm:grid-cols-[140px_1fr] gap-2">
            <div
              className="flex items-center rounded-lg px-4 py-3"
              style={{ background: LABEL_BG, borderLeft: `4px solid ${INK}` }}
            >
              <h3 className="text-lg font-semibold" style={{ color: INK }}>{group.label}</h3>
            </div>
            <div
              className="grid grid-cols-2 md:[grid-template-columns:var(--cols)] gap-2"
              style={{ "--cols": `repeat(${group.items.length}, minmax(0, 1fr))` }}
            >
              {group.items.map((item) => (
                <div
                  key={item.codes}
                  className="min-w-0 break-words rounded-lg px-2.5 py-2.5 bg-white"
                  style={{ border: `1px solid ${item.capstone ? GOLD : CARD_BORDER}` }}
                >
                  <p className="text-[13px] font-bold" style={{ color: INK }}>{item.codes}</p>
                  <p className="text-[13px] leading-snug" style={{ color: MUTED }}>
                    {item.title}
                    {item.capstone && (
                      <>
                        {" · "}
                        <span className="font-semibold" style={{ color: GOLD_DEEP }}>Capstone</span>
                      </>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <SectionHeading>Recommended elective pathways</SectionHeading>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {ELECTIVE_PATHWAYS.map((p) => {
          const Icon = PATHWAY_ICONS[p.id] || Lightbulb;
          const active = activePathway === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setActivePathway((prev) => (prev === p.id ? "" : p.id))}
              aria-expanded={active}
              className="flex flex-col justify-start min-w-0 text-left rounded-xl p-3.5 transition-opacity hover:opacity-95"
              style={{ background: PATHWAY_BG, border: `1.5px solid ${active ? GOLD : "transparent"}` }}
            >
              <div className="flex items-start gap-2 mb-2">
                <Icon size={15} color={GOLD} className="shrink-0 mt-0.5" />
                <h4 className="min-w-0 break-words text-[15px] font-semibold leading-tight" style={{ color: "#FFFFFF" }}>{p.label}</h4>
              </div>
              <p className="text-[13px] leading-snug" style={{ color: "#D7E4DC" }}>{p.blurb}</p>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() =>
            setActivePathway((prev) => (prev === RECOMMENDATIONS_ID ? "" : RECOMMENDATIONS_ID))
          }
          aria-expanded={showRecommendations}
          className="flex flex-col justify-start min-w-0 text-left rounded-xl p-3.5 transition-opacity hover:opacity-95"
          style={{ background: GOLD, border: `1.5px solid ${showRecommendations ? INK : "transparent"}` }}
        >
          <div className="flex items-start gap-2 mb-2">
            <Sparkles size={15} color={INK} className="shrink-0 mt-0.5" />
            <h4 className="min-w-0 break-words text-[15px] font-semibold leading-tight" style={{ color: INK }}>
              Course recommendations
            </h4>
          </div>
          <p className="text-[13px] leading-snug" style={{ color: INK }}>
            {recommendations.length > 0
              ? `${recommendations.length} eligible picks matched to your Reflect answers`
              : "Personalized, eligible picks from your Reflect answers"}
          </p>
        </button>
      </div>

      {showRecommendations &&
        (hasRecommendationResult ? (
          <CourseAdvisor
            className="mt-4"
            loading={recommendLoading}
            error={recommendError}
            summary={recommendSummary}
            recommendations={recommendations}
          />
        ) : (
          <div
            className="mt-4 rounded-xl bg-white px-5 py-4 flex flex-wrap items-center justify-between gap-3"
            style={{ border: `1px solid ${CARD_BORDER}` }}
          >
            <p className="text-sm min-w-0 flex-1" style={{ color: MUTED }}>
              No recommendations yet. We&apos;ll pick eligible courses that match your Reflect ratings.
            </p>
            {onGetRecommendations && (
              <button
                type="button"
                onClick={onGetRecommendations}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full shrink-0"
                style={{ background: INK, color: "#FFFFFF" }}
              >
                <Sparkles size={13} />
                Get course recommendations
              </button>
            )}
          </div>
        ))}

      {pathway && (
        <div className="mt-4 rounded-xl bg-white overflow-hidden" style={{ border: `1px solid ${CARD_BORDER}` }}>
          <div className="px-5 py-3" style={{ borderBottom: `1px solid ${CARD_BORDER}` }}>
            <h3 className="text-sm font-semibold" style={{ color: INK }}>{pathway.label} electives</h3>
          </div>
          <ul className="divide-y divide-[#E4E1D4]">
            {pathwayCourses.map((course) => (
              <li key={`${course.subject}-${course.number}`} className="px-5 py-3 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold" style={{ color: INK }}>
                    <span style={{ fontFamily: "ui-monospace, monospace" }}>{course.subject} {course.number}</span>
                    {" · "}
                    {course.title}
                  </p>
                  {course.blurb && <p className="text-xs mt-0.5" style={{ color: MUTED }}>{course.blurb}</p>}
                </div>
                <Link
                  to={`${registerPath}?subject=${course.subject}&number=${course.number}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full shrink-0"
                  style={{ background: "#EEF0EA", color: INK, border: "1px solid #C8C5B8" }}
                >
                  <BookOpen size={13} />
                  Find sections
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
