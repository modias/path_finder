import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Star } from "lucide-react";
import {
  MAX_DISPLAYED_ELECTIVES,
  PINNED_ELECTIVE_COUNT,
  SWAP_ELECTIVE_COUNT,
  buildElectivesForCodes,
  buildInitialElectiveCodes,
  hasReflectAnswers,
  pickAlternateElectives,
} from "../lib/trackedElectives";
import { normalizeCode } from "../data/prerequisites";

const INK = "#0B2E22";
const GOLD_DEEP = "#8C7F4B";
const GREEN = "#1F7A54";
const SURFACE = "#FFFFFF";
const MUTED = "#5B6660";
const SUPPORT_TINT = "#F5F6F1";

/**
 * @param {number} percent
 * @returns {{ bg: string, color: string }}
 */
function matchColors(percent) {
  if (percent >= 75) return { bg: "#E8F5EE", color: GREEN };
  if (percent >= 50) return { bg: "#F3EED9", color: GOLD_DEEP };
  return { bg: "#F5F6F1", color: MUTED };
}

function ElectiveCard({ course, onRefresh, showRefresh }) {
  const statusMeta = {
    in_progress: { label: "In progress", bg: "#FFF8E8", color: "#C47A20" },
    remaining: { label: "Still needed", bg: "#F5F6F1", color: MUTED },
  }[course.status];
  const percent = Number.isFinite(course.matchPercent) ? course.matchPercent : null;
  const matchStyle = percent != null ? matchColors(percent) : null;

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: SUPPORT_TINT,
        border: "1px solid #DCDACD",
      }}
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
          {percent != null && matchStyle && (
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
          <RefreshCw size={11} /> Show 2 other electives
        </button>
      )}
    </div>
  );
}

/**
 * Electives section for the plan step — the student's top electives by Reflect
 * match (or the plan's tracked electives before they answer), with status from
 * the student record, catalog metadata from courseCatalog.js, and badges gated
 * on both reflect scores and real eligibility. Shows four cards; the top two
 * stay pinned and the bottom two can be swapped for another pair. Descriptions
 * use the syllabus-grounded reason from `recommendations` when one exists for a
 * course, otherwise the catalog blurb.
 */
export default function ElectivesPanel({ reflectAnswers = {}, recommendations = [] }) {
  const personalized = hasReflectAnswers(reflectAnswers);
  const [displayedCodes, setDisplayedCodes] = useState(() =>
    buildInitialElectiveCodes(reflectAnswers)
  );
  const [retiredCodes, setRetiredCodes] = useState([]);
  const answerKey = JSON.stringify({
    interestRatings: reflectAnswers.interestRatings || {},
    styleRatings: reflectAnswers.styleRatings || {},
    topicsEnjoyed: reflectAnswers.topicsEnjoyed || [],
    skillsWant: reflectAnswers.skillsWant || [],
    deliverables: reflectAnswers.deliverables || [],
  });

  useEffect(() => {
    setDisplayedCodes(buildInitialElectiveCodes(reflectAnswers));
    setRetiredCodes([]);
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

  const nextPair = useMemo(() => {
    const pinned = displayedCodes.slice(0, PINNED_ELECTIVE_COUNT);
    const currentBottom = displayedCodes.slice(PINNED_ELECTIVE_COUNT);
    const excludeUsed = [...pinned, ...retiredCodes, ...currentBottom];
    const fromUnused = pickAlternateElectives({
      excludeCodes: excludeUsed,
      reflectAnswers,
      count: SWAP_ELECTIVE_COUNT,
    });
    if (fromUnused.length >= SWAP_ELECTIVE_COUNT) {
      return { courses: fromUnused, wrap: false };
    }
    const wrapped = pickAlternateElectives({
      excludeCodes: displayedCodes,
      reflectAnswers,
      count: SWAP_ELECTIVE_COUNT,
    });
    return { courses: wrapped, wrap: true };
  }, [displayedCodes, reflectAnswers, retiredCodes]);

  const canRefreshBottom =
    orderedElectives.length > PINNED_ELECTIVE_COUNT &&
    nextPair.courses.length >= SWAP_ELECTIVE_COUNT;

  function handleRefreshBottom() {
    if (!canRefreshBottom) return;
    const pinned = displayedCodes.slice(0, PINNED_ELECTIVE_COUNT);
    const currentBottom = displayedCodes.slice(PINNED_ELECTIVE_COUNT);
    const nextCodes = nextPair.courses.map((course) => course.code);

    setDisplayedCodes([...pinned, ...nextCodes].slice(0, MAX_DISPLAYED_ELECTIVES));
    setRetiredCodes(nextPair.wrap ? [...currentBottom] : [...retiredCodes, ...currentBottom]);
  }

  return (
    <div className="rounded-2xl p-6 mb-10" style={{ background: SURFACE, border: "1px solid #E4E1D4" }}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-1">
        <div className="flex items-center gap-2 min-w-0">
          <Star size={16} color={GOLD_DEEP} className="shrink-0" />
          <h3 className="text-lg" style={{ fontFamily: "Georgia, serif", color: INK }}>
            Electives worth a look
          </h3>
        </div>
        {canRefreshBottom && (
          <button
            type="button"
            onClick={handleRefreshBottom}
            className="text-[12px] font-semibold flex items-center gap-1.5 shrink-0 self-start transition-opacity hover:opacity-80"
            style={{ color: GREEN }}
          >
            <RefreshCw size={13} /> Show 2 other electives
          </button>
        )}
      </div>
      <p className="text-sm mb-4" style={{ color: MUTED }}>
        {personalized
          ? "Your four best-matching electives, ranked by your Reflect answers."
          : "Electives from your plan. Answer the Reflect questions to rank these by your interests."}{" "}
        &ldquo;Recommended for you&rdquo; only appears when you&apos;re currently eligible and your answers point to the course. Completed courses are hidden. The top two stay put; refresh the bottom two for another pair.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        {orderedElectives.map((course, index) => (
          <ElectiveCard
            key={course.code}
            course={course}
            showRefresh={canRefreshBottom && index >= PINNED_ELECTIVE_COUNT}
            onRefresh={handleRefreshBottom}
          />
        ))}
      </div>
    </div>
  );
}
