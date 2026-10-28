'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  History,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Calendar,
  Award,
} from 'lucide-react';
import { useLocale } from 'next-intl';
import { usePalaceStore } from '@/store/usePalaceStore';
import { getTranslations } from '@/lib/translations';
import type { Locale } from '@/types/palace';

export function ExamHistoryDrawer() {
  const locale = useLocale() as Locale;
  const t = getTranslations(locale);
  const examT = t.app.exam;

  const { examHistory, isExamHistoryOpen, toggleExamHistoryDrawer } =
    usePalaceStore();

  const [expandedAttemptId, setExpandedAttemptId] = useState<string | null>(
    examHistory[0]?.id ?? null
  );

  if (!isExamHistoryOpen) {
    return null;
  }

  const formatDate = (iso: string) => {
    try {
      return new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  };

  return (
    <AnimatePresence>
      {isExamHistoryOpen && (
        <div className="fixed inset-0 z-[80] flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => toggleExamHistoryDrawer(false)}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
          />

          {/* Slide-over Audit Drawer */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="relative z-10 flex h-full w-full max-w-3xl flex-col border-l border-slate-800 bg-slate-900 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-500/15 text-indigo-400">
                  <History className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-white">
                    {examT.historyTitle}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {examT.historySubtitle}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => toggleExamHistoryDrawer(false)}
                className="rounded-xl border border-slate-800 bg-slate-950 p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {examHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/50 py-16 text-center space-y-2">
                  <Award className="h-8 w-8 text-slate-600" />
                  <p className="text-sm font-semibold text-slate-400">
                    {examT.noHistory}
                  </p>
                </div>
              ) : (
                examHistory.map((attempt, idx) => {
                  const isExpanded = expandedAttemptId === attempt.id;
                  const attemptNum = examHistory.length - idx;
                  const scoreColor =
                    attempt.finalScore >= 80
                      ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                      : attempt.finalScore >= 50
                      ? 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                      : 'border-rose-500/40 bg-rose-500/15 text-rose-300';

                  return (
                    <div
                      key={attempt.id}
                      className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70"
                    >
                      {/* Attempt Summary Header */}
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedAttemptId(isExpanded ? null : attempt.id)
                        }
                        className="w-full flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-left hover:bg-slate-900/80 transition"
                      >
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-indigo-400 shrink-0" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-slate-500 shrink-0" />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold text-white">
                                🏛️ {attempt.palaceName}
                              </span>
                              <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-indigo-300">
                                {examT.attemptLabel.replace(
                                  '{number}',
                                  String(attemptNum)
                                )}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(attempt.timestamp)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-xl border px-3 py-1 font-mono text-xs font-extrabold ${scoreColor}`}
                          >
                            {examT.totalRetention}: {attempt.finalScore}%
                          </span>
                        </div>
                      </button>

                      {/* Expanded Pin-by-Pin Audit Details */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-slate-800/80 bg-slate-900/40 p-5 space-y-5"
                          >
                            <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                              {examT.auditDetails} (
                              {attempt.pinsEvaluated.length})
                            </div>

                            {attempt.pinsEvaluated.map((pinRec, pIdx) => (
                              <div
                                key={`${attempt.id}_${pinRec.pinId}_${pIdx}`}
                                className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-4"
                              >
                                {/* Pin Title & Total Pin Score */}
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                                  <div>
                                    <span className="text-xs font-extrabold text-white">
                                      #{pIdx + 1} · 📍 {pinRec.anchorName}
                                    </span>
                                    <p className="text-xs font-semibold text-cyan-300">
                                      {pinRec.conceptTitle}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`rounded-lg border px-2.5 py-0.5 text-[10px] font-bold ${
                                        pinRec.phase1Passed
                                          ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                                          : 'border-rose-500/30 bg-rose-500/15 text-rose-300'
                                      }`}
                                    >
                                      {pinRec.phase1Passed
                                        ? examT.phase1PassedBadge
                                        : examT.phase1FailedBadge}
                                    </span>

                                    <span className="rounded-lg bg-indigo-500/20 border border-indigo-500/40 px-2.5 py-0.5 font-mono text-xs font-extrabold text-indigo-200">
                                      {pinRec.totalPinScore} / 100 pts
                                    </span>
                                  </div>
                                </div>

                                {/* Phase 2 Quiz Breakdown */}
                                {pinRec.phase2Questions.length > 0 && (
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                                      <span>{examT.quizScore}</span>
                                      <span className="font-mono text-indigo-300">
                                        {pinRec.phase2Score} / 40 pts
                                      </span>
                                    </div>
                                    <div className="space-y-2">
                                      {pinRec.phase2Questions.map((q, qIdx) => {
                                        const userOpt =
                                          typeof q.userSelectedIndex === 'number'
                                            ? q.options[q.userSelectedIndex]
                                            : '—';
                                        const correctOpt =
                                          q.options[q.correctOptionIndex];
                                        return (
                                          <div
                                            key={q.id || qIdx}
                                            className="rounded-xl border border-slate-800/90 bg-slate-900/70 p-3 text-xs space-y-1.5"
                                          >
                                            <p className="font-semibold text-slate-200">
                                              {qIdx + 1}. {q.question}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-3 text-[11px]">
                                              <span
                                                className={`inline-flex items-center gap-1 font-semibold ${
                                                  q.isCorrect
                                                    ? 'text-emerald-400'
                                                    : 'text-rose-400'
                                                }`}
                                              >
                                                {q.isCorrect ? (
                                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                                ) : (
                                                  <XCircle className="h-3.5 w-3.5" />
                                                )}
                                                {examT.yourAnswerLabel}:{' '}
                                                {userOpt}
                                              </span>

                                              {!q.isCorrect && (
                                                <span className="text-emerald-300">
                                                  ✓ {examT.correctAnswerLabel}:{' '}
                                                  {correctOpt}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* Phase 3 Side-by-Side Comparison: User Explanation vs Original Notes */}
                                <div className="space-y-2.5 pt-1">
                                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                                    <span>{examT.aiScore}</span>
                                    <span className="font-mono text-emerald-300">
                                      {pinRec.phase3Score} / 50 pts
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 space-y-1">
                                      <span className="block text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                                        {examT.userExplanationLabel}
                                      </span>
                                      <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                                        {pinRec.userExplanation || '—'}
                                      </p>
                                    </div>

                                    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3 space-y-1">
                                      <span className="block text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                                        {examT.originalNotesLabel}
                                      </span>
                                      <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                                        {pinRec.originalNotes || '—'}
                                      </p>
                                    </div>
                                  </div>

                                  {pinRec.aiFeedback && (
                                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3">
                                      <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                                        ✨ {examT.aiCritiqueLabel}
                                      </span>
                                      <p className="text-xs text-slate-200 mt-1 leading-relaxed whitespace-pre-line">
                                        {pinRec.aiFeedback}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              )}
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
