import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Star } from "lucide-react";
import {
  MAX_DISPLAYED_ELECTIVES,
  buildElectivesForCodes,
  buildInitialElectiveCodes,
  pickReplacementElective,
} from "../lib/trackedElectives";
import { validateReflectAnswersForRecommendations } from "../lib/reflectScoring";
import { normalizeCode } from "../data/prerequisites";

const INK = "#0B2E22";
const GOLD_DEEP = "#8C7F4B";
const GOLD_BG = "#F8F4E6";
const DOT_COUNT = 5;
const GREEN = "#1F7A54";
const SURFACE = "#FFFFFF";
const MUTED = "#5B6660";

/**
 * @param {number} percent
 * @returns {{ bg: string, color: string }}
 */
function matchColors(percent) {
  if (percent >= 75) return { bg: "#E8F5EE", color: GREEN };
  if (percent >= 50) return { bg: "#F3EED9", color: GOLD_DEEP };
  return { bg: "#F5F6F1", color: MUTED };
}

function ElectiveCard({ course, onRefresh, showRefresh, seenCount = 1 }) {
  const activeDot = (seenCount - 1) % DOT_COUNT;
  const cycleLength = activeDot + 1;
  const statusMeta = {
    in_progress: { label: "In progress", bg: "#FFF8E8", color: "#C47A20" },
    remaining: { label: "Still needed", bg: "#F5F6F1", color: MUTED },
  }[course.status];
  const percent = Number.isFinite(course.matchPercent) ? course.matchPercent : null;
  const matchStyle = percent != null ? matchColors(percent) : { bg: "#F5F6F1", color: MUTED };
  const [showOrigin, setShowOrigin] = useState(false);

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: SURFACE, border: `1px solid ${matchStyle.color}33` }}
    >
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          {statusMeta && (
            <span
              className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full font-semibold"
              style={{ background: statusMeta.bg, color: statusMeta.color }}
            >
              {statusMeta.label}
            </span>
          )}
          {percent != null && (
            <span
              className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full font-semibold"
              style={{ background: matchStyle.bg, color: matchStyle.color }}
            >
              {percent}% · {course.matchLabel || "Match"}
            </span>
          )}
        </div>
        <span className="text-[11px] shrink-0 ml-auto" style={{ color: GOLD_DEEP }}>
          {course.hrs} hrs
        </span>
      </div>
      <p className="text-[11px] mb-0.5" style={{ fontFamily: "ui-monospace, monospace", color: MUTED }}>
        {course.code}
      </p>
      <h4 className="text-sm font-semibold mb-1" style={{ color: INK }}>
        {course.name}
      </h4>
      <p className="text-xs leading-relaxed" style={{ color: MUTED }}>
        {course.description || course.blurb}
      </p>
      {course.recommended && (
        <p className="text-[11px] font-semibold mt-2 flex items-center gap-1" style={{ color: GOLD_DEEP }}>
          <Star size={11} fill={GOLD_DEEP} /> Recommended for you
        </p>
      )}
      {showRefresh && onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          className="text-[11px] font-semibold mt-2 flex items-center gap-1.5 transition-opacity hover:opacity-80"
          style={{ color: MUTED }}
        >
          <RefreshCw size={11} /> Show other electives
        </button>
      )}
      <button
        type="button"
        onClick={() => setShowOrigin((open) => !open)}
        aria-expanded={showOrigin}
        aria-label={showOrigin ? "Hide why this was suggested" : "Show why this was suggested"}
        className="mt-2.5 px-1 py-1 flex items-center gap-1.5 transition-opacity hover:opacity-80"
      >
        {Array.from({ length: DOT_COUNT }, (_, index) => {
          const active = index === activeDot;
          const seen = index < cycleLength;
          const isOrigin = index === 0 && seenCount <= DOT_COUNT;
          const background = !seen ? SURFACE : isOrigin ? GOLD_DEEP : GREEN;
          return (
            <span
              key={index}
              className="block rounded-full transition-all"
              style={{
                width: active ? 7 : 5,
                height: active ? 7 : 5,
                background,
                border: seen ? "none" : "1px solid #C9CDC2",
              }}
            />
          );
        })}
      </button>
      {showOrigin && (
        <div
          className="mt-2 rounded-lg px-3 py-2 text-[11px] leading-relaxed"
          style={{ background: GOLD_BG, border: `1px solid ${GOLD_DEEP}55`, color: GOLD_DEEP }}
        >
          <p className="font-semibold mb-1">Why this was suggested</p>
          {course.drivers?.length ? (
            <ul className="list-disc pl-4 space-y-0.5">
              {course.drivers.map((driver) => (
                <li key={driver}>{driver}</li>
              ))}
            </ul>
          ) : (
            <p>No Reflect answers moved this score; it&apos;s ranked on default fit.</p>
          )}
          <p className="mt-1.5 opacity-80">
            Description from{" "}
            {course.descriptionSource === "syllabus" ? "the course syllabus" : "the catalog"}.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Suggested electives for the plan step — the student's top electives by Reflect
 * match. Hidden until every Section A and B rating is answered. Status comes
 * from the student record, catalog metadata from courseCatalog.js, and badges
 * are gated on both reflect scores and real eligibility. Shows four cards;
 * refreshing a card replaces only that course with the next ranked elective.
 * Descriptions use the syllabus-grounded reason from `recommendations` when one
 * exists for a course, otherwise the catalog blurb.
 */
export default function ElectivesPanel({ reflectAnswers = {}, recommendations = [] }) {
  const [displayedCodes, setDisplayedCodes] = useState(() =>
    buildInitialElectiveCodes(reflectAnswers)
  );
  const [retiredCodes, setRetiredCodes] = useState([]);
  const [slotSeenCounts, setSlotSeenCounts] = useState([]);
  const answerKey = JSON.stringify({
    interestRatings: reflectAnswers.interestRatings || {},
    styleRatings: reflectAnswers.styleRatings || {},
    topicsEnjoyed: reflectAnswers.topicsEnjoyed || [],
    skillsWant: reflectAnswers.skillsWant || [],
  });

  useEffect(() => {
    setDisplayedCodes(buildInitialElectiveCodes(reflectAnswers));
    setRetiredCodes([]);
    setSlotSeenCounts([]);
  }, [answerKey]); // eslint-disable-line react-hooks/exhaustive-deps -- answerKey is the stable snapshot

  const orderedElectives = useMemo(() => {
    const byCode = new Map(
      buildElectivesForCodes(displayedCodes, reflectAnswers, { recommendations }).map((course) => [
        course.code,
        course,
      ])
    );
    return displayedCodes
      .map((code) => byCode.get(normalizeCode(code)))
      .filter((course) => course && course.status !== "completed")
      .slice(0, MAX_DISPLAYED_ELECTIVES);
  }, [displayedCodes, reflectAnswers, recommendations]);

  const replacements = useMemo(() => {
    const map = new Map();
    for (const course of orderedElectives) {
      const result = pickReplacementElective({
        displayedCodes,
        codeToReplace: course.code,
        retiredCodes,
        reflectAnswers,
      });
      if (result?.course) map.set(normalizeCode(course.code), result);
    }
    return map;
  }, [orderedElectives, displayedCodes, reflectAnswers, retiredCodes]);

  function handleRefresh(code) {
    const result = replacements.get(normalizeCode(code));
    if (!result?.course) return;
    const replacing = normalizeCode(code);
    const nextCode = result.course.code;
    const slot = displayedCodes.findIndex((current) => normalizeCode(current) === replacing);

    if (slot !== -1) {
      const nextCounts = [...slotSeenCounts];
      nextCounts[slot] = (nextCounts[slot] ?? 1) + 1;
      setSlotSeenCounts(nextCounts);
    }

    setDisplayedCodes(
      displayedCodes.map((current) => (normalizeCode(current) === replacing ? nextCode : current))
    );
    setRetiredCodes(
      result.wrap
        ? [replacing]
        : [...retiredCodes, replacing]
    );
  }

  if (validateReflectAnswersForRecommendations(reflectAnswers)) return null;

  return (
    <div className="rounded-2xl p-6 mb-10" style={{ background: SURFACE, border: "1px solid #E4E1D4" }}>
      <div className="flex items-center gap-2 mb-1">
        <Star size={16} color={GOLD_DEEP} className="shrink-0" />
        <h3 className="text-lg" style={{ fontFamily: "Georgia, serif", color: INK }}>
          Suggested electives
        </h3>
      </div>
      <p className="text-sm mb-4" style={{ color: MUTED }}>
        Suggested electives based on your Reflect answers. &ldquo;Recommended for you&rdquo; only appears when you&apos;re currently eligible and your answers point to the course. Completed courses are hidden. Refresh a card to see another matching elective without changing the rest.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        {orderedElectives.map((course) => (
          <ElectiveCard
            key={course.code}
            course={course}
            seenCount={
              slotSeenCounts[
                displayedCodes.findIndex((current) => normalizeCode(current) === course.code)
              ]
            }
            showRefresh={replacements.has(course.code)}
            onRefresh={() => handleRefresh(course.code)}
          />
        ))}
      </div>
    </div>
  );
}
