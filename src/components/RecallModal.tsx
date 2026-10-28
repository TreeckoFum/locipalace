'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  X,
  Send,
  Loader2,
  RotateCcw,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  MapPin,
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { usePalaceStore } from '@/store/usePalaceStore';
import { getTranslations } from '@/lib/translations';
import type { RecallEvaluationResult } from '@/types/palace';

export function RecallModal() {
  const locale = useLocale();
  const t = getTranslations(locale);
  const {
    currentRoom,
    selectedPin,
    isRecallModalOpen,
    closeRecallModal,
    openRecallModal,
    recordRecallResult,
  } = usePalaceStore();

  const [userRecallText, setUserRecallText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [evalResult, setEvalResult] = useState<RecallEvaluationResult | null>(
    null
  );
  const [displayScore, setDisplayScore] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Reset modal state whenever a different pin is opened
  useEffect(() => {
    if (isRecallModalOpen && selectedPin) {
      setUserRecallText('');
      setIsSubmitting(false);
      setErrorMsg(null);
      setEvalResult(null);
      setDisplayScore(0);

      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isRecallModalOpen, selectedPin?.id]);

  // Animated numeric score count-up from 0 -> evalResult.score
  useEffect(() => {
    if (!evalResult) {
      setDisplayScore(0);
      return;
    }

    const target = evalResult.score;
    if (target <= 0) {
      setDisplayScore(0);
      return;
    }

    let animationFrameId: number;
    const durationMs = 750;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(target * eased));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [evalResult]);

  if (!isRecallModalOpen || !selectedPin || !currentRoom) {
    return null;
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userRecallText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const response = await fetch('/api/evaluate-recall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pinId: selectedPin.id,
          targetConcept: selectedPin.concept,
          notes: selectedPin.detailedNotes,
          userRecallText: userRecallText.trim(),
          locale,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Evaluation request failed.');
      }

      const result: RecallEvaluationResult = {
        score: data.score,
        status: data.status,
        feedback: data.feedback,
        suggestedImprovement: data.suggestedImprovement,
      };

      setEvalResult(result);
      recordRecallResult(selectedPin.id, {
        score: result.score,
        status: result.status,
      });
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred during evaluation.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTextareaKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTryAgain = () => {
    setEvalResult(null);
    setErrorMsg(null);
    setDisplayScore(0);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  // Find next untested pin in the current room
  const untestedPins = currentRoom.pins.filter(
    (p) =>
      p.id !== selectedPin.id && (p.status ?? 'UNTESTED') === 'UNTESTED'
  );
  const nextUntestedPin = untestedPins[0] ?? null;

  const handleNextUntested = () => {
    if (nextUntestedPin) {
      openRecallModal(nextUntestedPin);
    }
  };

  const getStatusBadgeClasses = (
    status: 'MASTERED' | 'NEEDS_REVIEW' | 'FAILED'
  ) => {
    switch (status) {
      case 'MASTERED':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'NEEDS_REVIEW':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'FAILED':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    }
  };

  const getStatusLabel = (status: 'MASTERED' | 'NEEDS_REVIEW' | 'FAILED') => {
    switch (status) {
      case 'MASTERED':
        return { label: t.nav.mastered.toUpperCase(), Icon: CheckCircle2, stroke: '#34d399' };
      case 'NEEDS_REVIEW':
        return { label: t.nav.needsReview.toUpperCase(), Icon: AlertTriangle, stroke: '#fbbf24' };
      case 'FAILED':
        return { label: t.nav.failed.toUpperCase(), Icon: XCircle, stroke: '#fb7185' };
    }
  };

  const circumference = 2 * Math.PI * 38;
  const strokeDashoffset = evalResult
    ? circumference - (displayScore / 100) * circumference
    : circumference;

  return (
    <AnimatePresence>
      {isRecallModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeRecallModal}
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-md"
          />

          {/* Modal Container (Bottom Sheet on < md, Centered on md+) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            className="relative z-10 w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-t-3xl md:rounded-2xl border border-slate-800 bg-slate-900/95 backdrop-blur-xl shadow-2xl shadow-black/80"
          >
            {/* Mobile Drag Handle Pill */}
            <div className="mx-auto mt-2.5 h-1.5 w-12 shrink-0 rounded-full bg-slate-700 md:hidden" />
            {/* Header — Exposes ONLY Physical Anchor Title & Coordinates */}
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/15 text-amber-400">
                  <Brain className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-bold text-white">
                      {selectedPin.title}
                    </h2>
                    <span className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800/90 px-2 py-0.5 text-[11px] font-medium text-slate-300">
                      <MapPin className="h-3 w-3 text-cyan-400" />
                      {selectedPin.x.toFixed(1)}%, {selectedPin.y.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {t.app.canvas.recallModeNotice}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeRecallModal}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
                aria-label="Close Active Recall modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body: Pre-Submission Retrieval OR Post-Submission Evaluation */}
            {!evalResult ? (
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="space-y-2">
                  <label
                    htmlFor="active-recall-textarea"
                    className="block text-sm font-semibold text-slate-100"
                  >
                    {t.app.exam.questionObject}
                  </label>
                  <p className="text-xs text-slate-400">
                    <span className="font-semibold text-cyan-300">
                      “{selectedPin.title}”
                    </span>
                  </p>
                  <textarea
                    id="active-recall-textarea"
                    ref={textareaRef}
                    rows={5}
                    value={userRecallText}
                    onChange={(e) => setUserRecallText(e.target.value)}
                    onKeyDown={handleTextareaKeyDown}
                    disabled={isSubmitting}
                    placeholder={t.app.pinModal.fieldNotesPlaceholder}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/90 p-4 text-sm text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none"
                  />
                </div>

                {errorMsg && (
                  <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-300">
                    {errorMsg}
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 border-t border-slate-800 pt-4">
                  <span className="text-[11px] text-slate-500">
                    <kbd className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-slate-300">
                      Ctrl + Enter
                    </kbd>
                  </span>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={closeRecallModal}
                      disabled={isSubmitting}
                      className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
                    >
                      {t.app.pinModal.btnCancel}
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !userRecallText.trim()}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-indigo-500/20 hover:from-indigo-400 hover:to-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>{t.app.exam.optionSubmit}...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5" />
                          <span>{t.app.exam.optionSubmit}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              /* Post-Submission Evaluation View (Safe to reveal targetConcept & notes) */
              <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                {/* Score Gauge + Status Badge + Feedback Header */}
                <div className="flex flex-col sm:flex-row items-center gap-5 rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
                  {/* Animated Circular Score Gauge */}
                  <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
                    <svg className="h-24 w-24 -rotate-90 transform" viewBox="0 0 96 96">
                      <circle
                        cx="48"
                        cy="48"
                        r="38"
                        fill="transparent"
                        stroke="#1e293b"
                        strokeWidth="8"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="38"
                        fill="transparent"
                        stroke={getStatusLabel(evalResult.status).stroke}
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className="transition-all duration-150"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-extrabold text-white">
                        {displayScore}
                      </span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        / 100
                      </span>
                    </div>
                  </div>

                  {/* Status Badge & Pedagogical Feedback */}
                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      {(() => {
                        const { label, Icon } = getStatusLabel(evalResult.status);
                        return (
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold tracking-wide ${getStatusBadgeClasses(
                              evalResult.status
                            )}`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            <span>{label}</span>
                          </span>
                        );
                      })()}
                    </div>
                    <p className="text-sm font-medium text-slate-100 leading-relaxed">
                      {evalResult.feedback}
                    </p>
                    {evalResult.suggestedImprovement && (
                      <div className="flex items-start gap-2 rounded-xl border border-indigo-500/30 bg-indigo-950/30 px-3 py-2 text-xs text-indigo-200">
                        <Sparkles className="h-4 w-4 shrink-0 text-cyan-400 mt-0.5" />
                        <span>{evalResult.suggestedImprovement}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Side-by-Side Comparison Cards: "Your Retrieval" vs "Target Concept & Notes" */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Your Retrieval Card */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-2">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Your Retrieval
                    </span>
                    <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {userRecallText}
                    </p>
                  </div>

                  {/* Target Concept & Notes Card */}
                  <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/15 p-4 space-y-2">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                      Target Concept &amp; Notes
                    </span>
                    <h4 className="text-sm font-bold text-white">
                      {selectedPin.concept}
                    </h4>
                    {selectedPin.detailedNotes && (
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {selectedPin.detailedNotes}
                      </p>
                    )}
                    {selectedPin.mnemonicVisual && (
                      <p className="pt-2 border-t border-slate-800/80 text-[11px] italic text-cyan-200/90">
                        Mnemonic: “{selectedPin.mnemonicVisual}”
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Footer */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4">
                  <button
                    type="button"
                    onClick={handleTryAgain}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/90 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>{t.app.exam.btnRestartExam}</span>
                  </button>

                  <div className="flex items-center gap-2.5">
                    {nextUntestedPin && (
                      <button
                        type="button"
                        onClick={handleNextUntested}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-lg shadow-indigo-500/20 hover:from-indigo-400 hover:to-cyan-400 transition"
                      >
                        <span>{nextUntestedPin.title}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={closeRecallModal}
                      className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
                    >
                      {t.app.pinModal.btnCancel}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
