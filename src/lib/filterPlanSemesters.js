import { checkEligibility } from "./eligibility.js";
import { normalizeCode } from "../data/prerequisites.js";

/**
 * @typedef {{ completed: string[], inProgress: string[] }} StudentRecord
 * @typedef {{ code: string, title: string, category?: string, credits: number }} PlanCourse
 * @typedef {{ term: string, recommendedCredits?: number, courses: PlanCourse[] }} PlanSemester
 */

/**
 * Filter one semester's courses with checkEligibility.
 * Other courses in the same semester count as in-progress so mutual coreqs
 * (e.g. DTSC 2301 + DTSC 2302) can appear together when prereqs are met.
 *
 * @param {PlanCourse[]} courses
 * @param {StudentRecord} record
 * @returns {PlanCourse[]}
 */
export function filterSemesterCourses(courses, record) {
  const completed = new Set((record.completed || []).map(normalizeCode));
  const alreadyInProgress = new Set((record.inProgress || []).map(normalizeCode));
  const list = courses || [];

  /** @type {PlanCourse[]} */
  const kept = [];

  for (const course of list) {
    const code = normalizeCode(course.code);
    if (completed.has(code) || alreadyInProgress.has(code)) continue;

    // Peers in this semester (not yet decided + already kept) satisfy coreqs.
    const peerCodes = list
      .map((c) => normalizeCode(c.code))
      .filter((peer) => peer !== code && !completed.has(peer));

    const trialRecord = {
      completed: [...completed],
      inProgress: [...new Set([...alreadyInProgress, ...peerCodes, ...kept.map((c) => normalizeCode(c.code))])],
    };

    if (checkEligibility(code, trialRecord).eligible) {
      kept.push(course);
    }
  }

  return kept;
}

const CATEGORY_PRIORITY = { required: 0, general_ed: 1, elective: 2 };

/**
 * Keep highest-priority courses up to a credit target (required first).
 *
 * @param {PlanCourse[]} courses
 * @param {number} targetCredits
 * @returns {PlanCourse[]}
 */
export function trimCoursesToLoad(courses, targetCredits) {
  if (!targetCredits || targetCredits <= 0) return courses || [];

  const list = courses || [];
  const sorted = [...list].sort((a, b) => {
    const pa = CATEGORY_PRIORITY[a.category] ?? 3;
    const pb = CATEGORY_PRIORITY[b.category] ?? 3;
    if (pa !== pb) return pa - pb;
    return list.indexOf(a) - list.indexOf(b);
  });

  const kept = new Set();
  let total = 0;
  for (const course of sorted) {
    if (total + course.credits <= targetCredits) {
      kept.add(course.code);
      total += course.credits;
    }
  }

  return list.filter((course) => kept.has(course.code));
}

/**
 * Filter a multi-term plan with prerequisite rules.
 * Later terms assume earlier kept courses will be completed — so Fall can list
 * DTSC 1301/1302 and Spring can unlock DTSC 2301/2302.
 *
 * @param {PlanSemester[]} semesters
 * @param {StudentRecord} record
 * @param {{ creditLoad?: number }} [options]
 * @returns {PlanSemester[]}
 */
export function filterPlanSemesters(semesters, record, { creditLoad } = {}) {
  /** @type {StudentRecord} */
  let working = {
    completed: [...(record.completed || []).map(normalizeCode)],
    inProgress: [...(record.inProgress || []).map(normalizeCode)],
  };

  return (semesters || []).map((semester) => {
    let courses = filterSemesterCourses(semester.courses || [], working);
    if (creditLoad != null && creditLoad > 0) {
      courses = trimCoursesToLoad(courses, creditLoad);
    }

    // Planned courses count as completed for later terms.
    const planned = courses.map((c) => normalizeCode(c.code));
    const plannedSet = new Set(planned);
    working = {
      completed: [...new Set([...working.completed, ...planned])],
      inProgress: working.inProgress.filter((code) => !plannedSet.has(code)),
    };

    return { ...semester, courses };
  });
}
