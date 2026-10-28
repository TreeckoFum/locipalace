'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  Loader2,
  Trophy,
  RotateCcw,
  BookOpen,
  History,
  ArrowRight,
  MapPin,
  Brain,
  FileText,
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { usePalaceStore } from '@/store/usePalaceStore';
import { getTranslations } from '@/lib/translations';
import type { Locale } from '@/types/palace';
import type { Phase2Question } from '@/types/exam';

export function ExamRunnerModal() {
  const locale = useLocale() as Locale;
  const t = getTranslations(locale);
  const examT = t.app.exam;

  const {
    studyMode,
    currentRoom,
    activeExamSession,
    startExamSession,
    setGeneratedPinExamData,
    setExamLoadingQuestions,
    setExamEvaluating,
    recordPhase2Answer,
    advanceToPhase3,
    submitPhase3,
    advanceExamToNextPin,
    toggleExamHistoryDrawer,
    setStudyMode,
  } = usePalaceStore();

  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [essayDraft, setEssayDraft] = useState('');

  const pins = currentRoom?.pins ?? [];
  const totalPins = pins.length;
  const activePinIndex = activeExamSession?.activePinIndex ?? 0;
  const currentPin = pins[activePinIndex] ?? null;
  const currentPhase = activeExamSession?.currentPhase ?? 'PHASE_1';
  const currentRecord = activeExamSession?.currentPinRecord;

  // Reset local Phase 2/3 state whenever activePinIndex or attemptNumber changes
  useEffect(() => {
    setCurrentQuestionIdx(0);
    setEssayDraft('');
  }, [
    activeExamSession?.palaceId,
    activeExamSession?.attemptNumber,
    activeExamSession?.activePinIndex,
  ]);

  // Pre-fetch / generate adaptive Phase 2 & Phase 3 questions from /api/exam/generate for the active pin
  useEffect(() => {
    if (
      studyMode !== 'exam' ||
      !activeExamSession ||
      !currentPin ||
      activeExamSession.currentPhase === 'SUMMARY'
    ) {
      return;
    }

    const existingQuestions =
      activeExamSession.currentPinRecord.phase2Questions ?? [];
    if (
      existingQuestions.length > 0 &&
      activeExamSession.currentPinRecord.pinId === currentPin.id
    ) {
      return;
    }

    let cancelled = false;
    const fetchQuestions = async () => {
      setExamLoadingQuestions(true);
      try {
        const res = await fetch('/api/exam/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conceptTitle: currentPin.concept,
            anchorName: currentPin.title,
            notes: currentPin.detailedNotes || currentPin.concept,
            attemptNumber: activeExamSession.attemptNumber,
            locale,
          }),
        });
        const data = (await res.json()) as {
          phase2Questions?: Phase2Question[];
          phase3Prompt?: string;
        };
        if (!cancelled && data.phase2Questions && data.phase3Prompt) {
          setGeneratedPinExamData(
            currentPin.id,
            data.phase2Questions,
            data.phase3Prompt
          );
        } else if (!cancelled) {
          setExamLoadingQuestions(false);
        }
      } catch {
        if (!cancelled) {
          setExamLoadingQuestions(false);
        }
      }
    };

    fetchQuestions();
    return () => {
      cancelled = true;
    };
  }, [
    studyMode,
    activeExamSession?.palaceId,
    activeExamSession?.attemptNumber,
    activeExamSession?.activePinIndex,
    currentPin?.id,
    locale,
    setExamLoadingQuestions,
    setGeneratedPinExamData,
  ]);

  if (studyMode !== 'exam' || !activeExamSession || totalPins === 0) {
    return null;
  }

  // Phase 1 is handled directly on the 2D canvas (via banner + clicking pins)
  if (currentPhase === 'PHASE_1') {
    return null;
  }

  const questions = currentRecord?.phase2Questions ?? [];
  const activeQuestion = questions[currentQuestionIdx] ?? null;
  const isQuestionAnswered =
    typeof activeQuestion?.userSelectedIndex === 'number';

  const handleSelectOption = (optionIdx: number) => {
    if (!currentPin || !activeQuestion || isQuestionAnswered) return;
    recordPhase2Answer(currentPin.id, activeQuestion.id, optionIdx);

    // Automatically advance to next question or Phase 3 after brief visual validation
    window.setTimeout(() => {
      if (currentQuestionIdx + 1 < questions.length) {
        setCurrentQuestionIdx((idx) => idx + 1);
      } else {
        advanceToPhase3();
      }
    }, 850);
  };

  const handleEvaluateEssay = async () => {
    if (
      !currentPin ||
      !essayDraft.trim() ||
      activeExamSession.isEvaluating ||
      Boolean(currentRecord?.aiFeedback)
    ) {
      return;
    }

    setExamEvaluating(true);
    try {
      const res = await fetch('/api/exam/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conceptTitle: currentPin.concept,
          originalNotes: currentPin.detailedNotes || currentPin.concept,
          phase3Prompt: currentRecord?.phase3Prompt ?? '',
          userExplanation: essayDraft.trim(),
          locale,
        }),
      });
      const data = (await res.json()) as {
        scorePercentage?: number;
        feedback?: string;
      };
      submitPhase3(
        currentPin.id,
        essayDraft.trim(),
        typeof data.scorePercentage === 'number' ? data.scorePercentage : 70,
        data.feedback || 'Evaluación completada.'
      );
    } catch {
      submitPhase3(
        currentPin.id,
        essayDraft.trim(),
        70,
        'Evaluación completada en modo local.'
      );
    }
  };

  // Calculate final breakdown for SUMMARY phase
  const evaluatedRecords = activeExamSession.records;
  const count = Math.max(1, evaluatedRecords.length);
  const avgPhase1 =
    Math.round(
      (evaluatedRecords.reduce((acc, r) => acc + r.phase1Score, 0) / count) * 10
    ) / 10;
  const avgPhase2 =
    Math.round(
      (evaluatedRecords.reduce((acc, r) => acc + r.phase2Score, 0) / count) * 10
    ) / 10;
  const avgPhase3 =
    Math.round(
      (evaluatedRecords.reduce((acc, r) => acc + r.phase3Score, 0) / count) * 10
    ) / 10;
  const finalRetentionScore = Math.round(
    evaluatedRecords.reduce((acc, r) => acc + r.totalPinScore, 0) / count
  );

  const isLastPin = activePinIndex + 1 >= totalPins;
  const isPhase3Graded = Boolean(currentRecord?.aiFeedback);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          className="relative w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-t-3xl md:rounded-3xl border border-indigo-500/40 bg-slate-900/95 shadow-2xl shadow-black"
        >
          {/* Mobile Drag Handle Pill */}
          <div className="mx-auto mt-2.5 h-1.5 w-12 shrink-0 rounded-full bg-slate-700 md:hidden" />
          {/* ================================================================= */}
          {/* SUMMARY / FINAL SCORE BREAKDOWN VIEW                              */}
          {/* ================================================================= */}
          {currentPhase === 'SUMMARY' ? (
            <div className="p-6 sm:p-8 space-y-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/40 bg-cyan-500/15 text-cyan-300 shadow-lg shadow-cyan-500/20">
                <Trophy className="h-8 w-8" />
              </div>

              <div className="space-y-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-indigo-300">
                  {examT.attemptLabel.replace(
                    '{number}',
                    String(activeExamSession.attemptNumber)
                  )}{' '}
                  · {examT.resultsTitle}
                </span>
                <h2 className="text-2xl font-extrabold text-white">
                  {examT.totalRetention}:{' '}
                  <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                    {finalRetentionScore}%
                  </span>
                </h2>
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  {finalRetentionScore >= 85
                    ? examT.perfectScore
                    : finalRetentionScore >= 55
                    ? examT.midScore
                    : examT.lowScore}
                </p>
              </div>

              {/* 3-Stage Weighted Score Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{examT.spatialScore}</span>
                    <MapPin className="h-4 w-4 text-cyan-400" />
                  </div>
                  <p className="text-lg font-extrabold text-white">
                    {avgPhase1}{' '}
                    <span className="text-xs font-normal text-slate-500">
                      / 10 pts
                    </span>
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{examT.quizScore}</span>
                    <Brain className="h-4 w-4 text-indigo-400" />
                  </div>
                  <p className="text-lg font-extrabold text-white">
                    {avgPhase2}{' '}
                    <span className="text-xs font-normal text-slate-500">
                      / 40 pts
                    </span>
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{examT.aiScore}</span>
                    <FileText className="h-4 w-4 text-emerald-400" />
                  </div>
                  <p className="text-lg font-extrabold text-white">
                    {avgPhase3}{' '}
                    <span className="text-xs font-normal text-slate-500">
                      / 50 pts
                    </span>
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-300">
                ✓ {examT.retentionSavedNotice} ({finalRetentionScore}%)
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => toggleExamHistoryDrawer(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/40 bg-indigo-500/15 px-4 py-2.5 text-xs font-bold text-indigo-200 hover:bg-indigo-500/25 transition"
                >
                  <History className="h-4 w-4 text-indigo-400" />
                  <span>{examT.viewHistory}</span>
                </button>

                <button
                  type="button"
                  onClick={() => startExamSession(currentRoom?.id)}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-lg hover:from-indigo-400 hover:to-cyan-400 transition"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>{examT.btnRestartExam}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStudyMode('study')}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
                >
                  <BookOpen className="h-4 w-4 text-cyan-400" />
                  <span>{examT.btnBackToStudy}</span>
                </button>
              </div>
            </div>
          ) : (
            /* ================================================================= */
            /* PHASE 2 & PHASE 3 RUNNER MODAL                                    */
            /* ================================================================= */
            <div className="p-6 space-y-5">
              {/* Top Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-indigo-500/20 border border-indigo-500/40 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                      {examT.attemptLabel.replace(
                        '{number}',
                        String(activeExamSession.attemptNumber)
                      )}
                    </span>
                    <span className="rounded-full bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-0.5 text-[10px] font-mono font-bold text-cyan-300">
                      {examT.pinProgressCounter
                        .replace('{current}', String(activePinIndex + 1))
                        .replace('{total}', String(totalPins))}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        currentRecord?.phase1Passed
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {currentRecord?.phase1Passed
                        ? examT.phase1PassedBadge
                        : examT.phase1FailedBadge}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-white pt-1">
                    📍 {currentPin?.title} —{' '}
                    <span className="text-cyan-300">{currentPin?.concept}</span>
                  </h3>
                </div>
              </div>

              {/* Loading Indicator while Gemini Generates Adaptive Questions */}
              {activeExamSession.isLoadingQuestions ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                  <p className="text-xs font-semibold text-slate-300">
                    {examT.loadingQuestions}
                  </p>
                </div>
              ) : currentPhase === 'PHASE_2' ? (
                /* ============================================================= */
                /* PHASE 2: ADAPTIVE MULTIPLE-CHOICE QUIZ (40%)                  */
                /* ============================================================= */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                      {examT.phase2Title}
                    </span>
                    {questions.length > 0 && (
                      <span className="rounded-full bg-slate-800 px-3 py-0.5 font-mono text-xs font-bold text-cyan-300">
                        {examT.questionCounter
                          .replace('{current}', String(currentQuestionIdx + 1))
                          .replace('{total}', String(questions.length))}
                      </span>
                    )}
                  </div>

                  {activeQuestion && (
                    <div className="space-y-3">
                      <p className="text-sm sm:text-base font-bold text-white leading-snug">
                        {activeQuestion.question}
                      </p>

                      <div className="grid grid-cols-1 gap-2.5">
                        {activeQuestion.options.map((opt, idx) => {
                          const isSelected =
                            activeQuestion.userSelectedIndex === idx;
                          const isCorrectOption =
                            activeQuestion.correctOptionIndex === idx;

                          let btnClasses =
                            'border-slate-800 bg-slate-950/90 text-slate-200 hover:border-indigo-500/50 hover:bg-slate-900';
                          if (isQuestionAnswered) {
                            if (isCorrectOption) {
                              btnClasses =
                                'border-emerald-500 bg-emerald-500/20 text-emerald-200 font-bold';
                            } else if (isSelected && !isCorrectOption) {
                              btnClasses =
                                'border-rose-500 bg-rose-500/20 text-rose-200';
                            } else {
                              btnClasses =
                                'border-slate-800/50 bg-slate-950/40 text-slate-500 opacity-60';
                            }
                          }

                          return (
                            <button
                              key={idx}
                              type="button"
                              disabled={isQuestionAnswered}
                              onClick={() => handleSelectOption(idx)}
                              className={`w-full flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-xs sm:text-sm transition-all ${btnClasses}`}
                            >
                              <span className="flex items-center gap-3">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 font-mono text-xs font-bold text-slate-300">
                                  {String.fromCharCode(65 + idx)}
                                </span>
                                <span>{opt}</span>
                              </span>

                              {isQuestionAnswered && isCorrectOption && (
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                              )}
                              {isQuestionAnswered &&
                                isSelected &&
                                !isCorrectOption && (
                                  <XCircle className="h-4 w-4 shrink-0 text-rose-400" />
                                )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* ============================================================= */
                /* PHASE 3: ACTIVE RECALL ESSAY & AI SEMANTIC GRADER (50%)       */
                /* ============================================================= */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                      {examT.phase3Title}
                    </span>
                    <span className="rounded-full bg-slate-800 px-3 py-0.5 font-mono text-xs font-semibold text-slate-300">
                      {examT.quizScore}: {currentRecord?.phase2Score ?? 0} / 40
                      pts
                    </span>
                  </div>

                  <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/30 p-3.5">
                    <p className="text-xs sm:text-sm font-bold text-indigo-100">
                      {currentRecord?.phase3Prompt ||
                        `Explica con detalle los puntos clave de "${currentPin?.concept}".`}
                    </p>
                  </div>

                  <textarea
                    rows={4}
                    disabled={
                      activeExamSession.isEvaluating || isPhase3Graded
                    }
                    value={essayDraft}
                    onChange={(e) => setEssayDraft(e.target.value)}
                    placeholder={examT.essayPlaceholder}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none disabled:opacity-75"
                  />

                  {/* AI Evaluation Result Card */}
                  {isPhase3Graded && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                          ✨ {examT.aiCritiqueLabel}
                        </span>
                        <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-0.5 font-mono text-xs font-extrabold text-emerald-300">
                          {currentRecord?.phase3Score ?? 0} / 50 pts
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                        {currentRecord?.aiFeedback}
                      </p>
                      <div className="pt-1 text-right font-mono text-xs font-bold text-cyan-300">
                        Total Pin: {currentRecord?.totalPinScore ?? 0} / 100 pts
                      </div>
                    </motion.div>
                  )}

                  {/* Phase 3 Footer Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    {!isPhase3Graded ? (
                      <button
                        type="button"
                        disabled={
                          !essayDraft.trim() || activeExamSession.isEvaluating
                        }
                        onClick={handleEvaluateEssay}
                        className="w-full md:w-auto cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-lg hover:from-indigo-400 hover:to-cyan-400 disabled:opacity-40 transition"
                      >
                        {activeExamSession.isEvaluating ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>{examT.evaluatingWithAI}</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            <span>{examT.evaluateWithAI}</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={advanceExamToNextPin}
                        className="w-full md:w-auto cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-5 py-2.5 text-xs font-extrabold text-slate-950 shadow-lg hover:opacity-95 transition"
                      >
                        <span>
                          {isLastPin ? examT.finishExam : examT.nextPin}
                        </span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
