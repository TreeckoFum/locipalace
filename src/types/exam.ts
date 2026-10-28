export interface Phase2Question {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  userSelectedIndex?: number;
  isCorrect?: boolean;
}

export interface PinExamRecord {
  pinId: string;
  conceptTitle: string;
  anchorName: string;
  originalNotes: string;

  // Phase 1: Spatial Recall (Weight: 10%)
  phase1Passed: boolean;
  phase1Score: number; // 0 or 10

  // Phase 2: Adaptive Multiple-Choice Quiz (Weight: 40%)
  phase2Questions: Phase2Question[];
  phase2Score: number; // (correctCount / totalQuestions) * 40

  // Phase 3: Active Recall Essay & AI Semantic Grader (Weight: 50%)
  phase3Prompt: string;
  userExplanation: string;
  aiFeedback: string;
  phase3Score: number; // (semanticScorePercent / 100) * 50

  // Total for this Pin (0 to 100)
  totalPinScore: number; // phase1Score + phase2Score + phase3Score
}

export interface ExamAttempt {
  id: string;
  palaceId: string;
  palaceName: string;
  timestamp: string;
  finalScore: number; // Mean average of totalPinScore across all pins
  pinsEvaluated: PinExamRecord[];
}

export type ExamPhaseStage = 'PHASE_1' | 'PHASE_2' | 'PHASE_3' | 'SUMMARY';

export interface ActiveExamSession {
  palaceId: string;
  palaceName: string;
  attemptNumber: number;
  activePinIndex: number;
  currentPhase: ExamPhaseStage;
  currentPinRecord: Partial<PinExamRecord>;
  records: PinExamRecord[];
  isEvaluating: boolean;
  isLoadingQuestions?: boolean;
}
