/** Group 1 — interest by specialty area (1–5 scale). */
export const INTEREST_QUESTIONS = [
  {
    key: "ai",
    prompt: "How interested are you in artificial intelligence and machine learning?",
    lowLabel: "Not for me",
    highLabel: "Extremely interested",
  },
  {
    key: "dataViz",
    prompt: "How interested are you in data analysis, visualization, and storytelling with data?",
    lowLabel: "Not for me",
    highLabel: "Extremely interested",
  },
  {
    key: "cybersecurity",
    prompt: "How interested are you in cybersecurity and privacy?",
    lowLabel: "Not for me",
    highLabel: "Extremely interested",
  },
  {
    key: "webMobile",
    prompt: "How interested are you in building web and mobile applications?",
    lowLabel: "Not for me",
    highLabel: "Extremely interested",
  },
  {
    key: "games",
    prompt: "How interested are you in games and interactive media?",
    lowLabel: "Not for me",
    highLabel: "Extremely interested",
  },
  {
    key: "robotics",
    prompt: "How interested are you in robotics and computer vision?",
    lowLabel: "Not for me",
    highLabel: "Extremely interested",
  },
  {
    key: "hci",
    prompt: "How interested are you in human-centered design and UX?",
    lowLabel: "Not for me",
    highLabel: "Extremely interested",
  },
  {
    key: "bioinformatics",
    prompt: "How interested are you in bioinformatics and health data?",
    lowLabel: "Not for me",
    highLabel: "Extremely interested",
  },
  {
    key: "sportsAnalytics",
    prompt: "How interested are you in sports and performance analytics?",
    lowLabel: "Not for me",
    highLabel: "Extremely interested",
  },
  {
    key: "cloudSystems",
    prompt: "How interested are you in cloud computing and systems/networks?",
    lowLabel: "Not for me",
    highLabel: "Extremely interested",
  },
];

/** Group 2 — work style & comfort (1–5 scale). */
export const STYLE_QUESTIONS = [
  {
    key: "mathComfort",
    prompt: "How comfortable are you with math and statistics?",
    lowLabel: "Would rather minimize it",
    highLabel: "Love it, the more the better",
  },
  {
    key: "programmingConfidence",
    prompt: "How confident are you in the core programming sequence (ITSC 1212 → 1213 → 2214)?",
    lowLabel: "Still building the basics",
    highLabel: "Very confident, want a challenge",
  },
  {
    key: "handsOnVsTheory",
    prompt: "Do you prefer building hands-on or studying theory first?",
    lowLabel: "Prefer theory and reading first",
    highLabel: "Prefer to build first, ask questions later",
  },
  {
    key: "soloVsTeam",
    prompt: "Do you prefer working solo or on a team?",
    lowLabel: "Solo, deep focus",
    highLabel: "Big, collaborative team",
  },
  {
    key: "structuredVsOpen",
    prompt: "Do you prefer structured problems or open-ended, creative ones?",
    lowLabel: "Prefer clear right/wrong answers",
    highLabel: "Prefer open-ended, creative problems",
  },
  {
    key: "researchVsProduct",
    prompt: "Are you more drawn to building a polished product or doing original research?",
    lowLabel: "Want to build a polished, demoable product",
    highLabel: "Want to do original research/analysis",
  },
  {
    key: "specializeVsBroad",
    prompt: "Would you rather specialize deeply or stay broad across a few areas?",
    lowLabel: "Stay broad across a few areas",
    highLabel: "Go deep in one specialty",
  },
];

/**
 * Industry / sector picks (multi-select). Used for a small alignment bonus, not a filter.
 * `clusters` maps to Group 1 specialty keys and/or department prefixes.
 */
export const INDUSTRY_OPTIONS = [
  {
    key: "healthcare",
    label: "Healthcare / biotech",
    clusters: ["bioinformatics"],
    prefixes: ["BINF"],
  },
  {
    key: "govSecurity",
    label: "Government / defense / security",
    clusters: ["cybersecurity"],
  },
  {
    key: "gaming",
    label: "Gaming",
    clusters: ["games"],
  },
  {
    key: "finance",
    label: "Finance / fintech",
    clusters: ["dataViz", "ai"],
  },
  {
    key: "techProduct",
    label: "Tech product / SaaS",
    clusters: ["webMobile", "hci", "cloudSystems"],
  },
  {
    key: "sports",
    label: "Sports / performance",
    clusters: ["sportsAnalytics"],
  },
  {
    key: "roboticsHardware",
    label: "Robotics / hardware",
    clusters: ["robotics"],
  },
];

/** Maps Group 1 keys to elective course clusters (weights, not filters). */
export const INTEREST_ELECTIVE_CLUSTERS = {
  ai: ["ITCS 3153", "ITCS 3156", "ITCS 4101", "ITCS 4236"],
  dataViz: ["ITCS 3162", "ITCS 4121", "ITCS 4122", "ITCS 4123", "INFO 3236"],
  cybersecurity: ["ITIS 3200", "ITIS 4221", "ITIS 4246", "ITIS 4250", "ITIS 4260", "ITIS 4261", "ITIS 4214"],
  webMobile: ["ITIS 3135", "ITIS 3310", "ITIS 3320", "ITIS 4166", "ITIS 4180"],
  games: ["ITCS 4230", "ITCS 4231", "ITCS 4232", "ITCS 4235", "ITCS 4236"],
  robotics: ["ITCS 4150", "ITCS 4151", "ITCS 4152"],
  hci: ["ITIS 3130", "ITIS 3140", "ITIS 4350", "ITIS 4353", "ITIS 4355", "ITIS 4360"],
  bioinformatics: { prefix: "BINF" },
  sportsAnalytics: { codes: ["DTSC 1110", "DTSC 2110"], prefix: "SPOA" },
  cloudSystems: ["ITCS 3190", "ITCS 4145", "ITIS 3246", "ITSC 3146"],
};

/** Math-heavy electives (prereq chains through linear algebra / stats). */
export const MATH_HEAVY_ELECTIVES = ["ITCS 3156", "ITCS 4152", "ITCS 4122"];

/** Independent research / thesis-style electives. */
export const RESEARCH_ELECTIVES = ["ITSC 4990", "ITSC 4991", "DTSC 3900"];

/** Studio / hands-on project courses. */
export const STUDIO_HANDS_ON_ELECTIVES = [
  "ITCS 4230",
  "ITCS 4231",
  "ITCS 4232",
  "ITCS 4235",
  "ITCS 4236",
  "ITCS 4238",
  "ITCS 4155",
  "ITIS 4350",
  "ITIS 4353",
  "ITIS 4355",
  "ITIS 4360",
  "ITIS 4390",
  "ITIS 3135",
];

/** Theory / foundational intro or algorithms-leaning electives. */
export const THEORY_ELECTIVES = [
  "ITCS 3153",
  "ITCS 3156",
  "ITCS 4101",
  "ITIS 3200",
  "ITCS 4121",
  "ITCS 3162",
  "ITIS 4221",
];

/** Structurally team-based studios / group projects. */
export const TEAM_ELECTIVES = [
  "ITCS 4232",
  "ITCS 4238",
  "ITCS 4155",
  "ITIS 4390",
  "ITSC 4681",
  "ITSC 4682",
  "BINF 4900",
];

/** Independent / solo research options (mirrors research list + independent study). */
export const SOLO_ELECTIVES = ["ITSC 4990", "ITSC 4991", "DTSC 3900"];

/** Product / studio-capstone style courses (mirror of research preference). */
export const PRODUCT_CAPSTONE_ELECTIVES = [
  "ITCS 4232",
  "ITCS 4238",
  "ITCS 4155",
  "ITIS 4390",
  "ITSC 4681",
  "ITSC 4682",
];
