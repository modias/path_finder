import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, NotebookPen } from "lucide-react";
import {
  BROWSE_BUCKETS,
  BROWSE_BUCKET_META,
  CATEGORY_META,
  COURSES,
  courseMatchesBrowseBucket,
} from "../data/courseCatalog";

const INK = "#0B2E22";
const GOLD = "#B3A369";
const GREEN = "#1F7A54";
const SURFACE = "#FFFFFF";
const MUTED = "#5B6660";

const CATEGORY_COLORS = {
  gen_ed: { bg: "#E8F1FB", color: "#1A5FA8" },
  core: { bg: "#E8F5EE", color: GREEN },
  outside_elective: { bg: "#F3EAF8", color: "#7B4B9A" },
  computing: { bg: "#EEF0EA", color: INK },
  capstone: { bg: "#F3EED9", color: "#8C7F4B" },
};

const BUCKET_COLORS = {
  core: { bg: "#E8F5EE", color: GREEN },
  outside_elective: { bg: "#F3EAF8", color: "#7B4B9A" },
};

/**
 * Embeddable course catalog browser.
 * @param {{ registerPath?: string, showRegisterCta?: boolean }} props
 */
export default function CatalogBrowser({
  registerPath = "/register-courses",
  showRegisterCta = true,
}) {
  const [activeCategory, setActiveCategory] = useState("");

  const bucketCounts = useMemo(() => {
    const counts = Object.fromEntries(BROWSE_BUCKETS.map((b) => [b.id, 0]));
    COURSES.forEach((c) => {
      BROWSE_BUCKETS.forEach((b) => {
        if (b.categories.includes(c.category)) counts[b.id] += 1;
      });
    });
    return counts;
  }, []);

  const filtered = useMemo(() => {
    if (!activeCategory) return [];
    return COURSES.filter((c) => courseMatchesBrowseBucket(c, activeCategory));
  }, [activeCategory]);

  const coreSections = useMemo(() => {
    if (activeCategory !== "core") return [];
    const order = ["gen_ed", "computing", "core", "capstone"];
    return order.map((id) => ({
      id,
      meta: CATEGORY_META[id],
      colors: CATEGORY_COLORS[id],
      courses: filtered.filter((c) => c.category === id),
    }));
  }, [activeCategory, filtered]);

  const activeMeta = BROWSE_BUCKET_META[activeCategory];

  const selectCategory = (id) => {
    setActiveCategory((prev) => (prev === id ? "" : id));
  };

  const renderCourseRow = (course) => {
    const colors = CATEGORY_COLORS[course.category] || CATEGORY_COLORS.outside_elective;
    const meta = CATEGORY_META[course.category];
    return (
      <li key={`${course.subject}-${course.number}`} className="px-5 py-3.5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <p className="text-sm font-semibold" style={{ color: INK, fontFamily: "ui-monospace, monospace" }}>
                {course.subject} {course.number}
              </p>
              <span
                className="text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-full"
                style={{ background: colors.bg, color: colors.color }}
              >
                {meta?.short}
              </span>
              <span className="text-[11px]" style={{ color: MUTED }}>{course.credits} credits</span>
            </div>
            <h3 className="text-sm font-semibold mb-1" style={{ color: INK }}>{course.title}</h3>
            {course.blurb && (
              <p className="text-xs leading-relaxed" style={{ color: MUTED }}>{course.blurb}</p>
            )}
            {course.prereqs && (
              <p className="text-[11px] mt-1.5" style={{ color: "#8C7F4B" }}>
                Prereqs: {course.prereqs}
              </p>
            )}
          </div>
          <Link
            to={`${registerPath}?subject=${course.subject}&number=${course.number}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full shrink-0"
            style={{ background: "#EEF0EA", color: INK, border: "1px solid #C8C5B8" }}
          >
            <BookOpen size={13} />
            Find sections
          </Link>
        </div>
      </li>
    );
  };

  return (
    <div>
      {showRegisterCta && (
        <div className="flex flex-wrap gap-3 mb-6">
          <Link
            to={registerPath}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold"
            style={{ background: GOLD, color: INK }}
          >
            <NotebookPen size={16} />
            Go to Register courses
          </Link>
          {activeCategory && (
            <Link
              to={`${registerPath}?category=${activeCategory}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold"
              style={{ background: GREEN, color: "#FFFFFF" }}
            >
              Find sections in {activeMeta?.short || "category"}
              <ArrowRight size={16} />
            </Link>
          )}
        </div>
      )}

      <div className="rounded-2xl overflow-hidden mb-6" style={{ background: SURFACE, border: "1px solid #E4E1D4" }}>
        <div className="px-6 py-4" style={{ borderBottom: "1px solid #E4E1D4" }}>
          <h2 className="text-lg font-semibold" style={{ color: INK }}>Browse by category</h2>
          <p className="text-xs mt-0.5" style={{ color: MUTED }}>
            Click a bucket to open its course list
          </p>
        </div>
        <div className="px-4 py-4 grid sm:grid-cols-2 gap-3">
          {BROWSE_BUCKETS.map((bucket) => {
            const colors = BUCKET_COLORS[bucket.id] || BUCKET_COLORS.outside_elective;
            const active = activeCategory === bucket.id;
            return (
              <button
                key={bucket.id}
                type="button"
                onClick={() => selectCategory(bucket.id)}
                className="text-left rounded-xl px-4 py-3 transition-opacity hover:opacity-90"
                style={{
                  background: colors.bg,
                  border: `1.5px solid ${active ? colors.color : "#E4E1D4"}`,
                }}
              >
                <p className="text-sm font-semibold" style={{ color: colors.color }}>{bucket.label}</p>
                <p className="text-xs mt-0.5" style={{ color: MUTED }}>
                  {bucketCounts[bucket.id] || 0} courses
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {activeCategory && (
        <div className="rounded-2xl overflow-hidden" style={{ background: SURFACE, border: "1px solid #E4E1D4" }}>
          <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-3" style={{ borderBottom: "1px solid #E4E1D4" }}>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: INK }}>
                {activeMeta.label}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: MUTED }}>
                {filtered.length} course{filtered.length === 1 ? "" : "s"} in this category
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveCategory("")}
              className="text-xs font-semibold px-3 py-1.5 rounded-full"
              style={{ background: "#F5F6F1", color: MUTED, border: "1px solid #E4E1D4" }}
            >
              Close
            </button>
          </div>

          {activeCategory === "core" ? (
            <div className="p-4 grid sm:grid-cols-2 gap-4">
              {coreSections.map((section) => (
                <div
                  key={section.id}
                  className="rounded-xl overflow-hidden"
                  style={{
                    background: SURFACE,
                    border: `1.5px solid ${section.colors.color}33`,
                  }}
                >
                  <div
                    className="px-4 py-3 flex items-center justify-between gap-2"
                    style={{ background: section.colors.bg, borderBottom: `1px solid ${section.colors.color}22` }}
                  >
                    <h3 className="text-sm font-semibold" style={{ color: section.colors.color }}>
                      {section.meta.label}
                    </h3>
                    <span className="text-[11px]" style={{ color: MUTED }}>
                      {section.courses.length} course{section.courses.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <ul className="divide-y" style={{ borderColor: "#E4E1D4" }}>
                    {section.courses.map(renderCourseRow)}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <ul className="divide-y" style={{ borderColor: "#E4E1D4" }}>
              {filtered.map(renderCourseRow)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
