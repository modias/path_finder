import { useState } from "react";
import { Calendar, CircleCheck, Info, Layers, Plus, Check } from "lucide-react";
import { NEXT_SEMESTERS, PLAN_INPUTS } from "../data/curriculum";
import { useSchedule } from "../data/schedule";

const INK = "#0B2E22";
const GOLD = "#B3A369";
const GOLD_DEEP = "#8C7F4B";
const GREEN = "#1F7A54";
const SURFACE = "#FFFFFF";
const MUTED = "#5B6660";
const ON_DARK_MUTED = "#BFD9CB";

const CATEGORY_META = {
  required: { label: "Required", bg: "#E8F5EE", color: GREEN },
  general_ed: { label: "General Ed", bg: "#E8F1FB", color: "#1A5FA8" },
  elective: { label: "Elective", bg: "#F3EAF8", color: "#7B4B9A" },
};

function CategoryBadge({ category }) {
  const meta = CATEGORY_META[category] || CATEGORY_META.elective;
  return (
    <span
      className="inline-flex text-[10px] uppercase tracking-wide font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
      style={{ background: meta.bg, color: meta.color }}
    >
      {meta.label}
    </span>
  );
}

function SemesterCard({ semester, preferredLoad, canAddToPlan = false }) {
  const { addFromPlanCourse, isOnSchedule } = useSchedule();
  const [flash, setFlash] = useState("");
  const total = semester.courses.reduce((sum, c) => sum + c.credits, 0);
  const recommended = preferredLoad || semester.recommendedCredits;

  const handleAdd = (course) => {
    const result = addFromPlanCourse(course);
    if (result.ok) {
      setFlash(`Added ${course.code} to your schedule.`);
    } else if (result.reason === "duplicate") {
      setFlash(`${course.code} is already on your schedule.`);
    } else {
      setFlash(`Could not add ${course.code}.`);
    }
    window.clearTimeout(handleAdd._t);
    handleAdd._t = window.setTimeout(() => setFlash(""), 2500);
  };

  return (
    <div
      className="rounded-2xl overflow-hidden flex flex-col"
      style={{ background: SURFACE, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
    >
      <div className="px-5 pt-5 pb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Calendar size={18} color={GOLD_DEEP} />
          <h3 className="text-xl font-semibold" style={{ color: INK, fontFamily: "Georgia, serif" }}>
            {semester.term}
          </h3>
        </div>
        <span
          className="text-[11px] font-semibold px-3 py-1 rounded-full"
          style={{ background: "#F3EED9", color: GOLD_DEEP }}
        >
          Recommended: {recommended} credits
        </span>
      </div>

      {flash && (
        <div className="mx-5 mb-3 rounded-lg px-3 py-2 text-xs font-medium" style={{ background: "#E8F5EE", color: GREEN }}>
          {flash}
        </div>
      )}

      <div className="px-5 pb-2 overflow-x-auto">
        <table className="w-full min-w-[420px] text-left border-collapse">
          <thead>
            <tr style={{ borderBottom: "1px solid #E8E5DA" }}>
              {[
                "Course",
                "Course title",
                "Category",
                "Credits",
                ...(canAddToPlan ? ["Plan"] : []),
              ].map((h) => (
                <th
                  key={h}
                  className="pb-2 pr-3 text-[10px] uppercase tracking-widest font-semibold"
                  style={{ color: MUTED }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {semester.courses.map((course) => {
              const onSchedule = canAddToPlan && isOnSchedule(course);
              return (
                <tr key={`${semester.term}-${course.code}-${course.title}`} style={{ borderBottom: "1px solid #F0EEE6" }}>
                  <td className="py-3 pr-3 text-sm font-semibold whitespace-nowrap" style={{ color: INK }}>
                    {course.code}
                  </td>
                  <td className="py-3 pr-3 text-sm" style={{ color: MUTED }}>
                    {course.title}
                  </td>
                  <td className="py-3 pr-3">
                    <CategoryBadge category={course.category} />
                  </td>
                  <td className="py-3 pr-3 text-sm font-semibold text-right" style={{ color: INK }}>
                    {course.credits}
                  </td>
                  {canAddToPlan && (
                    <td className="py-3 text-right whitespace-nowrap">
                      {onSchedule ? (
                        <span
                          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-full"
                          style={{ background: "#E8F5EE", color: GREEN }}
                        >
                          <Check size={12} /> On schedule
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAdd(course)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-full transition-opacity hover:opacity-90"
                          style={{ background: GOLD, color: INK }}
                        >
                          <Plus size={12} /> Add to plan
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div
        className="mt-auto mx-5 mb-5 pt-3 flex items-center justify-between"
        style={{ borderTop: "1px solid #E8E5DA" }}
      >
        <span className="text-sm font-semibold" style={{ color: GOLD_DEEP }}>Total Credits</span>
        <span className="text-sm font-bold" style={{ color: GOLD_DEEP }}>{total} credits</span>
      </div>
    </div>
  );
}

/**
 * Personal plan banner + next-semester cards (shared by Your plan + Register courses).
 */
export default function PersonalPlanPanel({ onAskAdvisor, compact = false }) {
  const [preferredLoad, setPreferredLoad] = useState(String(PLAN_INPUTS.preferredLoad));

  const loadNum = Number(preferredLoad);
  const hasValidLoad = Number.isFinite(loadNum) && preferredLoad !== "";
  const loadLabel = hasValidLoad ? loadNum : PLAN_INPUTS.preferredLoad;

  let loadWarning = null;
  if (hasValidLoad && loadNum < 12) {
    loadWarning = "You will not be full-time if you take fewer than 12 credits.";
  } else if (hasValidLoad && loadNum > 18) {
    loadWarning = "Taking more than 18 credits? Talk to an advisor first.";
  }

  const summaryItems = [
    {
      icon: CircleCheck,
      label: "Completed",
      content: (
        <p className="text-sm font-semibold" style={{ color: "#FFFFFF", lineHeight: 1.3 }}>
          {PLAN_INPUTS.completedCredits} credits
        </p>
      ),
    },
    {
      icon: Layers,
      label: "Preferred load",
      content: (
        <div>
          <div className="flex items-center gap-1.5" style={{ whiteSpace: "nowrap" }}>
            <input
              type="number"
              min={1}
              max={24}
              value={preferredLoad}
              onChange={(e) => setPreferredLoad(e.target.value)}
              aria-label="Preferred credits per semester"
              aria-invalid={!!loadWarning}
              className="text-sm font-semibold text-center outline-none preferred-load-input"
              style={{
                width: "2.25rem",
                height: "1.5rem",
                background: "rgba(255,255,255,0.12)",
                border: `1px solid ${loadWarning ? "#F0A8A8" : "rgba(255,255,255,0.45)"}`,
                borderRadius: "6px",
                color: "#FFFFFF",
                padding: "0 2px",
                lineHeight: 1,
              }}
            />
            <span className="text-sm font-semibold" style={{ color: "#FFFFFF", lineHeight: 1.3 }}>
              credits
            </span>
          </div>
          {loadWarning && (
            <p className="text-[11px] mt-1.5 leading-snug" style={{ color: "#F5C6C6", whiteSpace: "normal", maxWidth: "11rem" }}>
              {loadWarning}
            </p>
          )}
        </div>
      ),
    },
    {
      icon: Calendar,
      label: "Starting semester",
      content: (
        <p className="text-sm font-semibold" style={{ color: "#FFFFFF", lineHeight: 1.3 }}>
          {PLAN_INPUTS.startingSemester}
        </p>
      ),
    },
  ];

  return (
    <div>
      <div
        className={`${compact ? "mb-6" : "mb-8"} w-full rounded-2xl p-6 sm:p-8`}
        style={{
          background: "linear-gradient(90deg, #003528 0%, #004D38 45%, #003528 100%)",
          border: "1.5px solid rgba(191, 217, 203, 0.4)",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "28px",
        }}
      >
        <div style={{ flex: "1 1 280px", minWidth: 0 }}>
          <p
            className="text-xs tracking-[0.18em] uppercase mb-2"
            style={{ color: GOLD, fontFamily: "ui-monospace, monospace" }}
          >
            Your personal plan
          </p>
          <h1
            className={`${compact ? "text-3xl sm:text-4xl" : "text-4xl sm:text-5xl"} mb-3 leading-tight`}
            style={{ fontFamily: "Georgia, serif", color: "#FFFFFF" }}
          >
            What to take next
          </h1>
          <p className="text-base leading-relaxed" style={{ color: "#FFFFFF", maxWidth: "36rem" }}>
            Based on your completed courses and prerequisites, here is your recommended schedule.
          </p>
        </div>

        <div
          className="rounded-xl"
          style={{
            flex: "1 1 420px",
            border: "1px solid rgba(255,255,255,0.4)",
            background: "rgba(0, 20, 14, 0.25)",
            padding: "16px 20px",
          }}
        >
          <p
            className="text-[10px] tracking-[0.18em] uppercase mb-3"
            style={{ color: GOLD, fontFamily: "ui-monospace, monospace" }}
          >
            Your input summary
          </p>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {summaryItems.map(({ icon: Icon, label, content }, i) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  padding: "4px 16px",
                  paddingLeft: i === 0 ? 0 : 16,
                  borderLeft: i === 0 ? "none" : "1px solid rgba(255,255,255,0.28)",
                  flex: "1 1 140px",
                  minWidth: "140px",
                }}
              >
                <Icon size={17} color="#FFFFFF" style={{ flexShrink: 0, marginTop: 2 }} strokeWidth={1.75} />
                <div>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.72)", lineHeight: 1.3 }}>{label}</p>
                  {content}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={`grid md:grid-cols-2 gap-5 ${compact ? "mb-4" : "mb-6"}`}>
        {NEXT_SEMESTERS.map((sem) => (
          <SemesterCard
            key={sem.term}
            semester={sem}
            preferredLoad={loadLabel}
            canAddToPlan={sem.term === "Fall 2026"}
          />
        ))}
      </div>

      {onAskAdvisor && (
        <div
          className={`rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 ${compact ? "mb-8" : "mb-14"}`}
          style={{ border: "1px solid rgba(191,217,203,0.45)", background: "rgba(11, 46, 34, 0.35)" }}
        >
          <Info size={18} color={GOLD} className="shrink-0" />
          <p className="text-sm flex-1" style={{ color: ON_DARK_MUTED }}>
            This plan is a starting point — confirm course availability and prerequisites with your academic advisor before registering.
          </p>
          <button
            type="button"
            onClick={onAskAdvisor}
            className="text-xs px-4 py-2 rounded-full font-semibold whitespace-nowrap shrink-0"
            style={{ background: GOLD, color: INK }}
          >
            Ask your advisor
          </button>
        </div>
      )}
    </div>
  );
}
