export const DEGREE_TOTAL_CREDITS = 120;
export const GEN_ED_CREDITS = 32;
export const MAJOR_CREDITS = 55;
export const ELECTIVE_CREDITS = 31;

export const GEN_ED = [
  { requirement: "First-Year Writing", taken: "WRDS 1103", status: "completed" },
  { requirement: "Critical Thinking and Communication", taken: "CTCM 2530", status: "completed" },
  { requirement: "Quant/Data — Math or Stat", taken: "MATH 1241", status: "completed" },
  { requirement: "Quant/Data", taken: "STAT 1222", status: "completed" },
  { requirement: "Natural Science (with lab)", taken: null, status: "remaining" },
  { requirement: "Natural Science (lab optional)", taken: null, status: "remaining" },
  { requirement: "Global Theme — Social Science", taken: "1501", status: "completed" },
  { requirement: "Local Theme — Social Science", taken: "1511", status: "completed" },
  { requirement: "Global Theme — Arts & Humanities", taken: "1502", status: "in_progress" },
  { requirement: "Local Theme — Arts & Humanities", taken: "1512", status: "completed" },
  {
    requirement: "Foundations of American Democracy",
    taken: null,
    options: "AMDM / POLS / HIST / CAPI 1575",
    status: "remaining",
  },
];

export const MAJOR_SECTIONS = [
  {
    id: "dtsc-core",
    title: "Data Science Core",
    courses: [
      { code: "DTSC 1301", name: "Data and Society A", status: "completed", hrs: 3 },
      { code: "DTSC 1302", name: "Data and Society B", status: "completed", hrs: 3 },
      { code: "DTSC 2301", name: "Modeling and Society A", status: "completed", hrs: 3 },
      { code: "DTSC 2302", name: "Modeling and Society B", status: "completed", hrs: 3 },
      { code: "DTSC 3601", name: "Predictive Analytics and Their Implications A", status: "in_progress", hrs: 3 },
      { code: "DTSC 3602", name: "Predictive Analytics and Their Implications B", status: "in_progress", hrs: 3 },
    ],
  },
  {
    id: "math-stat",
    title: "Math & Statistics",
    courses: [
      { code: "MATH 1241", name: "Calculus I", status: "completed", hrs: 3 },
      { code: "STAT 1222", name: "Introduction to Statistics", status: "completed", hrs: 3 },
      { code: "MATH 2164", name: "Matrices and Linear Algebra", status: "completed", hrs: 3 },
      { code: "STAT 2223", name: "Elements of Statistics II", status: "remaining", hrs: 3 },
      { code: "STAT 3160", name: "Applied Multivariate Analysis", status: "remaining", hrs: 3 },
    ],
  },
  {
    id: "computing",
    title: "Computing Core",
    courses: [
      { code: "ITSC 2175", name: "Logic and Algorithms", status: "completed", hrs: 3 },
      { code: "ITSC 1213", name: "Introduction to Computer Science II", status: "completed", hrs: 4 },
      { code: "ITSC 2214", name: "Data Structures and Algorithms", status: "in_progress", hrs: 4 },
      { code: "ITCS 3160", name: "Database Design and Implementation", status: "remaining", hrs: 3 },
      { code: "ITCS 3162", name: "Introduction to Data Mining", status: "remaining", hrs: 3 },
    ],
  },
  {
    id: "capstone",
    title: "Capstone",
    courses: [
      { code: "DTSC 4301", name: "Data Science for Social Good A", status: "remaining", hrs: 3 },
      { code: "DTSC 4302", name: "Data Science for Social Good B", status: "remaining", hrs: 3 },
    ],
  },
];

export const ELECTIVES = [
  { code: "ITCS 3153", name: "Introduction to Artificial Intelligence", status: "completed", hrs: 3 },
  { code: "ITCS 4155", name: "Machine Learning", status: "in_progress", hrs: 3 },
  { code: "ITCS 4122", name: "Visual Analytics", status: "completed", hrs: 3 },
  { code: "ITCS 4123", name: "Data Visualization", status: "remaining", hrs: 3 },
  { code: "ITCS 4180", name: "Mobile Application Development", status: "remaining", hrs: 3 },
  { code: "ITCS 4181", name: "Computer Vision", status: "remaining", hrs: 3 },
  { code: "ITCS 4145", name: "Parallel and Distributed Computing", status: "remaining", hrs: 3 },
  { code: "ITCS 4160", name: "Computer Networks", status: "remaining", hrs: 3 },
  { code: "ITCS 3166", name: "Computer Organization", status: "remaining", hrs: 3 },
  { code: "ITCS 4102", name: "Programming Languages", status: "remaining", hrs: 3 },
  { code: "ITIS 3200", name: "Introduction to Cloud Computing", status: "completed", hrs: 3 },
  { code: "ITIS 4166", name: "Network-Based Application Development", status: "remaining", hrs: 3 },
  { code: "ITIS 4350", name: "Rapid Software Development", status: "remaining", hrs: 3 },
  { code: "STAT 3128", name: "Applied Regression Analysis", status: "remaining", hrs: 3 },
  { code: "STAT 4128", name: "Time Series Analysis", status: "remaining", hrs: 3 },
  { code: "MATH 2241", name: "Calculus III", status: "remaining", hrs: 3 },
  { code: "MATH 2242", name: "Differential Equations", status: "remaining", hrs: 3 },
  { code: "MATH 3163", name: "Probability", status: "remaining", hrs: 3 },
  { code: "MATH 4109", name: "Numerical Analysis", status: "remaining", hrs: 3 },
];

export function countByStatus(items, status) {
  return items.filter((item) => item.status === status).length;
}

export function getMajorCourses() {
  return MAJOR_SECTIONS.flatMap((section) => section.courses);
}

export function getElectivesTaken() {
  return countByStatus(ELECTIVES, "completed");
}

export function getElectivesToTake() {
  return countByStatus(ELECTIVES, "remaining");
}

function creditsFromCourses(courses) {
  return Math.round(
    courses.reduce((sum, c) => {
      if (c.status === "completed") return sum + c.hrs;
      if (c.status === "in_progress") return sum + c.hrs * 0.5;
      return sum;
    }, 0)
  );
}

/** Progress toward each bucket: { completed, total } */
export function getSectionProgress() {
  const perReq = GEN_ED_CREDITS / GEN_ED.length;
  const genEdCompleted = Math.round(
    GEN_ED.reduce((sum, g) => {
      if (g.status === "completed") return sum + perReq;
      if (g.status === "in_progress") return sum + perReq * 0.5;
      return sum;
    }, 0)
  );

  return {
    genEd: { completed: Math.min(GEN_ED_CREDITS, genEdCompleted), total: GEN_ED_CREDITS },
    major: { completed: Math.min(MAJOR_CREDITS, creditsFromCourses(getMajorCourses())), total: MAJOR_CREDITS },
    electives: { completed: Math.min(ELECTIVE_CREDITS, creditsFromCourses(ELECTIVES)), total: ELECTIVE_CREDITS },
  };
}

export function estimateCompletedCredits() {
  const genEdDone = GEN_ED.filter((g) => g.status === "completed").length;
  const genEdInProg = GEN_ED.filter((g) => g.status === "in_progress").length;
  const genEdCredits = genEdDone * 3 + genEdInProg * 1.5;

  const majorCredits = getMajorCourses().reduce((sum, c) => {
    if (c.status === "completed") return sum + c.hrs;
    if (c.status === "in_progress") return sum + c.hrs * 0.5;
    return sum;
  }, 0);

  const electiveCredits = ELECTIVES.reduce((sum, c) => {
    if (c.status === "completed") return sum + c.hrs;
    if (c.status === "in_progress") return sum + c.hrs * 0.5;
    return sum;
  }, 0);

  return Math.min(DEGREE_TOTAL_CREDITS, Math.round(genEdCredits + majorCredits + electiveCredits));
}
