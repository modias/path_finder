import { useMemo, useState } from "react";
import { RefreshCw, Star } from "lucide-react";
import {
  LOW_MATCH_REFRESH_PERCENT,
  MAX_DISPLAYED_ELECTIVES,
  buildElectivesForCodes,
  buildInitialElectiveCodes,
  pickAlternateElective,
} from "../lib/trackedElectives";
import { normalizeCode } from "../data/prerequisites";

const INK = "#0B2E22";
const GOLD_DEEP = "#8C7F4B";
const GREEN = "#1F7A54";
const SURFACE = "#FFFFFF";
const MUTED = "#5B6660";
const SUPPORT_TINT = "#F5F6F1";

const STATUS_ORDER = { in_progress: 0, remaining: 1 };

/**
 * @param {number} percent
 * @returns {{ bg: string, color: string }}
 */
function matchColors(percent) {
  if (percent >= 75) return { bg: "#E8F5EE", color: GREEN };
  if (percent >= 50) return { bg: "#F3EED9", color: GOLD_DEEP };
  return { bg: "#F5F6F1", color: MUTED };
}

function sortElectives(electives) {
  return [...electives]
    .filter((course) => course.status !== "completed")
    .sort((a, b) => {
      const aRec = a.recommended ? 0 : 1;
      const bRec = b.recommended ? 0 : 1;
      if (aRec !== bRec) return aRec - bRec;

      const aStatus = STATUS_ORDER[a.status] ?? 2;
      const bStatus = STATUS_ORDER[b.status] ?? 2;
      if (aStatus !== bStatus) return aStatus - bStatus;

      const aPct = a.matchPercent ?? -1;
      const bPct = b.matchPercent ?? -1;
      if (aPct !== bPct) return bPct - aPct;

      return a.code.localeCompare(b.code);
    })
    .slice(0, MAX_DISPLAYED_ELECTIVES);
}

function ElectiveCard({ course, onRefresh, canRefresh }) {
  const statusMeta = {
    in_progress: { label: "In progress", bg: "#FFF8E8", color: "#C47A20" },
    remaining: { label: "Still needed", bg: "#F5F6F1", color: MUTED },
  }[course.status];
  const percent = Number.isFinite(course.matchPercent) ? course.matchPercent : null;
  const matchStyle = percent != null ? matchColors(percent) : null;
  const showRefresh =
    percent != null && percent < LOW_MATCH_REFRESH_PERCENT && canRefresh && onRefresh;

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
        {course.blurb}
      </p>
      {course.recommended && (
        <p className="text-[11px] font-semibold mt-2 flex items-center gap-1" style={{ color: GOLD_DEEP }}>
          <Star size={11} fill={GOLD_DEEP} /> Recommended for you
        </p>
      )}
      {showRefresh && (
        <button
          type="button"
          onClick={() => onRefresh(course.code)}
          className="text-[11px] font-semibold mt-2 flex items-center gap-1.5 transition-opacity hover:opacity-80"
          style={{ color: MUTED }}
        >
          <RefreshCw size={11} /> Show another elective
        </button>
      )}
    </div>
  );
}

/**
 * Electives section for the plan step — tracked electives with status from the
 * student record, catalog metadata from courseCatalog.js, and badges gated on
 * both reflect scores and real eligibility. Shows up to four cards; weak matches
 * can be swapped for another outside elective.
 */
export default function ElectivesPanel({ reflectAnswers = {} }) {
  const [displayedCodes, setDisplayedCodes] = useState(() =>
    buildInitialElectiveCodes(reflectAnswers)
  );

  const orderedElectives = useMemo(
    () => sortElectives(buildElectivesForCodes(displayedCodes, reflectAnswers)),
    [displayedCodes, reflectAnswers]
  );

  const hasAlternate = useMemo(
    () =>
      Boolean(
        pickAlternateElective({
          excludeCodes: displayedCodes,
          reflectAnswers,
        })
      ),
    [displayedCodes, reflectAnswers]
  );

  function handleRefresh(codeToReplace) {
    const next = pickAlternateElective({
      excludeCodes: displayedCodes,
      reflectAnswers,
    });
    if (!next) return;

    const target = normalizeCode(codeToReplace);
    setDisplayedCodes((prev) =>
      prev.map((code) => (code === target ? next.code : code))
    );
  }

  return (
    <div className="rounded-2xl p-6 mb-10" style={{ background: SURFACE, border: "1px solid #E4E1D4" }}>
      <div className="flex items-center gap-2 mb-1">
        <Star size={16} color={GOLD_DEEP} />
        <h3 className="text-lg" style={{ fontFamily: "Georgia, serif", color: INK }}>
          Electives worth a look
        </h3>
      </div>
      <p className="text-sm mb-4" style={{ color: MUTED }}>
        Up to four electives from your plan and the catalog. &ldquo;Recommended for you&rdquo; only appears when you&apos;re currently eligible and your ratings match. Completed courses are hidden. Weak matches can be swapped for another elective.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        {orderedElectives.map((course) => (
          <ElectiveCard
            key={course.code}
            course={course}
            canRefresh={hasAlternate}
            onRefresh={handleRefresh}
          />
        ))}
      </div>
    </div>
  );
}
