
const TIER_LABEL = {
  free: "Free",
  go: "Go",
  pro: "Pro",
};

const SUBJECTS = [
  "Mathematics",
  "Mathematics Literacy",
  "Physical Sciences",
  "Life Sciences",
  "English HL",
  "History",
  "Accounting",
  "Geography",
  "Business Studies",
];

const FREE_SUBJECTS = ["Mathematics", "English HL", "History"];
const FREE_PAPER_CUTOFF = 2024;
const FREE_DOWNLOAD_LIMIT = 5;

const provinces = ["National", "Gauteng", "KZN", "Western Cape", "Limpopo", "Eastern Cape"];
const sessions = ["May/June", "Nov", "Supp"];


const PAPERS = SUBJECTS.flatMap((subject, si) =>
  [2026, 2025, 2024, 2023, 2022].flatMap((year, yi) =>
    ([12, 11]).map((grade, gi) => ({
      id: `${subject}-${year}-${grade}`.replace(/\s+/g, "-").toLowerCase(),
      subject,
      grade,
      year,
      province: provinces[(si + yi + gi) % provinces.length],
      session: sessions[(yi + gi) % sessions.length],
      pages: 12 + ((si * 3 + yi * 2 + gi) % 9),
      memo: (si + yi) % 3 == 0,
    })),
  ),
);
const NOTES = [
  {
    slug: "calculus-basics",
    title: "Calculus: first principles to optimisation",
    subject: "Mathematics",
    grade: 12,
    minutes: 9,
    summary: "Derivatives from first principles, rules, and the classic optimisation setups.",
    src: "/notes/calculus-basics.txt",
    proOnly: false,
  },
  {
    slug: "essay-structure",
    title: "Essay structure that scores",
    subject: "English HL",
    grade: 12,
    minutes: 6,
    summary: "How markers read your essay, and the paragraph shape that earns full marks.",
    src: "/notes/essay-structure.txt",
    proOnly: false,
  },
  {
    slug: "apartheid-timeline",
    title: "Apartheid to democracy: the timeline",
    subject: "History",
    grade: 12,
    minutes: 11,
    summary: "1948 to 1994, the turning points examiners keep coming back to.",
    src: "/notes/apartheid-timeline.txt",
    proOnly: false,
  },
  {
    slug: "organic-chemistry",
    title: "Organic chemistry reaction map",
    subject: "Physical Sciences",
    grade: 12,
    minutes: 14,
    summary: "Every reaction type in one map, with conditions you must memorise.",
    src: "/notes/organic-chemistry.txt",
    proOnly: true,
  },
  {
    slug: "financial-statements",
    title: "Company financial statements",
    subject: "Accounting",
    grade: 12,
    minutes: 12,
    summary: "Income statement, balance sheet and the notes that trip everyone up.",
    src: "/notes/financial-statements.txt",
    proOnly: true,
  },
];

function isPaperLocked(paper, tier) {
  if (tier !== "free") return false;
  return !FREE_SUBJECTS.includes(paper.subject) || paper.year >= FREE_PAPER_CUTOFF;
}

const NSC_START = new Date("2026-10-19T08:00:00+02:00");

function daysUntil(date, now = new Date()) {
  return Math.max(0, Math.ceil((date.getTime() - now.getTime()) / 86_400_000));
}

export { TIER_LABEL, SUBJECTS, FREE_SUBJECTS, FREE_PAPER_CUTOFF, FREE_DOWNLOAD_LIMIT, PAPERS, isPaperLocked, NOTES, NSC_START, daysUntil };
  
  
