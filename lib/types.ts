/**
 * Cortex Lattice - TypeScript Type Definitions
 *
 * Core types for problems, hints, test results, and execution.
 */

// ============================================================================
// Problem Types
// ============================================================================

export interface Problem {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  pattern: string | string[];
  theme?: string;
  estimatedTime?: string;
  description: string;
  storyContext?: string;
  examples: ProblemExample[];
  constraints: string[];
  hints: ProblemHint[];
  starterCodePython: string;
  starterCodeJavascript?: string;
  testCases: TestCase[];
  edgeCases?: EdgeCase[];
  patternLearningObjectives?: string[];
  realWorldApplications?: string[];
  complexityAnalysis?: ComplexityAnalysis;
  patternSignature?: PatternSignature;
}

export interface ProblemExample {
  input: Record<string, unknown>;
  output: unknown;
  explanation: string;
}

export interface ProblemHint {
  level: number;
  text: string;
}

export interface TestCase {
  id: string;
  input: Record<string, unknown>;
  expected: unknown;
  explanation?: string;
}

export interface EdgeCase {
  case: string;
  description: string;
  testId: string;
}

export interface ComplexityAnalysis {
  time: {
    naive?: string;
    optimal: string;
  };
  space: {
    optimal: string;
  };
}

export interface PatternSignature {
  indicators?: string[];
  patternName: string;
  whenToUse?: string[];
}

// ============================================================================
// Solution Types
// ============================================================================

export interface Solution {
  id: string;
  pattern: string;
  difficulty: string;
  solutionCodePython: string;
  solutionCodeJavascript?: string;
  referenceTrace?: ReferenceTrace;
  complexity?: ComplexityDetails;
  alternativeSolutions?: AlternativeSolution[];
  approachExplanation?: ApproachExplanation;
}

export interface ReferenceTrace {
  input: Record<string, unknown>;
  steps: TraceStep[];
  summary?: TraceSummary;
}

export interface TraceStep {
  step: number;
  line: number;
  action: string;
  state: Record<string, unknown>;
  explanation?: string;
  calculation?: string;
  check?: string;
  comparison?: string;
  decision?: string;
  reasoning?: string;
  visualizationNote?: string;
}

export interface TraceSummary {
  totalIterations: number;
  comparisonsMade: number;
  pointerMoves?: number;
  result: string;
  efficiency: string;
}

export interface ComplexityDetails {
  time: {
    bestCase?: string;
    averageCase?: string;
    worstCase?: string;
    explanation?: string;
  };
  space: {
    value: string;
    explanation?: string;
    note?: string;
  };
}

export interface AlternativeSolution {
  name: string;
  approach: string;
  codePython?: string;
  complexity: {
    time: string;
    space: string;
  };
  comparison?: string;
  whenToUse?: string;
  teachingValue?: string;
}

export interface ApproachExplanation {
  coreInsight: string;
  whyItWorks: WhyItWorksReason[];
  stepByStep: ApproachStep[];
  visualMetaphor?: string;
}

export interface WhyItWorksReason {
  reason: string;
  detail: string;
}

export interface ApproachStep {
  step: number;
  action: string;
  why?: string;
  cases?: string[];
}

// ============================================================================
// Mistakes (Common Errors) Types
// ============================================================================

export interface MistakesFile {
  pattern: string;
  problemId: string;
  commonMistakes: CommonMistake[];
  mistakeCategories?: Record<string, string[]>;
  mistakeProgression?: MistakeProgression;
  teachingStrategies?: Record<string, string[]>;
}

export interface CommonMistake {
  id: string;
  severity: "low" | "medium" | "high";
  category: string;
  description: string;
  detection: MistakeDetection;
  whyStudentsDoThis: string;
  teachingMoment: TeachingMoment;
}

export interface MistakeDetection {
  executionTracePattern?: string;
  complexityAnalysis?: Record<string, string>;
  codePattern?: string[];
  logic?: string;
  specificPatterns?: { pattern: string; explanation: string }[];
  codeAnalysis?: string[];
  symptom?: string[];
}

export interface TeachingMoment {
  title: string;
  explanation: string;
  visualization?: MistakeVisualization;
  hint?: string;
  nextStep?: string;
  rule?: string;
  fix?: string;
  ruleToRemember?: string;
  practicePrompt?: string;
  visual?: { type: string; show: string };
  correctPattern?: string;
  whyThisMatters?: string;
}

export interface MistakeVisualization {
  type: string;
  yourApproach?: VisualizationApproach;
  optimalApproach?: VisualizationApproach;
  showCurrentState?: Record<string, unknown>;
  yourMove?: Record<string, unknown>;
  correctMove?: Record<string, unknown>;
}

export interface VisualizationApproach {
  name: string;
  codeSnippet?: string;
  complexity: string;
  comparisonsForN10?: number | string;
  comparisonsForN1000?: number | string;
  visual?: string;
}

export interface MistakeProgression {
  typicalLearningPath: { stage: number; mistake?: string; achievement?: string; teaching?: string; next?: string }[];
}

// ============================================================================
// Invariants Types
// ============================================================================

export interface InvariantsFile {
  pattern: string;
  problemId: string;
  coreInvariants: Invariant[];
  algorithmCorrectnessInvariants?: Invariant[];
  efficiencyInvariants?: Invariant[];
  patternRecognitionInvariants?: Invariant[];
  teachingProgressions?: Record<string, string[]>;
  commonMisconceptions?: Misconception[];
}

export interface Invariant {
  id: string;
  description: string;
  whyItMatters: string;
  violationDetection?: string[] | Record<string, string>;
  teachingMomentIfViolated?: string;
  patternMatchCriteria?: string[];
  correctnessProof?: string;
}

export interface Misconception {
  misconception: string;
  reality: string;
}

// ============================================================================
// Pause Points Types
// ============================================================================

export interface PausePointsFile {
  pattern: string;
  problemId: string;
  pausePoints: PausePoint[];
  learningObjectivesByPausePoint?: Record<string, string[]>;
  interactiveElements?: {
    visualizationTypes: string[];
    engagementTechniques: string[];
  };
  pedagogicalApproach?: {
    scaffolding: string[];
    activeLearning: string[];
    immediateFeedback: string[];
  };
}

export interface PausePoint {
  id: string;
  trigger: {
    step: number | string;
    condition: string;
  };
  context: {
    showState: string;
  };
  question: string;
  questionType: string;
  options?: PausePointOption[];
  freeResponsePrompt?: string;
  expectedUnderstanding?: string[];
  revealAnswer?: string;
  nextChallenge?: string;
  prompts?: string[];
  discussion?: string;
  teachingMoment?: string;
  visualization?: Record<string, unknown>;
}

export interface PausePointOption {
  text: string;
  correct: boolean;
  feedback: string;
}

// ============================================================================
// Learning Guide Types (Revamped from Hint System)
// ============================================================================

export type HintCategory =
  | "key_concepts"
  | "common_mistakes"
  | "project_context"
  | "paper_reference"
  | "solution_approach";

export interface CategorizedHints {
  keyConcepts: HintItem[];
  commonMistakes: HintItem[];
  projectContext: HintItem[];
  paperReference: HintItem[];
  solutionApproach: HintItem[];
}

export interface HintItem {
  id: string;
  text: string;
  revealed: boolean;
}

export interface HintCategoryInfo {
  id: HintCategory;
  icon: string;
  title: string;
  description: string;
}

export const HINT_CATEGORIES: HintCategoryInfo[] = [
  {
    id: "key_concepts",
    icon: "lightbulb",
    title: "Key Concepts",
    description: "Fundamental algorithmic concepts",
  },
  {
    id: "common_mistakes",
    icon: "alert-triangle",
    title: "Common Mistakes",
    description: "Pitfalls to avoid",
  },
  {
    id: "project_context",
    icon: "cpu",
    title: "Project Context",
    description: "Where this appears in AI papers",
  },
  {
    id: "paper_reference",
    icon: "file-text",
    title: "Paper Reference",
    description: "Citations and sections",
  },
  {
    id: "solution_approach",
    icon: "target",
    title: "Solution Approach",
    description: "Step-by-step solution",
  },
];

// ============================================================================
// Learning Guide Types (New comprehensive guide structure)
// ============================================================================

export interface LearningGuide {
  // Problem Context Section
  problemContext: {
    title: string;
    pattern: string;
    difficulty: string;
    description: string;
    storyContext?: string;
    realWorldApplications: string[];
    patternLearningObjectives: string[];
  };

  // Guidance Section (from guidance.yaml)
  guidance: {
    keyConcepts: string[];
    commonMistakes: string[];
    realWorld: string[];
  };

  // Solution Section (from solution.yaml)
  solution: {
    solutionApproach: string[];
    complexity: {
      time: string;
      space: string;
    };
    coreInsight?: string;
    stepByStep?: SolutionStep[];
    codePython?: string;
    alternativeSolutions?: AlternativeSolutionBrief[];
  };

  // Pattern Transfer (from guidance.yaml)
  patternTransfer?: {
    similarProblems: PatternTransferProblem[];
  };
}

export interface SolutionStep {
  step: number;
  action: string;
  why?: string;
}

export interface AlternativeSolutionBrief {
  name: string;
  approach: string;
  time: string;
  space: string;
  whenToUse?: string;
}

export interface PatternTransferProblem {
  name: string;
  invariantsShared: string[];
  difference?: string;
  modification?: string;
}

// ============================================================================
// Execution Types
// ============================================================================

export interface ExecutionRequest {
  problemId: string;
  code: string;
  language?: "python" | "javascript";
}

export interface ExecutionResult {
  success: boolean;
  total: number;
  passed: number;
  failed: number;
  results: TestResult[];
  error?: string;
  traceback?: string;
}

export interface TestResult {
  id: string;
  input: Record<string, unknown>;
  expected: unknown;
  output: unknown;
  passed: boolean;
  error?: string;
  traceback?: string;
  executionTimeMs?: number;
  explanation?: string;
}

// ============================================================================
// UI State Types
// ============================================================================

export interface EditorState {
  code: string;
  language: "python" | "javascript";
  isRunning: boolean;
  hasChanges: boolean;
}

export interface HintState {
  revealedHints: Record<HintCategory, number>;
  expandedCategory: HintCategory | null;
}

export interface ProblemPageState {
  problem: Problem | null;
  hints: CategorizedHints | null;
  editor: EditorState;
  hintState: HintState;
  executionResult: ExecutionResult | null;
  bottomSheetOpen: boolean;
}

// ============================================================================
// Problem Card (for browser)
// ============================================================================

export interface ProblemCard {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  pattern: string | string[];
  theme?: string;
  solved?: boolean;
}

export interface ProblemGroup {
  theme: string;
  title: string;
  problems: ProblemCard[];
  solvedCount: number;
}

// ============================================================================
// Slash Command Types (Inline Contributions)
// ============================================================================

/** Command types supported by the slash command system */
export type SlashCommandType = "problem" | "solution" | "guidance";

/** Subcommand types for each main command */
export type SlashSubcommand = "new" | "list" | "edit" | "link" | "select";

/** Link types between contributions */
export type ContributionLinkType = "solves" | "references" | "extends";

/** Result of parsing a slash command from editor input */
export interface ParsedCommand {
  command: SlashCommandType;
  subcommand: SlashSubcommand;
  content: string;
  references?: string[]; // For /guidance /select ref1 ref2 "content"
  raw: string; // Original input string
  isValid: boolean;
  error?: string;
}

/** Result of executing a slash command */
export interface CommandResult {
  success: boolean;
  contributionId?: string;
  message: string;
  linkedContributions?: string[];
  suggestedCategory?: string;
  error?: string;
}

/** Captured context when a command is executed */
export interface ContributionContext {
  code: string; // Current code in editor
  cursorLine: number;
  cursorColumn: number;
  selectedText?: string;
  language: "python" | "javascript";
  testResults?: ExecutionResult;
  revealedHints?: string[];
}

/** References to other contributions (for /guidance command) */
export interface ContributionReferences {
  problems?: string[]; // Problem contribution IDs
  solutions?: string[]; // Solution contribution IDs
}

/** Data structure for creating a new contribution */
export interface CreateContributionInput {
  sessionId: string;
  userId: string;
  problemId: string;
  command: SlashCommandType;
  subcommand: SlashSubcommand;
  content: string;
  timeSinceStart?: number;
  currentAttempt?: number;
  context: ContributionContext;
  references?: ContributionReferences;
}

/** Inline contribution as returned from API */
export interface InlineContribution {
  id: string;
  sessionId: string;
  userId: string | null;
  problemId: string;
  command: SlashCommandType;
  subcommand: SlashSubcommand;
  content: string;
  timestamp: string;
  timeSinceStart?: number;
  currentAttempt?: number;
  context: ContributionContext;
  references?: ContributionReferences;
  suggestedCategory?: string;
  relatedPattern?: string;
  relatedInvariant?: string;
  helpfulVotes: number;
  usedInGuidance: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Link between contributions */
export interface ContributionLink {
  id: string;
  fromContributionId: string;
  toContributionId: string;
  linkType: ContributionLinkType;
  autoGenerated: boolean;
  confidenceScore?: number;
  createdAt: string;
}

/** Session context for tracking user progress */
export interface SessionContext {
  sessionId: string;
  problemId: string;
  userId: string;
  startTime: number;
  attemptCount: number;
  recentProblems: string[]; // Recent problem contribution IDs for auto-linking
}

/** Autocomplete suggestion for slash commands */
export interface SlashCommandSuggestion {
  command: string;
  label: string;
  description: string;
  syntax: string;
  example: string;
}

/** State for the slash command autocomplete UI */
export interface SlashAutocompleteState {
  isOpen: boolean;
  suggestions: SlashCommandSuggestion[];
  selectedIndex: number;
  inputValue: string;
  position: { x: number; y: number };
}
