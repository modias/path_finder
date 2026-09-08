export const STAGES = [
  {
    title: "Foundations",
    note: "Year 1",
    courses: [
      { code: "DTSC 1301/1302", name: "Data and Society", hrs: 6, kind: "core",
        blurb: "What data is, who it describes, and what it means to study people through numbers." },
      { code: "ITSC 1213", name: "Intro to Computer Science II", hrs: 4, kind: "support",
        blurb: "Your second programming course — loops and functions become real tools." },
      { code: "MATH 1120/1241", name: "Calculus", hrs: 3, kind: "support",
        blurb: "The math foundation underneath every model you'll build later." },
      { code: "STAT 1220/1221/1222", name: "Elements of Statistics I", hrs: 3, kind: "support",
        blurb: "Your first real statistics course — the language of uncertainty." },
    ],
  },
  {
    title: "Building",
    note: "Year 2",
    courses: [
      { code: "DTSC 2301/2302", name: "Modeling and Society", hrs: 6, kind: "core",
        blurb: "Building real statistical models, and questioning what they assume." },
      { code: "ITSC 2175 / MATH 2165", name: "Logic and Algorithms", hrs: 3, kind: "support",
        blurb: "The logic and proofs every algorithm is built from." },
      { code: "ITSC 2214", name: "Data Structures and Algorithms", hrs: 4, kind: "support",
        blurb: "Organizing data so code doesn't grind to a halt at scale." },
      { code: "MATH 2164", name: "Matrices and Linear Algebra", hrs: 3, kind: "support",
        blurb: "How machine learning models represent data internally." },
      { code: "STAT 2223", name: "Elements of Statistics II", hrs: 3, kind: "support",
        blurb: "Deeper statistical inference — is this result even real?" },
    ],
  },
  {
    title: "Applying",
    note: "Year 3",
    courses: [
      { code: "DTSC 3601/3602", name: "Predictive Analytics and Their Implications", hrs: 6, kind: "core",
        blurb: "Machine learning methods, paired with who a wrong prediction affects." },
      { code: "ITCS 3162", name: "Introduction to Data Mining", hrs: 3, kind: "support",
        blurb: "Finding patterns in large, messy datasets." },
      { code: "ITSC 3160", name: "Database Design and Implementation", hrs: 3, kind: "support",
        blurb: "Designing databases that stay fast and correct as they grow." },
      { code: "STAT 3160", name: "Applied Multivariate Analysis", hrs: 3, kind: "support",
        blurb: "Statistics for many variables at once — closer to real messy data." },
    ],
  },
  {
    title: "Capstone",
    note: "Year 4",
    courses: [
      { code: "DTSC 4301/4302", name: "Data Science for Social Good", hrs: 6, kind: "core",
        blurb: "A real client, a real problem, a semester to build something that matters." },
    ],
  },
];

/** Elective codes tracked on the plan step — metadata comes from courseCatalog.js. */
export const TRACKED_ELECTIVE_CODES = [
  "ITCS 3153",
  "ITCS 3156",
  "ITCS 4122",
  "ITCS 4123",
  "ITIS 4180",
];

export const TOTAL_CREDITS = 120;

/** Recommended next-two-semester plan for the Personal Plan view */
export const NEXT_SEMESTERS = [
  {
    term: "Fall 2026",
    recommendedCredits: 15,
    courses: [
      // 1301 + 1302 already done → 2301/2302 are the next studio pair (mutual coreqs).
      { code: "DTSC 2301", title: "Modeling and Society I", category: "required", credits: 3 },
      { code: "DTSC 2302", title: "Modeling and Society II", category: "required", credits: 3 },
      { code: "STAT 2223", title: "Elements of Statistics II", category: "required", credits: 3 },
      { code: "ITCS 3160", title: "Database Design and Implementation", category: "required", credits: 3 },
      { code: "LBST 2101", title: "Western Cultural History", category: "general_ed", credits: 3 },
    ],
  },
  {
    term: "Spring 2027",
    recommendedCredits: 15,
    courses: [
      // Unlocks only after Fall's 2301/2302 are treated as completed (progressive plan filter).
      { code: "DTSC 3601", title: "Predictive Analytics I", category: "required", credits: 3 },
      { code: "DTSC 3602", title: "Predictive Analytics II", category: "required", credits: 3 },
      { code: "ITCS 3162", title: "Introduction to Data Mining", category: "required", credits: 3 },
      { code: "STAT 3160", title: "Applied Multivariate Analysis", category: "required", credits: 3 },
      { code: "LBST 2213", title: "Science, Technology & Society", category: "general_ed", credits: 3 },
    ],
  },
];

export const PLAN_INPUTS = {
  completedCredits: 32,
  preferredLoad: 15,
  startingSemester: "Fall 2026",
};

/** Upcoming registration terms for Reflect-step chips (from NEXT_SEMESTERS). */
export const REFLECT_TERM_OPTIONS = NEXT_SEMESTERS.map((s) => s.term);

/** Credit-load chips — store the full label string as the selected value. */
export const REFLECT_CREDIT_LOAD_OPTIONS = [
  "12 (light)",
  `${PLAN_INPUTS.preferredLoad} (standard)`,
  "18 (heavy)",
];

/** Past terms with grades — shown under Registration → Your schedule */
export const COURSE_HISTORY = [
  {
    term: "Spring 2026",
    courses: [
      { code: "ITCS 3156", title: "Introduction to Machine Learning", credits: 3, grade: "IP" },
    ],
  },
  {
    term: "Fall 2025",
    courses: [
      { code: "DTSC 1302", title: "Data and Society B", credits: 3, grade: "A" },
      { code: "MATH 2164", title: "Matrices and Linear Algebra", credits: 3, grade: "B+" },
      { code: "ITSC 2175", title: "Logic and Algorithms", credits: 3, grade: "A" },
      { code: "ITSC 2214", title: "Data Structures and Algorithms", credits: 4, grade: "B+" },
      { code: "CTCM 2530", title: "Critical Thinking and Communication", credits: 3, grade: "A-" },
    ],
  },
  {
    term: "Spring 2025",
    courses: [
      { code: "DTSC 1301", title: "Data and Society A", credits: 3, grade: "A" },
      { code: "ITSC 1213", title: "Introduction to Computer Science II", credits: 4, grade: "B+" },
      { code: "STAT 1222", title: "Introduction to Statistics", credits: 3, grade: "A-" },
      { code: "WRDS 1103", title: "Writing and Inquiry in Academic Contexts", credits: 3, grade: "A" },
    ],
  },
  {
    term: "Fall 2024",
    courses: [
      { code: "MATH 1241", title: "Calculus I", credits: 3, grade: "B+" },
      { code: "ITCS 4122", title: "Visual Analytics", credits: 3, grade: "A-" },
      { code: "ITIS 3200", title: "Introduction to Cloud Computing", credits: 3, grade: "B" },
      { code: "ITCS 3153", title: "Introduction to Artificial Intelligence", credits: 3, grade: "B" },
    ],
  },
];

export const SEMESTER_PLAN = [
  {
    term: "Fall 2025",
    status: "in_progress",
    hint: "Build statistical and modeling depth.",
    courses: [
      { id: "dtsc-3601", code: "DTSC 3601/3602", name: "Predictive Analytics and Their Implications", hrs: 6, done: true },
      { id: "itcs-3162", code: "ITCS 3162", name: "Introduction to Data Mining", hrs: 3, done: true },
      { id: "stat-3160", code: "STAT 3160", name: "Applied Multivariate Analysis", hrs: 3, done: true },
      { id: "lbst-2301", code: "LBST 2301", name: "Degree requirement", hrs: 3, done: false },
    ],
  },
  {
    term: "Spring 2026",
    status: "planned",
    hint: "Add database skills and communication.",
    courses: [
      { id: "itcs-3160", code: "ITCS 3160", name: "Database Design and Implementation", hrs: 3, done: false },
      { id: "itcs-4123", code: "ITCS 4123", name: "Visualization and Visual Communication", hrs: 3, done: false },
      { id: "engl-3160", code: "ENGL 3160", name: "Writing Intensive course", hrs: 3, done: false },
      { id: "itcs-4122", code: "ITCS 4122", name: "Visual Analytics", hrs: 3, done: false },
    ],
  },
  {
    term: "Fall 2026",
    status: "planned",
    hint: "Ethics, policy, and applied analytics.",
    courses: [
      { id: "itis-3200", code: "ITIS 3200", name: "Introduction to Information Security and Privacy", hrs: 3, done: false },
      { id: "stat-3128", code: "STAT 3128", name: "Applied Regression Analysis", hrs: 3, done: false },
      { id: "itsc-3688", code: "ITSC 3688", name: "Computers and Their Impact on Society", hrs: 3, done: false },
      { id: "gen-ed-1", code: "LBST 2102", name: "Degree requirement", hrs: 3, done: false },
    ],
  },
  {
    term: "Spring 2027",
    status: "planned",
    hint: "Finish with the social-good capstone studio.",
    courses: [
      { id: "dtsc-4301", code: "DTSC 4301/4302", name: "Data Science for Social Good", hrs: 6, done: false },
      { id: "elective-2", code: "Major elective", name: "Data science elective", hrs: 3, done: false },
      { id: "gen-ed-2", code: "Natural Science", name: "Natural science with lab", hrs: 4, done: false },
    ],
  },
];

export const REMAINING_REQUIREMENTS = [
  "Data science electives (9 credits)",
  "Natural science with lab",
  "Writing intensive course",
  "Senior capstone studio",
];

export const CAREERS = [
  { role: "Data analyst",
    oneLiner: "Turns raw numbers into a decision someone can act on today.",
    does: "Builds dashboards and finds the trend that answers the question a manager actually asked, not the one that's easiest to answer.",
    skills: ["SQL", "Dashboards", "Spreadsheets"],
    salary: "$55,000 – $75,000",
    employers: "Regional banks, retail chains, hospital systems" },
  { role: "Data engineer",
    oneLiner: "Builds the plumbing every other data role depends on.",
    does: "Designs the pipelines that move data reliably from messy source systems into something clean enough to analyze.",
    skills: ["Python", "Pipelines", "Cloud (AWS/Azure)"],
    salary: "$70,000 – $95,000",
    employers: "Banks, utility companies, fintech startups" },
  { role: "Software developer",
    oneLiner: "Writes the systems that put a model into someone's hands.",
    does: "Takes a working data prototype and makes it fast, secure, and usable at real scale — the bridge between a notebook and a product.",
    skills: ["APIs", "Git", "Testing"],
    salary: "$65,000 – $90,000",
    employers: "Software companies, banks, manufacturing firms" },
  { role: "Data scientist",
    oneLiner: "Builds the model, then argues about what it's allowed to decide.",
    does: "Combines statistics and machine learning to make predictions, and spends just as much time on whether those predictions are fair to rely on.",
    skills: ["Python", "ML models", "Statistics"],
    salary: "$75,000 – $105,000",
    employers: "Insurance carriers, healthcare systems, tech firms" },
  { role: "Data ethics & policy analyst",
    oneLiner: "Asks the question everyone else forgot to ask.",
    does: "Reviews how a system uses data, flags where it could discriminate or mislead, and writes the guardrails before something goes wrong.",
    skills: ["Policy writing", "Risk review", "Compliance"],
    salary: "$60,000 – $85,000",
    employers: "Government agencies, universities, consulting firms" },
  { role: "UX / product analyst",
    oneLiner: "Figures out what people actually do, not what they say.",
    does: "Studies how real users move through a product using behavioral data, and turns that into changes the design team can ship.",
    skills: ["A/B testing", "User research", "Analytics tools"],
    salary: "$60,000 – $85,000",
    employers: "Fintech companies, e-commerce, software firms" },
];

export const STEP_LABELS = ["Reflect", "Your plan", "Explore courses", "Meet the careers"];
