export type Locale = 'es' | 'en' | 'ca';

export type PinRecallStatus = 'UNTESTED' | 'MASTERED' | 'NEEDS_REVIEW' | 'FAILED';

export type StickerGalleryItem = {
  id: string;
  url: string;
  prompt: string;
  createdAt: string;
};

export type RoomPin = {
  id: string;
  x: number; // Porcentaje horizontal respecto a la imagen (0 - 100)
  y: number; // Porcentaje vertical respecto a la imagen (0 - 100)
  title: string;
  anchorName?: string;
  concept: string;
  notes?: string;
  detailedNotes: string;
  hook?: string;
  triggerWord?: string;
  mnemonicVisual?: string;
  customSticker?: string; // Data URI data:image/svg+xml;utf8,... or base64 sticker
  imageUrl?: string; // URL del sticker mnemotécnico visual
  lastScore?: number; // Puntuación de 0 a 100 en la última evaluación
  score?: number; // Puntuación de 0 a 100 en el motor de Active Recall
  status?: PinRecallStatus; // Estado del semáforo mnemotécnico
  lastTestedAt?: string; // ISO timestamp del último intento
};

// Tipo sanitizado para evitar fugas de información en el cliente durante RECALL y EXAM
export type SanitizedPin = Pick<RoomPin, 'id' | 'x' | 'y' | 'title' | 'status' | 'score'>;

export interface PalaceFolder {
  id: string;
  name: string;
  createdAt: number;
}

export interface MemoryPalace {
  id: string;
  name: string;
  folderId?: string;
  imageUrl: string;
  aspectRatio: number; // Ancho / Alto original para bloquear el contenedor
  locale: Locale;
  pins: RoomPin[];
  retentionRate?: number; // 0 to 100% palace retention rate
  createdAt: number;
  updatedAt?: number;
}

export type Room = MemoryPalace;

export type AppMode = 'BUILD' | 'STUDY' | 'RECALL' | 'EXAM';
export type StudyMode = 'build' | 'study' | 'memory' | 'exam';

export interface ExamSessionState {
  currentQuestionIndex: number;
  correctAnswers: number;
  isFinished: boolean;
  targetPinId: string | null;
}

export type RecallEvaluationResult = {
  score: number; // 0 - 100
  status: 'MASTERED' | 'NEEDS_REVIEW' | 'FAILED';
  feedback: string;
  suggestedImprovement?: string;
  isPass?: boolean;
  missingKeyPoints?: string[];
};

export type ExamQuestionType = 'MULTIPLE_CHOICE' | 'OPEN_DEVELOPMENT';

export type ExamQuestion = {
  id: string;
  type: ExamQuestionType;
  question: string;
  options?: string[]; // Exactamente 4 opciones si es MULTIPLE_CHOICE
  correctOptionIndex?: number;
  sourcePinId: string;
  rubricCriteria?: string;
};

export type ExamResult = {
  globalScore: number; // Nota final de 0 a 10
  totalQuestions: number;
  correctAnswers: number;
  feedbackSummary: string;
  weakPinIds: string[]; // Pines que requieren repaso
};
