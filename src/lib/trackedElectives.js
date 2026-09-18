import { COURSES } from "../data/courseCatalog.js";
import { enrichCourseForTopicMatching } from "../data/cciTopicPool.js";
import { TRACKED_ELECTIVE_CODES } from "../data/curriculum.js";
import { normalizeCode } from "../data/prerequisites.js";
import { getEligibleCourses } from "./eligibility.js";
import {
  scoreCourseForReflect,
  scoreCourseForReflectDetail,
  GOOD_OPTION_MIN,
  GOOD_OPTION_PERCENT,
} from "./reflectScoring.js";
import { buildStudentRecord } from "./studentRecord.js";

export const ELECTIVE_RECOMMEND_THRESHOLD = GOOD_OPTION_MIN;

/** Match % below this (Weak match) shows a "Show another" refresh control. */
export const LOW_MATCH_REFRESH_PERCENT = GOOD_OPTION_PERCENT;

/** Max elective cards shown in ElectivesPanel. */
export const MAX_DISPLAYED_ELECTIVES = 4;

/** @type {Map<string, import("../data/courseCatalog.js").CatalogCourse>} */
const catalogByCode = new Map(
  COURSES.map((course) => [normalizeCode(`${course.subject} ${course.number}`), course])
);

/**
 * All outside-elective codes in the catalog (refresh pool + tracked set).
 * @returns {string[]}
 */
export function listOutsideElectiveCodes() {
  return COURSES.filter((course) => course.category === "outside_elective").map((course) =>
    normalizeCode(`${course.subject} ${course.number}`)
  );
}

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
 * @param {string} code
 * @param {{ interestRatings?: Record<string, number>, styleRatings?: Record<string, number> }} reflectAnswers
 * @param {{
 *   record?: { completed: string[], inProgress: string[] },
 *   eligibleCodes?: Set<string>,
 * }} [opts]
 */
function buildElectiveCard(code, reflectAnswers, opts = {}) {
  const record = opts.record ?? buildStudentRecord();
  const eligibleCodes =
    opts.eligibleCodes ??
    new Set(
      getEligibleCourses(COURSES, record).map((course) =>
        normalizeCode(`${course.subject} ${course.number}`)
      )
    );

  const catalog = lookupTrackedElectiveCatalog(code);
  const normalized = normalizeCode(code);
  const status = getElectiveStatus(code, record);
  const detail = scoreCourseForReflectDetail(code, reflectAnswers);

  return {
    code: normalized,
    name: catalog?.name || normalized,
    hrs: catalog?.hrs ?? 3,
    blurb: catalog?.blurb || "",
    status,
    recommended: isRecommendedElective(code, reflectAnswers, eligibleCodes),
    matchPercent: detail.matchPercent,
    matchLabel: detail.label,
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

  return TRACKED_ELECTIVE_CODES.map((code) =>
    buildElectiveCard(code, reflectAnswers, { record, eligibleCodes })
  );
}

/**
 * Build elective cards for an explicit list of codes (used after refresh swaps).
 * @param {string[]} codes
 * @param {{ interestRatings?: Record<string, number>, styleRatings?: Record<string, number> }} reflectAnswers
 */
export function buildElectivesForCodes(codes, reflectAnswers = {}) {
  const record = buildStudentRecord();
  const eligibleCodes = new Set(
    getEligibleCourses(COURSES, record).map((course) =>
      normalizeCode(`${course.subject} ${course.number}`)
    )
  );

  return codes.map((code) => buildElectiveCard(code, reflectAnswers, { record, eligibleCodes }));
}

/**
 * Next best outside elective not already on screen (and not completed).
 * Prefers higher match %, then eligibility/recommended, then code order.
 *
 * @param {{
 *   excludeCodes?: string[],
 *   reflectAnswers?: { interestRatings?: Record<string, number>, styleRatings?: Record<string, number> },
 * }} [opts]
 * @returns {ReturnType<typeof buildElectiveCard> | null}
 */
export function pickAlternateElective({ excludeCodes = [], reflectAnswers = {} } = {}) {
  const record = buildStudentRecord();
  const eligibleCodes = new Set(
    getEligibleCourses(COURSES, record).map((course) =>
      normalizeCode(`${course.subject} ${course.number}`)
    )
  );
  const excluded = new Set(excludeCodes.map((code) => normalizeCode(code)));

  const candidates = listOutsideElectiveCodes()
    .filter((code) => !excluded.has(code))
    .map((code) => buildElectiveCard(code, reflectAnswers, { record, eligibleCodes }))
    .filter((course) => course.status !== "completed")
    .sort((a, b) => {
      const aPct = a.matchPercent ?? -1;
      const bPct = b.matchPercent ?? -1;
      if (aPct !== bPct) return bPct - aPct;

      const aRec = a.recommended ? 0 : 1;
      const bRec = b.recommended ? 0 : 1;
      if (aRec !== bRec) return aRec - bRec;

      return a.code.localeCompare(b.code);
    });

  return candidates[0] ?? null;
}

/**
 * Starting list for ElectivesPanel: non-completed tracked electives, then
 * best outside alternates until MAX_DISPLAYED_ELECTIVES.
 *
 * @param {{ interestRatings?: Record<string, number>, styleRatings?: Record<string, number> }} [reflectAnswers]
 * @returns {string[]}
 */
export function buildInitialElectiveCodes(reflectAnswers = {}) {
  const tracked = buildTrackedElectives(reflectAnswers)
    .filter((course) => course.status !== "completed")
    .map((course) => course.code);

  const codes = tracked.slice(0, MAX_DISPLAYED_ELECTIVES);

  while (codes.length < MAX_DISPLAYED_ELECTIVES) {
    const next = pickAlternateElective({ excludeCodes: codes, reflectAnswers });
    if (!next) break;
    codes.push(next.code);
  }

  return codes;
}
