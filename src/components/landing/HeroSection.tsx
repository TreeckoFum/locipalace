'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Brain,
  ArrowRight,
  CheckCircle2,
  RotateCcw,
  Quote,
  Zap,
  ShieldAlert,
  BookOpen,
  Award,
} from 'lucide-react';
import { getTranslations } from '@/lib/translations';

interface HeroSectionProps {
  locale: string;
}

export default function HeroSection({ locale }: HeroSectionProps) {
  const t = getTranslations(locale);

  const [demoStep, setDemoStep] = useState<1 | 2 | 3 | 4>(1);
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null);
  const [pjAvatarError, setPjAvatarError] = useState(false);
  const [ciceroAvatarError, setCiceroAvatarError] = useState(false);

  const resetDemo = () => {
    setDemoStep(1);
    setQuizAnswer(null);
  };

  return (
    <section className="relative overflow-hidden bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Ambient Widescreen Backdrop Glows */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 left-1/4 h-[560px] w-[760px] rounded-full bg-gradient-to-tr from-indigo-600/20 via-violet-600/15 to-cyan-500/10 blur-[150px]" />
        <div className="absolute top-28 right-12 h-[460px] w-[520px] rounded-full bg-cyan-500/10 blur-[140px]" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 h-[420px] w-[900px] rounded-full bg-indigo-900/15 blur-[160px]" />
      </div>

      {/* ===================================================================== */}
      {/* 1. EXPANSIVE DESKTOP HERO & 50/50 OPTICAL BALANCE                     */}
      {/* ===================================================================== */}
      <div className="w-full max-w-[1520px] mx-auto px-6 sm:px-10 lg:px-16 2xl:px-20 pt-10 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* LEFT COLUMN (lg:col-span-7 xl:col-span-7) */}
          <div className="lg:col-span-7 xl:col-span-7 text-left space-y-6">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-indigo-300 backdrop-blur-md"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              <span>{t.landing.badge}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="text-4xl font-extrabold tracking-tight sm:text-5xl xl:text-6xl sm:leading-[1.12]"
            >
              {t.landing.headlinePrefix}
              <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-cyan-300 bg-clip-text text-transparent">
                {t.landing.headlineHighlight}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
              className="max-w-3xl text-base leading-relaxed text-slate-300 sm:text-lg xl:text-xl"
            >
              {t.landing.subtitle}
            </motion.p>

            {/* CTA Button Row */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24 }}
              className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4"
            >
              <Link
                href={`/${locale}/app`}
                className="group inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-8 py-4 text-sm sm:text-base font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.01] hover:shadow-indigo-500/40"
              >
                <Brain className="h-5 w-5 transition-transform group-hover:rotate-12" />
                <span>{t.landing.ctaPrimary}</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <a
                href="#experimento"
                onClick={() => resetDemo()}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-6 py-4 text-sm sm:text-base font-semibold text-slate-300 backdrop-blur-md transition-colors hover:border-slate-700 hover:bg-slate-800 hover:text-white"
              >
                <Zap className="h-4 w-4 text-amber-400" />
                <span>{t.landing.ctaSecondary}</span>
              </a>
            </motion.div>

            {/* Trust Badges */}
            <div className="pt-3 flex flex-wrap items-center gap-x-8 gap-y-2.5 text-xs sm:text-sm font-medium text-slate-400">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{t.landing.badgeOpos}</span>
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{t.landing.badgeFree}</span>
              </span>
            </div>
          </div>

          {/* RIGHT COLUMN (lg:col-span-5 xl:col-span-5): Live 15s Eureka Micro-Widget */}
          <motion.div
            id="experimento"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="lg:col-span-5 xl:col-span-5 scroll-mt-24"
          >
            <div className="rounded-3xl border border-indigo-500/30 bg-slate-900/70 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl shadow-indigo-950/40">
              {/* Clean Card Header (No duplicate badge) */}
              <div className="flex items-center justify-between gap-4 border-b border-slate-800/90 pb-4">
                <h2 className="text-base sm:text-lg font-bold text-white leading-snug">
                  {t.landing.widgetTitle}
                </h2>
                <span className="shrink-0 rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-1 text-xs font-mono font-semibold text-cyan-400">
                  {t.landing.widgetStepLabel.replace('{step}', String(demoStep))}
                </span>
              </div>

              {/* Interactive Step Progress Indicator */}
              <div className="mt-4 flex items-center gap-2">
                {[1, 2, 3, 4].map((step) => (
                  <button
                    key={step}
                    type="button"
                    onClick={() => {
                      setDemoStep(step as 1 | 2 | 3 | 4);
                      if (step !== 4) setQuizAnswer(null);
                    }}
                    aria-label={t.landing.widgetStepLabel.replace(
                      '{step}',
                      String(step)
                    )}
                    className={`h-1.5 flex-1 rounded-full transition-all ${
                      demoStep === step
                        ? 'bg-gradient-to-r from-indigo-400 to-cyan-400'
                        : demoStep > step
                        ? 'bg-indigo-500/45'
                        : 'bg-slate-800'
                    }`}
                  />
                ))}
              </div>

              {/* Balanced Step Container */}
              <div className="mt-6 min-h-[280px] flex flex-col justify-between">
                <AnimatePresence mode="wait">
                  {demoStep === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex flex-col justify-between flex-1 space-y-5"
                    >
                      <div className="space-y-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                          {t.landing.widgetStep1Badge}
                        </span>
                        <h3 className="text-lg sm:text-xl font-bold text-white">
                          {t.landing.widgetStep1Title}
                        </h3>
                        <p className="text-xs sm:text-sm leading-relaxed text-slate-300">
                          {t.landing.widgetStep1Desc}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-950/75 p-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-3xl">
                          ☕
                        </div>
                        <div className="text-left">
                          <p className="font-mono text-xs sm:text-sm font-bold text-indigo-300">
                            {t.landing.widgetStep1AnchorName}
                          </p>
                          <p className="text-xs text-slate-400">
                            {t.landing.widgetStep1AnchorSub}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setDemoStep(2)}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-xs sm:text-sm font-bold text-white transition hover:bg-indigo-500"
                      >
                        <span>{t.landing.widgetStep1NextBtn}</span>
                      </button>
                    </motion.div>
                  )}

                  {demoStep === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex flex-col justify-between flex-1 space-y-4"
                    >
                      <div className="space-y-2.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                          {t.landing.widgetStep2Badge}
                        </span>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="text-lg sm:text-xl font-bold text-white">
                            {t.landing.widgetStep2Title}
                          </h3>
                          <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
                            {t.landing.widgetStep2TargetBadge}
                          </span>
                        </div>
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5 text-xs sm:text-sm italic text-slate-200 leading-relaxed">
                          <BookOpen className="inline h-4 w-4 text-indigo-400 mr-1.5 -mt-0.5" />
                          {t.landing.widgetStep2Desc}
                        </div>
                        <p className="text-xs text-rose-300/90">
                          {t.landing.widgetStep2Warning}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setDemoStep(3)}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3.5 text-xs sm:text-sm font-bold text-white shadow-md transition hover:opacity-95"
                      >
                        <span>{t.landing.widgetStep2NextBtn}</span>
                      </button>
                    </motion.div>
                  )}

                  {demoStep === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex flex-col justify-between flex-1 space-y-4"
                    >
                      <div className="space-y-2.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                          {t.landing.widgetStep3Badge}
                        </span>
                        <h3 className="text-lg sm:text-xl font-bold text-white">
                          {t.landing.widgetStep3Title}
                        </h3>
                        <div className="rounded-2xl border border-violet-500/40 bg-violet-950/30 p-4 text-xs sm:text-sm leading-relaxed text-violet-100">
                          {t.landing.widgetStep3Desc}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 rounded-xl border border-violet-500/30 bg-slate-950/75 px-4 py-3">
                        <span className="text-2xl">⚖️☕</span>
                        <span className="text-xs font-mono font-semibold text-violet-300">
                          {t.landing.widgetStep3VisualLabel}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setDemoStep(4)}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-5 py-3.5 text-xs sm:text-sm font-bold text-white transition hover:opacity-95"
                      >
                        <span>{t.landing.widgetStep3NextBtn}</span>
                      </button>
                    </motion.div>
                  )}

                  {demoStep === 4 && (
                    <motion.div
                      key="step4"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex flex-col justify-between flex-1 space-y-4"
                    >
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                          {t.landing.widgetStep4Badge}
                        </span>
                        <h3 className="mt-1 text-base sm:text-lg font-bold text-white">
                          {t.landing.widgetStep4Title}
                        </h3>
                        <p className="mt-1 text-xs text-slate-400">
                          {t.landing.widgetStep4Subtitle}
                        </p>
                      </div>

                      <div className="space-y-2.5">
                        <button
                          type="button"
                          onClick={() => setQuizAnswer('correct')}
                          className={`w-full rounded-xl border px-4 py-3 text-left text-xs font-bold transition-all ${
                            quizAnswer === 'correct'
                              ? 'border-emerald-500 bg-emerald-500/20 text-emerald-200'
                              : 'border-slate-800 bg-slate-950/80 text-slate-200 hover:border-slate-700'
                          }`}
                        >
                          {t.landing.widgetStep4OptA}
                        </button>
                        <button
                          type="button"
                          onClick={() => setQuizAnswer('wrong')}
                          className={`w-full rounded-xl border px-4 py-3 text-left text-xs font-bold transition-all ${
                            quizAnswer === 'wrong'
                              ? 'border-rose-500 bg-rose-500/20 text-rose-200'
                              : 'border-slate-800 bg-slate-950/80 text-slate-200 hover:border-slate-700'
                          }`}
                        >
                          {t.landing.widgetStep4OptB}
                        </button>
                      </div>

                      {quizAnswer === 'correct' && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-3.5 text-emerald-200 space-y-2"
                        >
                          <p className="text-xs font-bold">
                            {t.landing.widgetStep4SuccessTitle}
                          </p>
                          <p className="text-[11px] text-emerald-300/80">
                            {t.landing.widgetStep4SuccessDesc}
                          </p>
                          <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                            <Link
                              href={`/${locale}/app`}
                              className="rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
                            >
                              {t.landing.widgetStep4CtaBtn}
                            </Link>
                            <button
                              type="button"
                              onClick={resetDemo}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-white"
                            >
                              <RotateCcw className="h-3 w-3" />
                              <span>{t.landing.widgetStep4RetryBtn}</span>
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {quizAnswer === 'wrong' && (
                        <p className="rounded-xl border border-rose-500/30 bg-rose-950/30 px-3.5 py-2.5 text-xs text-rose-300">
                          {t.landing.widgetStep4ErrorMsg}
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. FULL-BLEED HORIZONTAL BAND FOR QUOTES (PATRICK JANE & CICERO)      */}
      {/* ===================================================================== */}
      <div className="w-full border-y border-slate-800/80 bg-slate-900/30 py-20 my-16 backdrop-blur-sm relative overflow-hidden">
        <div className="w-full max-w-[1520px] mx-auto px-6 sm:px-10 lg:px-16 2xl:px-20">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-block rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3.5 py-1 text-xs font-bold tracking-widest text-indigo-400 uppercase">
              {t.landing.quotesPre}
            </span>
            <h2 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">
              {t.landing.quotesTitle}
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-400">
              {t.landing.quotesSubtitle}
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
            {/* Patrick Jane Authority Card */}
            <div className="relative overflow-hidden rounded-3xl border border-indigo-500/25 bg-gradient-to-br from-indigo-950/40 via-slate-900/90 to-slate-950 p-8 sm:p-10 shadow-2xl flex flex-col justify-between">
              <Quote className="absolute top-7 right-7 h-10 w-10 text-indigo-400/20" />

              <div>
                <div className="flex items-center gap-4">
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden shrink-0 border-2 border-indigo-500/40 shadow-md shadow-indigo-500/20 bg-slate-900 flex items-center justify-center font-serif text-xl font-bold text-indigo-300">
                    {!pjAvatarError ? (
                      <img
                        src="/images/avatars/patrick-jane.webp"
                        alt="Patrick Jane"
                        onError={() => setPjAvatarError(true)}
                        className="w-full h-full object-cover object-top grayscale contrast-115 brightness-95 hover:grayscale-0 transition-all duration-300"
                      />
                    ) : (
                      <span>PJ</span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white">
                      Patrick Jane
                    </h3>
                    <p className="text-xs sm:text-sm font-medium text-indigo-300">
                      {t.landing.pjRole}
                    </p>
                  </div>
                </div>

                <blockquote className="mt-6 border-l-2 border-indigo-500/50 pl-5 text-sm sm:text-base leading-relaxed text-slate-200 italic">
                  {t.landing.pjQuote}
                </blockquote>
              </div>

              <div className="mt-8 inline-flex items-center gap-2 self-start rounded-xl border border-indigo-500/25 bg-slate-950/80 px-4 py-2.5 text-xs font-semibold text-indigo-200">
                <Award className="h-4 w-4 text-indigo-400 shrink-0" />
                <span>{t.landing.pjTag}</span>
              </div>
            </div>

            {/* Cicero Authority Card */}
            <div className="relative overflow-hidden rounded-3xl border border-cyan-500/25 bg-gradient-to-br from-cyan-950/40 via-slate-900/90 to-slate-950 p-8 sm:p-10 shadow-2xl flex flex-col justify-between">
              <Quote className="absolute top-7 right-7 h-10 w-10 text-cyan-400/20" />

              <div>
                <div className="flex items-center gap-4">
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden shrink-0 border-2 border-cyan-500/40 shadow-md shadow-cyan-500/20 bg-slate-900 flex items-center justify-center font-serif text-xl font-bold text-cyan-300">
                    {!ciceroAvatarError ? (
                      <img
                        src="/images/avatars/cicero.jpg"
                        alt="Marcus Tullius Cicero"
                        onError={() => setCiceroAvatarError(true)}
                        className="w-full h-full object-cover object-center grayscale contrast-115 brightness-90 hover:grayscale-0 transition-all duration-300"
                      />
                    ) : (
                      <span>MC</span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white">
                      Marcus Tullius Cicero
                    </h3>
                    <p className="text-xs sm:text-sm font-medium text-cyan-300">
                      {t.landing.ciceroRole}
                    </p>
                  </div>
                </div>

                <blockquote className="mt-6 border-l-2 border-cyan-500/50 pl-5 text-sm sm:text-base leading-relaxed text-slate-200 italic">
                  {t.landing.ciceroQuote}
                </blockquote>
              </div>

              <div className="mt-8 inline-flex items-center gap-2 self-start rounded-xl border border-cyan-500/25 bg-slate-950/80 px-4 py-2.5 text-xs font-semibold text-cyan-200">
                <Award className="h-4 w-4 text-cyan-400 shrink-0" />
                <span>{t.landing.ciceroTag}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. EXPANSIVE 3-COLUMN AUDIENCE CARDS                                  */}
      {/* ===================================================================== */}
      <div className="w-full max-w-[1520px] mx-auto px-6 sm:px-10 lg:px-16 2xl:px-20 pb-28 pt-4">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-2xl font-extrabold text-white sm:text-3xl lg:text-4xl">
            {t.landing.audTitle}
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Opositores */}
          <div className="group rounded-3xl border border-slate-800 bg-slate-900/60 p-8 transition-all hover:border-amber-500/40 hover:bg-slate-900/90 hover:shadow-2xl">
            <div className="flex h-13 w-13 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-400 transition-transform group-hover:scale-105 w-fit">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h3 className="mt-6 text-xl font-bold text-white">
              {t.landing.aud1Title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              {t.landing.aud1Desc}
            </p>
          </div>

          {/* Card 2: Estudiantes de Grado */}
          <div className="group rounded-3xl border border-slate-800 bg-slate-900/60 p-8 transition-all hover:border-indigo-500/40 hover:bg-slate-900/90 hover:shadow-2xl">
            <div className="flex h-13 w-13 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-3 text-indigo-400 transition-transform group-hover:scale-105 w-fit">
              <Brain className="h-6 w-6" />
            </div>
            <h3 className="mt-6 text-xl font-bold text-white">
              {t.landing.aud2Title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              {t.landing.aud2Desc}
            </p>
          </div>

          {/* Card 3: Mentes Profesionales */}
          <div className="group rounded-3xl border border-slate-800 bg-slate-900/60 p-8 transition-all hover:border-cyan-500/40 hover:bg-slate-900/90 hover:shadow-2xl">
            <div className="flex h-13 w-13 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-cyan-400 transition-transform group-hover:scale-105 w-fit">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="mt-6 text-xl font-bold text-white">
              {t.landing.aud3Title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              {t.landing.aud3Desc}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
