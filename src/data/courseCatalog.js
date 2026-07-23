/**
 * Mock UNCC Charlotte B.S. Data Science course catalog.
 * Browse buckets: Core (Gen Ed + Computing + DS Core + Capstone)
 * and Electives Outside the Major.
 * Schedule fields are mock data for the Registration UI.
 */

/** Fine-grained tags kept on each course (badges, etc.) */
export const COURSE_CATEGORIES = [
  { id: "gen_ed", label: "General Education", short: "Gen Ed" },
  { id: "core", label: "Data Science Core", short: "DS Core" },
  { id: "outside_elective", label: "Electives Outside Major", short: "Outside" },
  { id: "computing", label: "Computing Core", short: "Computing" },
  { id: "capstone", label: "Capstone", short: "Capstone" },
];

export const CATEGORY_META = Object.fromEntries(
  COURSE_CATEGORIES.map((c) => [c.id, c])
);

/** Top-level browse buckets shown in the course catalog */
export const BROWSE_BUCKETS = [
  {
    id: "core",
    label: "Core",
    short: "Core",
    categories: ["gen_ed", "computing", "core", "capstone"],
  },
  {
    id: "outside_elective",
    label: "Electives outside the major",
    short: "Outside",
    categories: ["outside_elective"],
  },
];

export const BROWSE_BUCKET_META = Object.fromEntries(
  BROWSE_BUCKETS.map((b) => [b.id, b])
);

export function courseMatchesBrowseBucket(course, bucketId) {
  if (!bucketId) return true;
  const bucket = BROWSE_BUCKET_META[bucketId];
  if (bucket) return bucket.categories.includes(course.category);
  return course.category === bucketId;
}

/** @typedef {{
 *  subject: string, number: string, title: string, credits: number,
 *  category: string, blurb?: string, prereqs?: string
 * }} CatalogCourse */

/** @type {CatalogCourse[]} */
export const COURSES = [
  // ── General Education: English, Math, Science only ─────────────────
  { subject: "WRDS", number: "1103", title: "Writing and Inquiry in Academic Contexts I & II", credits: 3, category: "gen_ed",
    blurb: "English / first-year writing for academic and public audiences." },
  { subject: "WRDS", number: "1104", title: "Writing and Inquiry in Academic Contexts with Studio", credits: 4, category: "gen_ed",
    blurb: "English writing + studio option based on placement." },
  { subject: "ENGL", number: "2100", title: "Writing About Literature", credits: 3, category: "gen_ed",
    blurb: "English writing beyond first-year composition." },
  { subject: "MATH", number: "1120", title: "Calculus", credits: 3, category: "gen_ed",
    blurb: "Gen Ed math — Calculus for ML3/ML4 placement." },
  { subject: "MATH", number: "1241", title: "Calculus I", credits: 3, category: "gen_ed",
    blurb: "Gen Ed math — standard Calculus I." },
  { subject: "STAT", number: "1222", title: "Introduction to Statistics", credits: 3, category: "gen_ed",
    blurb: "Gen Ed math/quant — intro statistics." },
  { subject: "BIOL", number: "1110", title: "Principles of Biology I", credits: 3, category: "gen_ed",
    blurb: "Natural science lecture (pair with lab)." },
  { subject: "BIOL", number: "1110L", title: "Principles of Biology I Laboratory", credits: 1, category: "gen_ed",
    blurb: "Natural science lab companion to BIOL 1110." },
  { subject: "CHEM", number: "1200", title: "Fundamentals of Chemistry", credits: 3, category: "gen_ed",
    blurb: "Natural science without lab option." },
  { subject: "PHYS", number: "1101", title: "Introductory Physics I", credits: 3, category: "gen_ed",
    blurb: "Natural science lecture option." },
  { subject: "PHYS", number: "1101L", title: "Introductory Physics I Laboratory", credits: 1, category: "gen_ed",
    blurb: "Natural science lab companion to PHYS 1101." },
  { subject: "GEOL", number: "1200", title: "Physical Geology", credits: 3, category: "gen_ed",
    blurb: "Earth science lecture option." },
  { subject: "GEOL", number: "1200L", title: "Physical Geology Laboratory", credits: 1, category: "gen_ed",
    blurb: "Earth science lab companion." },

  // ── Data Science Core ──────────────────────────────────────────────
  { subject: "DTSC", number: "1301", title: "Data and Society A", credits: 3, category: "core",
    blurb: "What data is, who it describes, and studying people through numbers.",
    prereqs: "Admission to Data Science major" },
  { subject: "DTSC", number: "1302", title: "Data and Society B", credits: 3, category: "core",
    blurb: "Studio continuation — data ethics and social context.",
    prereqs: "DTSC 1301 (co-req or prior)" },
  { subject: "DTSC", number: "2301", title: "Modeling and Society A", credits: 3, category: "core",
    blurb: "Building real statistical models and questioning assumptions.",
    prereqs: "DTSC 1302; STAT 1222" },
  { subject: "DTSC", number: "2302", title: "Modeling and Society B", credits: 3, category: "core",
    blurb: "Studio continuation — applied modeling projects.",
    prereqs: "DTSC 2301 (co-req or prior)" },
  { subject: "DTSC", number: "3601", title: "Predictive Analytics and Their Implications A", credits: 3, category: "core",
    blurb: "Machine learning methods paired with who a wrong prediction affects.",
    prereqs: "DTSC 2302; MATH 2164" },
  { subject: "DTSC", number: "3602", title: "Predictive Analytics and Their Implications B", credits: 3, category: "core",
    blurb: "Studio continuation — predictive models and communication (O,W).",
    prereqs: "DTSC 3601 (co-req or prior)" },

  // ── Electives Outside Major (ML, AI, viz, etc.) ────────────────────
  { subject: "ITCS", number: "3153", title: "Introduction to Artificial Intelligence", credits: 3, category: "outside_elective",
    blurb: "Search, knowledge representation, and learning basics." },
  { subject: "ITCS", number: "4155", title: "Introduction to Machine Learning", credits: 3, category: "outside_elective",
    blurb: "Models that learn from data — and how to evaluate them." },
  { subject: "ITCS", number: "4122", title: "Visual Analytics", credits: 3, category: "outside_elective",
    blurb: "Turning complex data into visuals you can explore." },
  { subject: "ITCS", number: "4123", title: "Data Visualization", credits: 3, category: "outside_elective",
    blurb: "Clear charts and dashboards people can act on." },
  { subject: "ITCS", number: "4180", title: "Mobile Application Development", credits: 3, category: "outside_elective",
    blurb: "Apps that put data tools in someone's pocket." },
  { subject: "ITCS", number: "4181", title: "Computer Vision", credits: 3, category: "outside_elective",
    blurb: "Extracting structure and meaning from images." },
  { subject: "ITCS", number: "4145", title: "Parallel and Distributed Computing", credits: 3, category: "outside_elective",
    blurb: "Scaling compute across machines and clusters." },
  { subject: "ITCS", number: "4160", title: "Computer Networks", credits: 3, category: "outside_elective",
    blurb: "How networked systems move data reliably." },
  { subject: "ITIS", number: "3200", title: "Introduction to Cloud Computing", credits: 3, category: "outside_elective",
    blurb: "Cloud platforms for data storage and compute." },
  { subject: "ITIS", number: "4166", title: "Network-Based Application Development", credits: 3, category: "outside_elective",
    blurb: "Building networked applications and APIs." },
  { subject: "ITIS", number: "4350", title: "Rapid Software Development", credits: 3, category: "outside_elective",
    blurb: "Agile delivery for data-backed products." },
  { subject: "STAT", number: "3128", title: "Applied Regression Analysis", credits: 3, category: "outside_elective",
    blurb: "Regression models for real observational data." },
  { subject: "STAT", number: "4128", title: "Time Series Analysis", credits: 3, category: "outside_elective",
    blurb: "Forecasting and temporal dependence." },
  { subject: "MATH", number: "2241", title: "Calculus III", credits: 3, category: "outside_elective",
    blurb: "Multivariable calculus for deeper modeling." },
  { subject: "MATH", number: "3163", title: "Introduction to Probability", credits: 3, category: "outside_elective",
    blurb: "Probability foundations for statistical learning." },
  { subject: "DTSC", number: "4420", title: "Spatial Data Science", credits: 3, category: "outside_elective",
    blurb: "Maps, GIS, and location data (mock elective)." },
  { subject: "DTSC", number: "4430", title: "Data Storytelling & Visualization", credits: 3, category: "outside_elective",
    blurb: "Narrative + visual communication (mock elective)." },
  { subject: "DTSC", number: "4440", title: "AI Policy & Ethics", credits: 3, category: "outside_elective",
    blurb: "Policy guardrails for AI systems (mock elective)." },

  // ── Computing Core (+ major math/stat support) ─────────────────────
  { subject: "ITSC", number: "1212", title: "Introduction to Computer Science I", credits: 4, category: "computing",
    blurb: "First programming course if you need the sequence start." },
  { subject: "ITSC", number: "1213", title: "Introduction to Computer Science II", credits: 4, category: "computing",
    blurb: "Second programming course — loops and functions become real tools.",
    prereqs: "ITSC 1212 or equivalent" },
  { subject: "ITSC", number: "2175", title: "Logic and Algorithms", credits: 3, category: "computing",
    blurb: "Logic and proofs every algorithm is built from.",
    prereqs: "ITSC 1213" },
  { subject: "ITSC", number: "2214", title: "Data Structures and Algorithms", credits: 4, category: "computing",
    blurb: "Organizing data so code doesn't grind to a halt at scale.",
    prereqs: "ITSC 1213; ITSC 2175 or MATH 2165" },
  { subject: "ITCS", number: "3160", title: "Database Design and Implementation", credits: 3, category: "computing",
    blurb: "Designing databases that stay fast and correct as they grow.",
    prereqs: "ITSC 2214" },
  { subject: "ITCS", number: "3162", title: "Introduction to Data Mining", credits: 3, category: "computing",
    blurb: "Finding patterns in large, messy datasets.",
    prereqs: "ITSC 2214; STAT 2223" },
  { subject: "MATH", number: "2164", title: "Matrices and Linear Algebra", credits: 3, category: "computing",
    blurb: "Major math support — how ML models represent data.",
    prereqs: "MATH 1120 or MATH 1241" },
  { subject: "MATH", number: "2165", title: "Introduction to Discrete Mathematics", credits: 3, category: "computing",
    blurb: "Discrete math alternative to ITSC 2175." },
  { subject: "STAT", number: "2223", title: "Elements of Statistics II", credits: 3, category: "computing",
    blurb: "Major stats support — deeper inference.",
    prereqs: "STAT 1222" },
  { subject: "STAT", number: "3160", title: "Applied Multivariate Analysis", credits: 3, category: "computing",
    blurb: "Major stats support — many variables at once.",
    prereqs: "STAT 2223; MATH 2164" },

  // ── Capstone ───────────────────────────────────────────────────────
  { subject: "DTSC", number: "4301", title: "Data Science for Social Good A", credits: 3, category: "capstone",
    blurb: "Real client, real problem — social-good capstone studio.",
    prereqs: "DTSC 3602; senior standing" },
  { subject: "DTSC", number: "4302", title: "Data Science for Social Good B", credits: 3, category: "capstone",
    blurb: "Capstone studio continuation and final deliverable.",
    prereqs: "DTSC 4301 (co-req or prior)" },
];

const INSTRUCTORS = [
  "Marco Scipioni", "Alicia Johnson", "Sam Patel", "Elena Ruiz", "Priya Nair",
  "James Okonkwo", "Nora Kim", "David Chen", "Maya Brooks", "Chris Nguyen",
  "Rachel Torres", "Omar Hassan", "Lisa Park", "Ben Walker", "Sofia Alvarez",
];

const TIME_SLOTS = [
  { days: [1, 3, 5], time: "09:05 AM - 09:55 AM" },
  { days: [1, 3, 5], time: "10:10 AM - 11:00 AM" },
  { days: [1, 3, 5], time: "11:15 AM - 12:05 PM" },
  { days: [1, 3], time: "01:00 PM - 02:15 PM" },
  { days: [1, 3], time: "02:30 PM - 03:45 PM" },
  { days: [2, 4], time: "09:30 AM - 10:45 AM" },
  { days: [2, 4], time: "11:00 AM - 12:15 PM" },
  { days: [2, 4], time: "12:30 PM - 01:45 PM" },
  { days: [2, 4], time: "02:00 PM - 03:15 PM" },
  { days: [2, 4], time: "03:30 PM - 04:45 PM" },
];

function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Build mock registration sections (1–2 per course) for the search UI.
 */
export function buildRegistrationCatalog() {
  const sections = [];
  let crnBase = 20000;

  COURSES.forEach((course, idx) => {
    const key = `${course.subject}${course.number}`;
    const h = hashCode(key);
    const sectionCount = course.category === "core" || course.category === "computing" ? 2 : 1;

    for (let s = 0; s < sectionCount; s++) {
      const slot = TIME_SLOTS[(h + s * 3) % TIME_SLOTS.length];
      const capacity = 20 + (h % 25);
      const enrolled = Math.min(capacity, Math.floor(capacity * (0.55 + ((h + s) % 40) / 100)));
      const full = enrolled >= capacity;
      const crn = String(crnBase + idx * 10 + s);

      sections.push({
        subject: course.subject,
        number: course.number,
        section: String(s + 1).padStart(3, "0"),
        crn,
        title: course.title,
        credits: course.credits,
        days: slot.days,
        time: slot.time,
        enrolled,
        capacity,
        full,
        timeConflict: (h + s) % 11 === 0,
        instructor: INSTRUCTORS[(h + s) % INSTRUCTORS.length],
        campus: "Main",
        scheduleType: course.number.endsWith("L") ? "Lab" : "Lecture",
        level: "Undergraduate",
        category: course.category,
        blurb: course.blurb,
        prereqs: course.prereqs,
      });
    }
  });

  return sections;
}

export const REGISTRATION_CATALOG = buildRegistrationCatalog();

export function coursesByCategory(categoryId) {
  return COURSES.filter((c) => courseMatchesBrowseBucket(c, categoryId));
}

export function getCategoryLabel(categoryId) {
  return BROWSE_BUCKET_META[categoryId]?.label
    || CATEGORY_META[categoryId]?.label
    || categoryId;
}
