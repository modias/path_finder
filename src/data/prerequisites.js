/**
 * Course prerequisite/corequisite rules for the B.S. Data Science catalog.
 * Rule shape: string course code | { all: Rule[] } | { oneOf: Rule[] }
 *
 * @typedef {string | { all: Rule[] } | { oneOf: Rule[] }} Rule
 * @typedef {{ prereqs: Rule[], coreqs: string[] }} CourseRules
 */

/** @type {Record<string, CourseRules>} */
export const PREREQUISITES = {
  // https://catalog.charlotte.edu/preview_course_nopop.php?catoid=27&coid=89787
  "ITSC 1213": { prereqs: [{ oneOf: ["ITSC 1212", "DTSC 1302"] }], coreqs: [] },
  // TODO: catalog also lists a pre-or-coreq of one of MATH 1100/1103/1120/1241 —
  // same oneOf-coreq engine limitation as DTSC 1302, not encoded yet.

  // https://catalog.charlotte.edu/preview_course_nopop.php?catoid=30&coid=69458
  "ITSC 2175": { prereqs: [{ all: ["ITSC 1213"] }], coreqs: [] },

  // https://catalog.charlotte.edu/preview_course_nopop.php?catoid=27&coid=89797
  "ITSC 2214": { prereqs: [{ all: ["ITSC 1213"] }], coreqs: [] },

  // https://catalog.charlotte.edu/preview_course_nopop.php?catoid=30&coid=69688
  "MATH 2164": { prereqs: [{ oneOf: ["MATH 1120", "MATH 1241"] }], coreqs: [] },

  // STAT 1222 has a MATH placement gate — not modeled as a course Rule (see eligibility notes).
  // https://catalog.charlotte.edu/preview_course_nopop.php?catoid=30&coid=70068
  "STAT 2223": { prereqs: [{ all: ["STAT 1222"] }], coreqs: [] },

  // https://catalog.charlotte.edu/preview_course_nopop.php?catoid=27&coid=91146
  "STAT 3160": { prereqs: [{ oneOf: ["STAT 2223", "STAT 3110"] }], coreqs: [] },

  // https://catalog.charlotte.edu/preview_course_nopop.php?catoid=27&coid=89811
  "ITCS 3160": { prereqs: [{ all: ["ITSC 1213"] }], coreqs: [] },

  // https://catalog.charlotte.edu/preview_course_nopop.php?catoid=27&coid=91425
  "ITCS 3162": { prereqs: [{ all: ["ITSC 2214"] }], coreqs: [] },

  // Admission to major — placement gate, not a course-completion Rule.
  "DTSC 1301": { prereqs: [], coreqs: [] },

  // TODO: coreqs only supports flat "all required" strings today, not oneOf —
  // the real requirement is DTSC 1301 AND one of STAT 1220/1221/1222. Needs an
  // engine change (see note below) before the STAT half can be encoded correctly.
  "DTSC 1302": { prereqs: [], coreqs: ["DTSC 1301"] },

  // https://catalog.charlotte.edu/preview_course_nopop.php?catoid=27&coid=96398
  "DTSC 2301": {
    prereqs: [
      { all: ["DTSC 1301", "DTSC 1302"] },
      { oneOf: ["STAT 1220", "STAT 1221", "STAT 1222"] },
    ],
    coreqs: ["DTSC 2302"],
  },
  // https://catalog.charlotte.edu/preview_course_nopop.php?catoid=27&coid=96399
  "DTSC 2302": {
    prereqs: [
      { all: ["DTSC 1301", "DTSC 1302"] },
      { oneOf: ["STAT 1220", "STAT 1221", "STAT 1222"] },
    ],
    coreqs: ["DTSC 2301"],
  },

  // https://catalog.charlotte.edu/preview_course_nopop.php?catoid=27&coid=96400
  "DTSC 3601": {
    prereqs: [{ all: ["DTSC 2301", "DTSC 2302", "ITSC 2214"] }],
    coreqs: ["DTSC 3602"],
  },
  // TODO: verify — no live catalog page located yet. Mirrors 3601's prereqs on
  // the assumption 3601/3602 are a same-term studio pair like 2301/2302; check
  // this assumption against the catalog before trusting it.
  "DTSC 3602": {
    prereqs: [{ all: ["DTSC 2301", "DTSC 2302", "ITSC 2214"] }],
    coreqs: ["DTSC 3601"],
  },

  // Senior standing omitted — course-completion prereq only.
  "DTSC 4301": { prereqs: [{ all: ["DTSC 3602"] }], coreqs: [] },
  "DTSC 4302": { prereqs: [], coreqs: ["DTSC 4301"] },
};

/** Default for catalog courses without an explicit entry. */
export const DEFAULT_RULES = { prereqs: [], coreqs: [] };

/**
 * @param {string} subject
 * @param {string} number
 * @returns {string}
 */
export function courseKey(subject, number) {
  return `${subject} ${number}`.toUpperCase();
}

/**
 * @param {string} code
 * @returns {CourseRules}
 */
export function getRulesForCourse(code) {
  const normalized = normalizeCode(code);
  return PREREQUISITES[normalized] ?? DEFAULT_RULES;
}

/**
 * @param {string} code
 * @returns {string}
 */
export function normalizeCode(code) {
  const match = String(code || "").trim().match(/^([A-Za-z]+)\s+(\d+[A-Za-z]*)$/);
  if (!match) return String(code || "").trim().toUpperCase();
  return `${match[1].toUpperCase()} ${match[2]}`;
}
