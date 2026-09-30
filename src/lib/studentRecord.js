import { COURSE_HISTORY } from "../data/curriculum.js";
import { COURSES } from "../data/courseCatalog.js";
import { courseKey, normalizeCode } from "../data/prerequisites.js";

/**
 * @typedef {{ completed: string[], inProgress: string[] }} StudentRecord
 */

/**
 * Build the mock student record from course history.
 * @returns {StudentRecord}
 */
// Intentionally reads only the fixed curriculum mock, not the register-courses
// localStorage schedule. This keeps the recommend API on a fixed student
// story and avoids mid-session eligibility changes. Wiring the schedule in
// is a deliberate product decision for later, not something to "fix" here.
export function buildStudentRecord() {
  /** @type {Set<string>} */
  const completed = new Set();
  /** @type {Set<string>} */
  const inProgress = new Set();

  for (const term of COURSE_HISTORY) {
    for (const course of term.courses) {
      const code = normalizeCode(course.code);
      if (course.grade === "IP") inProgress.add(code);
      else if (course.grade) completed.add(code);
    }
  }

  // Completed courses supersede in-progress for the same code.
  for (const code of completed) inProgress.delete(code);

  return {
    completed: [...completed].sort(),
    inProgress: [...inProgress].sort(),
  };
}

/**
 * Course code → title for every course in the student's history.
 * Catalog titles win over the history mock's names, which can be stale.
 * @returns {Record<string, string>}
 */
export function courseHistoryTitles() {
  const catalogTitles = new Map(
    COURSES.map((course) => [courseKey(course.subject, course.number), course.title])
  );
  return Object.fromEntries(
    COURSE_HISTORY.flatMap((term) =>
      term.courses.map((course) => {
        const code = normalizeCode(course.code);
        return [code, catalogTitles.get(code) || course.title];
      })
    )
  );
}
