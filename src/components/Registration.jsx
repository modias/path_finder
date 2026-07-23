import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, AlertTriangle, ArrowLeft, BookOpen, ChevronDown, Home, Settings, Trash2 } from "lucide-react";
import {
  BROWSE_BUCKETS,
  CATEGORY_META,
  REGISTRATION_CATALOG,
  courseMatchesBrowseBucket,
} from "../data/courseCatalog";
import { COURSE_HISTORY } from "../data/curriculum";
import { useSchedule } from "../data/schedule";

const PAGE_BG = "#00543C";
const INK = "#0B2E22";
const GOLD = "#B3A369";
const GREEN = "#1F7A54";
const SURFACE = "#FFFFFF";
const MUTED = "#5B6660";
const ON_DARK_MUTED = "#BFD9CB";
const FIELD_BORDER = "#C8C5B8";
const LINK_BLUE = "#1A5FA8";
const DAY_ACTIVE = "#2F6FB5";
const DAYS = ["S", "M", "T", "W", "T", "F", "S"];
const RMP_URL = "https://www.ratemyprofessors.com/";

const CATEGORY_COLORS = {
  gen_ed: { bg: "#E8F1FB", color: "#1A5FA8" },
  core: { bg: "#E8F5EE", color: GREEN },
  outside_elective: { bg: "#F3EAF8", color: "#7B4B9A" },
  computing: { bg: "#EEF0EA", color: INK },
  capstone: { bg: "#F3EED9", color: "#8C7F4B" },
};

function CategoryPill({ category }) {
  const meta = CATEGORY_META[category];
  const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.elective;
  if (!meta) return null;
  return (
    <span
      className="inline-flex text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ background: colors.bg, color: colors.color }}
    >
      {meta.short}
    </span>
  );
}

function FieldRow({ label, children, labelWidth = "9.5rem" }) {
  return (
    <div className="flex items-center gap-4 mb-4 last:mb-0">
      <label className="text-sm text-right shrink-0" style={{ color: MUTED, width: labelWidth }}>
        {label}
      </label>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function TextField({ value, onChange, placeholder, wide = true }) {
  return (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="px-3 py-2 text-sm outline-none"
      style={{
        width: wide ? "100%" : "7rem",
        maxWidth: wide ? "28rem" : "7rem",
        border: `1px solid ${FIELD_BORDER}`,
        borderRadius: 6,
        background: SURFACE,
        color: INK,
      }}
    />
  );
}

function DayStrip({ activeDays }) {
  return (
    <div className="flex gap-0.5 mb-1">
      {DAYS.map((day, i) => {
        const on = activeDays.includes(i);
        return (
          <span
            key={`${day}-${i}`}
            className="flex items-center justify-center text-[9px] font-semibold w-4 h-4 rounded-sm"
            style={{
              background: on ? DAY_ACTIVE : "#E8E6DE",
              color: on ? "#FFFFFF" : "#9A9688",
            }}
          >
            {day}
          </span>
        );
      })}
    </div>
  );
}

function StatusCell({ section }) {
  return (
    <div className="space-y-1 min-w-[5.5rem]">
      {section.full && (
        <div className="flex items-center gap-1 text-[11px] font-bold" style={{ color: "#C62828" }}>
          <AlertCircle size={13} />
          FULL
        </div>
      )}
      {!section.full && (
        <div className="text-[11px] font-semibold" style={{ color: GREEN }}>OPEN</div>
      )}
      <div className="flex items-center gap-1 text-[10px]" style={{ color: LINK_BLUE }}>
        <AlertTriangle size={11} />
        {section.enrolled} of {section.capacity}
      </div>
      {section.timeConflict && (
        <div className="text-[10px] font-semibold" style={{ color: "#C62828" }}>
          Time Conflict
        </div>
      )}
    </div>
  );
}

export function RegistrationPanel({ showHeading = true, showCatalogLink = true }) {
  const [searchParams] = useSearchParams();
  const [subject, setSubject] = useState(() => searchParams.get("subject") || "");
  const [courseNumber, setCourseNumber] = useState(() => searchParams.get("number") || "");
  const [courseLevel, setCourseLevel] = useState("");
  const [category, setCategory] = useState(() => searchParams.get("category") || "");
  const [openOnly, setOpenOnly] = useState(false);
  const [searched, setSearched] = useState(() =>
    Boolean(searchParams.get("subject") || searchParams.get("number") || searchParams.get("category"))
  );
  const { enrolled, addFromSection, dropClass } = useSchedule();
  const [message, setMessage] = useState("");
  const [perPage, setPerPage] = useState(25);
  const [openHistoryTerms, setOpenHistoryTerms] = useState(() => new Set());

  const toggleHistoryTerm = (term) => {
    setOpenHistoryTerms((prev) => {
      const next = new Set(prev);
      if (next.has(term)) next.delete(term);
      else next.add(term);
      return next;
    });
  };

  useEffect(() => {
    const sub = searchParams.get("subject") || "";
    const num = searchParams.get("number") || "";
    const cat = searchParams.get("category") || "";
    if (sub || num || cat) {
      setSubject(sub);
      setCourseNumber(num);
      setCategory(cat);
      setSearched(true);
    }
  }, [searchParams]);

  const results = useMemo(() => {
    if (!searched) return [];
    return REGISTRATION_CATALOG.filter((c) => {
      if (subject && !c.subject.toLowerCase().includes(subject.trim().toLowerCase())) return false;
      if (courseNumber && !c.number.includes(courseNumber.trim())) return false;
      if (courseLevel && !c.level.toLowerCase().includes(courseLevel.trim().toLowerCase())) return false;
      if (category && !courseMatchesBrowseBucket(c, category)) return false;
      if (openOnly && c.full) return false;
      return true;
    });
  }, [searched, subject, courseNumber, courseLevel, category, openOnly]);

  const pageResults = results.slice(0, perPage);
  const totalCredits = enrolled.reduce((sum, c) => sum + c.credits, 0);

  const flash = (text) => {
    setMessage(text);
    window.clearTimeout(flash._t);
    flash._t = window.setTimeout(() => setMessage(""), 2500);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearched(true);
  };

  const addClass = (section) => {
    const result = addFromSection(section);
    if (result.reason === "duplicate") {
      flash(`CRN ${section.crn} is already on your schedule.`);
      return;
    }
    if (result.reason === "full") {
      flash(`${section.subject} ${section.number}-${section.section} is FULL.`);
      return;
    }
    if (!result.ok) {
      flash("Could not add class.");
      return;
    }
    flash(`Added ${section.subject} ${section.number}-${section.section}.`);
  };

  const handleDrop = (id) => {
    const course = dropClass(id);
    flash(course ? `Dropped ${course.subject} ${course.number}.` : "Dropped class.");
  };

  return (
    <div>
      {showHeading && (
        <>
          <p className="text-xs tracking-widest uppercase mb-2" style={{ color: GOLD, fontFamily: "ui-monospace, monospace" }}>
            Course registration
          </p>
          <h1 className="text-4xl sm:text-5xl mb-3 leading-tight" style={{ fontFamily: "Georgia, serif", color: "#FFFFFF" }}>
            Registration
          </h1>
          <p className="text-base mb-6 max-w-2xl" style={{ color: ON_DARK_MUTED }}>
            Search by subject and course number (try DTSC + 1301), then add or drop sections.
          </p>
          <Link
            to="/roadmap"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold mb-8"
            style={{ background: GOLD, color: INK }}
          >
            <BookOpen size={16} />
            Explore courses
          </Link>
        </>
      )}

      {!showHeading && showCatalogLink && (
        <div className="mb-6">
          <Link
            to="/roadmap"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold"
            style={{ background: GOLD, color: INK }}
          >
            <BookOpen size={16} />
            Explore courses
          </Link>
        </div>
      )}

      {message && (
        <div
          className="mb-4 rounded-xl px-4 py-3 text-sm font-medium"
          style={{ background: "#E8F5EE", color: GREEN, border: `1px solid ${GREEN}` }}
        >
          {message}
        </div>
      )}

      {/* Search form */}
      <div className="rounded-2xl overflow-hidden mb-6" style={{ background: SURFACE, border: "1px solid #E4E1D4" }}>
        <div className="px-6 py-4" style={{ borderBottom: "1px solid #E4E1D4" }}>
          <h2 className="text-lg font-semibold" style={{ color: INK }}>Find a class</h2>
          <p className="text-xs mt-0.5" style={{ color: MUTED }}>Search by subject, number, category, and level</p>
        </div>

        <form onSubmit={handleSearch} className="px-6 py-6">
          <FieldRow label="Subject">
            <TextField
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. DTSC"
            />
          </FieldRow>
          <FieldRow label="Course Number">
            <TextField
              value={courseNumber}
              onChange={(e) => setCourseNumber(e.target.value)}
              placeholder="1301"
              wide={false}
            />
          </FieldRow>
          <FieldRow label="Category">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 text-sm outline-none"
              style={{
                width: "100%",
                maxWidth: "28rem",
                border: `1px solid ${FIELD_BORDER}`,
                borderRadius: 6,
                background: SURFACE,
                color: INK,
              }}
            >
              <option value="">All categories</option>
              {BROWSE_BUCKETS.map((bucket) => (
                <option key={bucket.id} value={bucket.id}>{bucket.label}</option>
              ))}
            </select>
          </FieldRow>
          <FieldRow label="Course Level">
            <TextField
              value={courseLevel}
              onChange={(e) => setCourseLevel(e.target.value)}
              placeholder="Undergraduate"
            />
          </FieldRow>
          <FieldRow label="Open Sections Only">
            <input
              type="checkbox"
              checked={openOnly}
              onChange={(e) => setOpenOnly(e.target.checked)}
              className="w-4 h-4"
              style={{ accentColor: GREEN }}
            />
          </FieldRow>

          <div className="flex justify-end mt-6" style={{ paddingLeft: "9.5rem" }}>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-full text-sm font-semibold"
              style={{ background: GREEN, color: "#FFFFFF" }}
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Results table */}
      {searched && (
        <div className="rounded-2xl overflow-hidden mb-6" style={{ background: SURFACE, border: "1px solid #E4E1D4" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1040px]">
              <thead>
                <tr style={{ background: "#F0EEE6", borderBottom: "1px solid #D8D5C8" }}>
                  {[
                    "Subject", "Course", "Section", "CRN", "Course Title", "Category", "Credit Hours",
                    "Meeting Times", "Status", "Instructor", "Campus", "Schedule Type", "Add",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2.5 text-[11px] font-semibold whitespace-nowrap"
                      style={{ color: INK, borderRight: "1px solid #E4E1D4" }}
                    >
                      <span className="inline-flex items-center gap-1">
                        {h}
                        {h === "Add" && <Settings size={12} color={MUTED} />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageResults.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="px-4 py-8 text-sm text-center" style={{ color: MUTED }}>
                      No classes match your search.
                    </td>
                  </tr>
                ) : (
                  pageResults.map((section) => {
                    const alreadyIn = enrolled.some((c) => c.id === section.crn);
                    return (
                      <tr key={section.crn} style={{ borderBottom: "1px solid #E4E1D4" }}>
                        <td className="px-3 py-3 text-xs" style={{ color: INK }}>{section.subject}</td>
                        <td className="px-3 py-3 text-xs" style={{ color: INK }}>{section.number}</td>
                        <td className="px-3 py-3 text-xs" style={{ color: INK }}>{section.section}</td>
                        <td className="px-3 py-3 text-xs font-mono" style={{ color: INK }}>{section.crn}</td>
                        <td className="px-3 py-3 text-xs">
                          <button type="button" className="text-left underline-offset-2 hover:underline" style={{ color: LINK_BLUE }}>
                            {section.title}
                          </button>
                        </td>
                        <td className="px-3 py-3"><CategoryPill category={section.category} /></td>
                        <td className="px-3 py-3 text-xs text-center" style={{ color: INK }}>{section.credits}</td>
                        <td className="px-3 py-3 text-xs" style={{ color: INK }}>
                          <DayStrip activeDays={section.days} />
                          <span className="whitespace-nowrap">{section.time}</span>
                        </td>
                        <td className="px-3 py-3"><StatusCell section={section} /></td>
                        <td className="px-3 py-3 text-xs">
                          <a
                            href={RMP_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline-offset-2 hover:underline"
                            style={{ color: LINK_BLUE }}
                            title="Rate My Professors"
                          >
                            {section.instructor}
                          </a>
                        </td>
                        <td className="px-3 py-3 text-xs" style={{ color: INK }}>{section.campus}</td>
                        <td className="px-3 py-3 text-xs" style={{ color: INK }}>{section.scheduleType}</td>
                        <td className="px-3 py-3">
                          <button
                            type="button"
                            onClick={() => addClass(section)}
                            disabled={alreadyIn}
                            className="px-3 py-1.5 rounded-md text-xs font-semibold disabled:opacity-45"
                            style={{
                              background: alreadyIn ? "#E8E6DE" : "#EEF0EA",
                              color: INK,
                              border: "1px solid #C8C5B8",
                            }}
                          >
                            {alreadyIn ? "Added" : "Add"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-xs"
            style={{ borderTop: "1px solid #E4E1D4", color: MUTED, background: "#FAFAF7" }}
          >
            <div className="flex items-center gap-3">
              <span>Showing {Math.min(perPage, results.length)} of {results.length}</span>
              <label className="flex items-center gap-2">
                Per Page
                <select
                  value={perPage}
                  onChange={(e) => setPerPage(Number(e.target.value))}
                  className="px-2 py-1 rounded border text-xs"
                  style={{ borderColor: FIELD_BORDER, color: INK, background: SURFACE }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </label>
            </div>
            <span>Records: {results.length}</span>
          </div>
        </div>
      )}

      {/* Schedule / Drop */}
      <div className="rounded-2xl overflow-hidden" style={{ background: SURFACE, border: "1px solid #E4E1D4" }}>
        <div className="px-6 py-4 flex items-center justify-between gap-3" style={{ borderBottom: "1px solid #E4E1D4" }}>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: INK }}>Your schedule</h2>
            <p className="text-xs mt-0.5" style={{ color: MUTED }}>Drop a class anytime</p>
          </div>
          <span className="text-sm font-semibold" style={{ color: GREEN }}>{totalCredits} credits</span>
        </div>

        <ul className="px-4 py-4 space-y-2">
          {enrolled.length === 0 ? (
            <li className="px-2 py-6 text-sm text-center" style={{ color: MUTED }}>
              No classes yet. Add from search or use Add to plan on your personal plan.
            </li>
          ) : (
            enrolled.map((course) => (
              <li
                key={course.id}
                className="flex items-center justify-between gap-3 rounded-xl px-4 py-3"
                style={{ background: "#F7F8F4", border: "1px solid #E4E1D4" }}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold" style={{ color: INK, fontFamily: "ui-monospace, monospace" }}>
                    {course.subject} {course.number}-{course.section}
                    <span className="ml-2 text-[11px] font-normal" style={{ color: MUTED }}>CRN {course.id}</span>
                  </p>
                  <p className="text-xs truncate" style={{ color: MUTED }}>{course.title}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDrop(course.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold shrink-0"
                  style={{ background: "#FDECEC", color: "#B42318", border: "1px solid #F5C2C0" }}
                >
                  <Trash2 size={13} />
                  Drop
                </button>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Course history / grades — expandable term cards */}
      <div className="mt-8">
        <p className="text-xs tracking-widest uppercase mb-2" style={{ color: GOLD, fontFamily: "ui-monospace, monospace" }}>
          Course history
        </p>
        <h2 className="text-2xl sm:text-3xl mb-2 leading-tight" style={{ fontFamily: "Georgia, serif", color: "#FFFFFF" }}>
          Classes you have taken
        </h2>
        <p className="text-sm mb-5 max-w-2xl" style={{ color: ON_DARK_MUTED }}>
          Click a term to see courses and the grades you earned.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {COURSE_HISTORY.map((termBlock) => {
            const isOpen = openHistoryTerms.has(termBlock.term);
            const termCredits = termBlock.courses.reduce((sum, c) => sum + c.credits, 0);
            return (
              <div key={termBlock.term}>
                <button
                  type="button"
                  onClick={() => toggleHistoryTerm(termBlock.term)}
                  aria-expanded={isOpen}
                  className="w-full rounded-xl px-4 py-3 mb-3 text-left transition-colors"
                  style={{
                    background: INK,
                    border: `1.5px solid ${isOpen ? GOLD : "transparent"}`,
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest" style={{ color: GOLD }}>
                        {termCredits} credits · completed
                      </p>
                      <h3 className="text-lg" style={{ fontFamily: "Georgia, serif", color: "#FFFFFF" }}>
                        {termBlock.term}
                      </h3>
                      <p className="text-[10px] mt-1" style={{ color: ON_DARK_MUTED }}>
                        {isOpen ? `${termBlock.courses.length} courses` : "Click to see courses"}
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

                {isOpen && (
                  <ul className="space-y-2 mb-1">
                    {termBlock.courses.map((course) => (
                      <li
                        key={`${termBlock.term}-${course.code}`}
                        className="flex items-center justify-between gap-3 rounded-xl px-4 py-3"
                        style={{ background: SURFACE, border: "1px solid #E4E1D4" }}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold" style={{ color: INK, fontFamily: "ui-monospace, monospace" }}>
                            {course.code}
                            <span className="ml-2 text-[11px] font-normal" style={{ color: MUTED }}>
                              {course.credits} cr
                            </span>
                          </p>
                          <p className="text-xs truncate" style={{ color: MUTED }}>{course.title}</p>
                        </div>
                        <span
                          className="shrink-0 text-sm font-bold px-3 py-1.5 rounded-full min-w-[2.75rem] text-center"
                          style={{ background: "#E8F5EE", color: GREEN }}
                          title={`Grade in ${course.code}`}
                        >
                          {course.grade}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function Registration() {
  const navigate = useNavigate();
  return (
    <div className="w-full min-h-screen" style={{ background: PAGE_BG }}>
      <div className="mx-auto px-6 py-14 max-w-7xl">
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

        <RegistrationPanel />
      </div>
    </div>
  );
}
