import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sparkles, ArrowRight, ArrowLeft, Check,
  BarChart3, Database, Cpu, LineChart, ShieldCheck, Users, Star, ChevronDown,
  Home, NotebookPen, Heart, Compass,
} from "lucide-react";
import RatingRow from "./components/RatingRow";
import { INTEREST_QUESTIONS, STYLE_QUESTIONS, INDUSTRY_OPTIONS } from "./data/reflectQuestions";
import { apiFetch } from "./lib/api";
import { friendlyApiError, parseJsonResponse } from "./lib/apiResponse";
import { buildReflectAnswers, inferCareerTarget } from "./lib/reflectScoring";
import { rankCareersForStudent } from "./lib/careerFromCourses";
import AdvisorChat from "./components/AdvisorChat";
import PersonalizedBar from "./components/PersonalizedBar";
import CatalogBrowser from "./components/CatalogBrowser";
import ElectivesPanel from "./components/ElectivesPanel";
import CourseAdvisor from "./components/CourseAdvisor";
import {
  STAGES,
  PLAN_INPUTS,
  NEXT_SEMESTERS,
  CAREERS as CAREER_DATA,
  REFLECT_TERM_OPTIONS,
  REFLECT_CREDIT_LOAD_OPTIONS,
} from "./data/curriculum";
import { buildStudentRecord } from "./lib/studentRecord";
import { filterPlanSemesters } from "./lib/filterPlanSemesters";

const PAGE_BG = "#00543C";
const INK = "#0B2E22";
const GOLD = "#B3A369";
const GOLD_DEEP = "#8C7F4B";
const GREEN = "#1F7A54";
const SURFACE = "#FFFFFF";
const MUTED = "#5B6660";
const ON_DARK_MUTED = "#BFD9CB";
const SUPPORT_TINT = "#EEF0EA";

const DEFAULT_REGISTER_TERM = REFLECT_TERM_OPTIONS[0] || "";
const DEFAULT_CREDIT_LOAD = REFLECT_CREDIT_LOAD_OPTIONS[1] || "";

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
  const steps = ["Reflect", "Your plan", "Explore courses", "Meet the careers"];
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

function ReflectStep({
  interestRatings,
  setInterestRating,
  styleRatings,
  setStyleRating,
  industries,
  toggleIndustry,
  note,
  setNote,
  onNext,
  onGetRecommendations,
  recommendLoading,
  recommendError,
  recommendSummary,
  recommendations,
}) {
  return (
    <div>
      <p className="text-xs tracking-widest uppercase mb-2" style={{ color: GOLD, fontFamily: "ui-monospace, monospace" }}>Step one</p>
      <h1 className="text-4xl sm:text-5xl mb-3 leading-tight" style={{ fontFamily: "Georgia, serif", color: "#FFFFFF" }}>
        Before the data,<br />a little about you.
      </h1>
      <p className="text-base mb-10 max-w-xl" style={{ color: ON_DARK_MUTED }}>
        Rate each area honestly — there's no wrong answer. Your ratings shape which electives we highlight and recommend, not which ones you're allowed to take.
      </p>

      <div className="rounded-2xl p-6 mb-8" style={{ background: "rgba(11,46,34,0.55)", border: "1px solid rgba(179,163,105,0.35)" }}>
        <div className="flex items-center gap-2 mb-5">
          <Heart size={18} color={GOLD} />
          <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: GOLD }}>
            Group 1 — Interest by specialty area
          </h3>
        </div>
        {INTEREST_QUESTIONS.map((question) => (
          <RatingRow
            key={question.key}
            prompt={question.prompt}
            lowLabel={question.lowLabel}
            highLabel={question.highLabel}
            value={interestRatings[question.key] ?? null}
            onChange={(rating) => setInterestRating(question.key, rating)}
          />
        ))}
      </div>

      <div className="rounded-2xl p-6 mb-8" style={{ background: "rgba(11,46,34,0.55)", border: "1px solid rgba(179,163,105,0.35)" }}>
        <div className="flex items-center gap-2 mb-5">
          <Compass size={18} color={GOLD} />
          <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: GOLD }}>
            Group 2 — Work style &amp; comfort
          </h3>
        </div>
        {STYLE_QUESTIONS.map((question) => (
          <RatingRow
            key={question.key}
            prompt={question.prompt}
            lowLabel={question.lowLabel}
            highLabel={question.highLabel}
            value={styleRatings[question.key] ?? null}
            onChange={(rating) => setStyleRating(question.key, rating)}
          />
        ))}
      </div>

      <div className="rounded-2xl p-6 mb-8" style={{ background: "rgba(11,46,34,0.55)", border: "1px solid rgba(179,163,105,0.35)" }}>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={18} color={GOLD} />
          <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: GOLD }}>
            Industries you&apos;re curious about
          </h3>
        </div>
        <p className="text-sm mb-4" style={{ color: ON_DARK_MUTED }}>
          Optional — pick any that interest you. Matching electives get a small boost.
        </p>
        <div className="flex flex-wrap gap-2">
          {INDUSTRY_OPTIONS.map((option) => {
            const selected = industries.includes(option.key);
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => toggleIndustry(option.key)}
                className="text-sm px-3 py-1.5 rounded-full transition-opacity"
                style={{
                  background: selected ? GOLD : "transparent",
                  color: selected ? INK : "#FFFFFF",
                  border: `1.5px solid ${selected ? GOLD : "rgba(255,255,255,0.45)"}`,
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl p-6 mb-8" style={{ background: SURFACE }}>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={18} color={GREEN} />
          <h3 className="text-sm font-semibold" style={{ color: INK }}>Anything else your advisor should know?</h3>
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional — constraints, goals, or context we should keep in mind..."
          rows={4}
          className="w-full rounded-xl p-4 text-sm outline-none"
          style={{ background: "#F5F6F1", border: "1px solid #D9D6C9", color: INK }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-2">
        <button
          type="button"
          onClick={onGetRecommendations}
          disabled={recommendLoading}
          className="flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold disabled:opacity-50"
          style={{ background: GREEN, color: "#FFFFFF" }}
        >
          <Sparkles size={16} />
          {recommendLoading ? "Finding courses..." : "Get course recommendations"}
        </button>
        <button onClick={onNext} className="flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold" style={{ background: GOLD, color: INK }}>
          See where this leads <ArrowRight size={16} />
        </button>
      </div>

      <CourseAdvisor
        loading={recommendLoading}
        error={recommendError}
        summary={recommendSummary}
        recommendations={recommendations}
      />
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

function ExploreStep() {
  return (
    <div>
      <p className="text-xs tracking-widest uppercase mb-2" style={{ color: GOLD, fontFamily: "ui-monospace, monospace" }}>
        Step two
      </p>
      <h1 className="text-4xl sm:text-5xl mb-3 leading-tight" style={{ fontFamily: "Georgia, serif", color: "#FFFFFF" }}>
        Explore courses.
      </h1>
      <p className="text-base mb-8 max-w-2xl" style={{ color: ON_DARK_MUTED }}>
        Browse the catalog by Core (Gen Ed, Computing, DS Core, Capstone) or Electives outside the major.
      </p>

      <CatalogBrowser registerPath="/register-courses" />
    </div>
  );
}

function RoadmapStep({ reflectAnswers, onAskAdvisor }) {
  const [openStages, setOpenStages] = useState(new Set());

  const extraElectiveCredits = useMemo(() => {
    const record = buildStudentRecord();
    const plan = filterPlanSemesters(NEXT_SEMESTERS, record, {
      creditLoad: PLAN_INPUTS.preferredLoad,
    });
    const fallCredits = (plan[0]?.courses || []).reduce((sum, course) => sum + course.credits, 0);
    return Math.max(0, PLAN_INPUTS.preferredLoad - fallCredits);
  }, []);

  const toggleStage = (title) => {
    setOpenStages((prev) => {
      const next = new Set(prev);
      next.has(title) ? next.delete(title) : next.add(title);
      return next;
    });
  };

  return (
    <div>
      <p className="text-xs tracking-widest uppercase mb-2" style={{ color: GOLD, fontFamily: "ui-monospace, monospace" }}>
        Step three
      </p>
      <h1 className="text-4xl sm:text-5xl mb-3 leading-tight" style={{ fontFamily: "Georgia, serif", color: "#FFFFFF" }}>
        Your plan.
      </h1>
      <p className="text-base mb-8 max-w-2xl" style={{ color: ON_DARK_MUTED }}>
        Electives worth a look, and the road through the major.
      </p>

      <div className="flex flex-wrap gap-3 mb-8">
        <Link
          to="/register-courses"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ background: GOLD, color: INK }}
        >
          <NotebookPen size={16} />
          Register courses
        </Link>
        <button
          type="button"
          onClick={onAskAdvisor}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold"
          style={{ background: "transparent", color: "#FFFFFF", border: "1.5px solid rgba(255,255,255,0.45)" }}
        >
          Ask your advisor
        </button>
      </div>

      <ElectivesPanel reflectAnswers={reflectAnswers} extraCredits={extraElectiveCredits} />

      <p className="text-xs tracking-widest uppercase mb-2" style={{ color: GOLD, fontFamily: "ui-monospace, monospace" }}>
        The road through the major
      </p>
      <h2 className="text-3xl sm:text-4xl mb-3 leading-tight" style={{ fontFamily: "Georgia, serif", color: "#FFFFFF" }}>
        Four stages, roughly one per year.
      </h2>
      <p className="text-base mb-8 max-w-2xl" style={{ color: ON_DARK_MUTED }}>
        Click a year to see its courses. Green cards are the required studio sequence (18 hrs); the rest are the computing and math courses that support it (31 hrs combined).
      </p>

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
            {career.matchReason && (
              <p className="text-[10px] leading-snug mt-1.5" style={{ color: GOLD_DEEP }}>
                {career.matchReason}
              </p>
            )}
            <span className="text-[10px] mt-auto pt-1.5" style={{ color: GOLD_DEEP }}>Click to see details</span>
          </div>
        </div>

        {/* BACK */}
        <div className="flip-face flip-back" style={{ background: INK, color: "#fff" }}>
          <h4 className="text-sm font-semibold mb-2" style={{ color: GOLD, fontFamily: "Georgia, serif" }}>{career.role}</h4>
          <p className="text-[11px] leading-relaxed mb-2.5" style={{ color: "#E4EEE8" }}>{career.does}</p>

          {career.supportingCourses?.length > 0 && (
            <div className="mb-2.5">
              <p className="text-[9px] uppercase tracking-wide mb-1" style={{ color: "#9FB5AA" }}>
                From your planned courses
              </p>
              <div className="flex flex-wrap gap-1.5">
                {career.supportingCourses.map((code) => (
                  <span
                    key={code}
                    className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(255,255,255,0.08)", color: "#D7E4DC", border: "1px solid rgba(255,255,255,0.16)" }}
                  >
                    {code}
                  </span>
                ))}
              </div>
            </div>
          )}

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

function CareersStep({ flipped, toggleFlip, recommendations, reflectAnswers }) {
  const matchedCareers = useMemo(() => {
    const ranked = rankCareersForStudent({ recommendations, reflectAnswers });
    return ranked.map((career) => {
      const meta = CAREERS.find((entry) => entry.role === career.role);
      return meta ? { ...career, ...meta } : career;
    });
  }, [recommendations, reflectAnswers]);

  const plannedCodes = useMemo(
    () =>
      [...new Set(matchedCareers.flatMap((career) => career.supportingCourses || []))].sort(),
    [matchedCareers]
  );

  return (
    <div>
      <p className="text-xs tracking-widest uppercase mb-2" style={{ color: GOLD, fontFamily: "ui-monospace, monospace" }}>Step four</p>
      <h1 className="text-4xl sm:text-5xl mb-3 leading-tight" style={{ fontFamily: "Georgia, serif", color: "#FFFFFF" }}>
        Where your courses lead.
      </h1>
      <p className="text-base mb-8 max-w-xl" style={{ color: ON_DARK_MUTED }}>
          {plannedCodes.length
          ? `These roles fit the classes on your plan (${plannedCodes.slice(0, 4).join(", ")}${plannedCodes.length > 4 ? ", …" : ""}). Flip a card for what they do, pay, and who hires for it.`
          : "These roles are inferred from your interests for now. Get course recommendations on Reflect to tailor careers to classes you'll take."}
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-4">
        {matchedCareers.map((c, i) => (
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
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [interestRatings, setInterestRatings] = useState({});
  const [styleRatings, setStyleRatings] = useState({});
  const [industries, setIndustries] = useState([]);
  const registerTerm = DEFAULT_REGISTER_TERM;
  const creditLoad = DEFAULT_CREDIT_LOAD;
  const [note, setNote] = useState("");
  const [flipped, setFlipped] = useState(new Set());
  const [chatOpen, setChatOpen] = useState(false);
  const [recommendLoading, setRecommendLoading] = useState(false);
  const [recommendError, setRecommendError] = useState(null);
  const [recommendSummary, setRecommendSummary] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

  const careerTarget = inferCareerTarget({ interestRatings, styleRatings });
  const reflectAnswers = buildReflectAnswers(
    interestRatings,
    styleRatings,
    registerTerm,
    creditLoad,
    note,
    careerTarget,
    industries
  );

  const setInterestRating = (key, rating) => {
    setInterestRatings((prev) => ({ ...prev, [key]: rating }));
  };

  const setStyleRating = (key, rating) => {
    setStyleRatings((prev) => ({ ...prev, [key]: rating }));
  };

  const toggleIndustry = (key) => {
    setIndustries((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  const toggleFlip = (i) => {
    setFlipped((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const fetchRecommendations = async () => {
    setRecommendLoading(true);
    setRecommendError(null);
    setRecommendSummary(null);
    setRecommendations([]);

    try {
      const res = await apiFetch("/api/recommend-courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: reflectAnswers }),
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.error || "Something went wrong.");

      setRecommendSummary(data.summary || null);
      setRecommendations(data.recommendations || []);
      window.requestAnimationFrame(() => {
        document.getElementById("course-recommendations")?.scrollIntoView({ behavior: "smooth" });
      });
    } catch (err) {
      setRecommendError(friendlyApiError(err));
    } finally {
      setRecommendLoading(false);
    }
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

      <div className={`mx-auto px-6 py-14 ${step === 0 || step === 1 || step === 2 ? "max-w-7xl" : "max-w-5xl"}`}>
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
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm hover:opacity-90 transition-opacity"
              style={{ color: "#FFFFFF" }}
            >
              <ArrowLeft size={16} /> Back
            </button>
            <Link to="/" className="flex items-center gap-2 text-sm" style={{ color: "#FFFFFF" }}>
              <Home size={16} /> Home
            </Link>
          </div>
        </div>

        <Stepper step={step} setStep={setStep} />

        {step >= 1 && (
          <PersonalizedBar
            onOpenChat={() => setChatOpen(true)}
            onViewRoadmap={() => setStep(1)}
          />
        )}

        {step === 0 && (
          <ReflectStep
            interestRatings={interestRatings}
            setInterestRating={setInterestRating}
            styleRatings={styleRatings}
            setStyleRating={setStyleRating}
            industries={industries}
            toggleIndustry={toggleIndustry}
            note={note}
            setNote={setNote}
            onNext={() => setStep(1)}
            onGetRecommendations={fetchRecommendations}
            recommendLoading={recommendLoading}
            recommendError={recommendError}
            recommendSummary={recommendSummary}
            recommendations={recommendations}
          />
        )}
        {step === 1 && <RoadmapStep reflectAnswers={reflectAnswers} onAskAdvisor={() => setChatOpen(true)} />}
        {step === 2 && <ExploreStep />}
        {step === 3 && (
          <CareersStep
            flipped={flipped}
            toggleFlip={toggleFlip}
            recommendations={recommendations}
            reflectAnswers={reflectAnswers}
          />
        )}

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
              {step === 0 ? "See your plan" : step === 1 ? "See the courses" : "See the careers"} <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>

      <AdvisorChat
        isOpen={chatOpen}
        onOpenChange={setChatOpen}
        context={{
          step,
          note,
          careerTarget,
          registerTerm,
          creditLoad,
          reflectAnswers,
        }}
        showFab={step <= 0}
      />
    </div>
  );
}
