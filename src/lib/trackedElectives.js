import { COURSES } from "../data/courseCatalog.js";
import { enrichCourseForTopicMatching } from "../data/cciTopicPool.js";
import { TRACKED_ELECTIVE_CODES } from "../data/curriculum.js";
import { normalizeCode } from "../data/prerequisites.js";
import { getEligibleCourses } from "./eligibility.js";
import {
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
 * Whether the student has answered anything on Reflect that the scorer reads.
 * @param {{
 *   interestRatings?: Record<string, number>,
 *   styleRatings?: Record<string, number>,
 *   industries?: string[],
 *   topicsEnjoyed?: string[],
 *   skillsHave?: string[],
 *   skillsWant?: string[],
 *   deliverables?: string[],
 * }} [reflectAnswers]
 * @returns {boolean}
 */
export function hasReflectAnswers(reflectAnswers = {}) {
  const ratings = [reflectAnswers.interestRatings, reflectAnswers.styleRatings];
  if (ratings.some((map) => map && Object.values(map).some((value) => value != null))) return true;
  return ["industries", "topicsEnjoyed", "skillsHave", "skillsWant", "deliverables"].some(
    (key) => Array.isArray(reflectAnswers[key]) && reflectAnswers[key].length > 0
  );
}

/**
 * Eligible, clears the Good option threshold, and the score was actually moved
 * by the student's answers — a neutral default score never earns the badge.
 * @param {string} code
 * @param {{ interestRatings?: Record<string, number>, styleRatings?: Record<string, number> }} reflectAnswers
 * @param {Set<string>} eligibleCodes
 * @returns {boolean}
 */
export function isRecommendedElective(code, reflectAnswers, eligibleCodes) {
  const normalized = normalizeCode(code);
  if (!eligibleCodes.has(normalized)) return false;
  const detail = scoreCourseForReflectDetail(code, reflectAnswers);
  return detail.drivers.length > 0 && detail.score >= ELECTIVE_RECOMMEND_THRESHOLD;
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
 * @typedef {{ code: string, reason?: string, syllabusGrounded?: boolean }} RecommendationResult
 */

/**
 * Syllabus-grounded reason for `code` from this student's recommendation run, if any.
 * @param {string} code
 * @param {RecommendationResult[]} [recommendations]
 * @returns {string | null}
 */
export function groundedReasonFor(code, recommendations = []) {
  const normalized = normalizeCode(code);
  const match = recommendations.find(
    (rec) => rec?.syllabusGrounded && rec.code && normalizeCode(rec.code) === normalized
  );
  const reason = typeof match?.reason === "string" ? match.reason.trim() : "";
  return reason || null;
}

/**
 * @param {string} code
 * @param {{ interestRatings?: Record<string, number>, styleRatings?: Record<string, number> }} reflectAnswers
 * @param {{
 *   record?: { completed: string[], inProgress: string[] },
 *   eligibleCodes?: Set<string>,
 *   recommendations?: RecommendationResult[],
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
  const name = catalog?.name || normalized;
  const blurb = catalog?.blurb || "";
  const groundedReason = groundedReasonFor(normalized, opts.recommendations);

  return {
    code: normalized,
    name,
    hrs: catalog?.hrs ?? 3,
    blurb,
    description: groundedReason || blurb || name,
    descriptionSource: groundedReason ? "syllabus" : "catalog",
    status,
    recommended: isRecommendedElective(code, reflectAnswers, eligibleCodes),
    matchPercent: detail.matchPercent,
    matchLabel: detail.label,
    personalized: detail.drivers.length > 0,
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
 * @param {{ record?: { completed: string[], inProgress: string[] }, recommendations?: RecommendationResult[] }} [opts]
 */
export function buildElectivesForCodes(codes, reflectAnswers = {}, opts = {}) {
  const record = opts.record ?? buildStudentRecord();
  const eligibleCodes = new Set(
    getEligibleCourses(COURSES, record).map((course) =>
      normalizeCode(`${course.subject} ${course.number}`)
    )
  );

  return codes.map((code) =>
    buildElectiveCard(code, reflectAnswers, {
      record,
      eligibleCodes,
      recommendations: opts.recommendations,
    })
  );
}

/**
 * Non-completed outside electives ranked for this student: higher match % first,
 * then courses the student's answers actually scored, then recommended, then code.
 *
 * @param {{
 *   excludeCodes?: string[],
 *   reflectAnswers?: { interestRatings?: Record<string, number>, styleRatings?: Record<string, number> },
 * }} [opts]
 * @returns {Array<ReturnType<typeof buildElectiveCard>>}
 */
export function rankOutsideElectives({ excludeCodes = [], reflectAnswers = {} } = {}) {
  const record = buildStudentRecord();
  const eligibleCodes = new Set(
    getEligibleCourses(COURSES, record).map((course) =>
      normalizeCode(`${course.subject} ${course.number}`)
    )
  );
  const excluded = new Set(excludeCodes.map((code) => normalizeCode(code)));

  return listOutsideElectiveCodes()
    .filter((code) => !excluded.has(code))
    .map((code) => buildElectiveCard(code, reflectAnswers, { record, eligibleCodes }))
    .filter((course) => course.status !== "completed")
    .sort((a, b) => {
      const aPct = a.matchPercent ?? -1;
      const bPct = b.matchPercent ?? -1;
      if (aPct !== bPct) return bPct - aPct;

      const aSignal = a.personalized ? 0 : 1;
      const bSignal = b.personalized ? 0 : 1;
      if (aSignal !== bSignal) return aSignal - bSignal;

      const aRec = a.recommended ? 0 : 1;
      const bRec = b.recommended ? 0 : 1;
      if (aRec !== bRec) return aRec - bRec;

      return a.code.localeCompare(b.code);
    });
}

/**
 * Next best outside elective not already on screen (and not completed).
 *
 * @param {Parameters<typeof rankOutsideElectives>[0]} [opts]
 * @returns {ReturnType<typeof buildElectiveCard> | null}
 */
export function pickAlternateElective(opts = {}) {
  return rankOutsideElectives(opts)[0] ?? null;
}

/**
 * Starting list for ElectivesPanel. Once the student has answered Reflect, it's
 * their top-ranked electives by match %. Before that, it falls back to the
 * plan's tracked electives, then best outside alternates.
 *
 * @param {{ interestRatings?: Record<string, number>, styleRatings?: Record<string, number> }} [reflectAnswers]
 * @returns {string[]}
 */
export function buildInitialElectiveCodes(reflectAnswers = {}) {
  if (hasReflectAnswers(reflectAnswers)) {
    return rankOutsideElectives({ reflectAnswers })
      .slice(0, MAX_DISPLAYED_ELECTIVES)
      .map((course) => course.code);
  }

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
