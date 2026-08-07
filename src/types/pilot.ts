// Question types
export type QuestionType = 'likert' | 'single' | 'multi' | 'ranking' | 'freetext';

// Question category/area
export type QuestionArea = 'value' | 'decision' | 'efficacy' | 'practical' | 'preference' | 'conditional' | 'rolemodel' | 'ranking';

// Survey phase for 2-step pilot
export type PilotPhase =
  | 'intro'
  | 'interest_select'
  | 'major_preview'
  | 'riasec'
  | 'riasec_result'
  | 'supplementary'
  | 'phone_collection'
  | 'complete';

// Base question interface
export interface PilotQuestion {
  id: string;                    // e.g., 'V01', 'D01', 'S01'
  area: QuestionArea;
  type: QuestionType;
  text: string;
  options?: string[];            // For single/multi select
  condition?: {                  // For conditional questions
    dependsOn: string;           // Question ID
    values: (string | number)[]; // Trigger values
  };
  maxSelections?: number;        // For multi select
  maxRank?: number;              // For ranking
  riasecDim?: 'R'|'I'|'A'|'S'|'E'|'C';  // For RIASEC-specific questions
}

// Answer type varies by question type
export type PilotAnswer =
  | number                       // Likert 1-5
  | string                       // Single select or free text
  | string[]                     // Multi select
  | Record<string, number>;      // Ranking {option: rank}

// All answers as a map
export interface PilotAnswers {
  [questionId: string]: PilotAnswer;
}

// Value score categories (7 areas from the plan)
export interface ValueScores {
  achievement: number;     // 성취
  recognition: number;     // 인정
  independence: number;    // 자율
  social: number;          // 사회공헌
  security: number;        // 안정
  economic: number;        // 경제
  growth: number;          // 성장
}

// Career decision status
export type DecisionStatus = 'decided' | 'exploring' | 'undecided';

export interface CareerDecision {
  status: DecisionStatus;
  score: number;
  factors?: string[];      // For undecided reasons from C04
}

// Self-efficacy by RIASEC dimension
export type SelfEfficacy = Partial<Record<'R'|'I'|'A'|'S'|'E'|'C', number>>;

// RIASEC scores from the forced-choice survey
export interface RiasecScores {
  R: number;
  I: number;
  A: number;
  S: number;
  E: number;
  C: number;
}

// RIASEC answers mapping question ID to choice
export interface RiasecAnswer {
  [questionId: number]: 'A' | 'B';
}

// Preferences from S01-S04
export interface Preferences {
  fieldPreference?: string;       // S01: 선호 계열
  workStyle?: string;             // S02: 업무 스타일
  workEnvironment?: string;       // S03: 근무 환경
  careerGoal?: string;            // S04: 진로 목표
  conditionalDetails?: string[];  // C01-C03: 세부 선택
}

// Complete pilot result
export interface PilotResult {
  id?: number;
  code: string;                   // P + 7 digits
  name?: string;                  // User name
  studentId?: string;             // Student ID (students)
  email?: string;                 // User email for results
  rawAnswers: PilotAnswers;
  valueScores: ValueScores;
  careerDecision: CareerDecision;
  selfEfficacy: SelfEfficacy;
  preferences: Preferences;
  roleModel?: {
    name?: string;                // R01: Free text role model
    traits?: string[];            // R02: Selected traits
  };
  valueRanking?: Record<string, number>;  // K01: Value priority ranking
  riasecScores?: RiasecScores;      // RIASEC 6-dimension scores
  riasecAnswers?: RiasecAnswer;     // Raw RIASEC answers
  skippedSupplementary?: boolean;   // Whether supplementary was skipped
  deviceInfo?: DeviceInfo;
  createdAt: string;
  expiresAt: string;
}

// Device info for analytics
export interface DeviceInfo {
  userAgent?: string;
  screenWidth?: number;
  screenHeight?: number;
  platform?: string;
  language?: string;
}

// Survey state for the hook
export interface PilotSurveyState {
  currentQuestionIndex: number;
  answers: PilotAnswers;
  startTime: Date;
  phase: PilotPhase;
  activeQuestions: PilotQuestion[];  // Filtered by conditions
}

// DB model matching SQL schema
export interface PilotResultDB {
  id?: number;
  code: string;
  name?: string;
  student_id?: string;
  email?: string;
  riasec_code?: string;
  raw_answers: PilotAnswers;
  value_scores?: ValueScores;
  career_decision?: CareerDecision;
  self_efficacy?: SelfEfficacy;
  preferences?: Preferences;
  riasec_scores?: RiasecScores;
  riasec_answers?: RiasecAnswer;
  skipped_supplementary?: boolean;
  device_info?: DeviceInfo;
  duration_seconds?: number | null;
  source?: string | null;
  created_at: string;
  expires_at: string;
}
