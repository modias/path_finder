import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, BookOpen, Check, ChevronUp, Circle, ClipboardList, GraduationCap, Layers, NotebookPen, Route,
} from "lucide-react";
import {
  DEGREE_TOTAL_CREDITS,
  ELECTIVES,
  ELECTIVE_CREDITS,
  GEN_ED,
  MAJOR_SECTIONS,
  estimateCompletedCredits,
  getSectionProgress,
  getMajorCourses,
  countByStatus,
} from "../data/degreeWorks";

const PAGE_BG = "#00543C";
const INK = "#0B2E22";
const GOLD = "#B3A369";
const GOLD_DEEP = "#8C7F4B";
const GREEN = "#1F7A54";
const SURFACE = "#FFFFFF";
const MUTED = "#5B6660";
const ON_DARK_MUTED = "#BFD9CB";
const DW_RED = "#C62828";
const DW_BLUE = "#1E88E5";
const LINK_GREEN = "#2E7D32";

const STATUS_META = {
  completed: { label: "Completed", bg: "#E8F5EE", color: GREEN, Icon: Check },
  in_progress: { label: "In progress", bg: "#FFF8E8", color: "#C47A20", Icon: Circle },
  remaining: { label: "Still needed", bg: "#F5F6F1", color: MUTED, Icon: Circle },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.remaining;
  const Icon = meta.Icon;
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0"
      style={{ background: meta.bg, color: meta.color }}
    >
      <Icon size={12} />
      {meta.label}
    </span>
  );
}

function ProgressBar({ completed, total }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5" style={{ color: MUTED }}>
        <span>{pct}% complete</span>
        <span>{completed} of {total} credits</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "#E4E1D4" }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, background: GREEN }}
        />
      </div>
    </div>
  );
}

/** Classic Degree Works status icons */
function AuditIcon({ status }) {
  if (status === "complete") {
    return (
      <span
        className="flex items-center justify-center w-5 h-5 rounded-full shrink-0"
        style={{ background: LINK_GREEN }}
        aria-label="Complete"
      >
        <Check size={12} color="#FFFFFF" strokeWidth={3} />
      </span>
    );
  }
  if (status === "in_progress") {
    return (
      <span
        className="w-5 h-5 rounded-full shrink-0"
        style={{
          background: `conic-gradient(${DW_BLUE} 0 50%, #FFFFFF 50% 100%)`,
          border: `2px solid ${DW_BLUE}`,
        }}
        aria-label="In progress"
      />
    );
  }
  return (
    <span
      className="w-5 h-5 rounded-full shrink-0"
      style={{ border: `2px solid ${DW_RED}`, background: SURFACE }}
      aria-label="Incomplete"
    />
  );
}

function BachelorOfScienceBlock({ creditsApplied, summaryCards }) {
  const [open, setOpen] = useState(true);
  const creditsNeeded = DEGREE_TOTAL_CREDITS - creditsApplied;
  const pct = Math.round((creditsApplied / DEGREE_TOTAL_CREDITS) * 100);

  const rows = [
    {
      status: "incomplete",
      label: "Credits Required",
      detail: (
        <>
          <span className="font-semibold" style={{ color: MUTED }}>Still needed: </span>
          Your degree requires a minimum of {DEGREE_TOTAL_CREDITS} credit hours. You have {creditsApplied}; you need {creditsNeeded} more credit hours.
        </>
      ),
    },
    { status: "complete", label: "Minimum 30 Hours in Residence" },
    { status: "complete", label: "2.0 Overall GPA" },
    { status: "in_progress", label: "General Education Requirements" },
    {
      status: "incomplete",
      label: "Major Requirements",
      detail: (
        <>
          <span className="font-semibold" style={{ color: MUTED }}>Still needed: </span>
          See{" "}
          <a href="#major-requirements" className="font-semibold underline-offset-2 hover:underline" style={{ color: LINK_GREEN }}>
            Major in Data Science
          </a>{" "}
          section
        </>
      ),
    },
  ];

  return (
    <section className="rounded-2xl overflow-hidden" style={{ background: SURFACE, border: "1px solid #E4E1D4" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full px-5 py-4 text-left"
        style={{ borderBottom: open ? "1px solid #E4E1D4" : "none" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-bold shrink-0" style={{ color: INK }}>Bachelor of Science</h2>
          <div className="flex items-center gap-3 flex-1 justify-end min-w-[200px]">
            <div className="w-full max-w-xs">
              <div className="flex justify-between text-xs mb-1.5" style={{ color: MUTED }}>
                <span>{pct}% complete</span>
                <span>{creditsApplied} of {DEGREE_TOTAL_CREDITS} credits</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "#E4E1D4" }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${pct}%`, background: GREEN }}
                />
              </div>
            </div>
            <ChevronUp
              size={18}
              color={MUTED}
              className="shrink-0 transition-transform duration-200"
              style={{ transform: open ? "none" : "rotate(180deg)" }}
            />
          </div>
        </div>
      </button>

      {open && (
        <>
          <div className="px-5 pb-4 pt-4">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold" style={{ color: INK }}>B.S. Data Science</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: "#E8F5EE", color: GREEN }}>
                Social Impact & Analytics
              </span>
            </div>
            <p className="text-sm mb-4" style={{ color: MUTED }}>Sample student · 3.62 GPA · Expected Spring 2027</p>

            <div className="flex flex-wrap gap-x-8 gap-y-1 text-sm mb-3" style={{ color: INK }}>
              <p><span className="font-semibold">Credits required:</span> {DEGREE_TOTAL_CREDITS}</p>
              <p><span className="font-semibold">Credits applied:</span> {creditsApplied}</p>
              <p><span className="font-semibold">Catalog year:</span> 2025-2026</p>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: MUTED }}>
              Credits applied include any In-Progress and Preregistered classes when those options are selected.
              Your academic advisor can help clarify how remaining requirements fit your plan.
            </p>
          </div>

          <ul>
            {rows.map((row) => (
              <li
                key={row.label}
                className="flex items-start gap-3 px-5 py-3.5"
                style={{ borderBottom: "1px solid #EDEBE3" }}
              >
                <AuditIcon status={row.status} />
                <div className="min-w-0 text-sm leading-snug">
                  <p className="font-semibold" style={{ color: INK }}>{row.label}</p>
                  {row.detail && (
                    <p className="mt-0.5" style={{ color: INK }}>{row.detail}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div className="px-5 py-5 grid sm:grid-cols-3 gap-4" style={{ borderBottom: "1px solid #EDEBE3" }}>
            {summaryCards.map((card) => (
              <SummaryCard key={card.title} {...card} active />
            ))}
          </div>

          <div className="px-5 py-4" style={{ background: "#FAFAF7" }}>
            <p className="text-sm font-bold mb-2" style={{ color: INK }}>Blocks included in this block</p>
            <ul className="space-y-1.5">
              <li>
                <a href="#gen-ed-requirements" className="text-sm hover:underline" style={{ color: LINK_GREEN }}>
                  General Education
                </a>
              </li>
              <li>
                <a href="#major-requirements" className="text-sm hover:underline" style={{ color: LINK_GREEN }}>
                  Major in Data Science
                </a>
              </li>
            </ul>
          </div>
        </>
      )}
    </section>
  );
}

function CollapsibleSection({ id, icon: Icon, title, description, completed, total, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      id={id}
      className="rounded-2xl scroll-mt-6 overflow-hidden"
      style={{ background: SURFACE, border: "1px solid #E4E1D4" }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full px-5 sm:px-6 py-5 text-left"
      >
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
              style={{ background: "#E8F5EE" }}
            >
              <Icon size={20} color={GREEN} />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl" style={{ fontFamily: "Georgia, serif", color: INK }}>{title}</h2>
              {open && description && (
                <p className="text-sm mt-0.5" style={{ color: MUTED }}>{description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <p className="text-sm font-semibold" style={{ color: GREEN }}>{total} credits</p>
            <ChevronUp
              size={18}
              color={MUTED}
              className="transition-transform duration-200"
              style={{ transform: open ? "none" : "rotate(180deg)" }}
            />
          </div>
        </div>
        <ProgressBar completed={completed} total={total} />
      </button>

      {open && (
        <div className="px-5 sm:px-6 pb-5 sm:pb-6">
          {children}
        </div>
      )}
    </section>
  );
}

function SummaryCard({ icon: Icon, title, description, completed, total, active }) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: active ? SURFACE : "#F7F8F4",
        border: `1px solid ${active ? GREEN : "#E4E1D4"}`,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} color={GREEN} />
        <h3 className="text-sm font-semibold" style={{ color: INK }}>{title}</h3>
      </div>
      <p className="text-xs mb-4 leading-relaxed" style={{ color: MUTED }}>{description}</p>
      <ProgressBar completed={completed} total={total} />
    </div>
  );
}

function GenEdRow({ item }) {
  const detail = item.status === "remaining" && item.options
    ? item.options
    : item.taken;

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5"
      style={{ borderBottom: "1px solid #E4E1D4" }}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium" style={{ color: INK }}>{item.requirement}</p>
        {detail && (
          <p
            className="text-xs mt-0.5"
            style={{
              color: item.status === "remaining" ? MUTED : GOLD_DEEP,
              fontFamily: item.taken ? "ui-monospace, monospace" : undefined,
            }}
          >
            {item.status === "remaining" && item.options ? `Choose from: ${detail}` : detail}
          </p>
        )}
      </div>
      <StatusBadge status={item.status} />
    </div>
  );
}

function CourseRow({ course }) {
  return (
    <div
      className="grid grid-cols-[7.5rem_1fr_auto] gap-3 items-center px-4 py-3"
      style={{ borderBottom: "1px solid #E4E1D4" }}
    >
      <p className="text-xs font-semibold" style={{ color: INK, fontFamily: "ui-monospace, monospace" }}>
        {course.code}
      </p>
      <p className="text-sm" style={{ color: MUTED }}>{course.name}</p>
      <StatusBadge status={course.status} />
    </div>
  );
}

function CourseTable({ courses }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #E4E1D4" }}>
      <div
        className="grid grid-cols-[7.5rem_1fr_auto] gap-3 px-4 py-2 text-[10px] uppercase tracking-widest font-semibold"
        style={{ background: "#F7F8F4", color: MUTED, borderBottom: "1px solid #E4E1D4" }}
      >
        <span>Course</span>
        <span>Name</span>
        <span>Status</span>
      </div>
      {courses.map((course) => (
        <CourseRow key={course.code} course={course} />
      ))}
    </div>
  );
}

export default function DegreeWorks() {
  const completedCredits = estimateCompletedCredits();
  const creditsApplied = completedCredits;
  const majorCourses = getMajorCourses();
  const majorDone = countByStatus(majorCourses, "completed");
  const majorInProg = countByStatus(majorCourses, "in_progress");
  const genEdDone = countByStatus(GEN_ED, "completed");
  const genEdInProg = countByStatus(GEN_ED, "in_progress");
  const genEdLeft = countByStatus(GEN_ED, "remaining");
  const progress = getSectionProgress();

  return (
    <div className="w-full min-h-screen" style={{ background: PAGE_BG }}>
      <div className="mx-auto px-6 py-14 max-w-6xl">
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
          <Link
            to="/"
            className="flex items-center gap-2 text-sm"
            style={{ color: "#FFFFFF" }}
          >
            <ArrowLeft size={16} /> Home
          </Link>
        </div>

        <p className="text-xs tracking-widest uppercase mb-2" style={{ color: GOLD, fontFamily: "ui-monospace, monospace" }}>
          Degree progress
        </p>
        <h1 className="text-4xl sm:text-5xl mb-3 leading-tight" style={{ fontFamily: "Georgia, serif", color: "#FFFFFF" }}>
          Degree Works
        </h1>
        <p className="text-base mb-8 max-w-2xl" style={{ color: ON_DARK_MUTED }}>
          Track Gen Ed, major, and elective requirements toward your 120-credit B.S. in Data Science.
        </p>

        <div className="rounded-2xl overflow-hidden" style={{ background: "#F7F8F4", border: "1px solid #E4E1D4" }}>
          <div className="px-6 py-5 flex flex-wrap items-center justify-between gap-4" style={{ borderBottom: "1px solid #E4E1D4" }}>
            <div className="flex items-center gap-2">
              <ClipboardList size={16} color={GREEN} />
              <span className="text-[10px] tracking-widest uppercase font-semibold" style={{ color: MUTED }}>
                DegreeWorks Connected
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/roadmap"
                className="flex items-center gap-2 text-xs px-4 py-2 rounded-full font-semibold"
                style={{ background: INK, color: "#FFFFFF" }}
              >
                <Route size={14} /> See the path ahead
              </Link>
              <Link
                to="/registration"
                className="flex items-center gap-2 text-xs px-4 py-2 rounded-full font-semibold"
                style={{ background: GREEN, color: "#FFFFFF" }}
              >
                <NotebookPen size={14} /> Registration
              </Link>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <BachelorOfScienceBlock
              creditsApplied={creditsApplied}
              summaryCards={[
                {
                  icon: BookOpen,
                  title: "Gen Ed",
                  description: `${genEdDone} completed · ${genEdInProg} in progress · ${genEdLeft} still needed`,
                  completed: progress.genEd.completed,
                  total: progress.genEd.total,
                },
                {
                  icon: Layers,
                  title: "Major",
                  description: `${majorDone} completed · ${majorInProg} in progress · ${majorCourses.length - majorDone - majorInProg} still needed`,
                  completed: progress.major.completed,
                  total: progress.major.total,
                },
                {
                  icon: GraduationCap,
                  title: "Electives",
                  description: "Electives still needed toward your degree",
                  completed: progress.electives.completed,
                  total: progress.electives.total,
                },
              ]}
            />

            <CollapsibleSection
              id="gen-ed-requirements"
              icon={BookOpen}
              title="Gen Ed"
              description="General education requirements for the degree."
              completed={progress.genEd.completed}
              total={progress.genEd.total}
            >
              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #E4E1D4" }}>
                <div
                  className="flex justify-between px-4 py-2 text-[10px] uppercase tracking-widest font-semibold"
                  style={{ background: "#F7F8F4", color: MUTED, borderBottom: "1px solid #E4E1D4" }}
                >
                  <span>Requirement</span>
                  <span>Status</span>
                </div>
                {GEN_ED.map((item) => (
                  <GenEdRow key={item.requirement} item={item} />
                ))}
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              id="major-requirements"
              icon={Layers}
              title="Major courses"
              description="Data Science core, math & statistics, computing, and capstone."
              completed={progress.major.completed}
              total={progress.major.total}
            >
              <div className="space-y-6">
                {MAJOR_SECTIONS.map((section) => (
                  <div key={section.id}>
                    <h3 className="text-sm font-semibold mb-3" style={{ color: INK }}>{section.title}</h3>
                    <CourseTable courses={section.courses} />
                  </div>
                ))}
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              icon={GraduationCap}
              title="Electives"
              description="Approved electives that deepen computing, math, or applied skills."
              completed={progress.electives.completed}
              total={ELECTIVE_CREDITS}
            >
              <CourseTable courses={ELECTIVES} />
            </CollapsibleSection>
          </div>
        </div>
      </div>
    </div>
  );
}
