import { GEN_ED, MAJOR_SECTIONS, ELECTIVES } from "../data/degreeWorks.js";
import { COURSE_HISTORY } from "../data/curriculum.js";
import { normalizeCode } from "../data/prerequisites.js";

/**
 * @typedef {{ completed: string[], inProgress: string[] }} StudentRecord
 */

/**
 * Build the mock student record from Degree Works + course history data.
 * @returns {StudentRecord}
 */
export function buildStudentRecord() {
  /** @type {Set<string>} */
  const completed = new Set();
  /** @type {Set<string>} */
  const inProgress = new Set();

  for (const section of MAJOR_SECTIONS) {
    for (const course of section.courses) {
      const code = normalizeCode(course.code);
      if (course.status === "completed") completed.add(code);
      else if (course.status === "in_progress") inProgress.add(code);
    }
  }

  for (const course of ELECTIVES) {
    const code = normalizeCode(course.code);
    if (course.status === "completed") completed.add(code);
    else if (course.status === "in_progress") inProgress.add(code);
  }

  for (const item of GEN_ED) {
    if (!item.taken) continue;
    const taken = String(item.taken);
    if (/^[A-Za-z]+\s+\d/.test(taken)) {
      const code = normalizeCode(taken);
      if (item.status === "completed") completed.add(code);
      else if (item.status === "in_progress") inProgress.add(code);
    }
  }

  for (const term of COURSE_HISTORY) {
    for (const course of term.courses) {
      const code = normalizeCode(course.code);
      if (course.grade && course.grade !== "IP") completed.add(code);
    }
  }

  // Completed courses supersede in-progress for the same code.
  for (const code of completed) inProgress.delete(code);

  return {
    completed: [...completed].sort(),
    inProgress: [...inProgress].sort(),
  };
}
