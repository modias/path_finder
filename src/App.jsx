import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Heart, Compass, Sparkles, Wrench, ArrowRight, ArrowLeft, Check,
  BarChart3, Database, Cpu, LineChart, ShieldCheck, Users, Star, ChevronDown,
  Home, Calendar, Layers, Info, ClipboardList, CircleCheck,
} from "lucide-react";
import AdvisorChat from "./components/AdvisorChat";
import PersonalizedBar from "./components/PersonalizedBar";
import { RegistrationPanel } from "./components/Registration";
import {
  STAGES, ELECTIVES, NEXT_SEMESTERS, PLAN_INPUTS,
  CAREERS as CAREER_DATA,
} from "./data/curriculum";

const PAGE_BG = "#00543C";
const INK = "#0B2E22";
const GOLD = "#B3A369";
const GOLD_DEEP = "#8C7F4B";
const GREEN = "#1F7A54";
const SURFACE = "#FFFFFF";
const MUTED = "#5B6660";
const ON_DARK_MUTED = "#BFD9CB";
const SUPPORT_TINT = "#EEF0EA";

const QUESTION_GROUPS = [
  {
    key: "interests",
    icon: Heart,
    prompt: "What pulls your attention?",
    options: ["Sports & games", "Health & medicine", "Business & money", "Social justice", "Art & design", "The environment", "Storytelling", "Building things"],
  },
  {
    key: "values",
    icon: Compass,
    prompt: "What do you care about?",
    options: ["Fairness", "Truth in numbers", "Helping people directly", "Solving puzzles", "Making things simpler", "Being independent", "Working on a team", "Long-term impact"],
  },
  {
    key: "strengths",
    icon: Wrench,
    prompt: "Where are you already strong?",
    options: ["Math", "Writing", "Pattern-spotting", "Patience with detail", "Explaining ideas", "Coding basics", "Asking good questions", "Staying organized"],
  },
];

const REFLECTION_PROMPTS = [
  "What's a problem in the world you'd want to help fix?",
  "If you shadowed a data scientist for a day, what part of the job would you hope to see?",
  "What attracts you to data science, and what do you picture yourself doing with it?",
];

const CAREER_META = [
  { icon: BarChart3, photo: "https://i.pravatar.cc/400?img=47" },
  { icon: Database, photo: "https://i.pravatar.cc/400?img=32" },
  { icon: Cpu, photo: "https://i.pravatar.cc/400?img=13" },
  { icon: LineChart, photo: "https://i.pravatar.cc/400?img=5" },
  { icon: ShieldCheck, photo: "https://i.pravatar.cc/400?img=25" },
  { icon: Users, photo: "https://i.pravatar.cc/400?img=48" },
];

const CAREERS = CAREER_DATA.map((career, i) => ({ ...career, ...CAREER_META[i] }));

function Stepper({ step, setStep }) {
  const steps = ["Reflect", "Explore courses", "Your plan", "Meet the careers"];
  return (
    <div className="flex items-center gap-3 mb-10">
      {steps.map((label, i) => (
        <button key={label} onClick={() => setStep(i)} className="flex items-center gap-2" style={{ opacity: i <= step ? 1 : 0.5 }}>
          <span
            className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold shrink-0"
            style={{
              background: i < step ? GOLD : i === step ? "#FFFFFF" : "transparent",
              color: i <= step ? INK : "#FFFFFF",
              border: `1.5px solid ${i <= step ? GOLD : "#FFFFFF"}`,
            }}
          >
            {i < step ? <Check size={14} /> : i + 1}
          </span>
          <span className="text-sm hidden sm:inline" style={{ color: "#FFFFFF" }}>{label}</span>
          {i < steps.length - 1 && <span className="w-6 sm:w-10 h-px mx-1" style={{ background: "#FFFFFF", opacity: 0.35 }} />}
        </button>
      ))}
    </div>
  );
}

function ReflectStep({ selections, toggle, note, setNote, onNext }) {
  return (
    <div>
      <p className="text-xs tracking-widest uppercase mb-2" style={{ color: GOLD, fontFamily: "ui-monospace, monospace" }}>Step one</p>
      <h1 className="text-4xl sm:text-5xl mb-3 leading-tight" style={{ fontFamily: "Georgia, serif", color: "#FFFFFF" }}>
        Before the data,<br />a little about you.
      </h1>
      <p className="text-base mb-10 max-w-xl" style={{ color: ON_DARK_MUTED }}>
        There's no wrong answer here — this just shapes how we introduce you to the major. Pick whatever's true, then tell us the rest in your own words.
      </p>

      <div className="grid sm:grid-cols-3 gap-6 mb-10">
        {QUESTION_GROUPS.map((group) => {
          const Icon = group.icon;
          return (
            <div key={group.key}>
              <div className="flex items-center gap-2 mb-3">
                <Icon size={18} color={GOLD} />
                <h3 className="text-sm font-semibold" style={{ color: "#FFFFFF" }}>{group.prompt}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {group.options.map((opt) => {
                  const active = selections[group.key]?.has(opt);
                  return (
                    <button
                      key={opt}
                      onClick={() => toggle(group.key, opt)}
                      className="text-sm px-3 py-1.5 rounded-full border transition-colors text-left"
                      style={{
                        borderColor: active ? GOLD : "rgba(255,255,255,0.4)",
                        background: active ? GOLD : "transparent",
                        color: active ? INK : "#FFFFFF",
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl p-6 mb-8" style={{ background: SURFACE }}>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={18} color={GREEN} />
          <h3 className="text-sm font-semibold" style={{ color: INK }}>A few things to write about</h3>
        </div>
        <ul className="mb-4 space-y-1.5">
          {REFLECTION_PROMPTS.map((q) => (
            <li key={q} className="text-sm flex gap-2" style={{ color: MUTED }}>
              <span style={{ color: GOLD_DEEP }}>&bull;</span>{q}
            </li>
          ))}
        </ul>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Write a few sentences on any (or all) of the above..."
          rows={5}
          className="w-full rounded-xl p-4 text-sm outline-none"
          style={{ background: "#F5F6F1", border: "1px solid #D9D6C9", color: INK }}
        />
      </div>

      <button onClick={onNext} className="flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold" style={{ background: GOLD, color: INK }}>
        See where this leads <ArrowRight size={16} />
      </button>
    </div>
  );
}

function CourseCard({ course, recommended }) {
  const isCore = course.kind === "core";
  const statusMeta = {
    completed: { label: "Completed", bg: "#E8F5EE", color: GREEN },
    in_progress: { label: "In progress", bg: "#FFF8E8", color: "#C47A20" },
    remaining: { label: "Still needed", bg: "#F5F6F1", color: MUTED },
  }[course.status];

  return (
    <div
      className="rounded-xl p-4 mb-3 last:mb-0"
      style={{ background: isCore ? SURFACE : SUPPORT_TINT, border: `1px solid ${isCore ? GREEN : "#DCDACD"}` }}
    >
      <div className="flex items-center justify-between mb-2 gap-2">
        {statusMeta ? (
          <span
            className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full font-semibold"
            style={{ background: statusMeta.bg, color: statusMeta.color }}
          >
            {statusMeta.label}
          </span>
        ) : (
          <span
            className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full"
            style={{ background: isCore ? GREEN : "#DCDACD", color: isCore ? "#fff" : INK }}
          >
            {isCore ? "Core studio" : "Support"}
          </span>
        )}
        <span className="text-[11px] shrink-0" style={{ color: GOLD_DEEP }}>{course.hrs} hrs</span>
      </div>
      <p className="text-[11px] mb-0.5" style={{ fontFamily: "ui-monospace, monospace", color: MUTED }}>{course.code}</p>
      <h4 className="text-sm font-semibold mb-1" style={{ color: INK }}>{course.name}</h4>
      <p className="text-xs leading-relaxed" style={{ color: MUTED }}>{course.blurb}</p>
      {recommended && (
        <p className="text-[11px] font-semibold mt-2 flex items-center gap-1" style={{ color: GOLD_DEEP }}>
          <Star size={11} fill={GOLD_DEEP} /> Recommended for you
        </p>
      )}
    </div>
  );
}

function ExploreStep({ selections, onAskAdvisor }) {
  const [openStages, setOpenStages] = useState(new Set());
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

  const toggleStage = (title) => {
    setOpenStages((prev) => {
      const next = new Set(prev);
      next.has(title) ? next.delete(title) : next.add(title);
      return next;
    });
  };

  const isRecommended = (course) => {
    if (!course.recommendIf) return false;
    const chosen = selections[course.recommendIf.group];
    if (!chosen) return false;
    return course.recommendIf.options.some((o) => chosen.has(o));
  };

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
      {/* Personal plan — top of Explore courses */}
      <div
        className="mb-8 w-full rounded-2xl p-6 sm:p-8"
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
            className="text-4xl sm:text-5xl mb-3 leading-tight"
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

      <div className="grid md:grid-cols-2 gap-5 mb-6">
        {NEXT_SEMESTERS.map((sem) => (
          <SemesterCard key={sem.term} semester={sem} preferredLoad={loadLabel} />
        ))}
      </div>

      <div
        className="rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 mb-14"
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

      {/* Road through the major — pushed below personal plan */}
      <p className="text-xs tracking-widest uppercase mb-2" style={{ color: GOLD, fontFamily: "ui-monospace, monospace" }}>Step two</p>
      <h1 className="text-4xl sm:text-5xl mb-3 leading-tight" style={{ fontFamily: "Georgia, serif", color: "#FFFFFF" }}>
        The road through the major.
      </h1>
      <p className="text-base mb-8 max-w-2xl" style={{ color: ON_DARK_MUTED }}>
        Four stages, roughly one per year. Click a year to see its courses. Green cards are the required studio sequence (18 hrs); the rest are the computing and math courses that support it (31 hrs combined).
      </p>

      <div className="rounded-2xl p-6 mb-10" style={{ background: SURFACE, border: "1px solid #E4E1D4" }}>
        <div className="flex items-center gap-2 mb-1">
          <Star size={16} color={GOLD_DEEP} />
          <h3 className="text-lg" style={{ fontFamily: "Georgia, serif", color: INK }}>Electives worth a look</h3>
        </div>
        <p className="text-sm mb-4" style={{ color: MUTED }}>
          From your Degree Works electives. Highlighted ones connect to what you picked in step one.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ELECTIVES.map((e) => (
            <CourseCard key={e.code} course={{ ...e, kind: "support" }} recommended={isRecommended(e)} />
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STAGES.map((stage) => {
          const isOpen = openStages.has(stage.title);
          return (
            <div key={stage.title}>
              <button
                type="button"
                onClick={() => toggleStage(stage.title)}
                aria-expanded={isOpen}
                className="w-full rounded-xl px-4 py-3 mb-3 text-left transition-colors"
                style={{
                  background: INK,
                  border: `1.5px solid ${isOpen ? GOLD : "transparent"}`,
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest" style={{ color: GOLD }}>{stage.note}</p>
                    <h3 className="text-lg" style={{ fontFamily: "Georgia, serif", color: "#FFFFFF" }}>{stage.title}</h3>
                    <p className="text-[10px] mt-1" style={{ color: ON_DARK_MUTED }}>
                      {isOpen ? `${stage.courses.length} courses` : "Click to see courses"}
                    </p>
                  </div>
                  <ChevronDown
                    size={18}
                    color={GOLD}
                    className="shrink-0 mt-1 transition-transform duration-200"
                    style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                  />
                </div>
              </button>
              {isOpen && stage.courses.map((c) => (
                <CourseCard key={c.code} course={c} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

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

function SemesterCard({ semester, preferredLoad }) {
  const total = semester.courses.reduce((sum, c) => sum + c.credits, 0);
  const recommended = preferredLoad || semester.recommendedCredits;
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

      <div className="px-5 pb-2 overflow-x-auto">
        <table className="w-full min-w-[420px] text-left border-collapse">
          <thead>
            <tr style={{ borderBottom: "1px solid #E8E5DA" }}>
              {["Course", "Course title", "Category", "Credits"].map((h) => (
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
            {semester.courses.map((course) => (
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
                <td className="py-3 text-sm font-semibold text-right" style={{ color: INK }}>
                  {course.credits}
                </td>
              </tr>
            ))}
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

function inferCareerTarget(selections) {
  const interests = selections.interests || new Set();
  const values = selections.values || new Set();
  if (interests.has("Health & medicine")) return "Data scientist";
  if (interests.has("Business & money")) return "Data analyst";
  if (values.has("Fairness")) return "Data ethics & policy analyst";
  if (interests.has("Building things")) return "Data engineer";
  if (interests.has("Art & design") || interests.has("Storytelling")) return "UX / product analyst";
  return "Data scientist";
}

function RoadmapStep({ onAskAdvisor }) {
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <p className="text-xs tracking-widest uppercase mb-2" style={{ color: GOLD, fontFamily: "ui-monospace, monospace" }}>
            Step three
          </p>
          <h1 className="text-4xl sm:text-5xl mb-3 leading-tight" style={{ fontFamily: "Georgia, serif", color: "#FFFFFF" }}>
            Your plan.
          </h1>
          <p className="text-base max-w-2xl" style={{ color: ON_DARK_MUTED }}>
            Search by subject and course number (try DTSC + 1301), then add or drop sections for the term ahead.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            to="/degree-works"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: GREEN, color: "#FFFFFF" }}
          >
            <ClipboardList size={16} />
            Degree Works
          </Link>
          <button
            type="button"
            onClick={onAskAdvisor}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold"
            style={{ background: GOLD, color: INK }}
          >
            Ask your advisor
          </button>
        </div>
      </div>

      <RegistrationPanel showHeading={false} />
    </div>
  );
}

function CareerCard({ career, flipped, onToggle }) {
  const Icon = career.icon;
  return (
    <div className="flip-card" onClick={onToggle}>
      <div className={`flip-inner ${flipped ? "is-flipped" : ""}`}>
        {/* FRONT */}
        <div className="flip-face" style={{ background: SURFACE, border: "1px solid #E4E1D4", padding: 0 }}>
          <div className="relative" style={{ height: "62%" }}>
            <img src={career.photo} alt="" className="w-full h-full object-cover" style={{ display: "block" }} />
            <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${INK}E6, transparent 65%)` }} />
            <div
              className="absolute top-2.5 right-2.5 flex items-center justify-center rounded-full"
              style={{ width: 30, height: 30, background: GOLD }}
            >
              <Icon size={15} color={INK} />
            </div>
            <h4 className="absolute left-3.5 right-3.5 bottom-2.5 text-lg leading-tight" style={{ fontFamily: "Georgia, serif", color: "#FFFFFF" }}>
              {career.role}
            </h4>
          </div>
          <div className="flex flex-col flex-1 px-3.5 pt-2.5 pb-3">
            <p className="text-xs leading-snug" style={{ color: MUTED }}>{career.oneLiner}</p>
            <span className="text-[10px] mt-auto pt-1.5" style={{ color: GOLD_DEEP }}>Click to see details</span>
          </div>
        </div>

        {/* BACK */}
        <div className="flip-face flip-back" style={{ background: INK, color: "#fff" }}>
          <h4 className="text-sm font-semibold mb-2" style={{ color: GOLD, fontFamily: "Georgia, serif" }}>{career.role}</h4>
          <p className="text-[11px] leading-relaxed mb-2.5" style={{ color: "#E4EEE8" }}>{career.does}</p>

          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {career.skills.map((s) => (
              <span
                key={s}
                className="text-[10px] px-2 py-0.5 rounded-full"
                style={{ background: "rgba(179,163,105,0.18)", color: GOLD, border: `1px solid ${GOLD_DEEP}` }}
              >
                {s}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between mt-auto pt-1.5" style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}>
            <div>
              <p className="text-[9px] uppercase tracking-wide" style={{ color: "#9FB5AA" }}>Salary range</p>
              <p className="text-xs font-semibold">{career.salary}</p>
            </div>
            <span className="text-[9px]" style={{ color: "#9FB5AA" }}>Click to flip back</span>
          </div>
          <p className="text-[9px] uppercase tracking-wide mt-2" style={{ color: "#9FB5AA" }}>Typical employers</p>
          <p className="text-[11px]" style={{ color: "#D7E4DC" }}>{career.employers}</p>
        </div>
      </div>
    </div>
  );
}

function CareersStep({ flipped, toggleFlip }) {
  return (
    <div>
      <p className="text-xs tracking-widest uppercase mb-2" style={{ color: GOLD, fontFamily: "ui-monospace, monospace" }}>Step four</p>
      <h1 className="text-4xl sm:text-5xl mb-3 leading-tight" style={{ fontFamily: "Georgia, serif", color: "#FFFFFF" }}>
        Where this curriculum leads.
      </h1>
      <p className="text-base mb-8 max-w-xl" style={{ color: ON_DARK_MUTED }}>
        Every role below draws directly on the courses you just looked at. Flip a card for what they do, pay, and who hires for it.
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-4">
        {CAREERS.map((c, i) => (
          <CareerCard key={c.role} career={c} flipped={flipped.has(i)} onToggle={() => toggleFlip(i)} />
        ))}
      </div>
      <p className="text-[11px]" style={{ color: ON_DARK_MUTED }}>
        Salary ranges are approximate entry-level, U.S. national figures — actual pay varies by employer and location.
      </p>
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState(1);
  const [selections, setSelections] = useState({});
  const [note, setNote] = useState("");
  const [flipped, setFlipped] = useState(new Set());
  const [chatOpen, setChatOpen] = useState(false);

  const careerTarget = inferCareerTarget(selections);

  const toggle = (groupKey, opt) => {
    setSelections((prev) => {
      const next = new Set(prev[groupKey] || []);
      next.has(opt) ? next.delete(opt) : next.add(opt);
      return { ...prev, [groupKey]: next };
    });
  };

  const toggleFlip = (i) => {
    setFlipped((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  return (
    <div className="w-full min-h-screen" style={{ background: PAGE_BG }}>
      <style>{`
        .flip-card { perspective: 1200px; height: 300px; cursor: pointer; }
        .flip-inner { position: relative; width: 100%; height: 100%; transition: transform 0.5s; transform-style: preserve-3d; box-shadow: 0 6px 16px rgba(0,0,0,0.18); border-radius: 16px; }
        .flip-inner.is-flipped { transform: rotateY(180deg); }
        .flip-face { position: absolute; inset: 0; backface-visibility: hidden; border-radius: 16px; padding: 18px; display: flex; flex-direction: column; overflow: hidden; }
        .flip-back { transform: rotateY(180deg); }
        @media (hover: hover) {
          .flip-card:hover .flip-inner { transform: rotateY(180deg); }
        }
        .preferred-load-input::-webkit-outer-spin-button,
        .preferred-load-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .preferred-load-input { -moz-appearance: textfield; appearance: textfield; }
      `}</style>

      <div className={`mx-auto px-6 py-14 ${step === 1 || step === 2 ? "max-w-7xl" : "max-w-5xl"}`}>
        <div className="flex items-center justify-between gap-4 mb-8">
          <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <img
              src="/unc-charlotte-logo.png?v=5"
              alt="University of North Carolina Charlotte"
              className="h-12 sm:h-14 w-auto object-contain"
            />
            <span className="text-xs tracking-widest uppercase" style={{ color: ON_DARK_MUTED, fontFamily: "ui-monospace, monospace" }}>
              School of Data Science
            </span>
          </Link>
          <Link to="/" className="flex items-center gap-2 text-sm" style={{ color: "#FFFFFF" }}>
            <Home size={16} /> Home
          </Link>
        </div>

        <Stepper step={step} setStep={setStep} />

        {step >= 1 && (
          <PersonalizedBar
            onOpenChat={() => setChatOpen(true)}
            onViewRoadmap={() => setStep(2)}
          />
        )}

        {step === 0 && <ReflectStep selections={selections} toggle={toggle} note={note} setNote={setNote} onNext={() => setStep(1)} />}
        {step === 1 && <ExploreStep selections={selections} onAskAdvisor={() => setChatOpen(true)} />}
        {step === 2 && <RoadmapStep onAskAdvisor={() => setChatOpen(true)} />}
        {step === 3 && <CareersStep flipped={flipped} toggleFlip={toggleFlip} />}

        <div className="flex items-center justify-between mt-12">
          {step > 0 ? (
            <button onClick={() => setStep(step - 1)} className="flex items-center gap-2 text-sm" style={{ color: "#FFFFFF" }}>
              <ArrowLeft size={16} /> Back
            </button>
          ) : <span />}
          {step < 3 && (
            <button
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold"
              style={{ background: GOLD, color: INK }}
            >
              {step === 0 ? "See the courses" : step === 1 ? "See your roadmap" : "See the careers"} <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>

      <AdvisorChat
        isOpen={chatOpen}
        onOpenChange={setChatOpen}
        context={{ step, selections, note, careerTarget }}
        showFab={step < 1}
      />
    </div>
  );
}
