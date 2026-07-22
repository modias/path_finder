import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, AlertTriangle, ArrowLeft, Settings, Trash2 } from "lucide-react";

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

/** @type {Array<{
 *  subject: string, number: string, section: string, crn: string, title: string,
 *  credits: number, days: number[], time: string, enrolled: number, capacity: number,
 *  full: boolean, timeConflict: boolean, instructor: string, campus: string,
 *  scheduleType: string, level: string
 * }>} */
const CATALOG = [
  {
    subject: "DTSC", number: "1301", section: "001", crn: "21485", title: "Data and Society A",
    credits: 3, days: [1, 3, 5], time: "10:10 AM - 12:00 PM", enrolled: 32, capacity: 32,
    full: true, timeConflict: false, instructor: "Marco Scipioni", campus: "Main",
    scheduleType: "Lecture", level: "Undergraduate",
  },
  {
    subject: "DTSC", number: "1301", section: "002", crn: "21486", title: "Data and Society A",
    credits: 3, days: [2, 4], time: "02:30 PM - 05:15 PM", enrolled: 10, capacity: 10,
    full: true, timeConflict: true, instructor: "Marco Scipioni", campus: "Main",
    scheduleType: "Lecture", level: "Undergraduate",
  },
  {
    subject: "DTSC", number: "1302", section: "001", crn: "21490", title: "Data and Society B",
    credits: 3, days: [1, 3, 5], time: "01:00 PM - 02:50 PM", enrolled: 28, capacity: 30,
    full: false, timeConflict: false, instructor: "Alicia Johnson", campus: "Main",
    scheduleType: "Lecture", level: "Undergraduate",
  },
  {
    subject: "DTSC", number: "3601", section: "001", crn: "23102", title: "Predictive Analytics A",
    credits: 3, days: [2, 4], time: "09:30 AM - 10:45 AM", enrolled: 24, capacity: 28,
    full: false, timeConflict: false, instructor: "Sam Patel", campus: "Main",
    scheduleType: "Lecture", level: "Undergraduate",
  },
  {
    subject: "DTSC", number: "3602", section: "001", crn: "23103", title: "Predictive Analytics B",
    credits: 3, days: [2, 4], time: "11:00 AM - 12:15 PM", enrolled: 22, capacity: 28,
    full: false, timeConflict: false, instructor: "Sam Patel", campus: "Main",
    scheduleType: "Lecture", level: "Undergraduate",
  },
  {
    subject: "ITSC", number: "2214", section: "001", crn: "11840", title: "Data Structures and Algorithms",
    credits: 4, days: [1, 3, 5], time: "11:15 AM - 12:05 PM", enrolled: 40, capacity: 40,
    full: true, timeConflict: false, instructor: "Elena Ruiz", campus: "Main",
    scheduleType: "Lecture", level: "Undergraduate",
  },
  {
    subject: "ITSC", number: "2214", section: "002", crn: "11841", title: "Data Structures and Algorithms",
    credits: 4, days: [2, 4], time: "03:30 PM - 04:45 PM", enrolled: 18, capacity: 35,
    full: false, timeConflict: false, instructor: "Elena Ruiz", campus: "Main",
    scheduleType: "Lecture", level: "Undergraduate",
  },
  {
    subject: "ITCS", number: "4155", section: "001", crn: "22011", title: "Machine Learning",
    credits: 3, days: [1, 3], time: "02:30 PM - 03:45 PM", enrolled: 30, capacity: 35,
    full: false, timeConflict: false, instructor: "Priya Nair", campus: "Main",
    scheduleType: "Lecture", level: "Undergraduate",
  },
  {
    subject: "ITCS", number: "3160", section: "001", crn: "21988", title: "Database Design and Implementation",
    credits: 3, days: [2, 4], time: "12:30 PM - 01:45 PM", enrolled: 20, capacity: 32,
    full: false, timeConflict: false, instructor: "James Okonkwo", campus: "Main",
    scheduleType: "Lecture", level: "Undergraduate",
  },
  {
    subject: "STAT", number: "2223", section: "001", crn: "14502", title: "Elements of Statistics II",
    credits: 3, days: [1, 3, 5], time: "09:05 AM - 09:55 AM", enrolled: 45, capacity: 50,
    full: false, timeConflict: false, instructor: "Nora Kim", campus: "Main",
    scheduleType: "Lecture", level: "Undergraduate",
  },
  {
    subject: "MATH", number: "2241", section: "001", crn: "13220", title: "Calculus III",
    credits: 3, days: [1, 3, 5], time: "10:10 AM - 11:00 AM", enrolled: 38, capacity: 40,
    full: false, timeConflict: true, instructor: "David Chen", campus: "Main",
    scheduleType: "Lecture", level: "Undergraduate",
  },
];

const INITIAL_ENROLLED = [
  { id: "23102", subject: "DTSC", number: "3601", section: "001", title: "Predictive Analytics A", credits: 3 },
  { id: "23103", subject: "DTSC", number: "3602", section: "001", title: "Predictive Analytics B", credits: 3 },
  { id: "11840", subject: "ITSC", number: "2214", section: "001", title: "Data Structures and Algorithms", credits: 4 },
  { id: "22011", subject: "ITCS", number: "4155", section: "001", title: "Machine Learning", credits: 3 },
];

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

export function RegistrationPanel({ showHeading = true }) {
  const [subject, setSubject] = useState("");
  const [courseNumber, setCourseNumber] = useState("");
  const [courseLevel, setCourseLevel] = useState("");
  const [openOnly, setOpenOnly] = useState(false);
  const [searched, setSearched] = useState(false);
  const [enrolled, setEnrolled] = useState(INITIAL_ENROLLED);
  const [message, setMessage] = useState("");
  const [perPage, setPerPage] = useState(10);

  const results = useMemo(() => {
    if (!searched) return [];
    return CATALOG.filter((c) => {
      if (subject && !c.subject.toLowerCase().includes(subject.trim().toLowerCase())) return false;
      if (courseNumber && !c.number.includes(courseNumber.trim())) return false;
      if (courseLevel && !c.level.toLowerCase().includes(courseLevel.trim().toLowerCase())) return false;
      if (openOnly && c.full) return false;
      return true;
    });
  }, [searched, subject, courseNumber, courseLevel, openOnly]);

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
    if (enrolled.some((c) => c.id === section.crn)) {
      flash(`CRN ${section.crn} is already on your schedule.`);
      return;
    }
    if (section.full) {
      flash(`${section.subject} ${section.number}-${section.section} is FULL.`);
      return;
    }
    setEnrolled((prev) => [
      ...prev,
      {
        id: section.crn,
        subject: section.subject,
        number: section.number,
        section: section.section,
        title: section.title,
        credits: section.credits,
      },
    ]);
    flash(`Added ${section.subject} ${section.number}-${section.section}.`);
  };

  const dropClass = (id) => {
    const course = enrolled.find((c) => c.id === id);
    setEnrolled((prev) => prev.filter((c) => c.id !== id));
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
          <p className="text-base mb-8 max-w-2xl" style={{ color: ON_DARK_MUTED }}>
            Search by subject and course number (try DTSC + 1301), then add or drop sections.
          </p>
        </>
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
          <p className="text-xs mt-0.5" style={{ color: MUTED }}>Search by subject, number, and level</p>
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
            <table className="w-full text-left border-collapse min-w-[980px]">
              <thead>
                <tr style={{ background: "#F0EEE6", borderBottom: "1px solid #D8D5C8" }}>
                  {[
                    "Subject", "Course", "Section", "CRN", "Course Title", "Credit Hours",
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
                    <td colSpan={12} className="px-4 py-8 text-sm text-center" style={{ color: MUTED }}>
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
              <span>Page 1 of 1</span>
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
              No classes enrolled. Search and add one.
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
                  onClick={() => dropClass(course.id)}
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
    </div>
  );
}

export default function Registration() {
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
          <Link to="/" className="flex items-center gap-2 text-sm" style={{ color: "#FFFFFF" }}>
            <ArrowLeft size={16} /> Home
          </Link>
        </div>

        <RegistrationPanel />
      </div>
    </div>
  );
}
