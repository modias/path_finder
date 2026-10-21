import { CAREERS, COURSE_CAREER_ROLES } from "../data/curriculum.js";
import { normalizeCode } from "../data/prerequisites.js";
import { buildInitialElectiveCodes } from "./trackedElectives.js";
import {
  CAREER_BY_INTEREST,
  interestKeysForCourse,
  inferCareerTarget,
} from "./reflectScoring.js";

/** A 5/5 Reflect specialty can surface that career alongside classes already taken. */
export const INTEREST_CAREER_WEIGHT = 1;

/** A course built for a role outweighs one that only shares a specialty area. */
export const DIRECT_COURSE_WEIGHT = 2;
export const INTEREST_COURSE_WEIGHT = 1;

const DIRECT_COURSE_ORDER = new Map(
  Object.keys(COURSE_CAREER_ROLES).map((code, index) => [code, index])
);

/** @param {string} code */
function directCourseRank(code) {
  return DIRECT_COURSE_ORDER.get(code) ?? Number.MAX_SAFE_INTEGER;
}

/**
 * @param {string} code normalized course code
 * @returns {Map<string, { weight: number, interests: string[] }>}
 */
function rolesForCourse(code) {
  /** @type {Map<string, { weight: number, interests: string[] }>} */
  const roles = new Map();

  for (const key of interestKeysForCourse(code)) {
    const role = CAREER_BY_INTEREST[key];
    if (!role) continue;
    const entry = roles.get(role) || { weight: INTEREST_COURSE_WEIGHT, interests: [] };
    entry.interests.push(key);
    roles.set(role, entry);
  }

  for (const role of COURSE_CAREER_ROLES[code] || []) {
    const entry = roles.get(role) || { weight: 0, interests: [] };
    entry.weight = DIRECT_COURSE_WEIGHT;
    roles.set(role, entry);
  }

  return roles;
}

/**
 * @param {string[]} courseCodes
 * @returns {Map<string, { score: number, courses: string[], interests: string[] }>}
 *   `courses` is ordered strongest match first.
 */
export function scoreCareersFromCourses(courseCodes = []) {
  /** @type {Map<string, { score: number, courses: Map<string, number>, interests: Set<string> }>} */
  const byRole = new Map();

  for (const code of new Set(courseCodes.map(normalizeCode).filter(Boolean))) {
    for (const [role, { weight, interests }] of rolesForCourse(code)) {
      const entry = byRole.get(role) || {
        score: 0,
        courses: new Map(),
        interests: new Set(),
      };
      entry.score += weight;
      entry.courses.set(code, weight);
      for (const key of interests) entry.interests.add(key);
      byRole.set(role, entry);
    }
  }

  /** @type {Map<string, { score: number, courses: string[], interests: string[] }>} */
  const result = new Map();
  for (const [role, entry] of byRole) {
    result.set(role, {
      score: entry.score,
      courses: [...entry.courses]
        .sort(
          (a, b) =>
            b[1] - a[1] ||
            directCourseRank(a[0]) - directCourseRank(b[0]) ||
            a[0].localeCompare(b[0])
        )
        .map(([code]) => code),
      interests: [...entry.interests].sort(),
    });
  }
  return result;
}

/**
 * Courses the student is on track to take: Reflect recommendations first,
 * otherwise recommended tracked electives from their ratings.
 *
 * @param {{
 *   recommendations?: Array<{ code?: string }>,
 *   reflectAnswers?: Record<string, unknown>,
 * }} [options]
 * @returns {string[]}
 */
export function collectPlannedCourseCodes({
  recommendations = [],
  reflectAnswers = {},
} = {}) {
  const fromRecs = recommendations
    .map((course) => normalizeCode(course?.code || ""))
    .filter(Boolean);

  if (fromRecs.length) {
    return [...new Set(fromRecs)];
  }

  return buildInitialElectiveCodes(reflectAnswers);
}

/**
 * @param {string} code
 * @param {Record<string, string>} courseTitles
 */
function courseLabel(code, courseTitles) {
  const title = courseTitles[code];
  return title ? `${title} (${code})` : code;
}

/**
 * @param {string} role
 * @param {Record<string, number>} [interestRatings]
 * @returns {number}
 */
export function interestScoreForRole(role, interestRatings = {}) {
  let max = 0;
  for (const [key, careerRole] of Object.entries(CAREER_BY_INTEREST)) {
    if (careerRole !== role) continue;
    const rating = interestRatings[key];
    if (rating != null && rating > max) max = rating;
  }
  return max * INTEREST_CAREER_WEIGHT;
}

/**
 * @param {string[]} takenCourses
 * @param {string[]} plannedCourses
 * @param {Record<string, string>} courseTitles
 * @param {number} [interestScore]
 */
function buildMatchReason(takenCourses, plannedCourses, courseTitles, interestScore = 0) {
  if (takenCourses.length) {
    const extra = takenCourses.length - 1;
    return `You've taken ${courseLabel(takenCourses[0], courseTitles)}${
      extra ? ` + ${extra} more related class${extra === 1 ? "" : "es"}` : ""
    }.`;
  }
  if (plannedCourses.length === 1) {
    return `Fits courses like ${plannedCourses[0]} on your plan.`;
  }
  if (plannedCourses.length) {
    return `Fits courses like ${plannedCourses.slice(0, 3).join(", ")} on your plan.`;
  }
  if (interestScore > 0) {
    return "Matches the specialties you rated highest on Reflect.";
  }
  return "Based on your interests.";
}

/**
 * Rank CAREERS by the classes this student has taken and will take.
 * Falls back to a single inferred career when no course→career signal exists.
 *
 * @param {{
 *   takenCodes?: string[],
 *   courseCodes?: string[],
 *   recommendations?: Array<{ code?: string }>,
 *   reflectAnswers?: Record<string, unknown>,
 *   courseTitles?: Record<string, string>,
 *   careers?: typeof CAREERS,
 * }} [options]
 * @returns {Array<typeof CAREERS[number] & {
 *   score: number,
 *   takenScore: number,
 *   takenCourses: string[],
 *   supportingCourses: string[],
 *   matchReason: string,
 * }>}
 */
export function rankCareersForStudent({
  takenCodes = [],
  courseCodes,
  recommendations = [],
  reflectAnswers = {},
  courseTitles = {},
  careers = CAREERS,
} = {}) {
  const taken = [...new Set(takenCodes.map(normalizeCode).filter(Boolean))];
  const takenSet = new Set(taken);
  const planned = (
    courseCodes ?? collectPlannedCourseCodes({ recommendations, reflectAnswers })
  )
    .map(normalizeCode)
    .filter((code) => code && !takenSet.has(code));

  const takenScores = scoreCareersFromCourses(taken);
  const plannedScores = scoreCareersFromCourses(planned);
  const interestRatings = reflectAnswers.interestRatings || {};

  const matched = careers
    .map((career) => {
      const fromTaken = takenScores.get(career.role);
      const fromPlan = plannedScores.get(career.role);
      const interestScore = interestScoreForRole(career.role, interestRatings);
      if (!fromTaken && !fromPlan && !interestScore) return null;
      const takenCourses = fromTaken?.courses || [];
      const supportingCourses = fromPlan?.courses || [];
      return {
        ...career,
        score: (fromTaken?.score || 0) + (fromPlan?.score || 0) + interestScore,
        takenScore: fromTaken?.score || 0,
        interestScore,
        takenCourses,
        supportingCourses,
        matchReason: buildMatchReason(
          takenCourses,
          supportingCourses,
          courseTitles,
          interestScore
        ),
      };
    })
    .filter(Boolean)
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.takenScore - a.takenScore ||
        (b.interestScore || 0) - (a.interestScore || 0) ||
        a.role.localeCompare(b.role)
    );

  if (matched.length) return matched;

  const fallbackRole = inferCareerTarget(reflectAnswers);
  const fallback = careers.find((career) => career.role === fallbackRole) || careers[0];
  if (!fallback) return [];

  return [
    {
      ...fallback,
      score: 0,
      takenScore: 0,
      takenCourses: [],
      supportingCourses: [],
      matchReason: taken.length || planned.length
        ? "Based on your interests — your courses didn't map to a specialty career yet."
        : "Get course recommendations first to tailor careers to classes you'll take.",
    },
  ];
}
