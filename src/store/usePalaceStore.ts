import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  AppMode,
  ExamSessionState,
  Locale,
  MemoryPalace,
  PalaceFolder,
  PinRecallStatus,
  Room,
  RoomPin,
  StickerGalleryItem,
  StudyMode,
} from '@/types/palace';
import type {
  ActiveExamSession,
  ExamAttempt,
  Phase2Question,
  PinExamRecord,
} from '@/types/exam';

export interface PendingPinCoords {
  x: number;
  y: number;
}

export interface RecallRecordInput {
  score: number;
  status: 'MASTERED' | 'NEEDS_REVIEW' | 'FAILED';
}

export interface LightboxImageState {
  url: string;
  prompt?: string;
  title?: string;
}

const MAX_HISTORY_ENTRIES = 20;

export const DEFAULT_FOLDER_ID = 'folder_oposiciones_general';
export const DEFAULT_DEMO_PALACE_ID = 'sample_study_desk';

// Rich SVG scene of a Study Desk (1600x900 -> 16:9 aspect ratio)
export const SAMPLE_STUDY_DESK_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900">
  <defs>
    <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#090d16"/>
      <stop offset="100%" stop-color="#111827"/>
    </linearGradient>
    <linearGradient id="desk" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <radialGradient id="lampGlow" cx="0.22" cy="0.38" r="0.32">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.28"/>
      <stop offset="55%" stop-color="#6366f1" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="screen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1e1b4b"/>
      <stop offset="50%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#083344"/>
    </linearGradient>
  </defs>

  <!-- Background Wall & Grid -->
  <rect width="1600" height="900" fill="url(#wall)"/>
  <circle cx="350" cy="340" r="480" fill="url(#lampGlow)"/>

  <!-- Bookshelf Top Right -->
  <rect x="1080" y="95" width="390" height="22" rx="6" fill="#334155"/>
  <rect x="1110" y="30" width="38" height="65" rx="4" fill="#6366f1"/>
  <rect x="1152" y="20" width="44" height="75" rx="4" fill="#06b6d4"/>
  <rect x="1202" y="38" width="32" height="57" rx="4" fill="#f59e0b"/>
  <rect x="1245" y="25" width="48" height="70" rx="4" fill="#ec4899"/>

  <!-- Framed Blueprint Top Left -->
  <rect x="130" y="70" width="280" height="160" rx="10" fill="#0f172a" stroke="#334155" stroke-width="4"/>
  <line x1="160" y1="110" x2="380" y2="110" stroke="#1e293b" stroke-width="3"/>
  <circle cx="220" cy="160" r="32" fill="none" stroke="#38bdf8" stroke-width="2" stroke-dasharray="6 4"/>
  <rect x="275" y="132" width="85" height="55" fill="none" stroke="#818cf8" stroke-width="2"/>

  <!-- Desk Surface -->
  <polygon points="0,580 1600,580 1600,900 0,900" fill="url(#desk)"/>
  <line x1="0" y1="580" x2="1600" y2="580" stroke="#334155" stroke-width="4"/>

  <!-- OBJECT 1: Vintage Brass Desk Lamp (x ~ 22%, y ~ 38%) -->
  <ellipse cx="350" cy="610" rx="75" ry="20" fill="#d97706"/>
  <path d="M 350 605 Q 280 440 345 310" fill="none" stroke="#f59e0b" stroke-width="14" stroke-linecap="round"/>
  <polygon points="310,310 425,345 395,260 325,265" fill="#fbbf24" stroke="#f59e0b" stroke-width="4"/>
  <circle cx="368" cy="332" r="18" fill="#fef08a"/>

  <!-- OBJECT 2: Ultra-Wide Study Monitor (x ~ 50%, y ~ 45%) -->
  <rect x="740" y="520" width="120" height="70" rx="6" fill="#475569"/>
  <rect x="680" y="580" width="240" height="18" rx="8" fill="#64748b"/>
  <rect x="520" y="230" width="560" height="310" rx="18" fill="#0f172a" stroke="#475569" stroke-width="8"/>
  <rect x="536" y="246" width="528" height="278" rx="10" fill="url(#screen)"/>
  <rect x="570" y="280" width="180" height="14" rx="4" fill="#38bdf8" opacity="0.7"/>
  <rect x="570" y="310" width="320" height="10" rx="4" fill="#818cf8" opacity="0.5"/>
  <rect x="570" y="332" width="270" height="10" rx="4" fill="#818cf8" opacity="0.5"/>
  <rect x="570" y="370" width="210" height="110" rx="8" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
  <rect x="810" y="370" width="210" height="110" rx="8" fill="#1e293b" stroke="#a855f7" stroke-width="2"/>

  <!-- Mechanical Keyboard -->
  <polygon points="620,650 980,650 1010,730 590,730" fill="#0f172a" stroke="#475569" stroke-width="3"/>

  <!-- OBJECT 3: Espresso Mug & Leather Field Notes (x ~ 78%, y ~ 66%) -->
  <polygon points="1140,610 1340,630 1310,770 1110,745" fill="#1e1b4b" stroke="#6366f1" stroke-width="3"/>
  <line x1="1155" y1="645" x2="1305" y2="660" stroke="#4f46e5" stroke-width="2"/>
  <line x1="1148" y1="675" x2="1295" y2="690" stroke="#4f46e5" stroke-width="2"/>
  <ellipse cx="1390" cy="655" rx="46" ry="20" fill="#0f172a" stroke="#38bdf8" stroke-width="4"/>
  <rect x="1344" y="595" width="92" height="60" rx="12" fill="#0284c7"/>
  <ellipse cx="1390" cy="595" rx="46" ry="16" fill="#38bdf8"/>
  <ellipse cx="1390" cy="595" rx="36" ry="11" fill="#451a03"/>
  <path d="M 1436 610 C 1465 610 1465 642 1436 642" fill="none" stroke="#38bdf8" stroke-width="8"/>
</svg>
`)}`;

export function createSamplePalace(locale: Locale = 'es'): MemoryPalace {
  return {
    id: DEFAULT_DEMO_PALACE_ID,
    name: 'Despacho de Estudio (Demo)',
    folderId: DEFAULT_FOLDER_ID,
    imageUrl: SAMPLE_STUDY_DESK_SVG,
    aspectRatio: 16 / 9,
    locale,
    createdAt: Date.now(),
    pins: [
      {
        id: 'demo_pin_lamp',
        x: 22.8,
        y: 36.8,
        title: 'Lámpara de Escritorio de Bronce',
        concept: 'Principio de Legalidad Penal (Art. 25.1 CE)',
        detailedNotes:
          'Nadie puede ser condenado o sancionado por acciones u omisiones que en el momento de producirse no constituyan delito, falta o infracción administrativa, según la legislación vigente en aquel momento. Comprende cuatro garantías: criminal, penal, jurisdiccional y de ejecución, prohibiendo la analogía in malam partem.',
        mnemonicVisual: undefined,
        status: 'UNTESTED',
        score: undefined,
        lastScore: undefined,
        lastTestedAt: undefined,
      },
      {
        id: 'demo_pin_monitor',
        x: 50.0,
        y: 41.5,
        title: 'Monitor Ultra-Ancho de Estudio',
        concept: 'Principio de Culpabilidad',
        detailedNotes:
          'No hay pena sin dolo o imprudencia (art. 5 CP). Exige imputabilidad personal, responsabilidad por el hecho propio y proscribe toda forma de responsabilidad objetiva (versari in re illicita).',
        mnemonicVisual: undefined,
        status: 'UNTESTED',
        score: undefined,
        lastScore: undefined,
        lastTestedAt: undefined,
      },
      {
        id: 'demo_pin_espresso',
        x: 78.5,
        y: 67.5,
        title: 'Taza de Expreso y Cuaderno de Cuero',
        concept: 'Tutela Judicial Efectiva (Art. 24 CE)',
        detailedNotes:
          'Todas las personas tienen derecho a obtener la tutela efectiva de los jueces y tribunales en el ejercicio de sus derechos e intereses legítimos, sin que, en ningún caso, pueda producirse indefensión.',
        mnemonicVisual: undefined,
        status: 'UNTESTED',
        score: undefined,
        lastScore: undefined,
        lastTestedAt: undefined,
      },
    ],
  };
}

const INITIAL_FOLDERS: PalaceFolder[] = [
  {
    id: DEFAULT_FOLDER_ID,
    name: 'Oposiciones & Estudio General',
    createdAt: Date.now(),
  },
];

const INITIAL_DEMO_PALACE = createSamplePalace('es');

interface PalaceState {
  currentMode: AppMode;
  studyMode: StudyMode;
  activePinIndex: number;
  revealedPins: Record<string, boolean>;
  examState: ExamSessionState | null;
  examHistory: ExamAttempt[];
  activeExamSession: ActiveExamSession | null;
  isExamHistoryOpen: boolean;
  currentRoom: Room | null;
  selectedPin: RoomPin | null;
  pendingCoords: PendingPinCoords | null;
  isPinModalOpen: boolean;
  isRecallModalOpen: boolean;

  // Study Session & 4 Modes Actions
  setStudyMode: (mode: StudyMode) => void;
  setActivePinIndex: (index: number) => void;
  nextStudyPin: () => void;
  prevStudyPin: () => void;
  togglePinRevealed: (pinId: string, revealed?: boolean) => void;
  setAllPinsRevealed: (revealed: boolean) => void;
  startExamSession: (palaceId?: string) => void;
  setGeneratedPinExamData: (
    pinId: string,
    phase2Questions: Phase2Question[],
    phase3Prompt: string
  ) => void;
  setExamLoadingQuestions: (loading: boolean) => void;
  setExamEvaluating: (evaluating: boolean) => void;
  recordPhase1: (pinId: string, passed: boolean) => void;
  recordPhase2Answer: (
    pinId: string,
    questionId: string,
    selectedIndex: number
  ) => void;
  advanceToPhase3: () => void;
  submitPhase3: (
    pinId: string,
    explanation: string,
    aiScore: number,
    feedback: string
  ) => void;
  advanceExamToNextPin: () => void;
  finalizeExamAttempt: () => ExamAttempt | null;
  toggleExamHistoryDrawer: (open?: boolean) => void;
  answerExamPin: (clickedPinId: string) => { isCorrect: boolean; isFinished: boolean };
  updatePalaceRetentionRate: (rate: number) => void;

  // Folders & Multi-Palace Hierarchy State
  folders: PalaceFolder[];
  palaces: MemoryPalace[];
  activePalaceId: string;
  isPalaceManagerOpen: boolean;
  isSavePalaceModalOpen: boolean;
  isMobileSidebarOpen: boolean;

  // Folder & Palace Actions
  createFolder: (name: string) => string;
  renameFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;
  createPalace: (
    name: string,
    folderId?: string,
    imageSrc?: string,
    aspectRatio?: number
  ) => string;
  renamePalace: (id: string, name: string) => void;
  deletePalace: (id: string) => void;
  deleteProject: (id: string) => void;
  movePalaceToFolder: (palaceId: string, folderId?: string) => void;
  setActivePalace: (id: string) => void;
  togglePalaceManager: (open?: boolean) => void;
  toggleSavePalaceModal: (open?: boolean) => void;
  toggleMobileSidebar: (open?: boolean) => void;
  savePalaceDetails: (
    palaceId: string,
    name: string,
    folderId?: string
  ) => void;
  restoreWorkspaceBackup: (
    folders: PalaceFolder[],
    palaces: MemoryPalace[],
    activePalaceId?: string,
    stickerGallery?: StickerGalleryItem[]
  ) => void;

  // High-Resolution Lightbox Viewer State
  lightboxImage: LightboxImageState | null;
  openLightbox: (image: LightboxImageState) => void;
  closeLightbox: () => void;

  // Visual Mnemonic Sticker System & Cooldown State
  showStickersOnCanvas: boolean;
  stickerGallery: StickerGalleryItem[];
  cooldownSeconds: number;
  cooldownUntil: number | null;
  setCooldownSeconds: (seconds: number) => void;
  syncCooldownClock: () => void;
  toggleShowStickers: () => void;
  addStickerToGallery: (url: string, prompt: string) => void;
  deleteCustomSticker: (stickerId: string) => void;
  saveGeneratedHookAndSticker: (
    pinId: string | null,
    hook: string,
    triggerWord: string,
    stickerSvg: string
  ) => string;
  assignStickerToPin: (pinId: string, url: string) => void;
  removeStickerFromPin: (pinId: string) => void;

  // Temporal History State
  history: RoomPin[][];
  future: RoomPin[][];
  canUndo: boolean;
  canRedo: boolean;

  // Mode & Room actions
  setMode: (mode: AppMode) => void;
  setRoom: (room: Room | null) => void;

  // Modal & Selection actions
  setSelectedPin: (pin: RoomPin | null) => void;
  setPinModalOpen: (isOpen: boolean) => void;
  openCreatePinModal: (coords: PendingPinCoords) => void;
  openEditPinModal: (pin: RoomPin) => void;
  closePinModal: () => void;

  // Active Recall Modal & Progress actions
  openRecallModal: (pin: RoomPin) => void;
  closeRecallModal: () => void;
  recordRecallResult: (pinId: string, result: RecallRecordInput) => void;
  resetRecallProgress: () => void;

  // Pin CRUD actions
  addPin: (pinData: Omit<RoomPin, 'id'> & { id?: string }) => void;
  updatePin: (id: string, updates: Partial<Omit<RoomPin, 'id'>>) => void;
  movePinCoords: (id: string, x: number, y: number) => void;
  deletePin: (id: string) => void;
  updatePinScore: (id: string, score: number) => void;

  // History actions
  undo: () => void;
  redo: () => void;
}

function updateActivePalacePins(
  state: PalaceState,
  newPins: RoomPin[]
): { palaces: MemoryPalace[]; currentRoom: Room | null } {
  const activeId = state.activePalaceId || state.currentRoom?.id || '';
  const updatedPalaces = state.palaces.map((palace) =>
    palace.id === activeId ? { ...palace, pins: newPins } : palace
  );
  const activePalace =
    updatedPalaces.find((p) => p.id === activeId) ??
    (state.currentRoom ? { ...state.currentRoom, pins: newPins } : null);

  return {
    palaces: updatedPalaces,
    currentRoom: activePalace,
  };
}

export const usePalaceStore = create<PalaceState>()(
  persist(
    (set, get) => ({
      currentMode: 'BUILD',
      studyMode: 'build',
      activePinIndex: 0,
      revealedPins: {},
      examState: null,
      examHistory: [],
      activeExamSession: null,
      isExamHistoryOpen: false,
      folders: INITIAL_FOLDERS,
      palaces: [INITIAL_DEMO_PALACE],
      activePalaceId: INITIAL_DEMO_PALACE.id,
      currentRoom: INITIAL_DEMO_PALACE,
      isPalaceManagerOpen: false,
      isSavePalaceModalOpen: false,
      isMobileSidebarOpen: false,

      selectedPin: null,
      pendingCoords: null,
      isPinModalOpen: false,
      isRecallModalOpen: false,

      lightboxImage: null,
      openLightbox: (image) => set({ lightboxImage: image }),
      closeLightbox: () => set({ lightboxImage: null }),

      showStickersOnCanvas: true,
      stickerGallery: [],
      cooldownSeconds: 0,
      cooldownUntil: null,

      history: [],
      future: [],
      canUndo: false,
      canRedo: false,

      // =====================================================================
      // FOLDER & MULTI-PALACE ACTIONS
      // =====================================================================
      createFolder: (name) => {
        const cleanName = name.trim() || 'Nueva Carpeta';
        const id =
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? `folder_${crypto.randomUUID()}`
            : `folder_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

        set((state) => ({
          folders: [
            ...state.folders,
            { id, name: cleanName, createdAt: Date.now() },
          ],
        }));
        return id;
      },

      renameFolder: (id, name) =>
        set((state) => {
          const cleanName = name.trim();
          if (!cleanName) return state;
          return {
            folders: state.folders.map((f) =>
              f.id === id ? { ...f, name: cleanName } : f
            ),
          };
        }),

      deleteFolder: (id) =>
        set((state) => {
          const remainingFolders = state.folders.filter((f) => f.id !== id);
          const updatedPalaces = state.palaces.map((p) =>
            p.folderId === id ? { ...p, folderId: undefined } : p
          );
          const updatedRoom =
            state.currentRoom?.folderId === id
              ? { ...state.currentRoom, folderId: undefined }
              : state.currentRoom;

          return {
            folders: remainingFolders,
            palaces: updatedPalaces,
            currentRoom: updatedRoom,
          };
        }),

      createPalace: (name, folderId, imageSrc, aspectRatio) => {
        const cleanName = name.trim() || 'Nuevo Palacio Mental';
        const id =
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? `palace_${crypto.randomUUID()}`
            : `palace_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

        const newPalace: MemoryPalace = {
          id,
          name: cleanName,
          folderId: folderId || undefined,
          imageUrl: imageSrc || SAMPLE_STUDY_DESK_SVG,
          aspectRatio: aspectRatio && aspectRatio > 0 ? aspectRatio : 16 / 9,
          locale: 'es',
          pins: [],
          createdAt: Date.now(),
        };

        set((state) => ({
          palaces: [newPalace, ...state.palaces],
          activePalaceId: newPalace.id,
          currentRoom: newPalace,
          currentMode: 'BUILD',
          selectedPin: null,
          pendingCoords: null,
          isPinModalOpen: false,
          isRecallModalOpen: false,
          history: [],
          future: [],
          canUndo: false,
          canRedo: false,
        }));

        return id;
      },

      renamePalace: (id, name) =>
        set((state) => {
          const cleanName = name.trim();
          if (!cleanName) return state;
          const updatedPalaces = state.palaces.map((p) =>
            p.id === id ? { ...p, name: cleanName } : p
          );
          const updatedRoom =
            state.currentRoom?.id === id
              ? { ...state.currentRoom, name: cleanName }
              : state.currentRoom;

          return {
            palaces: updatedPalaces,
            currentRoom: updatedRoom,
          };
        }),

      deletePalace: (id) =>
        set((state) => {
          const remaining = state.palaces.filter((p) => p.id !== id);
          if (remaining.length === 0) {
            return {
              palaces: [],
              activePalaceId: '',
              currentRoom: null,
              selectedPin: null,
              pendingCoords: null,
              isPinModalOpen: false,
              isRecallModalOpen: false,
              activeExamSession: null,
              examState: null,
              history: [],
              future: [],
              canUndo: false,
              canRedo: false,
            };
          }

          const isDeletingActive =
            state.activePalaceId === id || state.currentRoom?.id === id;
          const nextActive = isDeletingActive
            ? remaining[0]
            : remaining.find((p) => p.id === state.activePalaceId) ??
              remaining[0];

          return {
            palaces: remaining,
            activePalaceId: nextActive.id,
            currentRoom: nextActive,
            selectedPin: isDeletingActive ? null : state.selectedPin,
            pendingCoords: isDeletingActive ? null : state.pendingCoords,
            isPinModalOpen: isDeletingActive ? false : state.isPinModalOpen,
            isRecallModalOpen: isDeletingActive
              ? false
              : state.isRecallModalOpen,
            activeExamSession: isDeletingActive
              ? null
              : state.activeExamSession,
            examState: isDeletingActive ? null : state.examState,
            history: isDeletingActive ? [] : state.history,
            future: isDeletingActive ? [] : state.future,
            canUndo: isDeletingActive ? false : state.canUndo,
            canRedo: isDeletingActive ? false : state.canRedo,
          };
        }),

      deleteProject: (id) => {
        get().deletePalace(id);
      },

      movePalaceToFolder: (palaceId, folderId) =>
        set((state) => {
          const targetFolderId = folderId || undefined;
          const updatedPalaces = state.palaces.map((p) =>
            p.id === palaceId ? { ...p, folderId: targetFolderId } : p
          );
          const updatedRoom =
            state.currentRoom?.id === palaceId
              ? { ...state.currentRoom, folderId: targetFolderId }
              : state.currentRoom;

          return {
            palaces: updatedPalaces,
            currentRoom: updatedRoom,
          };
        }),

      setActivePalace: (id) =>
        set((state) => {
          const found = state.palaces.find((p) => p.id === id);
          if (!found) return state;
          return {
            activePalaceId: found.id,
            currentRoom: found,
            selectedPin: null,
            pendingCoords: null,
            isPinModalOpen: false,
            isRecallModalOpen: false,
            history: [],
            future: [],
            canUndo: false,
            canRedo: false,
          };
        }),

      togglePalaceManager: (open) =>
        set((state) => ({
          isPalaceManagerOpen:
            typeof open === 'boolean' ? open : !state.isPalaceManagerOpen,
        })),

      toggleSavePalaceModal: (open) =>
        set((state) => ({
          isSavePalaceModalOpen:
            typeof open === 'boolean' ? open : !state.isSavePalaceModalOpen,
        })),

      toggleMobileSidebar: (open) =>
        set((state) => ({
          isMobileSidebarOpen:
            typeof open === 'boolean' ? open : !state.isMobileSidebarOpen,
        })),

      savePalaceDetails: (palaceId, name, folderId) =>
        set((state) => {
          const cleanName = name.trim();
          const targetFolderId = folderId || undefined;
          const now = Date.now();

          const existsInPalaces = state.palaces.some((p) => p.id === palaceId);
          let updatedPalaces: MemoryPalace[];

          if (existsInPalaces) {
            updatedPalaces = state.palaces.map((p) =>
              p.id === palaceId
                ? {
                    ...p,
                    name: cleanName || p.name,
                    folderId: targetFolderId,
                    updatedAt: now,
                  }
                : p
            );
          } else if (state.currentRoom && state.currentRoom.id === palaceId) {
            const newSavedPalace: MemoryPalace = {
              ...state.currentRoom,
              name: cleanName || state.currentRoom.name,
              folderId: targetFolderId,
              updatedAt: now,
            };
            updatedPalaces = [newSavedPalace, ...state.palaces];
          } else {
            updatedPalaces = state.palaces;
          }

          const updatedRoom =
            state.currentRoom?.id === palaceId
              ? {
                  ...state.currentRoom,
                  name: cleanName || state.currentRoom.name,
                  folderId: targetFolderId,
                  updatedAt: now,
                }
              : state.currentRoom;

          return {
            palaces: updatedPalaces,
            activePalaceId: palaceId,
            currentRoom: updatedRoom,
          };
        }),

      restoreWorkspaceBackup: (
        folders,
        palaces,
        activePalaceId,
        stickerGallery
      ) =>
        set((state) => {
          const validFolders =
            Array.isArray(folders) && folders.length > 0
              ? folders
              : INITIAL_FOLDERS;
          const validPalaces =
            Array.isArray(palaces) && palaces.length > 0
              ? palaces
              : [createSamplePalace('es')];
          const nextActivePalace =
            validPalaces.find((p) => p.id === activePalaceId) ??
            validPalaces[0];

          return {
            folders: validFolders,
            palaces: validPalaces,
            activePalaceId: nextActivePalace.id,
            currentRoom: nextActivePalace,
            stickerGallery: Array.isArray(stickerGallery)
              ? stickerGallery
              : state.stickerGallery,
            selectedPin: null,
            pendingCoords: null,
            isPinModalOpen: false,
            isRecallModalOpen: false,
            history: [],
            future: [],
            canUndo: false,
            canRedo: false,
          };
        }),

      // =====================================================================
      // COOLDOWN & STICKER GALLERY ACTIONS
      // =====================================================================
      setCooldownSeconds: (seconds) => {
        const cleanSeconds = Math.max(0, Math.ceil(seconds));
        set({
          cooldownSeconds: cleanSeconds,
          cooldownUntil:
            cleanSeconds > 0 ? Date.now() + cleanSeconds * 1000 : null,
        });
      },

      syncCooldownClock: () =>
        set((state) => {
          if (!state.cooldownUntil) {
            return state.cooldownSeconds !== 0 ? { cooldownSeconds: 0 } : state;
          }
          const remaining = Math.max(
            0,
            Math.ceil((state.cooldownUntil - Date.now()) / 1000)
          );
          return {
            cooldownSeconds: remaining,
            cooldownUntil: remaining > 0 ? state.cooldownUntil : null,
          };
        }),

      toggleShowStickers: () =>
        set((state) => ({
          showStickersOnCanvas: !state.showStickersOnCanvas,
        })),

      addStickerToGallery: (url, prompt) =>
        set((state) => {
          if (state.stickerGallery.some((item) => item.url === url)) {
            return state;
          }
          const newItem: StickerGalleryItem = {
            id:
              typeof crypto !== 'undefined' && crypto.randomUUID
                ? crypto.randomUUID()
                : `sticker_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            url,
            prompt,
            createdAt: new Date().toISOString(),
          };
          return {
            stickerGallery: [newItem, ...state.stickerGallery],
          };
        }),

      deleteCustomSticker: (stickerId) =>
        set((state) => {
          const targetSticker = state.stickerGallery.find(
            (item) => item.id === stickerId
          );
          const remainingGallery = state.stickerGallery.filter(
            (item) => item.id !== stickerId
          );

          if (!targetSticker) {
            return { stickerGallery: remainingGallery };
          }

          const deletedUrl = targetSticker.url;
          const updatedPalaces = state.palaces.map((palace) => ({
            ...palace,
            pins: palace.pins.map((pin) =>
              pin.imageUrl === deletedUrl
                ? { ...pin, imageUrl: undefined }
                : pin
            ),
          }));

          const updatedRoom = state.currentRoom
            ? {
                ...state.currentRoom,
                pins: state.currentRoom.pins.map((pin) =>
                  pin.imageUrl === deletedUrl
                    ? { ...pin, imageUrl: undefined }
                    : pin
                ),
              }
            : null;

          const updatedSelectedPin =
            state.selectedPin && state.selectedPin.imageUrl === deletedUrl
              ? { ...state.selectedPin, imageUrl: undefined }
              : state.selectedPin;

          return {
            stickerGallery: remainingGallery,
            palaces: updatedPalaces,
            currentRoom: updatedRoom,
            selectedPin: updatedSelectedPin,
          };
        }),

      saveGeneratedHookAndSticker: (pinId, hook, triggerWord, stickerSvg) => {
        const cleanSvg = stickerSvg.trim();
        const stickerDataUri = cleanSvg.startsWith('data:image/')
          ? cleanSvg
          : `data:image/svg+xml;utf8,${encodeURIComponent(cleanSvg)}`;

        const promptLabel = triggerWord
          ? `${triggerWord} — ${hook}`
          : hook;

        set((state) => {
          const alreadyInGallery = state.stickerGallery.some(
            (item) => item.url === stickerDataUri
          );
          const nextGallery = alreadyInGallery
            ? state.stickerGallery
            : [
                {
                  id:
                    typeof crypto !== 'undefined' && crypto.randomUUID
                      ? crypto.randomUUID()
                      : `sticker_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                  url: stickerDataUri,
                  prompt: promptLabel,
                  createdAt: new Date().toISOString(),
                },
                ...state.stickerGallery,
              ];

          if (!pinId) {
            return {
              stickerGallery: nextGallery,
            };
          }

          const activePalace =
            state.palaces.find((p) => p.id === state.activePalaceId) ??
            state.currentRoom;
          if (!activePalace) {
            return { stickerGallery: nextGallery };
          }

          const updatedPins = activePalace.pins.map((pin) =>
            pin.id === pinId
              ? {
                  ...pin,
                  hook,
                  triggerWord,
                  mnemonicVisual: hook,
                  customSticker: stickerDataUri,
                  imageUrl: stickerDataUri,
                }
              : pin
          );

          return {
            ...updateActivePalacePins(state, updatedPins),
            stickerGallery: nextGallery,
            selectedPin:
              state.selectedPin?.id === pinId
                ? {
                    ...state.selectedPin,
                    hook,
                    triggerWord,
                    mnemonicVisual: hook,
                    customSticker: stickerDataUri,
                    imageUrl: stickerDataUri,
                  }
                : state.selectedPin,
          };
        });

        return stickerDataUri;
      },

      assignStickerToPin: (pinId, url) =>
        set((state) => {
          const activePalace =
            state.palaces.find((p) => p.id === state.activePalaceId) ??
            state.currentRoom;
          if (!activePalace) return state;

          const previousPins = activePalace.pins.map((p) => ({ ...p }));
          const newHistory = [...state.history, previousPins].slice(
            -MAX_HISTORY_ENTRIES
          );

          const updatedPins = activePalace.pins.map((pin) =>
            pin.id === pinId ? { ...pin, imageUrl: url } : pin
          );

          return {
            ...updateActivePalacePins(state, updatedPins),
            history: newHistory,
            future: [],
            canUndo: newHistory.length > 0,
            canRedo: false,
            selectedPin:
              state.selectedPin?.id === pinId
                ? { ...state.selectedPin, imageUrl: url }
                : state.selectedPin,
          };
        }),

      removeStickerFromPin: (pinId) =>
        set((state) => {
          const activePalace =
            state.palaces.find((p) => p.id === state.activePalaceId) ??
            state.currentRoom;
          if (!activePalace) return state;

          const previousPins = activePalace.pins.map((p) => ({ ...p }));
          const newHistory = [...state.history, previousPins].slice(
            -MAX_HISTORY_ENTRIES
          );

          const updatedPins = activePalace.pins.map((pin) =>
            pin.id === pinId ? { ...pin, imageUrl: undefined } : pin
          );

          return {
            ...updateActivePalacePins(state, updatedPins),
            history: newHistory,
            future: [],
            canUndo: newHistory.length > 0,
            canRedo: false,
            selectedPin:
              state.selectedPin?.id === pinId
                ? { ...state.selectedPin, imageUrl: undefined }
                : state.selectedPin,
          };
        }),

      // =====================================================================
      // MODE, ROOM & PIN CRUD ACTIONS (DIRECTED TO ACTIVE PALACE)
      // =====================================================================
      setStudyMode: (studyMode) => {
        if (studyMode === 'exam') {
          const state = get();
          const targetId = state.activePalaceId || state.currentRoom?.id;
          get().startExamSession(targetId);
          return;
        }

        const modeToAppMode: Record<StudyMode, AppMode> = {
          build: 'BUILD',
          study: 'STUDY',
          memory: 'RECALL',
          exam: 'EXAM',
        };

        set({
          studyMode,
          currentMode: modeToAppMode[studyMode],
          activePinIndex: 0,
          revealedPins: {},
          examState: null,
          activeExamSession: null,
          selectedPin: null,
          pendingCoords: null,
          isPinModalOpen: false,
          isRecallModalOpen: false,
        });
      },

      setActivePinIndex: (index) =>
        set((state) => {
          const activePalace =
            state.palaces.find((p) => p.id === state.activePalaceId) ??
            state.currentRoom;
          const total = activePalace?.pins.length ?? 0;
          if (total === 0) return { activePinIndex: 0 };
          const clamped = ((index % total) + total) % total;
          return { activePinIndex: clamped };
        }),

      nextStudyPin: () =>
        set((state) => {
          const activePalace =
            state.palaces.find((p) => p.id === state.activePalaceId) ??
            state.currentRoom;
          const total = activePalace?.pins.length ?? 0;
          if (total === 0) return { activePinIndex: 0 };
          return { activePinIndex: (state.activePinIndex + 1) % total };
        }),

      prevStudyPin: () =>
        set((state) => {
          const activePalace =
            state.palaces.find((p) => p.id === state.activePalaceId) ??
            state.currentRoom;
          const total = activePalace?.pins.length ?? 0;
          if (total === 0) return { activePinIndex: 0 };
          return {
            activePinIndex: (state.activePinIndex - 1 + total) % total,
          };
        }),

      togglePinRevealed: (pinId, revealed) =>
        set((state) => ({
          revealedPins: {
            ...state.revealedPins,
            [pinId]:
              typeof revealed === 'boolean'
                ? revealed
                : !state.revealedPins[pinId],
          },
        })),

      setAllPinsRevealed: (revealed) =>
        set((state) => {
          const activePalace =
            state.palaces.find((p) => p.id === state.activePalaceId) ??
            state.currentRoom;
          const pins = activePalace?.pins ?? [];
          const nextMap: Record<string, boolean> = {};
          pins.forEach((p) => {
            nextMap[p.id] = revealed;
          });
          return { revealedPins: nextMap };
        }),

      startExamSession: (palaceId) =>
        set((state) => {
          const targetId =
            palaceId || state.activePalaceId || state.currentRoom?.id || '';
          const palace =
            state.palaces.find((p) => p.id === targetId) ?? state.currentRoom;

          if (!palace) return state;

          const previousAttempts = state.examHistory.filter(
            (a) => a.palaceId === palace.id
          );
          const attemptNumber = previousAttempts.length + 1;
          const firstPin = palace.pins[0];

          const initialPinRecord: Partial<PinExamRecord> = firstPin
            ? {
                pinId: firstPin.id,
                conceptTitle: firstPin.concept,
                anchorName: firstPin.title,
                originalNotes: firstPin.detailedNotes || firstPin.concept,
                phase1Passed: false,
                phase1Score: 0,
                phase2Questions: [],
                phase2Score: 0,
                phase3Prompt: '',
                userExplanation: '',
                aiFeedback: '',
                phase3Score: 0,
                totalPinScore: 0,
              }
            : {};

          return {
            activePalaceId: palace.id,
            currentRoom: palace,
            studyMode: 'exam',
            currentMode: 'EXAM',
            activePinIndex: 0,
            examState: {
              currentQuestionIndex: 0,
              correctAnswers: 0,
              isFinished: palace.pins.length === 0,
              targetPinId: firstPin?.id ?? null,
            },
            activeExamSession: {
              palaceId: palace.id,
              palaceName: palace.name,
              attemptNumber,
              activePinIndex: 0,
              currentPhase: palace.pins.length === 0 ? 'SUMMARY' : 'PHASE_1',
              currentPinRecord: initialPinRecord,
              records: [],
              isEvaluating: false,
              isLoadingQuestions: false,
            },
            selectedPin: null,
            isPinModalOpen: false,
            isRecallModalOpen: false,
          };
        }),

      setGeneratedPinExamData: (pinId, phase2Questions, phase3Prompt) =>
        set((state) => {
          if (!state.activeExamSession) return state;
          if (state.activeExamSession.currentPinRecord.pinId !== pinId) {
            return state;
          }
          return {
            activeExamSession: {
              ...state.activeExamSession,
              isLoadingQuestions: false,
              currentPinRecord: {
                ...state.activeExamSession.currentPinRecord,
                phase2Questions,
                phase3Prompt,
              },
            },
          };
        }),

      setExamLoadingQuestions: (loading) =>
        set((state) => {
          if (!state.activeExamSession) return state;
          return {
            activeExamSession: {
              ...state.activeExamSession,
              isLoadingQuestions: loading,
            },
          };
        }),

      setExamEvaluating: (evaluating) =>
        set((state) => {
          if (!state.activeExamSession) return state;
          return {
            activeExamSession: {
              ...state.activeExamSession,
              isEvaluating: evaluating,
            },
          };
        }),

      recordPhase1: (pinId, passed) =>
        set((state) => {
          if (!state.activeExamSession) return state;
          const phase1Score = passed ? 10 : 0;
          const current = state.activeExamSession.currentPinRecord;
          const totalPinScore =
            phase1Score + (current.phase2Score ?? 0) + (current.phase3Score ?? 0);

          return {
            activeExamSession: {
              ...state.activeExamSession,
              currentPhase: 'PHASE_2',
              currentPinRecord: {
                ...current,
                pinId,
                phase1Passed: passed,
                phase1Score,
                totalPinScore,
              },
            },
          };
        }),

      recordPhase2Answer: (pinId, questionId, selectedIndex) =>
        set((state) => {
          if (!state.activeExamSession) return state;
          const current = state.activeExamSession.currentPinRecord;
          if (current.pinId && current.pinId !== pinId) return state;

          const questions = (current.phase2Questions ?? []).map((q) => {
            if (q.id !== questionId) return q;
            const isCorrect = selectedIndex === q.correctOptionIndex;
            return {
              ...q,
              userSelectedIndex: selectedIndex,
              isCorrect,
            };
          });

          const total = questions.length;
          const correctCount = questions.filter((q) => q.isCorrect).length;
          const phase2Score =
            total > 0 ? Math.round(((correctCount / total) * 40) * 10) / 10 : 0;
          const totalPinScore =
            (current.phase1Score ?? 0) +
            phase2Score +
            (current.phase3Score ?? 0);

          return {
            activeExamSession: {
              ...state.activeExamSession,
              currentPinRecord: {
                ...current,
                phase2Questions: questions,
                phase2Score,
                totalPinScore,
              },
            },
          };
        }),

      advanceToPhase3: () =>
        set((state) => {
          if (!state.activeExamSession) return state;
          return {
            activeExamSession: {
              ...state.activeExamSession,
              currentPhase: 'PHASE_3',
            },
          };
        }),

      submitPhase3: (pinId, explanation, aiScore, feedback) =>
        set((state) => {
          if (!state.activeExamSession) return state;
          const current = state.activeExamSession.currentPinRecord;
          const phase3Score =
            Math.round(((Math.max(0, Math.min(100, aiScore)) / 100) * 50) * 10) /
            10;
          const phase1Score = current.phase1Score ?? 0;
          const phase2Score = current.phase2Score ?? 0;
          const totalPinScore = Math.round(
            phase1Score + phase2Score + phase3Score
          );

          const completedRecord: PinExamRecord = {
            pinId,
            conceptTitle: current.conceptTitle ?? '',
            anchorName: current.anchorName ?? '',
            originalNotes: current.originalNotes ?? '',
            phase1Passed: Boolean(current.phase1Passed),
            phase1Score,
            phase2Questions: current.phase2Questions ?? [],
            phase2Score,
            phase3Prompt: current.phase3Prompt ?? '',
            userExplanation: explanation,
            aiFeedback: feedback,
            phase3Score,
            totalPinScore,
          };

          const existingIdx = state.activeExamSession.records.findIndex(
            (r) => r.pinId === pinId
          );
          const updatedRecords =
            existingIdx >= 0
              ? state.activeExamSession.records.map((r, i) =>
                  i === existingIdx ? completedRecord : r
                )
              : [...state.activeExamSession.records, completedRecord];

          // Also update individual pin traffic-light status in the palace
          const activePalace =
            state.palaces.find((p) => p.id === state.activePalaceId) ??
            state.currentRoom;
          const nowIso = new Date().toISOString();
          const pinStatus: PinRecallStatus =
            totalPinScore >= 80
              ? 'MASTERED'
              : totalPinScore >= 50
              ? 'NEEDS_REVIEW'
              : 'FAILED';

          const updatedPins = (activePalace?.pins ?? []).map((p) =>
            p.id === pinId
              ? {
                  ...p,
                  score: totalPinScore,
                  lastScore: totalPinScore,
                  status: pinStatus,
                  lastTestedAt: nowIso,
                }
              : p
          );

          return {
            ...updateActivePalacePins(state, updatedPins),
            activeExamSession: {
              ...state.activeExamSession,
              isEvaluating: false,
              currentPinRecord: completedRecord,
              records: updatedRecords,
            },
          };
        }),

      advanceExamToNextPin: () => {
        const state = get();
        const session = state.activeExamSession;
        const activePalace =
          state.palaces.find((p) => p.id === state.activePalaceId) ??
          state.currentRoom;
        if (!session || !activePalace) return;

        const nextIdx = session.activePinIndex + 1;
        if (nextIdx >= activePalace.pins.length) {
          get().finalizeExamAttempt();
          return;
        }

        const nextPin = activePalace.pins[nextIdx];
        set({
          activePinIndex: nextIdx,
          examState: {
            currentQuestionIndex: nextIdx,
            correctAnswers: session.records.filter((r) => r.totalPinScore >= 70)
              .length,
            isFinished: false,
            targetPinId: nextPin.id,
          },
          activeExamSession: {
            ...session,
            activePinIndex: nextIdx,
            currentPhase: 'PHASE_1',
            isEvaluating: false,
            isLoadingQuestions: false,
            currentPinRecord: {
              pinId: nextPin.id,
              conceptTitle: nextPin.concept,
              anchorName: nextPin.title,
              originalNotes: nextPin.detailedNotes || nextPin.concept,
              phase1Passed: false,
              phase1Score: 0,
              phase2Questions: [],
              phase2Score: 0,
              phase3Prompt: '',
              userExplanation: '',
              aiFeedback: '',
              phase3Score: 0,
              totalPinScore: 0,
            },
          },
        });
      },

      finalizeExamAttempt: () => {
        const state = get();
        const session = state.activeExamSession;
        const activePalace =
          state.palaces.find((p) => p.id === state.activePalaceId) ??
          state.currentRoom;
        if (!session || !activePalace) return null;

        const records = session.records;
        const pinsCount = Math.max(1, activePalace.pins.length);
        const sumScores = records.reduce(
          (acc, rec) => acc + (rec.totalPinScore || 0),
          0
        );
        const finalScore = Math.round(sumScores / pinsCount);

        const attempt: ExamAttempt = {
          id:
            typeof crypto !== 'undefined' && crypto.randomUUID
              ? `exam_${crypto.randomUUID()}`
              : `exam_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          palaceId: activePalace.id,
          palaceName: activePalace.name,
          timestamp: new Date().toISOString(),
          finalScore,
          pinsEvaluated: records,
        };

        const updatedPalaces = state.palaces.map((p) =>
          p.id === activePalace.id
            ? { ...p, retentionRate: finalScore, updatedAt: Date.now() }
            : p
        );
        const updatedRoom =
          state.currentRoom?.id === activePalace.id
            ? {
                ...state.currentRoom,
                retentionRate: finalScore,
                updatedAt: Date.now(),
              }
            : state.currentRoom;

        set({
          palaces: updatedPalaces,
          currentRoom: updatedRoom,
          examHistory: [attempt, ...state.examHistory],
          examState: {
            currentQuestionIndex: activePalace.pins.length,
            correctAnswers: records.filter((r) => r.totalPinScore >= 70).length,
            isFinished: true,
            targetPinId: null,
          },
          activeExamSession: {
            ...session,
            currentPhase: 'SUMMARY',
            isEvaluating: false,
          },
        });

        return attempt;
      },

      toggleExamHistoryDrawer: (open) =>
        set((state) => ({
          isExamHistoryOpen:
            typeof open === 'boolean' ? open : !state.isExamHistoryOpen,
        })),

      answerExamPin: (clickedPinId) => {
        const state = get();
        const activePalace =
          state.palaces.find((p) => p.id === state.activePalaceId) ??
          state.currentRoom;
        const pins = activePalace?.pins ?? [];

        if (!state.examState || state.examState.isFinished || pins.length === 0) {
          return { isCorrect: false, isFinished: true };
        }

        const { currentQuestionIndex, correctAnswers, targetPinId } =
          state.examState;
        const isCorrect = clickedPinId === targetPinId;
        const nextCorrectAnswers = isCorrect
          ? correctAnswers + 1
          : correctAnswers;
        const nextIndex = currentQuestionIndex + 1;
        const isFinished = nextIndex >= pins.length;
        const nextTargetPinId = isFinished ? null : pins[nextIndex]?.id ?? null;

        const nowIso = new Date().toISOString();
        const updatedPins = pins.map((pin) => {
          if (pin.id !== targetPinId) return pin;
          return {
            ...pin,
            score: isCorrect ? 100 : 25,
            lastScore: isCorrect ? 100 : 25,
            status: (isCorrect ? 'MASTERED' : 'FAILED') as PinRecallStatus,
            lastTestedAt: nowIso,
          };
        });

        const retentionRate = isFinished
          ? Math.round((nextCorrectAnswers / pins.length) * 100)
          : activePalace?.retentionRate;

        const activeId = state.activePalaceId || state.currentRoom?.id || '';
        const updatedPalaces = state.palaces.map((p) =>
          p.id === activeId
            ? {
                ...p,
                pins: updatedPins,
                retentionRate:
                  typeof retentionRate === 'number'
                    ? retentionRate
                    : p.retentionRate,
              }
            : p
        );
        const updatedRoom =
          updatedPalaces.find((p) => p.id === activeId) ??
          (state.currentRoom
            ? {
                ...state.currentRoom,
                pins: updatedPins,
                retentionRate:
                  typeof retentionRate === 'number'
                    ? retentionRate
                    : state.currentRoom.retentionRate,
              }
            : null);

        set({
          palaces: updatedPalaces,
          currentRoom: updatedRoom,
          examState: {
            currentQuestionIndex: nextIndex,
            correctAnswers: nextCorrectAnswers,
            isFinished,
            targetPinId: nextTargetPinId,
          },
        });

        return { isCorrect, isFinished };
      },

      updatePalaceRetentionRate: (rate) =>
        set((state) => {
          const clamped = Math.max(0, Math.min(100, Math.round(rate)));
          const activeId = state.activePalaceId || state.currentRoom?.id || '';
          const updatedPalaces = state.palaces.map((p) =>
            p.id === activeId ? { ...p, retentionRate: clamped } : p
          );
          const updatedRoom =
            state.currentRoom?.id === activeId
              ? { ...state.currentRoom, retentionRate: clamped }
              : state.currentRoom;

          return {
            palaces: updatedPalaces,
            currentRoom: updatedRoom,
          };
        }),

      setMode: (mode) => {
        const appModeToStudy: Record<AppMode, StudyMode> = {
          BUILD: 'build',
          STUDY: 'study',
          RECALL: 'memory',
          EXAM: 'exam',
        };
        get().setStudyMode(appModeToStudy[mode]);
      },

      setRoom: (room) =>
        set((state) => {
          if (!room) {
            return {
              currentRoom: null,
              selectedPin: null,
              pendingCoords: null,
              isPinModalOpen: false,
              isRecallModalOpen: false,
              history: [],
              future: [],
              canUndo: false,
              canRedo: false,
            };
          }

          const sanitizedRoom: MemoryPalace = {
            ...room,
            folderId:
              room.folderId ??
              state.palaces.find((p) => p.id === room.id)?.folderId ??
              state.folders[0]?.id,
            pins: room.pins.map((pin) => ({
              ...pin,
              status: pin.lastTestedAt ? pin.status ?? 'UNTESTED' : 'UNTESTED',
              score: pin.lastTestedAt ? pin.score : undefined,
              lastScore: pin.lastTestedAt ? pin.lastScore : undefined,
              lastTestedAt: pin.lastTestedAt ?? undefined,
            })),
          };

          const exists = state.palaces.some((p) => p.id === sanitizedRoom.id);
          const updatedPalaces = exists
            ? state.palaces.map((p) =>
                p.id === sanitizedRoom.id ? sanitizedRoom : p
              )
            : [sanitizedRoom, ...state.palaces];

          return {
            palaces: updatedPalaces,
            activePalaceId: sanitizedRoom.id,
            currentRoom: sanitizedRoom,
            selectedPin: null,
            pendingCoords: null,
            isPinModalOpen: false,
            isRecallModalOpen: false,
            history: [],
            future: [],
            canUndo: false,
            canRedo: false,
          };
        }),

      setSelectedPin: (pin) => set({ selectedPin: pin }),

      setPinModalOpen: (isOpen) =>
        set((state) => ({
          isPinModalOpen: isOpen,
          selectedPin: isOpen ? state.selectedPin : null,
          pendingCoords: isOpen ? state.pendingCoords : null,
        })),

      openCreatePinModal: (coords) =>
        set({
          selectedPin: null,
          pendingCoords: coords,
          isPinModalOpen: true,
          isRecallModalOpen: false,
        }),

      openEditPinModal: (pin) =>
        set({
          selectedPin: pin,
          pendingCoords: null,
          isPinModalOpen: true,
          isRecallModalOpen: false,
        }),

      closePinModal: () =>
        set({
          selectedPin: null,
          pendingCoords: null,
          isPinModalOpen: false,
        }),

      openRecallModal: (pin) =>
        set({
          selectedPin: pin,
          pendingCoords: null,
          isPinModalOpen: false,
          isRecallModalOpen: true,
        }),

      closeRecallModal: () =>
        set({
          selectedPin: null,
          isRecallModalOpen: false,
        }),

      recordRecallResult: (pinId, result) =>
        set((state) => {
          const activePalace =
            state.palaces.find((p) => p.id === state.activePalaceId) ??
            state.currentRoom;
          if (!activePalace) return state;

          const nowIso = new Date().toISOString();
          const updatedPins = activePalace.pins.map((pin) =>
            pin.id === pinId
              ? {
                  ...pin,
                  score: result.score,
                  lastScore: result.score,
                  status: result.status as PinRecallStatus,
                  lastTestedAt: nowIso,
                }
              : pin
          );
          const updatedSelected =
            state.selectedPin?.id === pinId
              ? {
                  ...state.selectedPin,
                  score: result.score,
                  lastScore: result.score,
                  status: result.status as PinRecallStatus,
                  lastTestedAt: nowIso,
                }
              : state.selectedPin;

          return {
            ...updateActivePalacePins(state, updatedPins),
            selectedPin: updatedSelected,
          };
        }),

      resetRecallProgress: () =>
        set((state) => {
          const activePalace =
            state.palaces.find((p) => p.id === state.activePalaceId) ??
            state.currentRoom;
          if (!activePalace) return state;

          const resetPins = activePalace.pins.map((pin) => ({
            ...pin,
            status: 'UNTESTED' as const,
            score: undefined,
            lastScore: undefined,
            lastTestedAt: undefined,
          }));

          return {
            ...updateActivePalacePins(state, resetPins),
            selectedPin: null,
            isRecallModalOpen: false,
          };
        }),

      addPin: (pinData) =>
        set((state) => {
          const activePalace =
            state.palaces.find((p) => p.id === state.activePalaceId) ??
            state.currentRoom;
          if (!activePalace) return state;

          const previousPins = activePalace.pins.map((p) => ({ ...p }));
          const newHistory = [...state.history, previousPins].slice(
            -MAX_HISTORY_ENTRIES
          );

          const newPin: RoomPin = {
            ...pinData,
            status: 'UNTESTED',
            score: undefined,
            lastScore: undefined,
            lastTestedAt: undefined,
            id:
              pinData.id ??
              (typeof crypto !== 'undefined' && crypto.randomUUID
                ? crypto.randomUUID()
                : `pin_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`),
          };

          const updatedPins = [...activePalace.pins, newPin];

          return {
            ...updateActivePalacePins(state, updatedPins),
            history: newHistory,
            future: [],
            canUndo: newHistory.length > 0,
            canRedo: false,
            selectedPin: null,
            pendingCoords: null,
            isPinModalOpen: false,
          };
        }),

      updatePin: (id, updates) =>
        set((state) => {
          const activePalace =
            state.palaces.find((p) => p.id === state.activePalaceId) ??
            state.currentRoom;
          if (!activePalace) return state;

          const previousPins = activePalace.pins.map((p) => ({ ...p }));
          const newHistory = [...state.history, previousPins].slice(
            -MAX_HISTORY_ENTRIES
          );

          const updatedPins = activePalace.pins.map((pin) =>
            pin.id === id ? { ...pin, ...updates } : pin
          );

          return {
            ...updateActivePalacePins(state, updatedPins),
            history: newHistory,
            future: [],
            canUndo: newHistory.length > 0,
            canRedo: false,
            selectedPin:
              state.selectedPin?.id === id
                ? { ...state.selectedPin, ...updates }
                : state.selectedPin,
            isPinModalOpen: false,
            pendingCoords: null,
          };
        }),

      movePinCoords: (id, x, y) =>
        set((state) => {
          const activePalace =
            state.palaces.find((p) => p.id === state.activePalaceId) ??
            state.currentRoom;
          if (!activePalace) return state;

          const clampedX = Math.max(0, Math.min(100, Number(x.toFixed(2))));
          const clampedY = Math.max(0, Math.min(100, Number(y.toFixed(2))));

          const updatedPins = activePalace.pins.map((pin) =>
            pin.id === id ? { ...pin, x: clampedX, y: clampedY } : pin
          );

          return {
            ...updateActivePalacePins(state, updatedPins),
            selectedPin:
              state.selectedPin?.id === id
                ? { ...state.selectedPin, x: clampedX, y: clampedY }
                : state.selectedPin,
          };
        }),

      deletePin: (id) =>
        set((state) => {
          const activePalace =
            state.palaces.find((p) => p.id === state.activePalaceId) ??
            state.currentRoom;
          if (!activePalace) return state;

          const previousPins = activePalace.pins.map((p) => ({ ...p }));
          const newHistory = [...state.history, previousPins].slice(
            -MAX_HISTORY_ENTRIES
          );

          const updatedPins = activePalace.pins.filter((pin) => pin.id !== id);

          return {
            ...updateActivePalacePins(state, updatedPins),
            history: newHistory,
            future: [],
            canUndo: newHistory.length > 0,
            canRedo: false,
            selectedPin: state.selectedPin?.id === id ? null : state.selectedPin,
            pendingCoords: null,
            isPinModalOpen: false,
            isRecallModalOpen: false,
          };
        }),

      updatePinScore: (id, score) =>
        set((state) => {
          const activePalace =
            state.palaces.find((p) => p.id === state.activePalaceId) ??
            state.currentRoom;
          if (!activePalace) return state;

          const status: PinRecallStatus =
            score >= 80 ? 'MASTERED' : score >= 50 ? 'NEEDS_REVIEW' : 'FAILED';

          const updatedPins = activePalace.pins.map((pin) =>
            pin.id === id
              ? {
                  ...pin,
                  score,
                  lastScore: score,
                  status,
                  lastTestedAt: new Date().toISOString(),
                }
              : pin
          );

          return updateActivePalacePins(state, updatedPins);
        }),

      undo: () =>
        set((state) => {
          const activePalace =
            state.palaces.find((p) => p.id === state.activePalaceId) ??
            state.currentRoom;
          if (!activePalace || state.history.length === 0) return state;

          const currentPins = activePalace.pins.map((p) => ({ ...p }));
          const previousPins = state.history[state.history.length - 1];
          const newHistory = state.history.slice(0, -1);
          const newFuture = [...state.future, currentPins].slice(
            -MAX_HISTORY_ENTRIES
          );

          return {
            ...updateActivePalacePins(state, previousPins),
            history: newHistory,
            future: newFuture,
            canUndo: newHistory.length > 0,
            canRedo: newFuture.length > 0,
            selectedPin: null,
            pendingCoords: null,
            isPinModalOpen: false,
            isRecallModalOpen: false,
          };
        }),

      redo: () =>
        set((state) => {
          const activePalace =
            state.palaces.find((p) => p.id === state.activePalaceId) ??
            state.currentRoom;
          if (!activePalace || state.future.length === 0) return state;

          const currentPins = activePalace.pins.map((p) => ({ ...p }));
          const nextPins = state.future[state.future.length - 1];
          const newFuture = state.future.slice(0, -1);
          const newHistory = [...state.history, currentPins].slice(
            -MAX_HISTORY_ENTRIES
          );

          return {
            ...updateActivePalacePins(state, nextPins),
            history: newHistory,
            future: newFuture,
            canUndo: newHistory.length > 0,
            canRedo: newFuture.length > 0,
            selectedPin: null,
            pendingCoords: null,
            isPinModalOpen: false,
            isRecallModalOpen: false,
          };
        }),
    }),
    {
      name: 'locipalace_storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentMode: state.currentMode,
        studyMode: state.studyMode,
        examHistory: state.examHistory,
        folders: state.folders,
        palaces: state.palaces,
        activePalaceId: state.activePalaceId,
        currentRoom: state.currentRoom,
        showStickersOnCanvas: state.showStickersOnCanvas,
        stickerGallery: state.stickerGallery,
        cooldownUntil: state.cooldownUntil,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.syncCooldownClock();

        // Scrub any legacy hardcoded English dummy hooks persisted in older localStorage snapshots
        const legacyDummySnippets = [
          'Three giant baseball CAPs',
          'tiny glowing mitochondria pedaling',
          'vibrates at relativistic speed',
        ];
        if (Array.isArray(state.palaces)) {
          state.palaces.forEach((palace) => {
            palace.pins?.forEach((pin) => {
              if (
                pin.mnemonicVisual &&
                legacyDummySnippets.some((s) => pin.mnemonicVisual?.includes(s))
              ) {
                pin.mnemonicVisual = undefined;
              }
              if (
                pin.hook &&
                legacyDummySnippets.some((s) => pin.hook?.includes(s))
              ) {
                pin.hook = undefined;
              }
            });
          });
        }
        if (state.currentRoom?.pins) {
          state.currentRoom.pins.forEach((pin) => {
            if (
              pin.mnemonicVisual &&
              legacyDummySnippets.some((s) => pin.mnemonicVisual?.includes(s))
            ) {
              pin.mnemonicVisual = undefined;
            }
            if (
              pin.hook &&
              legacyDummySnippets.some((s) => pin.hook?.includes(s))
            ) {
              pin.hook = undefined;
            }
          });
        }

        // Ensure folders & palaces are seeded only if migrating from an older localStorage snapshot
        if (!Array.isArray(state.folders)) {
          state.createFolder('Oposiciones & Estudio General');
        }

        if (!Array.isArray(state.palaces)) {
          const seedPalace = state.currentRoom
            ? {
                ...state.currentRoom,
                folderId: state.currentRoom.folderId ?? DEFAULT_FOLDER_ID,
              }
            : createSamplePalace('es');
          state.setRoom(seedPalace);
        } else if (state.palaces.length > 0) {
          const active =
            state.palaces.find((p) => p.id === state.activePalaceId) ??
            state.palaces[0];
          if (active && (!state.currentRoom || state.currentRoom.id !== active.id)) {
            state.setActivePalace(active.id);
          }
        } else {
          // User explicitly deleted all palaces: keep clean empty state
          state.setRoom(null);
        }
      },
    }
  )
);
