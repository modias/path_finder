import { CAREERS } from "../data/curriculum.js";
import { normalizeCode } from "../data/prerequisites.js";
import { buildTrackedElectives } from "./trackedElectives.js";
import {
  CAREER_BY_INTEREST,
  interestKeysForCourse,
  inferCareerTarget,
} from "./reflectScoring.js";

/**
 * @param {string[]} courseCodes
 * @returns {Map<string, { score: number, courses: string[], interests: string[] }>}
 */
export function scoreCareersFromCourses(courseCodes = []) {
  /** @type {Map<string, { score: number, courses: Set<string>, interests: Set<string> }>} */
  const byRole = new Map();

  for (const raw of courseCodes) {
    const code = normalizeCode(raw);
    if (!code) continue;
    const keys = interestKeysForCourse(code);
    for (const key of keys) {
      const role = CAREER_BY_INTEREST[key];
      if (!role) continue;
      const entry = byRole.get(role) || {
        score: 0,
        courses: new Set(),
        interests: new Set(),
      };
      if (!entry.courses.has(code)) {
        entry.score += 1;
        entry.courses.add(code);
      }
      entry.interests.add(key);
      byRole.set(role, entry);
    }
  }

  /** @type {Map<string, { score: number, courses: string[], interests: string[] }>} */
  const result = new Map();
  for (const [role, entry] of byRole) {
    result.set(role, {
      score: entry.score,
      courses: [...entry.courses].sort(),
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

  const fromElectives = buildTrackedElectives(reflectAnswers)
    .filter((course) => course.recommended)
    .map((course) => normalizeCode(course.code));

  return [...new Set(fromElectives)];
}

/**
 * Rank CAREERS by the courses this student will take.
 * Falls back to a single inferred career when no course→career signal exists.
 *
 * @param {{
 *   courseCodes?: string[],
 *   recommendations?: Array<{ code?: string }>,
 *   reflectAnswers?: Record<string, unknown>,
 *   careers?: typeof CAREERS,
 * }} [options]
 * @returns {Array<typeof CAREERS[number] & { score: number, supportingCourses: string[], matchReason: string }>}
 */
export function rankCareersForStudent({
  courseCodes,
  recommendations = [],
  reflectAnswers = {},
  careers = CAREERS,
} = {}) {
  const codes =
    courseCodes ??
    collectPlannedCourseCodes({ recommendations, reflectAnswers });

  const scores = scoreCareersFromCourses(codes);
  const matched = careers
    .map((career) => {
      const hit = scores.get(career.role);
      if (!hit) return null;
      return {
        ...career,
        score: hit.score,
        supportingCourses: hit.courses,
        matchReason:
          hit.courses.length === 1
            ? `Fits courses like ${hit.courses[0]} on your plan.`
            : `Fits courses like ${hit.courses.slice(0, 3).join(", ")} on your plan.`,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || a.role.localeCompare(b.role));

  if (matched.length) return matched;

  const fallbackRole = inferCareerTarget(reflectAnswers);
  const fallback = careers.find((career) => career.role === fallbackRole) || careers[0];
  if (!fallback) return [];

  return [
    {
      ...fallback,
      score: 0,
      supportingCourses: [],
      matchReason: codes.length
        ? "Based on your interests — your planned courses didn't map to a specialty career yet."
        : "Get course recommendations first to tailor careers to classes you'll take.",
    },
  ];
}
