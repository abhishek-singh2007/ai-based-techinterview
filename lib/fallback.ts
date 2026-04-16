import { feedbackSchema } from "@/constants";

type InterviewType = "behavioral" | "technical" | "mixed";
type InterviewLevel = "entry level" | "mid level" | "senior level";
type AIErrorKind = "quota" | "rate-limit" | "timeout" | "network" | "configuration" | "unknown";

type SavedTranscriptMessage = {
  role: string;
  content: string;
};

type FallbackInterviewParams = {
  role: string;
  type: InterviewType;
  level: string;
  amount: number;
};

type TranscriptAnalysisContext = {
  transcript: SavedTranscriptMessage[];
  role?: string;
  techstack?: string[];
};

const clampScore = (score: number) => Math.max(0, Math.min(100, Math.round(score)));

const normalizeText = (value: string) => value.trim().toLowerCase();

const dedupeQuestions = (questions: string[]) => {
  const seen = new Set<string>();
  return questions.filter((question) => {
    const key = normalizeText(question);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const roleAliases: Array<{ key: string; matchers: RegExp[] }> = [
  { key: "frontend", matchers: [/frontend/i, /ui/i, /react/i, /next/i] },
  { key: "backend", matchers: [/backend/i, /api/i, /server/i, /node/i, /express/i] },
  { key: "fullstack", matchers: [/full\s*stack/i, /fullstack/i] },
  { key: "data", matchers: [/data/i, /analytics/i, /machine learning/i, /ml/i] },
  { key: "devops", matchers: [/devops/i, /infra/i, /deployment/i, /cloud/i, /sre/i] },
  { key: "mobile", matchers: [/mobile/i, /android/i, /ios/i, /flutter/i, /react native/i] },
  { key: "design", matchers: [/design/i, /ui\/ux/i, /ux/i, /product/i] },
];

const getRoleKey = (role: string) => {
  const normalizedRole = normalizeText(role);
  return (
    roleAliases.find((alias) => alias.matchers.some((matcher) => matcher.test(normalizedRole)))?.key ||
    "generic"
  );
};

const titleCaseRole = (role: string) => {
  const cleanedRole = role.trim();
  return cleanedRole.length > 0 ? cleanedRole : "this role";
};

const normalizeLevel = (level: string): InterviewLevel => {
  if (level === "entry level" || level === "mid level" || level === "senior level") {
    return level;
  }

  return "mid level";
};

const genericQuestions = {
  behavioral: [
    (role: string) => `Tell me about yourself and why you are interested in ${role}.`,
    () => "Describe a time when you had to learn something quickly to solve a problem.",
    () => "How do you handle disagreement with a teammate while keeping the work moving?",
    () => "Tell me about a failure and what you learned from it.",
    () => "How do you stay organized when you have multiple priorities at once?",
    () => "What does good communication look like for you on a project?",
  ],
  technical: [
    (role: string) => `What are the core technical skills you would expect to use in a ${role} role?`,
    () => "How do you debug an issue when the root cause is not obvious?",
    () => "How do you decide between implementing a quick fix and a long-term solution?",
    () => "Explain a project you worked on and the technical trade-offs you made.",
    () => "How do you write code that is easy to maintain and test?",
    () => "What steps do you take before shipping a feature to production?",
  ],
  mixed: [
    (role: string) => `Why are you a good fit for a ${role} role?`,
    () => "How would you explain a technical decision to a non-technical stakeholder?",
    () => "Describe a situation where you had to balance speed, quality, and scope.",
    () => "What do you do when you are unsure about the best implementation approach?",
    () => "How do you learn from feedback after a project or interview?",
    () => "Tell me about a time you improved a system, process, or workflow.",
  ],
} satisfies Record<InterviewType, Array<(role: string) => string>>;

const roleSpecificQuestions = {
  frontend: [
    (role: string) => `How would you structure reusable UI components in a ${role} codebase?`,
    () => "How do you handle state management when the UI becomes more complex?",
    () => "What do you check when a page feels slow or heavy in the browser?",
    () => "How do you make sure an interface stays accessible and responsive?",
  ],
  backend: [
    () => "How do you design a clean API and validate incoming requests?",
    () => "What do you consider when choosing a database schema or data model?",
    () => "How do you handle authentication, authorization, and error handling in an API?",
    () => "What steps do you take when a backend service starts failing under load?",
  ],
  fullstack: [
    () => "How do you connect the frontend and backend cleanly in a full stack project?",
    () => "How do you decide where logic should live: client, server, or database?",
    () => "What would you do if a UI issue turns out to be caused by the API contract?",
    () => "How do you keep both user experience and API design in balance?",
  ],
  data: [
    () => "How do you make sure data is clean, trustworthy, and easy to analyze?",
    () => "What is your approach to building a pipeline that can recover from bad input?",
    () => "How do you explain a data result when the numbers look unexpected?",
    () => "How do you think about reporting, dashboards, and data quality together?",
  ],
  devops: [
    () => "How do you approach deployment safety, rollback, and observability?",
    () => "What would you monitor first if an application becomes unstable after release?",
    () => "How do you think about CI, CD, and infrastructure consistency?",
    () => "How do you reduce the chance of configuration drift across environments?",
  ],
  mobile: [
    () => "How do you keep a mobile app responsive and efficient on limited devices?",
    () => "What do you consider when handling offline behavior or flaky network conditions?",
    () => "How do you make sure UI behavior stays consistent across mobile platforms?",
    () => "What would you check if the app feels fast on one device but slow on another?",
  ],
  design: [
    () => "How do you turn product requirements into a usable and attractive interface?",
    () => "What do you look for when evaluating the clarity of a design decision?",
    () => "How do you balance consistency, hierarchy, and accessibility in UI work?",
    () => "How do you validate that a design solves the real user problem?",
  ],
  generic: [
    () => "How do you approach a problem when the best path is not immediately obvious?",
    () => "What would you improve first in a project that feels messy or rushed?",
    () => "How do you communicate progress when a task is taking longer than expected?",
    () => "What does ownership mean to you in a team setting?",
  ],
} satisfies Record<string, Array<() => string>>;

const levelQuestions = {
  "entry level": [
    () => "Explain the basics of how you would approach this role as a beginner.",
    () => "What would you do if you needed help understanding a new concept quickly?",
    () => "How do you ask good questions when you are still learning the stack?",
    () => "What is one concept in this role that you would want to master first?",
  ],
  "mid level": [
    () => "How do you make practical trade-offs when shipping a feature on a deadline?",
    () => "How do you balance code quality, delivery speed, and team collaboration?",
    () => "What would you improve if you inherited an existing production codebase?",
    () => "How do you make your work easier for the next engineer to understand?",
  ],
  "senior level": [
    () => "How would you approach architecture, scalability, and technical decision-making here?",
    () => "How do you guide a team when there are multiple valid technical options?",
    () => "What would you do to reduce long-term risk in a growing product?",
    () => "How do you balance short-term delivery with long-term system health?",
  ],
} satisfies Record<InterviewLevel, Array<() => string>>;

export const classifyAiError = (error: unknown) => {
  const rawMessage = error instanceof Error ? error.message : String(error ?? "");
  const message = rawMessage.toLowerCase();

  if (
    message.includes("quota") ||
    message.includes("resource_exhausted") ||
    message.includes("rate limit") ||
    message.includes("too many requests") ||
    message.includes("429")
  ) {
    return {
      kind: "quota" as AIErrorKind,
      shouldFallback: true,
      message: "AI quota was reached. Free fallback mode was used instead.",
    };
  }

  if (message.includes("timeout") || message.includes("deadline exceeded") || message.includes("etimedout")) {
    return {
      kind: "timeout" as AIErrorKind,
      shouldFallback: true,
      message: "AI took too long to respond. Free fallback mode was used instead.",
    };
  }

  if (
    message.includes("network") ||
    message.includes("fetch failed") ||
    message.includes("econnreset") ||
    message.includes("enotfound")
  ) {
    return {
      kind: "network" as AIErrorKind,
      shouldFallback: true,
      message: "Network issue while contacting AI. Free fallback mode was used instead.",
    };
  }

  if (
    message.includes("api key") ||
    message.includes("invalid api key") ||
    message.includes("unauthorized") ||
    message.includes("configuration")
  ) {
    return {
      kind: "configuration" as AIErrorKind,
      shouldFallback: true,
      message: "AI is not configured correctly. Free fallback mode was used instead.",
    };
  }

  return {
    kind: "unknown" as AIErrorKind,
    shouldFallback: true,
    message: "AI service is unavailable right now. Free fallback mode was used instead.",
  };
};

const buildQuestionPool = ({ role, type, level }: Omit<FallbackInterviewParams, "amount">) => {
  const roleLabel = titleCaseRole(role);
  const roleKey = getRoleKey(role);
  const normalizedLevel = normalizeLevel(level);

  const questions = [
    ...genericQuestions[type].map((question) => question(roleLabel)),
    ...(roleSpecificQuestions[roleKey] || roleSpecificQuestions.generic).map((question) => question(roleLabel)),
    ...levelQuestions[normalizedLevel].map((question) => question(roleLabel)),
    ...genericQuestions.mixed.map((question) => question(roleLabel)),
  ];

  return dedupeQuestions(questions);
};

export const getFallbackInterviewQuestions = ({ role, type, level, amount }: FallbackInterviewParams) => {
  const questionPool = buildQuestionPool({ role, type, level });
  const questions = [...questionPool];

  while (questions.length < amount) {
    questions.push(...questionPool);
  }

  return dedupeQuestions(questions).slice(0, Math.max(amount, 1));
};

const scoreFromText = (text: string, words: string[]) => {
  const normalized = text.toLowerCase();
  return words.reduce((count, word) => count + (normalized.includes(word) ? 1 : 0), 0);
};

const getTranscriptText = (transcript: SavedTranscriptMessage[]) =>
  transcript.map((message) => message.content.trim()).filter(Boolean).join(" ");

const getCandidateTranscriptText = (transcript: SavedTranscriptMessage[]) => {
  const candidateMessages = transcript.filter((message) => message.role === "user");
  return getTranscriptText(candidateMessages.length > 0 ? candidateMessages : transcript);
};

const buildScoreComment = (score: number, strength: string, improvement: string) => {
  if (score >= 80) return strength;
  if (score >= 65) return `${strength} There is still room to sharpen the response structure.`;
  return improvement;
};

const makeCategory = (name: string, score: number, strength: string, improvement: string) => ({
  name,
  score,
  comment: buildScoreComment(score, strength, improvement),
});

export const buildFallbackFeedback = (context: TranscriptAnalysisContext) => {
  const transcriptText = getTranscriptText(context.transcript);
  const candidateTranscriptText = getCandidateTranscriptText(context.transcript);
  const wordCount = candidateTranscriptText.split(/\s+/).filter(Boolean).length;
  const sentenceCount = candidateTranscriptText.split(/[.!?]+/).filter(Boolean).length;
  const fillerCount = scoreFromText(candidateTranscriptText, [
    "um",
    "uh",
    "like",
    "basically",
    "actually",
    "you know",
    "sort of",
    "kind of",
  ]);

  const techContext = [context.role || "", ...(context.techstack || [])].join(" ").toLowerCase();
  const technicalMatches = scoreFromText(`${candidateTranscriptText} ${transcriptText}`, [
    "api",
    "component",
    "database",
    "debug",
    "deploy",
    "performance",
    "testing",
    "trade-off",
    "tradeoff",
    "scalable",
    "architecture",
    ...techContext.split(/\s+/).filter(Boolean),
  ]);

  const problemSolvingMatches = scoreFromText(candidateTranscriptText, [
    "analyze",
    "approach",
    "plan",
    "tradeoff",
    "trade-off",
    "step",
    "because",
    "example",
    "solution",
    "optimize",
    "debug",
    "edge case",
  ]);

  const culturalMatches = scoreFromText(candidateTranscriptText, [
    "team",
    "collaborate",
    "feedback",
    "ownership",
    "communicate",
    "support",
    "learn",
    "adapt",
    "respect",
  ]);

  const confidenceMatches = scoreFromText(candidateTranscriptText, [
    "i can",
    "i would",
    "i will",
    "definitely",
    "confident",
    "clear",
    "sure",
  ]);

  const hedgingMatches = scoreFromText(candidateTranscriptText, [
    "maybe",
    "i think",
    "not sure",
    "kind of",
    "sort of",
    "probably",
  ]);

  const communicationScore = clampScore(54 + Math.min(wordCount * 1.2, 18) + Math.min(sentenceCount * 2, 10) - fillerCount * 4);
  const technicalKnowledgeScore = clampScore(48 + technicalMatches * 7 + Math.min(wordCount / 8, 14));
  const problemSolvingScore = clampScore(50 + problemSolvingMatches * 8 + Math.min(sentenceCount * 2, 10));
  const culturalFitScore = clampScore(52 + culturalMatches * 7 + Math.min(wordCount / 14, 8));
  const confidenceScore = clampScore(50 + confidenceMatches * 6 - hedgingMatches * 4 - Math.min(fillerCount * 2, 8));

  const scores = [
    communicationScore,
    technicalKnowledgeScore,
    problemSolvingScore,
    culturalFitScore,
    confidenceScore,
  ];

  const totalScore = clampScore(scores.reduce((sum, score) => sum + score, 0) / scores.length);

  const categoryScores = [
    makeCategory(
      "Communication Skills",
      communicationScore,
      "Your answers were clear and easy to follow.",
      "Try giving shorter, more structured answers with a clear beginning, middle, and end."
    ),
    makeCategory(
      "Technical Knowledge",
      technicalKnowledgeScore,
      "You showed a reasonable understanding of the role and related concepts.",
      "Add more concrete technical examples, especially around implementation and trade-offs."
    ),
    makeCategory(
      "Problem Solving",
      problemSolvingScore,
      "You explained parts of your thinking process in a practical way.",
      "Make your reasoning more explicit by walking through your approach step by step."
    ),
    makeCategory(
      "Cultural Fit",
      culturalFitScore,
      "You gave some signals of collaboration and team awareness.",
      "Mention ownership, teamwork, or communication examples more clearly."
    ),
    makeCategory(
      "Confidence and Clarity",
      confidenceScore,
      "Your delivery had some confident moments.",
      "Reduce hedging words and speak with a more direct, decisive tone."
    ),
  ] as const;

  const strengths = [
    communicationScore >= 70 ? "Clear communication in several responses." : "You stayed engaged throughout the interview.",
    technicalKnowledgeScore >= 70 ? "Good technical awareness for the role." : "You attempted to explain technical ideas instead of staying silent.",
    problemSolvingScore >= 70 ? "You showed logical thinking under pressure." : "You made an effort to think through the problem before answering.",
  ];

  const areasForImprovement = [
    communicationScore < 70 ? "Structure answers more cleanly so the interviewer can follow your reasoning." : "Keep tightening the structure of your examples.",
    technicalKnowledgeScore < 70 ? "Add more concrete technical details and implementation examples." : "Push further into architecture and trade-offs.",
    confidenceScore < 70 ? "Speak more directly and reduce filler or hedging language." : "Keep the same confidence while adding stronger examples.",
  ];

  const finalAssessment =
    totalScore >= 80
      ? `Strong fallback-mode interview performance for ${context.role || "this role"}. You gave solid answers with good clarity and good technical grounding.`
      : totalScore >= 65
        ? `Decent fallback-mode interview performance for ${context.role || "this role"}. The answers were usable, but they need more structure and detail.`
        : `This fallback-mode interview shows room for improvement for ${context.role || "this role"}. Focus on structure, concrete examples, and stronger technical reasoning.`;

  return feedbackSchema.parse({
    totalScore,
    categoryScores,
    strengths,
    areasForImprovement,
    finalAssessment,
  });
};
