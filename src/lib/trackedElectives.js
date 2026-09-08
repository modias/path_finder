import { COURSES } from "../data/courseCatalog.js";
import { enrichCourseForTopicMatching } from "../data/cciTopicPool.js";
import { TRACKED_ELECTIVE_CODES } from "../data/curriculum.js";
import { normalizeCode } from "../data/prerequisites.js";
import { getEligibleCourses } from "./eligibility.js";
import { scoreCourseForReflect, GOOD_OPTION_MIN } from "./reflectScoring.js";
import { buildStudentRecord } from "./studentRecord.js";

export const ELECTIVE_RECOMMEND_THRESHOLD = GOOD_OPTION_MIN;

/** @type {Map<string, import("../data/courseCatalog.js").CatalogCourse>} */
const catalogByCode = new Map(
  COURSES.map((course) => [normalizeCode(`${course.subject} ${course.number}`), course])
);

/**
 * @param {string} code
 * @param {{ completed: string[], inProgress: string[] }} record
 * @returns {"completed" | "in_progress" | "remaining"}
 */
export function getElectiveStatus(code, record) {
  const normalized = normalizeCode(code);
  if (record.completed.includes(normalized)) return "completed";
  if (record.inProgress.includes(normalized)) return "in_progress";
  return "remaining";
}

/**
 * @param {string} code
 * @param {{ interestRatings?: Record<string, number>, styleRatings?: Record<string, number> }} reflectAnswers
 * @param {Set<string>} eligibleCodes
 * @returns {boolean}
 */
export function isRecommendedElective(code, reflectAnswers, eligibleCodes) {
  const normalized = normalizeCode(code);
  if (!eligibleCodes.has(normalized)) return false;
  return scoreCourseForReflect(code, reflectAnswers) >= ELECTIVE_RECOMMEND_THRESHOLD;
}

/**
 * @param {string} code
 * @returns {{ code: string, name: string, hrs: number, blurb: string } | null}
 */
export function lookupTrackedElectiveCatalog(code) {
  const catalog = catalogByCode.get(normalizeCode(code));
  if (!catalog) return null;

  const enriched = enrichCourseForTopicMatching({
    code: normalizeCode(code),
    title: catalog.title,
    credits: catalog.credits,
    category: catalog.category,
    blurb: catalog.blurb,
  });

  return {
    code: enriched.code,
    name: enriched.title,
    hrs: enriched.credits ?? 3,
    blurb: enriched.blurb,
  };
}

/**
 * Build tracked elective cards for ElectivesPanel from catalog + student record.
 * @param {{ interestRatings?: Record<string, number>, styleRatings?: Record<string, number> }} reflectAnswers
 */
export function buildTrackedElectives(reflectAnswers = {}) {
  const record = buildStudentRecord();
  const eligibleCodes = new Set(
    getEligibleCourses(COURSES, record).map((course) =>
      normalizeCode(`${course.subject} ${course.number}`)
    )
  );

  return TRACKED_ELECTIVE_CODES.map((code) => {
    const catalog = lookupTrackedElectiveCatalog(code);
    const normalized = normalizeCode(code);
    const status = getElectiveStatus(code, record);

    return {
      code: normalized,
      name: catalog?.name || normalized,
      hrs: catalog?.hrs ?? 3,
      blurb: catalog?.blurb || "",
      status,
      recommended: isRecommendedElective(code, reflectAnswers, eligibleCodes),
    };
  });
}
