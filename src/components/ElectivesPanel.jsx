import { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import { buildTrackedElectives } from "../lib/trackedElectives";

const INK = "#0B2E22";
const GOLD = "#B3A369";
const GOLD_DEEP = "#8C7F4B";
const GREEN = "#1F7A54";
const SURFACE = "#FFFFFF";
const MUTED = "#5B6660";
const SUPPORT_TINT = "#F5F6F1";

const STATUS_ORDER = { in_progress: 0, remaining: 1 };

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

      return a.code.localeCompare(b.code);
    });
}

function pickElectiveCodes(electives, targetCredits) {
  const picked = new Set();
  let total = 0;
  for (const course of electives) {
    if (total + course.hrs <= targetCredits) {
      picked.add(course.code);
      total += course.hrs;
    }
  }
  return picked;
}

function ElectiveCard({ course, fitsExtraLoad }) {
  const statusMeta = {
    in_progress: { label: "In progress", bg: "#FFF8E8", color: "#C47A20" },
    remaining: { label: "Still needed", bg: "#F5F6F1", color: MUTED },
  }[course.status];

  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: SUPPORT_TINT,
        border: `1px solid ${fitsExtraLoad ? GOLD : "#DCDACD"}`,
      }}
    >
      <div className="flex items-center justify-between mb-2 gap-2">
        {statusMeta && (
          <span
            className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full font-semibold"
            style={{ background: statusMeta.bg, color: statusMeta.color }}
          >
            {statusMeta.label}
          </span>
        )}
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
      {fitsExtraLoad && (
        <p className="text-[11px] font-semibold mt-2" style={{ color: GREEN }}>
          Fits your extra load
        </p>
      )}
    </div>
  );
}

/**
 * Electives section for the plan step — tracked electives with status from the
 * student record, catalog metadata from courseCatalog.js, and badges gated on
 * both reflect scores and real eligibility.
 */
export default function ElectivesPanel({ reflectAnswers = {}, extraCredits = 0 }) {
  const [draftElectiveCredits, setDraftElectiveCredits] = useState("");
  const [appliedElectiveCredits, setAppliedElectiveCredits] = useState(0);
  const [appliedFlash, setAppliedFlash] = useState("");

  const orderedElectives = useMemo(
    () => sortElectives(buildTrackedElectives(reflectAnswers)),
    [reflectAnswers]
  );

  const fitsExtraLoad = useMemo(
    () => pickElectiveCodes(orderedElectives, appliedElectiveCredits),
    [orderedElectives, appliedElectiveCredits]
  );

  useEffect(() => {
    setAppliedElectiveCredits(0);
    setAppliedFlash("");
    if (extraCredits > 0) {
      const defaultCredits = Math.min(3, extraCredits);
      setDraftElectiveCredits(String(defaultCredits));
    } else {
      setDraftElectiveCredits("");
    }
  }, [extraCredits]);

  const draftNum = Number(draftElectiveCredits);
  const hasValidDraft =
    Number.isFinite(draftNum) && draftElectiveCredits !== "" && draftNum > 0 && draftNum <= extraCredits;
  const hasDraftChanges = hasValidDraft && draftNum !== appliedElectiveCredits;

  const handleApply = () => {
    if (!hasValidDraft) return;
    setAppliedElectiveCredits(draftNum);
    setAppliedFlash("Electives updated for your extra credits.");
    window.clearTimeout(handleApply._t);
    handleApply._t = window.setTimeout(() => setAppliedFlash(""), 2500);
  };

  return (
    <div className="rounded-2xl p-6 mb-10" style={{ background: SURFACE, border: "1px solid #E4E1D4" }}>
      <div className="flex items-center gap-2 mb-1">
        <Star size={16} color={GOLD_DEEP} />
        <h3 className="text-lg" style={{ fontFamily: "Georgia, serif", color: INK }}>
          Electives worth a look
        </h3>
      </div>
      <p className="text-sm mb-4" style={{ color: MUTED }}>
        Your tracked electives, with titles from the catalog. &ldquo;Recommended for you&rdquo; only appears when you&apos;re currently eligible and your ratings match. Completed courses are hidden.
      </p>

      {extraCredits > 0 && (
        <div
          className="mb-5 rounded-xl p-4"
          style={{ background: "#F3EED9", border: "1px solid #E4E1D4" }}
        >
          <p className="text-sm font-semibold mb-1" style={{ color: INK }}>
            Room in your load
          </p>
          <p className="text-xs mb-3" style={{ color: MUTED }}>
            Your preferred load has up to {extraCredits} extra credits for electives in Fall 2026.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="number"
              min={1}
              max={extraCredits}
              step={3}
              value={draftElectiveCredits}
              onChange={(e) => setDraftElectiveCredits(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleApply();
              }}
              aria-label="Elective credits to add"
              className="text-sm font-semibold text-center outline-none preferred-load-input"
              style={{
                width: "2.75rem",
                height: "1.75rem",
                background: SURFACE,
                border: "1px solid #DCDACD",
                borderRadius: "6px",
                color: INK,
                padding: "0 4px",
              }}
            />
            <span className="text-sm font-semibold" style={{ color: INK }}>
              elective credits
            </span>
            <button
              type="button"
              onClick={handleApply}
              disabled={!hasDraftChanges}
              className="text-[11px] px-3 py-1.5 rounded-full font-semibold transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: GOLD, color: INK }}
            >
              Apply
            </button>
            {appliedFlash && (
              <p className="text-[11px] font-medium w-full sm:w-auto" style={{ color: GOLD_DEEP }}>
                {appliedFlash}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {orderedElectives.map((course) => (
          <ElectiveCard
            key={course.code}
            course={course}
            fitsExtraLoad={fitsExtraLoad.has(course.code)}
          />
        ))}
      </div>
    </div>
  );
}
