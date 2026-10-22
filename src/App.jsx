import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sparkles, ArrowRight, ArrowLeft, Check, X,
  BarChart3, Database, Cpu, LineChart, ShieldCheck, Users, Star, ChevronDown,
  Home, Heart, Compass, BrainCircuit,
} from "lucide-react";
import RatingRow from "./components/RatingRow";
import {
  INTEREST_QUESTIONS,
  STYLE_QUESTIONS,
  TOPIC_OPTIONS,
  SKILL_OPTIONS,
  DELIVERABLE_OPTIONS,
} from "./data/reflectQuestions";
import { apiFetch } from "./lib/api";
import { friendlyApiError, parseJsonResponse } from "./lib/apiResponse";
import {
  buildReflectAnswers,
  inferCareerTarget,
  validateReflectAnswersForRecommendations,
} from "./lib/reflectScoring";
import { rankCareersForStudent } from "./lib/careerFromCourses";
import { buildStudentRecord, courseHistoryTitles } from "./lib/studentRecord";
import AdvisorChat from "./components/AdvisorChat";
import CoreRequirementsOverview from "./components/CoreRequirementsOverview";
import ElectivesPanel from "./components/ElectivesPanel";
import CourseAdvisor from "./components/CourseAdvisor";
import {
  CAREERS as CAREER_DATA,
  REFLECT_TERM_OPTIONS,
  REFLECT_CREDIT_LOAD_OPTIONS,
} from "./data/curriculum";

const PAGE_BG = "#00543C";
const INK = "#0B2E22";
const GOLD = "#B3A369";
const GOLD_DEEP = "#8C7F4B";
const GREEN = "#1F7A54";
const SURFACE = "#FFFFFF";
const MUTED = "#5B6660";
const ON_DARK_MUTED = "#BFD9CB";

const DEFAULT_REGISTER_TERM = REFLECT_TERM_OPTIONS[0] || "";
const DEFAULT_CREDIT_LOAD = REFLECT_CREDIT_LOAD_OPTIONS[1] || "";

const CAREER_META = {
  "Data analyst": { icon: BarChart3, photo: "https://i.pravatar.cc/400?img=47" },
  "Data engineer": { icon: Database, photo: "https://i.pravatar.cc/400?img=32" },
  "Software developer": { icon: Cpu, photo: "https://i.pravatar.cc/400?img=13" },
  "Data scientist": { icon: LineChart, photo: "https://i.pravatar.cc/400?img=5" },
  "Machine learning engineer": { icon: BrainCircuit, photo: "https://i.pravatar.cc/400?img=12" },
  "Data ethics & policy analyst": { icon: ShieldCheck, photo: "https://i.pravatar.cc/400?img=25" },
  "UX / product analyst": { icon: Users, photo: "https://i.pravatar.cc/400?img=48" },
};

const CAREERS = CAREER_DATA.map((career) => ({
  ...career,
  icon: BarChart3,
  ...CAREER_META[career.role],
}));

const STUDENT_RECORD = buildStudentRecord();
const TAKEN_CODES = [...STUDENT_RECORD.completed, ...STUDENT_RECORD.inProgress];
const COURSE_TITLES = courseHistoryTitles();

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

function MultiSelectDropdown({
  prompt,
  options,
  selected,
  onToggle,
  placeholder = "Select as many as you like",
}) {
  const [open, setOpen] = useState(false);
  const hasValue = selected.length > 0;
  const selectedOptions = options.filter((option) => selected.includes(option.key));

  return (
    <div className="mb-5 last:mb-0">
      <p className="text-sm font-medium mb-2" style={{ color: "#FFFFFF" }}>
        {prompt}
      </p>
      <div
        className="relative w-full max-w-xl rounded-[22px]"
        style={{
          border: `1.5px solid ${hasValue || open ? GOLD : "rgba(255,255,255,0.4)"}`,
        }}
      >
        <button
          type="button"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label={prompt}
          onClick={() => setOpen((prev) => !prev)}
          className="absolute inset-0 rounded-[22px]"
        />
        <div className="relative z-10 flex flex-wrap items-center gap-1.5 min-h-[42px] pl-2.5 pr-10 py-1.5 pointer-events-none">
          {hasValue ? (
            selectedOptions.map((option) => (
              <span
                key={option.key}
                className="inline-flex items-center gap-1 text-sm pl-3 pr-1 py-1 rounded-full pointer-events-auto"
                style={{ background: GOLD, color: INK }}
              >
                {option.label}
                <button
                  type="button"
                  aria-label={`Remove ${option.label}`}
                  onClick={() => onToggle(option.key)}
                  className="flex items-center justify-center w-5 h-5 rounded-full"
                >
                  <X size={12} strokeWidth={2.5} />
                </button>
              </span>
            ))
          ) : (
            <span className="pl-1.5 text-sm" style={{ color: ON_DARK_MUTED }}>
              {placeholder}
            </span>
          )}
        </div>
        <ChevronDown
          size={16}
          color={hasValue || open ? GOLD : "#FFFFFF"}
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 transition-transform duration-200"
          style={{ transform: open ? "translateY(-50%) rotate(180deg)" : "translateY(-50%)" }}
          aria-hidden="true"
        />
      </div>
      {open && (
        <div className="flex flex-wrap gap-2 mt-3" role="listbox" aria-multiselectable="true" aria-label={prompt}>
          {options.map((option) => {
            const isSelected = selected.includes(option.key);
            return (
              <button
                key={option.key}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => onToggle(option.key)}
                className="inline-flex items-center gap-1.5 text-sm pl-3 py-1.5 rounded-full"
                style={{
                  background: isSelected ? GOLD : "transparent",
                  color: isSelected ? INK : "#FFFFFF",
                  border: `1.5px solid ${isSelected ? GOLD : "rgba(255,255,255,0.45)"}`,
                  paddingRight: isSelected ? "0.5rem" : "0.75rem",
                }}
              >
                {option.label}
                {isSelected && <X size={12} strokeWidth={2.5} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ReflectStep({
  interestRatings,
  setInterestRating,
  styleRatings,
  setStyleRating,
  topicsEnjoyed,
  toggleTopic,
  skillsHave,
  toggleSkillHave,
  skillsWant,
  toggleSkillWant,
  deliverables,
  toggleDeliverable,
  note,
  setNote,
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
        Rate each area honestly — there&apos;s no wrong answer. Your ratings shape which electives we highlight and recommend, not which ones you&apos;re allowed to take.
      </p>

      <div className="rounded-2xl p-6 mb-8" style={{ background: "rgba(11,46,34,0.55)", border: "1px solid rgba(179,163,105,0.35)" }}>
        <div className="flex items-center gap-2 mb-5">
          <Heart size={18} color={GOLD} />
          <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: GOLD }}>
            Section A — Interest by specialty area
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
            Section B — Work style &amp; comfort
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
            input={question.input}
            options={question.options}
          />
        ))}
      </div>

      <div className="rounded-2xl p-6 mb-8" style={{ background: "rgba(11,46,34,0.55)", border: "1px solid rgba(179,163,105,0.35)" }}>
        <div className="flex items-center gap-2 mb-5">
          <BarChart3 size={18} color={GOLD} />
          <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: GOLD }}>
            Section C — Topics, skills &amp; outcomes
          </h3>
        </div>
        <MultiSelectDropdown
          prompt="Which topics do you actually enjoy?"
          options={TOPIC_OPTIONS}
          selected={topicsEnjoyed}
          onToggle={toggleTopic}
        />
        <MultiSelectDropdown
          prompt="Which skills do you already have?"
          options={SKILL_OPTIONS}
          selected={skillsHave}
          onToggle={toggleSkillHave}
        />
        <MultiSelectDropdown
          prompt="Which skills do you want to walk out of UNC Charlotte with?"
          options={SKILL_OPTIONS}
          selected={skillsWant}
          onToggle={toggleSkillWant}
        />
        <MultiSelectDropdown
          prompt="What do you want to be able to show an employer?"
          options={DELIVERABLE_OPTIONS}
          selected={deliverables}
          onToggle={toggleDeliverable}
        />
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

function ExploreStep({
  recommendations,
  recommendLoading,
  recommendError,
  recommendSummary,
  onGetRecommendations,
}) {
  return (
    <div>
      <p className="text-xs tracking-widest uppercase mb-2" style={{ color: GOLD, fontFamily: "ui-monospace, monospace" }}>
        Step two
      </p>
      <h1 className="text-4xl sm:text-5xl mb-3 leading-tight" style={{ fontFamily: "Georgia, serif", color: "#FFFFFF" }}>
        Explore courses.
      </h1>
      <p className="text-base mb-8 max-w-2xl" style={{ color: ON_DARK_MUTED }}>
        See what the major requires, then pick an elective pathway to see matching courses.
      </p>

      <CoreRequirementsOverview
        recommendations={recommendations}
        recommendLoading={recommendLoading}
        recommendError={recommendError}
        recommendSummary={recommendSummary}
        onGetRecommendations={onGetRecommendations}
      />
    </div>
  );
}

function RoadmapStep({ reflectAnswers, recommendations, onAskAdvisor }) {
  const showSuggestedElectives = !validateReflectAnswersForRecommendations(reflectAnswers);

  return (
    <div>
      <p className="text-xs tracking-widest uppercase mb-2" style={{ color: GOLD, fontFamily: "ui-monospace, monospace" }}>
        Step three
      </p>
      <h1 className="text-4xl sm:text-5xl mb-3 leading-tight" style={{ fontFamily: "Georgia, serif", color: "#FFFFFF" }}>
        Your plan.
      </h1>
      <p className="text-base mb-8 max-w-2xl" style={{ color: ON_DARK_MUTED }}>
        {showSuggestedElectives
          ? "Suggested electives based on your Reflect answers."
          : "Answer the Reflect questions to see suggested electives."}
      </p>

      <div className="flex flex-wrap gap-3 mb-8">
        <button
          type="button"
          onClick={onAskAdvisor}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold"
          style={{ background: "transparent", color: "#FFFFFF", border: "1.5px solid rgba(255,255,255,0.45)" }}
        >
          Ask your advisor
        </button>
      </div>

      {showSuggestedElectives && (
        <ElectivesPanel reflectAnswers={reflectAnswers} recommendations={recommendations} />
      )}
    </div>
  );
}

function CareerCourseChips({ label, codes }) {
  if (!codes?.length) return null;
  return (
    <div className="mb-2.5">
      <p className="text-[9px] uppercase tracking-wide mb-1" style={{ color: "#9FB5AA" }}>
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {codes.map((code) => (
          <span
            key={code}
            title={COURSE_TITLES[code]}
            className="text-[10px] px-2 py-0.5 rounded-full"
            style={{ background: "rgba(255,255,255,0.08)", color: "#D7E4DC", border: "1px solid rgba(255,255,255,0.16)" }}
          >
            {code}
          </span>
        ))}
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

          <CareerCourseChips label="From classes you've taken" codes={career.takenCourses} />
          <CareerCourseChips label="From your planned courses" codes={career.supportingCourses} />

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
    const ranked = rankCareersForStudent({
      takenCodes: TAKEN_CODES,
      recommendations,
      reflectAnswers,
      courseTitles: COURSE_TITLES,
    });
    return ranked.map((career) => {
      const meta = CAREERS.find((entry) => entry.role === career.role);
      return meta ? { ...meta, ...career } : career;
    });
  }, [recommendations, reflectAnswers]);

  const takenCodes = useMemo(
    () => [...new Set(matchedCareers.flatMap((career) => career.takenCourses || []))].sort(),
    [matchedCareers]
  );
  const plannedCodes = useMemo(
    () =>
      [...new Set(matchedCareers.flatMap((career) => career.supportingCourses || []))].sort(),
    [matchedCareers]
  );
  const listCodes = (codes) =>
    `${codes.slice(0, 4).join(", ")}${codes.length > 4 ? ", …" : ""}`;

  return (
    <div>
      <p className="text-xs tracking-widest uppercase mb-2" style={{ color: GOLD, fontFamily: "ui-monospace, monospace" }}>Step four</p>
      <h1 className="text-4xl sm:text-5xl mb-3 leading-tight" style={{ fontFamily: "Georgia, serif", color: "#FFFFFF" }}>
        Where your courses lead.
      </h1>
      <p className="text-base mb-8 max-w-xl" style={{ color: ON_DARK_MUTED }}>
        {takenCodes.length || plannedCodes.length
          ? `These roles build on the classes you've taken${takenCodes.length ? ` (${listCodes(takenCodes)})` : ""}${plannedCodes.length ? ` and the ones on your plan (${listCodes(plannedCodes)})` : ""}. Strongest match first — flip a card for what they do, pay, and who hires for it.`
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
  const [topicsEnjoyed, setTopicsEnjoyed] = useState([]);
  const [skillsHave, setSkillsHave] = useState([]);
  const [skillsWant, setSkillsWant] = useState([]);
  const [deliverables, setDeliverables] = useState([]);
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
    [],
    { topicsEnjoyed, skillsHave, skillsWant, deliverables }
  );

  const setInterestRating = (key, rating) => {
    setInterestRatings((prev) => ({ ...prev, [key]: rating }));
  };

  const setStyleRating = (key, rating) => {
    setStyleRatings((prev) => ({ ...prev, [key]: rating }));
  };

  const toggleInList = (setter) => (key) => {
    setter((prev) => {
      if (prev.includes(key)) return prev.filter((item) => item !== key);
      return [...prev, key];
    });
  };

  const toggleTopic = toggleInList(setTopicsEnjoyed);
  const toggleSkillHave = toggleInList(setSkillsHave);
  const toggleSkillWant = toggleInList(setSkillsWant);
  const toggleDeliverable = toggleInList(setDeliverables);

  const toggleFlip = (i) => {
    setFlipped((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const fetchRecommendations = async () => {
    const validationError = validateReflectAnswersForRecommendations(reflectAnswers);
    setRecommendSummary(null);
    setRecommendations([]);
    if (validationError) {
      setRecommendLoading(false);
      setRecommendError(validationError);
      window.requestAnimationFrame(() => {
        document.getElementById("course-recommendations")?.scrollIntoView({ behavior: "smooth" });
      });
      return;
    }

    setRecommendLoading(true);
    setRecommendError(null);

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
        .flip-card { perspective: 1200px; height: 340px; cursor: pointer; }
        .flip-inner { position: relative; width: 100%; height: 100%; transition: transform 0.5s; transform-style: preserve-3d; box-shadow: 0 6px 16px rgba(0,0,0,0.18); border-radius: 16px; }
        .flip-inner.is-flipped { transform: rotateY(180deg); }
        .flip-face { position: absolute; inset: 0; backface-visibility: hidden; border-radius: 16px; padding: 18px; display: flex; flex-direction: column; overflow: hidden; }
        .flip-back { transform: rotateY(180deg); }
        @media (hover: hover) {
          .flip-card:hover .flip-inner { transform: rotateY(180deg); }
        }
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

        {step === 0 && (
          <ReflectStep
            interestRatings={interestRatings}
            setInterestRating={setInterestRating}
            styleRatings={styleRatings}
            setStyleRating={setStyleRating}
            topicsEnjoyed={topicsEnjoyed}
            toggleTopic={toggleTopic}
            skillsHave={skillsHave}
            toggleSkillHave={toggleSkillHave}
            skillsWant={skillsWant}
            toggleSkillWant={toggleSkillWant}
            deliverables={deliverables}
            toggleDeliverable={toggleDeliverable}
            note={note}
            setNote={setNote}
            onGetRecommendations={fetchRecommendations}
            recommendLoading={recommendLoading}
            recommendError={recommendError}
            recommendSummary={recommendSummary}
            recommendations={recommendations}
          />
        )}
        {step === 1 && (
          <RoadmapStep
            reflectAnswers={reflectAnswers}
            recommendations={recommendations}
            onAskAdvisor={() => setChatOpen(true)}
          />
        )}
        {step === 2 && (
          <ExploreStep
            recommendations={recommendations}
            recommendLoading={recommendLoading}
            recommendError={recommendError}
            recommendSummary={recommendSummary}
            onGetRecommendations={fetchRecommendations}
          />
        )}
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
          {step < 3 && (step !== 0 || (!recommendLoading && recommendations.length > 0)) && (
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
