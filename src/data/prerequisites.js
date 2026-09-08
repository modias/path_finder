/**
 * Course prerequisite/corequisite rules for the B.S. Data Science catalog.
 * Rule shape: string course code | { all: Rule[] } | { oneOf: Rule[] }
 *
 * @typedef {string | { all: Rule[] } | { oneOf: Rule[] }} Rule
 * @typedef {{ prereqs: Rule[], coreqs: Rule[] }} CourseRules
 */

/** @type {Record<string, CourseRules>} */
export const PREREQUISITES = {
  // https://catalog.charlotte.edu/preview_course_nopop.php?catoid=27&coid=89787
  "ITSC 1213": {
    prereqs: [{ oneOf: ["ITSC 1212", "DTSC 1302"] }],
    coreqs: [{ oneOf: ["MATH 1100", "MATH 1103", "MATH 1120", "MATH 1241"] }],
  },

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

  // https://catalog.charlotte.edu/preview_course_nopop.php?catoid=27&coid=96404
  "DTSC 1302": {
    prereqs: [],
    coreqs: ["DTSC 1301", { oneOf: ["STAT 1220", "STAT 1221", "STAT 1222"] }],
  },

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

  // https://facultygovernance.charlotte.edu/request-create-itisitcs-41805180/
  // Catalog copy lists ITCS 2214; this program's computing sequence uses ITSC 2214.
  "ITIS 4180": { prereqs: [{ oneOf: ["ITSC 2214", "ITCS 2214"] }], coreqs: [] },
};

/**
 * Courses confirmed (catalog-reviewed) to have no course-completion prerequisites.
 * Placement gates (e.g. STAT 1222) are noted in comments but not modeled as Rules.
 * Unlisted catalog courses are treated as ineligible until added here or in PREREQUISITES.
 */
export const VERIFIED_NO_PREREQ = new Set([
  // First-year writing / gen-ed English
  "WRDS 1103",
  "WRDS 1104",
  "ENGL 2100",
  // Gen-ed math / quant
  "MATH 1120",
  "MATH 1241",
  // STAT 1222 has a MATH placement gate — not modeled as a course Rule (see eligibility notes).
  "STAT 1222",
  // Natural science options
  "BIOL 1110",
  "BIOL 1110L",
  "CHEM 1200",
  "PHYS 1101",
  "PHYS 1101L",
  "GEOL 1200",
  "GEOL 1200L",
  // Computing sequence entry
  "ITSC 1212",
  // https://facultygovernance.charlotte.edu/wp-content/uploads/sites/1223/2024/03/computersciencemsprogramrevision.pdf
  // Catalog copy: "Prerequisites: none."
  "ITCS 4123",
  // https://catalog.charlotte.edu/preview_course_nopop.php?catoid=27&coid=89882
  // Course-completion prereqs: none (sophomore-standing restriction only).
  "ITIS 4350",
]);

/** @deprecated Use hasVerifiedRules — unverified courses are ineligible, not "free to take". */
export const DEFAULT_RULES = { prereqs: [], coreqs: [] };

/**
 * @param {string} code
 * @returns {boolean}
 */
export function hasVerifiedRules(code) {
  const normalized = normalizeCode(code);
  return normalized in PREREQUISITES || VERIFIED_NO_PREREQ.has(normalized);
}

/**
 * @param {string} code
 * @returns {CourseRules | null} null when prerequisites are not yet verified
 */
export function getRulesForCourse(code) {
  const normalized = normalizeCode(code);
  if (normalized in PREREQUISITES) return PREREQUISITES[normalized];
  if (VERIFIED_NO_PREREQ.has(normalized)) return { prereqs: [], coreqs: [] };
  return null;
}

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
 * @returns {string}
 */
export function normalizeCode(code) {
  const match = String(code || "").trim().match(/^([A-Za-z]+)\s+(\d+[A-Za-z]*)$/);
  if (!match) return String(code || "").trim().toUpperCase();
  return `${match[1].toUpperCase()} ${match[2]}`;
}
