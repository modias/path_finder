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
];

/**
 * Q19 — topics you enjoy (pick up to 4).
 * `clusters` maps to Section A specialty keys for a flat ranking bonus.
 */
export const TOPIC_OPTIONS = [
  { key: "buildingSoftware", label: "Building software", clusters: ["webMobile"] },
  { key: "dataPatterns", label: "Data & patterns", clusters: ["dataViz"] },
  { key: "aiAutomation", label: "AI & automation", clusters: ["ai"] },
  { key: "securityPrivacy", label: "Security & privacy", clusters: ["cybersecurity"] },
  { key: "healthMedicine", label: "Health & medicine", clusters: ["bioinformatics"] },
  { key: "businessMoney", label: "Business & money", clusters: ["dataViz", "ai"] },
  { key: "designCreativity", label: "Design & creativity", clusters: ["hci"] },
  { key: "hardwareRobotics", label: "Hardware & robotics", clusters: ["robotics"] },
  { key: "teachingHelping", label: "Teaching & helping people", clusters: ["hci"] },
  { key: "citiesEnvironment", label: "Cities & environment", clusters: ["dataViz"] },
  { key: "gamesMedia", label: "Games & media", clusters: ["games"] },
  { key: "researchDiscovery", label: "Research & discovery", clusters: ["ai", "bioinformatics"] },
];

/** Shared skill list for Q20 (already have) and Q21 (want to walk out with). */
export const SKILL_OPTIONS = [
  { key: "programmingFundamentals", label: "Programming fundamentals" },
  { key: "dataStructures", label: "Data structures & algorithms" },
  { key: "webFullStack", label: "Web & full-stack" },
  { key: "mobileDev", label: "Mobile development" },
  { key: "databaseSql", label: "Database design & SQL" },
  { key: "cloudDistributed", label: "Cloud & distributed systems" },
  { key: "devopsCicd", label: "DevOps & CI/CD" },
  { key: "security", label: "Security" },
  { key: "networking", label: "Networking" },
  { key: "mlAi", label: "Machine learning & AI" },
  { key: "statistics", label: "Statistics & inference" },
  { key: "dataViz", label: "Data visualization" },
  { key: "dataEngineering", label: "Data engineering" },
  { key: "mathModeling", label: "Mathematical modeling" },
  { key: "uxResearch", label: "UX research" },
  { key: "interfaceDesign", label: "Interface & visual design" },
  { key: "productThinking", label: "Product thinking" },
  { key: "projectAgile", label: "Project & agile management" },
  { key: "businessAnalysis", label: "Business analysis" },
  { key: "financialAnalysis", label: "Financial analysis" },
  { key: "marketingAnalytics", label: "Marketing analytics" },
  { key: "stakeholderComm", label: "Stakeholder communication" },
  { key: "technicalWriting", label: "Technical writing" },
  { key: "teamworkLeadership", label: "Teamwork & leadership" },
  { key: "ethicsGovernance", label: "Ethics & governance" },
  { key: "researchMethods", label: "Research methods" },
  { key: "healthInformatics", label: "Health informatics" },
  { key: "bioinformatics", label: "Bioinformatics" },
  { key: "gisSpatial", label: "GIS & spatial analysis" },
  { key: "gameInteractive", label: "Game & interactive media" },
  { key: "hardwareEmbedded", label: "Hardware & embedded" },
  { key: "systemsAdmin", label: "Systems administration" },
];

/** Q22 — what you want to show an employer (pick up to 3). */
export const DELIVERABLE_OPTIONS = [
  { key: "liveApp", label: "An app or site that's actually live" },
  { key: "modelAnalysis", label: "A model or analysis with real results" },
  { key: "designCaseStudy", label: "A design case study" },
  { key: "securityWriteup", label: "Security labs and CTF write-ups" },
  { key: "dashboard", label: "A dashboard someone uses" },
  { key: "researchPaper", label: "A paper, poster, or lab experience" },
  { key: "physicalDevice", label: "A physical device I built" },
  { key: "clientWork", label: "Work I did for a real client" },
];

/**
 * Skills each elective mainly teaches. `intro` = courses that teach the skill from scratch
 * (Q20 already-have nudges these down slightly; Q21 want bumps all listed courses).
 */
export const SKILL_COURSE_TAGS = {
  programmingFundamentals: {
    courses: ["ITSC 1212", "ITSC 1213"],
    intro: ["ITSC 1212", "ITSC 1213"],
  },
  dataStructures: {
    courses: ["ITSC 2214", "ITCS 2215"],
    intro: ["ITSC 2214"],
  },
  webFullStack: {
    courses: ["ITIS 3135", "ITIS 4166", "ITIS 4180"],
    intro: ["ITIS 3135"],
  },
  mobileDev: {
    courses: ["ITIS 3310", "ITIS 3320"],
    intro: ["ITIS 3310"],
  },
  databaseSql: {
    courses: ["ITSC 3160", "ITCS 3160"],
    intro: ["ITSC 3160", "ITCS 3160"],
  },
  cloudDistributed: {
    courses: ["ITCS 3190", "ITCS 4145", "ITIS 3246"],
    intro: ["ITCS 3190"],
  },
  devopsCicd: {
    courses: ["ITIS 3246", "ITCS 4145"],
    intro: [],
  },
  security: {
    courses: ["ITIS 3200", "ITIS 4221", "ITIS 4246", "ITIS 4250", "ITIS 4260", "ITIS 4261", "ITIS 4214"],
    intro: ["ITIS 3200"],
  },
  networking: {
    courses: ["ITSC 3146", "ITIS 4221"],
    intro: ["ITSC 3146"],
  },
  mlAi: {
    courses: ["ITCS 3153", "ITCS 3156", "ITCS 4101", "ITCS 4236"],
    intro: ["ITCS 3153"],
  },
  statistics: {
    courses: ["STAT 3128", "STAT 3160", "ITCS 3162"],
    intro: [],
  },
  dataViz: {
    courses: ["ITCS 4121", "ITCS 4122", "ITCS 4123", "INFO 3236"],
    intro: ["ITCS 4123"],
  },
  dataEngineering: {
    courses: ["ITCS 3162", "ITCS 4145", "ITSC 3160"],
    intro: [],
  },
  mathModeling: {
    courses: ["ITCS 3156", "ITCS 4152", "STAT 3128"],
    intro: [],
  },
  uxResearch: {
    courses: ["ITIS 3130", "ITIS 3140", "ITIS 4350"],
    intro: ["ITIS 3130"],
  },
  interfaceDesign: {
    courses: ["ITIS 3130", "ITIS 4353", "ITIS 4355", "ITIS 4360"],
    intro: ["ITIS 3130"],
  },
  productThinking: {
    courses: ["ITIS 4350", "ITIS 4390", "ITCS 4155"],
    intro: [],
  },
  projectAgile: {
    courses: ["ITSC 4681", "ITSC 4682", "ITIS 4390", "BINF 4900"],
    intro: [],
  },
  businessAnalysis: {
    courses: ["INFO 3236", "DTSC 2110"],
    intro: [],
  },
  financialAnalysis: {
    courses: ["INFO 3236"],
    intro: [],
  },
  marketingAnalytics: {
    courses: ["INFO 3236", "ITCS 4122"],
    intro: [],
  },
  stakeholderComm: {
    courses: ["ITIS 4390", "ITSC 4681", "DTSC 4301", "DTSC 4302"],
    intro: [],
  },
  technicalWriting: {
    courses: ["ITSC 3688", "ITSC 4990", "ITSC 4991"],
    intro: [],
  },
  teamworkLeadership: {
    courses: ["ITCS 4232", "ITCS 4238", "ITIS 4390", "ITSC 4681", "BINF 4900"],
    intro: [],
  },
  ethicsGovernance: {
    courses: ["ITIS 3200", "ITSC 3688", "ITIS 4221"],
    intro: ["ITSC 3688"],
  },
  researchMethods: {
    courses: ["ITSC 4990", "ITSC 4991", "DTSC 3900", "BINF 4900"],
    intro: ["DTSC 3900"],
  },
  healthInformatics: {
    courses: ["BINF 1101", "BINF 2111"],
    intro: ["BINF 1101"],
  },
  bioinformatics: {
    courses: ["BINF 1101", "BINF 2111", "BINF 3101", "BINF 3121", "BINF 3131"],
    intro: ["BINF 1101"],
  },
  gisSpatial: {
    courses: ["ITCS 4122"],
    intro: [],
  },
  gameInteractive: {
    courses: ["ITCS 4230", "ITCS 4231", "ITCS 4232", "ITCS 4235", "ITCS 4236"],
    intro: ["ITCS 4230"],
  },
  hardwareEmbedded: {
    courses: ["ITCS 4150", "ITCS 4151", "ITCS 4152"],
    intro: ["ITCS 4150"],
  },
  systemsAdmin: {
    courses: ["ITSC 3146", "ITIS 3246"],
    intro: ["ITSC 3146"],
  },
};

/** Deliverable type → courses whose projects/outputs match (Q22 bump). */
export const DELIVERABLE_COURSE_TAGS = {
  liveApp: ["ITIS 3135", "ITIS 3310", "ITIS 3320", "ITIS 4166", "ITIS 4180", "ITCS 4155"],
  modelAnalysis: ["ITCS 3153", "ITCS 3156", "ITCS 3162", "ITCS 4101", "STAT 3128", "STAT 3160"],
  designCaseStudy: ["ITIS 3130", "ITIS 3140", "ITIS 4350", "ITIS 4353", "ITIS 4355", "ITIS 4360"],
  securityWriteup: ["ITIS 3200", "ITIS 4221", "ITIS 4246", "ITIS 4250", "ITIS 4260", "ITIS 4261", "ITIS 4214"],
  dashboard: ["ITCS 4121", "ITCS 4122", "ITCS 4123", "INFO 3236"],
  researchPaper: ["ITSC 4990", "ITSC 4991", "DTSC 3900", "BINF 4900"],
  physicalDevice: ["ITCS 4150", "ITCS 4151", "ITCS 4152"],
  clientWork: ["ITIS 4390", "ITSC 4681", "ITSC 4682", "DTSC 4301", "DTSC 4302", "ITCS 4238"],
};

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
