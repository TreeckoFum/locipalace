'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  Eye,
  EyeOff,
  Maximize2,
  Upload,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Trophy,
  BookOpen,
  History,
  Plus,
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { usePalaceStore, SAMPLE_STUDY_DESK_SVG } from '@/store/usePalaceStore';
import { getTranslations } from '@/lib/translations';
import { compressImageWithMeta } from '@/lib/imageCompression';
import { ExamRunnerModal } from '@/components/exam/ExamRunnerModal';
import type { Locale, PinRecallStatus, Room, RoomPin } from '@/types/palace';

function createDemoStudyDesk(locale: Locale): Room {
  return {
    id: 'sample_study_desk',
    name: 'Despacho de Estudio (Demo)',
    folderId: 'folder_oposiciones_general',
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

export function PalaceCanvas() {
  const locale = useLocale() as Locale;
  const t = getTranslations(locale);

  const {
    currentRoom,
    studyMode,
    activePinIndex,
    revealedPins,
    examState,
    activeExamSession,
    folders,
    selectedPin,
    pendingCoords,
    showStickersOnCanvas,
    toggleShowStickers,
    openCreatePinModal,
    openEditPinModal,
    openLightbox,
    setRoom,
    createPalace,
    setStudyMode,
    setActivePinIndex,
    nextStudyPin,
    prevStudyPin,
    togglePinRevealed,
    setAllPinsRevealed,
    startExamSession,
    recordPhase1,
    toggleExamHistoryDrawer,
    togglePalaceManager,
    answerExamPin,
    movePinCoords,
    resetRecallProgress,
  } = usePalaceStore();

  const [hoveredPinId, setHoveredPinId] = useState<string | null>(null);
  const [activeMemoryPinId, setActiveMemoryPinId] = useState<string | null>(
    null
  );
  const [draggingPinId, setDraggingPinId] = useState<string | null>(null);
  const didDragRef = useRef(false);

  // Instant visual feedback state for Exam Mode Phase 1 clicks
  const [examFeedback, setExamFeedback] = useState<{
    clickedPinId: string;
    targetPinId: string;
    isCorrect: boolean;
  } | null>(null);

  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Keyboard navigation in 'study' mode (`ArrowRight`, `ArrowLeft`)
  useEffect(() => {
    if (studyMode !== 'study') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextStudyPin();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevStudyPin();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [studyMode, nextStudyPin, prevStudyPin]);

  // Reset active memory card when switching modes
  useEffect(() => {
    setActiveMemoryPinId(null);
    setExamFeedback(null);
  }, [studyMode, currentRoom?.id]);

  // Pin dragging in 'build' mode
  useEffect(() => {
    if (!draggingPinId || studyMode !== 'build') return;

    const handlePointerMove = (e: PointerEvent) => {
      const container = canvasContainerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      didDragRef.current = true;
      const rawX = ((e.clientX - rect.left) / rect.width) * 100;
      const rawY = ((e.clientY - rect.top) / rect.height) * 100;
      movePinCoords(draggingPinId, rawX, rawY);
    };

    const handlePointerUp = () => {
      setDraggingPinId(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [draggingPinId, studyMode, movePinCoords]);

  const handleLoadSample = () => {
    const demo = createDemoStudyDesk(locale);
    setRoom(demo);
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    try {
      const { dataUrl, aspectRatio } = await compressImageWithMeta(
        file,
        1920,
        0.75
      );
      const cleanName = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]/g, ' ');
      const targetFolderId =
        currentRoom?.folderId || folders[0]?.id || 'folder_oposiciones_general';

      createPalace(cleanName, targetFolderId, dataUrl, aspectRatio);
      setStudyMode('build');
    } catch {
      const objectUrl = URL.createObjectURL(file);
      const cleanName = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]/g, ' ');
      const targetFolderId =
        currentRoom?.folderId || folders[0]?.id || 'folder_oposiciones_general';
      createPalace(cleanName, targetFolderId, objectUrl, 16 / 9);
      setStudyMode('build');
    }
  };

  if (!currentRoom) {
    return (
      <div
        style={{ touchAction: 'manipulation' }}
        className="flex-1 h-full w-full relative overflow-hidden bg-slate-950 flex items-center justify-center p-4 touch-manipulation"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleUploadPhoto}
          className="hidden"
        />
        <div className="w-full max-w-md rounded-2xl border border-dashed border-slate-800 bg-slate-900/60 p-6 sm:p-8 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-500/15 text-indigo-400">
            <Plus className="h-6 w-6" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base font-extrabold text-white">
              {t.app.manager.newPalaceBtn}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              {t.app.canvas.clickToPlacePin}
            </p>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => togglePalaceManager(true)}
              className="w-full md:w-auto cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-lg hover:from-indigo-400 hover:to-cyan-400 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{t.app.manager.newPalaceBtn}</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full md:w-auto cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-500/15 px-4 py-2.5 text-xs font-bold text-indigo-200 hover:bg-indigo-500/25 transition"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>{t.app.canvas.uploadPhoto}</span>
            </button>
            <button
              type="button"
              onClick={handleLoadSample}
              className="w-full md:w-auto cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
            >
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span>{t.app.canvas.loadSample}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (studyMode !== 'build') {
      if (studyMode === 'memory') {
        setActiveMemoryPinId(null);
      }
      return;
    }

    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const rawX = ((e.clientX - rect.left) / rect.width) * 100;
    const rawY = ((e.clientY - rect.top) / rect.height) * 100;

    const x = Math.max(0, Math.min(100, Number(rawX.toFixed(2))));
    const y = Math.max(0, Math.min(100, Number(rawY.toFixed(2))));

    openCreatePinModal({ x, y });
  };

  const handlePinPointerDown = (e: React.PointerEvent, pin: RoomPin) => {
    if (studyMode !== 'build') return;
    e.stopPropagation();
    didDragRef.current = false;
    setDraggingPinId(pin.id);
  };

  const handlePinClick = (e: React.MouseEvent, pin: RoomPin, index: number) => {
    e.stopPropagation();

    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }

    if (studyMode === 'build') {
      openEditPinModal(pin);
    } else if (studyMode === 'study') {
      setActivePinIndex(index);
    } else if (studyMode === 'memory') {
      setActiveMemoryPinId(pin.id);
      togglePinRevealed(pin.id);
    } else if (studyMode === 'exam') {
      if (
        !activeExamSession ||
        activeExamSession.currentPhase !== 'PHASE_1' ||
        examFeedback
      ) {
        return;
      }
      const targetPin =
        currentRoom.pins[activeExamSession.activePinIndex] ?? null;
      if (!targetPin) return;

      const isCorrect = pin.id === targetPin.id;
      setExamFeedback({
        clickedPinId: pin.id,
        targetPinId: targetPin.id,
        isCorrect,
      });

      window.setTimeout(() => {
        setExamFeedback(null);
        recordPhase1(targetPin.id, isCorrect);
      }, 950);
    }
  };

  const handleStickerClick = (e: React.MouseEvent, pin: RoomPin) => {
    e.stopPropagation();
    const stickerUrl = pin.customSticker || pin.imageUrl;
    if (!stickerUrl) return;
    openLightbox({
      url: stickerUrl,
      title: `${pin.title} · ${pin.concept}`,
    });
  };

  const getPinStatus = (pin: RoomPin): PinRecallStatus => {
    if (pin.status) return pin.status;
    const s = pin.score ?? pin.lastScore;
    if (typeof s === 'number') {
      if (s >= 80) return 'MASTERED';
      if (s >= 50) return 'NEEDS_REVIEW';
      return 'FAILED';
    }
    return 'UNTESTED';
  };

  const getTrafficLightClasses = (pin: RoomPin, index: number) => {
    // Exam Mode Phase 1 Instant Outline Feedback (Green for correct, Red on wrong + pulse target pin)
    if (studyMode === 'exam' && examFeedback) {
      if (
        examFeedback.isCorrect &&
        examFeedback.clickedPinId === pin.id
      ) {
        return {
          pulseRing: 'border-emerald-400 bg-emerald-500/50 animate-ping',
          core: 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-300 shadow-xl shadow-emerald-500/60 scale-125',
        };
      }
      if (!examFeedback.isCorrect) {
        if (examFeedback.clickedPinId === pin.id) {
          return {
            pulseRing: 'border-rose-400 bg-rose-500/50 animate-ping',
            core: 'bg-rose-500 text-white ring-4 ring-rose-300 shadow-xl shadow-rose-500/60 scale-110',
          };
        }
        if (examFeedback.targetPinId === pin.id) {
          return {
            pulseRing: 'border-emerald-300 bg-emerald-400/60 animate-ping',
            core: 'bg-emerald-400 text-slate-950 ring-4 ring-emerald-200 shadow-2xl shadow-emerald-400/80 scale-125',
          };
        }
      }
    }

    // Study Mode Active Walkthrough Glow Ring
    if (studyMode === 'study' && index === activePinIndex) {
      return {
        pulseRing: 'border-cyan-300 bg-cyan-400/45 animate-ping',
        core: 'bg-gradient-to-br from-cyan-400 to-indigo-500 text-slate-950 ring-4 ring-cyan-300 shadow-xl shadow-cyan-400/60 scale-125',
      };
    }

    // Memory Mode Revealed vs Hidden State
    if (studyMode === 'memory') {
      const isRevealed = Boolean(revealedPins[pin.id]);
      if (isRevealed) {
        return {
          pulseRing: 'border-emerald-400 bg-emerald-500/35',
          core: 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-300 shadow-lg shadow-emerald-500/40',
        };
      }
      return {
        pulseRing: 'border-amber-400/70 bg-amber-500/25 animate-pulse',
        core: 'bg-amber-500 text-slate-950 ring-2 ring-amber-300 shadow-lg shadow-amber-500/30',
      };
    }

    const status = getPinStatus(pin);

    switch (status) {
      case 'MASTERED':
        return {
          pulseRing: 'border-emerald-400 bg-emerald-500/35',
          core: 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-400 shadow-lg shadow-emerald-500/40',
        };
      case 'NEEDS_REVIEW':
        return {
          pulseRing: 'border-amber-400 bg-amber-500/35',
          core: 'bg-amber-500 text-slate-950 ring-2 ring-amber-400 shadow-lg shadow-amber-500/40',
        };
      case 'FAILED':
        return {
          pulseRing: 'border-rose-400 bg-rose-500/35',
          core: 'bg-rose-500 text-white ring-2 ring-rose-400 shadow-lg shadow-rose-500/40',
        };
      case 'UNTESTED':
      default:
        return {
          pulseRing: 'border-cyan-400/70 bg-cyan-500/30 animate-pulse',
          core: 'bg-gradient-to-br from-indigo-500 to-cyan-400 text-slate-950 ring-2 ring-cyan-500/50 shadow-lg shadow-cyan-500/30',
        };
    }
  };

  const getFloatingCardPositionClasses = (pin: RoomPin): string => {
    const verticalClass = pin.y < 38 ? 'top-full mt-3' : 'bottom-full mb-3';

    let horizontalClass = 'left-1/2 -translate-x-1/2';
    if (pin.x > 74) {
      horizontalClass = 'right-0 translate-x-0';
    } else if (pin.x < 26) {
      horizontalClass = 'left-0 translate-x-0';
    }

    return `${verticalClass} ${horizontalClass}`;
  };

  const ratio = currentRoom.aspectRatio || 16 / 9;
  const canRenderStickers =
    showStickersOnCanvas && studyMode !== 'memory' && studyMode !== 'exam';

  const pins = currentRoom.pins;
  const totalPins = pins.length;
  const activeStudyPin =
    studyMode === 'study' && totalPins > 0
      ? pins[Math.min(activePinIndex, totalPins - 1)]
      : null;

  const targetExamPin =
    studyMode === 'exam' && activeExamSession
      ? pins[activeExamSession.activePinIndex] ?? null
      : null;

  const allRevealed =
    totalPins > 0 && pins.every((p) => Boolean(revealedPins[p.id]));

  return (
    <div
      style={{ touchAction: 'manipulation' }}
      className="flex-1 h-full w-full relative overflow-hidden bg-slate-950 flex items-center justify-center p-2 sm:p-4 touch-manipulation"
    >
      {/* Hidden File Input for Quick Room Photo Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUploadPhoto}
        className="hidden"
      />

      {/* ===================================================================== */}
      {/* TOP FLOATING MODE BANNER / EXAM PHASE 1 PROMPT BAR                    */}
      {/* ===================================================================== */}
      {studyMode === 'exam' &&
      totalPins > 0 &&
      activeExamSession &&
      activeExamSession.currentPhase === 'PHASE_1' ? (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 w-full max-w-2xl rounded-2xl border border-indigo-500/50 bg-slate-900/95 px-5 py-3.5 backdrop-blur-xl shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                <span>{t.app.exam.phase1Title}</span>
                <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 font-mono text-cyan-300">
                  {activeExamSession.activePinIndex + 1}/{totalPins}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-white">
                “{targetExamPin?.concept}”
              </h3>
            </div>

            <div className="flex items-center gap-2">
              {examFeedback && (
                <div
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold ${
                    examFeedback.isCorrect
                      ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                      : 'border-rose-500/40 bg-rose-500/15 text-rose-300'
                  }`}
                >
                  {examFeedback.isCorrect ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span>{t.app.exam.correctFeedback} (+10 pts)</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-rose-400" />
                      <span>{t.app.exam.wrongFeedback} (0 pts)</span>
                    </>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={() => toggleExamHistoryDrawer(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-1.5 text-xs font-bold text-slate-200 hover:border-indigo-500/40 hover:text-white transition"
              >
                <History className="h-3.5 w-3.5 text-indigo-400" />
                <span>{t.app.exam.viewHistory}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-full border border-slate-800/80 bg-slate-900/75 px-4 py-1.5 text-[11px] font-medium text-slate-300 backdrop-blur-md shadow-lg">
          <span
            className={`h-2 w-2 rounded-full ${
              studyMode === 'build'
                ? 'bg-cyan-400 animate-pulse'
                : studyMode === 'study'
                ? 'bg-indigo-400'
                : 'bg-amber-400 animate-pulse'
            }`}
          />
          <span>
            {studyMode === 'build' && t.app.canvas.clickToPlacePin}
            {studyMode === 'study' && t.app.studyWalkthrough.keyboardHint}
            {studyMode === 'memory' && t.app.canvas.recallModeNotice}
          </span>
        </div>
      )}

      {/* ===================================================================== */}
      {/* FULL-VIEWPORT ROOM CANVAS CONTAINER                                    */}
      {/* ===================================================================== */}
      <div
        ref={canvasContainerRef}
        onClick={handleCanvasClick}
        style={{
          aspectRatio: ratio,
          maxHeight: 'calc(100vh - 115px)',
          maxWidth: `min(100%, calc((100vh - 115px) * ${ratio}))`,
          width: '100%',
          touchAction: 'manipulation',
        }}
        className={`relative mx-auto rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl select-none overflow-visible touch-manipulation ${
          studyMode === 'build' ? 'cursor-crosshair' : 'cursor-default'
        }`}
      >
        {/* Full-Resolution Room Image */}
        <img
          src={currentRoom.imageUrl}
          alt={currentRoom.name}
          draggable={false}
          style={{
            imageRendering:
              'high-quality' as React.CSSProperties['imageRendering'],
          }}
          className="high-quality-image w-full h-full max-h-[calc(100vh-115px)] object-contain rounded-2xl pointer-events-none select-none"
        />

        {/* Subtle vignette for pin contrast */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-t from-slate-950/35 via-transparent to-slate-950/15" />

        {/* Pending Pin Preview Marker */}
        <AnimatePresence>
          {pendingCoords && studyMode === 'build' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.4 }}
              style={{
                left: `${pendingCoords.x}%`,
                top: `${pendingCoords.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              className="pointer-events-none absolute z-40 -translate-x-1/2 -translate-y-1/2"
            >
              <span className="absolute -inset-3 rounded-full bg-cyan-400/40 animate-ping" />
              <div className="relative flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/60">
                <Target className="h-5 w-5" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rendered Room Pins */}
        {currentRoom.pins.map((pin, index) => {
          const isHovered = hoveredPinId === pin.id;
          const isActiveStudyPin =
            studyMode === 'study' && activeStudyPin?.id === pin.id;
          const isMemoryCardOpen =
            studyMode === 'memory' &&
            (activeMemoryPinId === pin.id || Boolean(revealedPins[pin.id]));
          const isPinRevealed = Boolean(revealedPins[pin.id]);
          const isSelected = selectedPin?.id === pin.id || isActiveStudyPin;

          const traffic = getTrafficLightClasses(pin, index);
          const cardPosClasses = getFloatingCardPositionClasses(pin);
          const pinStickerSrc = pin.customSticker || pin.imageUrl;
          const showPinSticker = Boolean(canRenderStickers && pinStickerSrc);

          return (
            <div
              key={pin.id}
              style={{
                left: `${pin.x}%`,
                top: `${pin.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              className={`absolute ${
                isHovered || isActiveStudyPin || isMemoryCardOpen
                  ? 'z-50'
                  : 'z-20'
              }`}
            >
              {/* Floating Visual Mnemonic Sticker Badge */}
              <AnimatePresence>
                {showPinSticker && (
                  <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-30">
                    <motion.button
                      type="button"
                      initial={{ opacity: 0, scale: 0.7, y: 6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.7, y: 6 }}
                      whileHover={{ scale: 1.1 }}
                      onClick={(e) => handleStickerClick(e, pin)}
                      onMouseEnter={() => setHoveredPinId(pin.id)}
                      onMouseLeave={() => setHoveredPinId(null)}
                      title={t.app.lightbox.title}
                      className="group/sticker relative h-[60px] w-[60px] cursor-zoom-in overflow-hidden rounded-2xl border border-white/20 bg-slate-950 shadow-xl shadow-black/80 focus:outline-none"
                    >
                      <img
                        src={pinStickerSrc}
                        alt={pin.title}
                        draggable={false}
                        className="h-full w-full object-cover select-none"
                      />
                      <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover/sticker:opacity-100">
                        <Maximize2 className="h-4 w-4 text-white drop-shadow" />
                      </span>
                    </motion.button>
                  </div>
                )}
              </AnimatePresence>

              {/* Pin Button (minimum 44x44px touch target on mobile) */}
              <motion.button
                type="button"
                onPointerDown={(e) => handlePinPointerDown(e, pin)}
                onClick={(e) => handlePinClick(e, pin, index)}
                onMouseEnter={() => setHoveredPinId(pin.id)}
                onMouseLeave={() => setHoveredPinId(null)}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.94 }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 360,
                  damping: 22,
                }}
                style={{ touchAction: 'manipulation' }}
                aria-label={pin.title}
                className={`group relative flex min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 items-center justify-center touch-manipulation focus:outline-none ${
                  studyMode === 'build'
                    ? 'cursor-grab active:cursor-grabbing'
                    : 'cursor-pointer'
                }`}
              >
                <span
                  className={`pointer-events-none absolute -inset-2.5 rounded-full border ${traffic.pulseRing} animate-ping opacity-75`}
                  style={{ animationDuration: '2.4s' }}
                />
                <span
                  className={`pointer-events-none absolute -inset-1.5 rounded-full border ${traffic.pulseRing} transition-transform duration-300 group-hover:scale-125`}
                />

                <span
                  className={`relative flex h-9 w-9 items-center justify-center rounded-full border-2 ${
                    isSelected ? 'border-white' : 'border-slate-950/80'
                  } ${traffic.core} transition-all`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <circle cx="12" cy="12" r="8" />
                    <circle cx="12" cy="12" r="3" />
                    <line x1="12" y1="2" x2="12" y2="5" />
                    <line x1="12" y1="19" x2="12" y2="22" />
                    <line x1="2" y1="12" x2="5" y2="12" />
                    <line x1="19" y1="12" x2="22" y2="12" />
                  </svg>
                </span>

                <span className="pointer-events-none absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-slate-950 border border-slate-700 px-1 text-[10px] font-bold text-slate-200 shadow">
                  {index + 1}
                </span>
              </motion.button>

              {/* =============================================================== */}
              {/* STUDY MODE: Anchored Floating Card for Active Pin               */}
              {/* =============================================================== */}
              <AnimatePresence>
                {isActiveStudyPin && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className={`absolute z-50 w-72 sm:w-80 ${cardPosClasses}`}
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.95 }}
                      className="rounded-2xl border border-cyan-400/50 bg-slate-900/95 p-4 text-left shadow-2xl backdrop-blur-xl space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                          📍 {pin.title}
                        </span>
                        <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-300">
                          {index + 1}/{totalPins}
                        </span>
                      </div>

                      <div>
                        <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          {t.app.studyWalkthrough.conceptLabel}
                        </span>
                        <p className="text-xs font-extrabold text-white mt-0.5">
                          {pin.concept}
                        </p>
                      </div>

                      {pin.mnemonicVisual && (
                        <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/40 p-2.5">
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                            ✨ {t.app.studyWalkthrough.hookLabel}
                          </span>
                          <p className="text-[11px] leading-relaxed text-indigo-100 mt-1 italic">
                            “{pin.mnemonicVisual}”
                          </p>
                        </div>
                      )}
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* =============================================================== */}
              {/* MEMORY MODE: Flashcard Blur/Reveal Card                         */}
              {/* =============================================================== */}
              <AnimatePresence>
                {studyMode === 'memory' &&
                  (activeMemoryPinId === pin.id || isHovered) && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePinRevealed(pin.id);
                      }}
                      className={`absolute z-50 w-72 cursor-pointer ${cardPosClasses}`}
                    >
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="rounded-2xl border border-amber-500/40 bg-slate-900/95 p-3.5 text-left shadow-2xl backdrop-blur-xl space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
                          <span className="text-[11px] font-bold text-amber-300 truncate">
                            📍 {pin.title}
                          </span>
                          <span className="rounded-lg bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-cyan-300">
                            {isPinRevealed
                              ? t.app.memoryFlashcard.hideBtn
                              : t.app.memoryFlashcard.revealBtn}
                          </span>
                        </div>

                        <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950/80 p-2.5">
                          <div
                            className={`space-y-1.5 transition-all duration-300 ${
                              isPinRevealed
                                ? 'blur-0 opacity-100'
                                : 'blur-md select-none opacity-40'
                            }`}
                          >
                            <p className="text-xs font-bold text-white">
                              {pin.concept}
                            </p>
                            {pin.mnemonicVisual && (
                              <p className="text-[11px] text-indigo-200 italic line-clamp-3">
                                “{pin.mnemonicVisual}”
                              </p>
                            )}
                          </div>

                          {!isPinRevealed && (
                            <div className=" inset-0 absolute flex flex-col items-center justify-center bg-slate-950/60 p-2 text-center">
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1 text-[10px] font-extrabold text-slate-950 shadow">
                                <Eye className="h-3 w-3" />
                                {t.app.memoryFlashcard.clickToReveal}
                              </span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </div>
                  )}
              </AnimatePresence>

              {/* Standard Build Hover Tooltip */}
              <AnimatePresence>
                {studyMode === 'build' && isHovered && (
                  <div
                    className={`pointer-events-none absolute z-50 ${cardPosClasses}`}
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.14 }}
                      className="pointer-events-none whitespace-nowrap bg-slate-900/95 text-white border border-slate-700 shadow-2xl px-2.5 py-1 text-xs rounded-md font-medium tracking-wide backdrop-blur-md"
                    >
                      <span>
                        {pin.title} · {pin.concept}
                      </span>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* ===================================================================== */}
      {/* 3-STAGE MASTER EXAM RUNNER MODAL (PHASE 2, PHASE 3 & SUMMARY)         */}
      {/* ===================================================================== */}
      <ExamRunnerModal />

      {/* ===================================================================== */}
      {/* BOTTOM FLOATING CONTROLLER PILL (STUDY WALKTHROUGH OR BUILD TOOLS)     */}
      {/* ===================================================================== */}
      {studyMode === 'study' && totalPins > 0 ? (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 rounded-full border border-indigo-500/40 bg-slate-900/90 px-4 py-2 backdrop-blur-xl shadow-2xl">
          <button
            type="button"
            onClick={prevStudyPin}
            className="rounded-full border border-slate-700 bg-slate-800/90 px-3.5 py-1.5 text-xs font-bold text-slate-200 hover:border-indigo-500/50 hover:bg-slate-800 hover:text-white transition"
          >
            {t.app.studyWalkthrough.prevBtn}
          </button>

          <span className="px-2 font-mono text-xs font-extrabold text-cyan-300">
            [
            {t.app.studyWalkthrough.pinCounter
              .replace('{current}', String(Math.min(activePinIndex + 1, totalPins)))
              .replace('{total}', String(totalPins))}
            ]
          </span>

          <button
            type="button"
            onClick={nextStudyPin}
            className="rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 shadow hover:from-indigo-400 hover:to-cyan-400 transition"
          >
            {t.app.studyWalkthrough.nextBtn}
          </button>
        </div>
      ) : (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex flex-wrap items-center justify-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/85 px-3.5 py-1.5 backdrop-blur-xl shadow-2xl">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition"
          >
            <Upload className="h-3.5 w-3.5 text-cyan-400" />
            <span>{t.app.canvas.uploadPhoto}</span>
          </button>

          <div className="h-4 w-px bg-slate-700/80" />

          <button
            type="button"
            onClick={handleLoadSample}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-indigo-300 hover:bg-slate-800 hover:text-indigo-200 transition"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>{t.app.canvas.loadSample}</span>
          </button>

          <div className="h-4 w-px bg-slate-700/80" />

          <button
            type="button"
            onClick={toggleShowStickers}
            disabled={studyMode === 'memory' || studyMode === 'exam'}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${
              studyMode === 'memory' || studyMode === 'exam'
                ? 'text-slate-500 opacity-50 cursor-not-allowed'
                : showStickersOnCanvas
                ? 'bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            {showStickersOnCanvas &&
            studyMode !== 'memory' &&
            studyMode !== 'exam' ? (
              <>
                <Eye className="h-3.5 w-3.5 text-cyan-400" />
                <span>{t.app.canvas.toggleStickersHide}</span>
              </>
            ) : (
              <>
                <EyeOff className="h-3.5 w-3.5" />
                <span>{t.app.canvas.toggleStickersShow}</span>
              </>
            )}
          </button>

          {studyMode === 'memory' && totalPins > 0 && (
            <>
              <div className="h-4 w-px bg-slate-700/80" />
              <button
                type="button"
                onClick={() => setAllPinsRevealed(!allRevealed)}
                className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 px-3 py-1 text-xs font-bold text-amber-300 hover:bg-amber-500/30 transition"
              >
                {allRevealed ? (
                  <>
                    <EyeOff className="h-3 w-3" />
                    <span>{t.app.memoryFlashcard.hideAllBtn}</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-3 w-3" />
                    <span>{t.app.memoryFlashcard.revealAllBtn}</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={resetRecallProgress}
                title={t.app.canvas.resetDemo}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
